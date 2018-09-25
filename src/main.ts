import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CommandService } from './commands/command.service';
import { Commands } from './commands/commands'

import os = require('os');
import { Vault } from './vault/vault.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const vaultService = await app.get(Vault);
  await vaultService.init();

  const commandService = await app.get(CommandService);
  await Commands.registerCommands(app);

  commandService.listen();
}

bootstrap();
