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
import { VaultUnsealCommand, VaultUnsealReceiver } from './vault/vault.unseal.command';
import { WalletListCommand, WalletListReceiver } from './wallet/wallet.list.command';

export class Commands {
    public static async registerCommands(app) {
        const commandService = await app.get(CommandService);
        
        //  Settings
        commandService.register(new SetNodeEndpointCommand(new SetNodeEndpointReceiver(app)));

        //  Wallet
        commandService.register(new WalletCreateCommand(new WalletCreateReceiver(app)));
        commandService.register(new WalletAddressCommand(new WalletAddressReceiver(app)));
        commandService.register(new WalletRewardCommand(new WalletRewardReceiver(app)));
        commandService.register(new WalletTransferFundsCommand(new WalletTransferFundsReceiver(app)));
        commandService.register(new WalletBalanceCommand(new WalletBalanceReceiver(app)));
        commandService.register(new WalletBlocksCommand(new WalletBlocksReceiver(app)));
        commandService.register(new WalletCommand(new WalletReceiver(app)));
        commandService.register(new WalletListCommand(new WalletListReceiver(app)));

        //  Vault
        commandService.register(new VaultDownloadCommand(new VaultDownloadReceiver(app)));
        commandService.register(new VaultInstallCommand(new VaultInstallReceiver(app)));
        commandService.register(new VaultUnsealCommand(new VaultUnsealReceiver(app)));
    }
}
