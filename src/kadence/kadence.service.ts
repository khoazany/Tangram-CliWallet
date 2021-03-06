import { Injectable } from '@nestjs/common';
import { Settings } from '../common/config/settings.service';
import { MessageEntity } from '../common/database/entities/message.entity';
import { Topic } from '../common/enums/topic.enum';
import { existsSync, writeFileSync, readFileSync } from 'fs';
import * as kadence from '@kadenceproject/kadence';
import * as level from 'level';
import * as bunyan from 'bunyan';
import * as RotatingLogStream from 'bunyan-rotating-file-stream';
import * as pem from 'pem';
import * as npid from 'npid';

import * as isrunning from 'is-running'
import { Vault } from '../vault/vault.service';

@Injectable()
export class Kadence {
    private node_: kadence.KademliaNode;
    private logger_: bunyan;

    constructor(
        private readonly settingsService: Settings,
        private readonly vaultService: Vault
    ) {
        this.create_logger();
        // this.self_signed_certificate();
        this.start_up();
    }

    async send(topic: Topic, messageEntity: MessageEntity): Promise<any> {
        const self = this;
        return new Promise((resolve, reject) => {
            for (const member of messageEntity.optional.members) {
                this.node_.send(
                    topic, [messageEntity.stringify()],
                    [
                        member['key'], {
                            hostname: member['hostname'],
                            port: member['port']
                        }
                    ],
                    (err, result) => {
                        if (err) {
                            self.logger_.error(err);
                            reject(err);
                        }
                        resolve(result);
                    }
                );
            }
        });
    }

    quasarPublish(topic: string, payload: Object): Promise<any> {
        return new Promise((resolve, reject) => {
            this.node_.quasarPublish(topic, JSON.stringify(payload), {}, () => {
                resolve();
            });
        });
    }

    private create_logger() {
        this.logger_ = bunyan.createLogger({
            name: 'kadence',
            streams: [
                {
                    stream: new RotatingLogStream({
                        path: this.settingsService.LogFilePath,
                        totalFiles: parseInt(this.settingsService.LogFileMaxBackCopies.toString()),
                        rotateExisting: true,
                        gzip: false
                    })
                },
                { stream: process.stdout }
            ],
            level: parseInt(this.settingsService.VerboseLoggingEnabled.toString()) ? 'debug' : 'info'
        });
    }

    private process_events() {
        const self = this;

        try {
            //  If the file exists, check if a process with that
            //  PID exists, if not remove it and continue.
            if (existsSync(this.settingsService.DaemonPidFilePath)) {
                let pid = parseInt(readFileSync(this.settingsService.DaemonPidFilePath, "utf-8"));

                if (!isrunning(pid)) {
                    self.logger_.warn(`Found existing PID file. However, no process with that ID was found... cleaning up before continuing.`);
                    npid.remove(this.settingsService.DaemonPidFilePath);
                }
            }

            npid.create(this.settingsService.DaemonPidFilePath).removeOnExit();
        } catch (err) {
            self.logger_.error('Failed to create PID file, is kadence already running?');
            process.exit(1);
        }
        // Shutdown children cleanly on exit
        process.on('exit', (code) => {
            self.killChildrenAndExit(self);
        });
        process.on('SIGTERM', () => {
            self.killChildrenAndExit(self);
        });
        process.on('SIGINT', () => {
            self.killChildrenAndExit(self);
        });
        process.on('uncaughtException', (err) => {
            npid.remove(this.settingsService.DaemonPidFilePath);
            self.logger_.error(err.message);
            self.logger_.debug(err.stack);
            process.exit(1);
        });
        process.on('unhandledRejection', (err) => {
            npid.remove(this.settingsService.DaemonPidFilePath);
            self.logger_.error(err.message);
            self.logger_.debug(err.stack);
            process.exit(1);
        });
    }

    private async start_up() {
        const transport = new kadence.HTTPTransport();

        this.process_events();

        this.node_ = new kadence.KademliaNode({
            identity: kadence.utils.getRandomKeyBuffer(), // Buffer.from(this.settingsService.Identity, 'hex'),
            transport: transport,
            storage: level(this.settingsService.EmbeddedDatabaseDirectory),
            contact: { hostname: this.settingsService.NodePublicAddress, port: this.settingsService.NodePublicPort }
        });

        this.add_plugins();
        this.bandwidth_enabled();
        this.onion_enabled();
        this.nat_enabled();
        this.routing();

        this.node_.on('error', (err) => {
            this.logger_.error(err.message.toLowerCase());
        });

        this.verbose_enabled();

        this.node_.listen(this.settingsService.NodeListenPort, async () => {
            this.logger_.info(`Kadence listening on port: ${this.node_.contact.port} hostname: ${this.node_.contact.hostname}`);
            this.logger_.info(`Kadence identity: ${this.node_.identity.toString('hex')}`);
            this.settingsService.Identity = this.node_.identity.toString('hex');
            this.settingsService.OnionAddress = this.node_.contact.hostname;

            await this.vaultService.init()

            try {
                this.settingsService.TorPID = this.node_.onion.tor.process.pid;
            } catch (error) { }
        });
    }

    private verbose_enabled() {
        if (!!parseInt(this.settingsService.VerboseLoggingEnabled.toString())) {
            this.node_.rpc.deserializer.append(new kadence.logger.IncomingMessage(this.logger_));
            this.node_.rpc.serializer.prepend(new kadence.logger.OutgoingMessage(this.logger_));
        }
    }

    private nat_enabled() {
        if (!!parseInt(this.settingsService.TraverseNatEnabled.toString())) {
            this.node_.traverse = this.node_.plugin(kadence.traverse([
                new kadence.traverse.UPNPStrategy({
                    mappingTtl: parseInt(this.settingsService.TraversePortForwardTTL.toString()),
                    publicPort: parseInt(this.node_.contact.port)
                }),
                new kadence.traverse.NATPMPStrategy({
                    mappingTtl: parseInt(this.settingsService.TraversePortForwardTTL.toString()),
                    publicPort: parseInt(this.node_.contact.port)
                }),
                new kadence.traverse.ReverseTunnelStrategy({
                    remoteAddress: this.settingsService.TraverseReverseTunnelHostname,
                    remotePort: parseInt(this.settingsService.TraverseReverseTunnelPort.toString()),
                    privateKey: this.node_.spartacus.privateKey,
                    secureLocalConnection: true,
                    verboseLogging: parseInt(this.settingsService.VerboseLoggingEnabled.toString())
                })
            ]));
        }
    }

    private bandwidth_enabled() {
        if (!!parseInt(this.settingsService.BandwidthAccountingEnabled.toString())) {
            this.node_.hibernate = this.node_.plugin(kadence.hibernate({
                limit: this.settingsService.BandwidthAccountingMax,
                interval: this.settingsService.BandwidthAccountingReset,
                reject: ['FIND_VALUE', 'STORE']
            }));
        }
    }

    private onion_enabled() {
        if (!!parseInt(this.settingsService.OnionEnabled.toString())) {
            kadence.constants.T_RESPONSETIMEOUT = 60000;
            this.node_.onion = this.node_.plugin(kadence.onion({
                dataDirectory: this.settingsService.OnionHiddenServiceDirectory,
                virtualPort: parseInt(this.settingsService.OnionVirtualPort.toString()),
                localMapping: `127.0.0.1:${parseInt(this.settingsService.NodeListenPort.toString())}`,
                torrcEntries: {
                    CircuitBuildTimeout: 10,
                    KeepalivePeriod: 60,
                    NewCircuitPeriod: 60,
                    NumEntryGuards: 8,
                    SocksPort: this.settingsService.OnionSocksPort,
                    Log: `${this.settingsService.OnionLoggingVerbosity} stdout`
                },
                passthroughLoggingEnabled: !!parseInt(this.settingsService.OnionLoggingEnabled.toString())
            }));
        }
    }

    private add_plugins() {
        this.node_.quasar = this.node_.plugin(kadence.quasar());
    }

    private routing() {
        this.node_.use((request, response, next) => {
            let [identityString] = request.contact;

            next();
        });
    }

    private self_signed_certificate(): void {
        const self = this;
        if (!existsSync(self.settingsService.SSLKeyPath)) {
            pem.createCertificate({
                days: 365,
                selfSigned: true
            }, (err, keys) => {
                if (err) {
                    throw new Error(err);
                }
                if (!existsSync(self.settingsService.SSLCertificatePath) && !existsSync(self.settingsService.SSLKeyPath)) {
                    self.logger_.info(`Creating Kadence certificate service key: ${self.settingsService.SSLKeyPath}`);
                    writeFileSync(self.settingsService.SSLKeyPath, keys.serviceKey);
                    self.logger_.info(`Creating Kadence certificate: ${self.settingsService.SSLCertificatePath}`);
                    writeFileSync(self.settingsService.SSLCertificatePath, keys.certificate);
                }
                self.start_up();
            });
        }
        else {
            self.logger_.info('Kadence certificate found!');
            self.start_up();
        }
    }

    private killChildrenAndExit(kad: Kadence) {
        kad.logger_.info('exiting, killing child services, cleaning up');
        npid.remove(kad.settingsService.DaemonPidFilePath);

        this.vaultService.kill();

        process.removeListener('exit', kad.killChildrenAndExit);
        process.kill(parseInt(kad.settingsService.TorPID.toString()));
        process.exit(0);
    }
}