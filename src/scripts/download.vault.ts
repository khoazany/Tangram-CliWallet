//import _7z = require('7zip')['7z'];
import childProcess = require('child_process');
import path = require('path');
import os = require('os');
const BIN_DIR = path.join(__dirname, '../bin');

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
    
    if(version) {
        callback(null, createHref(version));
    } else {
        //  TODO: Download the latest version.
        throw new Error(`Vault version not specified.`);
    }
}

export function install(callback) {
    let basename = null;


}


/* export function unpackZipWindows(bundle, callback) {
    const extract = childProcess.spawn(_7z, [
        'x',
        path.join(BIN_DIR, '.tbb.exe')
    ], { cwd: BIN_DIR });
} */
