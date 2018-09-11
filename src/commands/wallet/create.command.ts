import { Command, IReceiver } from "../command.interface";

import request = require('request');

import Agent = require('socks5-http-client/lib/Agent');
import { API } from "../../common/utils/api";
import { ModuleRef } from "@nestjs/core";
import { Settings } from "../../common/config/settings.service";
import { Kadence } from "../../kadence/kadence.service";
import { Vault } from "../../vault/vault.service";
import { Topic } from "../../common/enums/topic.enum";
import { MessageEntity } from "../../common/database/entities/message.entity";
import { INestApplicationContext } from "@nestjs/common";


export class WalletCreateCommand extends Command {
    public register(vorpal: any): void {
        var self = this;
        vorpal.command('wallet create <password>', 'Create new wallet')
            .action(function (args, cb) {
                self.execute(this, args, cb);
            });
    }
}

export class WalletCreateReceiver implements IReceiver {
    private settings_: Settings;
    private vault_: Vault;
    private kadence_: Kadence;

    constructor(private readonly _app: ModuleRef) {
        this.settings_ = this._app.get(Settings);
        this.vault_ = this._app.get(Vault);
        this.kadence_ = this._app.get(Kadence);
    }

    execute(context: any, args: any, callback: any): void {
        // const messageEntity = new MessageEntity().add(this._settings.Identity, this._settings.ApiVersion, { topic: Topic.WALLET_CREATE });
        // const result = await this.kadence_.send(Topic.WALLET, messageEntity);

        // context.log(result);

        // callback();

        let self = this;

        API.post({
            uri: '/actor/wallet/create',
            json: {
                password: args.password
            }
        },
        this.settings_,
        function (err, res) {
            if (err) {
                context.log(err.body);
            }

            if (res) {
                self.vault_.saveWalletData(res.body.id,
                    args.password,
                    'wallet',
                    'data',
                    JSON.stringify(res.body))
                .then((r)=>{
                    console.log(`Generated wallet ${res.body.id}`);
                    callback();
                });
            }
        });
    }
}
