import { Injectable } from "@nestjs/common";
import { join } from 'path';
import { ISettings } from "./settings.interface";
import { existsSync, writeFileSync, readFileSync } from 'fs';
import { homedir } from 'os';
import * as R from 'ramda';
import * as kadence from '@kadenceproject/kadence';
import * as ini from 'ini';
import * as mkdirp from 'mkdirp';
import * as bunyan from 'bunyan';
import * as RotatingLogStream from 'bunyan-rotating-file-stream';

const KADENCE_DEFAULT_DIR = join(homedir(), '.kadencecli');
const TANGRAM_DEFAULT_DIR = join(homedir(), '.tangramcli');

let defaultSettings = {
    // Applications
    IP: '127.0.0.1',
    Port: 3000,

    // Lightning Memory-Mapped Database
    LMDBPath: join(TANGRAM_DEFAULT_DIR, 'tangram.db'),
    MDBPath: join(TANGRAM_DEFAULT_DIR, 'tangram.db/data.mdb'),
    DatabaseSize: parseInt('2147483648'),
    MaxDbs: parseInt('3'),

    // Process PID
    DaemonPidFilePath: join(KADENCE_DEFAULT_DIR, 'kadence.pid'),

    // Identity/Cryptography
    Identity: '',
    PrivateExtendedKeyPath: join(KADENCE_DEFAULT_DIR, 'kadence.prv'),
    ChildDerivationIndex: '0',

    // Database
    EmbeddedDatabaseDirectory: join(KADENCE_DEFAULT_DIR, 'kadence.dht'),
    EmbeddedPeerCachePath: join(KADENCE_DEFAULT_DIR, 'peercache'),
    EmbeddedWalletDirectory: join(KADENCE_DEFAULT_DIR, 'wallet.dat'),

    // Node Options
    NodePublicPort: '5274',
    NodeListenPort: '5274',
    NodePublicAddress: '127.0.0.1',
    NodeListenAddress: '0.0.0.0',

    // Onion Plugin
    OnionEnabled: '1',
    OnionVirtualPort: '443',
    OnionHiddenServiceDirectory: join(KADENCE_DEFAULT_DIR, 'kadence.onion/hidden_service'),
    OnionLoggingVerbosity: 'notice',
    OnionLoggingEnabled: '0',

    // Bandwidth Metering
    BandwidthAccountingEnabled: '0',
    BandwidthAccountingMax: '5GB',
    BandwidthAccountingReset: '24HR',

    // NAT Traversal
    TraverseNatEnabled: '0',
    TraversePortForwardTTL: '0',
    TraverseReverseTunnelHostname: 'tunnel.bookch.in',
    TraverseReverseTunnelPort: '8443',

    // SSL Certificate
    SSLCertificatePath: join(KADENCE_DEFAULT_DIR, 'kadence.crt'),
    SSLKeyPath: join(KADENCE_DEFAULT_DIR, 'kadence.key'),
    SSLAuthorityPaths: [

    ],

    // Network Bootstrapping
    NetworkBootstrapNodes: [

    ],

    // Debugging/Developer
    VerboseLoggingEnabled: '1',
    LogFilePath: join(KADENCE_DEFAULT_DIR, 'kadence.log'),
    LogFileMaxBackCopies: '3',
    TanLogFilePath: join(TANGRAM_DEFAULT_DIR, 'tangram.log'),

    // Local Control Protocol
    ControlPortEnabled: '0',
    ControlPort: '5275',
    ControlSockEnabled: '1',
    ControlSock: join(KADENCE_DEFAULT_DIR, 'kadence.sock'),

    // Enables the Test Mode (lowers difficulty)
    TestNetworkEnabled: '0',

    // Tor.real pid
    TorPID: '0',

    //Onion address
    OnionAddress: '',

    // Hashicorp Vault
    ApiVersion: 'v1', // default
    Endpoint: 'http://127.0.0.1:8200', // default
    Token: '1234', // optional client token; can be fetched after valid initialization of the server

    // Swagger API
    SwaggerEndpoint: 'http://127.0.0.1:8081',
    SwaggerApiKey: ''
}

@Injectable()
export class Settings implements ISettings {
    IP: string;
    Port: number;
    LMDBPath: string;
    MDBPath: string;
    DatabaseSize: number;
    MaxDbs: number;
    DaemonPidFilePath: string;
    Identity: string;
    PrivateExtendedKeyPath: string;
    ChildDerivationIndex: number;
    EmbeddedDatabaseDirectory: string;
    EmbeddedPeerCachePath: string;
    EmbeddedWalletDirectory: string;
    NodePublicPort: number;
    NodeListenPort: number;
    NodePublicAddress: string;
    NodeListenAddress: string;
    OnionEnabled: number;
    OnionVirtualPort: number;
    OnionHiddenServiceDirectory: string;
    OnionLoggingVerbosity: string;
    OnionLoggingEnabled: number;
    BandwidthAccountingEnabled: number;
    BandwidthAccountingMax: string;
    BandwidthAccountingReset: string;
    TraverseNatEnabled: number;
    TraversePortForwardTTL: number;
    TraverseReverseTunnelHostname: string;
    TraverseReverseTunnelPort: number;
    SSLCertificatePath: string;
    SSLKeyPath: string;
    SSLAuthorityPaths: string[];
    NetworkBootstrapNodes: any[];
    VerboseLoggingEnabled: number;
    LogFilePath: string;
    LogFileMaxBackCopies: number;
    TanLogFilePath: string;
    ControlPortEnabled: number;
    ControlPort: number;
    ControlSockEnabled: number;
    ControlSock: string;
    TestNetworkEnabled: number;
    TorPID: number;
    OnionAddress: string;
    ApiVersion: string;
    Endpoint: string;
    Token: string;
    SwaggerEndpoint: string;
    SwaggerApiKey: string;

    logger_: bunyan;

    constructor() {

        if (!existsSync(join(TANGRAM_DEFAULT_DIR, 'config'))) this.write_config(); else this.read_config();

        if (!existsSync(join(TANGRAM_DEFAULT_DIR, 'tangram.db')))
            mkdirp.sync(join(TANGRAM_DEFAULT_DIR, 'tangram.db'));

        if (!existsSync(join(KADENCE_DEFAULT_DIR, 'wallet.dat')))
            mkdirp.sync(join(KADENCE_DEFAULT_DIR, 'wallet.dat'));

        if (!existsSync(join(KADENCE_DEFAULT_DIR, 'kadence.dht')))
            mkdirp.sync(join(KADENCE_DEFAULT_DIR, 'kadence.dht'));

        if (!existsSync(join(KADENCE_DEFAULT_DIR, 'kadence.onion')))
            mkdirp.sync(join(KADENCE_DEFAULT_DIR, 'kadence.onion'));
    }

    private write_config(): void {
        defaultSettings.Identity = kadence.utils.getRandomKeyBuffer().toString('hex');
        mkdirp.sync(TANGRAM_DEFAULT_DIR);
        writeFileSync(join(TANGRAM_DEFAULT_DIR, 'config'), ini.stringify(defaultSettings));
        this.from_json(defaultSettings);
        this.create_logger();
        this.logger_.info(`Created default tangram directory ${join(TANGRAM_DEFAULT_DIR, 'config')}`);
    }

    private read_config(): void {
        mkdirp.sync(TANGRAM_DEFAULT_DIR);
        defaultSettings = ini.decode(readFileSync(join(TANGRAM_DEFAULT_DIR, 'config'), 'utf8'));
        this.from_json(defaultSettings);
        this.create_logger();
        this.logger_.info(`Found default tangram directory ${join(TANGRAM_DEFAULT_DIR, 'config')}`);
    }

    private create_logger() {
        this.logger_ = bunyan.createLogger({
            name: 'settings',
            streams: [
                {
                    stream: new RotatingLogStream({
                        path: this.TanLogFilePath,
                        totalFiles: parseInt(this.LogFileMaxBackCopies.toString()),
                        rotateExisting: true,
                        gzip: false
                    })
                },
                { stream: process.stdout }
            ],
            level: parseInt(this.VerboseLoggingEnabled.toString()) ? 'debug' : 'info'
        });
    }

    private from_json(data: any): void {
        R.forEachObjIndexed((value: any, key: any) => {
            this[key] = value;
        }, data);
    }

}