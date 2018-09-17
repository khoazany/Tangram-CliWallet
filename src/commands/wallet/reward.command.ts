import { Command, IReceiver } from "../command.interface";
import { Settings } from "../../common/config/settings.service";

import { ModuleRef } from "@nestjs/core";
import { Kadence } from "../../kadence/kadence.service";
import { Topic } from "../../common/enums/topic.enum";
import { MessageEntity } from "../../common/database/entities/message.entity";
import { MemberEntity } from "../../common/database/entities/member.entity";

import * as R from 'ramda';

export class WalletRewardCommand extends Command {
    public register(vorpal: any): void {
        var self = this;
        vorpal.command('wallet reward <identifier> <address> <amount>', 'Reward wallet')
            .action(function (args, cb) {
                self.execute(this, args, cb);
            });
    }
}

export class WalletRewardReceiver implements IReceiver {
    private _settings: Settings;
    private _kadence: Kadence;

    constructor(private readonly _app: ModuleRef) {
        this._settings = _app.get<Settings>(Settings);
        this._kadence = _app.get<Kadence>(Kadence);
    }

    async execute(context: any, args: any, callback: any): Promise<void> {
        const messageEntity = new MessageEntity().add(args.identifier,
            {
                apiVersion: this._settings.ApiVersion,
                identifier: args.identifier,
                address: args.address,
                amount: args.amount,
                swheKeypair: R.last(this._settings.Wallet.homomorphic)
            },
            {
                topic: Topic.REWARD,
                members: [new MemberEntity().add(this._settings.Node, this._settings.NodePort, this._settings.NodeIdentity)]
            });

        try {
            const result = await this._kadence.send(Topic.WALLET, messageEntity);
            // return the reward block hash..
            context.log(result);

        } catch (err) {
            context.log(err);
        }

        callback();
    }
}
