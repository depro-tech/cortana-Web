import { registerCommand } from "./types";

// Mock database for economy
const balances: Record<string, number> = {};
const bank: Record<string, number> = {};

registerCommand({
    name: "balance",
    aliases: ["bal"],
    description: "Check your balance",
    category: "economy",
    execute: async ({ senderJid, reply }) => {
        const user = senderJid;
        const cash = balances[user] || 0;
        const bankBal = bank[user] || 0;
        await reply(`💳 *Balance*\n\nCash: ${cash}\nBank: ${bankBal}`);
    }
});

registerCommand({
    name: "daily",
    description: "Claim daily reward",
    category: "economy",
    execute: async ({ senderJid, reply }) => {
        const user = senderJid;
        balances[user] = (balances[user] || 0) + 1000;
        await reply(`💰 You claimed your daily reward of 1000 coins!`);
    }
});

registerCommand({
    name: "weekly",
    description: "Claim weekly reward",
    category: "economy",
    execute: async ({ senderJid, reply }) => {
        const user = senderJid;
        balances[user] = (balances[user] || 0) + 5000;
        await reply(`💰 You claimed your weekly reward of 5000 coins!`);
    }
});

registerCommand({
    name: "work",
    description: "Work for money",
    category: "economy",
    execute: async ({ senderJid, reply }) => {
        const user = senderJid;
        const earnings = Math.floor(Math.random() * 500) + 100;
        balances[user] = (balances[user] || 0) + earnings;
        await reply(`💼 You worked and earned ${earnings} coins!`);
    }
});

registerCommand({
    name: "deposit",
    aliases: ["dep"],
    description: "Deposit money to bank",
    category: "economy",
    execute: async ({ senderJid, args, reply }) => {
        const amount = parseInt(args[0]);
        if (isNaN(amount)) return reply("❌ Please provide valid amount");
        if ((balances[senderJid] || 0) < amount) return reply("❌ Insufficient funds");

        balances[senderJid] -= amount;
        bank[senderJid] = (bank[senderJid] || 0) + amount;
        await reply(`🏦 Deposited ${amount} to bank.`);
    }
});

registerCommand({
    name: "withdraw",
    aliases: ["with"],
    description: "Withdraw money from bank",
    category: "economy",
    execute: async ({ senderJid, args, reply }) => {
        const amount = parseInt(args[0]);
        if (isNaN(amount)) return reply("❌ Please provide valid amount");
        if ((bank[senderJid] || 0) < amount) return reply("❌ Insufficient funds in bank");

        bank[senderJid] -= amount;
        balances[senderJid] = (balances[senderJid] || 0) + amount;
        await reply(`🏦 Withdrew ${amount} from bank.`);
    }
});

registerCommand({
    name: "rob",
    description: "Rob a user",
    category: "economy",
    execute: async ({ reply }) => {
        const success = Math.random() > 0.5;
        if (success) {
            const amount = Math.floor(Math.random() * 500);
            await reply(`🔫 You robbed a random person and got ${amount} coins!`);
        } else {
            await reply(`🚓 Police caught you! You lost 500 coins.`);
        }
    }
});
