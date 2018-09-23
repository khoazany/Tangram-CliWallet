import * as sodium from 'sodium-native';

export class SodiumService {

    public hash_pwd(password: string, seed: string) {
        const out = Buffer.alloc(64);
        const passwd = Buffer.from(password);
        const salt = Buffer.alloc(sodium.randombytes_SEEDBYTES, seed);
        const opslimit = sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE;
        const memlimit = sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE;
        const algo = sodium.crypto_pwhash_ALG_DEFAULT;

        sodium.crypto_pwhash(out, passwd, salt, opslimit, memlimit, algo);
        return out;
    }

    public random_seed() {
        const seed = Buffer.allocUnsafe(sodium.randombytes_SEEDBYTES);
        
        sodium.randombytes_buf(seed);
        return seed;
    }

    public random_pwd() {
        const buf = Buffer.alloc(16);
        const seed = Buffer.allocUnsafe(sodium.randombytes_SEEDBYTES);

        sodium.randombytes_buf(seed);
        sodium.randombytes_buf_deterministic(buf, seed);
        return buf;
    }
    
    public generic_hash(value: string) {
        const buf = Buffer.from(value);
        const out = Buffer.alloc(sodium.crypto_generichash_BYTES);

        sodium.crypto_generichash(out, buf);
        return out;
    }
}