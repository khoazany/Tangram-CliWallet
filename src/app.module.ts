import { Module } from '@nestjs/common';
import { Settings } from './common/config/settings.service';
import { Vault } from './vault/vault.service';
import { Kadence } from './kadence/kadence.service';
import { SodiumService } from './common/sodium/sodium.service';
import { CommandService } from './commands/command.service'

@Module({
  providers: [
    Settings,
    SodiumService,
    Kadence,
    Vault,
    CommandService
  ],
})

export class AppModule { }
