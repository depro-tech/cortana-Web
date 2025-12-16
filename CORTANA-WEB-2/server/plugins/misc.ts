import { registerCommand } from "./types";
import os from "os";

registerCommand({
    name: "poll",
    description: "Create a poll",
    category: "announcement",
    execute: async ({ args, sock, msg }) => {
        const text = args.join(" ");
        if (!text.includes("|")) return sock.sendMessage(msg.key.remoteJid!, { text: "Usage: .poll Question | Option1 | Option2..." });

        const [question, ...options] = text.split("|").map(s => s.trim());
        if (options.length < 2) return sock.sendMessage(msg.key.remoteJid!, { text: "Provide at least 2 options" });

        await sock.sendMessage(msg.key.remoteJid!, {
            poll: {
                name: question,
                values: options,
                selectableCount: 1
            }
        });
    }
});

registerCommand({
    name: "nightcore",
    description: "Nightcore effect",
    category: "music",
    execute: async ({ reply }) => {
        await reply("🎵 Nightcore effect requires ffmpeg processing (Coming soon)");
    }
});

registerCommand({
    name: "bass",
    description: "Bass boost effect",
    category: "music",
    execute: async ({ reply }) => {
        await reply("🎵 Bass boost effect requires ffmpeg processing (Coming soon)");
    }
});

registerCommand({
    name: "device",
    aliases: ["sys"],
    description: "System Info",
    category: "device",
    execute: async ({ reply }) => {
        const cpus = os.cpus();
        const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
        const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);

        await reply(`🖥️ *System Info*\n\nOS: ${os.type()} ${os.release()}\nCPU: ${cpus[0].model}\nCores: ${cpus.length}\nRAM: ${freeMem}GB / ${totalMem}GB\nUptime: ${(os.uptime() / 3600).toFixed(2)} hours`);
    }
});
