
import R from 'ramda';

export class LockstepEntity {
    public key: string;
    public hash: string;

    add(key: string, hash: string) {
        this.key = key;
        this.hash = hash;

        return this;
    }

    stringify() {
        return JSON.stringify(this);
    }
    
    static from_json(data: any) {
        const store = new LockstepEntity();
        R.forEachObjIndexed((value, key) => { store[key] = value; }, data);
        return store;
    }

    static from_str(data: string) {
        data = JSON.parse(data);
        return this.from_json(data);
    }
}

