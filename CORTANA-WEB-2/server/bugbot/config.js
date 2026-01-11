/**
 * ═══════════════════════════════════════════════════════
 * ☠️ CORTANA EXPLOIT - Bug Bot Configuration
 * Isolated Bug Bot Engine v1.0.0
 * ═══════════════════════════════════════════════════════
 */

const path = require('path');

const config = {
    // Bot Identity
    botName: "CORTANA EXPLOIT",
    version: "1.0.0",

    // Owner/Admin Numbers (without @s.whatsapp.net suffix)
    owner: [],  // Add your numbers here, e.g., ["254712345678"]

    // Premium users loaded from database
    premiumPath: path.join(__dirname, './database/premium.json'),
    ownerPath: path.join(__dirname, './database/owner.json'),
    reselerPath: path.join(__dirname, './database/reseler.json'),

    // Newsletter/Channel for verified badge
    newsletter: {
        name: "☠️ CORTANA EXPLOIT",
        jid: "120363317388829921@newsletter",
        serverMessageId: 143
    },

    // Protected numbers (will not be targeted)
    blockedNumbers: [
        "6285814233961@s.whatsapp.net"  // Original dev protection
    ],

    // Branding
    branding: {
        title: "☠️ CORTANA EXPLOIT",
        footer: "📲 t.me/eduqariz | © 2026",
        thumbnailUrl: "https://files.catbox.moe/jbuybw.jpg",
        audioUrl: "https://files.catbox.moe/9w750j.mp3"
    },

    // Bot Status
    status: {
        public: true,      // true = responds to everyone, false = owner only
        terminal: true,    // Log to terminal
        reactsw: false     // React to status messages
    },

    // Exploit Settings
    exploitSettings: {
        defaultLoopCount: 800,      // Default loop iterations for exploits
        delayBetweenCalls: 1500,    // ms between exploit calls
        maxLoopCount: 1000          // Maximum allowed loop iterations
    },

    // Session Settings
    session: {
        folderName: "bugbot_sessions",
        printQRInTerminal: true
    }
};

module.exports = config;

// Hot reload support
const file = require.resolve(__filename);
require('fs').watchFile(file, () => {
    require('fs').unwatchFile(file);
    console.log('\x1b[0;32m' + __filename + ' \x1b[1;32mupdated!\x1b[0m');
    delete require.cache[file];
    require(file);
});
