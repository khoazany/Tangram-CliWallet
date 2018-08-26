import { Injectable } from "@nestjs/common";
import { LockstepService } from "./lockstep.service";
import { EjectService } from "./eject.service";
import { Topic } from "../common/enums/topic.enum";
import { MessageEntity } from "../common/database/entities/message.entity";
import { LockstepEntity } from "../common/database/entities/lockstep.entity";

@Injectable()
export class QuasarService {
    constructor(private readonly lockstepService: LockstepService, private readonly ejectService: EjectService) {
        this.handler = this.handler.bind(this);
    }

    handler(content: any, topic: string) {
        switch (topic) {
            case Topic.EVENT:
                break;
            case Topic.LOCKSTEP:
                this.lockstepService.handle(LockstepEntity.from_str(content));
                break;
            case Topic.QUERY:
                break;
            case Topic.EJECT:
                this.ejectService.handle(MessageEntity.from_str(content));
                break;
            default:
                break;
        }
    }
}