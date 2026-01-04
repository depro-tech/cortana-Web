import { registerCommand } from "./types";
import axios from "axios";

// ════════════════════════════════════════════════════════════════════════
//                                FINANCE
// ════════════════════════════════════════════════════════════════════════

registerCommand({
    name: "finance",
    description: "Get financial advice",
    category: "advisor",
    execute: async ({ reply }) => {
        const advice = [
            "Rule No. 1: Never lose money. Rule No. 2: Never forget rule No. 1. – Warren Buffett",
            "Do not save what is left after spending, but spend what is left after saving.",
            "The stock market is a device for transferring money from the impatient to the patient.",
            "Beware of little expenses. A small leak will sink a great ship.",
            "Compound interest is the eighth wonder of the world. He who understands it, earns it... he who doesn't... pays it.",
            "Never spend your money before you have it."
        ];
        await reply(`💰 *Financial Wisdom*\n\n${advice[Math.floor(Math.random() * advice.length)]}`);
    }
});

registerCommand({
    name: "invest",
    description: "Investment tips",
    category: "advisor",
    execute: async ({ reply }) => {
        const tips = [
            "Diversify your portfolio. Don't put all eggs in one basket.",
            "Invest in what you understand.",
            "Time in the market beats timing the market.",
            "Start early. The power of compounding is your best friend.",
            "Buy low, sell high. Simple concepts are the hardest to follow."
        ];
        await reply(`📈 *Investment Tip*\n\n${tips[Math.floor(Math.random() * tips.length)]}`);
    }
});

// ════════════════════════════════════════════════════════════════════════
//                                LIFE & MOTIVATION
// ════════════════════════════════════════════════════════════════════════

registerCommand({
    name: "advice",
    description: "General life advice",
    category: "advisor",
    execute: async ({ reply }) => {
        try {
            const res = await axios.get("https://api.adviceslip.com/advice");
            await reply(`💡 *Advice*\n\n${res.data.slip.advice}`);
        } catch {
            await reply("💡 Be the change you wish to see in the world.");
        }
    }
});

registerCommand({
    name: "motivation",
    description: "Motivational quote",
    category: "advisor",
    execute: async ({ reply }) => {
        try {
            const res = await axios.get("https://api.quotable.io/random?tags=inspirational");
            await reply(`🌟 *Motivation*\n\n"${res.data.content}"\n\n— ${res.data.author}`);
        } catch {
            const quotes = [
                "Believe you can and you're halfway there.",
                "It always seems impossible until it's done.",
                "Don't watch the clock; do what it does. Keep going."
            ];
            await reply(`🌟 *Motivation*\n\n"${quotes[Math.floor(Math.random() * quotes.length)]}"`);
        }
    }
});

registerCommand({
    name: "friendship",
    description: "Advice on friendship",
    category: "advisor",
    execute: async ({ reply }) => {
        const advice = [
            "A friend is someone who knows all about you and still loves you.",
            "True friendship comes when the silence between two people is comfortable.",
            "Friends show their love in times of trouble, not in happiness.",
            "Walk with the dreamers, the believers, the courageous, the cheerful, the planners, the doers, the successful people with their heads in the clouds and their feet on the ground."
        ];
        await reply(`🤝 *Friendship*\n\n${advice[Math.floor(Math.random() * advice.length)]}`);
    }
});

// ════════════════════════════════════════════════════════════════════════
//                                RELATIONSHIPS
// ════════════════════════════════════════════════════════════════════════

registerCommand({
    name: "dating",
    description: "Dating advice",
    category: "advisor",
    execute: async ({ reply }) => {
        const tips = [
            "Be yourself. Authenticity attracts the right people.",
            "Communication is key. Listen more than you speak.",
            "Don't rush love. Good things take time.",
            "Respect boundaries. No means no.",
            "Shared values are more important than shared hobbies."
        ];
        await reply(`❤️ *Dating Advice*\n\n${tips[Math.floor(Math.random() * tips.length)]}`);
    }
});

registerCommand({
    name: "marriage",
    description: "Marriage advice",
    category: "advisor",
    execute: async ({ reply }) => {
        const tips = [
            "Never stop dating your spouse.",
            "Forgive quickly. Don't go to bed angry.",
            "Marriage is not 50-50, it's 100-100.",
            "Laugh together often.",
            "Pick your battles. Is it worth the argument?"
        ];
        await reply(`💍 *Marriage Advice*\n\n${tips[Math.floor(Math.random() * tips.length)]}`);
    }
});

// ════════════════════════════════════════════════════════════════════════
//                                NATURE & HEALTH
// ════════════════════════════════════════════════════════════════════════

registerCommand({
    name: "nature",
    description: "Nature wisdom",
    category: "advisor",
    execute: async ({ reply }) => {
        const quotes = [
            "Look deep into nature, and then you will understand everything better. – Einstein",
            "In every walk with nature one receives far more than he seeks.",
            "The earth has music for those who listen.",
            "Nature does not hurry, yet everything is accomplished.",
            "To sit in the shade on a fine day and look upon verdure is the most perfect refreshment."
        ];
        await reply(`🌿 *Nature Wisdom*\n\n${quotes[Math.floor(Math.random() * quotes.length)]}`);
    }
});

registerCommand({
    name: "meditate",
    description: "Meditation prompt",
    category: "advisor",
    execute: async ({ reply }) => {
        const prompts = [
            "Close your eyes. Take a deep breath in... hold... and release. Repeat 5 times.",
            "Focus on your heartbeat. Feel the rhythm of life within you.",
            "Visualize a calm ocean. Listen to the waves crashing gently on the shore.",
            "Scan your body from head to toe. Release tension where you find it.",
            "Be present. The past is gone, the future is not here. Only this moment matters."
        ];
        await reply(`🧘 *Meditation Prompt*\n\n${prompts[Math.floor(Math.random() * prompts.length)]}`);
    }
});
