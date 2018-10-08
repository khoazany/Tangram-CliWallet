import { Command, IReceiver } from "../command.interface";
import { Settings } from "../../common/config/settings.service";

import request = require('request');

import Agent = require('socks5-http-client/lib/Agent');
import { API } from "../../common/utils/api";
import { INestApplicationContext } from "@nestjs/common";
import { Vault } from "../../vault/vault.service";

export class WalletCommand extends Command {
    public register(vorpal: any): void {
        var self = this;
        vorpal.command('wallet get', 'Get wallet')
            .types({ string: ['_'] })
            .action(function (args, cb) {
                var context = this;

                this.prompt([
                    {
                        type: 'input',
                        name: 'identifier',
                        message: 'Identifier: '
                    },
                    {
                        type: 'password',
                        name: 'password',
                        message: 'Password: '
                    }
                ], function (answers) {
                    self.execute(context, answers, cb);
                });
            });
    }
}

export class WalletReceiver implements IReceiver {
    private _settings: Settings;
    private _vault: Vault;

    constructor(private readonly _app: INestApplicationContext) {
        this._settings = _app.get<Settings>(Settings);
        this._vault = _app.get<Vault>(Vault);
    }

    async execute(context: any, args: any, callback: any): Promise<void> {
        try {
            let wallet = await this._vault.getWalletData(args.identifier, args.password);
            context.log(JSON.stringify(wallet));
        } catch (err) {
            context.log(err);
        }

        callback();
    }
}
