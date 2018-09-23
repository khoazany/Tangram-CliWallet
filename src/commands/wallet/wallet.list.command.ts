import { Command, IReceiver } from "../command.interface";
import { Settings } from "common/config/settings.service";

import { INestApplicationContext } from "@nestjs/common";
import { Vault } from "../../vault/vault.service";

export class WalletListCommand extends Command {
    public register(vorpal: any): void {
        var self = this;
        vorpal.command('wallet list', 'List wallets')
            .action(function (args, cb) {
                self.execute(this, args, cb);
            });
    }
}

export class WalletListReceiver implements IReceiver {
    private _vault: Vault;

    constructor(private readonly _app: INestApplicationContext) {
        this._vault = _app.get<Vault>(Vault);
    }

    async execute(context: any, args: any, callback: any): Promise<void> {
        return await this._vault.listWallets().then((res) => {
            console.log(res);
            callback();
        })
    }
}
