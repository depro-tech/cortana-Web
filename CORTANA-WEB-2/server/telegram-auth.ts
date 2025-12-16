import bcrypt from 'bcrypt';
import { localStorage } from './local-storage';

export async function validateLogin(username: string, password: string): Promise<boolean> {
    try {
        // Find active credential with matching username
        const credential = await localStorage.findCredential(username);

        if (!credential) {
            return false;
        }

        // Check if expired
        if (new Date() > new Date(credential.expiresAt)) {
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
