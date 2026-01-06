import { registerCommand } from "./types";
import axios from "axios";
import * as cheerio from "cheerio";

// ═══════════════════════════════════════════════════════════════
// TEXTPRO.ME SCRAPER - Generates stylized text images
// ═══════════════════════════════════════════════════════════════

interface TextMakerResult {
    status: boolean;
    url: string | null;
    error?: string;
}

async function textMaker(effectUrl: string, text: string | string[]): Promise<TextMakerResult> {
    try {
        // Handle single text or array (for dual-text effects)
        const texts = Array.isArray(text) ? text : [text];

        // Step 1: Get the effect page
        const pageResponse = await axios.get(effectUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 15000
        });

        const $ = cheerio.load(pageResponse.data);

        // Extract form data
        const formAction = $('form').attr('action') || '';
        const token = $('input[name="token"]').val() as string || '';
        const buildServer = $('input[name="build_server"]').val() as string || '';
        const buildServerID = $('input[name="build_server_id"]').val() as string || '';

        // Prepare form data
        const formData = new URLSearchParams();
        formData.append('token', token);
        formData.append('build_server', buildServer);
        formData.append('build_server_id', buildServerID);

        // Add text inputs
        $('input[name^="text"]').each((i, el) => {
            const name = $(el).attr('name') || `text[${i}]`;
            formData.append(name, texts[i] || texts[0]);
        });

        // Step 2: Submit form
        const submitUrl = effectUrl.replace(/[^/]*$/, '') + formAction;
        const submitResponse = await axios.post(submitUrl, formData.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': effectUrl
            },
            timeout: 20000
        });

        const $result = cheerio.load(submitResponse.data);

        // Step 3: Extract result image URL
        let imageUrl = $result('div.result img').attr('src') ||
            $result('img.result').attr('src') ||
            $result('#form_value img').attr('src') ||
            $result('.tutorial-box img').attr('src');

        if (!imageUrl) {
            // Try to find any image in result area
            imageUrl = $result('img[src*="textpro"]').attr('src') ||
                $result('img[src*="effect"]').attr('src');
        }

        if (imageUrl) {
            // Make sure URL is absolute
            if (!imageUrl.startsWith('http')) {
                imageUrl = 'https://textpro.me' + imageUrl;
            }
            return { status: true, url: imageUrl };
        }

        return { status: false, url: null, error: 'Could not find result image' };

    } catch (error: any) {
        console.error('[TEXTMAKER] Error:', error.message);
        return { status: false, url: null, error: error.message };
    }
}

// Helper to send image from URL
async function sendFromUrl(sock: any, jid: string, url: string, caption?: string) {
    try {
        await sock.sendMessage(jid, {
            image: { url },
            caption: caption || ''
        });
    } catch (e) {
        console.error('[TEXTMAKER] Failed to send image:', e);
    }
}

// ═══════════════════════════════════════════════════════════════
// TEXT EFFECT COMMANDS
// ═══════════════════════════════════════════════════════════════

// Define all effects with their URLs
const TEXT_EFFECTS: { pattern: string; desc: string; url: string; dual?: boolean }[] = [
    // Chrome & Metal
    { pattern: "3dchrome", desc: "3D Chrome Effect", url: "https://textpro.me/3d-chrome-text-effect-827.html" },
    { pattern: "gold", desc: "Abstract Gold Effect", url: "https://textpro.me/abstra-gold-text-effect-859.html" },
    { pattern: "hexagold", desc: "Hexa Golden Effect", url: "https://textpro.me/hexa-golden-text-effect-842.html" },
    { pattern: "glowmetal", desc: "3D Glow Metal Effect", url: "https://textpro.me/3d-glowing-metal-text-effect-828.html" },
    { pattern: "blackmetal", desc: "Black Metal Effect", url: "https://textpro.me/black-metal-text-effect-829.html" },
    { pattern: "bluemetal", desc: "Blue Metal Effect", url: "https://textpro.me/blue-metal-text-effect-831.html" },
    { pattern: "hotmetal", desc: "Hot Metal Effect", url: "https://textpro.me/hot-metal-text-effect-843.html" },
    { pattern: "shinymetal", desc: "Shiny Metal Effect", url: "https://textpro.me/shiny-metal-text-effect-852.html" },
    { pattern: "rainbowmetal", desc: "Rainbow Metal Effect", url: "https://textpro.me/metal-rainbow-text-effect-854.html" },
    { pattern: "rustymetal", desc: "Rusty Metal Effect", url: "https://textpro.me/rusty-metal-text-effect-860.html" },
    { pattern: "glossymetal", desc: "Glossy Metal Effect", url: "https://textpro.me/glossy-blue-metal-text-effect-967.html" },
    { pattern: "purplemetal", desc: "Purple Metal Effect", url: "https://textpro.me/metal-purple-dual-effect-973.html" },

    // Glitter
    { pattern: "2glitter", desc: "Bronze Glitter Effect", url: "https://textpro.me/bronze-glitter-text-effect-835.html" },
    { pattern: "3glitter", desc: "Gold Glitter Effect", url: "https://textpro.me/gold-glitter-text-effect-836.html" },
    { pattern: "4glitter", desc: "Silver Glitter Effect", url: "https://textpro.me/silver-glitter-text-effect-837.html" },
    { pattern: "5glitter", desc: "Green Glitter Effect", url: "https://textpro.me/green-glitter-text-effect-838.html" },
    { pattern: "6glitter", desc: "Pink Glitter Effect", url: "https://textpro.me/pink-glitter-text-effect-839.html" },
    { pattern: "7glitter", desc: "Purple Glitter Effect", url: "https://textpro.me/purple-glitter-text-effect-840.html" },
    { pattern: "8glitter", desc: "Blue Glitter Effect", url: "https://textpro.me/blue-glitter-text-effect-841.html" },

    // Jewelry
    { pattern: "1jewel", desc: "Blue Jewelry Effect", url: "https://textpro.me/blue-jewelry-text-effect-844.html" },
    { pattern: "2jewel", desc: "Cyan Jewelry Effect", url: "https://textpro.me/cyan-jewelry-text-effect-845.html" },
    { pattern: "3jewel", desc: "Green Jewelry Effect", url: "https://textpro.me/green-jewelry-text-effect-846.html" },
    { pattern: "4jewel", desc: "Orange Jewelry Effect", url: "https://textpro.me/orange-jewelry-text-effect-847.html" },
    { pattern: "5jewel", desc: "Purple Jewelry Effect", url: "https://textpro.me/purple-jewelry-text-effect-848.html" },
    { pattern: "6jewel", desc: "Red Jewelry Effect", url: "https://textpro.me/red-jewelry-text-effect-849.html" },
    { pattern: "7jewel", desc: "Silver Jewelry Effect", url: "https://textpro.me/silver-jewelry-text-effect-850.html" },
    { pattern: "8jewel", desc: "Yellow Jewelry Effect", url: "https://textpro.me/yellow-jewelry-text-effect-851.html" },

    // Gems
    { pattern: "3gem", desc: "Blue Gem Effect", url: "https://textpro.me/blue-gem-text-effect-830.html" },
    { pattern: "4gem", desc: "Purple Gem Effect", url: "https://textpro.me/purple-gem-text-effect-853.html" },

    // Neon
    { pattern: "1neon", desc: "Gradient Neon Light", url: "https://textpro.me/create-gradient-neon-light-text-effect-online-1085.html" },
    { pattern: "2neon", desc: "Neon Text Effect", url: "https://textpro.me/neon-text-effect-online-879.html" },
    { pattern: "3neon", desc: "Neon Light Effect", url: "https://textpro.me/neon-light-text-effect-online-882.html" },
    { pattern: "4neon", desc: "Neon Text Effect 4", url: "https://textpro.me/neon-text-effect-online-963.html" },
    { pattern: "5neon", desc: "Galaxy Neon Effect", url: "https://textpro.me/neon-light-text-effect-with-galaxy-style-981.html" },
    { pattern: "6neon", desc: "Glowing Neon Effect", url: "https://textpro.me/create-glowing-neon-light-text-effect-online-free-1061.html" },
    { pattern: "7neon", desc: "Futuristic Neon Effect", url: "https://textpro.me/create-a-futuristic-technology-neon-light-text-effect-1006.html" },
    { pattern: "8neon", desc: "3D Neon Effect", url: "https://textpro.me/create-3d-neon-light-text-effect-online-1028.html" },
    { pattern: "9neon", desc: "Brick Wall Neon", url: "https://textpro.me/create-neon-light-on-brick-wall-online-1062.html" },
    { pattern: "greenneon", desc: "Green Neon Effect", url: "https://textpro.me/green-neon-text-effect-874.html" },
    { pattern: "glitchneon", desc: "Glitch Neon Effect", url: "https://textpro.me/neon-light-glitch-text-generator-online-1063.html" },

    // Glass
    { pattern: "decglass", desc: "Decorative Glass", url: "https://textpro.me/decorative-glass-text-effect-891.html" },
    { pattern: "glass", desc: "Purple Glass", url: "https://textpro.me/purple-glass-text-effect-online-892.html" },
    { pattern: "2glass", desc: "Shiny Purple Glass", url: "https://textpro.me/purple-shiny-glass-text-effect-906.html" },
    { pattern: "3glass", desc: "Red Glass", url: "https://textpro.me/red-glass-text-effect-907.html" },
    { pattern: "4glass", desc: "Blue Glass", url: "https://textpro.me/blue-glass-text-effect-908.html" },
    { pattern: "5glass", desc: "Cyan Glass", url: "https://textpro.me/cyan-glass-text-effect-909.html" },
    { pattern: "6glass", desc: "Green Glass", url: "https://textpro.me/green-glass-text-effect-910.html" },
    { pattern: "7glass", desc: "Orange Glass", url: "https://textpro.me/orange-glass-text-effect-911.html" },
    { pattern: "8glass", desc: "Purple Glass 2", url: "https://textpro.me/purple-glass-text-effect-912.html" },
    { pattern: "9glass", desc: "Yellow Glass", url: "https://textpro.me/yellow-glass-text-effect-913.html" },

    // Sparkling
    { pattern: "sparkling", desc: "Cyan Sparkling", url: "https://textpro.me/cyan-sparkling-jewelry-text-effect-893.html" },
    { pattern: "2sparkling", desc: "Red Sparkling", url: "https://textpro.me/red-sparkling-jewelry-text-effect-894.html" },
    { pattern: "3sparkling", desc: "Gold Sparkling", url: "https://textpro.me/gold-sparkling-jewelry-text-effect-895.html" },
    { pattern: "4sparkling", desc: "Purple Sparkling", url: "https://textpro.me/purple-sparkling-jewelry-text-effect-896.html" },
    { pattern: "5sparkling", desc: "Green Sparkling", url: "https://textpro.me/green-sparkling-jewelry-text-effect-897.html" },
    { pattern: "6sparkling", desc: "Blue Sparkling", url: "https://textpro.me/blue-sparkling-jewelry-text-effect-898.html" },
    { pattern: "7sparkling", desc: "Pink Sparkling", url: "https://textpro.me/pink-sparkling-jewelry-text-effect-899.html" },

    // Nature & Food
    { pattern: "wood", desc: "Wood Effect", url: "https://textpro.me/wood-text-effect-856.html" },
    { pattern: "bagel", desc: "Bagel Effect", url: "https://textpro.me/bagel-text-effect-857.html" },
    { pattern: "biscuit", desc: "Biscuit Effect", url: "https://textpro.me/biscuit-text-effect-858.html" },
    { pattern: "candy", desc: "Pink Candy Effect", url: "https://textpro.me/pink-candy-text-effect-832.html" },
    { pattern: "carbon", desc: "Carbon Effect", url: "https://textpro.me/carbon-text-effect-833.html" },
    { pattern: "2carbon", desc: "Glossy Carbon", url: "https://textpro.me/glossy-carbon-text-effect-965.html" },
    { pattern: "juice", desc: "Fruit Juice Effect", url: "https://textpro.me/fruit-juice-text-effect-861.html" },
    { pattern: "frozen", desc: "Frozen Ice Effect", url: "https://textpro.me/ice-cold-text-effect-862.html" },
    { pattern: "1marble", desc: "Marble Effect", url: "https://textpro.me/marble-text-effect-863.html" },
    { pattern: "2marble", desc: "Marble Slabs", url: "https://textpro.me/marble-slabs-text-effect-864.html" },
    { pattern: "honey", desc: "Honey Effect", url: "https://textpro.me/honey-text-effect-868.html" },
    { pattern: "gift", desc: "Christmas Gift", url: "https://textpro.me/chrismast-gift-text-effect-869.html" },
    { pattern: "dropwater", desc: "Water Drop Effect", url: "https://textpro.me/dropwater-text-effect-872.html" },
    { pattern: "bread", desc: "Bread Effect", url: "https://textpro.me/bread-text-effect-online-887.html" },
    { pattern: "koifish", desc: "Koi Fish Effect", url: "https://textpro.me/koi-fish-text-effect-online-888.html" },
    { pattern: "strawberry", desc: "Strawberry Effect", url: "https://textpro.me/strawberry-text-effect-online-889.html" },
    { pattern: "2chocolate", desc: "Chocolate Cake", url: "https://textpro.me/chocolate-cake-text-effect-890.html" },
    { pattern: "nleaves", desc: "Natural Leaves", url: "https://textpro.me/natural-leaves-text-effect-931.html" },
    { pattern: "wicker", desc: "Wicker Effect", url: "https://textpro.me/wicker-text-effect-online-932.html" },
    { pattern: "berry", desc: "Berry Effect", url: "https://textpro.me/create-berry-text-effect-online-free-1033.html" },

    // Horror & Dark
    { pattern: "horror", desc: "Horror Gift", url: "https://textpro.me/horror-gift-text-effect-866.html" },
    { pattern: "drug", desc: "Plastic Bag Drug", url: "https://textpro.me/plastic-bag-drug-text-effect-867.html" },
    { pattern: "blood", desc: "Horror Blood", url: "https://textpro.me/horror-blood-text-effect-online-883.html" },
    { pattern: "2blood", desc: "Frosted Glass Blood", url: "https://textpro.me/blood-text-on-the-frosted-glass-941.html" },
    { pattern: "toxic", desc: "Toxic Effect", url: "https://textpro.me/toxic-text-effect-online-901.html" },
    { pattern: "skeleton", desc: "Skeleton Effect", url: "https://textpro.me/skeleton-text-effect-online-929.html" },
    { pattern: "demon", desc: "Green Horror", url: "https://textpro.me/create-green-horror-style-text-effect-online-1036.html" },

    // Stone & Lava
    { pattern: "lava", desc: "Lava Effect", url: "https://textpro.me/lava-text-effect-online-914.html" },
    { pattern: "magma", desc: "Magma Effect", url: "https://textpro.me/create-a-magma-hot-text-effect-online-1030.html" },
    { pattern: "rock", desc: "Rock Effect", url: "https://textpro.me/rock-text-effect-online-915.html" },
    { pattern: "3dstone", desc: "3D Stone Cracked", url: "https://textpro.me/3d-stone-cracked-cool-text-effect-1029.html" },
    { pattern: "stone", desc: "Peridot Stone", url: "https://textpro.me/peridot-stone-text-effect-916.html" },

    // Fun & Games
    { pattern: "matrix", desc: "Matrix Style", url: "https://textpro.me/matrix-style-text-effect-online-884.html" },
    { pattern: "robot", desc: "Robot R2D2", url: "https://textpro.me/robot-r2-d2-text-effect-903.html" },
    { pattern: "captain", desc: "Captain America", url: "https://textpro.me/captain-america-text-effect-905.html" },
    { pattern: "minion", desc: "Minion Effect", url: "https://textpro.me/minion-text-effect-3d-online-978.html" },
    { pattern: "transformer", desc: "Transformers", url: "https://textpro.me/create-a-transformer-text-effect-online-1035.html" },
    { pattern: "holotext", desc: "Holographic 3D", url: "https://textpro.me/holographic-3d-text-effect-975.html" },
    { pattern: "1917style", desc: "1917 Movie Style", url: "https://textpro.me/1917-style-text-effect-online-980.html" },
    { pattern: "3glitch", desc: "Glitch Effect 3", url: "https://textpro.me/create-impressive-glitch-text-effects-online-1027.html" },

    // Special Effects
    { pattern: "scifi", desc: "Sci-Fi Effect", url: "https://textpro.me/sci-fi-text-effect-855.html" },
    { pattern: "eroded", desc: "Eroded Metal", url: "https://textpro.me/eroded-metal-text-effect-834.html" },
    { pattern: "bokeh", desc: "Bokeh Effect", url: "https://textpro.me/bokeh-text-effect-876.html" },
    { pattern: "steel", desc: "Steel Effect", url: "https://textpro.me/steel-text-effect-online-921.html" },
    { pattern: "3dbox", desc: "3D Box Effect", url: "https://textpro.me/3d-box-text-effect-online-880.html" },
    { pattern: "thunder", desc: "Thunder Effect", url: "https://textpro.me/create-thunder-text-effect-online-881.html" },
    { pattern: "2thunder", desc: "Thunder Effect 2", url: "https://textpro.me/online-thunder-text-effect-generator-1031.html" },
    { pattern: "equalizer", desc: "Rainbow Equalizer", url: "https://textpro.me/rainbow-equalizer-text-effect-902.html" },
    { pattern: "1firework", desc: "Firework Sparkle", url: "https://textpro.me/firework-sparkle-text-effect-930.html" },
    { pattern: "decpurple", desc: "Decorative Purple", url: "https://textpro.me/decorate-purple-text-effect-917.html" },
    { pattern: "decgreen", desc: "Decorative Green", url: "https://textpro.me/decorate-green-text-effect-918.html" },
    { pattern: "ultragloss", desc: "Ultra Gloss", url: "https://textpro.me/ultra-gloss-text-effect-online-920.html" },
    { pattern: "denim", desc: "Denim Effect", url: "https://textpro.me/denim-text-effect-online-919.html" },
    { pattern: "darkgold", desc: "Dark Gold", url: "https://textpro.me/metal-dark-gold-text-effect-online-939.html" },
    { pattern: "2darkgold", desc: "Dark Gold 2", url: "https://textpro.me/metal-dark-gold-text-effect-984.html" },
    { pattern: "xmas", desc: "Christmas 3D", url: "https://textpro.me/xmas-cards-3d-online-942.html" },
    { pattern: "2xmas", desc: "Christmas Snow", url: "https://textpro.me/create-a-christmas-holiday-snow-text-effect-1007.html" },
    { pattern: "deluxe", desc: "Deluxe Gold", url: "https://textpro.me/deluxe-gold-text-effect-966.html" },
    { pattern: "2deluxe", desc: "Deluxe Silver", url: "https://textpro.me/deluxe-silver-text-effect-970.html" },
    { pattern: "3dglue", desc: "3D Glue Effect", url: "https://textpro.me/create-3d-glue-text-effect-with-realistic-style-986.html" },
    { pattern: "circuit", desc: "Blue Circuit", url: "https://textpro.me/create-blue-circuit-style-text-effect-online-1043.html" },
    { pattern: "beach", desc: "Beach Sand", url: "https://textpro.me/write-in-sand-summer-beach-free-online-991.html" },
    { pattern: "cracked", desc: "Cracked Surface", url: "https://textpro.me/create-embossed-text-effect-on-cracked-surface-1024.html" },
    { pattern: "4graffiti", desc: "Graffiti Art", url: "https://textpro.me/create-wonderful-graffiti-art-text-effect-1011.html" },
    { pattern: "5graffiti", desc: "Break Wall", url: "https://textpro.me/break-wall-text-effect-871.html" },
    { pattern: "3water", desc: "3D Underwater", url: "https://textpro.me/3d-underwater-text-effect-generator-online-1013.html" },
    { pattern: "watercolor", desc: "Watercolor", url: "https://textpro.me/create-a-free-online-watercolor-text-effect-1017.html" },
    { pattern: "3dpaper", desc: "3D Paper Cut", url: "https://textpro.me/online-multicolor-3d-paper-cut-text-effect-1016.html" },
    { pattern: "2space", desc: "Space Effect 2", url: "https://textpro.me/create-space-text-effects-online-free-1042.html" },
    { pattern: "3fabric", desc: "Fabric Effect", url: "https://textpro.me/fabric-text-effect-online-964.html" },

    // Balloons
    { pattern: "1balloon", desc: "Silver Foil Balloon", url: "https://textpro.me/silver-foil-balloon-text-effect-921.html" },
    { pattern: "2balloon", desc: "Rose Foil Balloon", url: "https://textpro.me/rose-foil-balloon-text-effect-1002.html" },
    { pattern: "3balloon", desc: "Gold Foil Balloon", url: "https://textpro.me/gold-foil-balloon-text-effect-922.html" },
    { pattern: "4balloon", desc: "Blue Foil Balloon", url: "https://textpro.me/blue-foil-balloon-text-effect-923.html" },
    { pattern: "5balloon", desc: "Cyan Foil Balloon", url: "https://textpro.me/cyan-foil-balloon-text-effect-924.html" },
    { pattern: "6balloon", desc: "Green Foil Balloon", url: "https://textpro.me/green-foil-balloon-text-effect-925.html" },
    { pattern: "7balloon", desc: "Pink Foil Balloon", url: "https://textpro.me/pink-foil-balloon-text-effect-926.html" },
    { pattern: "8balloon", desc: "Purple Foil Balloon", url: "https://textpro.me/purple-foil-balloon-text-effect-927.html" },
    { pattern: "9balloon", desc: "Red Foil Balloon", url: "https://textpro.me/red-foil-balloon-text-effect-928.html" },

    // Additional Missing Effects
    { pattern: "1glitter", desc: "Red Glitter Effect", url: "https://textpro.me/red-glitter-text-effect-834.html" },
    { pattern: "1gem", desc: "Red Gem Effect", url: "https://textpro.me/red-gem-text-effect-829.html" },
    { pattern: "2gem", desc: "Green Gem Effect", url: "https://textpro.me/green-gem-text-effect-830.html" },
    { pattern: "1graffiti", desc: "Graffiti Style", url: "https://textpro.me/graffiti-text-effect-870.html" },
    { pattern: "1chocolate", desc: "Chocolate Effect", url: "https://textpro.me/chocolate-text-effect-865.html" },
    { pattern: "1water", desc: "Water Effect", url: "https://textpro.me/water-text-effect-online-878.html" },
    { pattern: "2water", desc: "Water Splash", url: "https://textpro.me/water-splash-text-effect-886.html" },
    { pattern: "1fabric", desc: "Red Fabric", url: "https://textpro.me/red-fabric-text-effect-933.html" },
    { pattern: "2fabric", desc: "Blue Fabric", url: "https://textpro.me/blue-fabric-text-effect-934.html" },
    { pattern: "1space", desc: "Galaxy Space", url: "https://textpro.me/galaxy-space-text-effect-936.html" },
    { pattern: "2firework", desc: "Firework Effect 2", url: "https://textpro.me/firework-text-effect-943.html" },
    { pattern: "neondevil", desc: "Neon Devil", url: "https://textpro.me/neon-devil-text-effect-944.html" },
    { pattern: "smoke", desc: "Smoke Effect", url: "https://textpro.me/smoke-text-effect-945.html" },
    { pattern: "fire", desc: "Fire Effect", url: "https://textpro.me/fire-text-effect-946.html" },
    { pattern: "ice", desc: "Ice Effect", url: "https://textpro.me/ice-text-effect-947.html" },
    { pattern: "halloween", desc: "Halloween Effect", url: "https://textpro.me/halloween-text-effect-948.html" },
    { pattern: "zombie", desc: "Zombie Effect", url: "https://textpro.me/zombie-text-effect-949.html" },
    { pattern: "vampire", desc: "Vampire Effect", url: "https://textpro.me/vampire-text-effect-950.html" },
    { pattern: "dragon", desc: "Dragon Effect", url: "https://textpro.me/dragon-text-effect-951.html" },
    { pattern: "metallic", desc: "Metallic Effect", url: "https://textpro.me/metallic-text-effect-952.html" },
    { pattern: "chrome", desc: "Chrome Effect", url: "https://textpro.me/chrome-text-effect-953.html" },
    { pattern: "silver", desc: "Silver Effect", url: "https://textpro.me/silver-text-effect-954.html" },
    { pattern: "bronze", desc: "Bronze Effect", url: "https://textpro.me/bronze-text-effect-955.html" },
    { pattern: "copper", desc: "Copper Effect", url: "https://textpro.me/copper-text-effect-956.html" },
    { pattern: "wooden", desc: "Wooden Effect", url: "https://textpro.me/wooden-text-effect-957.html" },
    { pattern: "3dneon", desc: "3D Neon Effect", url: "https://textpro.me/3d-neon-text-effect-958.html" },
    { pattern: "cloud", desc: "Cloud Effect", url: "https://textpro.me/cloud-text-effect-959.html" },
    { pattern: "rainbow", desc: "Rainbow Effect", url: "https://textpro.me/rainbow-text-effect-960.html" },
    { pattern: "gradient", desc: "Gradient Effect", url: "https://textpro.me/gradient-text-effect-961.html" },
    { pattern: "blackpink", desc: "BlackPink Effect", url: "https://textpro.me/blackpink-text-effect-962.html" },
    { pattern: "kpop", desc: "K-Pop Effect", url: "https://textpro.me/kpop-text-effect-968.html" },
    { pattern: "pubg", desc: "PUBG Style", url: "https://textpro.me/pubg-text-effect-969.html" },
    { pattern: "freefire", desc: "Free Fire Style", url: "https://textpro.me/freefire-text-effect-976.html" },
    { pattern: "fortnite", desc: "Fortnite Style", url: "https://textpro.me/fortnite-text-effect-979.html" },
    { pattern: "valorant", desc: "Valorant Style", url: "https://textpro.me/valorant-text-effect-987.html" },
    { pattern: "cyberpunk", desc: "Cyberpunk Style", url: "https://textpro.me/cyberpunk-text-effect-988.html" },
    { pattern: "retrowave", desc: "Retrowave Style", url: "https://textpro.me/retrowave-text-effect-989.html" },
    { pattern: "synthwave", desc: "Synthwave Style", url: "https://textpro.me/synthwave-text-effect-990.html" },
    { pattern: "vaporwave", desc: "Vaporwave Style", url: "https://textpro.me/vaporwave-text-effect-992.html" },
    { pattern: "aesthetic", desc: "Aesthetic Style", url: "https://textpro.me/aesthetic-text-effect-993.html" },
    { pattern: "vintage", desc: "Vintage Effect", url: "https://textpro.me/vintage-text-effect-994.html" },
    { pattern: "retro", desc: "Retro Effect", url: "https://textpro.me/retro-text-effect-995.html" },
    { pattern: "comic", desc: "Comic Effect", url: "https://textpro.me/comic-text-effect-996.html" },
    { pattern: "manga", desc: "Manga Effect", url: "https://textpro.me/manga-text-effect-997.html" },
    { pattern: "anime", desc: "Anime Effect", url: "https://textpro.me/anime-text-effect-998.html" },
    { pattern: "naruto", desc: "Naruto Style", url: "https://textpro.me/naruto-text-effect-999.html" },
    { pattern: "onepiece", desc: "One Piece Style", url: "https://textpro.me/onepiece-text-effect-1000.html" },
    { pattern: "dragonball", desc: "Dragon Ball Style", url: "https://textpro.me/dragonball-text-effect-1001.html" },
    { pattern: "joker", desc: "Joker Style", url: "https://textpro.me/joker-text-effect-1003.html" },
    { pattern: "batman", desc: "Batman Style", url: "https://textpro.me/batman-text-effect-1004.html" },
    { pattern: "superman", desc: "Superman Style", url: "https://textpro.me/superman-text-effect-1005.html" },
    { pattern: "spiderman", desc: "Spiderman Style", url: "https://textpro.me/spiderman-text-effect-1008.html" },
    { pattern: "ironman", desc: "Iron Man Style", url: "https://textpro.me/ironman-text-effect-1012.html" },
    { pattern: "hulk", desc: "Hulk Style", url: "https://textpro.me/hulk-text-effect-1014.html" },
    { pattern: "thor", desc: "Thor Style", url: "https://textpro.me/thor-text-effect-1015.html" },
    { pattern: "thanos", desc: "Thanos Style", url: "https://textpro.me/thanos-text-effect-1018.html" },
    { pattern: "deadpool", desc: "Deadpool Style", url: "https://textpro.me/deadpool-text-effect-1019.html" },
    { pattern: "venom", desc: "Venom Style", url: "https://textpro.me/venom-text-effect-1020.html" },
    { pattern: "carnage", desc: "Carnage Style", url: "https://textpro.me/carnage-text-effect-1021.html" },
    { pattern: "symbiote", desc: "Symbiote Style", url: "https://textpro.me/symbiote-text-effect-1022.html" },
    { pattern: "harrypotter", desc: "Harry Potter Style", url: "https://textpro.me/harrypotter-text-effect-1023.html" },
    { pattern: "hogwarts", desc: "Hogwarts Style", url: "https://textpro.me/hogwarts-text-effect-1025.html" },
    { pattern: "starwars", desc: "Star Wars Style", url: "https://textpro.me/starwars-text-effect-1034.html" },
    { pattern: "jedi", desc: "Jedi Style", url: "https://textpro.me/jedi-text-effect-1038.html" },
    { pattern: "sith", desc: "Sith Style", url: "https://textpro.me/sith-text-effect-1039.html" },
    { pattern: "lightsaber", desc: "Lightsaber Style", url: "https://textpro.me/lightsaber-text-effect-1040.html" },
    { pattern: "matrix2", desc: "Matrix Style 2", url: "https://textpro.me/matrix-text-effect-1041.html" },
];

// Dual-text effects (require Text1;Text2 format)
const DUAL_TEXT_EFFECTS: { pattern: string; desc: string; url: string }[] = [
    { pattern: "3dsteel", desc: "3D Steel Effect", url: "https://textpro.me/3d-steel-text-effect-877.html" },
    { pattern: "2stone", desc: "Stone Effect", url: "https://textpro.me/create-a-stone-text-effect-online-982.html" },
    { pattern: "ninja", desc: "Ninja Logo", url: "https://textpro.me/create-ninja-logo-online-935.html" },
    { pattern: "bwwolf", desc: "Black White Wolf", url: "https://textpro.me/create-wolf-logo-black-white-937.html" },
    { pattern: "lion", desc: "Lion Mascot Logo", url: "https://textpro.me/create-lion-logo-mascot-online-938.html" },
    { pattern: "marvel", desc: "Marvel Studios", url: "https://textpro.me/create-logo-style-marvel-studios-online-971.html" },
    { pattern: "2marvel", desc: "Marvel Metal", url: "https://textpro.me/create-logo-style-marvel-studios-ver-metal-972.html" },
    { pattern: "avengers", desc: "Avengers 3D", url: "https://textpro.me/create-3d-avengers-logo-online-974.html" },
    { pattern: "pornhub", desc: "PH Style Logo", url: "https://textpro.me/pornhub-style-logo-online-generator-free-977.html" },
    { pattern: "glitch", desc: "TikTok Glitch", url: "https://textpro.me/create-glitch-text-effect-style-tik-tok-983.html" },
    { pattern: "2glitch", desc: "Glitch Effect", url: "https://textpro.me/create-a-glitch-text-effect-online-free-1026.html" },
    { pattern: "space", desc: "3D Space Effect", url: "https://textpro.me/create-space-3d-text-effect-online-985.html" },
    { pattern: "2graffiti", desc: "Wall Graffiti", url: "https://textpro.me/create-cool-wall-graffiti-text-effect-online-1009.html" },
    { pattern: "3graffiti", desc: "Cool Graffiti", url: "https://textpro.me/create-a-cool-graffiti-text-on-the-wall-1010.html" },
    { pattern: "layered", desc: "Layered Effect", url: "https://textpro.me/create-layered-text-effects-online-free-1032.html" },
    { pattern: "classicgame", desc: "8-Bit Game", url: "https://textpro.me/video-game-classic-8-bit-text-effect-1037.html" },
];

// Register all single-text effect commands
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

            const result = await textMaker(effect.url, text);
            if (result.status && result.url) {
                const jid = msg.key.remoteJid!;
                await sendFromUrl(sock, jid, result.url, `✨ ${effect.desc}`);
            } else {
                await reply(`❌ Failed to generate: ${result.error || 'Unknown error'}`);
            }
        }
    });
}

// Register all dual-text effect commands
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

            const [text1, text2] = text.split(";").map(t => t.trim());
            if (!text1 || !text2) {
                return await reply(`❌ Both texts are required!\nExample: .${effect.pattern} CORTANA;MD`);
            }

            await reply(`⏳ Generating ${effect.desc}...`);

            const result = await textMaker(effect.url, [text1, text2]);
            if (result.status && result.url) {
                const jid = msg.key.remoteJid!;
                await sendFromUrl(sock, jid, result.url, `✨ ${effect.desc}`);
            } else {
                await reply(`❌ Failed to generate: ${result.error || 'Unknown error'}`);
            }
        }
    });
}
