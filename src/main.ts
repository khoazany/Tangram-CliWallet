import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Settings } from './common/config/settings.service';
import {CommandService} from './commands/command.service';

const vorpal = require('vorpal')();

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const commandService = await app.get(CommandService);

  commandService.listen();
}

bootstrap();
