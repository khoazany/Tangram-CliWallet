import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CommandService } from './commands/command.service';
import { Commands } from './commands/commands'

import { getVaultLink } from './scripts/download.vault'

import os = require('os');

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const commandService = await app.get(CommandService);

  await Commands.registerCommands(app);

  getVaultLink(os.platform(), '0.11.0', function (err, res) { 
    console.log(res);
  });

  commandService.listen();
}

bootstrap();
