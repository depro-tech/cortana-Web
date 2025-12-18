import { registerCommand } from "./types";

// Sticker maker
registerCommand({
    name: "sticker",
    aliases: ["s"],
    description: "Convert image/video to sticker",
    category: "sticker",
    usage: ".sticker (reply to image/video)",
    execute: async ({ reply }) => {
        await reply("🎨 Sticker maker coming soon! This requires Baileys' sticker encoding functionality.");
    }
});

registerCommand({
    name: "steal",
    aliases: ["take"],
    description: "Steal sticker metadata",
    category: "sticker",
    usage: ".steal <pack>|<author> (reply to sticker)",
    execute: async ({ reply }) => {
        await reply("🎨 Sticker metadata editing coming soon!");
    }
});

registerCommand({
    name: "toimg",
    description: "Convert sticker to image",
    category: "sticker",
    usage: ".toimg (reply to sticker)",
    execute: async ({ reply }) => {
        await reply("🎨 Sticker to image conversion coming soon!");
    }
});

registerCommand({
    name: "smeme",
    description: "Add text to sticker/image",
    category: "sticker",
    usage: ".smeme <text> (reply to image/sticker)",
    execute: async ({ reply }) => {
        await reply("🎨 Meme maker coming soon!");
    }
});
