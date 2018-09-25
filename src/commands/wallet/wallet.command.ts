import { Command, IReceiver } from "../command.interface";
import { Settings } from "../../common/config/settings.service";

import request = require('request');

import Agent = require('socks5-http-client/lib/Agent');
import { API } from "../../common/utils/api";
import { INestApplicationContext } from "@nestjs/common";

export class WalletCommand extends Command {
    public register(vorpal: any): void {
        var self = this;
        vorpal.command('wallet <identifier> <password>', 'Get wallet')
            .types({string: ['_']})
            .action(function (args, cb) {
                self.execute(this, args, cb);
            });
    }
}

export class WalletReceiver implements IReceiver {
    private _settings: Settings;

    constructor(private readonly _app: INestApplicationContext) {
        this._settings = _app.get<Settings>(Settings);
    }

    execute(context: any, args: any, callback: any): void {
        API.post({
            uri: '/actor/wallet',
            json: {
                identifier: args.identifier,
                password: args.password
            }
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
