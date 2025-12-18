import { registerCommand } from "./types";
import axios from "axios";
import yts from "yt-search";

registerCommand({
    name: "google",
    description: "Search Google",
    category: "search",
    execute: async ({ args, reply }) => {
        const query = args.join(" ");
        if (!query) return reply("Please provide search term");
        await reply(`🔍 Google Search Result for: ${query}\n\nhttps://google.com/search?q=${encodeURIComponent(query)}`);
    }
});

registerCommand({
    name: "wiki",
    aliases: ["wikipedia"],
    description: "Search Wikipedia",
    category: "search",
    execute: async ({ args, reply }) => {
        const query = args.join(" ");
        if (!query) return reply("Please provide search term");
        try {
            const res = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
            await reply(`📚 * ${ res.data.title }*\n\n${ res.data.extract } \n\n🔗 ${ res.data.content_urls.desktop.page } `);
        } catch {
            await reply("❌ Not found on Wikipedia");
        }
    }
});

registerCommand({
    name: "github",
    description: "Search GitHub User",
    category: "search",
    execute: async ({ args, reply }) => {
        const username = args[0];
        if (!username) return reply("Please provide username");
        try {
            const res = await axios.get(`https://api.github.com/users/${username}`);
        const data = res.data;
        await reply(`🐙 *GitHub Profile*\n\nName: ${data.name}\nBio: ${data.bio}\nRepos: ${data.public_repos}\nFollowers: ${data.followers}\nLink: ${data.html_url}`);
    } catch {
        await reply("❌ User not found");
    }
}
});

registerCommand({
    name: "weather",
    description: "Get Weather Info",
    category: "search",
    execute: async ({ args, reply }) => {
        const city = args.join(" ");
        if (!city) return reply("🙄 wrong 🙅 usage example weather Nairobi");
        try {
            // Free weather API
            const res = await axios.get(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
            const data = res.data;
            const current = data.current_condition[0];
            const location = data.nearest_area[0];

            let message = `🌤️ *Weather in ${location.areaName[0].value}, ${location.country[0].value}*\n\n`;
            message += `🌡️ *Temperature:* ${current.temp_C}°C (${current.temp_F}°F)\n`;
            message += `☁️ *Condition:* ${current.weatherDesc[0].value}\n`;
            message += `💨 *Wind:* ${current.windspeedKmph} km/h\n`;
            message += `💧 *Humidity:* ${current.humidity}%\n`;
            message += `👁️ *Visibility:* ${current.visibility} km\n`;
            message += `🌅 *Feels Like:* ${current.FeelsLikeC}°C`;

            await reply(message);
        } catch {
            await reply(`I can't fetch real live weather right now, but imagine it's sunny in ${city}! ☀️`);
        }
    }
});

registerCommand({
    name: "npm",
    description: "Search NPM Package",
    category: "search",
    execute: async ({ args, reply }) => {
        const query = args.join(" ");
        if (!query) return reply("Please provide package name");
        try {
            const res = await axios.get(`https://registry.npmjs.org/${query}`);
            const data = res.data;
            await reply(`📦 *NPM Package*\n\nName: ${data.name}\nDesc: ${data.description}\nVersion: ${data['dist-tags'].latest}\nLicense: ${data.license}`);
        } catch {
            await reply("❌ Package not found");
        }
    }
});

registerCommand({
    name: "define",
    description: "Define a word",
    category: "search",
    execute: async ({ args, reply }) => {
        const word = args[0];
        if (!word) return reply("Please provide a word");
        try {
            const res = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
            const def = res.data[0].meanings[0].definitions[0].definition;
            await reply(`📖 *Definition of ${word}*\n\n${def}`);
        } catch {
            await reply("❌ Definition not found");
        }
    }
});

// Lyrics command
registerCommand({
    name: "lyrics",
    description: "Get song lyrics",
    category: "search",
    usage: ".lyrics <song name>",
    execute: async ({ args, reply }) => {
        const query = args.join(" ").trim();

        if (!query) return reply("❌ Provide a song name!\n\nUsage: .lyrics despacito");

        try {
            await reply("🔍 Searching for lyrics...");

            // Try YT search first to get proper song info
            const search = await yts(query);
            if (search.videos.length > 0) {
                const video = search.videos[0];
                const songQuery = video.title;

                // Try lyrics API
                const response = await axios.get(`https://api-pink-venom.vercel.app/lyrics?q=${encodeURIComponent(songQuery)}`, {
                    timeout: 20000
                });

                if (response.data && response.data.lyrics) {
                    const { title, artist, lyrics } = response.data;
                    let message = `🎵 *${title}*\n`;
                    if (artist) message += `🎤 *Artist:* ${artist}\n`;
                    message += `\n${lyrics}`;

                    if (message.length > 60000) {
                        message = message.substring(0, 60000) + "\n\n... (lyrics truncated)";
                    }

                    return reply(message);
                }
            }

            return reply("❌ Lyrics not found. Try being more specific.");

        } catch (error: any) {
            return reply("❌ Failed to fetch lyrics. Please try again later.");
        }
    }
});

// Movie command
registerCommand({
    name: "movie",
    description: "Get movie information",
    category: "search",
    usage: ".movie <movie name>",
    execute: async ({ args, reply, sock, msg }) => {
        const query = args.join(" ").trim();

        if (!query) return reply("❌ Provide a movie name!\n\nUsage: .movie inception");

        try {
            await reply("🎬 Searching for movie...");

            // Try OMDB API
            const omdbKey = "trilogy"; // Public demo key
            const response = await axios.get(`http://www.omdbapi.com/?apikey=${omdbKey}&t=${encodeURIComponent(query)}`, {
                timeout: 15000
            });

            if (response.data && response.data.Response === "True") {
                const movie = response.data;
                let message = `🎬 *${movie.Title}* (${movie.Year})\n\n`;

                if (movie.Rated) message += `🔞 *Rated:* ${movie.Rated}\n`;
                if (movie.imdbRating) message += `⭐ *IMDB:* ${movie.imdbRating}/10\n`;
                if (movie.Genre) message += `🎭 *Genre:* ${movie.Genre}\n`;
                if (movie.Director) message += `🎥 *Director:* ${movie.Director}\n`;
                if (movie.Actors) message += `🎬 *Cast:* ${movie.Actors}\n`;
                if (movie.Runtime) message += `⏱️ *Duration:* ${movie.Runtime}\n`;

                message += `\n📖 *Plot:*\n${movie.Plot}`;

                // Send with poster
                if (movie.Poster && movie.Poster !== "N/A") {
                    await sock.sendMessage(msg.key.remoteJid, {
                        image: { url: movie.Poster },
                        caption: message
                    });
                } else {
                    await reply(message);
                }

                return;
            }

            return reply("❌ Movie not found. Try being more specific.");

        } catch (error: any) {
            return reply("❌ Failed to fetch movie info. Try again later.");
        }
    }
});
