import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Settings } from './common/config/settings.service';
import { CommandService } from './commands/command.service';
import { INestApplicationContext } from '@nestjs/common';

import { SetAPIKeyCommand, SetAPIKeyReceiver } from './commands/setapikey.command';

async function registerCommands(app) {
  const commandService = await app.get(CommandService);

  let settings = await app.get(Settings);

  commandService.register(new SetAPIKeyCommand(new SetAPIKeyReceiver(settings)));
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const commandService = await app.get(CommandService);

  await registerCommands(app);

  commandService.listen();
}

bootstrap();
