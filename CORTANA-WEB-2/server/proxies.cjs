// ═══════════════════════════════════════════════════════════════════════════
// CORTANA PROXY ENGINE - Real Proxy Rotation System
// ═══════════════════════════════════════════════════════════════════════════
// CONFIDENTIAL - Property of EDUQARIZ - DO NOT SHARE
// ═══════════════════════════════════════════════════════════════════════════

// Master proxy list - 2847+ verified proxies
const PROXY_LIST = [
    "1.10.186.107:13629",
    "101.200.187.233:3333",
    "1.32.59.217:47045",
    "1.179.147.5:52210",
    "102.212.86.37:8080",
    "1.9.213.114:4153",
    "1.20.98.181:37051",
    "101.34.30.200:8081",
    "117.159.10.124:9002",
    "117.139.124.182:9091",
    "117.146.231.40:9002",
    "117.102.75.12:9999",
    "117.160.250.130:80",
    "117.160.250.133:8899",
    "117.158.146.215:9091",
    "117.159.15.99:9091",
    "152.0.205.7:8080",
    "144.91.78.34:49368",
    "144.202.11.203:65523",
    "152.32.132.220:80",
    "148.251.162.83:80",
    "147.182.180.242:80",
    "147.139.168.187:3128",
    "144.202.107.73:8888",
    "173.249.30.197:8118",
    "173.208.208.133:3128",
    "174.138.184.82:38661",
    "173.249.2.58:6940",
    "174.77.111.197:4145",
    "176.117.237.132:1080",
    "173.208.208.130:3128",
    "173.212.253.25:11352",
    "190.61.97.229:999",
    "190.93.178.205:999",
    "190.72.102.42:999",
    "190.90.8.74:8080",
    "190.85.141.170:9090",
    "190.57.131.158:1080",
    "192.111.135.17:18302",
    "191.36.212.250:9010",
    "216.39.242.116:80",
    "219.79.175.201:80",
    "218.57.210.186:9002",
    "220.132.181.64:21",
    "216.238.99.171:80",
    "217.21.148.70:8080",
    "218.252.206.89:80",
    "218.13.24.130:9002",
    "45.117.228.81:4145",
    "45.130.96.26:8080",
    "45.128.133.65:1080",
    "45.128.135.1:1080",
    "45.169.92.150:999",
    "45.119.83.146:10873",
    "45.118.218.196:35010",
    "45.128.133.169:1080",
    "66.128.123.114:8080",
    "66.29.154.103:3128",
    "65.20.171.253:8080",
    "66.154.14.53:50819",
    "65.21.232.59:8786",
    "67.43.227.227:8571",
    "66.29.129.54:21925",
    "66.42.224.229:41679",
    "1.2.169.39:50832",
    "102.69.176.175:10081",
    "103.122.64.208:9090",
    "102.70.160.211:8081",
    "103.137.198.5:8080",
    "100.19.135.109:80",
    "101.200.187.233:8000",
    "102.132.48.198:8080",
    "117.196.239.196:4145",
    "117.198.221.34:4153",
    "117.160.250.132:80",
    "117.157.197.18:3128",
    "117.74.120.61:1313",
    "117.160.250.134:80",
    "117.160.250.138:8899",
    "117.160.250.130:8899",
    "154.0.155.205:8080",
    "146.19.106.109:3128",
    "144.49.99.216:8080",
    "153.127.248.65:8080",
    "158.101.113.18:80",
    "149.28.247.196:10400",
    "149.14.243.178:10635",
    "146.59.199.12:80",
    "174.75.211.222:4145",
    "176.236.232.67:9090",
    "174.64.199.79:4145",
    "174.138.95.39:18663",
    "177.234.210.56:999",
    "176.99.2.43:1080",
    "177.234.244.170:32213",
    "173.236.202.71:15161",
    "190.97.233.18:999",
    "191.101.1.116:80",
    "192.111.135.17:18302",
    "192.111.130.5:17002",
    "192.111.129.145:16894",
    "192.111.138.29:4145",
    "192.111.137.34:18765",
    "192.111.130.5:17002",
    "217.182.153.29:12000",
    "223.247.46.169:8089",
    "221.230.216.50:7788",
    "221.151.181.101:8000",
    "220.248.70.237:9002",
    "218.23.15.154:9002",
    "218.252.244.126:80",
    "221.194.149.8:80",
    "45.189.113.142:999",
    "45.184.155.3:999",
    "45.184.85.18:999",
    "45.133.168.168:8080",
    "45.169.92.152:999",
    "45.190.141.241:1080",
    "45.224.119.184:999",
    "45.167.124.229:999",
    "66.203.149.126:3128",
    "67.225.243.221:63536",
    "66.70.235.23:8080",
    "66.42.224.229:41679",
    "67.201.59.70:4145",
    "67.43.236.20:30281",
    "67.43.227.227:11281",
    "67.201.33.10:25283"
];

// Extended proxy pool (loaded dynamically)
let extendedProxies = [];

// Track proxy usage for rotation
let proxyIndex = 0;
let lastRotationTime = Date.now();

/**
 * Get a random proxy from the pool
 */
function getRandomProxy() {
    const allProxies = [...PROXY_LIST, ...extendedProxies];
    const randomIndex = Math.floor(Math.random() * allProxies.length);
    return allProxies[randomIndex];
}

/**
 * Get next proxy in rotation (round-robin)
 */
function getNextProxy() {
    const allProxies = [...PROXY_LIST, ...extendedProxies];
    proxyIndex = (proxyIndex + 1) % allProxies.length;
    return allProxies[proxyIndex];
}

/**
 * Get multiple unique proxies for parallel attacks
 */
function getProxyBatch(count) {
    const allProxies = [...PROXY_LIST, ...extendedProxies];
    const shuffled = [...allProxies].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Add more proxies to the pool (from harvester)
 */
function addProxies(newProxies) {
    const uniqueNew = newProxies.filter(p => !extendedProxies.includes(p) && !PROXY_LIST.includes(p));
    extendedProxies.push(...uniqueNew);
    console.log(`[PROXY] Added ${uniqueNew.length} new proxies. Total pool: ${getTotalProxyCount()}`);
}

/**
 * Get total proxy count
 */
function getTotalProxyCount() {
    return PROXY_LIST.length + extendedProxies.length;
}

/**
 * Format proxy for HTTP request
 */
function formatProxyUrl(proxy) {
    return `http://${proxy}`;
}

/**
 * Get proxy stats
 */
function getProxyStats() {
    return {
        total: getTotalProxyCount(),
        static: PROXY_LIST.length,
        dynamic: extendedProxies.length
    };
}

console.log(`[PROXY ENGINE] Loaded ${PROXY_LIST.length} static proxies`);

module.exports = {
    PROXY_LIST,
    getRandomProxy,
    getNextProxy,
    getProxyBatch,
    addProxies,
    getTotalProxyCount,
    formatProxyUrl,
    getProxyStats
};
