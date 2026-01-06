import { registerCommand } from "./types";
import axios from "axios";

// ═══════════════════════════════════════════════════════════════
// TEXT EFFECTS - Using BK9 API (Working Fallback)
// ═══════════════════════════════════════════════════════════════

const BK9_API = "https://bk9.fun/maker/textpro";

interface TextEffectResult {
    status: boolean;
    url: string | null;
    error?: string;
}

async function textMaker(effectUrl: string, texts: string[]): Promise<TextEffectResult> {
    try {
        // Join texts with semicolon for multi-text effects
        const textParam = texts.join(";");

        const apiUrl = `${BK9_API}?url=${encodeURIComponent(effectUrl)}&text=${encodeURIComponent(textParam)}`;

        const response = await axios.get(apiUrl, { timeout: 30000 });

        if (response.data && response.data.BK9) {
            return { status: true, url: response.data.BK9 };
        }

        // Alternative response formats
        if (response.data && response.data.result) {
            return { status: true, url: response.data.result };
        }

        if (response.data && response.data.url) {
            return { status: true, url: response.data.url };
        }

        return { status: false, url: null, error: 'API returned no image' };
    } catch (error: any) {
        console.error('[TEXTPRO] API Error:', error.message);
        return { status: false, url: null, error: error.message };
    }
}

// Helper to send image from URL
async function sendTextEffectImage(sock: any, jid: string, url: string, caption?: string) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 20000 });
        await sock.sendMessage(jid, {
            image: response.data,
            caption: caption || ''
        });
    } catch (e: any) {
        console.error('[TEXTPRO] Failed to send image:', e.message);
        throw e;
    }
}

// ═══════════════════════════════════════════════════════════════
// TEXT EFFECT COMMANDS - Using TextPro.me URLs via BK9 API
// ═══════════════════════════════════════════════════════════════

// Single-text effects
const TEXT_EFFECTS: { pattern: string; desc: string; url: string; dual?: boolean }[] = [
    // Chrome & Metal
    { pattern: "3dchrome", desc: "3D Chrome Metal", url: "https://textpro.me/3d-chrome-metal-text-effect-online-free-902.html" },
    { pattern: "wood", desc: "Realistic Wood Text", url: "https://textpro.me/create-a-realistic-3d-wood-text-effect-online-1003.html" },
    { pattern: "bagel", desc: "Bagel Text", url: "https://textpro.me/create-a-bagel-text-effect-online-free-1041.html" },
    { pattern: "biscuit", desc: "Biscuit Text", url: "https://textpro.me/create-a-delicious-biscuit-text-effect-1040.html" },
    { pattern: "gold", desc: "3D Gold", url: "https://textpro.me/create-realistic-3d-gold-text-effect-online-1141.html" },
    { pattern: "candy", desc: "Candy Text", url: "https://textpro.me/candy-text-effect-873.html" },
    { pattern: "carbon", desc: "Carbon Fiber", url: "https://textpro.me/3d-carbon-text-effect-online-free-1025.html" },
    { pattern: "2carbon", desc: "Carbon Fiber 2", url: "https://textpro.me/carbon-text-effect-833.html" },

    // Glitter & Sparkle
    { pattern: "1glitter", desc: "Glitter Style 1", url: "https://textpro.me/online-glitter-text-effect-free-1002.html" },
    { pattern: "2glitter", desc: "Glitter Style 2", url: "https://textpro.me/create-super-glitter-text-effect-online-free-1015.html" },
    { pattern: "3glitter", desc: "Glitter Style 3", url: "https://textpro.me/glitter-text-effect-online-free-1004.html" },
    { pattern: "4glitter", desc: "Glitter Style 4", url: "https://textpro.me/create-glitter-text-effect-online-free-1001.html" },
    { pattern: "5glitter", desc: "Glitter Style 5", url: "https://textpro.me/sparkle-glitter-text-effect-online-free-1000.html" },
    { pattern: "6glitter", desc: "Glitter Style 6", url: "https://textpro.me/glitter-silver-text-effect-online-999.html" },
    { pattern: "7glitter", desc: "Glitter Style 7", url: "https://textpro.me/golden-glitter-text-effect-998.html" },
    { pattern: "8glitter", desc: "Glitter Style 8", url: "https://textpro.me/pink-glitter-text-effect-997.html" },
    { pattern: "hexagold", desc: "Hexagon Gold", url: "https://textpro.me/create-3d-text-effect-with-hexagon-pattern-2-1085.html" },
    { pattern: "scifi", desc: "Sci-Fi Text", url: "https://textpro.me/create-a-3d-sci-fi-text-effect-online-1069.html" },

    // Jewelry & Gems
    { pattern: "1jewel", desc: "Jewel Style 1", url: "https://textpro.me/create-light-glow-sliced-text-effect-online-1035.html" },
    { pattern: "2jewel", desc: "Jewel Style 2", url: "https://textpro.me/create-green-horror-style-text-effect-online-1036.html" },
    { pattern: "3jewel", desc: "Jewel Style 3", url: "https://textpro.me/create-3d-fruit-text-effect-online-1056.html" },
    { pattern: "4jewel", desc: "Jewel Style 4", url: "https://textpro.me/3d-luxury-gold-text-effect-online-1005.html" },
    { pattern: "5jewel", desc: "Jewel Style 5", url: "https://textpro.me/create-3d-orange-juice-text-effect-online-1084.html" },
    { pattern: "6jewel", desc: "Jewel Style 6", url: "https://textpro.me/free-bear-text-effect-online-1124.html" },
    { pattern: "7jewel", desc: "Jewel Style 7", url: "https://textpro.me/free-ice-cream-text-effect-online-1119.html" },
    { pattern: "8jewel", desc: "Jewel Style 8", url: "https://textpro.me/create-a-3d-christmas-text-effect-online-1044.html" },

    // Metal Variants
    { pattern: "glowmetal", desc: "Glowing Metal", url: "https://textpro.me/create-3d-text-effect-with-metal-pattern-1106.html" },
    { pattern: "blackmetal", desc: "Black Metal", url: "https://textpro.me/create-3d-black-metal-text-online-1093.html" },
    { pattern: "bluemetal", desc: "Blue Metal", url: "https://textpro.me/create-blue-metal-text-effect-1076.html" },
    { pattern: "hotmetal", desc: "Hot Metal", url: "https://textpro.me/create-awesome-hot-metal-text-effect-1063.html" },
    { pattern: "shinymetal", desc: "Shiny Metal", url: "https://textpro.me/3d-shiny-metallic-text-effect-890.html" },
    { pattern: "rainbowmetal", desc: "Rainbow Metal", url: "https://textpro.me/create-3d-rainbow-metal-text-effect-online-1134.html" },
    { pattern: "rustymetal", desc: "Rusty Metal", url: "https://textpro.me/create-rusty-metal-text-effect-1037.html" },

    // Gems
    { pattern: "1gem", desc: "Gem Style 1", url: "https://textpro.me/create-3d-gem-text-effect-online-1077.html" },
    { pattern: "2gem", desc: "Gem Style 2", url: "https://textpro.me/create-3d-gem-text-effect-online-1078.html" },
    { pattern: "3gem", desc: "Gem Style 3", url: "https://textpro.me/create-3d-gem-text-effect-online-1079.html" },
    { pattern: "4gem", desc: "Gem Style 4", url: "https://textpro.me/create-3d-gem-text-effect-online-1080.html" },

    // Food & Nature
    { pattern: "juice", desc: "Orange Juice Text", url: "https://textpro.me/create-a-3d-orange-juice-text-effect-online-1084.html" },
    { pattern: "frozen", desc: "Frozen Ice Text", url: "https://textpro.me/create-a-3d-ice-text-effect-1047.html" },
    { pattern: "1marble", desc: "Marble Style 1", url: "https://textpro.me/3d-marble-text-effect-online-854.html" },
    { pattern: "2marble", desc: "Marble Style 2", url: "https://textpro.me/3d-marble-text-effect-online-free-862.html" },
    { pattern: "horror", desc: "Horror Text", url: "https://textpro.me/create-a-horror-blood-text-effect-online-1098.html" },
    { pattern: "drug", desc: "Drug Effect Text", url: "https://textpro.me/create-a-3d-drug-text-effect-online-1068.html" },
    { pattern: "honey", desc: "Honey Text", url: "https://textpro.me/create-the-honey-text-effect-online-1096.html" },
    { pattern: "gift", desc: "Gift Box Text", url: "https://textpro.me/create-a-christmas-gift-text-effect-online-1045.html" },
    { pattern: "dropwater", desc: "Water Drop Text", url: "https://textpro.me/create-realistic-3d-water-drop-text-effect-online-1016.html" },

    // Neon Variants
    { pattern: "1neon", desc: "Neon Style 1", url: "https://textpro.me/neon-light-text-effect-online-882.html" },
    { pattern: "2neon", desc: "Neon Style 2", url: "https://textpro.me/create-3d-neon-light-text-effect-online-1088.html" },
    { pattern: "3neon", desc: "Neon Style 3", url: "https://textpro.me/create-3d-neon-text-effect-online-free-1062.html" },
    { pattern: "4neon", desc: "Neon Style 4", url: "https://textpro.me/create-neon-light-text-effect-online-1058.html" },
    { pattern: "5neon", desc: "Neon Style 5", url: "https://textpro.me/create-colorful-neon-text-effect-online-1067.html" },
    { pattern: "6neon", desc: "Neon Style 6", url: "https://textpro.me/multicolor-3d-neon-text-effect-online-free-972.html" },
    { pattern: "7neon", desc: "Neon Style 7", url: "https://textpro.me/neon-text-effect-on-brick-wall-online-871.html" },
    { pattern: "8neon", desc: "Neon Style 8", url: "https://textpro.me/create-a-realistic-neon-text-effect-online-free-1117.html" },
    { pattern: "9neon", desc: "Neon Style 9", url: "https://textpro.me/create-a-realistic-neon-text-effect-online-free-1117.html" },
    { pattern: "greenneon", desc: "Green Neon", url: "https://textpro.me/create-green-neon-text-effect-online-free-1059.html" },
    { pattern: "glitchneon", desc: "Glitch Neon", url: "https://textpro.me/create-neon-glitch-text-effect-online-1027.html" },

    // Other Effects
    { pattern: "3dglue", desc: "3D Glue Text", url: "https://textpro.me/create-a-3d-glue-text-effect-online-1009.html" },
    { pattern: "circuit", desc: "Circuit Board Text", url: "https://textpro.me/create-a-circuit-board-text-effect-1059.html" },
    { pattern: "bokeh", desc: "Bokeh Effect", url: "https://textpro.me/create-a-bokeh-text-effect-online-free-1082.html" },
    { pattern: "steel", desc: "Steel Effect", url: "https://textpro.me/3d-steel-text-effect-online-882.html" },
    { pattern: "3dbox", desc: "3D Box Text", url: "https://textpro.me/3d-box-text-effect-online-880.html" },
    { pattern: "thunder", desc: "Thunder Text", url: "https://textpro.me/thunder-text-effect-833.html" },
    { pattern: "2thunder", desc: "Thunder Style 2", url: "https://textpro.me/create-a-thunder-text-effect-online-1032.html" },
    { pattern: "blood", desc: "Blood Text", url: "https://textpro.me/create-a-blood-text-effect-online-free-1114.html" },
    { pattern: "2blood", desc: "Blood Style 2", url: "https://textpro.me/create-a-horror-blood-text-effect-online-1098.html" },
    { pattern: "matrix", desc: "Matrix Text", url: "https://textpro.me/matrix-text-effect-online-888.html" },
    { pattern: "bread", desc: "Bread Text", url: "https://textpro.me/create-bread-text-effect-online-free-1039.html" },
    { pattern: "koifish", desc: "Koi Fish Text", url: "https://textpro.me/create-3d-koi-fish-text-effect-online-1090.html" },
    { pattern: "strawberry", desc: "Strawberry Text", url: "https://textpro.me/create-a-strawberry-text-effect-online-free-1059.html" },
    { pattern: "2chocolate", desc: "Chocolate Text", url: "https://textpro.me/create-a-chocolate-text-effect-online-1099.html" },

    // Glass Effects
    { pattern: "decglass", desc: "Decorated Glass", url: "https://textpro.me/create-a-decorated-glass-text-effect-online-1067.html" },
    { pattern: "glass", desc: "Glass Effect", url: "https://textpro.me/create-realistic-glass-text-effect-online-free-1012.html" },
    { pattern: "2glass", desc: "Glass Style 2", url: "https://textpro.me/create-realistic-glass-text-effect-online-free-1013.html" },
    { pattern: "3glass", desc: "Glass Style 3", url: "https://textpro.me/create-realistic-glass-text-effect-online-free-1014.html" },
    { pattern: "4glass", desc: "Glass Style 4", url: "https://textpro.me/create-realistic-glass-text-effect-online-free-1015.html" },
    { pattern: "5glass", desc: "Glass Style 5", url: "https://textpro.me/create-realistic-glass-text-effect-online-free-1016.html" },
    { pattern: "6glass", desc: "Glass Style 6", url: "https://textpro.me/create-realistic-glass-text-effect-online-free-1017.html" },
    { pattern: "7glass", desc: "Glass Style 7", url: "https://textpro.me/create-realistic-glass-text-effect-online-free-1018.html" },
    { pattern: "8glass", desc: "Glass Style 8", url: "https://textpro.me/create-realistic-glass-text-effect-online-free-1019.html" },
    { pattern: "9glass", desc: "Glass Style 9", url: "https://textpro.me/create-realistic-glass-text-effect-online-free-1020.html" },

    // Sparkling
    { pattern: "sparkling", desc: "Sparkling", url: "https://textpro.me/create-sparkling-romantic-text-effect-online-free-1075.html" },
    { pattern: "2sparkling", desc: "Sparkling 2", url: "https://textpro.me/create-sparkling-romantic-text-effect-online-free-1076.html" },
    { pattern: "3sparkling", desc: "Sparkling 3", url: "https://textpro.me/create-sparkling-romantic-text-effect-online-free-1077.html" },
    { pattern: "4sparkling", desc: "Sparkling 4", url: "https://textpro.me/create-sparkling-romantic-text-effect-online-free-1078.html" },
    { pattern: "5sparkling", desc: "Sparkling 5", url: "https://textpro.me/create-sparkling-romantic-text-effect-online-free-1079.html" },
    { pattern: "6sparkling", desc: "Sparkling 6", url: "https://textpro.me/create-sparkling-romantic-text-effect-online-free-1080.html" },
    { pattern: "7sparkling", desc: "Sparkling 7", url: "https://textpro.me/create-sparkling-romantic-text-effect-online-free-1081.html" },

    // Gaming & Pop Culture
    { pattern: "toxic", desc: "Toxic Text", url: "https://textpro.me/create-toxic-text-effect-online-free-1034.html" },
    { pattern: "equalizer", desc: "Equalizer Text", url: "https://textpro.me/create-sound-wave-equalizer-text-effect-online-1107.html" },
    { pattern: "robot", desc: "Robot Text", url: "https://textpro.me/3d-robot-text-effect-online-free-1033.html" },
    { pattern: "captain", desc: "Captain America", url: "https://textpro.me/create-captain-america-text-effect-online-1029.html" },
    { pattern: "lava", desc: "Lava Text", url: "https://textpro.me/create-a-hot-lava-burn-text-effect-online-1095.html" },
    { pattern: "magma", desc: "Magma Text", url: "https://textpro.me/create-a-magma-burn-text-effect-1100.html" },
    { pattern: "rock", desc: "Rock Text", url: "https://textpro.me/create-3d-rock-text-effect-online-1028.html" },
    { pattern: "3dstone", desc: "3D Stone", url: "https://textpro.me/create-a-3d-stone-text-effect-online-1024.html" },
    { pattern: "stone", desc: "Stone Text", url: "https://textpro.me/3d-stone-text-effect-online-free-970.html" },
    { pattern: "decpurple", desc: "Decorated Purple", url: "https://textpro.me/create-a-decorated-purple-glitter-text-effect-online-1066.html" },
    { pattern: "decgreen", desc: "Decorated Green", url: "https://textpro.me/create-a-3d-green-glow-text-effect-online-1063.html" },
    { pattern: "ultragloss", desc: "Ultra Gloss", url: "https://textpro.me/create-ultra-glossy-text-effect-online-1071.html" },
    { pattern: "denim", desc: "Denim Effect", url: "https://textpro.me/create-denim-text-effect-online-free-1086.html" },

    // Balloons
    { pattern: "1balloon", desc: "Balloon Style 1", url: "https://textpro.me/create-3d-balloon-text-effect-online-free-1108.html" },
    { pattern: "2balloon", desc: "Balloon Style 2", url: "https://textpro.me/create-3d-balloon-text-effect-online-free-1109.html" },
    { pattern: "3balloon", desc: "Balloon Style 3", url: "https://textpro.me/create-3d-balloon-text-effect-online-free-1110.html" },
    { pattern: "4balloon", desc: "Balloon Style 4", url: "https://textpro.me/create-3d-balloon-text-effect-online-free-1111.html" },
    { pattern: "5balloon", desc: "Balloon Style 5", url: "https://textpro.me/create-3d-balloon-text-effect-online-free-1112.html" },
    { pattern: "6balloon", desc: "Balloon Style 6", url: "https://textpro.me/create-3d-balloon-text-effect-online-free-1113.html" },
    { pattern: "7balloon", desc: "Balloon Style 7", url: "https://textpro.me/create-birthday-wish-text-effect-online-1052.html" },
    { pattern: "8balloon", desc: "Balloon Style 8", url: "https://textpro.me/rainbow-balloons-text-effect-892.html" },
    { pattern: "9balloon", desc: "Balloon Style 9", url: "https://textpro.me/foil-balloon-text-effect-online-free-977.html" },

    // Fabric & Holiday
    { pattern: "1fabric", desc: "Fabric Style 1", url: "https://textpro.me/create-a-fabric-text-effect-online-free-1057.html" },
    { pattern: "2fabric", desc: "Fabric Style 2", url: "https://textpro.me/create-a-fabric-text-effect-online-free-1058.html" },
    { pattern: "3fabric", desc: "Fabric Style 3", url: "https://textpro.me/create-a-fabric-text-effect-online-free-1059.html" },
    { pattern: "skeleton", desc: "Skeleton Text", url: "https://textpro.me/create-a-skeleton-text-effect-online-1097.html" },
    { pattern: "1firework", desc: "Firework", url: "https://textpro.me/create-a-firework-text-effect-online-free-1050.html" },
    { pattern: "nleaves", desc: "Nature Leaves", url: "https://textpro.me/create-a-green-leaves-text-effect-online-1055.html" },
    { pattern: "wicker", desc: "Wicker Text", url: "https://textpro.me/create-a-wicker-text-effect-online-1043.html" },
    { pattern: "darkgold", desc: "Dark Gold", url: "https://textpro.me/create-dark-gold-text-effect-online-free-1054.html" },
    { pattern: "2darkgold", desc: "Dark Gold 2", url: "https://textpro.me/create-dark-gold-text-effect-online-free-1053.html" },
    { pattern: "xmas", desc: "Christmas", url: "https://textpro.me/create-a-3d-christmas-text-effect-online-1044.html" },
    { pattern: "2xmas", desc: "Christmas 2", url: "https://textpro.me/create-a-christmas-snow-text-effect-online-1048.html" },
    { pattern: "eroded", desc: "Eroded Metal", url: "https://textpro.me/create-eroded-metal-text-effect-1047.html" },
    { pattern: "deluxe", desc: "Deluxe Gold", url: "https://textpro.me/3d-deluxe-gold-text-effect-online-866.html" },
    { pattern: "2deluxe", desc: "Deluxe Gold 2", url: "https://textpro.me/3d-deluxe-gold-text-effect-online-free-878.html" },
    { pattern: "glossymetal", desc: "Glossy Metal", url: "https://textpro.me/create-a-glossy-metal-text-effect-online-free-1061.html" },
    { pattern: "purplemetal", desc: "Purple Metal", url: "https://textpro.me/create-3d-glossy-purple-metal-text-effect-1091.html" },
    { pattern: "holotext", desc: "Holographic", url: "https://textpro.me/create-a-holographic-text-effect-online-1057.html" },
    { pattern: "minion", desc: "Minion Text", url: "https://textpro.me/create-a-minion-text-effect-online-1065.html" },
    { pattern: "1917style", desc: "1917 Style", url: "https://textpro.me/1917-movie-style-text-effect-1035.html" },

    // Nature & Misc
    { pattern: "beach", desc: "Beach Sand", url: "https://textpro.me/create-a-sand-text-on-the-beach-1023.html" },
    { pattern: "cracked", desc: "Cracked Stone", url: "https://textpro.me/create-a-cracked-stone-text-effect-1107.html" },
    { pattern: "1graffiti", desc: "Graffiti 1", url: "https://textpro.me/create-a-graffiti-text-on-wall-online-1034.html" },
    { pattern: "4graffiti", desc: "Graffiti 4", url: "https://textpro.me/create-a-graffiti-text-on-wall-online-1037.html" },
    { pattern: "5graffiti", desc: "Graffiti 5", url: "https://textpro.me/create-a-graffiti-text-on-wall-online-1038.html" },
    { pattern: "1water", desc: "Water Style 1", url: "https://textpro.me/create-water-text-effect-online-free-1085.html" },
    { pattern: "2water", desc: "Water Style 2", url: "https://textpro.me/create-water-text-effect-online-free-1086.html" },
    { pattern: "3water", desc: "Water Style 3", url: "https://textpro.me/create-water-text-effect-online-free-1087.html" },
    { pattern: "watercolor", desc: "Watercolor", url: "https://textpro.me/create-a-watercolor-text-effect-online-1022.html" },
    { pattern: "3dpaper", desc: "3D Paper", url: "https://textpro.me/create-a-3d-paper-cut-text-effect-online-1050.html" },
    { pattern: "berry", desc: "Berry Text", url: "https://textpro.me/create-berry-text-effect-online-free-1028.html" },
    { pattern: "transformer", desc: "Transformer", url: "https://textpro.me/create-a-transformer-text-effect-online-1019.html" },
    { pattern: "demon", desc: "Demon Text", url: "https://textpro.me/create-a-demon-text-effect-online-1020.html" },
    { pattern: "fire", desc: "Fire Text", url: "https://textpro.me/fire-text-effect-online-888.html" },
    { pattern: "ice", desc: "Ice Text", url: "https://textpro.me/ice-cold-text-effect-833.html" },
    { pattern: "smoke", desc: "Smoke Effect", url: "https://textpro.me/create-a-smoke-text-effect-online-1021.html" },
    { pattern: "cloud", desc: "Cloud Text", url: "https://textpro.me/create-a-cloud-text-effect-online-1051.html" },
    { pattern: "rainbow", desc: "Rainbow Text", url: "https://textpro.me/create-a-rainbow-text-effect-online-1052.html" },
    { pattern: "pubg", desc: "PUBG Style", url: "https://textpro.me/pubg-style-text-effect-online-free-979.html" },
    { pattern: "freefire", desc: "Free Fire Style", url: "https://textpro.me/free-fire-battlegrounds-text-effect-983.html" },
    { pattern: "fortnite", desc: "Fortnite Style", url: "https://textpro.me/fortnite-text-effect-online-free-980.html" },
    { pattern: "valorant", desc: "Valorant Style", url: "https://textpro.me/valorant-game-text-effect-1024.html" },
    { pattern: "cyberpunk", desc: "Cyberpunk Style", url: "https://textpro.me/cyberpunk-2077-text-effect-online-free-1025.html" },
    { pattern: "naruto", desc: "Naruto Style", url: "https://textpro.me/naruto-text-effect-online-free-1022.html" },
    { pattern: "onepiece", desc: "One Piece Style", url: "https://textpro.me/one-piece-logo-text-effect-online-920.html" },
    { pattern: "dragonball", desc: "Dragon Ball Style", url: "https://textpro.me/dragon-ball-text-effect-online-free-1018.html" },
    { pattern: "joker", desc: "Joker Style", url: "https://textpro.me/joker-movie-logo-text-effect-online-1013.html" },
    { pattern: "batman", desc: "Batman Style", url: "https://textpro.me/batman-dark-knight-logo-text-effect-online-1019.html" },
    { pattern: "superman", desc: "Superman Style", url: "https://textpro.me/superman-logo-text-effect-online-free-1020.html" },
    { pattern: "spiderman", desc: "Spiderman Style", url: "https://textpro.me/spiderman-logo-text-effect-online-free-1021.html" },
    { pattern: "ironman", desc: "Iron Man Style", url: "https://textpro.me/iron-man-text-effect-online-free-1017.html" },
    { pattern: "hulk", desc: "Hulk Style", url: "https://textpro.me/incredible-hulk-text-effect-online-free-1016.html" },
    { pattern: "thor", desc: "Thor Style", url: "https://textpro.me/thor-god-of-thunder-text-effect-1015.html" },
    { pattern: "thanos", desc: "Thanos Style", url: "https://textpro.me/thanos-text-effect-online-free-1014.html" },
    { pattern: "deadpool", desc: "Deadpool Style", url: "https://textpro.me/deadpool-logo-text-effect-online-free-1012.html" },
    { pattern: "venom", desc: "Venom Style", url: "https://textpro.me/venom-movie-logo-text-effect-online-1011.html" },
    { pattern: "starwars", desc: "Star Wars Style", url: "https://textpro.me/star-wars-text-effect-online-free-1010.html" },
];

// Dual-text effects (require Text1;Text2)
const DUAL_TEXT_EFFECTS: { pattern: string; desc: string; url: string }[] = [
    { pattern: "3dsteel", desc: "3D Steel Dual", url: "https://textpro.me/create-a-3d-steel-text-effect-online-1026.html" },
    { pattern: "2stone", desc: "Stone Dual", url: "https://textpro.me/create-a-3d-stone-text-effect-online-1133.html" },
    { pattern: "ninja", desc: "Ninja Dual", url: "https://textpro.me/create-an-assassin-creed-text-effect-online-1049.html" },
    { pattern: "bwwolf", desc: "Wolf Dual", url: "https://textpro.me/create-a-black-and-white-wolf-text-effect-1046.html" },
    { pattern: "lion", desc: "Lion Dual", url: "https://textpro.me/create-a-lion-text-effect-online-free-1042.html" },
    { pattern: "marvel", desc: "Marvel Dual", url: "https://textpro.me/create-a-marvel-studios-style-text-effect-online-1031.html" },
    { pattern: "2marvel", desc: "Marvel Dual 2", url: "https://textpro.me/create-text-effect-in-marvel-studios-style-online-1031.html" },
    { pattern: "avengers", desc: "Avengers Dual", url: "https://textpro.me/create-avengers-text-effect-online-free-1103.html" },
    { pattern: "pornhub", desc: "PornHub Dual", url: "https://textpro.me/pornhub-style-logo-online-generator-free-977.html" },
    { pattern: "glitch", desc: "Glitch Dual", url: "https://textpro.me/create-glitch-text-effect-style-online-1027.html" },
    { pattern: "2glitch", desc: "Glitch Dual 2", url: "https://textpro.me/create-tiktok-glitch-text-effect-online-1067.html" },
    { pattern: "3glitch", desc: "Glitch Single", url: "https://textpro.me/create-neon-glitch-text-effect-online-1027.html" },
    { pattern: "space", desc: "Space Dual", url: "https://textpro.me/create-space-text-effect-online-free-1053.html" },
    { pattern: "2space", desc: "Space Single", url: "https://textpro.me/create-a-space-text-effect-online-1083.html" },
    { pattern: "2graffiti", desc: "Graffiti Dual 2", url: "https://textpro.me/create-a-graffiti-text-on-wall-online-1035.html" },
    { pattern: "3graffiti", desc: "Graffiti Dual 3", url: "https://textpro.me/create-a-graffiti-text-on-wall-online-1036.html" },
    { pattern: "layered", desc: "Layered Dual", url: "https://textpro.me/create-a-layered-text-effect-online-1024.html" },
    { pattern: "classicgame", desc: "Classic Game", url: "https://textpro.me/create-a-classic-game-text-effect-online-1056.html" },
];

// Register single-text effect commands
for (const effect of TEXT_EFFECTS) {
    registerCommand({
        name: effect.pattern,
        description: effect.desc,
        category: "texteditor",
        execute: async ({ sock, msg, args, reply }) => {
            const text = args.join(" ");
            if (!text) {
                return await reply(`❌ Please provide text!\nExample: .${effect.pattern} Your Text`);
            }

            await reply(`⏳ Generating ${effect.desc}...`);

            const result = await textMaker(effect.url, [text]);
            if (result.status && result.url) {
                try {
                    const jid = msg.key.remoteJid!;
                    await sendTextEffectImage(sock, jid, result.url, `✨ ${effect.desc}`);
                } catch (e: any) {
                    await reply(`❌ Failed to send image: ${e.message}`);
                }
            } else {
                await reply(`❌ Failed to generate: ${result.error || 'API unavailable'}\n\n_Try again or use a different effect._`);
            }
        }
    });
}

// Register dual-text effect commands
for (const effect of DUAL_TEXT_EFFECTS) {
    registerCommand({
        name: effect.pattern,
        description: effect.desc + " (use Text1;Text2)",
        category: "texteditor",
        execute: async ({ sock, msg, args, reply }) => {
            const text = args.join(" ");
            if (!text || !text.includes(";")) {
                return await reply(`❌ Please provide two texts separated by ;\nExample: .${effect.pattern} Text1;Text2`);
            }

            const texts = text.split(";").map(t => t.trim());
            if (texts.length < 2 || !texts[0] || !texts[1]) {
                return await reply(`❌ Both texts are required!\nExample: .${effect.pattern} CORTANA;MD`);
            }

            await reply(`⏳ Generating ${effect.desc}...`);

            const result = await textMaker(effect.url, texts);
            if (result.status && result.url) {
                try {
                    const jid = msg.key.remoteJid!;
                    await sendTextEffectImage(sock, jid, result.url, `✨ ${effect.desc}`);
                } catch (e: any) {
                    await reply(`❌ Failed to send image: ${e.message}`);
                }
            } else {
                await reply(`❌ Failed to generate: ${result.error || 'API unavailable'}\n\n_Try again or use a different effect._`);
            }
        }
    });
}
