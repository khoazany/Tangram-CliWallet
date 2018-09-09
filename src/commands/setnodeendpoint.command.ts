import { Command, IReceiver } from "./command.interface";
import { Settings } from "common/config/settings.service";
import { ModuleRef } from "@nestjs/core";
import { Kadence } from "../kadence/kadence.service";
import { MessageEntity } from "../common/database/entities/message.entity";
import { Topic } from "../common/enums/topic.enum";
import { MemberEntity } from "../common/database/entities/member.entity";

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
    private readonly kadence_: Kadence;

    constructor(private _settings: Settings, private readonly _moduleRef: ModuleRef) {
        this.kadence_ = this._moduleRef.get<Kadence>(Kadence);
    }

    async execute(context: any, args: any, callback: any): Promise<void> {
        // this._settings.SwaggerEndpoint = args.endpoint.replace(/\/+$/, "");;
        // this._settings.SwaggerApiKey = args.token;

        this._settings.HostIdentity = args.identity;
        this._settings.Hostname = args.endpoint;
        this._settings.HostPort = args.port

        const messageEntity = new MessageEntity().add(this._settings.Identity, {}, {
            members: [
                new MemberEntity().add(args.endpoint, args.port, args.identity)
            ]
        });

        const result = await this.kadence_.send(Topic.JOIN, messageEntity);

        context.log(result);

        callback();
    }
}
