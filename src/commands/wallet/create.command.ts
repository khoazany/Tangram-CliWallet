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
import { MemberEntity } from "common/database/entities/member.entity";


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

    async execute(context: any, args: any, callback: any): Promise<void> {
        const messageEntity = new MessageEntity().add(this.settings_.Identity, this.settings_.ApiVersion, {
            topic: Topic.WALLET_CREATE,
            members: [new MemberEntity().add(this.settings_.Hostname, this.settings_.Port, this.settings_.HostIdentity)]
        });

        try {
            const result = await this.kadence_.send(Topic.WALLET, messageEntity);
            this.vault_.saveWalletData(result.id,
                args.password,
                'wallet',
                'data',
                JSON.stringify(result))
                .then((r) => {
                    console.log(`Generated wallet ${result.id}`);
                    callback();
                });

        } catch (err) {
            context.log(err);
        }

        callback();
    }
}
