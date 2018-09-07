import { Injectable } from '@nestjs/common';
import * as HashiVault from 'node-vault';
import { Settings } from '../common/config/settings.service';

import { spawn, ChildProcess } from 'child_process'
import { join } from 'path';
import { homedir } from 'os';
import { writeFileSync } from 'fs';

process.env.DEBUG = 'node-vault'; // switch on debug mode

const TANGRAM_DEFAULT_DIR = join(homedir(), '.tangramcli');

//  TODO: Move this to settings
const NUM_SECRETS = 5;
const SECRET_THRESHOLD = 2;

@Injectable()
export class Vault {
  private hashiVault_: HashiVault.client;
  private vault_process_: ChildProcess;

  constructor(private readonly settings: Settings) {
    this.vault_process_ = spawn('vault', ['server', '-config', 'vault.json'], {
      cwd: TANGRAM_DEFAULT_DIR
    });

    //this.vault_process_.stdout.on('data', (data) => {
    //  console.log(`Vault Server: ${data}`);
    //});

    this.hashiVault_ = HashiVault();
    this.hashiVault_.apiVersion = settings.ApiVersion;
    this.hashiVault_.endpoint = settings.Endpoint;
    this.hashiVault_.token = settings.Token == '' ? undefined : settings.Token;

    this.init();
  }

  public init() {
    this.hashiVault_.initialized()
      .then((result) => {
        return this.hashiVault_.init({ secret_shares: NUM_SECRETS, secret_threshold: SECRET_THRESHOLD });
      })
      .then((result) => {
        this.hashiVault_.token = result.root_token;
        const key = result.keys[0];

        console.log()
        console.log()
        //  TODO: Make share and threshold configurable.
        console.log("###########################################################");
        console.log("#                   !!! ATTENTION !!!                     #");
        console.log("###########################################################");
        console.log("    We noticed this is the FIRST time you've started       ");
        console.log("    the Tangram wallet. Your wallet is encrypted in        ");
        console.log("    Vault using Shamir's secret sharing algorithm.         ");
        console.log("    Please store all of the following secrets in a safe    ");
        console.log("    place. When decrypting the vault you may use any       ");
        console.log("    1 of these keys. THESE ARE NOT RECOVERY KEYS.          ");
        console.log();
        for (let i = SECRET_THRESHOLD - 1; i < result.keys.length; i++) {
          console.log(`KEY ${i}: ${result.keys[i]}`)
        } 
        console.log();
        console.log("###########################################################");
        console.log("#                   !!! ATTENTION !!!                     #");
        console.log("###########################################################");
        console.log()
        console.log()

        writeFileSync(join(TANGRAM_DEFAULT_DIR, 'shard'), result.keys_base64[0]);

        return this.hashiVault_.unseal({ secret_shares: 1, key });
      })
      //.then(console.log)
      .catch((err) => console.error(err.message));
  }

  public policies() {
    return new Promise((resolve, reject) => {
      this.hashiVault_.policies()
        .then((result) => {
          console.log(result);
          return this.hashiVault_.addPolicy({
            name: 'tangrmpolicy',
            rules: '{ "path": { "secret/*": { "policy": "write" } } }',
          });
        })
        .then(() => this.hashiVault_.getPolicy({ name: 'tangrmpolicy' }))
        .then(this.hashiVault_.policies)
        .then((result) => {
          console.log(result);
          return this.hashiVault_.removePolicy({ name: 'tangrmpolicy' });
        })
        .catch((err) => console.error(err.message));
    });

  }

  public auth() {
    const mountPoint = 'userpass';
    const username = 'me';
    const password = 'foo';
    return new Promise((resolve, reject) => {
      this.hashiVault_.auths()
        .then((result) => {
          if (result.hasOwnProperty('userpass/')) return undefined;
          return this.hashiVault_.enableAuth({
            mount_point: mountPoint,
            type: 'userpass',
            description: 'userpass auth',
          });
        })
        .then(() => this.hashiVault_.write(`auth/userpass/users/${username}`, { password, policies: 'root' }))
        .then(() => this.hashiVault_.userpassLogin({ username, password }))
        .then(console.log)
        .catch((err) => console.error(err.message));
    });

  }

  private token() {
    return new Promise((resolve, reject) => {
      this.hashiVault_.tokenCreate()
        .then((result) => {
          console.log(result);
          const newToken = result.auth;
          return this.hashiVault_.tokenLookup({ token: newToken.client_token })
            .then(() => this.hashiVault_.tokenLookupAccessor({ accessor: newToken.accessor }));
        })
        .then((result) => {
          console.log(result);
        })
        .catch((err) => console.error(err.message));
    });

  }
}