import { Injectable } from "@nestjs/common";
import { Settings } from "../config/settings.service";
import * as lmdb from 'node-lmdb';
import _ from 'underscore';
import { BlockEntity, Blocks } from "./entities/block.entity";
import { statSync } from "fs";

@Injectable()
export class LmdbService {
    private env: any;

    constructor(private readonly settings: Settings) {
        this.env = new lmdb.Env();
        this.env.open({
            path: settings.LMDBPath,
            mapSize: parseInt(settings.DatabaseSize.toString()), // maximum database size
            maxDbs: parseInt(settings.MaxDbs.toString())
        });
    }

    open_dbi(name: string) {
        try {
            return {
                database: this.env.openDbi({
                    name: name,
                    create: true,
                    keyIsBuffer: true
                }), name: name
            }
        } catch (error) {
            this.settings.logger_.error(error);
        }
    }

    get(dbi: any, key: string) {
        const txn = this.env.beginTxn({ readOnly: true });
        const data = txn.getString(dbi.database, new Buffer(key), { keyIsBuffer: true });
        txn.abort();
        return data;
    }

    put(dbi: any, key: string, value: string): void {
        const txn = this.env.beginTxn();
        txn.putString(dbi.database, new Buffer(key), value, { keyIsBuffer: true });
        txn.commit();
    }

    del(dbi: any, key: string): void {
        const txn = this.env.beginTxn();
        txn.del(dbi.database, new Buffer(key), { keyIsBuffer: true });
        txn.commit();
    }

    close(dbi: any) {
        dbi.database.close();
    }

    env_close(): void {
        this.env.close();
    }

    version() {
        return lmdb.version;
    }

    all_blocks(dbi: any) {
        const blocks: Blocks = new Blocks();
        const txn = this.env.beginTxn({ readOnly: true });
        const cursor = new lmdb.Cursor(txn, dbi.database, { keyIsBuffer: true });

        for (let found = cursor.goToFirst(); found !== null; found = cursor.goToNext()) {
            cursor.getCurrentString((key, data) => {
                const blockEntity = BlockEntity.from_str(data)
                blocks.push(blockEntity);
            })
        }

        cursor.close();
        txn.abort();

        return _.sortBy(blocks, 'timestamp');
    }

    search_blocks(dbi: any, value: string) {
        const blocks: Blocks = new Blocks();
        const txn = this.env.beginTxn({ readOnly: true });
        const cursor = new lmdb.Cursor(txn, dbi.database, { keyIsBuffer: true });

        for (let found = cursor.goToRange(new Buffer(value)); found !== null; found = cursor.goToNext()) {
            if (!found.toString().includes(value))
                break;
            cursor.getCurrentString((key, data) => {
                const blockEntity = BlockEntity.from_str(data)
                if (blockEntity != null)
                    blocks.push(blockEntity);
            });
        }

        cursor.close();
        txn.abort();

        return _.sortBy(blocks, 'timestamp');;
    }

    find_hash(dbi: any, value: string): BlockEntity {
        const txn = this.env.beginTxn({ readOnly: true });
        const cursor = new lmdb.Cursor(txn, dbi.database, { keyIsBuffer: true });
        let foo: boolean = false;
        let blockEntity: BlockEntity;

        for (let found = cursor.goToFirst(); found !== null; found = cursor.goToNext()) {
            cursor.getCurrentString((key, data) => {
                blockEntity = BlockEntity.from_str(data);
                if (blockEntity != null) {
                    if (value === blockEntity.hash) {
                        foo = true;
                    }
                }
            })

            if (foo) break;
        }

        cursor.close();
        txn.abort();

        return blockEntity = blockEntity != null ? blockEntity : null;
    }

    size(): number {
        return statSync(this.settings.MDBPath).size / 1024 / 1024;
    }

    info() {
        return this.env.info();
    }

    get txnid(): number {
        const infoma = this.info();
        return infoma.lastTxnId;
    }

    stat() {
        return this.env.stat();
    }
}