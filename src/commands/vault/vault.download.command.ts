import { Command, IReceiver } from "../command.interface";
import { Settings } from "common/config/settings.service";

import request = require('request');

import { API } from "common/utils/api";
import { download } from "../../scripts/download.vault"
import { join } from 'path';
import { homedir } from 'os';
import { INestApplicationContext } from "@nestjs/common";

const TANGRAM_DEFAULT_DIR = join(homedir(), '.tangramcli');

export class VaultDownloadCommand extends Command {
    public register(vorpal: any): void {
        var self = this;
        vorpal.command('vault download', 'Get the latest version of Vault')
            .action(function (args, cb) {
                self.execute(this, args, cb);
            });
    }
}

export class VaultDownloadReceiver implements IReceiver {
    constructor(private readonly _app: INestApplicationContext) {
    }

    execute(context: any, args: any, callback: any): void {
        download(function(err, res){
            if(err) {
                context.log(err.body)
            }

            if(res){
                context.log(res.body);
            }

            callback();
        });
    }
}
