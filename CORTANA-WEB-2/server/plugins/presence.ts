import { registerCommand } from "./types";

// ═══════════════════════════════════════════════════════════
// AUTO-PRESENCE - Owner Commands for Fake Recording/Typing
// ═══════════════════════════════════════════════════════════

// In-memory presence settings (simple approach)
const presenceSettings = {
    autoRecording: 'off' as 'off' | 'all' | 'pm',
    autoTyping: 'off' as 'off' | 'all' | 'pm',
    autoRecordTyping: false,
    messageCounter: 0
};

registerCommand({
    name: "autorecording-all-on",
    description: "Enable fake recording audio in all chats",
    category: "owner",
    ownerOnly: true,
    execute: async ({ reply }) => {
        presenceSettings.autoRecording = 'all';
        presenceSettings.autoTyping = 'off';
        presenceSettings.autoRecordTyping = false;
        await reply("✅ *Auto-Recording Enabled*\n\n🎙️ Bot will show fake recording audio in all chats (groups + private messages)\n⏱️ Duration: 8 seconds per message");
    }
});

registerCommand({
    name: "autorecording-pm-on",
    description: "Enable fake recording audio in private messages only",
    category: "owner",
    ownerOnly: true,
    execute: async ({ reply }) => {
        presenceSettings.autoRecording = 'pm';
        presenceSettings.autoTyping = 'off';
        presenceSettings.autoRecordTyping = false;
        await reply("✅ *Auto-Recording Enabled (PM Only)*\n\n🎙️ Bot will show fake recording audio in private messages only\n❌ Groups: Disabled\n⏱️ Duration: 8 seconds per message");
    }
});

registerCommand({
    name: "autorecording-off",
    description: "Disable auto-recording",
    category: "owner",
    ownerOnly: true,
    execute: async ({ reply }) => {
        presenceSettings.autoRecording = 'off';
        await reply("❌ *Auto-Recording Disabled*\n\nBot will no longer show fake recording audio");
    }
});

registerCommand({
    name: "autotyping-all-on",
    description: "Enable fake typing in all chats",
    category: "owner",
    ownerOnly: true,
    execute: async ({ reply }) => {
        presenceSettings.autoTyping = 'all';
        presenceSettings.autoRecording = 'off';
        presenceSettings.autoRecordTyping = false;
        await reply("✅ *Auto-Typing Enabled*\n\n⌨️ Bot  will show fake typing in all chats (groups + private messages)\n⏱️ Duration: 8 seconds per message");
    }
});

registerCommand({
    name: "autotyping-pm-on",
    description: "Enable fake typing in private messages only",
    category: "owner",
    ownerOnly: true,
    execute: async ({ reply }) => {
        presenceSettings.autoTyping = 'pm';
        presenceSettings.autoRecording = 'off';
        presenceSettings.autoRecordTyping = false;
        await reply("✅ *Auto-Typing Enabled (PM Only)*\n\n⌨️ Bot will show fake typing in private messages only\n❌ Groups: Disabled\n⏱️ Duration: 8 seconds per message");
    }
});

registerCommand({
    name: "autotyping-off",
    description: "Disable auto-typing",
    category: "owner",
    ownerOnly: true,
    execute: async ({ reply }) => {
        presenceSettings.autoTyping = 'off';
        await reply("❌ *Auto-Typing Disabled*\n\nBot will no longer show fake typing");
    }
});

registerCommand({
    name: "autorecordtyping-on",
    description: "Alternate between recording and typing (all chats)",
    category: "owner",
    ownerOnly: true,
    execute: async ({ reply }) => {
        presenceSettings.autoRecordTyping = true;
        presenceSettings.autoRecording = 'off';
        presenceSettings.autoTyping = 'off';
        presenceSettings.messageCounter = 0;
        await reply("✅ *Auto-RecordTyping Enabled*\n\n🔄 Bot will alternate between:\n🎙️ Recording audio (odd messages)\n⌨️ Typing (even messages)\n\n📍 Works in all chats\n⏱️ Duration: 8 seconds per message");
    }
});

registerCommand({
    name: "autorecordtyping-off",
    description: "Disable auto-recordtyping",
    category: "owner",
    ownerOnly: true,
    execute: async ({ reply }) => {
        presenceSettings.autoRecordTyping = false;
        await reply("❌ *Auto-RecordTyping Disabled*\n\nBot will no longer alternate presence modes");
    }
});

registerCommand({
    name: "presence-status",
    description: "Check current presence settings",
    category: "owner",
    ownerOnly: true,
    execute: async ({ reply }) => {
        let status = "*🎭 Auto-Presence Status*\n\n";

        if (presenceSettings.autoRecordTyping) {
            status += "🔄 Mode: *Alternating Record/Type*\n";
            status += `📊 Messages received: ${presenceSettings.messageCounter}\n`;
            status += `⏭️ Next: ${presenceSettings.messageCounter % 2 === 0 ? 'Recording 🎙️' : 'Typing ⌨️'}\n`;
        } else if (presenceSettings.autoRecording !== 'off') {
            status += `🎙️ Recording: *${presenceSettings.autoRecording === 'all' ? 'ALL CHATS' : 'PM ONLY'}*\n`;
        } else if (presenceSettings.autoTyping !== 'off') {
            status += `⌨️ Typing: *${presenceSettings.autoTyping === 'all' ? 'ALL CHATS' : 'PM ONLY'}*\n`;
        } else {
            status += "❌ All presence modes: *DISABLED*\n";
        }

        status += "\n⏱️ Duration: 8 seconds per message";
        await reply(status);
    }
});

// Export presence settings for use in whatsapp.ts
export { presenceSettings };
