import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Settings } from './common/config/settings.service';
import { CommandService } from './commands/command.service';
import { INestApplicationContext } from '@nestjs/common';

import { SetNodeEndpointCommand, SetNodeEndpointReceiver } from './commands/setnodeendpoint.command';
import { CreateWalletCommand, CreateWalletReceiver } from './commands/actor/createwallet.command';

async function registerCommands(app) {
  const commandService = await app.get(CommandService);

  let settings = await app.get(Settings);

  commandService.register(new SetNodeEndpointCommand(new SetNodeEndpointReceiver(settings)));
  commandService.register(new CreateWalletCommand(new CreateWalletReceiver(settings)));
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const commandService = await app.get(CommandService);

  await registerCommands(app);

  commandService.listen();
}

bootstrap();
