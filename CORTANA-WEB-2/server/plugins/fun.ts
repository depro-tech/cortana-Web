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

registerCommand({
    name: "truth",
    description: "Get a truth question",
    category: "game",
    execute: async ({ reply }) => {
        const truths = [
            "What's the most embarrassing thing you've ever done?",
            "What's your biggest fear?",
            "Have you ever lied to your best friend?",
            "What's your most awkward moment?",
            "Who was your first crush?",
            "What's the worst thing you've ever said to someone?",
            "Have you ever cheated on a test?",
            "What's your biggest secret?",
            "What's the most childish thing you still do?",
            "What's your biggest regret?"
        ];
        const truth = truths[Math.floor(Math.random() * truths.length)];
        await reply(`🎭 *Truth*\n\n${truth}`);
    }
});

registerCommand({
    name: "dare",
    description: "Get a dare challenge",
    category: "game",
    execute: async ({ reply }) => {
        const dares = [
            "Do 20 pushups right now!",
            "Send a message to your crush confessing your feelings",
            "Post an embarrassing selfie",
            "Call a random contact and sing 'Happy Birthday'",
            "Do your best impression of a celebrity",
            "Eat a spoonful of hot sauce",
            "Dance with no music for 1 minute",
            "Let someone else post on your status",
            "Speak in an accent for the next 3 messages",
            "Do 50 jumping jacks"
        ];
        const dare = dares[Math.floor(Math.random() * dares.length)];
        await reply(`🎯 *Dare*\n\n${dare}`);
    }
});

registerCommand({
    name: "math",
    aliases: ["mathquiz"],
    description: "Solve a math problem",
    category: "game",
    execute: async ({ reply }) => {
        const num1 = Math.floor(Math.random() * 50) + 1;
        const num2 = Math.floor(Math.random() * 50) + 1;
        const operations = ['+', '-', '*'];
        const operation = operations[Math.floor(Math.random() * operations.length)];

        let answer;
        switch (operation) {
            case '+': answer = num1 + num2; break;
            case '-': answer = num1 - num2; break;
            case '*': answer = num1 * num2; break;
        }

        await reply(`🧮 *Math Quiz*\n\nSolve: ${num1} ${operation} ${num2} = ?\n\nReply with your answer!`);
    }
});

registerCommand({
    name: "roast",
    description: "Get roasted",
    category: "fun",
    execute: async ({ reply }) => {
        const roasts = [
            "I'd agree with you, but then we'd both be wrong.",
            "You're not stupid; you just have bad luck thinking.",
            "If laughter is the best medicine, your face must be curing the world!",
            "I was going to give you a nasty look, but I see you already have one.",
            "You bring everyone so much joy... when you leave the room.",
            "I'd explain it to you, but I left my English-to-Dingbat dictionary at home."
        ];
        const roast = roasts[Math.floor(Math.random() * roasts.length)];
        await reply(`🔥 ${roast}`);
    }
});
