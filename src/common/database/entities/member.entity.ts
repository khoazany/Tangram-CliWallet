import R from 'ramda';

export class MemberEntity {
    public key: string
    public hostname: string
    public port: number

    add(hostname: string, port: number, key?: string) {
        this.hostname = hostname;
        this.port = port;
        this.key = key;
        return this;
    }

    stringify() {
        return JSON.stringify(this);
    }
    
    static from_json(data: any) {
        const store = new MemberEntity();
        R.forEachObjIndexed((value, key) => { store[key] = value; }, data);
        return store;
    }
}