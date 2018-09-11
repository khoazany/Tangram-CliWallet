import { SetNodeEndpointCommand, SetNodeEndpointReceiver } from './setnodeendpoint.command';
import { WalletCreateCommand, WalletCreateReceiver } from './wallet/create.command';

import { CommandService } from './command.service';
import { Settings } from '../common/config/settings.service';
import { WalletAddressCommand, WalletAddressReceiver } from './wallet/address.command';
import { WalletRewardReceiver, WalletRewardCommand } from './wallet/reward.command';
import { WalletTransferFundsCommand, WalletTransferFundsReceiver } from './wallet/transfer.funds.command';
import { WalletBalanceReceiver, WalletBalanceCommand } from './wallet/balance.command';
import { WalletBlocksCommand, WalletBlocksReceiver } from './wallet/blocks.command';
import { WalletCommand, WalletReceiver } from './wallet/wallet.command';

import { VaultDownloadCommand, VaultDownloadReceiver } from './vault/vault.download.command';
import { VaultInstallCommand, VaultInstallReceiver } from './vault/vault.install.command';
import { ModuleRef } from '@nestjs/core';
import { VaultUnsealCommand, VaultUnsealReceiver } from './vault/vault.unseal.command';
import { INestApplicationContext } from '@nestjs/common';
import { WalletListCommand, WalletListReceiver } from './wallet/wallet.list.command';

export class Commands {
    public static async registerCommands(app) {
        const moduleRef = await app.get(ModuleRef);

        const commandService = await moduleRef.get(CommandService);
        
        //  Settings
        commandService.register(new SetNodeEndpointCommand(new SetNodeEndpointReceiver(moduleRef)));

        //  Wallet
        commandService.register(new WalletCreateCommand(new WalletCreateReceiver(moduleRef)));
        commandService.register(new WalletAddressCommand(new WalletAddressReceiver(moduleRef)));
        commandService.register(new WalletRewardCommand(new WalletRewardReceiver(moduleRef)));
        commandService.register(new WalletTransferFundsCommand(new WalletTransferFundsReceiver(moduleRef)));
        commandService.register(new WalletBalanceCommand(new WalletBalanceReceiver(moduleRef)));
        commandService.register(new WalletBlocksCommand(new WalletBlocksReceiver(moduleRef)));
        commandService.register(new WalletCommand(new WalletReceiver(moduleRef)));
        commandService.register(new WalletListCommand(new WalletListReceiver(moduleRef)));

        //  Vault
        commandService.register(new VaultDownloadCommand(new VaultDownloadReceiver(moduleRef)));
        commandService.register(new VaultInstallCommand(new VaultInstallReceiver(moduleRef)));
        commandService.register(new VaultUnsealCommand(new VaultUnsealReceiver(moduleRef)));
    }
}
