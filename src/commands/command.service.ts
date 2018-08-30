import { Injectable } from '@nestjs/common';
import Vorpal = require('vorpal');
import { ICommand } from './command.interface';
import { SetAPIKeyReceiver, SetAPIKeyCommand } from './setapikey.command';

@Injectable()
export class CommandService {
    private commands: ICommand[];
    private vorpal_: any;

    constructor() {
        this.commands = [];

        this.vorpal_ = new Vorpal();
    }

    public register(command: ICommand) {
        this.commands.push(command);
    }

    public listen(): void {
        this.commands.forEach(command => {
            command.register(this.vorpal_);
        });

        this.vorpal_
            .delimiter('tangram$ ')
            .show();
    }
}
