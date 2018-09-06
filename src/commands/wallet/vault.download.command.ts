import { Command, IReceiver } from "../command.interface";
import { Settings } from "common/config/settings.service";

import request = require('request');

import Agent = require('socks5-http-client/lib/Agent');
import { API } from "common/utils/api";
import { download } from "../../scripts/download.vault"
import { join } from 'path';
import { homedir } from 'os';

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
    constructor(private _settings: Settings) {
    }

    execute(context: any, args: any, callback: any): void {
        download(TANGRAM_DEFAULT_DIR, function(err, res){
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