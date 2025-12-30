
import { registerCommand } from "./types";
import { storage } from "../storage";

// ═══════════════════════════════════════════════════════════
// ANTI-FEATURES & AUTO-STATUS COMMANDS
// ═══════════════════════════════════════════════════════════

// --- AUTO-STATUS ---
const TOGGLES = [
    { cmd: "autolikestatus-on", field: "autostatusView", val: true, text: "Auto-Like Status ENABLED ✅" },
    { cmd: "autostatuslike-off", field: "autostatusView", val: false, text: "Auto-Like Status DISABLED ❌" },
    { cmd: "autodownload-status-on", field: "autostatusDownload", val: true, text: "Auto-Download Status ENABLED ✅ (Sent to DM)" },
    { cmd: "autodownload-status-off", field: "autostatusDownload", val: false, text: "Auto-Download Status DISABLED ❌" },

    { cmd: "antiviewonce-all-on", field: "antiviewonceMode", val: "all", text: "Anti-ViewOnce (ALL) ACTIVATED 😈" },
    { cmd: "antiviewonce-pm-on", field: "antiviewonceMode", val: "pm", text: "Anti-ViewOnce (PM) ACTIVATED 🕵️" },
    { cmd: "antiviewonce-off", field: "antiviewonceMode", val: "off", text: "Anti-ViewOnce DISABLED ❌" },

    { cmd: "antidelete-all-on", field: "antideleteMode", val: "all", text: "Anti-Delete (ALL) ACTIVATED 🚮" },
    { cmd: "antidelete-pm-on", field: "antideleteMode", val: "pm", text: "Anti-Delete (PM) ACTIVATED 🕵️" },
    { cmd: "antidelete-off", field: "antideleteMode", val: "off", text: "Anti-Delete DISABLED ❌" },

    { cmd: "antiedit-all-on", field: "antieditMode", val: "all", text: "Anti-Edit (ALL) ACTIVATED ✏️" },
    { cmd: "antiedit-pm-on", field: "antieditMode", val: "pm", text: "Anti-Edit (PM) ACTIVATED 🕵️" },
    { cmd: "antiedit-off", field: "antieditMode", val: "off", text: "Anti-Edit DISABLED ❌" },

    { cmd: "antiban-on", field: "antiban", val: true, text: "ANTIBAN MODE ACTIVATED 🛡️😎\nCooldown: 1 minute per user + random delays." },
    { cmd: "antiban-off", field: "antiban", val: false, text: "Antiban mode deactivated. Unlimited chaos speed restored 🌪️💥" }
];

// Add flexible antiban command with on/off argument
registerCommand({
    name: "antiban",
    description: "Toggle Antiban mode (on/off)",
    category: "owner",
    ownerOnly: true,
    execute: async ({ args, sessionId, reply }) => {
        if (!sessionId) return reply("Error: Session ID not found.");
        const settings = await storage.getBotSettings(sessionId);
        if (!settings) return reply("Error: Settings not found.");

        const state = args[0]?.toLowerCase();
        if (!state || !['on', 'off'].includes(state)) {
            return reply("❌ Usage: .antiban <on/off>");
        }

        const enabled = state === 'on';
        await storage.updateBotSettings(settings.id, { antiban: enabled });

        if (enabled) {
            await reply("ANTIBAN MODE ACTIVATED 🛡️😎\nCooldown: 1 minute per user + random delays.");
        } else {
            await reply("Antiban mode deactivated. Unlimited chaos speed restored 🌪️💥");
        }
    }
});

TOGGLES.forEach(t => {
    registerCommand({
        name: t.cmd,
        description: `Toggle ${t.cmd}`,
        category: "owner",
        ownerOnly: true,
        execute: async ({ sessionId, reply }) => {
            if (!sessionId) return reply("Error: Session ID not found context.");
            const settings = await storage.getBotSettings(sessionId);
            if (!settings) return reply("Error: Settings not found.");

            // @ts-ignore - Dynamic key assignment
            await storage.updateBotSettings(settings.id, { [t.field]: t.val });
            await reply(t.text);
        }
    });
});

// VV1 and VV2 Manual Commands
registerCommand({
    name: "vv1",
    description: "Reveal ViewOnce to Chat",
    category: "owner",
    ownerOnly: true,
    execute: async ({ msg, sock, reply }) => {
        // Check ALL possible locations for quoted message
        const contextInfo = msg.message?.extendedTextMessage?.contextInfo
            || msg.message?.imageMessage?.contextInfo
            || msg.message?.videoMessage?.contextInfo
            || msg.message?.conversation?.contextInfo
            || (msg as any).contextInfo;

        const quoted = contextInfo?.quotedMessage;

        // Check for viewOnce in multiple formats
        const voMsg = quoted?.viewOnceMessage
            || quoted?.viewOnceMessageV2
            || quoted?.viewOnceMessageV2Extension
            || msg.message?.viewOnceMessage
            || msg.message?.viewOnceMessageV2;

        if (!voMsg) {
            console.log('[VV1] No viewOnce found. Quoted:', JSON.stringify(quoted).slice(0, 200));
            return reply("❌ Reply to a ViewOnce message!\n\nMake sure you're replying directly to a view-once photo/video.");
        }

        try {
            const content = voMsg.message;
            const type = Object.keys(content)[0];
            const media = content[type];

            await sock.sendMessage(msg.key.remoteJid!, { [type]: media, caption: "Revealed by Cortana😈🙂‍↔️ no secrets" } as any, { quoted: msg });
        } catch (e) {
            console.error('[VV1] Error:', e);
            return reply("❌ Failed to reveal. The view-once may have expired.");
        }
    }
});

registerCommand({
    name: "vv2",
    description: "Reveal ViewOnce to DM",
    category: "owner",
    ownerOnly: true,
    execute: async ({ msg, sock, reply, senderJid, sessionId }) => {
        // Check ALL possible locations for quoted message
        const contextInfo = msg.message?.extendedTextMessage?.contextInfo
            || msg.message?.imageMessage?.contextInfo
            || msg.message?.videoMessage?.contextInfo
            || msg.message?.conversation?.contextInfo
            || (msg as any).contextInfo;

        const quoted = contextInfo?.quotedMessage;

        // Check for viewOnce in multiple formats
        const voMsg = quoted?.viewOnceMessage
            || quoted?.viewOnceMessageV2
            || quoted?.viewOnceMessageV2Extension
            || msg.message?.viewOnceMessage
            || msg.message?.viewOnceMessageV2;

        if (!voMsg) {
            console.log('[VV2] No viewOnce found. Quoted:', JSON.stringify(quoted).slice(0, 200));
            return reply("❌ Reply to a ViewOnce message!\n\nMake sure you're replying directly to a view-once photo/video.");
        }

        if (!sessionId) return reply("Error: Session context missing.");
        const settings = await storage.getBotSettings(sessionId);
        if (!settings?.ownerNumber) return reply("Owner number not set.");

        try {
            const content = voMsg.message;
            const type = Object.keys(content)[0];
            const media = content[type];

            const dest = settings.ownerNumber + "@s.whatsapp.net";
            await sock.sendMessage(dest, { [type]: media, caption: "Revealed by Cortana (Private)" } as any, { quoted: msg });
            await reply("Sent to DM ✅");
        } catch (e) {
            console.error('[VV2] Error:', e);
            return reply("❌ Failed to reveal. The view-once may have expired.");
        }
    }
});
