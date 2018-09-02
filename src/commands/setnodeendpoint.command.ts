import { Command, IReceiver } from "./command.interface";
import { Settings } from "common/config/settings.service";

export class SetNodeEndpointCommand extends Command {
    public register(vorpal: any): void {
        var self = this;
        vorpal.command('setnodeendpoint <endpoint> [token]', 'Set the node API Endpoint')
            .action(function (args, cb) {
                self.execute(this, args, cb);
            });
    }
}

export class SetNodeEndpointReceiver implements IReceiver {
    constructor(private _settings: Settings){
    }
    
    execute(context: any, args: any, callback: any): void {
        this._settings.SwaggerEndpoint = args.endpoint.replace(/\/+$/, "");;
        this._settings.SwaggerApiKey = args.token;

        callback();
    }
}
