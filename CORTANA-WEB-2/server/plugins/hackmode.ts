import { registerCommand } from "./types";
import { delay } from "@whiskeysockets/baileys";

// Helper for realistic typing simulation
async function typeWriter(sock: any, remoteJid: string, text: string, speed = 50) {
    const msg = await sock.sendMessage(remoteJid, { text: "█" });
    let currentText = "";
    for (const char of text) {
        currentText += char;
        await sock.sendMessage(remoteJid, { text: currentText + "█", edit: msg.key });
        await delay(speed);
    }
    await sock.sendMessage(remoteJid, { text: currentText, edit: msg.key });
    return msg; // Return final message key if needed
}

// Helper for progress bars
async function progressBar(sock: any, remoteJid: string, title: string, finishText: string) {
    const bars = [
        "[░░░░░░░░░░] 0%",
        "[██░░░░░░░░] 20%",
        "[████░░░░░░] 40%",
        "[██████░░░░] 60%",
        "[████████░░] 80%",
        "[██████████] 100%"
    ];

    const msg = await sock.sendMessage(remoteJid, { text: `${title}\n${bars[0]}` });
    for (let i = 1; i < bars.length; i++) {
        await delay(800);
        await sock.sendMessage(remoteJid, { text: `${title}\n${bars[i]}`, edit: msg.key });
    }
    await delay(500);
    await sock.sendMessage(remoteJid, { text: finishText, edit: msg.key });
}

// ════════════════════════════════════════════════════════════════════════
//                                HACKMODE COMMANDS
// ════════════════════════════════════════════════════════════════════════

registerCommand({
    name: "cortanafk",
    description: "Intense loading simulation",
    category: "hackmode",
    execute: async ({ sock, msg }) => {
        const chats = msg.key.remoteJid!;
        const init = await sock.sendMessage(chats, { text: "😈 CORTANA F*CK IS LOADING..." });

        const sequence = [
            "😈 CORTANA F*CK IS LOADING... 10%",
            "😈😈 CORTANA F*CK IS LOADING... 30%",
            "😈😈😈 CORTANA F*CK IS LOADING... 50%",
            "😈😈😈💀 CORTANA F*CK IS LOADING... 70%",
            "😈😈😈💀🔌 CORTANA F*CK IS LOADING... 90%",
            "🦄😈 CORTANA EMPIRE ACTIVATED 100%"
        ];

        for (const frame of sequence) {
            await delay(700);
            await sock.sendMessage(chats, { text: frame, edit: init.key });
        }
    }
});

registerCommand({
    name: "hacktzap",
    description: "Simulate hacking a user",
    category: "hackmode",
    execute: async ({ sock, msg, args, reply }) => {
        const target = args[0] ? args[0].replace(/[^0-9]/g, '') + "@s.whatsapp.net" : msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!target) return reply("❌ Target required! Usage: .hacktzap <number/@user>");

        const chats = msg.key.remoteJid!;

        // 1. Loading Intro
        await typeWriter(sock, chats, "⚡ CONNECTING TO CORTANA EXPLOIT SERVER...", 30);
        await delay(500);

        // 2. Info Collection Simulation
        const init = await sock.sendMessage(chats, { text: `🔍 TARGET: +${target.split('@')[0]}\n[░░░░░░░░░░] INITIALIZING...` });

        const steps = [
            "🔍 COLLECTING USER METADATA...",
            "📡 BYPASSING 2FA PROTOCOLS...",
            "🔓 DECRYPTING WHATSAPP DATABASE...",
            "💉 INJECTING PAYLOAD: cortana_spyware_v4.apk...",
            "📸 ACCESSING CAMERA [FRONT/BACK]...",
            "🎤 RECORDING AUDIO STREAM...",
            "📂 DOWNLOADING GALLERY (14GB)..."
        ];

        for (const step of steps) {
            await delay(1200);
            await sock.sendMessage(chats, { text: `🔍 TARGET: +${target.split('@')[0]}\n[█████████░] PROCESSING\n\n> ${step}`, edit: init.key });
        }

        // 3. Fake Success Message
        await sock.sendMessage(chats, { text: `✅ HACK SUCCESSFUL ON TARGET +${target.split('@')[0]}\n\n📂 All files, chats, and audio streams have been uploaded to:\n📥 PORT: 5678 (SUDO DATABASE)\n🔗 URL: NULL://14.23.44.1\n\n😈 Enjoy Cortana Exploit...`, edit: init.key });
    }
});

registerCommand({
    name: "hackgc",
    description: "Simulate hacking the group",
    category: "hackmode",
    execute: async ({ sock, msg, reply }) => {
        const chats = msg.key.remoteJid!;

        // Ensure group
        if (!chats.endsWith('@g.us')) return reply("❌ This command is for groups only!");

        // Fetch Real Metadata for realism
        let groupName = "UNKNOWN GROUP";
        let participants: string[] = [];
        let admins: string[] = [];
        try {
            const metadata = await sock.groupMetadata(chats);
            groupName = metadata.subject;
            participants = metadata.participants.map(p => p.id);
            admins = metadata.participants.filter(p => p.admin).map(p => p.id);
        } catch { }

        // Intro
        const init = await sock.sendMessage(chats, { text: `☠️ INITIATING GROUP HIJACK PROTOCOL...` });
        await delay(1000);

        // Steps
        await sock.sendMessage(chats, { text: `📡 CAPTURING GROUP METADATA...\n\nNAME: "${groupName}"\nID: ${chats}`, edit: init.key });
        await delay(1500);

        await sock.sendMessage(chats, { text: `🔓 BYPASSING GROUP ENCRYPTION...`, edit: init.key });
        await delay(1500);

        // Simulate Hijacking Admins
        if (admins.length > 0) {
            for (const admin of admins) {
                await sock.sendMessage(chats, { text: `💉 ATTEMPTING TO HIJACK @${admin.split('@')[0]}...`, mentions: [admin], edit: init.key });
                await delay(800);
                await sock.sendMessage(chats, { text: `✅ ADMIN @${admin.split('@')[0]} SUCCESSFULLY COOKED 🍳`, mentions: [admin], edit: init.key });
                await delay(500);
            }
        }

        // Final Simulation
        await sock.sendMessage(chats, {
            text: `⚠️ GC HACK ATTEMPT SUCCESS ⚠️\n\n` +
                `📛 NAME: ${groupName}\n` +
                `👥 MEMBERS: ${participants.length} COOKED\n` +
                `👑 ADMINS: ${admins.length} NEUTRALIZED\n` +
                `\n` +
                `📂 SYSTEM FILE UPLOADED TO NULL URL LINK 14\n` +
                `📡 SERVING AT PORT 5678\n` +
                `😈 CORTANA EMPIRE REIGNS SUPREME 🦄`
            , edit: init.key
        });
    }
});

registerCommand({
    name: "hackall",
    description: "Simulate mass hacking everyone",
    category: "hackmode",
    execute: async ({ sock, msg, reply }) => {
        const chats = msg.key.remoteJid!;
        if (!chats.endsWith('@g.us')) return reply("❌ This command is for groups only!");

        let participants: string[] = [];
        try {
            const metadata = await sock.groupMetadata(chats);
            participants = metadata.participants.map(p => p.id);
        } catch { }

        const init = await sock.sendMessage(chats, { text: `☣️ PREPARING BIOLOGICAL SYSTEM ATTACK...` });
        await delay(1000);

        await sock.sendMessage(chats, { text: `👥 TARGETING ${participants.length} MEMBERS...`, edit: init.key });
        await delay(1500);

        // Hide tag simulation
        await sock.sendMessage(chats, { text: `👻 INJECTING GHOST TAGS (HIDE_TAG_V4)...`, edit: init.key });
        await delay(1500);

        const logs = [
            "🔴 DRAINING BATTERIES...",
            "📲 FREEZING SCREENS...",
            "🔥 OVERHEATING CPU CORES...",
            "🔊 PLAYING HIGH FREQUENCY NOISE...",
            "💀 FORMATTING SD CARDS..."
        ];

        for (const log of logs) {
            await delay(1000);
            await sock.sendMessage(chats, { text: `⚠️ ATTACK IN PROGRESS ⚠️\n\n${log}`, edit: init.key });
        }

        await sock.sendMessage(chats, {
            text: `🏁 MASS ATTACK COMPLETE\n\n` +
                `☠️ ${participants.length} DEVICES COMPROMISED\n` +
                `📉 TOTAL DATA STOLEN: 42.0 TB\n` +
                `\n` +
                `😈 NOBODY IS SAFE FROM CORTANA.`
            , edit: init.key
        });
    }
});

registerCommand({
    name: "systemhack",
    description: "Fake system takeover",
    category: "hackmode",
    execute: async ({ sock, msg }) => {
        const chats = msg.key.remoteJid!;
        await progressBar(sock, chats, "📟 ACCESSING MAINFRAME...", "✅ MAINFRAME BREACHED");
        await delay(500);
        await typeWriter(sock, chats, `
ROOT ACCESS: GRANTED
SYSTEM: CORTANA_OS_V4
USER: NULL
PASSWORD: *********

> EXECUTING RM -RF /
> DELETING SYSTEM32...
> BYE BYE 👋`, 30);
    }
});
