import { Command, IReceiver } from "../command.interface";
import { Settings } from "common/config/settings.service";

import request = require('request');

import Agent = require('socks5-http-client/lib/Agent');
import { API } from "common/utils/api";
import { join } from 'path';
import { homedir } from 'os';
import fs = require('fs');

const TANGRAM_DEFAULT_DIR = join(homedir(), '.tangramcli');

export class VaultInstallCommand extends Command {
    public register(vorpal: any): void {
        var self = this;
        vorpal.command('vault install', 'Install default Vault configuration')
            .action(function (args, cb) {
                self.execute(this, args, cb);
            });
    }
}

export class VaultInstallReceiver implements IReceiver {
    constructor(private _settings: Settings) {
    }

    execute(context: any, args: any, callback: any): void {
        let vault_config = {
            "storage": {
                "file": {
                    "path": join(TANGRAM_DEFAULT_DIR, 'wallet')
                }
            },
            "listener": {
                "tcp": {
                    "address": "127.0.0.1:8200",
                    "tls_disable": "true"
                }
            }
        }

        fs.writeFile(join(TANGRAM_DEFAULT_DIR, 'vault.json'), JSON.stringify(vault_config), function (err) {
            console.log(err);
            callback();
        });
    }
}
