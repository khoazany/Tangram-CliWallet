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

import { VaultDownloadCommand, VaultDownloadReceiver } from './wallet/vault.download.command';
import { VaultInstallCommand, VaultInstallReceiver } from './wallet/vault.install.command';

export class Commands {
    public static async registerCommands(app) {
        const commandService = await app.get(CommandService);
        let settings = await app.get(Settings);

        //  Settings
        commandService.register(new SetNodeEndpointCommand(new SetNodeEndpointReceiver(settings)));

        //  Wallet
        commandService.register(new WalletCreateCommand(new WalletCreateReceiver(settings)));
        commandService.register(new WalletAddressCommand(new WalletAddressReceiver(settings)));
        commandService.register(new WalletRewardCommand(new WalletRewardReceiver(settings)));
        commandService.register(new WalletTransferFundsCommand(new WalletTransferFundsReceiver(settings)));
        commandService.register(new WalletBalanceCommand(new WalletBalanceReceiver(settings)));
        commandService.register(new WalletBlocksCommand(new WalletBlocksReceiver(settings)));
        commandService.register(new WalletCommand(new WalletReceiver(settings)));

        //  Vault
        commandService.register(new VaultDownloadCommand(new VaultDownloadReceiver(settings)));
        commandService.register(new VaultInstallCommand(new VaultInstallReceiver(settings)));
    }
}
