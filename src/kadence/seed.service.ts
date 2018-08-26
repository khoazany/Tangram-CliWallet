import { Injectable } from "@nestjs/common";

@Injectable()
export class SeedService {
    constructor() {
        this.handler = this.handler.bind(this);
    }

    handler(req: any, res: any, next: any) {

    }
}