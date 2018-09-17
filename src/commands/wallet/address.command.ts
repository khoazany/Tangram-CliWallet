import { Command, IReceiver } from "../command.interface";

import { ModuleRef } from "@nestjs/core";
import { Settings } from "../../common/config/settings.service";
import { Kadence } from "../../kadence/kadence.service";
import { MessageEntity } from "../../common/database/entities/message.entity";
import { Topic } from "../../common/enums/topic.enum";
import { MemberEntity } from "../../common/database/entities/member.entity";

import * as R from 'ramda';

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
        const boxSealPK: any = R.last(this._settings.Wallet.box_seal);
        const swhePK: any = R.last(this._settings.Wallet.homomorphic);

        const messageEntity = new MessageEntity().add(this._settings.Identity,
            {
                apiVersion: this._settings.ApiVersion,
                boxSealPub: boxSealPK.publicKey,
                swhePub: swhePK.publicKey
            },
            {
                topic: Topic.ADDRESS,
                members: [new MemberEntity().add(this._settings.Node, this._settings.NodePort, this._settings.NodeIdentity)]
            });

        try {

            const result = await this._kadence.send(Topic.WALLET, messageEntity);

            // The return JSON is added to the wallet stealth []..
            this._settings.Wallet.stealth.push(result);

            context.log(result);

        } catch (err) {
            context.log(err);
        }

        callback();
    }
}
