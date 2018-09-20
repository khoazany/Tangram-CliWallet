import { Command, IReceiver } from "../command.interface";

import { ModuleRef } from "@nestjs/core";
import { Settings } from "../../common/config/settings.service";
import { Kadence } from "../../kadence/kadence.service";
import { MessageEntity } from "../../common/database/entities/message.entity";
import { Topic } from "../../common/enums/topic.enum";
import { MemberEntity } from "../../common/database/entities/member.entity";

import * as R from 'ramda';
import { Vault } from "../../vault/vault.service";

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
    private _kadence: Kadence;
    private _vault: Vault;

    constructor(private readonly _app: ModuleRef) {
        this._settings = _app.get<Settings>(Settings);
        this._kadence = _app.get<Kadence>(Kadence);
        this._vault = _app.get<Vault>(Vault);
    }

    async execute(context: any, args: any, callback: any): Promise<void> {
        let wallet = await this._vault.getWalletData(args.identifier, args.password);

        const boxSealPK: any = R.last(wallet.box_seal);
        const swhePK: any = R.last(wallet.homomorphic);

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
            wallet.stealth.push(result);

            // Save the wallet

            var res = await this._vault.saveWalletData(args.identifier, args.password, 'wallet', 'data', wallet);

            context.log(result);

        } catch (err) {
            context.log(err);
        }

        callback();
    }
}
