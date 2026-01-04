import { registerCommand } from "./types";
import axios from "axios";

registerCommand({
    name: "joke",
    description: "Get a random joke",
    category: "fun",
    execute: async ({ reply }) => {
        try {
            const response = await axios.get('https://official-joke-api.appspot.com/random_joke');
            const joke = response.data;
            await reply(`😂 *Joke Time!*\n\n${joke.setup}\n\n${joke.punchline}`);
        } catch {
            await reply("Why don't scientists trust atoms? Because they make up everything! 😄");
        }
    }
});

registerCommand({
    name: "meme",
    description: "Get a random meme",
    category: "fun",
    execute: async ({ reply, sock, msg }) => {
        try {
            const response = await axios.get('https://meme-api.com/gimme');
            const meme = response.data;

            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: meme.url },
                caption: `😂 *${meme.title}*\n\n👤 r/${meme.subreddit}\n⬆️ ${meme.ups} upvotes`
            });
        } catch (error: any) {
            await reply("❌ Failed to fetch meme. Try again!");
        }
    }
});

registerCommand({
    name: "quote",
    description: "Get an inspirational quote",
    category: "fun",
    execute: async ({ reply }) => {
        try {
            const response = await axios.get('https://api.quotable.io/random');
            const quote = response.data;
            await reply(`💭 *Quote of the Moment*\n\n"${quote.content}"\n\n— ${quote.author}`);
        } catch {
            await reply('💭 "The only way to do great work is to love what you do." — Steve Jobs');
        }
    }
});

registerCommand({
    name: "fact",
    description: "Get a random fact",
    category: "fun",
    execute: async ({ reply }) => {
        try {
            const response = await axios.get('https://uselessfacts.jsph.pl/random.json?language=en');
            const fact = response.data;
            await reply(`🤓 *Random Fact*\n\n${fact.text}`);
        } catch {
            await reply("🤓 *Random Fact*\n\nHoney never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old!");
        }
    }
});

// TRUTH & DARE moved to game.ts (to avoid duplicates)

registerCommand({
    name: "catfact",
    description: "Random cat fact",
    category: "fun",
    execute: async ({ reply }) => {
        try {
            const res = await axios.get("https://catfact.ninja/fact");
            await reply(`🐱 *Cat Fact*\n\n${res.data.fact}`);
        } catch {
            await reply("🐱 Cats sleep for 70% of their lives!");
        }
    }
});

registerCommand({
    name: "dogfact",
    description: "Random dog fact",
    category: "fun",
    execute: async ({ reply }) => {
        try {
            const res = await axios.get("https://dog-api.kinduff.com/api/facts");
            await reply(`🐶 *Dog Fact*\n\n${res.data.facts[0]}`);
        } catch {
            await reply("🐶 A dog's sense of smell is 40x better than yours!");
        }
    }
});

// INSULT, PICKUP, ADVICE, ROAST moved to love-diss.ts and advisor.ts
