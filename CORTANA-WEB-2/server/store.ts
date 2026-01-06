import { proto } from "@whiskeysockets/baileys";

interface CachedMessage {
    message: proto.IWebMessageInfo;
    timestamp: number;
}

export class MessageCache {
    private cache: Map<string, CachedMessage>;
    private readonly maxSize: number;
    private readonly ttlMs: number; // Time-to-live in milliseconds
    private cleanupInterval: NodeJS.Timeout | null = null;

    // OPTIMIZED FOR VPS: 200 msgs (was 500), 2 min TTL (was 5)
    constructor(maxSize: number = 200, ttlMs: number = 120000) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.ttlMs = ttlMs;

        // Auto-cleanup expired messages every 30 seconds (was 60)
        this.cleanupInterval = setInterval(() => this.cleanup(), 30000);
    }

    public add(key: string, message: proto.IWebMessageInfo) {
        // Evict oldest if at capacity
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) this.cache.delete(firstKey);
        }
        this.cache.set(key, { message, timestamp: Date.now() });
    }

    public get(key: string): proto.IWebMessageInfo | undefined {
        const entry = this.cache.get(key);
        if (!entry) return undefined;

        // Check TTL
        if (Date.now() - entry.timestamp > this.ttlMs) {
            this.cache.delete(key);
            return undefined;
        }
        return entry.message;
    }

    public has(key: string): boolean {
        return this.cache.has(key);
    }

    // Clear all messages (for memory cleanup)
    public clear(): void {
        this.cache.clear();
    }

    // Get current size (for monitoring)
    public size(): number {
        return this.cache.size;
    }

    // Remove expired messages
    private cleanup(): void {
        const now = Date.now();
        let cleaned = 0;
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > this.ttlMs) {
                this.cache.delete(key);
                cleaned++;
            }
        }
        // Only log if cleaned something significant
        if (cleaned > 10) {
            console.log(`[CACHE] Cleaned ${cleaned} expired messages. Size: ${this.cache.size}`);
        }
    }

    // Stop cleanup interval (for graceful shutdown)
    public destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.cache.clear();
    }
}

export const messageCache = new MessageCache();
