import bcrypt from 'bcrypt';
import { localStorage } from './local-storage';

export async function validateLogin(username: string, password: string): Promise<boolean> {
    try {
        // Find active credential with matching username
        const credential = await localStorage.findCredential(username);

        if (!credential) {
            return false;
        }

        const now = new Date();

        // 15-Minute Activation Rule:
        // If never used (firstUsedAt is null), check if created > 15 mins ago.
        if (credential.firstUsedAt === null) {
            const createdTime = new Date(credential.createdAt).getTime();
            const timeDiff = now.getTime() - createdTime;
            const fifteenMinutes = 15 * 60 * 1000;

            if (timeDiff > fifteenMinutes) {
                // Expired before first use - Delete it
                await localStorage.deleteCredential(credential.id);
                console.log(`❌ Login ${username} expired (unused > 15m). Deleted.`);
                return false;
            }

            // Valid first use - Set firstUsedAt
            await localStorage.updateCredential(credential.id, { firstUsedAt: now.toISOString() });
            console.log(`✅ Login ${username} activated (First use).`);
        }

        // Standard Expiry Check (24h/3d from creation)
        if (now > new Date(credential.expiresAt)) {
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
        await localStorage.deactivateExpiredCredentials();
        console.log('🧹 Cleaned up expired credentials');
    } catch (error) {
        console.error('Cleanup error:', error);
    }
}
