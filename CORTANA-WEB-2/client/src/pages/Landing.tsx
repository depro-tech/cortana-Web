import React, { useState, useEffect, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";

const PRODUCTS = [
    { name: "Premium Bug Bots Scripts", price: 200, desc: "Advanced automation scripts" },
    { name: "Ban Checker", price: 0, desc: "Free basic checker" },
    { name: "Customized Ban Checkers", price: 100, desc: "Personalized checking tools" },
    { name: "Unlimited Panels", price: 150, desc: "Access to all panels" },
    { name: "Admin Panel", price: 400, desc: "Standard admin access" },
    { name: "Private Admin Panel", price: 600, desc: "Exclusive admin panel" },
    { name: "VPS 4GB", price: 300, desc: "30 days access" },
    { name: "VPS 8GB", price: 550, desc: "30 days access" },
    { name: "VPS 16GB", price: 990, desc: "30 days access" }
];

const TICKER_MESSAGES = [
    "PREMIUM BUG BOTS SCRIPTS @200",
    "BAN CHECKER KSH 0",
    "CUSTOMIZED BAN CHECKERS @100",
    "UNLIMITED PANELS 150",
    "ADMIN PANEL 400",
    "PRIVATE ADMIN PANEL 600",
    "VPS 8GB 550",
    "VPS 4GB 300",
    "VPS 16GB 990 VALID FOR 30 DAYS",
    "DEVELOPER TOOLS & SERVICES",
    "M-PESA & AIRTEL MONEY PAYMENTS",
    "INTERNATIONAL PAYMENTS AVAILABLE",
    "WHATSAPP BOT LINKING",
    "REAL-TIME SESSIONS MONITORING",
    "CONTACT DEV FOR SUPPORT"
];

const CYBER_TIPS = [
    "Use strong, unique passwords for every account",
    "Enable two-factor authentication whenever possible",
    "Keep your software and systems updated",
    "Be cautious of phishing emails and suspicious links",
    "Use a VPN on public Wi-Fi networks",
    "Regularly backup your important data",
    "Install and update antivirus software",
    "Monitor your accounts for unusual activity",
    "Use firewall protection on all devices",
    "Educate yourself about latest security threats"
];

const MENU_TEXT = `🌺❀──────────────────────────────❀🌺
           CORTANA MD 
         C H R I S T M A S  E D.
🌺❀──────────────────────────────❀🌺


🌸🌼 O W N E R   M E N U 🌼🌸
⮞ Block
⮞ Unblock
⮞ Dev
⮞ Self
⮞ Public
⮞ BC
⮞ Report
⮞ SetBio
⮞ Settings
⮞ Features
⮞ Antileft
⮞ Autostatus
⮞ AddPrem
⮞ AddOwner
⮞ DelPrem
⮞ DelOwner
⮞ Events
⮞ VV
⮞ Stats
⮞ Shell
🌸───────────────────────────────🌸


🌷🌹 G R O U P   M A N A G E 🌹🌷
⮞ Add
⮞ Promote
⮞ Demote
⮞ Kick
⮞ Open
⮞ Close
⮞ Link
⮞ TagAll
⮞ TagAdmin
⮞ TotalMembers
⮞ HideTag
⮞ VCF
⮞ ApproveAll
⮞ RejectAll
🌷───────────────────────────────🌷


🌺🌼 A I   &   C H A T B O T S 🌼🌺
⮞ GPT
⮞ ChatGPT
⮞ DeepSeek
⮞ Imagine
⮞ LLaMA
⮞ Jokes
⮞ Advice
⮞ Trivia
⮞ Inspire
⮞ GenImage
⮞ Gemini
🌺───────────────────────────────🌺


🌹🌸 U T I L I T I E S 🌸🌹
⮞ Menu
⮞ Ping
⮞ Uptime
⮞ ListGC
⮞ ListPC
⮞ React
⮞ LeaveGC
⮞ Delete
⮞ BankCek
⮞ Bansos
⮞ Me
⮞ Roket
⮞ Repair
⮞ PetStore
⮞ Alarm
⮞ AutoRead
⮞ MyIP
⮞ MathQuiz
⮞ Shazam
⮞ AntiDelete
⮞ Instagram
⮞ Repo
🌹───────────────────────────────🌹


🌼🌻 M E D I A   &   D O W N L O A D 🌻🌼
⮞ Song
⮞ Play
⮞ SSweb
⮞ IDch
⮞ APK
⮞ Weather
⮞ Lyrics
⮞ Tour
⮞ ToMP3
⮞ ToVN
⮞ ToOnce
⮞ ToAnime
⮞ TTDL
⮞ IGDLV
⮞ Fetch
🌼───────────────────────────────🌼


🌸🌺 W A L L P A P E R S 🌺🌸
⮞ Best-WallP
⮞ Random
🌸───────────────────────────────🌸


🌷🌹 A N T I – F E A T U R E S 🌹🌷
⮞ .vv1 (reply viewonce)
⮞ .vv2 (reply viewonce to dm)
⮞ .antiviewonce-all-on
⮞ .antiviewonce-pm-on
⮞ .antiviewonce-off
⮞ .antidelete-all-on
⮞ .antidelete-pm-on
⮞ .antidelete-off
⮞ .antiedit-all-on
⮞ .antiedit-pm-on
⮞ .antiedit-off
⮞ .antiban-on
⮞ .antiban-off
⮞ .autodownload-status-on
⮞ .autodownload-status-off
⮞ .autolikestatus-on
⮞ .autostatuslike-off
⮞ .antilink-kick
⮞ .antilink-warn
⮞ .antilink-off
⮞ .antitag-kick
⮞ .antitag-warn
⮞ .antitag-off
🌷───────────────────────────────🌷


🌺🌼 A L L O W   M A N A G E 🌼🌺
⮞ Allow
⮞ DelAllowed
⮞ ListAllowed
🌺───────────────────────────────🌺


🌹🌸 C O U N T R Y   F I L T E R S 🌸🌹
⮞ AddCode
⮞ DelCode
⮞ ListCode
🌹───────────────────────────────🌹


❀──────────────────────────────❀
      🌸 Powered by CORTANA MD 
         🎄 Èdûqarîz 2025
❀──────────────────────────────❀`;

export default function Landing() {
    const { toast } = useToast();
    const [activeSection, setActiveSection] = useState('home');
    const [showFailOverlay, setShowFailOverlay] = useState(false);
    const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

    // ... (rest of state)

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "COPIED!",
            description: "Code copied to clipboard",
            duration: 2000
        });
    };

    // Updated handleLogin checks
    const handleLogin = async () => {
        const usernameInput = (document.getElementById('username-input') as HTMLInputElement)?.value;
        const passwordInput = (document.getElementById('password-input') as HTMLInputElement)?.value;

        if (!usernameInput || !passwordInput) {
            toast({
                title: "❌ Error",
                description: "Please enter both username and password",
                variant: "destructive"
            });
            return;
        }

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: usernameInput, password: passwordInput })
            });

            const data = await response.json();

            if (!response.ok) {
                // Login failed - show OVERLAY
                setShowFailOverlay(true);
                return;
            }

            // Login successful - show OVERLAY
            setShowSuccessOverlay(true);

            // Allow time for overlay to be seen before state update
            setTimeout(() => {
                setShowSuccessOverlay(false); // Close overlay after delay or let user close? User didn't specify auto-close. I'll let user close or maybe auto-transition. 
                // "if login successfull, then a happy simpson character appear and the following message shown..."
                // I will add a "Proceed" button or auto-close after a few seconds.
                setIsLoggedIn(true);
                if (rememberMe) {
                    localStorage.setItem('cortana_login', 'true');
                }
            }, 4000);

        } catch (error) {
            // ... existing error handler
            setLoginError(true);
            setTimeout(() => setLoginError(false), 500);
            toast({ title: "❌ Error", description: "Login failed.", variant: "destructive" });
        }
    };

    // ... (rendering)

    // In MD Link Section (around line 775)
    // <div className="text-3xl ..."> {mdGeneratedCode} </div>
    // Add button below

    // ...



    const [currentTipIndex, setCurrentTipIndex] = useState(0);
    const [showContact, setShowContact] = useState(false);
    const [musicPlaying, setMusicPlaying] = useState(false);
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const [paymentPage, setPaymentPage] = useState<string | null>(null);
    const [cart, setCart] = useState<{ name: string, price: number }[]>([]);
    const [showCartPage, setShowCartPage] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [activeSessions, setActiveSessions] = useState(0);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loginError, setLoginError] = useState(false);
    const [showAccessGranted, setShowAccessGranted] = useState(false);
    const [characterJump, setCharacterJump] = useState(false);

    const triggerCharacterJump = () => {
        setCharacterJump(true);
        setTimeout(() => setCharacterJump(false), 500);
    };

    // MD Link State
    const [mdWhatsappNumber, setMdWhatsappNumber] = useState('');
    const [mdGeneratedCode, setMdGeneratedCode] = useState('');
    const [mdIsLinking, setMdIsLinking] = useState(false);
    const [showMdSuccessMessage, setShowMdSuccessMessage] = useState(false);
    const [mdConnectedNumber, setMdConnectedNumber] = useState('');
    const [mdSessionId, setMdSessionId] = useState<string | null>(null);
    const [mdLinkError, setMdLinkError] = useState('');

    // Bug (Exploit) Link State
    const [bugWhatsappNumber, setBugWhatsappNumber] = useState('');
    const [bugGeneratedCode, setBugGeneratedCode] = useState('');
    const [bugIsLinking, setBugIsLinking] = useState(false);
    const [showBugSuccessMessage, setShowBugSuccessMessage] = useState(false);
    const [bugConnectedNumber, setBugConnectedNumber] = useState('');
    const [bugSessionId, setBugSessionId] = useState<string | null>(null);
    const [bugLinkError, setBugLinkError] = useState('');

    // Chat Simulation State
    const [chatInput, setChatInput] = useState('');
    const [chatMessages, setChatMessages] = useState<{ sender: string, text: string }[]>([
        { sender: 'bot', text: 'Cortana MD initialized. Type .menu to see commands.' }
    ]);

    // Matrix Canvas Ref
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        // Check for remembered login
        const savedLogin = localStorage.getItem('cortana_login');
        if (savedLogin === 'true') {
            setIsLoggedIn(true);
        }

        // Ticker Animation handled by CSS
        // Tips Cycle
        const interval = setInterval(() => {
            setCurrentTipIndex((prev) => (prev + 1) % CYBER_TIPS.length);
        }, 4000);

        // Poll active sessions every 5 seconds
        const sessionInterval = setInterval(async () => {
            try {
                const res = await fetch('/api/sessions/active/count');
                const data = await res.json();
                setActiveSessions(data.count);
            } catch (err) {
                console.error('Failed to fetch active sessions:', err);
            }
        }, 5000);

        // Initial fetch
        fetch('/api/sessions/active/count')
            .then(res => res.json())
            .then(data => setActiveSessions(data.count))
            .catch(err => console.error('Failed to fetch active sessions:', err));

        return () => {
            clearInterval(interval);
            clearInterval(sessionInterval);
        };
    }, []);

    const addToCart = (product: typeof PRODUCTS[0]) => {
        setCart(prev => [...prev, { name: product.name, price: product.price }]);
        toast({
            title: "✅ Item Added to Cart",
            description: `${product.name} has been successfully added to cart`,
            duration: 3000,
        });
    };

    const removeFromCart = (index: number) => {
        setCart(prev => prev.filter((_, i) => i !== index));
    };

    const getTotalPrice = () => {
        return cart.reduce((sum, item) => sum + item.price, 0);
    };

    useEffect(() => {
        // Music Init
        audioRef.current = new Audio('https://files.catbox.moe/hy068y.mp3');
        audioRef.current.loop = true;
        audioRef.current.volume = 0.3;

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (activeSection === 'bug' && canvasRef.current) {
            initMatrix(canvasRef.current);
        }
    }, [activeSection]);

    const toggleMusic = () => {
        if (audioRef.current) {
            if (musicPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play().catch(e => console.log("Audio play failed", e));
            }
            setMusicPlaying(!musicPlaying);
        }
    };



    const generateMDLinkCode = async () => {
        if (!mdWhatsappNumber) {
            alert('Please enter a WhatsApp number');
            return;
        }
        setMdIsLinking(true);
        setMdGeneratedCode('GENERATING...');
        setMdLinkError('');

        try {
            const response = await fetch('/api/pairing/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phoneNumber: mdWhatsappNumber,
                    type: 'md'
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate pairing code');
            }

            setMdGeneratedCode(data.pairingCode);
            setMdSessionId(data.sessionId);
            setMdIsLinking(false);

            const pollStatus = setInterval(async () => {
                try {
                    const statusRes = await fetch(`/api/pairing/status/${data.sessionId}`);
                    const statusData = await statusRes.json();

                    if (statusData.status === 'connected') {
                        clearInterval(pollStatus);
                        setMdConnectedNumber(mdWhatsappNumber);
                        setShowMdSuccessMessage(true);
                        setMdGeneratedCode('');
                        setMdWhatsappNumber('');

                        setTimeout(() => {
                            setShowMdSuccessMessage(false);
                        }, 5000);
                    }
                } catch (err) {
                    console.error('Status poll error:', err);
                }
            }, 10000);

            setTimeout(() => clearInterval(pollStatus), 300000);

        } catch (error: any) {
            setMdLinkError(error.message);
            setMdGeneratedCode('');
            setMdIsLinking(false);
        }
    };

    const generateBugLinkCode = async () => {
        if (!bugWhatsappNumber) {
            alert('Please enter a WhatsApp number');
            return;
        }
        setBugIsLinking(true);
        setBugGeneratedCode('GENERATING...');
        setBugLinkError('');

        try {
            const response = await fetch('/api/pairing/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phoneNumber: bugWhatsappNumber,
                    type: 'bug'
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate pairing code');
            }

            setBugGeneratedCode(data.pairingCode);
            setBugSessionId(data.sessionId);
            setBugIsLinking(false);

            const pollStatus = setInterval(async () => {
                try {
                    const statusRes = await fetch(`/api/pairing/status/${data.sessionId}`);
                    const statusData = await statusRes.json();

                    if (statusData.status === 'connected') {
                        clearInterval(pollStatus);
                        setBugConnectedNumber(bugWhatsappNumber);
                        setShowBugSuccessMessage(true);
                        setBugGeneratedCode('');
                        setBugWhatsappNumber('');

                        setTimeout(() => {
                            setShowBugSuccessMessage(false);
                        }, 5000);
                    }
                } catch (err) {
                    console.error('Status poll error:', err);
                }
            }, 10000);

            setTimeout(() => clearInterval(pollStatus), 300000);

        } catch (error: any) {
            setBugLinkError(error.message);
            setBugGeneratedCode('');
            setBugIsLinking(false);
        }
    };

    const executeExploitCommand = async (command: string) => {
        const targetInput = (document.getElementById('exploit-target') as HTMLInputElement)?.value;

        // Specific checks
        if ((command === 'crash' || command === 'crash-invis' || command === 'crash-ios' || command === 'perm-ban-num' || command === 'temp-ban-num') && !targetInput) {
            toast({
                title: "❌ TARGET REQUIRED",
                description: "Please enter a Target JID or Number first!",
                variant: "destructive"
            });
            return;
        }

        if (!bugSessionId) {
            toast({
                title: "❌ NO SESSION",
                description: "You must be linked to execute exploits!",
                variant: "destructive"
            });
            return;
        }

        toast({
            title: "☠️ INITIATING EXPLOIT...",
            description: `Executing ${command.toUpperCase()} on target...`,
        });

        try {
            const response = await fetch('/api/exploit/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    command,
                    target: targetInput,
                    sessionId: bugSessionId
                })
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: "✅ EXPLOIT EXECUTED",
                    description: `Command ${command} sent successfully.`,
                });
            } else {
                throw new Error(data.error);
            }
        } catch (error: any) {
            toast({
                title: "❌ EXECUTION FAILED",
                description: error.message || "Unknown error occurred",
                variant: "destructive"
            });
        }
    };



    const handleChatSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        const userMsg = chatInput;
        setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
        setChatInput('');

        setTimeout(() => {
            if (userMsg.toLowerCase() === '.menu' || userMsg.toLowerCase() === 'menu') {
                setChatMessages(prev => [...prev, { sender: 'bot', text: MENU_TEXT }]);
            } else {
                setChatMessages(prev => [...prev, { sender: 'bot', text: 'Command not found. Type .menu for list.' }]);
            }
        }, 500);
    };

    const initMatrix = (canvas: HTMLCanvasElement) => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()*&^%';
        const fontSize = 16;
        const columns = canvas.width / fontSize;
        const drops: number[] = [];

        for (let i = 0; i < columns; i++) {
            drops[i] = 1;
        }

        const draw = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#0F0';
            ctx.font = fontSize + 'px monospace';

            for (let i = 0; i < drops.length; i++) {
                const text = letters.charAt(Math.floor(Math.random() * letters.length));
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        };

        const interval = setInterval(draw, 33);
        return () => clearInterval(interval);
    };

    return (
        <div className="min-h-screen text-white font-mono overflow-hidden">
            {/* Background Videos */}
            {activeSection === 'md' ? (
                <video autoPlay muted loop className="md-bg-video" key="md-bg">
                    <source src="https://files.catbox.moe/402rz6.mp4" type="video/mp4" />
                </video>
            ) : (
                <video autoPlay muted loop className="bg-video" key="main-bg">
                    <source src="https://files.catbox.moe/sqr2k3.mp4" type="video/mp4" />
                </video>
            )}

            {/* Music Control */}
            <div
                className="music-control hover:scale-110 active:scale-95"
                onClick={toggleMusic}
                title="Toggle Music"
            >
                <i className={`fas ${musicPlaying ? 'fa-pause' : 'fa-music'}`}></i>
            </div>

            {/* Navigation */}
            <nav className="flex items-center">
                {[
                    { id: 'home', label: 'Home' },
                    { id: 'catalogue', label: 'Catalogue' },
                    { id: 'md', label: 'MD Link' },
                    { id: 'bug', label: 'Bug Link' },
                    { id: 'about', label: 'About' }
                ].map((item) => (
                    <button
                        key={item.id}
                        className={`nav-btn ${activeSection === item.id ? 'active' : ''}`}
                        onClick={() => setActiveSection(item.id)}
                    >
                        {item.label}
                    </button>
                ))}
                <button
                    className={`nav-btn ${showContact ? 'active' : ''}`}
                    onClick={() => setShowContact(!showContact)}
                >
                    Contact
                </button>
            </nav>

            {/* Content Sections */}

            {/* Home Section */}
            {activeSection === 'home' && (
                <div className="section-container section-enter">
                    <div className="tip-container">
                        <div className="cyber-tip show text-cyan-400">
                            {CYBER_TIPS[currentTipIndex]}
                        </div>
                    </div>
                </div>
            )}

            {/* Catalogue Section */}
            {activeSection === 'catalogue' && (
                <div className="section-container section-enter">
                    <h2 className="text-cyan-400 mb-5 text-center text-2xl font-bold">
                        <i className="fas fa-shopping-cart mr-2"></i> PRODUCT CATALOGUE
                    </h2>

                    <div className="catalogue-grid">
                        {PRODUCTS.map((product, idx) => (
                            <div key={idx} className="product-item">
                                <div className="product-title">{product.name}</div>
                                <div className="text-gray-400 text-sm mb-2">{product.desc}</div>
                                <div className="product-price">KSH {product.price}</div>
                                <button className="cart-btn" onClick={() => addToCart(product)}>
                                    <i className="fas fa-cart-plus mr-2"></i> ADD TO CART
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 p-5 bg-cyan-900/20 rounded-lg border-l-4 border-cyan-400">
                        <div className="flex justify-between items-center mb-4">
                            <p className="text-white font-bold">
                                <i className="fas fa-mobile-alt mr-2"></i> M-Pesa & Airtel Money payments available
                            </p>
                            <div className="text-cyan-400 font-bold">
                                <i className="fas fa-shopping-cart mr-2"></i> {cart.length} items
                            </div>
                        </div>
                        <button onClick={() => setShowCartPage(true)} className="cart-btn bg-cyan-500/20 border-cyan-500 hover:bg-cyan-500/40 w-full">
                            <i className="fas fa-shopping-bag mr-2"></i> VIEW CART & CHECKOUT
                        </button>
                    </div>
                </div>
            )}

            {/* MD Link Section */}
            {activeSection === 'md' && (
                <div className="section-container section-enter">
                    <h2 className="text-cyan-400 mb-5 text-center text-2xl font-bold">
                        <i className="fab fa-whatsapp mr-2"></i> MD WHATSAPP BOT
                    </h2>

                    <div className="max-w-[500px] mx-auto">
                        {/* MD Link Success (Menu) */}
                        {mdConnectedNumber ? (
                            <div className="animate-in fade-in zoom-in duration-500 text-center">
                                <div className="mt-10 mb-10 bg-green-900/40 border border-green-500/50 p-8 rounded-lg shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                                    <div className="mb-4 text-6xl">🎉</div>
                                    <h3 className="text-3xl font-bold text-green-400 mb-4">SUCCESSFULL LINKED!</h3>
                                    <p className="text-white text-lg">
                                        Number <span className="text-cyan-400 font-bold">{mdConnectedNumber}</span> has been successfully eqimped with <span className="text-cyan-400 font-bold">CORTANA MD</span>
                                    </p>
                                </div>
                                <div className="text-center mt-4">
                                    <button
                                        onClick={() => setMdConnectedNumber('')}
                                        className="text-gray-500 hover:text-white underline text-sm"
                                    >
                                        Disconnect / Link New Device
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Link Form */}
                                <div className="mb-5">
                                    <label className="text-cyan-400 block mb-2 font-bold">
                                        WhatsApp Number (254xxxxxxxxx)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="254712345678"
                                        value={mdWhatsappNumber}
                                        onChange={(e) => setMdWhatsappNumber(e.target.value)}
                                        className="w-full p-3 bg-white/10 border-2 border-cyan-500/50 text-white rounded-lg font-mono"
                                    />
                                </div>

                                <button
                                    onClick={generateMDLinkCode}
                                    className="cart-btn"
                                    disabled={mdIsLinking}
                                    data-testid="button-generate-code"
                                >
                                    <i className={`fas ${mdIsLinking ? 'fa-spinner fa-spin' : 'fa-bolt'} mr-2`}></i>
                                    {mdIsLinking ? 'GENERATING...' : 'GENERATE LINK CODE'}
                                </button>

                                {mdLinkError && (
                                    <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400" data-testid="text-link-error">
                                        <i className="fas fa-exclamation-circle mr-2"></i> {mdLinkError}
                                    </div>
                                )}

                                {mdGeneratedCode && !mdLinkError && (
                                    <div className="mt-6 p-5 bg-cyan-500/15 rounded-lg border border-cyan-500/30">
                                        <div className="text-3xl tracking-widest text-white font-mono p-4 bg-black/50 rounded text-center mb-4 relative group">
                                            {mdGeneratedCode}
                                        </div>
                                        <div className="flex justify-center mb-4">
                                            <button
                                                onClick={() => copyToClipboard(mdGeneratedCode)}
                                                className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-500 rounded text-cyan-400 text-sm flex items-center transition-colors"
                                            >
                                                <i className="fas fa-copy mr-2"></i> COPY CODE
                                            </button>
                                        </div>
                                        <div className="text-sm text-gray-300 mt-4 leading-relaxed">
                                            <strong>Instructions:</strong><br />
                                            1. Open WhatsApp on your phone<br />
                                            2. Go to Settings → Linked Devices<br />
                                            3. Tap "Link a Device"<br />
                                            4. Tap "Link with phone number instead"<br />
                                            5. Enter the code above
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        <div className="mt-8 text-center">
                            <div className="text-cyan-400 mb-2 font-bold">
                                <i className="fas fa-chart-line mr-2"></i> ACTIVE SESSIONS
                            </div>
                            <div className="text-4xl text-green-400 font-bold animate-pulse">{activeSessions}</div>
                        </div>

                        <div className="text-center mt-8">
                            <a href="https://wa.me/254113374182" target="_blank" className="icon whatsapp inline-flex mb-4 w-16 h-16 mx-auto">
                                <i className="fab fa-whatsapp"></i>
                            </a>
                            <div className="text-cyan-400 font-bold">
                                Need help? Contact Developer
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bug Link Section */}
            {activeSection === 'bug' && (
                <div className="section-container section-enter relative overflow-hidden">
                    <canvas ref={canvasRef} className="absolute inset-0 z-[-1] opacity-30 pointer-events-none" />

                    {!isLoggedIn ? (
                        <>
                            <div className="character">
                                <div className="eye bg-cyan-400 shadow-[0_0_15px_#00a8ff]"></div>
                                <div className="eye bg-cyan-400 shadow-[0_0_15px_#00a8ff] left-[55%]"></div>
                            </div>
                            <h2 className="text-cyan-400 mb-6 text-center text-2xl font-bold">
                                <i className="fas fa-lock mr-2"></i> SECURE LOGIN
                            </h2>

                            <div className={`max-w-[400px] mx-auto ${loginError ? 'login-shake' : ''}`}>
                                <div className="mb-5">
                                    <label className="text-cyan-400 block mb-2 font-bold">Username</label>
                                    <input id="username-input" type="text" placeholder="Enter username" className="w-full p-3 bg-white/10 border-2 border-cyan-500/50 text-white rounded-lg" />
                                </div>

                                <div className="mb-5 relative">
                                    <label className="text-cyan-400 block mb-2 font-bold">Password</label>
                                    <input id="password-input" type="password" placeholder="Enter password" className="w-full p-3 bg-white/10 border-2 border-cyan-500/50 text-white rounded-lg" />
                                </div>

                                <div className="mb-8 flex items-center">
                                    <input
                                        type="checkbox"
                                        id="remember-me"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500 focus:ring-2"
                                    />
                                    <label htmlFor="remember-me" className="ml-2 text-sm font-medium text-gray-300">Remember Me</label>
                                </div>

                                <button className="cart-btn" onClick={handleLogin}>
                                    <i className="fas fa-sign-in-alt mr-2"></i> LOGIN
                                </button>

                                <div className="mt-6 p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/30 text-center">
                                    <p className="text-gray-300 mb-3">Don't have login credentials?</p>
                                    <a href="https://t.me/Cortana_universal_logins_bot" target="_blank" className="cart-btn inline-flex items-center">
                                        <i className="fab fa-telegram mr-2"></i> GET LOGINS FROM TELEGRAM BOT
                                    </a>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Exploit Mode Header */}
                            <h2 className="glitch-text mb-5 text-center text-3xl font-bold text-red-500">
                                <i className="fas fa-biohazard mr-2"></i> DEATH EDITION
                            </h2>

                            {/* Session Status Display */}
                            {bugConnectedNumber && (
                                <div className="text-center mb-4 text-green-400 font-mono text-sm">
                                    Linked: {bugConnectedNumber} | Session Active
                                </div>
                            )}

                            {/* 1. Exploit Linking Phase */}
                            {!bugConnectedNumber ? (
                                <div className="max-w-[450px] mx-auto bg-black/40 p-6 rounded-lg border border-red-500/30">
                                    <h3 className="text-red-400 font-bold mb-4 text-center">
                                        <i className="fas fa-link mr-2"></i> LINK DEVICE TO ACCESS
                                    </h3>

                                    {showBugSuccessMessage && (
                                        <div className="mb-4 bg-green-900/40 p-3 rounded text-green-400 text-center border border-green-500/50">
                                            <i className="fas fa-check mr-2"></i> SUCCESSFULLY LINKED
                                        </div>
                                    )}

                                    <div className="mb-4">
                                        <label className="text-gray-400 text-xs block mb-1">WHATSAPP NUMBER</label>
                                        <input
                                            type="text"
                                            placeholder="254700000000"
                                            value={bugWhatsappNumber}
                                            onChange={(e) => setBugWhatsappNumber(e.target.value)}
                                            className="w-full bg-black/50 border border-red-500/30 rounded p-2 text-white text-center font-mono focus:border-red-500 outline-none"
                                        />
                                    </div>

                                    <button
                                        onClick={generateBugLinkCode}
                                        disabled={bugIsLinking}
                                        className="w-full bg-red-600/20 hover:bg-red-600/40 text-red-500 border border-red-500/50 py-2 rounded font-bold transition-all disabled:opacity-50"
                                    >
                                        {bugIsLinking ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-key mr-2"></i> GENERATE PAIRING CODE</>}
                                    </button>

                                    {bugGeneratedCode && (
                                        <div className="mt-4 text-center animate-in fade-in">
                                            <div className="text-xs text-gray-500 mb-1">PAIRING CODE</div>
                                            <div className="text-2xl font-mono tracking-[0.2em] text-white bg-red-900/20 p-2 rounded border border-red-500/30 mb-4 relative group">
                                                {bugGeneratedCode}
                                            </div>
                                            <div className="flex justify-center mb-4">
                                                <button
                                                    onClick={() => copyToClipboard(bugGeneratedCode)}
                                                    className="px-4 py-2 bg-red-600/20 hover:bg-red-600/40 border border-red-500 rounded text-red-500 text-sm flex items-center transition-colors"
                                                >
                                                    <i className="fas fa-copy mr-2"></i> COPY CODE
                                                </button>
                                            </div>
                                            <div className="text-[10px] text-gray-500 mt-2">
                                                WhatsApp &gt; Linked Devices &gt; Link &gt; Link with phone number
                                            </div>
                                        </div>
                                    )}
                                    {bugLinkError && (
                                        <div className="mt-4 p-2 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm text-center">
                                            {bugLinkError}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* 2. Success Message (Death Edition) */
                                <div className="max-w-[800px] mx-auto p-4 animate-in zoom-in duration-500">
                                    <div className="mt-10 mb-10 bg-red-900/40 border border-red-500/50 p-8 rounded-lg text-center shadow-[0_0_30px_rgba(239,68,68,0.3)] relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse"></div>
                                        <div className="mb-4 text-6xl">☠️</div>
                                        <h3 className="text-3xl font-bold text-red-500 mb-4 glitch-text">EXPLOIT SUCCESSFULLY LINKED</h3>
                                        <p className="text-white text-lg font-mono">
                                            Number <span className="text-red-400 font-bold">{bugConnectedNumber}</span> has been successfully equped with <span className="text-red-500 font-bold">CORTANA EXPLOIT</span>
                                        </p>
                                        <div className="mt-8 p-4 bg-black/40 rounded border border-red-500/20 text-gray-400 text-sm">
                                            <i className="fas fa-info-circle mr-2 text-red-400"></i>
                                            Type <span className="text-red-400 font-bold font-mono">.menu</span> on your WhatsApp to access the full exploit dashboard.
                                        </div>
                                    </div>

                                    <div className="text-center mt-4">
                                        <button
                                            className="text-gray-500 hover:text-red-400 text-sm transition-colors"
                                            onClick={() => {
                                                localStorage.removeItem('cortana_login');
                                                setIsLoggedIn(false);
                                                setBugConnectedNumber('');
                                                toast({ description: "Logged out safely" });
                                            }}
                                        >
                                            <i className="fas fa-sign-out-alt mr-1"></i> Terminate Session & Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* About Section */}
            {activeSection === 'about' && (
                <div className="section-container section-enter">
                    <h2 className="text-cyan-400 mb-5 text-center text-2xl font-bold">
                        <i className="fas fa-info-circle mr-2"></i> ABOUT US
                    </h2>
                    <div className="bg-white/5 p-8 rounded-lg border-l-4 border-cyan-400">
                        <p className="leading-loose text-gray-300 mb-5 text-lg">
                            We are developers designing education tools, not meant to harm anyone and hence you will be responsible for any violation of law involved. Use our tools responsibly.
                        </p>
                        <div className="text-right text-cyan-400 italic text-xl mt-8">
                            $signed by dev.edu$
                        </div>
                    </div>
                </div>
            )}



            {/* Contact Icons */}
            {showContact && (
                <div className="contact-icons contact-icons-enter">
                    <a href="https://wa.me/254113374182" target="_blank" className="icon whatsapp">
                        <i className="fab fa-whatsapp"></i>
                    </a>
                    <a href="https://t.me/eduqariz" target="_blank" className="icon telegram">
                        <i className="fab fa-telegram"></i>
                    </a>
                    <a href="#" className="icon instagram">
                        <i className="fab fa-instagram"></i>
                    </a>
                    <a href="#" className="icon youtube">
                        <i className="fab fa-youtube"></i>
                    </a>
                    <a href="#" className="icon tiktok">
                        <i className="fab fa-tiktok"></i>
                    </a>
                </div>
            )}

            {showAccessGranted && (
                <div className="access-granted">
                    <div className="access-text" data-text="ACCESS GRANTED">ACCESS GRANTED</div>
                    <div className="text-cyan-400 mt-4 text-xl font-mono animate-pulse">Initializing System Exploit...</div>
                </div>
            )}

            {/* Checkout Modal */}
            {checkoutOpen && !paymentPage && (
                <div className="checkout-modal checkout-modal-enter">
                    <div className="checkout-content relative">
                        <span className="close-checkout" onClick={() => setCheckoutOpen(false)}>&times;</span>

                        <h2 className="text-cyan-400 mb-5 text-center text-2xl font-bold">
                            <i className="fas fa-credit-card mr-2"></i> CHECKOUT
                        </h2>

                        <div className="text-center mb-5">
                            <div className="text-2xl text-green-400 font-bold">Total: KSH {getTotalPrice()}</div>
                            <div className="text-gray-400 mt-2">{cart.length} item{cart.length !== 1 ? 's' : ''} in cart</div>
                        </div>

                        <h3 className="text-cyan-400 my-5 text-center font-bold">SELECT PAYMENT METHOD</h3>

                        <div className="payment-options">
                            <div className="payment-method" onClick={() => setPaymentPage('mpesa')}>
                                <div className="payment-icon mpesa-icon text-green-600"><i className="fas fa-mobile-alt"></i></div>
                                <div className="text-green-600 font-bold">M-PESA</div>
                                <div className="text-xs text-gray-400 mt-1">Safaricom Users</div>
                            </div>

                            <div className="payment-method" onClick={() => setPaymentPage('airtel')}>
                                <div className="payment-icon airtel-icon text-red-600"><i className="fas fa-signal"></i></div>
                                <div className="text-red-600 font-bold">AIRTEL MONEY</div>
                                <div className="text-xs text-gray-400 mt-1">Airtel Users</div>
                            </div>

                            <div className="payment-method" onClick={() => alert("International payment simulated.")}>
                                <div className="payment-icon international-icon text-yellow-400"><i className="fas fa-globe"></i></div>
                                <div className="text-yellow-400 font-bold">INTERNATIONAL</div>
                                <div className="text-xs text-gray-400 mt-1">Outside Kenya</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* M-Pesa Page */}
            {checkoutOpen && paymentPage === 'mpesa' && (
                <div className="payment-page block">
                    <div className="payment-header mpesa-header border-green-600">
                        <h1 className="text-green-600 text-3xl font-bold">
                            <i className="fas fa-mobile-alt mr-2"></i> M-PESA PAYMENT
                        </h1>
                        <p className="text-gray-400">Complete your payment via M-Pesa</p>
                    </div>
                    <div className="payment-content">
                        <div className="mb-5">
                            <label className="text-green-600 block mb-2 font-bold">Safaricom Phone Number</label>
                            <input type="text" placeholder="07xxxxxxxx" className="w-full p-3 bg-white/10 border-2 border-green-600 text-white rounded-lg font-mono" />
                        </div>
                        <div className="mb-5">
                            <label className="text-green-600 block mb-2 font-bold">Amount (KSH)</label>
                            <input type="text" value="0" readOnly className="w-full p-3 bg-white/10 border-2 border-green-600 text-white rounded-lg font-mono" />
                        </div>
                        <button className="cart-btn bg-green-900/50 border-green-600 hover:bg-green-800" onClick={() => alert("STK Push simulated!")}>
                            INITIATE PAYMENT
                        </button>
                        <button className="back-btn w-full mt-4" onClick={() => setPaymentPage(null)}>
                            BACK TO CHECKOUT
                        </button>
                    </div>
                </div>
            )}

            {/* Airtel Page */}
            {checkoutOpen && paymentPage === 'airtel' && (
                <div className="payment-page block">
                    <div className="payment-header airtel-header border-red-600">
                        <h1 className="text-red-600 text-3xl font-bold">
                            <i className="fas fa-signal mr-2"></i> AIRTEL MONEY PAYMENT
                        </h1>
                        <p className="text-gray-400">Complete your payment via Airtel Money</p>
                    </div>
                    <div className="payment-content">
                        <div className="mb-5">
                            <label className="text-red-600 block mb-2 font-bold">Airtel Phone Number</label>
                            <input type="text" placeholder="07xxxxxxxx" className="w-full p-3 bg-white/10 border-2 border-red-600 text-white rounded-lg font-mono" />
                        </div>
                        <div className="mb-5">
                            <label className="text-red-600 block mb-2 font-bold">Amount (KSH)</label>
                            <input type="text" value="0" readOnly className="w-full p-3 bg-white/10 border-2 border-red-600 text-white rounded-lg font-mono" />
                        </div>
                        <button className="cart-btn bg-red-900/50 border-red-600 hover:bg-red-800" onClick={() => alert("Payment simulated!")}>
                            INITIATE PAYMENT
                        </button>
                        <button className="back-btn w-full mt-4" onClick={() => setPaymentPage(null)}>
                            BACK TO CHECKOUT
                        </button>
                    </div>
                </div>
            )}

            {/* Cart Page Modal */}
            {showCartPage && (
                <div className="checkout-modal checkout-modal-enter">
                    <div className="checkout-content relative max-w-2xl">
                        <span className="close-checkout" onClick={() => setShowCartPage(false)}>&times;</span>

                        <h2 className="text-cyan-400 mb-5 text-center text-2xl font-bold">
                            <i className="fas fa-shopping-cart mr-2"></i> YOUR SHOPPING CART
                        </h2>

                        {cart.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4 opacity-50">🛒</div>
                                <p className="text-gray-400 text-lg">Your cart is empty</p>
                                <button
                                    onClick={() => setShowCartPage(false)}
                                    className="mt-6 cart-btn"
                                >
                                    <i className="fas fa-arrow-left mr-2"></i> CONTINUE SHOPPING
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="mb-6 max-h-96 overflow-y-auto">
                                    {cart.map((item, index) => (
                                        <div
                                            key={index}
                                            className="bg-white/5 p-4 rounded-lg mb-3 flex justify-between items-center border border-white/10 hover:border-cyan-500/50 transition-all"
                                        >
                                            <div>
                                                <div className="text-white font-bold">{item.name}</div>
                                                <div className="text-cyan-400 text-sm">KSH {item.price}</div>
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(index)}
                                                className="px-4 py-2 bg-red-500/20 border-2 border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/40 transition-all"
                                            >
                                                <i className="fas fa-trash mr-2"></i> Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-white/20 pt-4 mb-6">
                                    <div className="flex justify-between items-center text-xl">
                                        <span className="text-white font-bold">Total:</span>
                                        <span className="text-cyan-400 font-bold">KSH {getTotalPrice()}</span>
                                    </div>
                                    <div className="text-gray-400 text-sm mt-2">
                                        {cart.length} item{cart.length !== 1 ? 's' : ''} in cart
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowCartPage(false)}
                                        className="flex-1 px-6 py-3 bg-white/10 border-2 border-white/20 text-white rounded-lg hover:bg-white/20 transition-all"
                                    >
                                        <i className="fas fa-arrow-left mr-2"></i> Continue Shopping
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowCartPage(false);
                                            setCheckoutOpen(true);
                                        }}
                                        className="flex-1 cart-btn bg-green-500/20 border-green-500 hover:bg-green-500/40"
                                    >
                                        <i className="fas fa-credit-card mr-2"></i> PROCEED TO CHECKOUT
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Ticker */}
            <div className="ticker-container">
                <div className="ticker">
                    {TICKER_MESSAGES.map((msg, idx) => (
                        <div key={idx} className="ticker-item">{msg}</div>
                    ))}
                    {TICKER_MESSAGES.map((msg, idx) => (
                        <div key={`dup-${idx}`} className="ticker-item">{msg}</div>
                    ))}
                </div>
            </div>
            {/* FAIL OVERLAY */}
            {showFailOverlay && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
                    <img src="/monkey_cry.png" alt="Failed" className="w-64 h-64 mb-8 object-contain animate-bounce" />
                    <h2 className="text-4xl text-red-500 font-bold mb-6 text-center">Ohh! 😢</h2>
                    <p className="text-xl text-center max-w-3xl leading-relaxed text-gray-300 mb-8">
                        We are Dissapointed to inform you the logins you inserted were declined by our system, consinder generating other logins from telegram bot, or simply checking the input of your logins. Otherwise if yall cheating🙅, or logins expired, then message admin creator for assistant😒🤣. See our contact page in the sections above
                    </p>
                    <button
                        onClick={() => setShowFailOverlay(false)}
                        className="px-8 py-3 bg-red-600/20 border border-red-500 rounded text-red-400 hover:bg-red-600/40 transition-colors uppercase tracking-widest"
                    >
                        Close
                    </button>
                </div>
            )}

            {/* SUCCESS OVERLAY */}
            {showSuccessOverlay && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
                    <img src="/simpson_happy.png" alt="Success" className="w-64 h-64 mb-8 object-contain animate-pulse" />
                    <h2 className="text-4xl text-green-500 font-bold mb-6 text-center">ACCESS GRANTED! 🎉</h2>
                    <p className="text-xl text-center max-w-3xl leading-relaxed text-gray-300 mb-8">
                        Great work for accessing the Unleashing Chaos which Cortana Provides you with, otherwise dont misuse any of our tools provided, they are just for education purposes and prank fun, we are not responsible for any violation you involve🙅🙅🙅😂 Happy Usage💃💃
                    </p>
                    <button
                        onClick={() => { setShowSuccessOverlay(false); setIsLoggedIn(true); }}
                        className="px-8 py-3 bg-green-600/20 border border-green-500 rounded text-green-400 hover:bg-green-600/40 transition-colors uppercase tracking-widest"
                    >
                        Enter Dashboard
                    </button>
                </div>
            )}
            {/* FAIL OVERLAY */}
            {showFailOverlay && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
                    <img src="/monkey_cry.png" alt="Failed" className="w-64 h-64 mb-8 object-contain animate-bounce" />
                    <h2 className="text-4xl text-red-500 font-bold mb-6 text-center">Ohh! 😢</h2>
                    <p className="text-xl text-center max-w-3xl leading-relaxed text-gray-300 mb-8">
                        We are Dissapointed to inform you the logins you inserted were declined by our system, consinder generating other logins from telegram bot, or simply checking the input of your logins. Otherwise if yall cheating🙅, or logins expired, then message admin creator for assistant😒🤣. See our contact page in the sections above
                    </p>
                    <button
                        onClick={() => setShowFailOverlay(false)}
                        className="px-8 py-3 bg-red-600/20 border border-red-500 rounded text-red-400 hover:bg-red-600/40 transition-colors uppercase tracking-widest"
                    >
                        Close
                    </button>
                </div>
            )}

            {/* SUCCESS OVERLAY */}
            {showSuccessOverlay && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
                    <img src="/simpson_happy.png" alt="Success" className="w-64 h-64 mb-8 object-contain animate-pulse" />
                    <h2 className="text-4xl text-green-500 font-bold mb-6 text-center">ACCESS GRANTED! 🎉</h2>
                    <p className="text-xl text-center max-w-3xl leading-relaxed text-gray-300 mb-8">
                        Great work for accessing the Unleashing Chaos which Cortana Provides you with, otherwise dont misuse any of our tools provided, they are just for education purposes and prank fun, we are not responsible for any violation you involve🙅🙅🙅😂 Happy Usage💃💃
                    </p>
                    <button
                        onClick={() => { setShowSuccessOverlay(false); setIsLoggedIn(true); }}
                        className="px-8 py-3 bg-green-600/20 border border-green-500 rounded text-green-400 hover:bg-green-600/40 transition-colors uppercase tracking-widest"
                    >
                        Enter Dashboard
                    </button>
                </div>
            )}
        </div>
    );
}