import bcrypt from 'bcrypt';
import { db } from './db';
import { loginCredentials } from '../shared/schema';
import { and, eq } from 'drizzle-orm';

export async function validateLogin(username: string, password: string): Promise<boolean> {
    try {
        // Find active credential with matching username
        const [credential] = await db.select()
            .from(loginCredentials)
            .where(
                and(
                    eq(loginCredentials.username, username),
                    eq(loginCredentials.isActive, true)
                )
            );

        if (!credential) {
            return false;
        }

        // Check if expired
        if (new Date() > new Date(credential.expiresAt)) {
            // Deactivate expired credential
            await db.update(loginCredentials)
                .set({ isActive: false })
                .where(eq(loginCredentials.id, credential.id));
            return false;
        }

        // Verify password
        const isValid = await bcrypt.compare(password, credential.passwordHash);
        return isValid;
    } catch (error) {
        console.error('Login validation error:', error);
        return false;
    }
}

// Cleanup expired credentials (can be run as a cron job)
export async function cleanupExpiredCredentials() {
    try {
        const result = await db.update(loginCredentials)
            .set({ isActive: false })
            .where(eq(loginCredentials.isActive, true));

        console.log('🧹 Cleaned up expired credentials');
    } catch (error) {
        console.error('Cleanup error:', error);
    }
}
