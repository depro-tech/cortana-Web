import { proto } from "@whiskeysockets/baileys";

export class MessageCache {
    private cache: Map<string, proto.IWebMessageInfo>;
    private readonly maxSize: number;

    constructor(maxSize: number = 1000) {
        this.cache = new Map();
        this.maxSize = maxSize;
    }

    public add(key: string, message: proto.IWebMessageInfo) {
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey)
             this.cache.delete(firstKey);
        }
        this.cache.set(key, message);
    }

    public get(key: string): proto.IWebMessageInfo | undefined {
        return this.cache.get(key);
    }

    public has(key: string): boolean {
        return this.cache.has(key);
    }
}

export const messageCache = new MessageCache();
