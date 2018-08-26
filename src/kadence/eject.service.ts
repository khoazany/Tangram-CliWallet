import { Injectable } from "@nestjs/common";
import { MessageEntity } from "../common/database/entities/message.entity";

@Injectable()
export class EjectService {
    handle(messageEntity: MessageEntity) {

    }
}