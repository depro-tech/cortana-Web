import { registerCommand } from "./types";
import axios from "axios";

// ═══════════════════════════════════════════════════════════════
// ANIME & MANGA COMMANDS
// ═══════════════════════════════════════════════════════════════

// WAIFU RANDOM IMAGE
registerCommand({
    name: "waifu",
    description: "Get random waifu image",
    category: "anime",
    execute: async ({ reply, sock, msg }) => {
        try {
            const response = await axios.get('https://api.waifu.pics/sfw/waifu', { timeout: 10000 });

            if (response.data?.url) {
                await sock.sendMessage(msg.key.remoteJid, {
                    image: { url: response.data.url },
                    caption: "💖 *Random Waifu*"
                });
                return;
            }

            return reply("❌ Failed to fetch w aifu!");
        } catch (error: any) {
            console.error('[WAIFU] Error:', error);
            return reply("❌ Waifu fetch failed!");
        }
    }
});

// NEKO RANDOM IMAGE
registerCommand({
    name: "neko",
    description: "Get random neko image",
    category: "anime",
    execute: async ({ reply, sock, msg }) => {
        try {
            const response = await axios.get('https://api.waifu.pics/sfw/neko', { timeout: 10000 });

            if (response.data?.url) {
                await sock.sendMessage(msg.key.remoteJid, {
                    image: { url: response.data.url },
                    caption: "🐱 *Random Neko*"
                });
                return;
            }

            return reply("❌ Failed to fetch neko!");
        } catch (error: any) {
            console.error('[NEKO] Error:', error);
            return reply("❌ Neko fetch failed!");
        }
    }
});

// ANIME QUOTE
registerCommand({
    name: "animequote",
    aliases: ["aquote"],
    description: "Get random anime quote",
    category: "anime",
    execute: async ({ reply }) => {
        try {
            const response = await axios.get('https://animechan.xyz/api/random', { timeout: 10000 });

            if (response.data) {
                const quote = response.data;
                const message = `💬 *Anime Quote*\n\n"${quote.quote}"\n\n— ${quote.character}\n📺 ${quote.anime}`;
                return reply(message);
            }

            return reply("❌ Failed to fetch quote!");
        } catch (error: any) {
            console.error('[ANIMEQUOTE] Error:', error);
            return reply("❌ Quote fetch failed!");
        }
    }
});

// MANGA SEARCH
registerCommand({
    name: "manga",
    description: "Search for manga information",
    category: "anime",
    usage: ".manga <manga name>",
    execute: async ({ args, reply, sock, msg }) => {
        const query = args.join(" ").trim();
        if (!query) return reply("❌ Provide a manga name!\n\nUsage: .manga One Piece");

        try {
            const response = await axios.get(`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(query)}&limit=1`, {
                timeout: 15000
            });

            if (response.data?.data && response.data.data.length > 0) {
                const manga = response.data.data[0];
                const message = `📖 *${manga.title}*\n\n` +
                    `⭐ Score: ${manga.score}/10\n` +
                    `📚 Chapters: ${manga.chapters || 'Unknown'}\n` +
                    `📊 Volumes: ${manga.volumes || 'Unknown'}\n` +
                    `📅 Status: ${manga.status}\n` +
                    `✍️ Authors: ${manga.authors?.map((a: any) => a.name).join(', ') || 'Unknown'}\n\n` +
                    `📝 Synopsis: ${manga.synopsis?.substring(0, 300)}${manga.synopsis?.length > 300 ? '...' : ''}\n\n` +
                    `🔗 ${manga.url}`;

                if (manga.images?.jpg?.large_image_url) {
                    await sock.sendMessage(msg.key.remoteJid, {
                        image: { url: manga.images.jpg.large_image_url },
                        caption: message
                    });
                } else {
                    await reply(message);
                }
                return;
            }

            return reply("❌ Manga not found!");
        } catch (error: any) {
            console.error('[MANGA] Error:', error);
            return reply("❌ Manga lookup failed!");
        }
    }
});

// CHARACTER INFO
registerCommand({
    name: "character",
    aliases: ["char", "animec"],
    description: "Search for anime character",
    category: "anime",
    usage: ".character <character name>",
    execute: async ({ args, reply, sock, msg }) => {
        const query = args.join(" ").trim();
        if (!query) return reply("❌ Provide a character name!\n\nUsage: .character Naruto");

        try {
            const response = await axios.get(`https://api.jikan.moe/v4/characters?q=${encodeURIComponent(query)}&limit=1`, {
                timeout: 15000
            });

            if (response.data?.data && response.data.data.length > 0) {
                const char = response.data.data[0];
                const message = `👤 *${char.name}*\n\n` +
                    `📛 Alternative Names: ${char.name_kanji || 'N/A'}\n` +
                    `❤️ Favorites: ${char.favorites}\n\n` +
                    `📝 About: ${char.about?.substring(0, 400)}${char.about?.length > 400 ? '...' : ''}\n\n` +
                    `🔗 ${char.url}`;

                if (char.images?.jpg?.image_url) {
                    await sock.sendMessage(msg.key.remoteJid, {
                        image: { url: char.images.jpg.image_url },
                        caption: message
                    });
                } else {
                    await reply(message);
                }
                return;
            }

            return reply("❌ Character not found!");
        } catch (error: any) {
            console.error('[CHARACTER] Error:', error);
            return reply("❌ Character lookup failed!");
        }
    }
});

// SHINOBU (More anime images)
registerCommand({
    name: "shinobu",
    description: "Get random shinobu image",
    category: "anime",
    execute: async ({ reply, sock, msg }) => {
        try {
            const response = await axios.get('https://api.waifu.pics/sfw/shinobu', { timeout: 10000 });

            if (response.data?.url) {
                await sock.sendMessage(msg.key.remoteJid, {
                    image: { url: response.data.url },
                    caption: "🦋 *Shinobu*"
                });
                return;
            }

            return reply("❌ Failed to fetch shinobu!");
        } catch (error: any) {
            console.error('[SHINOBU] Error:', error);
            return reply("❌ Shinobu fetch failed!");
        }
    }
});

// MEGUMIN
registerCommand({
    name: "megumin",
    description: "Get random Megumin image",
    category: "anime",
    execute: async ({ reply, sock, msg }) => {
        try {
            const response = await axios.get('https://api.waifu.pics/sfw/megumin', { timeout: 10000 });

            if (response.data?.url) {
                await sock.sendMessage(msg.key.remoteJid, {
                    image: { url: response.data.url },
                    caption: "💥 *Megumin*"
                });
                return;
            }

            return reply("❌ Failed to fetch megumin!");
        } catch (error: any) {
            console.error('[MEGUMIN] Error:', error);
            return reply("❌ Megumin fetch failed!");
        }
    }
});

// RANDOM ANIME WALLPAPER
registerCommand({
    name: "animewallpaper",
    aliases: ["animewall", "awallpaper"],
    description: "Get random anime wallpaper",
    category: "anime",
    execute: async ({ reply, sock, msg }) => {
        try {
            const response = await axios.get('https://picsum.photos/1920/1080', {
                timeout: 10000,
                maxRedirects: 1
            }).catch(async () => {
                // Fallback to anime-specific API
                const backup = await axios.get('https://nekos.best/api/v2/wallpaper', { timeout: 10000 });
                return { data: backup.data.results[0].url };
            });

            const wallpaperUrl = typeof response.data === 'string' ? response.data : response.data.url;

            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: wallpaperUrl },
                caption: "🖼️ *Random Anime Wallpaper*"
            });
            return;

        } catch (error: any) {
            console.error('[ANIMEWALLPAPER] Error:', error);
            return reply("❌ Wallpaper fetch failed!");
        }
    }
});
