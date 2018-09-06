//import _7z = require('7zip')['7z'];
import childProcess = require('child_process');
import path = require('path');
import os = require('os');
import fs = require('fs');

import dl = require('download');

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

export function download(download_dir, callback) {
    getVaultLink(os.platform(), '0.11.0', function (err, res) {
        if (err) {
            return callback(err);
        }

        dl(res, download_dir, { extract: true }).then(() => {
            callback();
        });
    });
}