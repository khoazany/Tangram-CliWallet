import R from 'ramda';
import * as sodium from 'libsodium-wrappers';
import { MemberEntity } from './member.entity';

export interface IMessageEntityOptional {
    members?: Array<MemberEntity>;
}

export class MessageEntity {
    public hash: string
    public key: string
    public value: any
    public optional: IMessageEntityOptional

    add(key: string, value: any, params: IMessageEntityOptional) {
        this.key = key;
        this.value = value;
        this.optional = params
        this.hash = this.to_hash();
        return this;
    }

    to_hash() {
        const hash = sodium.crypto_generichash(64, sodium.from_string(this.key + this.value));
        return sodium.to_hex(hash);
    }

    stringify() {
        return JSON.stringify(this);
    }

    lock_stringify() {
        return JSON.stringify({ hash: this.hash, key: this.key, value: this.value });
    }

    value_stringify() {
        return JSON.stringify(this.value);
    }

    static from_json(data: any) {
        const message = new MessageEntity();
        R.forEachObjIndexed((value, key) => { message[key] = value; }, data);
        return message;
    }

    static from_str(data: string) {
        data = JSON.parse(data);
        return this.from_json(data);
    }
}