import { Command, IReceiver } from "../command.interface";
import { Settings } from "common/config/settings.service";

import request = require('request');

import Agent = require('socks5-http-client/lib/Agent');
import { API } from "../../common/utils/api";

export class WalletBalanceCommand extends Command {
    public register(vorpal: any): void {
        var self = this;
        vorpal.command('wallet balance <identifier> <password> <address>', 'Get wallet balance')
            .action(function (args, cb) {
                self.execute(this, args, cb);
            });
    }
}

export class WalletBalanceReceiver implements IReceiver {
    constructor(private _settings: Settings) {
    }

    execute(context: any, args: any, callback: any): void {
        API.post({
            uri: '/actor/wallet/balance',
            json: {
                identifier: args.identifier,
                password: args.password,
                address: args.address
            },
        }, 
        this._settings, 
        function (err, res) {
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
