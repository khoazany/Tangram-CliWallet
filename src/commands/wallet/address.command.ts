import { Command, IReceiver } from "../command.interface";

import request = require('request');

import Agent = require('socks5-http-client/lib/Agent');
import { API } from "../../common/utils/api";
import { ModuleRef } from "@nestjs/core";
import { Settings } from "../../common/config/settings.service";
import { Kadence } from "../../kadence/kadence.service";
import { MessageEntity } from "../../common/database/entities/message.entity";
import { Topic } from "../../common/enums/topic.enum";
import { MemberEntity } from "../../common/database/entities/member.entity";


export class WalletAddressCommand extends Command {
    public register(vorpal: any): void {
        var self = this;
        vorpal.command('wallet address', 'Add new address')
            .action(function (args, cb) {
                self.execute(this, args, cb);
            });
    }
}

export class WalletAddressReceiver implements IReceiver {
    private _settings: Settings;
    private _kadence: Kadence;

    constructor(private readonly _app: ModuleRef) {
        this._settings = _app.get<Settings>(Settings);
        this._kadence = _app.get<Kadence>(Kadence);
    }

    async execute(context: any, args: any, callback: any): Promise<void> {
        const messageEntity = new MessageEntity().add(this._settings.Identity, this._settings.ApiVersion, {
            topic: Topic.ADDRESS,
            members: [new MemberEntity().add(this._settings.Hostname, this._settings.Port, this._settings.HostIdentity)]
        });

        try {
            const result = await this._kadence.send(Topic.WALLET, messageEntity);

            // The return JSON[] is added to the wallet..
            context.log(result);

        } catch (err) {
            context.log(err);
        }

        callback();
    }
}
