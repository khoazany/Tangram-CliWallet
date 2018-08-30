import { Command, IReceiver } from "./command.interface";
import { Inject } from "@nestjs/common";
import { Settings } from "../common/config/settings.service";

export class SetAPIKeyCommand extends Command {
    public register(vorpal: any): void {
        var self = this;
        vorpal.command('setapikey <key>', 'Set the API key for the Swagger API')
            .action(function (args, cb) {
                self.execute(this, args, cb);
            });
    }
}

export class SetAPIKeyReceiver implements IReceiver {
    _settings: Settings;

    constructor(private settings: Settings){
        this._settings = settings;
    }
    
    execute(context: any, args: any, callback: any): void {
        context.log("API key set");
        this._settings.SwaggerApiKey = args.key;
        callback();
    }
}
