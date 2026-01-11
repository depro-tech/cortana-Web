/**
 * ═══════════════════════════════════════════════════════════════
 * ☠️ CORTANA EXPLOIT - Bug Bot Main Entry Point
 * Isolated WhatsApp Bug/Exploit Bot
 * ═══════════════════════════════════════════════════════════════
 * 
 * Usage:
 *   node index.js
 * 
 * This starts the Bug Bot as a standalone process, separate from
 * the main MD Bot, to prevent token mismatch errors.
 * ═══════════════════════════════════════════════════════════════
 */

const {
    default: makeWASocket,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    useMultiFileAuthState,
    DisconnectReason,
    Browsers,
    proto,
    generateWAMessageFromContent,
    prepareWAMessageMedia
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const path = require('path');
const fs = require('fs');
const readline = require('readline');
const config = require('./config');
const bugHandler = require('./bughandler');

// Session directory
const SESSION_DIR = path.join(__dirname, config.session.folderName);

// Logger
const logger = pino({ level: 'silent' });

// Global store for message handling
const store = {};

// Console banner
function printBanner() {
    console.log('\x1b[35m');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('         ☠️  CORTANA EXPLOIT - BUG BOT ENGINE  ☠️');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`    Version: ${config.version}`);
    console.log(`    Status:  ${config.status.public ? 'Public' : 'Private'} Mode`);
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('\x1b[0m');
}

/**
 * Initialize the Bug Bot connection
 */
async function startBugBot() {
    printBanner();

    // Ensure session directory exists
    if (!fs.existsSync(SESSION_DIR)) {
        fs.mkdirSync(SESSION_DIR, { recursive: true });
    }

    // Load auth state
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

    // Get latest Baileys version
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`[INFO] Using Baileys v${version.join('.')} (${isLatest ? 'latest' : 'outdated'})`);

    // Create socket
    const sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger)
        },
        printQRInTerminal: config.session.printQRInTerminal,
        browser: Browsers.ubuntu('CORTANA'),
        logger,
        generateHighQualityLinkPreview: false,
        markOnlineOnConnect: true,
        syncFullHistory: false
    });

    // Add decodeJid helper
    sock.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            const decoded = jidDecode(jid) || {};
            return decoded.user && decoded.server
                ? `${decoded.user}@${decoded.server}`
                : jid;
        }
        return jid;
    };

    // Add public flag
    sock.public = config.status.public;

    // ═══════ CONNECTION HANDLER ═══════
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr && !state.creds.registered) {
            // Request pairing code if not registered
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            rl.question('\x1b[33m[INPUT] Enter your phone number (with country code, e.g., 254xxx): \x1b[0m', async (phoneNumber) => {
                rl.close();
                try {
                    const code = await sock.requestPairingCode(phoneNumber.replace(/[^0-9]/g, ''));
                    console.log(`\x1b[32m[PAIRING] Your pairing code: ${code}\x1b[0m`);
                    console.log('\x1b[36m[INFO] Enter this code in WhatsApp: Settings > Linked Devices > Link a Device\x1b[0m');
                } catch (e) {
                    console.error('\x1b[31m[ERROR] Failed to get pairing code:', e.message, '\x1b[0m');
                }
            });
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const reason = DisconnectReason[statusCode] || statusCode;

            console.log(`\x1b[31m[DISCONNECT] Connection closed - Reason: ${reason}\x1b[0m`);

            if (statusCode === DisconnectReason.loggedOut) {
                console.log('\x1b[31m[ERROR] Session logged out. Please delete session folder and restart.\x1b[0m');
                // Clean up session
                try {
                    fs.rmSync(SESSION_DIR, { recursive: true, force: true });
                } catch (e) {
                    console.error('[ERROR] Failed to clean session:', e.message);
                }
                process.exit(1);
            } else if (statusCode !== DisconnectReason.restartRequired) {
                // Reconnect after delay
                console.log('\x1b[33m[INFO] Reconnecting in 5 seconds...\x1b[0m');
                setTimeout(startBugBot, 5000);
            } else {
                startBugBot();
            }
        }

        if (connection === 'open') {
            console.log('\x1b[32m[SUCCESS] ☠️ CORTANA EXPLOIT Bug Bot is now connected!\x1b[0m');
            console.log(`\x1b[36m[INFO] Bot Number: ${sock.user?.id?.split(':')[0] || 'Unknown'}\x1b[0m`);
            console.log('\x1b[36m[INFO] Type .menu in WhatsApp to see available commands\x1b[0m');
        }
    });

    // ═══════ CREDS UPDATE ═══════
    sock.ev.on('creds.update', saveCreds);

    // ═══════ MESSAGE HANDLER ═══════
    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const m = chatUpdate.messages[0];
            if (!m.message) return;

            // Skip status messages unless configured
            if (m.key.remoteJid === 'status@broadcast' && !config.status.reactsw) {
                return;
            }

            // Process message
            m.message = (
                Object.keys(m.message)[0] === 'ephemeralMessage'
                    ? m.message.ephemeralMessage.message
                    : m.message
            );

            // Add message type
            if (m.message) {
                m.mtype = Object.keys(m.message)[0] === 'viewOnceMessageV2'
                    ? Object.keys(m.message.viewOnceMessageV2.message)[0]
                    : Object.keys(m.message)[0] === 'viewOnceMessageV2Extension'
                        ? Object.keys(m.message.viewOnceMessageV2Extension.message)[0]
                        : Object.keys(m.message)[0];
            }

            // Add sender
            m.sender = m.key.fromMe
                ? (sock.user?.id?.split(':')[0] + '@s.whatsapp.net')
                : (m.key.participant || m.key.remoteJid);

            // Add chat
            m.chat = m.key.remoteJid;

            // Add text helper
            m.text = m.message?.conversation ||
                m.message?.extendedTextMessage?.text ||
                m.message?.imageMessage?.caption ||
                m.message?.videoMessage?.caption ||
                '';

            // Add isGroup
            m.isGroup = m.chat?.endsWith('@g.us') || false;

            // Log message if terminal logging is enabled
            if (config.status.terminal) {
                const from = m.chat?.split('@')[0] || 'unknown';
                const msgType = m.mtype || 'unknown';
                const preview = (m.text || '').substring(0, 50);
                console.log(`\x1b[90m[MSG] ${from} (${msgType}): ${preview}${preview.length >= 50 ? '...' : ''}\x1b[0m`);
            }

            // Call bug handler
            await bugHandler(sock, m, chatUpdate, store);

        } catch (err) {
            console.error('\x1b[31m[ERROR] Message handler error:', err.message, '\x1b[0m');
        }
    });

    // ═══════ GROUP PARTICIPANT UPDATE ═══════
    sock.ev.on('group-participants.update', async (update) => {
        // Handle group participant updates if needed
        // This can be extended for anti-leave, welcome messages, etc.
    });

    return sock;
}

// ═══════ GRACEFUL SHUTDOWN ═══════
process.on('SIGINT', () => {
    console.log('\n\x1b[33m[INFO] Shutting down Bug Bot...\x1b[0m');
    process.exit(0);
});

process.on('uncaughtException', (err) => {
    console.error('\x1b[31m[FATAL] Uncaught Exception:', err, '\x1b[0m');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('\x1b[31m[FATAL] Unhandled Rejection:', reason, '\x1b[0m');
});

// ═══════ START THE BOT ═══════
startBugBot();
