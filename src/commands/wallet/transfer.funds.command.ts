import { Command, IReceiver } from "../command.interface";
import { Settings } from "../../common/config/settings.service";

import request = require('request');

import Agent = require('socks5-http-client/lib/Agent');
import { API } from "../../common/utils/api";
import { ModuleRef } from "@nestjs/core";

export class WalletTransferFundsCommand extends Command {
    public register(vorpal: any): void {
        var self = this;
        vorpal.command('wallet transfer <identifier> <password> <account> <change> <link>', 'Transfer funds to link account or inter-account.')
            .action(function (args, cb) {
                self.execute(this, args, cb);
            });
    }
}

export class WalletTransferFundsReceiver implements IReceiver {
    private _settings: Settings;

    constructor(private readonly _app: ModuleRef) {
        this._settings = _app.get<Settings>(Settings);
    }

    execute(context: any, args: any, callback: any): void {
        API.post({
            uri: '/actor/wallet/transfer/funds',
            json: {
                identifier: args.identifier,
                password: args.password,
                account: args.account,
                change: args.amount,
                link: args.change,
                amount: args.amount
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
