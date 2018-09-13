import { Command, IReceiver } from "./command.interface";
import { ModuleRef } from "@nestjs/core";
import { Kadence } from "../kadence/kadence.service";
import { MemberEntity } from "../common/database/entities/member.entity";
import { Settings } from "../common/config/settings.service";

export class SetNodeEndpointCommand extends Command {
    public register(vorpal: any): void {
        var self = this;
        vorpal.command('setnodeendpoint <identity> <endpoint> <port>', 'Set Kadence contact Endpoint')
            .action(function (args, cb) {
                self.execute(this, args, cb);
            });
    }
}

export class SetNodeEndpointReceiver implements IReceiver {
    private readonly _kadence: Kadence;
    private readonly _settings: Settings;

    constructor(private readonly _app: ModuleRef) {
        this._settings = this._app.get(Settings);
        this._kadence = this._app.get(Kadence);
    }

    async execute(context: any, args: any, callback: any): Promise<void> {
        this._settings.HostIdentity = args.identity;
        this._settings.Hostname = args.endpoint;
        this._settings.HostPort = args.port

        const result = await this._kadence.join_network(new MemberEntity().add(args.endpoint, args.port, args.identity));

        context.log(result);

        callback();
    }
}
