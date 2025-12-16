import { registerCommand } from "./types";
import axios from "axios";

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
            await reply(`📚 *${res.data.title}*\n\n${res.data.extract}\n\n🔗 ${res.data.content_urls.desktop.page}`);
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
        if (!city) return reply("Please provide city name");
        // Placeholder for weather API (needs key)
        await reply(`I can't fetch real live weather without an API key right now, but imagine it's sunny in ${city}! ☀️`);
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
