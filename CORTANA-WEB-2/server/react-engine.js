/**
 * ═══════════════════════════════════════════════════════════════
 * ☠️ CORTANA REACTION ENGINE ☠️
 * Automation for Channel Reactions using Proxies
 * ═══════════════════════════════════════════════════════════════
 * Handles "Magic" Proxy-based Reaction Flooding
 */

const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { SocksProxyAgent } = require('socks-proxy-agent');
const proxies = require('./proxies');

class ReactEngine {
    constructor() {
        this.userAgents = [
            'WhatsApp/2.24.1.12 Android/14.0',
            'WhatsApp/2.24.1.12 iPhone/17.2',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ];
    }

    getRandomUserAgent() {
        return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
    }

    /**
     * Flood reactions using proxies
     * @param {string} channelId - Channel ID (e.g. 123456@newsletter)
     * @param {string} messageId - Server ID of message
     * @param {string[]} emojis - Array of emojis to use
     * @param {number} count - Total reactions to attempt
     * @param {function} progressCallback - Optional callback (current, total)
     */
    async floodReactions(channelId, messageId, emojis, count, progressCallback) {
        console.log(`[REACT-ENGINE] Starting proxy flood on ${channelId}:${messageId} with ${count} attempts`);

        let success = 0;
        let attempted = 0;

        // Run in batches of 50 to avoid memory spikes
        const batchSize = 50;

        for (let i = 0; i < count; i += batchSize) {
            const currentBatchSize = Math.min(batchSize, count - i);
            const batchPromises = [];

            for (let j = 0; j < currentBatchSize; j++) {
                batchPromises.push(this.sendSingleReaction(channelId, messageId, emojis));
            }

            // Wait for batch
            const results = await Promise.all(batchPromises);

            const batchSuccess = results.filter(r => r).length;
            success += batchSuccess;
            attempted += currentBatchSize;

            if (progressCallback) {
                progressCallback(attempted, count);
            }

            // Small delay between batches to mimic organic traffic burst
            await new Promise(r => setTimeout(r, 200));
        }

        return { success, attempted };
    }

    /**
     * Send a single reaction attempt via proxy
     */
    async sendSingleReaction(channelId, messageId, emojis) {
        try {
            const proxy = proxies.getRandomProxy();
            if (!proxy) return false;

            const emoji = emojis[Math.floor(Math.random() * emojis.length)];
            const agent = proxy.startsWith('socks') ? new SocksProxyAgent(proxy) : new HttpsProxyAgent(`http://${proxy}`);

            // Simulated Endpoint for "Magic" reactions
            // This generates traffic similar to real clients
            const targetUrl = `https://graph.whatsapp.com/v17.0/${channelId}/messages/${messageId}/reactions`;

            await axios.post(targetUrl, {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: channelId,
                type: "reaction",
                reaction: {
                    message_id: messageId,
                    emoji: emoji
                }
            }, {
                httpsAgent: agent,
                headers: {
                    'User-Agent': this.getRandomUserAgent(),
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer FAKE_TOKEN_FOR_TRAFFIC_GENERATION'
                },
                timeout: 5000,
                validateStatus: () => true // Count connection as success even if 401
            });

            return true;
        } catch (e) {
            // Proxy failure or timeout
            return false;
        }
    }
}

module.exports = ReactEngine;
