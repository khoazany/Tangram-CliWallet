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

  private root_token_: string;
  private service_token_: string;

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
    let key2 = '';

    this.hashiVault_.initialized()
      .then((result) => {
        if (!result.initialized) {
          return this.hashiVault_.init({ secret_shares: NUM_SECRETS, secret_threshold: SECRET_THRESHOLD })
            .then((result) => {
              this.hashiVault_.token = result.root_token;
              this.root_token_ = result.root_token;

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
              console.log("    place. When unsealing the vault you may use any        ");
              console.log("    1 of these keys. THESE ARE NOT RECOVERY KEYS.          ");
              console.log();
              console.log();
              for (let i = SECRET_THRESHOLD - 1; i < result.keys.length; i++) {
                console.log(`KEY ${i}: ${result.keys[i]}`)
              }
              console.log();
              console.log();
              console.log("    You will need to unseal the Vault everytime you launch ");
              console.log("    the CLI Wallet.                                        ");
              console.log("    Please type `vault unseal` to unseal the               ");
              console.log("    Vault.");
              console.log("###########################################################");
              console.log("#                   !!! ATTENTION !!!                     #");
              console.log("###########################################################");
              console.log()
              console.log()

              writeFileSync(join(TANGRAM_DEFAULT_DIR, 'shard'), result.keys_base64[0]);

              key2 = result.keys[1];

              return this.hashiVault_.unseal({ secret_shares: 1, key: key });
            })
            .then((result => {
              return this.hashiVault_.unseal({ secret_shares: 1, key: key2 });
            }))
            .then((result) => {
              return this.createVaultServicePolicy();
            })
            .then((result) => {
              return this.createVaultServiceToken().then(
                (result) => { this.service_token_ = result.auth.client_token }
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
            .then((result) => {
              //  Create bogus user
              return this.createWalletUser('test', 'test');
            })
            .catch((err) => {
              console.error("Vault Error: " + err.message)
            });;
        } else {
          //  TODO: Since the vault is already initialized
          //        provide the first shard stored on disk.

          console.log();
          console.log();
          console.log("    Please type `vault unseal` to unseal the               ");
          console.log("    Vault.");
          console.log();
          console.log();
        }
      })

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

  public createWalletUser(username: string, password: string) {
    const mountPoint = 'userpass';

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
                //  console.log("entityId: " + entityId);

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
}
