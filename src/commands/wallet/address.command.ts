import { Command, IReceiver } from "../command.interface";

import request = require('request');

import Agent = require('socks5-http-client/lib/Agent');
import { API } from "../../common/utils/api";
import { ModuleRef } from "@nestjs/core";
import { Settings } from "../../common/config/settings.service";


export class WalletAddressCommand extends Command {
    public register(vorpal: any): void {
        var self = this;
        vorpal.command('wallet address <identifier> <password>', 'Add new address')
            .action(function (args, cb) {
                self.execute(this, args, cb);
            });
    }
}

export class WalletAddressReceiver implements IReceiver {
    private _settings: Settings;

    constructor(private readonly _app: ModuleRef) {
        this._settings = _app.get<Settings>(Settings);
    }

    execute(context: any, args: any, callback: any): void {
        API.post({
            uri: '/actor/wallet/address',
            json: {
                identifier: args.identifier,
                password: args.password
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
