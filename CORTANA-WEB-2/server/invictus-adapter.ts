import { WASocket, getContentType, jidNormalizedUser, areJidsSameUser, proto } from '@whiskeysockets/baileys';
import * as path from 'path';
import * as fs from 'fs';
import { createRequire } from 'module';

// Create a require function for dynamic imports (ES Module compatible)
const dynamicRequire = createRequire(import.meta.url || __filename);

// Import the V8 engine
let V8Engine: any;
let smsgFunction: any;
let v8Loaded = false;
let loadError: string | null = null;

// Log once at startup
console.log('[V8] ═══════════════════════════════════');
console.log('[V8] Initializing Invictus V8 Engine...');

try {
    const possiblePaths = [
        path.join(process.cwd(), 'dist/invictus-v8/start/V8.js'),
        path.join(process.cwd(), 'CORTANA-WEB-2/dist/invictus-v8/start/V8.js'),
        path.join(process.cwd(), 'server/invictus-v8/start/V8.js'),
    ];

    const functionPaths = [
        path.join(process.cwd(), 'dist/invictus-v8/gudang/myfunction.js'),
        path.join(process.cwd(), 'CORTANA-WEB-2/dist/invictus-v8/gudang/myfunction.js'),
        path.join(process.cwd(), 'server/invictus-v8/gudang/myfunction.js'),
    ];

    let v8Path = '';
    for (const p of possiblePaths) {
        const exists = fs.existsSync(p);
        console.log(`[V8] ${exists ? '✅' : '❌'} ${p}`);
        if (exists && !v8Path) v8Path = p;
    }

    let funcPath = '';
    for (const p of functionPaths) {
        if (fs.existsSync(p)) {
            funcPath = p;
            break;
        }
    }

    if (v8Path) {
        console.log('[V8] Loading from:', v8Path);
        V8Engine = dynamicRequire(v8Path);
        v8Loaded = true;
        console.log('[V8] ✅ V8 Engine loaded successfully!');
    } else {
        loadError = 'V8.js not found';
        console.error('[V8] ❌', loadError);
    }

    if (funcPath) {
        const myfunction = dynamicRequire(funcPath);
        smsgFunction = myfunction.smsg;
        console.log('[V8] ✅ smsg function loaded');
    }

} catch (error: any) {
    loadError = error.message;
    console.error('[V8] ❌ Load error:', error.message);
}

console.log('[V8] ═══════════════════════════════════');

// Fallback message serializer
function serializeMessage(client: WASocket, msg: any): any {
    if (!msg) return msg;

    const m: any = { ...msg };

    if (m.key) {
        m.id = m.key.id;
        m.chat = m.key.remoteJid;
        m.fromMe = m.key.fromMe;
        m.isGroup = m.chat?.endsWith('@g.us') || false;
        m.sender = m.fromMe
            ? (client.user?.id || '')
            : (m.key.participant || m.key.remoteJid || '');

        if (m.isGroup && m.key.participant) {
            m.participant = m.key.participant;
        }
    }

    if (m.message) {
        m.mtype = getContentType(m.message);
        if (m.mtype) {
            m.msg = m.message[m.mtype];
        }
        m.text = m.message.conversation
            || m.message.extendedTextMessage?.text
            || m.msg?.caption
            || m.msg?.text
            || '';
        m.body = m.text;

        if (m.msg?.contextInfo?.quotedMessage) {
            const quotedType = getContentType(m.msg.contextInfo.quotedMessage);
            if (quotedType) {
                m.quoted = {
                    ...m.msg.contextInfo.quotedMessage[quotedType],
                    mtype: quotedType,
                    id: m.msg.contextInfo.stanzaId,
                    chat: m.msg.contextInfo.remoteJid || m.chat,
                    sender: m.msg.contextInfo.participant,
                    text: m.msg.contextInfo.quotedMessage[quotedType]?.text
                        || m.msg.contextInfo.quotedMessage[quotedType]?.caption
                        || m.msg.contextInfo.quotedMessage.conversation
                        || ''
                };
                m.quoted.msg = m.quoted;
            }
        }

        m.mentionedJid = m.msg?.contextInfo?.mentionedJid || [];
    }

    m.pushName = msg.pushName || 'User';
    return m;
}

function ensureDecodeJid(sock: WASocket): WASocket {
    if (!(sock as any).decodeJid) {
        (sock as any).decodeJid = (jid: string) => {
            if (!jid) return jid;
            return jidNormalizedUser(jid);
        };
    }
    return sock;
}

export async function handleInvictusCommand(sock: WASocket, message: any, chatUpdate: any, store: any) {
    const chatJid = message?.key?.remoteJid;

    // Report V8 not loaded to WhatsApp
    if (!v8Loaded) {
        if (chatJid && loadError) {
            try {
                const text = message?.message?.conversation || message?.message?.extendedTextMessage?.text || '';
                if (text.startsWith('.')) {
                    await sock.sendMessage(chatJid, {
                        text: `❌ *V8 Engine Error*\n\n${loadError}\n\nPlease rebuild: npm run build`
                    });
                }
            } catch (e) { }
        }
        return;
    }

    try {
        const enhancedSock = ensureDecodeJid(sock);
        // Serialize the message to the format V8.js expects
        let serializedMsg: any;

        if (smsgFunction) {
            // Use the original smsg function from myfunction.js
            console.log('[InvictusAdapter] Serializing with V8 smsg function...');
            serializedMsg = smsgFunction(enhancedSock, message, store);
            console.log('[InvictusAdapter] smsg result:', JSON.stringify(serializedMsg, null, 2));
        } else {
            // Use fallback serializer
            console.log('[InvictusAdapter] Using fallback serializer...');
            serializedMsg = serializeMessage(enhancedSock, message);
        }

        if (!serializedMsg) {
            console.log('[InvictusAdapter] Message serialization returned null, skipping');
            return;
        }

        console.log('[InvictusAdapter] Calling V8Engine with serialized message...');
        // V8.js expects (client, m, chatUpdate, store)
        await V8Engine(enhancedSock, serializedMsg, chatUpdate, store);
        console.log('[InvictusAdapter] V8Engine executed successfully.');


    } catch (error: any) {
        console.error('[V8] Error:', error?.message);

        // Send error to WhatsApp for debugging
        if (chatJid) {
            try {
                const text = message?.message?.conversation || message?.message?.extendedTextMessage?.text || '';
                if (text.startsWith('.')) {
                    await sock.sendMessage(chatJid, {
                        text: `❌ *V8 Command Error*\n\nCommand: ${text.split(' ')[0]}\nError: ${error?.message || 'Unknown error'}\n\nStack: ${error?.stack?.substring(0, 300) || 'N/A'}`
                    });
                }
            } catch (e) { }
        }
    }
}
