import { Injectable } from "@nestjs/common";
import { LockstepService } from "./lockstep.service";
import { Topic } from "../common/enums/topic.enum";
import { LockstepEntity } from "../common/database/entities/lockstep.entity";

@Injectable()
export class QuasarService {
    constructor(private readonly lockstepService: LockstepService) {
        this.handler = this.handler.bind(this);
    }

    handler(content: any, topic: string) {
        switch (topic) {
            case Topic.LOCKSTEP:
                this.lockstepService.handle(LockstepEntity.from_str(content));
                break;
            case Topic.QUERY:
                break;
            default:
                break;
        }
    }
}