"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const os = require("os");
const fs = require("fs");
const dl = require("download");
const path_1 = require("path");
const os_1 = require("os");
const TANGRAM_DEFAULT_DIR = path_1.join(os_1.homedir(), '.tangramcli');
function getVaultLink(platform, version, callback) {
    function createHref(v) {
        const link = `https://releases.hashicorp.com/vault/${v}`;
        const arch = os.arch() === 'x64' ? 'amd64' : '386';
        let plat = 'unsupported';
        switch (platform) {
            case 'win32':
                plat = 'windows';
                break;
            case 'darwin':
                plat = platform;
                break;
            case 'linux':
                plat = platform;
                break;
            default:
                throw new Error(`Unsupported platform "${platform}"`);
        }
        return `${link}/vault_${v}_${plat}_${arch}.zip`;
    }
    if (version) {
        callback(null, createHref(version));
    }
    else {
        throw new Error(`Vault version not specified.`);
    }
}
exports.getVaultLink = getVaultLink;
function download(callback) {
    getVaultLink(os.platform(), '0.11.1', function (err, res) {
        if (err) {
            return callback(err);
        }
        dl(res, TANGRAM_DEFAULT_DIR, { extract: true }).then(() => {
            callback();
        });
    });
}
exports.download = download;
function write_default_config() {
    let vault_config = {
        "storage": {
            "file": {
                "path": path_1.join(TANGRAM_DEFAULT_DIR, 'wallet')
            }
        },
        "listener": {
            "tcp": {
                "address": "127.0.0.1:8200",
                "tls_disable": "true"
            }
        }
    };
    fs.writeFileSync(path_1.join(TANGRAM_DEFAULT_DIR, 'vault.json'), JSON.stringify(vault_config, null, 2));
}
exports.write_default_config = write_default_config;
if (!module.parent) {
    exports.download((err) => {
        if (err) {
            console.log(err.message);
            process.exit(1);
        }
        else {
            console.log('Vault download finished!');
            exports.write_default_config();
            process.exit(0);
        }
    });
}
//# sourceMappingURL=download.vault.js.map