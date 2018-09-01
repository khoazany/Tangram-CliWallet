import { Command, IReceiver } from "../command.interface";
import { Settings } from "common/config/settings.service";

import request = require('request');

import Agent = require('socks5-http-client/lib/Agent');

export class WalletRewardCommand extends Command {
    public register(vorpal: any): void {
        var self = this;
        vorpal.command('wallet reward <identifier> <password> <address> <amount>', 'Reward wallet')
            .action(function (args, cb) {
                self.execute(this, args, cb);
            });
    }
}

export class WalletRewardReceiver implements IReceiver {
    constructor(private _settings: Settings) {
    }

    execute(context: any, args: any, callback: any): void {
        request.post({
            url: `${this._settings.SwaggerEndpoint}actor/wallet/reward`,
            json: {
                identifier: args.identifier,
                password: args.password,
                address: args.address,
                amount: args.amount
            },
            headers: {
                "Authorization": `${this._settings.SwaggerApiKey}`,
                "Content-Type": "application/json"
            },
            agentClass: Agent,
            agentOptions: {
                socksHost: this._settings.OnionSocksHost,
                socksPort: this._settings.OnionSocksPort
            }
        }, function (err, res) {
            if (err) {
                context.log(err.body);
            }

            if (res) {
                context.log(res.body);
            }

            callback();
        });
    }
}
