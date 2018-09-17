import { Command, IReceiver } from "./command.interface";
import { ModuleRef } from "@nestjs/core";
import { Kadence } from "../kadence/kadence.service";
import { MemberEntity } from "../common/database/entities/member.entity";
import { Settings } from "../common/config/settings.service";
import { Topic } from "../common/enums/topic.enum";
import { MessageEntity } from "../common/database/entities/message.entity";

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
        this._settings.Node = args.endpoint;
        this._settings.NodePort = args.port;
        this._settings.NodeIdentity = args.identity;

        const messageEntity = new MessageEntity().add(this._settings.Identity, this._settings.ApiVersion, {
            members: [new MemberEntity().add(this._settings.Node, this._settings.NodePort, this._settings.NodeIdentity)]
        });

        const result = await this._kadence.send(Topic.JOIN, messageEntity);

        context.log(result);

        callback();
    }
}
