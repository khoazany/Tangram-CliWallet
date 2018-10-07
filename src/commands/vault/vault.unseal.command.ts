import { Command, IReceiver } from "../command.interface";
import { Settings } from "common/config/settings.service";

import request = require('request');

import { API } from "common/utils/api";
import { download } from "scripts/download.vault"
import { join } from 'path';
import { homedir } from 'os';
import { INestApplicationContext } from "@nestjs/common";
import { Vault } from "../../vault/vault.service";

const TANGRAM_DEFAULT_DIR = join(homedir(), '.tangramcli');

export class VaultUnsealCommand extends Command {
    public register(vorpal: any): void {
        var self = this;
        vorpal.command('vault unseal', 'Unseal vault using key(s)')
            .types({string: ['_']})
            .action(function (args, cb) {
                var context = this;
                var promise = this.prompt([
                    {
                        type: 'password',
                        name: 'key',
                        message: 'Key: '
                    }
                ], function (answers) {
                    self.execute(context, answers, cb);
                });
            });
    }
}

export class VaultUnsealReceiver implements IReceiver {
    private _vaultService: Vault;

    constructor(private readonly _app: INestApplicationContext) {
        this._vaultService = _app.get<Vault>(Vault);
    }
    
    async execute(context: any, args: any, callback: any): Promise<void> {
        return await this._vaultService.unsealVault(args.key).then(() => {
            callback();
        })
    }
}
