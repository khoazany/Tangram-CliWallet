import R from 'ramda';

export class BlockEntity {
    public account: string;
    public previous: string;
    public balance: number;
    public cipher: string;
    public link: string;
    public change: string;
    public opcode: string;
    public signature: string;
    public work: string;
    public hash: string;
    public timestamp: number;

    stringify() {
        return JSON.stringify(this);
    }

    static from_json(data: any) {
        const store = new BlockEntity();
        R.forEachObjIndexed((value, key) => { store[key] = value; }, data);
        return store;
    }

    static from_str(data: string) {
        data = JSON.parse(data);
        return this.from_json(data);
    }
}

export class Blocks extends Array {
    static from_json(data) {
        const blocks = new Blocks();
        R.forEach((block) => { blocks.push(BlockEntity.from_json(block)); }, data);
        return blocks;
    }
}