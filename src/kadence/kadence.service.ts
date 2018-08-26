import { Injectable } from '@nestjs/common';
import { Settings } from '../common/config/settings.service';
import { MessageEntity } from '../common/database/entities/message.entity';
import { Topic } from '../common/enums/topic.enum';
import { SeedService } from './seed.service';
import { QuasarService } from './quasar.service';
import { join } from 'path';
import { existsSync, writeFileSync, readFileSync } from 'fs';
import * as kadence from '@kadenceproject/kadence';
import * as level from 'level';
import * as bunyan from 'bunyan';
import * as RotatingLogStream from 'bunyan-rotating-file-stream';
import * as pem from 'pem';
import * as npid from 'npid';

@Injectable()
export class Kadence {
    private node_: kadence.KademliaNode;
    private logger_: bunyan;

    constructor(
        private readonly settingsService: Settings,
        private readonly seedService: SeedService,
        private readonly quasarService: QuasarService
    ) {
        this.create_logger();
        this.self_signed_certificate();
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

    private async start_up() {
        const key = readFileSync(this.settingsService.SSLKeyPath);
        const cert = readFileSync(this.settingsService.SSLCertificatePath);
        const transport = new kadence.HTTPSTransport({ key, cert, ca: [] });

        this.node_ = new kadence.KademliaNode({
            identity: kadence.utils.getRandomKeyBuffer(), // Buffer.from(this.settingsService.Identity, 'hex'),
            transport: transport,
            storage: level(this.settingsService.EmbeddedDatabaseDirectory),
            contact: { hostname: this.settingsService.NodePublicAddress, port: this.settingsService.NodePublicPort }
        });

        this.node_.hashcash = this.node_.plugin(kadence.hashcash({
            methods: [
                Topic.EJECT,
                Topic.EVENT,
                Topic.LOCKSTEP,
                Topic.PUBLISH,
                Topic.QUERY,
                Topic.SEED,
                Topic.SUBSCRIBE
            ],
            difficulty: 8
        }));

        this.node_.quasar = this.node_.plugin(kadence.quasar());
        this.node_.eclipse = this.node_.plugin(kadence.eclipse());
        this.node_.spartacus = this.node_.plugin(kadence.spartacus());
        this.node_.permission = this.node_.plugin(kadence.permission({
            privateKey: this.node_.spartacus.privateKey,
            walletPath: this.settingsService.EmbeddedWalletDirectory
        }));

        if (!!parseInt(this.settingsService.BandwidthAccountingEnabled.toString())) {
            this.node_.hibernate = this.node_.plugin(kadence.hibernate({
                limit: this.settingsService.BandwidthAccountingMax,
                interval: this.settingsService.BandwidthAccountingReset,
                reject: ['FIND_VALUE', 'STORE']
            }));
        }

        if (!!parseInt(this.settingsService.OnionEnabled.toString())) {
            kadence.constants.T_RESPONSETIMEOUT = 20000;
            this.node_.onion = this.node_.plugin(kadence.onion({
                dataDirectory: this.settingsService.OnionHiddenServiceDirectory,
                virtualPort: parseInt(this.settingsService.OnionVirtualPort.toString()),
                localMapping: `127.0.0.1:${parseInt(this.settingsService.NodeListenPort.toString())}`,
                torrcEntries: {
                    CircuitBuildTimeout: 10,
                    KeepalivePeriod: 60,
                    NewCircuitPeriod: 60,
                    NumEntryGuards: 8,
                    Log: `${this.settingsService.OnionLoggingVerbosity} stdout`
                },
                passthroughLoggingEnabled: !!parseInt(this.settingsService.OnionLoggingEnabled.toString())
            }));
        }

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

        this.routing();

        this.node_.on('error', (err) => {
            this.logger_.error(err.message.toLowerCase());
        });

        if (!!parseInt(this.settingsService.VerboseLoggingEnabled.toString())) {
            this.node_.rpc.deserializer.append(new kadence.logger.IncomingMessage(this.logger_));
            this.node_.rpc.serializer.prepend(new kadence.logger.OutgoingMessage(this.logger_));
        }

        this.node_.listen(this.settingsService.NodeListenPort, () => {
            this.logger_.info(`Kadence listening on port: ${this.node_.contact.port} hostname: ${this.node_.contact.hostname}`);
            this.logger_.info(`Kadence identity: ${this.node_.identity.toString('hex')}`);
            this.logger_.info(`Kadence connected to ${this.node_.router.length} peers!`);

            this.settingsService.Identity = this.node_.identity.toString('hex');
        });
    }

    async send(topic: Topic, messageEntity: MessageEntity) {
        const self = this;
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
                    if (err) self.logger_.error(err);
                }
            );
        }
    }

    private routing() {
        this.node_.use((err, request, response, next) => {
            response.send({ error: err.message });
        });

        this.node_.use(Topic.SEED, this.seedService.handler);

        this.node_.quasarSubscribe([
            Topic.EJECT,
            Topic.EVENT,
            Topic.LOCKSTEP,
            Topic.QUERY
        ], this.quasarService.handler);
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
}