import { Command, IReceiver } from "../command.interface";
import { Settings } from "../../common/config/settings.service";
import { ModuleRef } from "@nestjs/core";
import { Kadence } from "../../kadence/kadence.service";
import { MessageEntity } from "../../common/database/entities/message.entity";
import { Topic } from "../../common/enums/topic.enum";
import { MemberEntity } from "../../common/database/entities/member.entity";
import * as R from 'ramda';
import { Vault } from "../../vault/vault.service";

export class WalletBalanceCommand extends Command {
    public register(vorpal: any): void {
        var self = this;
        vorpal.command('wallet balance <identifier> <address> <password>', 'Get wallet balance')
            .action(function (args, cb) {
                self.execute(this, args, cb);
            });
    }
}

export class WalletBalanceReceiver implements IReceiver {
    private _settings: Settings;
    private _kadence: Kadence;
    private _vault: Vault;

    constructor(private readonly _app: ModuleRef) {
        this._settings = _app.get<Settings>(Settings);
        this._kadence = _app.get<Kadence>(Kadence);
    }

    async execute(context: any, args: any, callback: any): Promise<void> {
        let wallet = await this._vault.getWalletData(args.identifier, args.password);

        const keyPair: any = R.propOr(null, 'keyPairs', R.find(R.propEq('base58', args.address), wallet.stealth));
        const payload: any = R.propOr(null, 'payload', R.find(R.propEq('base58', args.address), wallet.stealth));
        const scan: any = R.propOr(null, 'scan', R.find(R.propEq('base58', args.address), wallet.stealth));

        const messageEntity = new MessageEntity().add(args.identifier,
            {
                apiVersion: this._settings.ApiVersion,
                identifier: args.identifier,
                address: args.address,
                xpub: keyPair.publicKey,
                secretKey: keyPair.secretKey,
                stealthKeypair: { payload, scan },
                boxSealKeypair: wallet.box_seal[0]
            },
            {
                topic: Topic.BALANCE,
                members: [new MemberEntity().add(this._settings.Node, this._settings.NodePort, this._settings.NodeIdentity)]
            });

        try {
            const result = await this._kadence.send(Topic.WALLET, messageEntity);

            context.log(result);
        } catch (err) {
            context.log(err);
        }

        callback();
    }
}
