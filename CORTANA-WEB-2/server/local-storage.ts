import fs from 'fs/promises';
import path from 'path';

interface TelegramUser {
    telegramId: string;
    firstTrialUsed: boolean;
    lastLoginGenerated: string | null;
    isPremium: boolean;
    premiumDays: string;
    premiumExpiresAt: string | null;
    createdAt: string;
}

interface LoginCredential {
    id: string;
    telegramId: string;
    username: string;
    passwordHash: string;
    createdAt: string;
    expiresAt: string;
    isActive: boolean;
    firstUsedAt: string | null; // Track first usage for 15m rule
}

interface LocalDatabase {
    users: TelegramUser[];
    credentials: LoginCredential[];
}

const DB_PATH = path.join(process.cwd(), 'telegram_db.json');

class LocalStorage {
    private async readDB(): Promise<LocalDatabase> {
        try {
            const data = await fs.readFile(DB_PATH, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            return { users: [], credentials: [] };
        }
    }

    private async writeDB(db: LocalDatabase): Promise<void> {
        await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
    }

    async getUser(telegramId: string): Promise<TelegramUser | null> {
        const db = await this.readDB();
        return db.users.find(u => u.telegramId === telegramId) || null;
    }

    async createOrUpdateUser(telegramId: string, data: Partial<TelegramUser>): Promise<void> {
        const db = await this.readDB();
        const index = db.users.findIndex(u => u.telegramId === telegramId);

        if (index >= 0) {
            db.users[index] = { ...db.users[index], ...data };
        } else {
            db.users.push({
                telegramId,
                firstTrialUsed: false,
                lastLoginGenerated: null,
                isPremium: false,
                premiumDays: '0',
                premiumExpiresAt: null,
                createdAt: new Date().toISOString(),
                ...data
            });
        }
        await this.writeDB(db);
    }

    async createCredential(credential: Omit<LoginCredential, 'id' | 'createdAt' | 'firstUsedAt'>): Promise<void> {
        const db = await this.readDB();
        db.credentials.push({
            ...credential,
            id: `cred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
            firstUsedAt: null
        });
        await this.writeDB(db);
    }

    async findCredential(username: string): Promise<LoginCredential | null> {
        const db = await this.readDB();
        return db.credentials.find(c => c.username === username && c.isActive) || null;
    }

    // Update a credential (e.g. set firstUsedAt)
    async updateCredential(id: string, updates: Partial<LoginCredential>): Promise<void> {
        const db = await this.readDB();
        const index = db.credentials.findIndex(c => c.id === id);
        if (index !== -1) {
            db.credentials[index] = { ...db.credentials[index], ...updates };
            await this.writeDB(db);
        }
    }

    // Delete a specific credential
    async deleteCredential(id: string): Promise<void> {
        const db = await this.readDB();
        db.credentials = db.credentials.filter(c => c.id !== id);
        await this.writeDB(db);
    }

    async deactivateExpiredCredentials(): Promise<void> {
        const db = await this.readDB();
        const now = new Date();
        db.credentials.forEach(cred => {
            if (cred.isActive && new Date(cred.expiresAt) < now) {
                cred.isActive = false;
            }
        });
        await this.writeDB(db);
    }

    async getPremiumUsers(): Promise<TelegramUser[]> {
        const db = await this.readDB();
        return db.users.filter(u => u.isPremium);
    }

    // Clear details to start afresh
    async clearAllCredentials(): Promise<void> {
        const db = await this.readDB();
        db.credentials = [];
        // Optional: Reset user generation stats if needed, but user only asked to clear sessions (logins)
        await this.writeDB(db);
    }
}

export const localStorage = new LocalStorage();
