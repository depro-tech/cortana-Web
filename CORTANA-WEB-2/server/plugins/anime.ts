import { registerCommand } from "./types";
import axios from "axios";

registerCommand({
    name: "waifu",
    description: "Get random waifu image",
    category: "anime",
    execute: async ({ reply, sock, msg }) => {
        try {
            const res = await axios.get("https://api.waifu.pics/sfw/waifu");
            await sock.sendMessage(msg.key.remoteJid!, { image: { url: res.data.url }, caption: "🌸 Random Waifu" });
        } catch {
            await reply("❌ Failed to fetch image");
        }
    }
});

registerCommand({
    name: "neko",
    description: "Get random neko image",
    category: "anime",
    execute: async ({ reply, sock, msg }) => {
        try {
            const res = await axios.get("https://api.waifu.pics/sfw/neko");
            await sock.sendMessage(msg.key.remoteJid!, { image: { url: res.data.url }, caption: "🐱 Random Neko" });
        } catch {
            await reply("❌ Failed to fetch image");
        }
    }
});

registerCommand({
    name: "hug",
    description: "Hug someone",
    category: "interaction",
    execute: async ({ reply, sock, msg }) => {
        try {
            const res = await axios.get("https://api.waifu.pics/sfw/hug");
            await sock.sendMessage(msg.key.remoteJid!, { image: { url: res.data.url }, caption: "🫂 Sending a warm hug!" });
        } catch {
            await reply("🫂 *Hugs* (Image failed)");
        }
    }
});

registerCommand({
    name: "kiss",
    description: "Kiss someone",
    category: "interaction",
    execute: async ({ reply, sock, msg }) => {
        try {
            const res = await axios.get("https://api.waifu.pics/sfw/kiss");
            await sock.sendMessage(msg.key.remoteJid!, { image: { url: res.data.url }, caption: "💋 Sending a kiss!" });
        } catch {
            await reply("💋 *Kiss* (Image failed)");
        }
    }
});

registerCommand({
    name: "slap",
    description: "Slap someone",
    category: "interaction",
    execute: async ({ reply, sock, msg }) => {
        try {
            const res = await axios.get("https://api.waifu.pics/sfw/slap");
            await sock.sendMessage(msg.key.remoteJid!, { image: { url: res.data.url }, caption: "👋 SLAP!" });
        } catch {
            await reply("👋 *Slap* (Image failed)");
        }
    }
});

registerCommand({
    name: "poke",
    description: "Poke someone",
    category: "interaction",
    execute: async ({ reply, sock, msg }) => {
        try {
            const res = await axios.get("https://api.waifu.pics/sfw/poke");
            await sock.sendMessage(msg.key.remoteJid!, { image: { url: res.data.url }, caption: "👉 Poke!" });
        } catch {
            await reply("👉 *Poke* (Image failed)");
        }
    }
});
