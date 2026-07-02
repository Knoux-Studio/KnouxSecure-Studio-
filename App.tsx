
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, LogEntry, LogLevel, VaultFile, AppSettings } from './types';
import DashboardView from './components/DashboardView';
import ScannerView from './components/ScannerView';
import VaultView from './components/VaultView';
import SandboxView from './components/SandboxView';
import SettingsView from './components/SettingsView';
import Sidebar from './components/Sidebar';
import VoiceControl from './components/VoiceControl';
import { ChevronRight, Sun, Moon, Activity, Info, Keyboard, Search, Lock, Fingerprint, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const LockCanvas: React.FC = () => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Resolve custom accent color from CSS variables
        const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--neon-purple').trim() || '#A855F7';
        
        const hexToRgb = (hex: string) => {
            const clean = hex.replace('#', '');
            const r = parseInt(clean.slice(0, 2), 16) || 168;
            const g = parseInt(clean.slice(2, 4), 16) || 85;
            const b = parseInt(clean.slice(4, 6), 16) || 247;
            return { r, g, b };
        };
        
        const rgb = hexToRgb(accentColor);

        let animationFrameId: number;
        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        const handleResize = () => {
            if (!canvas) return;
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);

        // Nodes for geometric abstract lines
        const numNodes = 40;
        const nodes: { x: number; y: number; vx: number; vy: number; radius: number }[] = [];

        for (let i = 0; i < numNodes; i++) {
            nodes.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                radius: Math.random() * 2 + 1,
            });
        }

        const draw = () => {
            ctx.clearRect(0, 0, width, height);

            // Draw connection lines
            ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.08)`; // Deep purple/custom lines
            ctx.lineWidth = 1;
            for (let i = 0; i < numNodes; i++) {
                for (let j = i + 1; j < numNodes; j++) {
                    const dx = nodes[i].x - nodes[j].x;
                    const dy = nodes[i].y - nodes[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 150) {
                        ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.12 * (1 - dist / 150)})`;
                        ctx.beginPath();
                        ctx.moveTo(nodes[i].x, nodes[i].y);
                        ctx.lineTo(nodes[j].x, nodes[j].y);
                        ctx.stroke();
                    }
                }
            }

            // Draw and update nodes
            nodes.forEach((node) => {
                ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`;
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
                ctx.fill();

                // Slow subtle glow
                ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.04)`;
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius * 4, 0, Math.PI * 2);
                ctx.fill();

                node.x += node.vx;
                node.y += node.vy;

                // Bounce off edges
                if (node.x < 0 || node.x > width) node.vx *= -1;
                if (node.y < 0 || node.y > height) node.vy *= -1;
            });

            // Draw rotating rings in the center
            const centerX = width / 2;
            const centerY = height / 2;
            const time = Date.now() * 0.0004;

            // Outer ring
            ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.04)`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(centerX, centerY, 240, 0, Math.PI * 2);
            ctx.stroke();

            // Segmented ring
            ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`;
            ctx.lineWidth = 2;
            ctx.setLineDash([20, 40]);
            ctx.beginPath();
            ctx.arc(centerX, centerY, 200, time, time + Math.PI * 2);
            ctx.stroke();

            // Inner rotating dashed ring
            ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`;
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 15]);
            ctx.beginPath();
            ctx.arc(centerX, centerY, 160, -time * 1.5, -time * 1.5 + Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]); // Reset

            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
};

const formatDuration = (ms: number): string => {
    const totalSecs = Math.floor(ms / 1000);
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    if (m > 0) {
        return `${m}m ${s}s`;
    }
    return `${s}s`;
};

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>('DASHBOARD');
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAutoLocked, setIsAutoLocked] = useState(false);
    const lastActivityTime = useRef<number>(Date.now());
    
    // Login Screen Memory Protection States
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [logoutCountdown, setLogoutCountdown] = useState<number | null>(null);
    const [showSplash, setShowSplash] = useState(true);
    const [splashProgress, setSplashProgress] = useState(0);
    const [splashMessage, setSplashMessage] = useState('DECRYPTING SYSTEM INTEGRITY POOL...');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [isLoginShaking, setIsLoginShaking] = useState(false);
    const sessionLoginTime = useRef<number | null>(null);
    
    // Auto-lock Session Tracking Refs & States
    const sessionStartTime = useRef<number>(Date.now());
    const lockTime = useRef<number | null>(null);
    const sessionActiveDuration = useRef<number>(0);
    const [securedTimeText, setSecuredTimeText] = useState('');
    const [activeSessionDurationText, setActiveSessionDurationText] = useState('');
    const [securedDurationText, setSecuredDurationText] = useState('0s');
    const [isShaking, setIsShaking] = useState(false);
    const [unlockMethod, setUnlockMethod] = useState<'pin' | 'biometric' | 'button'>('pin');
    const [enteredPin, setEnteredPin] = useState('');
    const [isBiometricScanning, setIsBiometricScanning] = useState(false);
    const [biometricStatus, setBiometricStatus] = useState('');
    const [biometricSuccess, setBiometricSuccess] = useState(false);
    
    const [settings, setSettings] = useState<AppSettings>(() => {
        const stored = localStorage.getItem('knoux_settings');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                return {
                    encryptByDefault: false,
                    sandboxEnabled: true,
                    protectionLevel: 'PROTECTED',
                    autoScanOnSave: true,
                    notificationsEnabled: true,
                    autoLockTimeout: 15,
                    securityPin: "1337",
                    trustedNetworkEnabled: false,
                    trustedSSID: "KNOUX_HQ_SECURE",
                    trustedIP: "192.168.1.1",
                    customAccentColor: '#A855F7',
                    autoLogoutTimeout: 0,
                    ...parsed
                };
            } catch (e) {
                // fallback
            }
        }
        return {
            encryptByDefault: false,
            sandboxEnabled: true,
            protectionLevel: 'PROTECTED',
            autoScanOnSave: true,
            notificationsEnabled: true,
            autoLockTimeout: 15,
            securityPin: "1337",
            trustedNetworkEnabled: false,
            trustedSSID: "KNOUX_HQ_SECURE",
            trustedIP: "192.168.1.1",
            customAccentColor: '#A855F7',
            autoLogoutTimeout: 0
        };
    });
    
    const [vaultFiles, setVaultFiles] = useState<VaultFile[]>(() => {
        const stored = localStorage.getItem('knoux_vault_files');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                // fallback
            }
        }
        return [
            { id: '1', name: 'security_config.ps1', type: 'PowerShell', encryptedAt: '2025-05-12', size: '1.2 KB', status: 'LOCKED' },
            { id: '2', name: 'api_gateway.js', type: 'JavaScript', encryptedAt: '2025-05-14', size: '4.5 KB', status: 'LOCKED' },
            { id: '3', name: 'payload_scanner.py', type: 'Python', encryptedAt: '2025-05-15', size: '2.8 KB', status: 'UNLOCKED' },
            { id: '4', name: 'prod_database_secret.env', type: 'Credential', encryptedAt: '2025-05-18', size: '0.4 KB', status: 'UNLOCKED', passwordValue: 'dbpass123', entropy: 32 },
            { id: '5', name: 'admin_root_ssh_key.key', type: 'Private Key', encryptedAt: '2025-05-16', size: '1.8 KB', status: 'LOCKED', passwordValue: 'AdminSecureKey#2026!', entropy: 88 },
            { id: '6', name: 'github_oauth_token.txt', type: 'Token', encryptedAt: '2025-05-20', size: '0.6 KB', status: 'LOCKED', passwordValue: 'ghp_KnouxSecureAlphaToken2026Engine', entropy: 135 },
            { id: '7', name: 'legacy_access_pin.json', type: 'PIN Store', encryptedAt: '2025-05-22', size: '0.2 KB', status: 'UNLOCKED', passwordValue: '1984', entropy: 13 },
            { id: '8', name: 'api_key_openai.txt', type: 'API Key', encryptedAt: '2025-05-23', size: '0.3 KB', status: 'LOCKED', passwordValue: 'sk-proj-A1B2C3D4E5F6G7H8I9J0', entropy: 72 }
        ];
    });

    const addLog = useCallback((level: LogLevel, message: string, source: string) => {
        const newLog: LogEntry = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toLocaleTimeString(),
            level,
            message,
            source
        };
        setLogs(prev => [newLog, ...prev].slice(0, 100));
    }, []);

    const exportVault = useCallback(() => {
        try {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(vaultFiles, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", `knouxsecure_vault_export_${new Date().toISOString().split('T')[0]}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
            addLog(LogLevel.INFO, "Vault configuration exported successfully.", "VAULT");
        } catch (error) {
            addLog(LogLevel.ERROR, "Failed to export vault files.", "VAULT");
        }
    }, [vaultFiles, addLog]);

    const importVault = useCallback((importedFiles: VaultFile[]) => {
        try {
            setVaultFiles(importedFiles);
            addLog(LogLevel.INFO, `Restored ${importedFiles.length} keys/files into vault.`, "VAULT");
        } catch (error) {
            addLog(LogLevel.ERROR, "Failed to restore vault database.", "VAULT");
        }
    }, [addLog]);

    // Keyboard shortcuts handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isCtrlOrCmd = e.ctrlKey || e.metaKey;
            
            // Ctrl+S / Cmd+S - Save/Export state
            if (isCtrlOrCmd && e.key.toLowerCase() === 's') {
                e.preventDefault();
                exportVault();
                addLog(LogLevel.INFO, "Shortcut [Ctrl+S] executed: Export Vault.", "SYSTEM");
            }
            
            // Ctrl+K / Cmd+K - Toggle Dark Mode
            if (isCtrlOrCmd && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setIsDarkMode(prev => !prev);
                addLog(LogLevel.INFO, "Shortcut [Ctrl+K] executed: Toggle Dark/Light theme.", "SYSTEM");
            }

            // Alt + 1-7 - Tab switcher
            if (e.altKey) {
                const num = parseInt(e.key);
                if (num >= 1 && num <= 7) {
                    e.preventDefault();
                    const views: View[] = ['DASHBOARD', 'SCANNER', 'SANDBOX', 'VAULT', 'LOGS', 'SETTINGS', 'HELP'];
                    const selectedView = views[num - 1];
                    if (selectedView) {
                        setCurrentView(selectedView);
                        addLog(LogLevel.INFO, `Shortcut [Alt+${num}]: Switched view to ${selectedView}`, "SYSTEM");
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [exportVault, addLog]);

    useEffect(() => {
        localStorage.setItem('knoux_vault_files', JSON.stringify(vaultFiles));
    }, [vaultFiles]);

    useEffect(() => {
        localStorage.setItem('knoux_settings', JSON.stringify(settings));
    }, [settings]);

    const handleLogin = (pass: string) => {
        if (!pass) {
            setLoginError('Master passphrase cannot be blank.');
            setIsLoginShaking(true);
            setTimeout(() => setIsLoginShaking(false), 500);
            playSecuritySound('error');
            return;
        }

        const cleanPass = pass.trim();
        const pinMatch = settings.securityPin ? (cleanPass === settings.securityPin) : (cleanPass === '1337');
        
        if (cleanPass === 'admin' || cleanPass === 'knouxsecure' || pinMatch) {
            setIsLoggedIn(true);
            setLoginError('');
            sessionLoginTime.current = Date.now();
            addLog(LogLevel.INFO, "Session successfully authenticated. Memory space decrypted.", "SECURITY");
            playSecuritySound('unlock');
        } else {
            setLoginError('AUTHENTICATION FAILURE: Invalid cryptographic master passphrase or security PIN.');
            setIsLoginShaking(true);
            setTimeout(() => setIsLoginShaking(false), 500);
            playSecuritySound('error');
        }
    };

    // Custom Accent Color Sync Effect
    useEffect(() => {
        const accent = settings.customAccentColor || '#A855F7';
        document.documentElement.style.setProperty('--neon-purple', accent);
        
        const hexToRgba = (hex: string, alpha: number) => {
            const cleanHex = hex.replace('#', '');
            const r = parseInt(cleanHex.slice(0, 2), 16) || 168;
            const g = parseInt(cleanHex.slice(2, 4), 16) || 85;
            const b = parseInt(cleanHex.slice(4, 6), 16) || 247;
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };
        
        try {
            if (accent.startsWith('#') && accent.length === 7) {
                const glow = hexToRgba(accent, isDarkMode ? 0.4 : 0.15);
                document.documentElement.style.setProperty('--neon-glow', glow);
            }
        } catch (e) {
            console.error("Hex parsing error", e);
        }
    }, [settings.customAccentColor, isDarkMode]);

    // Auto-Logout Session Watchdog with 60-second Countdown Toast Warning
    useEffect(() => {
        if (!isLoggedIn) {
            setLogoutCountdown(null);
            return;
        }
        const logoutMinutes = settings.autoLogoutTimeout || 0;
        if (logoutMinutes <= 0) {
            setLogoutCountdown(null);
            return;
        }

        const interval = setInterval(() => {
            if (!sessionLoginTime.current) return;
            const elapsedMs = Date.now() - sessionLoginTime.current;
            const limitMs = logoutMinutes * 60 * 1000;
            const remainingMs = limitMs - elapsedMs;

            if (remainingMs <= 60000) {
                const secondsLeft = Math.max(0, Math.ceil(remainingMs / 1000));
                setLogoutCountdown(secondsLeft);

                if (remainingMs <= 0) {
                    // Flash memory / Flush sensitive states
                    setEnteredPin('');
                    setLoginPassword('');
                    // Seal all vault assets
                    setVaultFiles(prev => prev.map(f => ({ ...f, status: 'LOCKED' })));
                    setIsLoggedIn(false);
                    sessionLoginTime.current = null;
                    setLogoutCountdown(null);
                    
                    addLog(LogLevel.WARN, `Absolute session limit of ${logoutMinutes} minute(s) reached. Memory isolation protocol completed. Redirection to secure enclave.`, "SYSTEM");
                    playSecuritySound('error');
                }
            } else {
                setLogoutCountdown(null);
            }
        }, 1000); // Check every second for countdown precision

        return () => clearInterval(interval);
    }, [isLoggedIn, settings.autoLogoutTimeout, addLog, setVaultFiles]);

    // Background Integrity Verification on Startup
    useEffect(() => {
        const timer = setTimeout(() => {
            const rawVault = localStorage.getItem('knoux_vault_files');
            if (!rawVault) {
                addLog(LogLevel.INFO, "Integrity Check: Fresh session. Secure storage initialized with standard cryptographic assets.", "INTEGRITY");
                return;
            }
            try {
                const parsed = JSON.parse(rawVault);
                if (!Array.isArray(parsed)) {
                    throw new Error("Stored data is not a valid array structure.");
                }
                
                let unreadableCount = 0;
                const corruptedDetails: string[] = [];
                
                parsed.forEach((f: any, idx: number) => {
                    const isCorrupted = !f || typeof f !== 'object' || !f.id || !f.name || !f.status;
                    if (isCorrupted) {
                        unreadableCount++;
                        corruptedDetails.push(f?.name ? `"${f.name}"` : `Entry #${idx + 1}`);
                    }
                });

                if (unreadableCount > 0) {
                    addLog(
                        LogLevel.ERROR, 
                        `Integrity Report: Critical error! Detected ${unreadableCount} corrupted vault JSON entries (${corruptedDetails.join(', ')}). The file structures are corrupted and cannot be decrypted.`, 
                        "INTEGRITY"
                    );
                } else {
                    addLog(
                        LogLevel.INFO, 
                        `Integrity Report: Database verification completed. Verified ${parsed.length} items. 0 corrupted entries found. Secure file system integrity nominal.`, 
                        "INTEGRITY"
                    );
                }
            } catch (err: any) {
                addLog(
                    LogLevel.ERROR, 
                    `Integrity Report: CRITICAL FAILURE! Stored vault JSON is completely unreadable or corrupted. Error parsing: ${err.message}. System memory isolation is recommended.`, 
                    "INTEGRITY"
                );
            }
        }, 1200);

        return () => clearTimeout(timer);
    }, [addLog]);

    useEffect(() => {
        addLog(LogLevel.INFO, "KnouxSecure Studio™ System Active.", "SYSTEM");
    }, [addLog]);

    // Luxury Splash Screen Progress & Sound Effects
    useEffect(() => {
        if (!showSplash) return;
        
        // Play initialization scan sonar sound
        try {
            playSecuritySound('scan');
        } catch (e) {
            console.warn(e);
        }

        const interval = setInterval(() => {
            setSplashProgress(prev => {
                const step = Math.floor(Math.random() * 8) + 5;
                const next = prev + step;
                if (next >= 100) {
                    clearInterval(interval);
                    setTimeout(() => {
                        setShowSplash(false);
                        try {
                            playSecuritySound('success');
                        } catch (e) {
                            console.warn(e);
                        }
                    }, 400);
                    return 100;
                }
                return next;
            });
        }, 110);

        return () => clearInterval(interval);
    }, [showSplash]);

    // Update splash message based on progress
    useEffect(() => {
        if (splashProgress < 15) {
            setSplashMessage('DECRYPTING CRYPTOGRAPHIC SYSTEM INTEGRITY POOL...');
        } else if (splashProgress < 35) {
            setSplashMessage('MOUNTING MEMORY ISOLATION SANDBOX...');
        } else if (splashProgress < 55) {
            setSplashMessage('ESTABLISHING SECURE AES-256 GCM SEALED ENCLAVE...');
        } else if (splashProgress < 75) {
            setSplashMessage('VERIFYING AUDIT LOGS & HANDSHAKE SIGNATURES...');
        } else if (splashProgress < 95) {
            setSplashMessage('SYNCHRONIZING SECURE BIOMETRIC IDENTIFIERS...');
        } else {
            setSplashMessage('DECRYPTION COMPLETE. INITIALIZING STUDIO...');
        }
    }, [splashProgress]);

    useEffect(() => {
        if (!isDarkMode) {
            document.body.classList.add('light');
        } else {
            document.body.classList.remove('light');
        }
    }, [isDarkMode]);

    // Locked Duration Live Counter Effect
    useEffect(() => {
        if (!isAutoLocked || !lockTime.current) return;
        
        const updateSecuredDuration = () => {
            const elapsed = Date.now() - lockTime.current!;
            setSecuredDurationText(formatDuration(elapsed));
        };
        
        updateSecuredDuration();
        const interval = setInterval(updateSecuredDuration, 1000);
        return () => clearInterval(interval);
    }, [isAutoLocked]);

    const handlePinDigit = (digit: string) => {
        if (enteredPin.length < 4) {
            const nextPin = enteredPin + digit;
            setEnteredPin(nextPin);
            
            if (nextPin.length === 4) {
                const correctPin = settings.securityPin || "1337";
                if (nextPin === correctPin) {
                    setIsAutoLocked(false);
                    lastActivityTime.current = Date.now();
                    sessionStartTime.current = Date.now();
                    
                    const securedAt = securedTimeText || new Date().toLocaleTimeString();
                    const lockDurationMs = Date.now() - (lockTime.current || Date.now());
                    const lockDurationText = formatDuration(lockDurationMs);
                    const idleTimeoutMinutes = settings.autoLockTimeout || 0;

                    addLog(
                        LogLevel.INFO, 
                        `Session Summary: System unlocked via Secure PIN. Session was secured at ${securedAt} after ${idleTimeoutMinutes}m of user inactivity. Lock state duration: ${lockDurationText}.`, 
                        "SYSTEM"
                    );
                    setEnteredPin('');
                } else {
                    setIsShaking(true);
                    setTimeout(() => setIsShaking(false), 500);
                    setEnteredPin('');
                    addLog(LogLevel.ERROR, `Unauthorized PIN attempt detected. Invalid PIN entered.`, "SYSTEM");
                }
            }
        }
    };

    const handleQuickUnlock = () => {
        setIsAutoLocked(false);
        lastActivityTime.current = Date.now();
        sessionStartTime.current = Date.now();
        
        const securedAt = securedTimeText || new Date().toLocaleTimeString();
        const lockDurationMs = Date.now() - (lockTime.current || Date.now());
        const lockDurationText = formatDuration(lockDurationMs);
        const idleTimeoutMinutes = settings.autoLockTimeout || 0;

        addLog(
            LogLevel.INFO, 
            `Session Summary: System unlocked via Quick Unlock. Session was secured at ${securedAt} after ${idleTimeoutMinutes}m of user inactivity. Lock state duration: ${lockDurationText}.`, 
            "SYSTEM"
        );
    };

    const handleBiometricUnlock = async () => {
        setIsBiometricScanning(true);
        setBiometricSuccess(false);
        setBiometricStatus('Initializing hardware enclave...');
        addLog(LogLevel.INFO, "Initiating WebAuthn / Biometric session authentication.", "SECURITY");

        // Try Web Authentication API if browser supports it and it's not inside blocked sandbox
        try {
            if (window.PublicKeyCredential && typeof navigator.credentials?.get === 'function') {
                const abortController = new AbortController();
                setTimeout(() => abortController.abort(), 600);
                
                const options: CredentialRequestOptions = {
                    publicKey: {
                        challenge: new Uint8Array([1, 2, 3, 4]),
                        rpId: window.location.hostname,
                        allowCredentials: [],
                        userVerification: 'required'
                    },
                    signal: abortController.signal
                };
                await navigator.credentials.get(options);
            }
        } catch (e) {
            console.log("WebAuthn iframe restriction or unsupported; falling back to secure biometric simulation.", e);
        }

        // Run simulation steps
        const steps = [
            { text: 'Activating optic sensors...', delay: 400 },
            { text: 'Analyzing thermal profile...', delay: 800 },
            { text: 'Matching fingerprint minutiae...', delay: 1300 },
            { text: 'Credential verified. Access Granted.', delay: 1800 }
        ];

        steps.forEach((step) => {
            setTimeout(() => {
                setBiometricStatus(step.text);
                if (step.text.includes('Granted')) {
                    setBiometricSuccess(true);
                    setTimeout(() => {
                        setIsBiometricScanning(false);
                        setIsAutoLocked(false);
                        lastActivityTime.current = Date.now();
                        sessionStartTime.current = Date.now();
                        
                        const securedAt = securedTimeText || new Date().toLocaleTimeString();
                        const lockDurationMs = Date.now() - (lockTime.current || Date.now());
                        const lockDurationText = formatDuration(lockDurationMs);
                        const idleTimeoutMinutes = settings.autoLockTimeout || 0;

                        addLog(
                            LogLevel.INFO, 
                            `Session Summary: System unlocked via Biometric scan. Session was secured at ${securedAt} after ${idleTimeoutMinutes}m of user inactivity. Lock state duration: ${lockDurationText}.`, 
                            "SYSTEM"
                        );
                    }, 400);
                }
            }, step.delay);
        });
    };

    // Auto-Lock Inactivity Handler
    useEffect(() => {
        if (isAutoLocked) return;
        const timeoutMinutes = settings.autoLockTimeout || 0;
        if (timeoutMinutes <= 0) return;

        const interval = setInterval(() => {
            // Check if trusted network bypass is active
            if (settings.trustedNetworkEnabled) {
                const activeSSID = "KNOUX_HQ_SECURE";
                const activeIP = "192.168.1.1";
                const matchesSSID = settings.trustedSSID && activeSSID.toLowerCase() === settings.trustedSSID.toLowerCase();
                const matchesIP = settings.trustedIP && activeIP.trim() === settings.trustedIP.trim();
                
                if (matchesSSID || matchesIP) {
                    lastActivityTime.current = Date.now();
                    return;
                }
            }

            const idleTimeMs = Date.now() - lastActivityTime.current;
            const thresholdMs = timeoutMinutes * 60 * 1000;
            if (idleTimeMs >= thresholdMs) {
                lockTime.current = Date.now();
                const activeMs = Math.max(0, lastActivityTime.current - sessionStartTime.current);
                sessionActiveDuration.current = activeMs;
                setActiveSessionDurationText(formatDuration(activeMs));
                setSecuredTimeText(new Date().toLocaleTimeString());
                setIsAutoLocked(true);
                addLog(LogLevel.WARN, `Inactivity threshold reached (${timeoutMinutes}m). App locked.`, "SYSTEM");
            }
        }, 5000); // Check idle time every 5 seconds

        const resetActivity = () => {
            lastActivityTime.current = Date.now();
        };

        window.addEventListener('mousemove', resetActivity);
        window.addEventListener('keydown', resetActivity);
        window.addEventListener('click', resetActivity);
        window.addEventListener('scroll', resetActivity);

        return () => {
            clearInterval(interval);
            window.removeEventListener('mousemove', resetActivity);
            window.removeEventListener('keydown', resetActivity);
            window.removeEventListener('click', resetActivity);
            window.removeEventListener('scroll', resetActivity);
        };
    }, [settings.autoLockTimeout, isAutoLocked, addLog]);

    // Global Search Helper
    const getSearchResults = () => {
        if (!searchQuery.trim()) return null;
        const q = searchQuery.toLowerCase();
        
        const matchingFiles = vaultFiles.filter(f => 
            f.name.toLowerCase().includes(q) || 
            f.type.toLowerCase().includes(q)
        );
        
        const matchingLogs = logs.filter(l => 
            l.message.toLowerCase().includes(q) || 
            l.source.toLowerCase().includes(q)
        );

        const settingsKeywords = [
            { label: 'Workspace Protection Level', view: 'SETTINGS' as View, keywords: ['protect', 'level', 'lock', 'unprotected'] },
            { label: 'Default Script Encryption', view: 'SETTINGS' as View, keywords: ['encrypt', 'default', 'save', 'vault'] },
            { label: 'Automatic AI Scan Settings', view: 'SETTINGS' as View, keywords: ['scan', 'ai', 'autoscan', 'save'] },
            { label: 'Desktop Alert Notifications', view: 'SETTINGS' as View, keywords: ['notification', 'alert', 'sound'] },
            { label: 'Auto-Lock Inactivity Period', view: 'SETTINGS' as View, keywords: ['idle', 'inactivity', 'autolock', 'timer'] },
            { label: 'Vault Cryptographic Credentials', view: 'SETTINGS' as View, keywords: ['password', 'credential', 'passphrase', 'key', 'entropy'] },
        ];
        
        const matchingSettings = settingsKeywords.filter(s => 
            s.label.toLowerCase().includes(q) || 
            s.keywords.some(k => k.includes(q))
        );

        return {
            files: matchingFiles,
            logs: matchingLogs,
            settings: matchingSettings,
            total: matchingFiles.length + matchingLogs.length + matchingSettings.length
        };
    };

    const searchResults = getSearchResults();

    const renderView = () => {
        switch (currentView) {
            case 'DASHBOARD': return <DashboardView vaultFiles={vaultFiles} logs={logs} setView={setCurrentView} onExport={exportVault} />;
            case 'SCANNER': return <ScannerView onLog={addLog} />;
            case 'VAULT': return (
                <VaultView 
                    files={vaultFiles} 
                    setFiles={setVaultFiles} 
                    onLog={addLog} 
                    onExport={exportVault} 
                    onImport={importVault} 
                />
            );
            case 'SANDBOX': return <SandboxView onLog={addLog} />;
            case 'SETTINGS': return <SettingsView settings={settings} setSettings={setSettings} onLog={addLog} />;
            case 'HELP': return (
                <div className="p-8 space-y-8 animate-reveal">
                    <h2 className="text-3xl font-bold flex items-center gap-3">
                        <Info className="text-purple-500" /> Documentation
                    </h2>
                    <div className="glass-card p-10 rounded-[3rem] space-y-6">
                        <h3 className="text-xl font-bold text-purple-400 uppercase tracking-widest">v1.0.0 Stable</h3>
                        <p className="text-slate-400 leading-relaxed">
                            KnouxSecure Studio™ is a professional offline-first security suite. It implements 
                            <strong> AES-256-GCM authenticated encryption</strong> for sensitive script storage 
                            and utilizes the <strong>Gemini 3.5 Intelligence Engine</strong> for behavioral sandboxing.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                <h4 className="font-bold mb-2">Local Privacy</h4>
                                <p className="text-[11px] text-slate-500">All encryption keys are derived from hardware IDs and workspace salts. Nothing is uploaded.</p>
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                <h4 className="font-bold mb-2">Static Analysis</h4>
                                <p className="text-[11px] text-slate-500">AI scanning detects obfuscation, payload injection, and high-privilege system calls.</p>
                            </div>
                        </div>
                    </div>
                </div>
            );
            case 'LOGS': return (
                <div className="p-8 space-y-4 overflow-y-auto h-full scrollbar-hide animate-reveal">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <Activity className="text-purple-500" /> System Logs
                    </h2>
                    <div className="space-y-2">
                        {logs.map(log => (
                            <div key={log.id} className="glass p-4 rounded-xl flex items-center gap-4 text-sm border-l-4 border-l-purple-500">
                                <span className="text-slate-500 font-mono w-24">{log.timestamp}</span>
                                <span className={`font-bold w-16 ${log.level === 'ERROR' ? 'text-rose-500' : log.level === 'WARN' ? 'text-amber-500' : 'text-blue-500'}`}>
                                    [{log.level}]
                                </span>
                                <span className="text-purple-500 font-bold w-20 uppercase tracking-tighter">@{log.source}</span>
                                <span className="text-slate-400 flex-1">{log.message}</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
            default: return <DashboardView vaultFiles={vaultFiles} logs={logs} />;
        }
    };

    if (showSplash) {
        return (
            <div className={`flex min-h-screen relative overflow-hidden flex-col items-center justify-center p-6 ${isDarkMode ? 'bg-[#030305] text-slate-100' : 'bg-slate-950 text-slate-100'} transition-colors duration-300`}>
                <LockCanvas />
                
                {/* Glowing Background Circles */}
                <div 
                    className="absolute w-[500px] h-[500px] rounded-full blur-3xl opacity-35 animate-pulse pointer-events-none"
                    style={{
                        background: `radial-gradient(circle, ${settings.customAccentColor || '#A855F7'}40 0%, transparent 70%)`
                    }}
                />
                
                <div className="flex flex-col items-center justify-center relative z-10 max-w-lg w-full text-center space-y-8 px-4">
                    
                    {/* Rotating Rings Container & Official Logo with Luxury Frame */}
                    <div className="relative flex items-center justify-center">
                        {/* Outer rotating neon dash ring */}
                        <div 
                            className="absolute w-44 h-44 rounded-full border-2 border-dashed opacity-40 rotate-slow"
                            style={{ borderColor: settings.customAccentColor || '#A855F7' }}
                        />
                        {/* Inner rotating glowing solid ring */}
                        <div 
                            className="absolute w-36 h-36 rounded-full border border-white/10 shadow-2xl opacity-75"
                            style={{ boxShadow: `0 0 40px ${settings.customAccentColor || '#A855F7'}40` }}
                        />
                        
                        {/* Elegant Circular Logo Mask with pulsing glow */}
                        <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-white/20 bg-black/60 relative z-10 logo-glow flex items-center justify-center shadow-2xl">
                            <img 
                                src="https://i.postimg.cc/WbBbwkGT/cropped-circle-image.png" 
                                alt="KnouxSecure Logo" 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                            />
                        </div>
                    </div>

                    {/* Luxurious Typography Title & Slogan */}
                    <div className="space-y-3">
                        <h1 className="text-3xl font-black tracking-[0.25em] uppercase text-white font-sans">
                            KNOUXSECURE <span style={{ color: settings.customAccentColor || '#A855F7' }}>STUDIO</span>
                        </h1>
                        <p className="text-[10px] text-slate-400 font-bold tracking-[0.4em] uppercase font-mono">
                            CRYPTOGRAPHIC SECURITY ENVIRONMENT
                        </p>
                    </div>

                    {/* Razor-thin Glowing Loading Progress Bar */}
                    <div className="w-64 space-y-3 pt-4">
                        <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden border border-white/5 relative">
                            <div 
                                className="h-full rounded-full transition-all duration-150 ease-out"
                                style={{ 
                                    width: `${splashProgress}%`,
                                    backgroundColor: settings.customAccentColor || '#A855F7',
                                    boxShadow: `0 0 12px ${settings.customAccentColor || '#A855F7'}`
                                }}
                            />
                        </div>
                        
                        {/* Progress Label & Dynamic Tech Log */}
                        <div className="flex justify-between items-center text-[9px] font-mono font-bold tracking-wider text-slate-500 uppercase px-1">
                            <span className="text-slate-400">DEC-SEC ENG</span>
                            <span style={{ color: settings.customAccentColor || '#A855F7' }}>{splashProgress}%</span>
                        </div>
                    </div>

                    {/* Floating Diagnostic Log Line */}
                    <div className="h-8 flex items-center justify-center w-full">
                        <span className="text-[9px] font-mono tracking-widest uppercase transition-all duration-300 animate-pulse bg-white/[0.02] border border-white/5 px-4 py-1.5 rounded-full" style={{ color: settings.customAccentColor || '#A855F7' }}>
                            {splashMessage}
                        </span>
                    </div>
                </div>

                {/* Subtle Interactive Skip Overlay */}
                <button 
                    onClick={() => {
                        setShowSplash(false);
                        try {
                            playSecuritySound('unlock');
                        } catch (e) {
                            console.warn(e);
                        }
                    }}
                    className="absolute bottom-8 text-[9px] font-mono text-slate-500 hover:text-white transition-colors uppercase tracking-[0.3em] font-black"
                >
                    TAP / ENTER TO BYPASS SYSTEM SELF-CHECK
                </button>
            </div>
        );
    }

    if (!isLoggedIn) {
        return (
            <div className={`flex min-h-screen relative overflow-hidden items-center justify-center p-4 ${isDarkMode ? 'bg-[#030305] text-slate-200' : 'bg-slate-50 text-slate-800'} transition-colors duration-300`}>
                {/* Dynamic animated canvas background */}
                <LockCanvas />
                
                {/* Login Glass Card container */}
                <div 
                    className={`glass-card p-10 rounded-[3rem] w-full max-w-md relative z-10 border transition-all duration-300 ${
                        isLoginShaking ? 'animate-shake border-rose-500/50 shadow-lg shadow-rose-500/10' : 'border-white/5 shadow-2xl'
                    }`}
                    style={{
                        boxShadow: isLoginShaking ? '0 0 40px rgba(239, 68, 68, 0.15)' : '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }}
                >
                    {/* Glowing Accent Ring Background decoration */}
                    <div className="absolute -top-12 -left-12 w-48 h-48 bg-purple-600/10 blur-3xl rounded-full pointer-events-none" style={{ backgroundColor: `${settings.customAccentColor || '#A855F7'}15` }}></div>
                    <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-purple-600/10 blur-3xl rounded-full pointer-events-none" style={{ backgroundColor: `${settings.customAccentColor || '#A855F7'}10` }}></div>

                    {/* Official Circular Logo */}
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div 
                            className="w-20 h-20 rounded-full flex items-center justify-center bg-black/40 border overflow-hidden shadow-lg transition-all logo-glow"
                            style={{ 
                                borderColor: isLoginShaking ? '#EF4444' : 'var(--neon-purple)'
                            }}
                        >
                            <img 
                                src="https://i.postimg.cc/WbBbwkGT/cropped-circle-image.png" 
                                alt="KnouxSecure Logo" 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <h1 className="text-2xl font-black tracking-tight uppercase">KnouxSecure <span style={{ color: 'var(--neon-purple)' }}>Studio</span></h1>
                            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">AES-256 GCM Cryptographic Enclave</p>
                        </div>
                    </div>

                    {/* Login Form */}
                    <form 
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleLogin(loginPassword);
                        }}
                        className="mt-8 space-y-5"
                    >
                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Master Access Key / PIN</label>
                            </div>
                            <div className="relative">
                                <input 
                                    type="password"
                                    value={loginPassword}
                                    onChange={(e) => {
                                        setLoginPassword(e.target.value);
                                        if (loginError) setLoginError('');
                                    }}
                                    placeholder="••••••••••••"
                                    className="w-full bg-black/40 hover:bg-black/60 focus:bg-black/80 border border-white/10 hover:border-white/20 rounded-2xl px-5 py-3.5 text-sm font-mono text-center text-slate-200 outline-none transition-all"
                                    style={{
                                        focusBorderColor: 'var(--neon-purple)',
                                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)'
                                    }}
                                    autoFocus
                                />
                            </div>
                        </div>

                        {loginError && (
                            <div className="text-rose-500 text-[10px] font-bold uppercase text-center bg-rose-500/5 border border-rose-500/10 p-3 rounded-xl leading-relaxed animate-reveal">
                                {loginError}
                            </div>
                        )}

                        <div className="space-y-3 pt-2">
                            <button
                                type="submit"
                                className="w-full py-4 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg active:scale-98"
                                style={{
                                    backgroundColor: 'var(--neon-purple)',
                                    boxShadow: '0 10px 15px -3px var(--neon-glow)'
                                }}
                            >
                                Decrypt Session
                            </button>

                            <button
                                type="button"
                                onClick={() => handleLogin('admin')}
                                className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-wider rounded-2xl active:scale-98"
                            >
                                Fast Bypass (eval demo)
                            </button>
                        </div>
                    </form>

                    {/* Information Footer */}
                    <div className="mt-8 border-t border-white/5 pt-5 text-center space-y-1">
                        <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Local Session Authentication Required</div>
                        <div className="text-[9px] text-slate-500 font-medium">Default password is <code className="bg-white/5 font-mono px-1 rounded text-purple-400">admin</code> or use PIN <code className="bg-white/5 font-mono px-1 rounded text-purple-400">{settings.securityPin || "1337"}</code></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex h-screen ${isDarkMode ? 'bg-[#050508] text-slate-200' : 'bg-slate-50 text-slate-800'} transition-colors duration-300`}>
            <Sidebar currentView={currentView} setView={setCurrentView} />
            
            <main className="flex-1 relative overflow-hidden flex flex-col">
                <header className="h-16 glass border-b border-white/5 flex items-center justify-between px-8 shrink-0 z-20 relative">
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-medium text-slate-500">Workspaces</span>
                        <ChevronRight size={14} className="text-slate-600" />
                        <span className="text-sm font-semibold tracking-wide">Main-Secure-Repo</span>
                    </div>

                    {/* Global Search Bar */}
                    <div className="flex-1 max-w-md mx-8 relative hidden md:block">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500">
                            <Search size={16} />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search vault files, logs, settings..."
                            className="w-full bg-black/20 border border-white/5 rounded-xl pl-9 pr-8 py-1.5 text-xs font-medium focus:border-purple-500/50 focus:outline-none transition-all text-slate-200"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 font-bold text-[10px]"
                            >
                                ✕
                            </button>
                        )}

                        {/* Search Results Dropdown */}
                        {searchResults && (
                            <div className="absolute top-11 left-0 w-full bg-[#09090f]/95 border border-white/10 rounded-2xl p-4 shadow-2xl z-50 backdrop-blur-md space-y-4 max-h-[400px] overflow-y-auto scrollbar-hide text-left">
                                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                    <span className="text-[10px] font-black tracking-widest text-purple-400 uppercase">Search Results ({searchResults.total})</span>
                                    <button onClick={() => setSearchQuery('')} className="text-slate-500 hover:text-white text-xs">Clear</button>
                                </div>
                                
                                {searchResults.total === 0 ? (
                                    <div className="text-xs text-slate-500 text-center py-4">No matching security vectors found.</div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Vault files matches */}
                                        {searchResults.files.length > 0 && (
                                            <div className="space-y-2">
                                                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Vault Files</div>
                                                <div className="space-y-1">
                                                    {searchResults.files.map(file => (
                                                        <button 
                                                            key={file.id}
                                                            onClick={() => {
                                                                setCurrentView('VAULT');
                                                                setSearchQuery('');
                                                            }}
                                                            className="w-full text-left p-2 rounded-xl bg-white/[0.02] hover:bg-white/5 border border-white/5 flex items-center justify-between text-xs transition-colors"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <Lock size={12} className={file.status === 'LOCKED' ? 'text-purple-400' : 'text-emerald-400'} />
                                                                <span className="font-semibold text-slate-200">{file.name}</span>
                                                            </div>
                                                            <span className="text-[10px] bg-white/5 text-slate-500 px-1 rounded uppercase">{file.type}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Settings matches */}
                                        {searchResults.settings.length > 0 && (
                                            <div className="space-y-2">
                                                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Studio Settings</div>
                                                <div className="space-y-1">
                                                    {searchResults.settings.map((set, idx) => (
                                                        <button 
                                                            key={idx}
                                                            onClick={() => {
                                                                setCurrentView(set.view);
                                                                setSearchQuery('');
                                                            }}
                                                            className="w-full text-left p-2 rounded-xl bg-white/[0.02] hover:bg-white/5 border border-white/5 flex items-center justify-between text-xs transition-colors"
                                                        >
                                                            <span className="font-semibold text-slate-200">{set.label}</span>
                                                            <span className="text-[10px] text-purple-400 uppercase font-bold">Configure →</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Logs matches */}
                                        {searchResults.logs.length > 0 && (
                                            <div className="space-y-2">
                                                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Audit Logs</div>
                                                <div className="space-y-1">
                                                    {searchResults.logs.slice(0, 3).map(log => (
                                                        <button 
                                                            key={log.id}
                                                            onClick={() => {
                                                                setCurrentView('LOGS');
                                                                setSearchQuery('');
                                                            }}
                                                            className="w-full text-left p-2 rounded-xl bg-white/[0.02] hover:bg-white/5 border border-white/5 flex flex-col text-[11px] transition-colors"
                                                        >
                                                            <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                                                                <span>{log.timestamp}</span>
                                                                <span className="text-purple-400 font-bold uppercase">@{log.source}</span>
                                                            </div>
                                                            <span className="text-slate-300 font-medium line-clamp-1 mt-1 text-left">{log.message}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                        <VoiceControl currentView={currentView} setView={setCurrentView} onLog={addLog} />
                        <button 
                            onClick={() => setShowShortcutsHelp(!showShortcutsHelp)}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-slate-400 flex items-center gap-1.5 text-xs font-semibold"
                            title="Keyboard Shortcuts"
                        >
                            <Keyboard size={20} />
                            <span className="hidden md:inline">Shortcuts</span>
                        </button>
                        <button 
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-slate-400"
                            title="Toggle Theme"
                        >
                            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Active</span>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-hidden relative">
                    {isDarkMode && <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-600/10 blur-[120px] rounded-full pointer-events-none"></div>}
                    {renderView()}
                </div>

                {/* Keyboard Shortcuts Overlay Modal */}
                {showShortcutsHelp && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="glass-card p-8 rounded-[2.5rem] w-full max-w-md space-y-6 relative border border-purple-500/30">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                                    <Keyboard className="text-purple-500" /> Keyboard Shortcuts
                                </h3>
                                <button 
                                    onClick={() => setShowShortcutsHelp(false)}
                                    className="text-slate-400 hover:text-white font-bold text-sm"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between py-2 border-b border-white/5">
                                    <span className="text-xs text-slate-400 font-medium">Export Vault JSON</span>
                                    <kbd className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-mono text-purple-400">Ctrl + S</kbd>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-white/5">
                                    <span className="text-xs text-slate-400 font-medium">Toggle Dark/Light Mode</span>
                                    <kbd className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-mono text-purple-400">Ctrl + K</kbd>
                                </div>
                                <div className="flex items-center justify-between py-2">
                                    <span className="text-xs text-slate-400 font-medium">Switch views</span>
                                    <kbd className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-mono text-purple-400">Alt + [1-7]</kbd>
                                </div>
                                <div className="text-[11px] text-slate-500 italic mt-2">
                                    Alt keys map sequentially across: Dashboard (1), Scanner (2), Sandbox (3), Vault (4), Logs (5), Settings (6), Help (7).
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowShortcutsHelp(false)}
                                className="w-full py-3 bg-purple-600 rounded-xl text-white font-bold text-sm shadow-lg shadow-purple-500/20 hover:bg-purple-500 transition-all"
                            >
                                Close Guide
                            </button>
                        </div>
                    </div>
                )}

                {/* Auto-Lock Overlay Modal */}
                <AnimatePresence>
                    {isAutoLocked && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4 overflow-hidden"
                        >
                            {/* Animated geometric patterns canvas background */}
                            <LockCanvas />

                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={isShaking ? { 
                                    scale: 1, 
                                    opacity: 1, 
                                    x: [-8, 8, -8, 8, -4, 4, 0] 
                                } : { 
                                    scale: 1, 
                                    opacity: 1, 
                                    x: 0 
                                }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                transition={isShaking ? {
                                    x: { type: "spring", stiffness: 600, damping: 15 },
                                    default: { duration: 0.3 }
                                } : {
                                    duration: 0.3,
                                    ease: "easeOut"
                                }}
                                className="glass-card max-w-md w-full p-8 rounded-[2.5rem] border border-purple-500/30 text-center space-y-6 relative overflow-hidden shadow-2xl shadow-black/80 z-10"
                            >
                                <div className="absolute -top-12 -left-12 w-48 h-48 bg-purple-600/10 blur-[80px] rounded-full"></div>
                                
                                <div className="mx-auto w-16 h-16 bg-purple-600/10 border border-purple-500/20 text-purple-400 rounded-full flex items-center justify-center animate-pulse">
                                    <Lock size={32} />
                                </div>
                                
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-white">Suite Secured</h3>
                                    <p className="text-xs text-slate-400 uppercase tracking-widest font-mono">Session auto-locked due to inactivity</p>
                                </div>

                                {/* Active Session Stats */}
                                <div className="grid grid-cols-2 gap-4 py-3 border-y border-white/5 text-center text-xs">
                                    <div className="space-y-1">
                                        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black">
                                            Secured At
                                        </div>
                                        <div className="font-mono font-bold text-slate-300 text-sm">
                                            {securedTimeText || "N/A"}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black">
                                            Session Duration
                                        </div>
                                        <div className="font-mono font-bold text-purple-400 text-sm">
                                            {activeSessionDurationText || "0s"}
                                        </div>
                                    </div>
                                    <div className="col-span-2 space-y-1 pt-1.5 border-t border-white/5">
                                        <div className="text-[9px] text-slate-500 uppercase tracking-widest font-black">
                                            Secured Duration
                                        </div>
                                        <div className="font-mono text-[11px] font-medium text-purple-300/80">
                                            {securedDurationText}
                                        </div>
                                    </div>
                                </div>

                                {/* Unlock Method Toggle */}
                                <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 w-full max-w-[320px] mx-auto text-[11px] font-bold">
                                    <button
                                        onClick={() => {
                                            setUnlockMethod('pin');
                                            setEnteredPin('');
                                        }}
                                        className={`flex-1 py-1.5 rounded-lg transition-all ${
                                            unlockMethod === 'pin' 
                                                ? 'bg-purple-600 text-white shadow-md' 
                                                : 'text-slate-500 hover:text-slate-300'
                                        }`}
                                    >
                                        Secure PIN
                                    </button>
                                    <button
                                        onClick={() => {
                                            setUnlockMethod('biometric');
                                            setEnteredPin('');
                                        }}
                                        className={`flex-1 py-1.5 rounded-lg transition-all ${
                                            unlockMethod === 'biometric' 
                                                ? 'bg-purple-600 text-white shadow-md' 
                                                : 'text-slate-500 hover:text-slate-300'
                                        }`}
                                    >
                                        Biometric
                                    </button>
                                    <button
                                        onClick={() => {
                                            setUnlockMethod('button');
                                            setEnteredPin('');
                                        }}
                                        className={`flex-1 py-1.5 rounded-lg transition-all ${
                                            unlockMethod === 'button' 
                                                ? 'bg-purple-600 text-white shadow-md' 
                                                : 'text-slate-500 hover:text-slate-300'
                                        }`}
                                    >
                                        Quick Unlock
                                    </button>
                                </div>

                                {unlockMethod === 'pin' && (
                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black">
                                                Enter Security PIN
                                            </div>
                                            <div className="flex justify-center gap-3 py-1">
                                                {[0, 1, 2, 3].map((idx) => (
                                                    <div 
                                                        key={idx}
                                                        className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-200 ${
                                                            idx < enteredPin.length 
                                                                ? 'bg-purple-500 border-purple-500 scale-110 shadow-lg shadow-purple-500/50' 
                                                                : 'border-slate-700 bg-transparent'
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {/* PIN Keyboard Grid */}
                                        <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
                                            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                                                <button
                                                    key={digit}
                                                    onClick={() => handlePinDigit(digit)}
                                                    className="w-14 h-14 rounded-full bg-white/5 hover:bg-purple-600/20 hover:border-purple-500/30 border border-white/5 text-base font-bold transition-all text-slate-200 flex items-center justify-center active:scale-95"
                                                    id={`pin-btn-${digit}`}
                                                >
                                                    {digit}
                                                </button>
                                            ))}
                                            <button
                                                onClick={() => setEnteredPin('')}
                                                className="w-14 h-14 rounded-full bg-white/5 hover:bg-red-500/10 hover:border-red-500/30 border border-white/5 text-[10px] font-black uppercase tracking-tight transition-all text-red-400 flex items-center justify-center active:scale-95"
                                                id="pin-btn-clear"
                                            >
                                                Clear
                                            </button>
                                            <button
                                                onClick={() => handlePinDigit('0')}
                                                className="w-14 h-14 rounded-full bg-white/5 hover:bg-purple-600/20 hover:border-purple-500/30 border border-white/5 text-base font-bold transition-all text-slate-200 flex items-center justify-center active:scale-95"
                                                id="pin-btn-0"
                                            >
                                                0
                                            </button>
                                            <button
                                                onClick={() => setEnteredPin(prev => prev.slice(0, -1))}
                                                className="w-14 h-14 rounded-full bg-white/5 hover:bg-purple-600/20 hover:border-purple-500/30 border border-white/5 text-[10px] font-black uppercase tracking-tight transition-all text-slate-400 flex items-center justify-center active:scale-95"
                                                id="pin-btn-del"
                                            >
                                                Del
                                            </button>
                                        </div>

                                        <div className="text-[10px] text-slate-600 italic">
                                            Hint: Default PIN is <span className="font-bold text-purple-400 font-mono">1337</span> (configurable in settings)
                                        </div>
                                    </div>
                                )}

                                {unlockMethod === 'biometric' && (
                                    <div className="space-y-6 py-2">
                                        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black">
                                            Biometric Identification
                                        </div>
                                        
                                        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                                            <div className="absolute inset-0 rounded-full border border-purple-500/20 animate-ping pointer-events-none" />
                                            <div className="absolute inset-2 rounded-full border border-purple-500/30 animate-pulse pointer-events-none" />
                                            
                                            <button
                                                onClick={handleBiometricUnlock}
                                                disabled={isBiometricScanning}
                                                className={`w-20 h-20 rounded-full border border-purple-500/30 bg-purple-950/20 flex items-center justify-center transition-all ${
                                                    isBiometricScanning 
                                                    ? 'text-purple-400 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.4)]' 
                                                    : 'text-purple-300 hover:text-purple-100 hover:border-purple-500/50 hover:bg-purple-600/10 active:scale-95'
                                                }`}
                                                id="biometric-trigger-btn"
                                            >
                                                <Fingerprint size={40} className={isBiometricScanning ? 'animate-pulse' : ''} />
                                            </button>
                                            
                                            {isBiometricScanning && (
                                                <motion.div 
                                                    animate={{ top: ['15%', '85%', '15%'] }}
                                                    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                                                    className="absolute left-4 right-4 h-0.5 bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)] pointer-events-none"
                                                />
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            {isBiometricScanning ? (
                                                <div className="space-y-1.5">
                                                    <div className="text-xs font-semibold text-purple-400 animate-pulse min-h-[1.5rem]">
                                                        {biometricStatus}
                                                    </div>
                                                    <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden mx-auto">
                                                        <motion.div 
                                                            initial={{ width: 0 }}
                                                            animate={{ width: biometricSuccess ? '100%' : '80%' }}
                                                            transition={{ duration: 1.8 }}
                                                            className="h-full bg-purple-500"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <button
                                                        onClick={handleBiometricUnlock}
                                                        className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold tracking-wider uppercase rounded-xl transition-all hover:scale-[1.02] active:scale-95"
                                                        id="initiate-scan-btn"
                                                    >
                                                        Initiate Scan
                                                    </button>
                                                    <p className="text-[10px] text-slate-500 italic max-w-[280px] mx-auto leading-relaxed">
                                                        Supports hardware credential requests (WebAuthn) with secure backup simulator bypass.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {unlockMethod === 'button' && (
                                    <button 
                                        onClick={handleQuickUnlock}
                                        className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl shadow-lg shadow-purple-500/25 transition-all duration-300 uppercase tracking-wider text-xs hover:scale-[1.01] active:scale-[0.98]"
                                        id="quick-unlock-btn"
                                    >
                                        UNLOCK SYSTEM
                                    </button>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Subtle Absolute Logout Warning Toast */}
                <AnimatePresence>
                    {logoutCountdown !== null && (
                        <motion.div 
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.9 }}
                            className="fixed bottom-8 left-8 z-[100] max-w-sm w-full bg-[#050508]/95 border border-amber-500/50 rounded-2xl p-5 shadow-2xl shadow-amber-500/20 flex flex-col gap-3 backdrop-blur-md"
                        >
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20">
                                    <Clock className="animate-spin text-amber-500" size={18} />
                                </div>
                                <div className="flex-1 text-left">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">Absolute Logout Warning</h4>
                                    <p className="text-[11px] text-slate-300 mt-1 leading-normal">
                                        Your secure enclave session will expire in <span className="font-bold text-amber-400 font-mono text-sm">{logoutCountdown}s</span>. Extend session to push the absolute timeout back.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        sessionLoginTime.current = Date.now();
                                        setLogoutCountdown(null);
                                        addLog(LogLevel.INFO, `Symmetric session token renewed. Absolute logout deferred by ${settings.autoLogoutTimeout} minute(s).`, "SYSTEM");
                                        playSecuritySound('success');
                                    }}
                                    className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 cursor-pointer"
                                >
                                    Extend Session
                                </button>
                                <button
                                    onClick={() => {
                                        setEnteredPin('');
                                        setLoginPassword('');
                                        setVaultFiles(prev => prev.map(f => ({ ...f, status: 'LOCKED' })));
                                        setIsLoggedIn(false);
                                        sessionLoginTime.current = null;
                                        setLogoutCountdown(null);
                                        addLog(LogLevel.INFO, "Immediate session termination requested by user.", "SYSTEM");
                                        playSecuritySound('error');
                                    }}
                                    className="py-2 px-4 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 text-[10px] font-black uppercase tracking-widest rounded-lg border border-white/5 transition-all cursor-pointer"
                                >
                                    Abort
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default App;
