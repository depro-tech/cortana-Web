
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
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const voMsg = quoted?.viewOnceMessage || quoted?.viewOnceMessageV2;
        if (!voMsg) return reply("Reply to a ViewOnce message!");

        const content = voMsg.message;
        const type = Object.keys(content)[0];
        const media = content[type];

        await sock.sendMessage(msg.key.remoteJid!, { [type]: media, caption: "Revealed by Cortana😈🙂‍↔️ no secrets" } as any, { quoted: msg });
    }
});

registerCommand({
    name: "vv2",
    description: "Reveal ViewOnce to DM",
    category: "owner",
    ownerOnly: true,
    execute: async ({ msg, sock, reply, senderJid, sessionId }) => { // Need sessionId/settings for owner num
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const voMsg = quoted?.viewOnceMessage || quoted?.viewOnceMessageV2;
        if (!voMsg) return reply("Reply to a ViewOnce message!");

        if (!sessionId) return reply("Error: Session context missing.");
        const settings = await storage.getBotSettings(sessionId);
        if (!settings?.ownerNumber) return reply("Owner number not set.");

        const content = voMsg.message;
        const type = Object.keys(content)[0];
        const media = content[type];

        const dest = settings.ownerNumber + "@s.whatsapp.net";
        await sock.sendMessage(dest, { [type]: media, caption: "Revealed by Cortana (Private)" } as any, { quoted: msg });
        await reply("Sent to DM ✅");
    }
});
