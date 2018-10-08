import { Command, IReceiver } from "../command.interface";
import { Settings } from "../../common/config/settings.service";

import { INestApplicationContext } from "@nestjs/common";
import { Kadence } from "../../kadence/kadence.service";
import { Topic } from "../../common/enums/topic.enum";
import { MessageEntity } from "../../common/database/entities/message.entity";
import { MemberEntity } from "../../common/database/entities/member.entity";

import * as R from 'ramda';
import { Vault } from "../../vault/vault.service";

export class WalletRewardCommand extends Command {
    public register(vorpal: any): void {
        var self = this;
        vorpal.command('wallet reward', 'Reward wallet')
            .types({string: ['_']})
            .action(function (args, cb) {
                var context = this;

                this.prompt([
                    {
                        type: 'input',
                        name: 'identifier',
                        message: 'Identifier: '
                    },
                    {
                        type: 'input',
                        name: 'address',
                        message: 'Address: ',
                    },
                    {
                        type: 'input',
                        name: 'amount',
                        message: 'Amount: ',
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

export class WalletRewardReceiver implements IReceiver {
    private _settings: Settings;
    private _kadence: Kadence;
    private _vault: Vault;

    constructor(private readonly _app: INestApplicationContext) {
        this._settings = _app.get<Settings>(Settings);
        this._kadence = _app.get<Kadence>(Kadence);
        this._vault = _app.get<Vault>(Vault);
    }

    async execute(context: any, args: any, callback: any): Promise<void> {
        let wallet = await this._vault.getWalletData(args.identifier, args.password);

        const messageEntity = new MessageEntity().add(args.identifier,
            {
                apiVersion: this._settings.ApiVersion,
                identifier: args.identifier,
                address: args.address,
                amount: args.amount,
                swheKeypair: R.last(wallet.homomorphic)
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
