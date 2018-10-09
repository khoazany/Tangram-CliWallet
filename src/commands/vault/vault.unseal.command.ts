import { Command, IReceiver } from "../command.interface";
import { Settings } from "../../common/config/settings.service";

import request = require('request');

import { API } from "common/utils/api";
import { download } from "scripts/download.vault"
import { join } from 'path';
import { homedir } from 'os';
import { INestApplicationContext } from "@nestjs/common";
import { Vault } from "../../vault/vault.service";
import { MessageEntity } from "../../common/database/entities/message.entity";
import { MemberEntity } from "../../common/database/entities/member.entity";
import { Topic } from "../../common/enums/topic.enum";
import { Kadence } from "../../kadence/kadence.service";

const TANGRAM_DEFAULT_DIR = join(homedir(), '.tangramcli');

export class VaultUnsealCommand extends Command {
    public register(vorpal: any): void {
        var self = this;
        vorpal.command('vault unseal', 'Unseal vault using key(s)')
            .types({ string: ['_'] })
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
    private _settings: Settings;
    private _kadence: Kadence;

    constructor(private readonly _app: INestApplicationContext) {
        this._vaultService = _app.get<Vault>(Vault);
        this._settings = _app.get<Settings>(Settings);
        this._kadence = _app.get<Kadence>(Kadence);
    }

    async execute(context: any, args: any, callback: any): Promise<void> {
        return await this._vaultService.unsealVault(args.key).then(() => {
            if (this._settings.Node &&
                this._settings.NodeIdentity &&
                this._settings.NodePort) {
                
                var self = this;

                context.prompt({
                    type: 'confirm',
                    name: 'continue',
                    default: false,
                    message: "Would you like to automatically connect to your last known node endpoint?"
                }, async function (res) {
                    if (res.continue) {
                        const messageEntity = new MessageEntity().add(self._settings.Identity, self._settings.ApiVersion, {
                            members: [new MemberEntity().add(self._settings.Node, self._settings.NodePort, self._settings.NodeIdentity)]
                        });

                        var result = await self._kadence.send(Topic.JOIN, messageEntity);
                        
                        context.log(result);
                    }

                    callback();
                })
            } else {
                callback();
            }
        })
    }
}
