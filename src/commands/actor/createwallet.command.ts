import { Command, IReceiver } from "../command.interface";
import { Settings } from "common/config/settings.service";

import request = require('request');

import Agent = require('socks5-http-client/lib/Agent');

export class CreateWalletCommand extends Command {
    public register(vorpal: any): void {
        var self = this;
        vorpal.command('actor wallet create <password>', 'Create a new wallet')
            .action(function (args, cb) {
                self.execute(this, args, cb);
            });
    }
}

export class CreateWalletReceiver implements IReceiver {
    constructor(private _settings: Settings){
    }
    
    execute(context: any, args: any, callback: any): void {
        request.post({
            url: `${this._settings.SwaggerEndpoint}actor/wallet/create`,
            json: {
                password: args.password
            },
            headers : {
                "Authorization" : `${this._settings.SwaggerApiKey}`,
                "Content-Type": "application/json"
            },
            agentClass: Agent,
            agentOptions: {
                socksHost: '127.0.0.1',
                socksPort: this._settings.OnionSocksPort
            }
        }, function(err, res){
            if(err){
                context.log(err.body);
            }

            if(res){
                context.log(res.body);
            }
 
            callback();
        });
    }
}
