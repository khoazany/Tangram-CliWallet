import { Injectable } from '@nestjs/common';
import Vorpal = require('vorpal');

@Injectable()
export class CommandService {
    constructor() {
    }

    public listen(): void {
        const vorpal = new Vorpal();

        vorpal
            .command('address', 'Outputs tangram address.')
            .action(function (args, callback) {
                this.log('address');
                callback();
            });

        vorpal
            .delimiter('tangram$ ')
            .show();
    }
}
