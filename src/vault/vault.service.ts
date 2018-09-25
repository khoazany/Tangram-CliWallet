import { Injectable } from '@nestjs/common';
import * as HashiVault from 'node-vault';
import { Settings } from '../common/config/settings.service';

import { ChildProcess } from 'child_process'
import { join } from 'path';
import { homedir } from 'os';
import { writeFileSync, readFileSync } from 'fs';

const spawn = require('await-spawn')

process.env.DEBUG = 'node-vault'; // switch on debug mode

const TANGRAM_DEFAULT_DIR = join(homedir(), '.tangramcli');
const VAULT_SHARD_PATH = join(TANGRAM_DEFAULT_DIR, 'shard');
const VAULT_SERVICE_TOKEN_PATH = join(TANGRAM_DEFAULT_DIR, 'vaultservicetoken');

//  TODO: Move this to settings
const NUM_SECRETS = 5;
const SECRET_THRESHOLD = 2;

@Injectable()
export class Vault {
  private hashiVault_: HashiVault.client;
  private vault_process_: ChildProcess;

  private root_token_: string;
  private service_token_: string;

  constructor(private readonly settings: Settings) {
    this.hashiVault_ = HashiVault();
    this.hashiVault_.apiVersion = settings.ApiVersion;
    this.hashiVault_.endpoint = settings.Endpoint;
    this.hashiVault_.token = settings.Token == '' ? undefined : settings.Token;

    this.root_token_ = undefined;
    this.service_token_ = undefined;
  }

  public async init() {
    this.vault_process_ = await spawn(join(TANGRAM_DEFAULT_DIR, 'vault'), ['server', '-config', 'vault.json'], {
      cwd: TANGRAM_DEFAULT_DIR
    }).child;

    setTimeout(async () => {
      await this.hashiVault_.initialized()
        .then((result) => {
          if (!result.initialized) {
            let key2 = '';
            return this.hashiVault_.init({ secret_shares: NUM_SECRETS, secret_threshold: SECRET_THRESHOLD })
              .then((result) => {
                this.hashiVault_.token = result.root_token;
                this.root_token_ = result.root_token;

                const key: string = result.keys[0];

                console.log()
                console.log()
                //  TODO: Make share and threshold configurable.
                console.log("###########################################################");
                console.log("#                   !!! ATTENTION !!!                     #");
                console.log("###########################################################");
                console.log("    We noticed this is the FIRST time you've started       ");
                console.log("    the Tangram wallet. Your wallet is encrypted in        ");
                console.log("    Vault using Shamir's secret sharing algorithm.         ");
                console.log("    Please store all of the following keys in a safe       ");
                console.log("    place. When unsealing the vault you may use any        ");
                console.log("    1 of these keys. THESE ARE NOT RECOVERY KEYS.          ");
                console.log();
                console.log();
                for (let i = SECRET_THRESHOLD - 1; i < result.keys.length; i++) {
                  console.log(`KEY ${i}: ${result.keys[i]}`)
                }
                console.log();
                console.log();
                console.log("    You will need to unseal the Vault everytime you        ");
                console.log("    launch the CLI Wallet.                                 ");
                console.log("    Please type `vault unseal` to unseal the Vault.        ");
                console.log("###########################################################");
                console.log("#                   !!! ATTENTION !!!                     #");
                console.log("###########################################################");
                console.log()
                console.log()

                let buff = Buffer.from(key)
                let shard = buff.toString('base64');

                key2 = result.keys[1];

                writeFileSync(VAULT_SHARD_PATH, shard);

                return this.hashiVault_.unseal({ secret_shares: 1, key: key });
              })
              .then((result) => {
                return this.hashiVault_.unseal({ secret_shares: 1, key: key2 });
              })
              .then((result) => {
                return this.createVaultServicePolicy();
              })
              .then((result) => {
                return this.createVaultServiceToken().then(
                  (result) => {
                    this.service_token_ = result.auth.client_token;
                    writeFileSync(VAULT_SERVICE_TOKEN_PATH, this.service_token_);
                  }
                );
              })
              .then((result) => {
                return this.createTemplatedWalletPolicy();
              })
              .then((result) => {
                return this.enableUserpassAuth();
              })
              .then((result) => {
                return this.revokeRootToken();
              })
              .catch((err) => {
                console.error("Vault Error: " + err.message)
              });
          } else {
            let shard64 = readFileSync(VAULT_SHARD_PATH, "utf-8");
            let buff = Buffer.from(shard64, 'base64');
            let shard = buff.toString('utf-8');

            return this.unsealVault(shard).then(() => {
              return new Promise<void>((resolve, reject) => {
                try {
                  this.service_token_ = readFileSync(VAULT_SERVICE_TOKEN_PATH, 'utf-8');
                  this.hashiVault_.token = this.service_token_;
                  resolve();
                }
                catch (e) {
                  reject(e);
                }
              });
            });
          }
        })
    }, 3000);
  }

  public unsealVault(key: string) {
    return this.hashiVault_.unseal({ secret_shares: 1, key: key })
      .then((result) => {
        if (result.sealed) {
          console.log();
          console.log();
          console.log(`    ${result.progress} out of ${result.t} unseal keys left`)
          console.log("    Please type `vault unseal` to finish unsealing the Vault.        ");
          console.log();
          console.log();
        } else {
          console.log("    Vault unsealed!")
        }
      })
      .catch(() => {
        console.log("Error in Vault unseal attempt. Did you type a bad key?");
      });
  }

  public enableUserpassAuth() {
    return this.hashiVault_.auths()
      .then((result) => {
        if (result.hasOwnProperty('userpass/')) return undefined;
        return this.hashiVault_.enableAuth({
          mount_point: 'userpass',
          type: 'userpass',
          description: 'userpass auth',
        });
      })
  }

  public createVaultServicePolicy() {
    console.log("Creating Vault Service Policy");
    const name = 'vaultservice';

    const policy = {
      "path": {
        "auth/userpass/users/*": {
          "capabilities": ["create", "list"]
        },
        "identity/*": {
          "capabilities": ["create", "update"]
        },
        "secret/wallets/*": {
          "capabilities": ["list"]
        },
        "secret/data/wallets/*": {
          "capabilities": ["list"]
        },
        "sys/auth": {
          "capabilities": ["read"]
        },
      }
    }

    let policy_string = JSON.stringify(policy);

    return this.hashiVault_.policies()
      .then((result) => {
        return this.hashiVault_.addPolicy({
          name: name,
          rules: policy_string,
        })
      });
  }

  public createVaultServiceToken() {
    console.log("Creating Vault Service Token");
    return this.hashiVault_.tokenCreateOrphan({
      'policies': ['vaultservice'],
    })
  }

  public revokeRootToken() {
    console.log("Revoking Root Token");
    return this.hashiVault_.tokenRevoke({ token: this.root_token_ })
      .then(() => {
        this.root_token_ = null;
        this.hashiVault_.token = this.service_token_;
      });
  }

  public createTemplatedWalletPolicy() {
    console.log("Creating Templated Wallet Policy");
    const name = "walletpolicy";

    const policy = {
      "path": {
        "secret/wallets/{{identity.entity.name}}/*": {
          "capabilities": ["create", "read", "update", "delete", "list"]
        },
        "secret/data/wallets/{{identity.entity.name}}/*": {
          "capabilities": ["create", "read", "update", "delete", "list"]
        },
      }
    }

    return this.hashiVault_.policies()
      .then((result) => {
        return this.hashiVault_.addPolicy({
          name: name,
          rules: JSON.stringify(policy)
        })
      });
  }

  private getUserPrivatePath(username: string) {
    return `secret/wallets/${username}`
  }

  public async createWalletUser(username: string, password: string): Promise<any> {
    return this.hashiVault_.write(`auth/userpass/users/${username}`, { password })
      .then(() => {
        return this.hashiVault_.auths()
          .then((result) => {
            let accessor = result.data['userpass/'].accessor;

            //  Create the Wallet Identity and attach the wallet policy.
            return this.hashiVault_.write('identity/entity', {
              name: `${username}`,
              policies: ['walletpolicy']
            })
              .then((result) => {
                let entityId = result.data.id

                //  Create an entity alias and tie it back to the user
                return this.hashiVault_.write('identity/entity-alias', {
                  name: username,
                  canonical_id: entityId,
                  mount_accessor: accessor
                })
              });
          })
      })
      .catch((err) => console.error(err.message));
  }

  public async saveWalletData(username: string, password: string, path: string, key: string, data: string): Promise<void> {
    return this.createWalletUser(username, password)
      .then((res) => {
        return this.hashiVault_.userpassLogin({ username, password });
      })
      .then((res) => {
        this.hashiVault_.token = res.auth.client_token;
        let path = join(this.getUserPrivatePath(username), 'wallet').replace(/\\/g, '/');

        let packed = {};
        packed[key] = JSON.stringify(data);

        return this.hashiVault_.write(path, packed);
      })
      .then(() => {
        this.hashiVault_.token = this.service_token_;
      })
      .catch((e) => {
        console.log("Error while attempting to save data in Vault");
        console.log(e);
        this.hashiVault_.token = this.service_token_;
      })
  }

  public async getWalletData(username: string, password: string): Promise<any> {
    return this.hashiVault_.userpassLogin({ username, password })
      .then((res) => {
        this.hashiVault_.token = res.auth.client_token;

        let path = join(this.getUserPrivatePath(username), 'wallet').replace(/\\/g, '/');

        return this.hashiVault_.read(path);
      })
      .then((res) => {
        return JSON.parse(res.data.data);
      })
      .catch((e) => {
        console.log("Error while attempting to read data from Vault. Did you type the wrong password?");
        this.hashiVault_.token = this.service_token_;
      })
  }

  public async listWallets(): Promise<void> {
    return this.hashiVault_.list(`secret/wallets/`).then((res) => {
      return res.data.keys;
    });
  }

  public kill(signal?: string): void {
    this.vault_process_.kill(signal);
  }
}
