import { Module } from '@nestjs/common';
import { Settings } from './common/config/settings.service';
import { Vault } from './vault/vault.service';
import { LockstepService } from './kadence/lockstep.service';
import { SeedService } from './kadence/seed.service';
import { EjectService } from './kadence/eject.service';
import { QuasarService } from './kadence/quasar.service';
import { Kadence } from './kadence/kadence.service';

@Module({
  providers: [
    Settings,
    Kadence,
    EjectService,
    LockstepService,
    SeedService,
    Vault,
    QuasarService
  ],
})

export class AppModule { }