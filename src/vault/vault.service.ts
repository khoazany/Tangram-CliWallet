import { Injectable } from '@nestjs/common';
import * as HashiVault from 'node-vault';
import { Settings } from '../common/config/settings.service';

process.env.DEBUG = 'node-vault'; // switch on debug mode


@Injectable()
export class Vault {
  private hashiVault_: HashiVault.client;

  constructor(private readonly settings: Settings) {
    this.hashiVault_ = HashiVault();
    this.hashiVault_.apiVersion = settings.ApiVersion;
    this.hashiVault_.endpoint = settings.Endpoint;
    this.hashiVault_.token = settings.Token == '' ? undefined : settings.Token;

    this.init();
  }

  public init() {
    this.hashiVault_.initialized()
    .then((result) => {
      console.log(result);
      return this.hashiVault_.init({ secret_shares: 1, secret_threshold: 1 });
    })
    .then((result) => {
      console.log(result);
      this.hashiVault_.token = result.root_token;
      const key = result.keys[0];
      return this.hashiVault_.unseal({ secret_shares: 1, key });
    })
    .then(console.log)
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