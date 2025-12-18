import { registerCommand } from "./types";
import axios from "axios";

// ═══════════════════════════════════════════════════════════════
// SEARCH & INFORMATION COMMANDS
// ═══════════════════════════════════════════════════════════════

// GOOGLE SEARCH
registerCommand({
    name: "google",
    aliases: ["gsearch", "search"],
    description: "Search Google",
    category: "search",
    usage: ".google <query>",
    execute: async ({ args, reply }) => {
        const query = args.join(" ").trim();
        if (!query) return reply("❌ Provide a search query!\n\nUsage: .google Cortana bot");

        try {
            const response = await axios.get(`https://api.popcat.xyz/google?q=${encodeURIComponent(query)}`, {
                timeout: 15000
            });

            if (response.data?.results && response.data.results.length > 0) {
                let message = `🔍 *Google Search Results:* ${query}\n\n`;
                response.data.results.slice(0, 5).forEach((result: any, i: number) => {
                    message += `${i + 1}. *${result.title}*\n${result.description}\n🔗 ${result.url}\n\n`;
                });
                return reply(message);
            }

            return reply("❌ No results found!");
        } catch (error: any) {
            console.error('[GOOGLE] Error:', error);
            return reply("❌ Search failed!");
        }
    }
});

// WEATHER
registerCommand({
    name: "weather",
    aliases: ["clima"],
    description: "Get weather information",
    category: "search",
    usage: ".weather <city>",
    execute: async ({ args, reply }) => {
        const city = args.join(" ").trim();
        if (!city) return reply("❌ Provide a city name!\n\nUsage: .weather London");

        try {
            const response = await axios.get(`https://api.popcat.xyz/weather?q=${encodeURIComponent(city)}`, {
                timeout: 15000
            });

            if (response.data) {
                const w = response.data[0];
                const message = `🌡️ *Weather in ${w.location.name}, ${w.location.country}*\n\n` +
                    `📅 ${w.current.day}\n` +
                    `🌡️ Temperature: ${w.current.temperature}°${w.location.degreetype}\n` +
                    `💨 Wind: ${w.current.windspeed}\n` +
                    `💧 Humidity: ${w.current.humidity}\n` +
                    `☁️ Sky: ${w.current.skytext}\n` +
                    `👁️ Feels like: ${w.current.feelslike}°${w.location.degreetype}`;
                return reply(message);
            }

            return reply("❌ City not found!");
        } catch (error: any) {
            console.error('[WEATHER] Error:', error);
            return reply("❌ Weather lookup failed!");
        }
    }
});

// WIKIPEDIA
registerCommand({
    name: "wiki",
    aliases: ["wikipedia"],
    description: "Search Wikipedia",
    category: "search",
    usage: ".wiki <query>",
    execute: async ({ args, reply }) => {
        const query = args.join(" ").trim();
        if (!query) return reply("❌ Provide a search query!\n\nUsage: .wiki Python");

        try {
            const response = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`, {
                timeout: 15000
            });

            if (response.data?.extract) {
                const message = `📚 *Wikipedia*\n\n*${response.data.title}*\n\n${response.data.extract}\n\n🔗 ${response.data.content_urls.desktop.page}`;
                return reply(message);
            }

            return reply("❌ No Wikipedia article found!");
        } catch (error: any) {
            console.error('[WIKI] Error:', error);
            return reply("❌ Wikipedia search failed!");
        }
    }
});

// GITHUB USER
registerCommand({
    name: "github",
    aliases: ["gh", "githubuser"],
    description: "Get GitHub user information",
    category: "search",
    usage: ".github <username>",
    execute: async ({ args, reply, sock, msg }) => {
        const username = args[0];
        if (!username) return reply("❌ Provide a GitHub username!\n\nUsage: .github torvalds");

        try {
            const response = await axios.get(`https://api.github.com/users/${username}`, {
                timeout: 15000
            });

            if (response.data) {
                const user = response.data;
                const message = `🐙 *GitHub User: ${user.login}*\n\n` +
                    `📛 Name: ${user.name || 'N/A'}\n` +
                    `💼 Company: ${user.company || 'N/A'}\n` +
                    `📍 Location: ${user.location || 'N/A'}\n` +
                    `📝 Bio: ${user.bio || 'N/A'}\n` +
                    `👥 Followers: ${user.followers}\n` +
                    `👤 Following: ${user.following}\n` +
                    `📦 Public Repos: ${user.public_repos}\n` +
                    `🔗 ${user.html_url}`;

                if (user.avatar_url) {
                    await sock.sendMessage(msg.key.remoteJid, {
                        image: { url: user.avatar_url },
                        caption: message
                    });
                } else {
                    await reply(message);
                }
                return;
            }

            return reply("❌ User not found!");
        } catch (error: any) {
            console.error('[GITHUB] Error:', error);
            return reply("❌ GitHub lookup failed!");
        }
    }
});

// NPM PACKAGE
registerCommand({
    name: "npm",
    description: "Get NPM package information",
    category: "search",
    usage: ".npm <package>",
    execute: async ({ args, reply }) => {
        const pkg = args[0];
        if (!pkg) return reply("❌ Provide a package name!\n\nUsage: .npm axios");

        try {
            const response = await axios.get(`https://registry.npmjs.org/${pkg}`, {
                timeout: 15000
            });

            if (response.data) {
                const data = response.data;
                const latest = data['dist-tags']?.latest;
                const message = `📦 *NPM Package: ${data.name}*\n\n` +
                    `📝 Description: ${data.description || 'N/A'}\n` +
                    `🏷️ Latest Version: ${latest}\n` +
                    `👤 Author: ${data.author?.name || 'N/A'}\n` +
                    `📅 Modified: ${data.time[latest]?.split('T')[0] || 'N/A'}\n` +
                    `📜 License: ${data.license || 'N/A'}\n` +
                    `🔗 https://www.npmjs.com/package/${data.name}`;
                return reply(message);
            }

            return reply("❌ Package not found!");
        } catch (error: any) {
            console.error('[NPM] Error:', error);
            return reply("❌ NPM lookup failed!");
        }
    }
});

// DICTIONARY
registerCommand({
    name: "dictionary",
    aliases: ["dict", "define"],
    description: "Get word definition",
    category: "search",
    usage: ".dictionary <word>",
    execute: async ({ args, reply }) => {
        const word = args[0];
        if (!word) return reply("❌ Provide a word!\n\nUsage: .dictionary programming");

        try {
            const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`, {
                timeout: 15000
            });

            if (response.data && response.data.length > 0) {
                const entry = response.data[0];
                let message = `📖 *Dictionary: ${entry.word}*\n\n`;

                if (entry.phonetic) message += `🔊 ${entry.phonetic}\n\n`;

                entry.meanings.slice(0, 2).forEach((meaning: any) => {
                    message += `*${meaning.partOfSpeech}*\n`;
                    meaning.definitions.slice(0, 2).forEach((def: any, i: number) => {
                        message += `${i + 1}. ${def.definition}\n`;
                        if (def.example) message += `   _Example: ${def.example}_\n`;
                    });
                    message += '\n';
                });

                return reply(message);
            }

            return reply("❌ Word not found!");
        } catch (error: any) {
            console.error('[DICTIONARY] Error:', error);
            return reply("❌ Dictionary lookup failed!");
        }
    }
});

// MOVIE INFO
registerCommand({
    name: "movie",
    aliases: ["imdb", "film"],
    description: "Get movie information",
    category: "search",
    usage: ".movie <movie name>",
    execute: async ({ args, reply, sock, msg }) => {
        const query = args.join(" ").trim();
        if (!query) return reply("❌ Provide a movie name!\n\nUsage: .movie Inception");

        try {
            const response = await axios.get(`https://www.omdbapi.com/?t=${encodeURIComponent(query)}&apikey=72fdb1f`, {
                timeout: 15000
            });

            if (response.data && response.data.Response === 'True') {
                const movie = response.data;
                const message = `🎬 *${movie.Title}* (${movie.Year})\n\n` +
                    `⭐ Rating: ${movie.imdbRating}/10\n` +
                    `🎭 Genre: ${movie.Genre}\n` +
                    `⏱️ Runtime: ${movie.Runtime}\n` +
                    `👨‍💼 Director: ${movie.Director}\n` +
                    `🎭 Cast: ${movie.Actors}\n\n` +
                    `📝 Plot: ${movie.Plot}\n\n` +
                    `🏆 Awards: ${movie.Awards}`;

                if (movie.Poster && movie.Poster !== 'N/A') {
                    await sock.sendMessage(msg.key.remoteJid, {
                        image: { url: movie.Poster },
                        caption: message
                    });
                } else {
                    await reply(message);
                }
                return;
            }

            return reply("❌ Movie not found!");
        } catch (error: any) {
            console.error('[MOVIE] Error:', error);
            return reply("❌ Movie lookup failed!");
        }
    }
});

// ANIME INFO
registerCommand({
    name: "anime",
    description: "Get anime information",
    category: "search",
    usage: ".anime <anime name>",
    execute: async ({ args, reply, sock, msg }) => {
        const query = args.join(" ").trim();
        if (!query) return reply("❌ Provide an anime name!\n\nUsage: .anime Naruto");

        try {
            const response = await axios.get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=1`, {
                timeout: 15000
            });

            if (response.data?.data && response.data.data.length > 0) {
                const anime = response.data.data[0];
                const message = `🎌 *${anime.title}*\n\n` +
                    `⭐ Score: ${anime.score}/10\n` +
                    `📺 Episodes: ${anime.episodes || 'Unknown'}\n` +
                    `📅 Status: ${anime.status}\n` +
                    `🎭 Type: ${anime.type}\n` +
                    `📝 Synopsis: ${anime.synopsis?.substring(0, 300)}${anime.synopsis?.length > 300 ? '...' : ''}\n\n` +
                    `🔗 ${anime.url}`;

                if (anime.images?.jpg?.large_image_url) {
                    await sock.sendMessage(msg.key.remoteJid, {
                        image: { url: anime.images.jpg.large_image_url },
                        caption: message
                    });
                } else {
                    await reply(message);
                }
                return;
            }

            return reply("❌ Anime not found!");
        } catch (error: any) {
            console.error('[ANIME] Error:', error);
            return reply("❌ Anime lookup failed!");
        }
    }
});
