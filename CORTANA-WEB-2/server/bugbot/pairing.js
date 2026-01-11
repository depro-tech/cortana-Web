/**
 * ═══════════════════════════════════════════════════════════════
 * ☠️ CORTANA EXPLOIT - Pairing Code Handler
 * Handles pairing codes from website bug-link integration
 * ═══════════════════════════════════════════════════════════════
 */

const {
    default: makeWASocket,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    useMultiFileAuthState,
    DisconnectReason
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const path = require('path');
const fs = require('fs');
const config = require('./config');

// Store for active pairing sessions
const pairingSessions = new Map();

/**
 * Generate a pairing code for a phone number
 * Called when user requests pairing from website
 * 
 * @param {string} phoneNumber - Phone number to pair (with country code, no +)
 * @param {string} sessionId - Unique session identifier from website
 * @returns {Promise<{success: boolean, pairingCode?: string, error?: string}>}
 */
async function generatePairingCode(phoneNumber, sessionId) {
    try {
        // Validate phone number
        const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
        if (cleanNumber.length < 10 || cleanNumber.length > 15) {
            return { success: false, error: 'Invalid phone number format' };
        }

        // Check if already pairing
        if (pairingSessions.has(sessionId)) {
            const existing = pairingSessions.get(sessionId);
            if (existing.status === 'pairing') {
                return { success: false, error: 'Pairing already in progress for this session' };
            }
        }

        // Create session directory
        const sessionDir = path.join(__dirname, config.session.folderName, sessionId);
        if (!fs.existsSync(sessionDir)) {
            fs.mkdirSync(sessionDir, { recursive: true });
        }

        // Initialize auth state
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

        // Get latest Baileys version
        const { version } = await fetchLatestBaileysVersion();

        // Create socket for pairing
        const sock = makeWASocket({
            version,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
            },
            printQRInTerminal: false,
            browser: ['CORTANA EXPLOIT', 'Chrome', '120.0.0'],
            logger: pino({ level: 'silent' }),
            generateHighQualityLinkPreview: false,
            markOnlineOnConnect: false
        });

        // Store session
        pairingSessions.set(sessionId, {
            sock,
            phoneNumber: cleanNumber,
            status: 'pairing',
            createdAt: Date.now(),
            pairingCode: null
        });

        // Handle connection updates
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            const session = pairingSessions.get(sessionId);

            if (connection === 'open') {
                console.log(`[PAIRING] Session ${sessionId} connected successfully`);
                if (session) {
                    session.status = 'connected';
                }
            }

            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                console.log(`[PAIRING] Session ${sessionId} closed with status: ${statusCode}`);

                if (statusCode === DisconnectReason.loggedOut) {
                    // Session logged out, clean up
                    pairingSessions.delete(sessionId);
                    try {
                        fs.rmSync(sessionDir, { recursive: true, force: true });
                    } catch (e) {
                        console.error(`[PAIRING] Failed to delete session dir:`, e.message);
                    }
                }
            }
        });

        // Handle creds update
        sock.ev.on('creds.update', saveCreds);

        // Request pairing code
        const pairingCode = await sock.requestPairingCode(cleanNumber);

        // Update session with pairing code
        const session = pairingSessions.get(sessionId);
        if (session) {
            session.pairingCode = pairingCode;
        }

        console.log(`[PAIRING] Generated code for ${cleanNumber}: ${pairingCode}`);

        return {
            success: true,
            pairingCode: pairingCode,
            sessionId: sessionId,
            expiresIn: 60 // Pairing codes typically expire in 60 seconds
        };

    } catch (error) {
        console.error(`[PAIRING] Error generating code:`, error);
        return {
            success: false,
            error: error.message || 'Failed to generate pairing code'
        };
    }
}

/**
 * Check the status of a pairing session
 * @param {string} sessionId - Session identifier
 * @returns {{status: string, connected: boolean}}
 */
function checkPairingStatus(sessionId) {
    const session = pairingSessions.get(sessionId);

    if (!session) {
        return { status: 'not_found', connected: false };
    }

    return {
        status: session.status,
        connected: session.status === 'connected',
        phoneNumber: session.phoneNumber,
        createdAt: session.createdAt
    };
}

/**
 * Get the connected socket for a session
 * @param {string} sessionId - Session identifier
 * @returns {object|null} - Baileys socket or null
 */
function getSessionSocket(sessionId) {
    const session = pairingSessions.get(sessionId);
    if (session && session.status === 'connected') {
        return session.sock;
    }
    return null;
}

/**
 * Close and clean up a pairing session
 * @param {string} sessionId - Session identifier
 */
async function closeSession(sessionId) {
    const session = pairingSessions.get(sessionId);

    if (session) {
        try {
            if (session.sock) {
                await session.sock.logout();
            }
        } catch (e) {
            console.error(`[PAIRING] Error logging out session:`, e.message);
        }

        pairingSessions.delete(sessionId);

        // Clean up session files
        const sessionDir = path.join(__dirname, config.session.folderName, sessionId);
        try {
            if (fs.existsSync(sessionDir)) {
                fs.rmSync(sessionDir, { recursive: true, force: true });
            }
        } catch (e) {
            console.error(`[PAIRING] Error deleting session dir:`, e.message);
        }

        return true;
    }
    return false;
}

/**
 * Get all active sessions
 * @returns {Array} - List of session info
 */
function getAllSessions() {
    const sessions = [];
    for (const [id, session] of pairingSessions.entries()) {
        sessions.push({
            sessionId: id,
            phoneNumber: session.phoneNumber,
            status: session.status,
            createdAt: session.createdAt
        });
    }
    return sessions;
}

/**
 * Clean up expired pairing sessions (older than 5 minutes)
 */
function cleanupExpiredSessions() {
    const now = Date.now();
    const expiryTime = 5 * 60 * 1000; // 5 minutes

    for (const [sessionId, session] of pairingSessions.entries()) {
        if (session.status === 'pairing' && (now - session.createdAt) > expiryTime) {
            console.log(`[PAIRING] Cleaning up expired session: ${sessionId}`);
            closeSession(sessionId);
        }
    }
}

// Run cleanup every 2 minutes
setInterval(cleanupExpiredSessions, 2 * 60 * 1000);

module.exports = {
    generatePairingCode,
    checkPairingStatus,
    getSessionSocket,
    closeSession,
    getAllSessions
};
