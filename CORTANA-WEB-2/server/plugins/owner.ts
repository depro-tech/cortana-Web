import { registerCommand } from "./types";
import { storage } from "../storage";
import { delay } from "@whiskeysockets/baileys";

// Mock config for now, ideally this comes from storage or a config file
const config = {
    botName: 'CORTANA MD',
    premium: [] as string[],
    owners: [] as string[]
};

registerCommand({
    name: "block",
    description: "Block a user",
    category: "owner",
    execute: async ({ sock, args, reply }) => {
        const user = args[0] ? args[0] + '@s.whatsapp.net' : undefined;
        if (!user) return reply("❌ Please provide a number to block");
        await sock.updateBlockStatus(user, "block");
        await reply(`✅ Blocked ${user}`);
    }
});

registerCommand({
    name: "unblock",
    description: "Unblock a user",
    category: "owner",
    execute: async ({ sock, args, reply }) => {
        const user = args[0] ? args[0] + '@s.whatsapp.net' : undefined;
        if (!user) return reply("❌ Please provide a number to unblock");
        await sock.updateBlockStatus(user, "unblock");
        await reply(`✅ Unblocked ${user}`);
    }
});

registerCommand({
    name: "public",
    description: "Set bot to public mode",
    category: "owner",
    execute: async ({ reply }) => {
        // In a real app, save this to storage
        await reply("✅ Bot is now in public mode");
    }
});

registerCommand({
    name: "self",
    description: "Set bot to private/self mode",
    category: "owner",
    execute: async ({ reply }) => {
        await reply("✅ Bot is now in self mode");
    }
});

registerCommand({
    name: "bc",
    aliases: ["broadcast"],
    description: "Broadcast message to all chats",
    category: "owner",
    execute: async ({ sock, args, reply }) => {
        const text = args.join(" ");
        if (!text) return reply("❌ Please provide text to broadcast");

        const chats = await sock.groupFetchAllParticipating();
        const ids = Object.keys(chats);

        await reply(`📢 Sending broadcast to ${ids.length} chats...`);

        for (const id of ids) {
            await sock.sendMessage(id, { text: `*📢 BROADCAST*\n\n${text}` });
            await delay(1000); // 1s delay to avoid flood
        }

        await reply("✅ Broadcast sent");
    }
});

registerCommand({
    name: "addprem",
    description: "Add a premium user",
    category: "owner",
    execute: async ({ args, reply }) => {
        const user = args[0];
        if (!user) return reply("❌ Provide user number");
        if (!config.premium.includes(user)) {
            config.premium.push(user);
            // storage.updateUser(user, { isPremium: true }) // If schema supports it
        }
        await reply(`✅ Added ${user} to premium`);
    }
});

registerCommand({
    name: "delprem",
    description: "Remove a premium user",
    category: "owner",
    execute: async ({ args, reply }) => {
        const user = args[0];
        if (!user) return reply("❌ Provide user number");
        config.premium = config.premium.filter(u => u !== user);
        await reply(`✅ Removed ${user} from premium`);
    }
});
