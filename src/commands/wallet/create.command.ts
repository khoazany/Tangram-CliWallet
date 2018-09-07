import { Command, IReceiver } from "../command.interface";
import { Settings } from "common/config/settings.service";

import request = require('request');

import Agent = require('socks5-http-client/lib/Agent');
import { API } from "../../common/utils/api";
import { ModuleRef } from "@nestjs/core";
import { Kadence } from "../../kadence/kadence.service";
import { Topic } from "../../common/enums/topic.enum";
import { MessageEntity } from "../../common/database/entities/message.entity";

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
    private readonly kadence_: Kadence;

    constructor(private _settings: Settings, private readonly _moduleRef: ModuleRef) {
        this.kadence_ = this._moduleRef.get<Kadence>(Kadence);
    }

    async execute(context: any, args: any, callback: any): Promise<void> {
        const messageEntity = new MessageEntity().add(this._settings.Identity, this._settings.ApiVersion, { topic: Topic.WALLET_CREATE });
        const result = await this.kadence_.send(Topic.WALLET, messageEntity);

        context.log(result);

        callback();

        // API.post({
        //     uri: '/actor/wallet/create',
        //     json: {
        //         password: args.password
        //     }
        // }, 
        // this._settings, 
        // function (err, res) {
        //     if (err) {
        //         context.log(err.body);
        //     }

        //     if (res) {
        //         context.log(res.body);
        //     }

        //     callback();
        // });
    }
}
