//import _7z = require('7zip')['7z'];
import childProcess = require('child_process');
import path = require('path');
import os = require('os');
import fs = require('fs');

import dl = require('download');

import { spawn, ChildProcess } from 'child_process'
import { join } from 'path';
import { homedir } from 'os';

const TANGRAM_DEFAULT_DIR = join(homedir(), '.tangramcli');

export function getVaultLink(platform, version, callback) {
    function createHref(v) {
        const link = `https://releases.hashicorp.com/vault/${v}`

        //  TODO: Other archs?
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
                throw new Error(`Unsupported platform "${platform}"`)
        }

        return `${link}/vault_${v}_${plat}_${arch}.zip`
    }

    if (version) {
        callback(null, createHref(version));
    } else {
        //  TODO: Download the latest version.
        throw new Error(`Vault version not specified.`);
    }
}

export function download(callback) {
    getVaultLink(os.platform(), '0.11.1', function (err, res) {
        if (err) {
            return callback(err);
        }

        dl(res, TANGRAM_DEFAULT_DIR, { extract: true }).then(() => {
            callback();
        });
    });
}

export function write_default_config() {
    let vault_config = {
        "storage": {
            "file": {
                "path": join(TANGRAM_DEFAULT_DIR, 'wallet')
            }
        },
        "listener": {
            "tcp": {
                "address": "127.0.0.1:8200",
                "tls_disable": "true"
            }
        }
    }

    fs.writeFileSync(join(TANGRAM_DEFAULT_DIR, 'vault.json'), JSON.stringify(vault_config, null, 2));
}

if (!module.parent) {
    exports.download((err) => {
        if (err) {
            console.log(err.message);
            process.exit(1);
        } else {
            console.log('Vault download finished!')

            exports.write_default_config();

            process.exit(0);
        }
    });
}
