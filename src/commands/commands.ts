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

export class Commands {
    public static async registerCommands(app) {
        const commandService = await app.get(CommandService);
        const moduleRef = await app.get(ModuleRef);
        let settings = await app.get(Settings);

        //  Settings
        commandService.register(new SetNodeEndpointCommand(new SetNodeEndpointReceiver(settings, moduleRef)));

        //  Wallet
        commandService.register(new WalletCreateCommand(new WalletCreateReceiver(settings, moduleRef)));
        commandService.register(new WalletAddressCommand(new WalletAddressReceiver(settings)));
        commandService.register(new WalletRewardCommand(new WalletRewardReceiver(settings)));
        commandService.register(new WalletTransferFundsCommand(new WalletTransferFundsReceiver(settings)));
        commandService.register(new WalletBalanceCommand(new WalletBalanceReceiver(settings)));
        commandService.register(new WalletBlocksCommand(new WalletBlocksReceiver(settings)));
        commandService.register(new WalletCommand(new WalletReceiver(settings)));

        //  Vault
        commandService.register(new VaultDownloadCommand(new VaultDownloadReceiver(settings)));
        commandService.register(new VaultInstallCommand(new VaultInstallReceiver(settings)));
        commandService.register(new VaultUnsealCommand(new VaultUnsealReceiver(moduleRef)));
    }
}
