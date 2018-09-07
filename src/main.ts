import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CommandService } from './commands/command.service';
import { Commands } from './commands/commands'

import os = require('os');

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const commandService = await app.get(CommandService);

  await Commands.registerCommands(app);

  commandService.listen();
}

bootstrap();
