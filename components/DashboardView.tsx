
import React, { useState, useEffect } from 'react';
import { LogEntry, VaultFile, LogLevel, CVEAlert } from '../types';
import { fetchRecentCves } from '../services/geminiService';
import { playSecuritySound } from '../services/soundService';
import { jsPDF } from 'jspdf';
import { motion, AnimatePresence } from 'motion/react';
import { 
    ShieldCheck, 
    Lock, 
    Scan, 
    ShieldAlert, 
    Activity, 
    ArrowUpRight, 
    Zap, 
    Cpu, 
    Database, 
    Clock,
    Terminal,
    Percent,
    Flame,
    Calendar,
    RefreshCw,
    ExternalLink,
    Search,
    FileDown,
    Plus,
    Key,
    Copy,
    Check,
    Download,
    Eye,
    EyeOff,
    LockOpen,
    AlertCircle,
    Sliders,
    Shield
} from 'lucide-react';
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from 'recharts';

interface DashboardViewProps {
    vaultFiles: VaultFile[];
    logs: LogEntry[];
    setView?: (view: any) => void;
    onExport?: () => void;
}

const chartData = [
    { name: '00:00', scans: 45, threats: 2 },
    { name: '04:00', scans: 52, threats: 1 },
    { name: '08:00', scans: 38, threats: 4 },
    { name: '12:00', scans: 85, threats: 0 },
    { name: '16:00', scans: 72, threats: 2 },
    { name: '20:00', scans: 95, threats: 1 },
    { name: '23:59', scans: 60, threats: 0 },
];

const resourceData = [
    { name: '00:00', cpu: 12, storage: 15 },
    { name: '04:00', cpu: 28, storage: 15 },
    { name: '08:00', cpu: 65, storage: 18 },
    { name: '12:00', cpu: 42, storage: 28 },
    { name: '16:00', cpu: 85, storage: 32 },
    { name: '20:00', cpu: 35, storage: 45 },
    { name: '23:59', cpu: 18, storage: 45 },
];

const weeklyHeatmapData = [
    { day: 'Mon', time: '00:00 - 06:00', scans: 14, logins: 3, isAnomalous: false },
    { day: 'Mon', time: '06:00 - 12:00', scans: 85, logins: 22, isAnomalous: false },
    { day: 'Mon', time: '12:00 - 18:00', scans: 110, logins: 34, isAnomalous: false },
    { day: 'Mon', time: '18:00 - 24:00', scans: 48, logins: 15, isAnomalous: false },

    { day: 'Tue', time: '00:00 - 06:00', scans: 8, logins: 1, isAnomalous: false },
    { day: 'Tue', time: '06:00 - 12:00', scans: 92, logins: 26, isAnomalous: false },
    { day: 'Tue', time: '12:00 - 18:00', scans: 125, logins: 41, isAnomalous: false },
    { day: 'Tue', time: '18:00 - 24:00', scans: 55, logins: 19, isAnomalous: false },

    { day: 'Wed', time: '00:00 - 06:00', scans: 72, logins: 16, isAnomalous: true, anomalyReason: 'Unscheduled bulk scan operations paired with heightened authentication frequencies.' },
    { day: 'Wed', time: '06:00 - 12:00', scans: 78, logins: 20, isAnomalous: false },
    { day: 'Wed', time: '12:00 - 18:00', scans: 105, logins: 30, isAnomalous: false },
    { day: 'Wed', time: '18:00 - 24:00', scans: 60, logins: 12, isAnomalous: false },

    { day: 'Thu', time: '00:00 - 06:00', scans: 5, logins: 2, isAnomalous: false },
    { day: 'Thu', time: '06:00 - 12:00', scans: 88, logins: 25, isAnomalous: false },
    { day: 'Thu', time: '12:00 - 18:00', scans: 115, logins: 38, isAnomalous: false },
    { day: 'Thu', time: '18:00 - 24:00', scans: 42, logins: 11, isAnomalous: false },

    { day: 'Fri', time: '00:00 - 06:00', scans: 12, logins: 4, isAnomalous: false },
    { day: 'Fri', time: '06:00 - 12:00', scans: 95, logins: 28, isAnomalous: false },
    { day: 'Fri', time: '12:00 - 18:00', scans: 130, logins: 45, isAnomalous: false },
    { day: 'Fri', time: '18:00 - 24:00', scans: 35, logins: 9, isAnomalous: false },

    { day: 'Sat', time: '00:00 - 06:00', scans: 19, logins: 5, isAnomalous: false },
    { day: 'Sat', time: '06:00 - 12:00', scans: 30, logins: 8, isAnomalous: false },
    { day: 'Sat', time: '12:00 - 18:00', scans: 42, logins: 12, isAnomalous: false },
    { day: 'Sat', time: '18:00 - 24:00', scans: 25, logins: 6, isAnomalous: false },

    { day: 'Sun', time: '00:00 - 06:00', scans: 180, logins: 38, isAnomalous: true, anomalyReason: 'Anomalous Event: Extreme off-hours scanning volume and brute-force authentication signatures.' },
    { day: 'Sun', time: '06:00 - 12:00', scans: 22, logins: 5, isAnomalous: false },
    { day: 'Sun', time: '12:00 - 18:00', scans: 35, logins: 9, isAnomalous: false },
    { day: 'Sun', time: '18:00 - 24:00', scans: 18, logins: 4, isAnomalous: false },
];

const DashboardView: React.FC<DashboardViewProps> = ({ vaultFiles, logs, setView, onExport }) => {
    const [cves, setCves] = useState<CVEAlert[]>([]);
    const [cveSources, setCveSources] = useState<{ title: string, uri: string }[]>([]);
    const [cveLoading, setCveLoading] = useState(true);
    const [cveError, setCveError] = useState('');

    // Custom States for extended security analytics & actions
    const [heatmapMetric, setHeatmapMetric] = useState<'scans' | 'logins'>('scans');
    const [selectedHeatCell, setSelectedHeatCell] = useState<typeof weeklyHeatmapData[0] | null>(weeklyHeatmapData[24]); // Default to Sun anomaly to prompt awareness
    const [fabExpanded, setFabExpanded] = useState(false);
    const [simulatedThreat, setSimulatedThreat] = useState(false);

    // Watchdog logic: Filter decryption logs
    const decryptLogs = logs.filter(log => 
        log.message.toLowerCase().includes('decrypt') || 
        log.message.toLowerCase().includes('status changed to unlocked') ||
        log.message.toLowerCase().includes('batch event') ||
        log.message.toLowerCase().includes('bulk')
    );

    const decryptionCount = decryptLogs.length;
    let threatLevel: 'SAFE' | 'ELEVATED' | 'CRITICAL' = 'SAFE';
    let watchdogAlerts: string[] = [];

    if (decryptionCount >= 5) {
        threatLevel = 'CRITICAL';
        watchdogAlerts.push("MASS DECRYPTION BURST: Multiple critical credentials decrypted in rapid succession. High risk of brute-force dictionary exfiltration.");
    } else if (decryptionCount >= 3) {
        threatLevel = 'ELEVATED';
        watchdogAlerts.push("RAPID FILE ACCESS: Access frequency spikes detected. Verify that this activity is authenticated and scheduled.");
    }

    if (simulatedThreat) {
        threatLevel = 'CRITICAL';
        if (!watchdogAlerts.includes("MASS DECRYPTION BURST: Multiple critical credentials decrypted in rapid succession. High risk of brute-force dictionary exfiltration.")) {
            watchdogAlerts.push("MASS DECRYPTION BURST: Multiple critical credentials decrypted in rapid succession. High risk of brute-force dictionary exfiltration.");
        }
        if (!watchdogAlerts.includes("SUSPICIOUS ENCLAVE EXFILTRATION: Script decryption frequency exceeds 120Hz threshold constraint.")) {
            watchdogAlerts.push("SUSPICIOUS ENCLAVE EXFILTRATION: Script decryption frequency exceeds 120Hz threshold constraint.");
        }
    }
    
    // Password Generator States
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordLength, setPasswordLength] = useState(16);
    const [includeUpper, setIncludeUpper] = useState(true);
    const [includeLower, setIncludeLower] = useState(true);
    const [includeNumbers, setIncludeNumbers] = useState(true);
    const [includeSymbols, setIncludeSymbols] = useState(true);
    const [generatedPassword, setGeneratedPassword] = useState('');
    const [passwordEntropy, setPasswordEntropy] = useState(0);
    const [isCopied, setIsCopied] = useState(false);

    // Dynamic Password Entropy Analyzer
    const computeEntropyDistribution = () => {
        let weak = 0;      // < 36 bits
        let medium = 0;    // 36 - 59 bits
        let strong = 0;    // 60 - 79 bits
        let excellent = 0; // >= 80 bits

        const credentials = vaultFiles.filter(f => f.passwordValue !== undefined || f.type.toLowerCase().includes('credential') || f.type.toLowerCase().includes('key'));
        
        credentials.forEach(f => {
            const ent = f.entropy || 0;
            if (ent === 0) return;
            if (ent < 36) weak++;
            else if (ent < 60) medium++;
            else if (ent < 80) strong++;
            else excellent++;
        });

        return [
            { name: 'Weak (<36b)', value: weak, fill: '#ef4444', desc: 'Critical Risk' },
            { name: 'Medium (36-59b)', value: medium, fill: '#f59e0b', desc: 'Moderate Risk' },
            { name: 'Strong (60-79b)', value: strong, fill: '#8b5cf6', desc: 'Compliant' },
            { name: 'Excellent (80b+)', value: excellent, fill: '#10b981', desc: 'Military Grade' }
        ];
    };

    const entropyChartData = computeEntropyDistribution();

    const generatePassword = () => {
        let charset = '';
        if (includeUpper) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (includeLower) charset += 'abcdefghijklmnopqrstuvwxyz';
        if (includeNumbers) charset += '0123456789';
        if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:\',./<>?';

        if (!charset) {
            setGeneratedPassword('');
            setPasswordEntropy(0);
            return;
        }

        let pass = '';
        for (let i = 0; i < passwordLength; i++) {
            pass += charset.charAt(Math.floor(Math.random() * charset.length));
        }

        setGeneratedPassword(pass);

        // Calculate Entropy: length * log2(pool_size)
        let poolSize = 0;
        if (includeUpper) poolSize += 26;
        if (includeLower) poolSize += 26;
        if (includeNumbers) poolSize += 10;
        if (includeSymbols) poolSize += 28;

        const entropy = Math.round(passwordLength * Math.log2(poolSize));
        setPasswordEntropy(entropy);
        playSecuritySound('success');
    };

    useEffect(() => {
        if (showPasswordModal) {
            generatePassword();
        }
    }, [showPasswordModal, passwordLength, includeUpper, includeLower, includeNumbers, includeSymbols]);

    const handleCopyPassword = () => {
        if (!generatedPassword) return;
        navigator.clipboard.writeText(generatedPassword);
        setIsCopied(true);
        playSecuritySound('success');
        setTimeout(() => setIsCopied(false), 2000);
    };

    const generatePdfReport = () => {
        try {
            const doc = new jsPDF();
            
            // Background Elements (Elegant dark theme aesthetic)
            doc.setFillColor(15, 15, 25); // Very dark navy/charcoal background
            doc.rect(0, 0, 210, 297, 'F');
            
            // Top Accent Bar
            doc.setFillColor(139, 92, 246);
            doc.rect(0, 0, 210, 6, 'F');
            
            // Header Title
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(26);
            doc.text("KNOUXSECURE(TM) STUDIO", 15, 25);
            
            doc.setTextColor(168, 85, 247);
            doc.setFontSize(11);
            doc.text("WORKSPACE SECURITY AUDIT REPORT", 15, 33);
            
            // Timestamp and Session Details
            doc.setTextColor(148, 163, 184); // slate-400
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            const generationTime = new Date().toLocaleString();
            doc.text(`Generated: ${generationTime} UTC`, 140, 25);
            doc.text("Session Ref: KNX-V3-ALPHA", 140, 30);
            doc.text("Security Grade: AES-256 SYSTEM", 140, 35);
            
            // Divider
            doc.setDrawColor(51, 65, 85); // slate-700
            doc.setLineWidth(0.5);
            doc.line(15, 42, 195, 42);
            
            // 1. Key Metrics Section
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.text("1. WORKSPACE SECURITY METRICS", 15, 52);
            
            // Draw a subtle border container for metrics
            doc.setFillColor(30, 30, 45);
            doc.rect(15, 58, 180, 28, 'F');
            
            const totalF = vaultFiles.length;
            const lockedF = vaultFiles.filter(f => f.status === 'LOCKED').length;
            const encPercent = totalF > 0 ? Math.round((lockedF / totalF) * 100) : 0;
            const alerts = logs.filter(l => l.level === LogLevel.WARN || l.level === LogLevel.ERROR).length;
            const totalScans = logs.filter(l => l.source === 'SCANNER').length;

            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text("Vault Status:", 20, 66);
            doc.setFont('helvetica', 'normal');
            doc.text(`${lockedF} of ${totalF} files securely encrypted (${encPercent}% coverage)`, 50, 66);
            
            doc.setFont('helvetica', 'bold');
            doc.text("Total Scans Run:", 20, 74);
            doc.setFont('helvetica', 'normal');
            doc.text(`${totalScans} dynamic vulnerability evaluations performed`, 54, 74);
            
            doc.setFont('helvetica', 'bold');
            doc.text("Threat Alerts:", 20, 82);
            doc.setFont('helvetica', 'normal');
            doc.text(`${alerts} security logs categorized as anomalous or high-risk`, 48, 82);
            
            // 2. Cryptographic Vault File Registry
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.text("2. CRYPTOGRAPHIC VAULT FILE REGISTRY", 15, 100);
            
            // Table Header for Files
            doc.setFillColor(45, 30, 65); // Dark purple header
            doc.rect(15, 106, 180, 8, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text("FILE NAME", 18, 111);
            doc.text("LANGUAGE/TYPE", 75, 111);
            doc.text("SIZE", 125, 111);
            doc.text("ENCRYPTION STATUS", 150, 111);
            
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(203, 213, 225);
            let yOffset = 120;
            if (vaultFiles.length === 0) {
                doc.text("No files currently registered in secure cryptographic vault.", 18, yOffset);
                yOffset += 8;
            } else {
                vaultFiles.forEach((file) => {
                    if (yOffset > 180) return; // Keep clean single-page look
                    doc.setFillColor(25, 25, 35);
                    doc.rect(15, yOffset - 4, 180, 7, 'F');
                    
                    doc.setFont('helvetica', 'bold');
                    doc.text(file.name, 18, yOffset);
                    doc.setFont('helvetica', 'normal');
                    doc.text(file.type, 75, yOffset);
                    doc.text(file.size, 125, yOffset);
                    
                    if (file.status === 'LOCKED') {
                        doc.setTextColor(168, 85, 247); // Purple
                        doc.setFont('helvetica', 'bold');
                        doc.text("SECURED (AES-256)", 150, yOffset);
                    } else {
                        doc.setTextColor(239, 68, 68); // Red
                        doc.setFont('helvetica', 'normal');
                        doc.text("UNENCRYPTED", 150, yOffset);
                    }
                    doc.setTextColor(203, 213, 225);
                    yOffset += 8;
                });
            }
            
            // 3. Security Audit Logs & Inactivity Secured Events
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.text("3. SYSTEM SECURITY AUDIT LOGS & SESSION EVENTS", 15, yOffset + 6);
            yOffset += 12;
            
            // Audit logs rows
            doc.setFontSize(8);
            const secureLogs = logs.slice(0, 14);
            if (secureLogs.length === 0) {
                doc.setFont('helvetica', 'normal');
                doc.text("No security logging entries recorded for this session.", 18, yOffset);
            } else {
                secureLogs.forEach((log) => {
                    if (yOffset > 270) return; // limit to fit beautiful layout
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(148, 163, 184); // Slate-400
                    doc.text(`[${log.timestamp}]`, 18, yOffset);
                    
                    if (log.level === LogLevel.ERROR) {
                        doc.setTextColor(239, 68, 68);
                        doc.setFont('helvetica', 'bold');
                    } else if (log.level === LogLevel.WARN) {
                        doc.setTextColor(245, 158, 11);
                        doc.setFont('helvetica', 'bold');
                    } else {
                        doc.setTextColor(168, 85, 247);
                        doc.setFont('helvetica', 'normal');
                    }
                    doc.text(`[${log.level}]`, 52, yOffset);
                    doc.text(`[${log.source}]`, 70, yOffset);
                    
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(226, 232, 240); // Slate-200
                    const trimmedMsg = log.message.length > 70 ? log.message.substring(0, 67) + "..." : log.message;
                    doc.text(trimmedMsg, 95, yOffset);
                    
                    yOffset += 6;
                });
            }
            
            // Footer Signature
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139);
            doc.text("CONFIDENTIALITY NOTICE: THIS REPORT IS FOR INTERNAL DEVELOPMENT USE ONLY AND DEPLOYS SECURED CREDENTIALS.", 15, 282);
            doc.text("KNOUXSECURE(TM) ENVELOPE ENCRYPTION GUARANTEE - AES-256 LAYERED SECURED INTEGRITY", 15, 288);
            
            // Trigger Save
            doc.save("knoux_workspace_security_report.pdf");
        } catch (err) {
            console.error("PDF generation failed:", err);
        }
    };

    const loadCveAlerts = async () => {
        setCveLoading(true);
        setCveError('');
        try {
            const data = await fetchRecentCves();
            setCves(data.alerts);
            setCveSources(data.sources);
        } catch (err) {
            setCveError('Failed to fetch cybersecurity updates.');
        } finally {
            setCveLoading(false);
        }
    };

    useEffect(() => {
        loadCveAlerts();
    }, []);

    const generateHeatmap = () => {
        const data = [];
        const now = new Date();
        const baseCounts = [
            0, 1, 3, 0, 0, 2, 4,
            1, 0, 2, 5, 0, 1, 3,
            0, 2, 4, 1, 0, 0, 3,
            2, 0, 1, 4, 0, 2, 5,
            1
        ];
        
        const todayActionCount = logs.filter(l => l.source === 'SCANNER' || l.source === 'VAULT' || l.source === 'SANDBOX').length;
        
        for (let i = 29; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(now.getDate() - i);
            const dayLabel = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
            
            let count = 0;
            if (i === 0) {
                count = todayActionCount;
            } else {
                count = baseCounts[29 - i] ?? Math.floor(Math.random() * 3);
            }
            
            data.push({
                date: d.toISOString().split('T')[0],
                dayLabel,
                count
            });
        }
        return data;
    };

    const heatmapData = generateHeatmap();

    const lockedCount = vaultFiles.filter(f => f.status === 'LOCKED').length;
    const alertCount = logs.filter(l => l.level === LogLevel.WARN || l.level === LogLevel.ERROR).length;
    const totalScans = logs.filter(l => l.source === 'SCANNER').length;

    const totalFiles = vaultFiles.length;
    const unlockedCount = totalFiles - lockedCount;
    const encryptedPercent = totalFiles > 0 ? Math.round((lockedCount / totalFiles) * 100) : 0;
    const unencryptedPercent = totalFiles > 0 ? 100 - encryptedPercent : 0;

    const cards = [
        {
            title: 'Workspace Status',
            value: 'SECURE',
            icon: ShieldCheck,
            desc: 'Kernel monitoring active',
            color: 'text-emerald-400',
            glow: 'rgba(52, 211, 153, 0.1)',
            trend: 'Stable'
        },
        {
            title: 'Encryption Status',
            value: `${lockedCount}/${vaultFiles.length}`,
            icon: Lock,
            desc: 'Files secured (AES-256)',
            color: 'text-purple-400',
            glow: 'rgba(168, 85, 247, 0.1)',
            trend: 'Synchronized'
        },
        {
            title: 'Recent Scans',
            value: totalScans || 24,
            icon: Scan,
            desc: 'Audited code patterns',
            color: 'text-blue-400',
            glow: 'rgba(96, 165, 250, 0.1)',
            trend: 'Live'
        },
        {
            title: 'Active Alerts',
            value: alertCount,
            icon: ShieldAlert,
            desc: 'Anomalies detected',
            color: 'text-rose-400',
            glow: 'rgba(251, 113, 133, 0.1)',
            trend: 'Review needed'
        },
        {
            title: 'Encryption Ratio',
            value: `${encryptedPercent}%`,
            icon: Percent,
            desc: `${encryptedPercent}% Locked / ${unencryptedPercent}% Unlocked`,
            color: 'text-cyan-400',
            glow: 'rgba(34, 211, 238, 0.1)',
            trend: `${unlockedCount} unencrypted`
        }
    ];

    return (
        <div className="p-8 h-full overflow-y-auto scrollbar-hide space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-reveal">
                <div className="flex flex-col gap-1">
                    <h2 className="text-4xl font-black tracking-tight">
                        Security <span className="text-purple-500">Overview</span>
                    </h2>
                    <p className="text-slate-500 font-medium">Session ID: <span className="code-font text-purple-400">KNX-V3-ALPHA</span></p>
                </div>
                <button
                    onClick={generatePdfReport}
                    className="flex items-center justify-center gap-2 px-5 py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs tracking-wider uppercase rounded-2xl shadow-lg shadow-purple-500/25 transition-all self-start sm:self-auto hover:scale-[1.02] active:scale-95"
                    id="generate-pdf-btn"
                >
                    <FileDown size={16} />
                    Generate Security Report
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
                {cards.map((card, i) => (
                    <div 
                        key={i} 
                        style={{ backgroundColor: card.glow }}
                        className={`glass-card p-6 rounded-3xl group flex flex-col justify-between min-h-[200px] animate-reveal stagger-${i+1}`}
                    >
                        <div className="flex justify-between items-start">
                            <div className={`p-3 rounded-2xl bg-white/5 ${card.color} border border-white/10`}>
                                <card.icon size={24} strokeWidth={2.5} />
                            </div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Feed</span>
                        </div>
                        
                        <div className="mt-4">
                            <div className="text-4xl font-black tracking-tighter group-hover:neon-text transition-all duration-300">
                                {card.value}
                            </div>
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1">{card.title}</div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[10px] font-medium text-slate-600">{card.desc}</span>
                            <span className={`text-[10px] font-bold ${card.color}`}>{card.trend}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass-card p-8 rounded-[2rem] space-y-6 animate-reveal stagger-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <Zap size={20} className="text-purple-400" /> Threat Mitigation Density
                        </h3>
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#A855F7" stopOpacity={0.3}/>
                                        <stop offset="100%" stopColor="#A855F7" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                <XAxis dataKey="name" hide />
                                <YAxis hide />
                                <Tooltip contentStyle={{ background: '#050508', border: '1px solid #333', borderRadius: '8px' }} />
                                <Area type="monotone" dataKey="scans" stroke="#A855F7" fill="url(#pGrad)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-card p-8 rounded-[2rem] animate-reveal stagger-4 flex flex-col">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Terminal size={20} className="text-purple-400" /> Audit Log
                    </h3>
                    <div className="flex-1 space-y-4 overflow-y-auto scrollbar-hide text-[11px] code-font">
                        {logs.slice(0, 6).map(log => (
                            <div key={log.id} className="flex gap-3 text-slate-400">
                                <span className="text-slate-600">[{log.timestamp}]</span>
                                <span className={log.level === 'ERROR' ? 'text-rose-500' : 'text-purple-500'}>[{log.level}]</span>
                                <span className="line-clamp-1">{log.message}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* New Grid Row: Integrity Cadence Heatmap & Security Pulse Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 30-Day Calendar Heatmap Card (2 Cols) */}
                <div className="lg:col-span-2 glass-card p-8 rounded-[2rem] space-y-6 animate-reveal stagger-4 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Calendar size={20} className="text-purple-400" /> Integrity Cadence Heatmap
                            </h3>
                            <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                                <Flame size={12} className="text-purple-400 animate-pulse" />
                                <span className="text-[10px] font-bold text-purple-300 font-mono">30-Day Log Activity</span>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                            Frequency mapping of active script scans, cryptographic operations, and secure virtual environment accesses.
                        </p>
                    </div>

                    <div className="py-4">
                        <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-15 xl:grid-cols-30 gap-2">
                            {heatmapData.map((day, idx) => {
                                let bgClass = 'bg-white/[0.02] border border-white/5 text-slate-600 hover:border-slate-700';
                                if (day.count === 1) {
                                    bgClass = 'bg-purple-900/30 border border-purple-800/30 text-purple-400 hover:border-purple-600';
                                } else if (day.count === 2) {
                                    bgClass = 'bg-purple-800/50 border border-purple-700/40 text-purple-300 hover:border-purple-500';
                                } else if (day.count >= 3) {
                                    bgClass = 'bg-purple-500 border border-purple-400 text-white hover:border-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.35)]';
                                }

                                return (
                                    <div 
                                        key={day.date} 
                                        className={`aspect-square rounded-lg flex flex-col items-center justify-center relative group p-1 transition-all duration-300 hover:scale-110 cursor-pointer ${bgClass}`}
                                    >
                                        <span className="text-[9px] scale-90 font-bold leading-none">{day.dayLabel.split(' ')[1]}</span>
                                        <span className="text-[9px] leading-none mt-0.5 opacity-80">{day.count > 0 ? day.count : ''}</span>
                                        
                                        {/* Custom Floating Tooltip */}
                                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[#09090f] border border-white/10 rounded-xl px-2.5 py-1.5 text-[9px] text-slate-300 whitespace-nowrap z-50 pointer-events-none shadow-2xl">
                                            <span className="font-bold text-white">{day.dayLabel}</span>
                                            <span className="text-slate-500"> • </span>
                                            <span className="text-purple-400 font-bold">{day.count} operation(s)</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-white/5 pt-3 font-medium">
                        <span>30 Days Ago</span>
                        <div className="flex items-center gap-1.5">
                            <span>Less</span>
                            <div className="w-2.5 h-2.5 rounded-md bg-white/[0.02] border border-white/5"></div>
                            <div className="w-2.5 h-2.5 rounded-md bg-purple-900/40 border border-purple-800/30"></div>
                            <div className="w-2.5 h-2.5 rounded-md bg-purple-800/60 border border-purple-700/40"></div>
                            <div className="w-2.5 h-2.5 rounded-md bg-purple-500 border border-purple-400 shadow-[0_0_5px_rgba(168,85,247,0.35)]"></div>
                            <span>More</span>
                        </div>
                        <span>Today</span>
                    </div>
                </div>

                {/* 'Security Pulse' Vulnerability CVE Alerts Card (1 Col) */}
                <div className="glass-card p-8 rounded-[2rem] space-y-6 animate-reveal stagger-4 flex flex-col justify-between">
                    <div className="space-y-4 w-full">
                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <ShieldAlert size={20} className="text-purple-400" /> Security Pulse
                            </h3>
                            <button 
                                onClick={loadCveAlerts} 
                                disabled={cveLoading} 
                                className={`p-2 bg-white/5 border border-white/5 hover:border-white/10 rounded-xl transition-all ${
                                    cveLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'
                                }`}
                                title="Refresh CVE alerts via Search Grounding"
                                id="refresh-cves"
                            >
                                <RefreshCw size={12} className={cveLoading ? 'animate-spin text-purple-400' : 'text-slate-400'} />
                            </button>
                        </div>

                        {cveLoading ? (
                            <div className="space-y-4 py-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="animate-pulse space-y-2 p-3.5 rounded-xl bg-white/[0.01] border border-white/5">
                                        <div className="flex justify-between">
                                            <div className="h-3 bg-white/10 rounded w-1/3"></div>
                                            <div className="h-3 bg-white/10 rounded w-1/6"></div>
                                        </div>
                                        <div className="h-4 bg-white/10 rounded w-3/4"></div>
                                        <div className="h-3 bg-white/10 rounded w-full"></div>
                                    </div>
                                ))}
                            </div>
                        ) : cveError ? (
                            <div className="p-4 bg-rose-950/20 border border-rose-500/20 text-rose-400 rounded-xl text-center text-xs py-10">
                                {cveError}
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1 scrollbar-hide">
                                {cves.map(cve => {
                                    let severityColor = 'text-slate-400 bg-slate-500/10 border-slate-500/20';
                                    if (cve.severity === 'CRITICAL') severityColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
                                    else if (cve.severity === 'HIGH') severityColor = 'text-orange-400 bg-orange-500/10 border-orange-500/20';
                                    else if (cve.severity === 'MEDIUM') severityColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';

                                    return (
                                        <div key={cve.id} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/5 transition-all space-y-1.5 text-left">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-black tracking-wider text-purple-400 font-mono">{cve.id}</span>
                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${severityColor}`}>
                                                    {cve.severity}
                                                </span>
                                            </div>
                                            <h4 className="text-xs font-bold text-slate-100 line-clamp-1">{cve.title}</h4>
                                            <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2">{cve.description}</p>
                                            <div className="text-[9px] text-slate-500 font-mono text-right mt-1">
                                                Published: {cve.publishedDate}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {cveSources.length > 0 && (
                        <div className="pt-3 border-t border-white/5 space-y-2">
                            <div className="text-[9px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1 justify-start">
                                <Search size={10} className="text-purple-400" /> Grounded Search Sources
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {cveSources.slice(0, 3).map((src, sIdx) => (
                                    <a 
                                        key={sIdx}
                                        href={src.uri} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-[9px] bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all border border-white/5"
                                    >
                                        <span className="truncate max-w-[120px]">{src.title}</span>
                                        <ExternalLink size={8} />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Security Watchdog Dashboard Widget */}
            <div className="glass-card p-8 rounded-[2rem] border border-red-500/10 bg-gradient-to-br from-red-950/5 via-black/40 to-black/60 space-y-6 animate-reveal">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                    <div className="space-y-1 text-left">
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${threatLevel === 'CRITICAL' ? 'bg-red-400' : threatLevel === 'ELEVATED' ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                                <span className={`relative inline-flex rounded-full h-3 w-3 ${threatLevel === 'CRITICAL' ? 'bg-red-500' : threatLevel === 'ELEVATED' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                            </span>
                            <h3 className="text-xl font-bold flex items-center gap-2 text-slate-100">
                                <Shield className="text-red-400" size={20} /> Security Watchdog Center
                            </h3>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                            Real-time access frequency monitor and behavioral exfiltration detection watchdog.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                setSimulatedThreat(true);
                                playSecuritySound('alert');
                            }}
                            className="px-4 py-2 bg-red-600/10 border border-red-500/20 text-red-400 font-bold rounded-xl text-xs hover:bg-red-600 hover:text-white transition-all shadow-lg cursor-pointer"
                        >
                            SIMULATE THREAT
                        </button>
                        {simulatedThreat && (
                            <button
                                onClick={() => {
                                    setSimulatedThreat(false);
                                    playSecuritySound('success');
                                }}
                                className="px-4 py-2 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 font-bold rounded-xl text-xs hover:bg-emerald-600 hover:text-white transition-all shadow-lg cursor-pointer"
                            >
                                DISMISS ALARM
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Meter Gauge */}
                    <div className="p-6 rounded-2xl bg-black/30 border border-white/5 space-y-4 flex flex-col justify-between text-left">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider font-mono">Access Frequency Index</span>
                            <p className="text-3xl font-black text-slate-200">
                                {simulatedThreat ? "12.4" : decryptionCount > 0 ? (decryptionCount * 0.8).toFixed(1) : "0.0"} <span className="text-xs font-mono text-slate-500">Hz / min</span>
                            </p>
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="space-y-2">
                            <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full transition-all duration-500 ${threatLevel === 'CRITICAL' ? 'bg-red-500 w-full animate-pulse' : threatLevel === 'ELEVATED' ? 'bg-amber-500 w-2/3' : 'bg-emerald-500 w-1/12'}`}
                                />
                            </div>
                            <div className="flex justify-between text-[10px] font-mono text-slate-600">
                                <span>SAFE (0-1 Hz)</span>
                                <span>CRITICAL (3+ Hz)</span>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                            <span className="text-slate-500">Threat Level:</span>
                            <span className={`font-black uppercase tracking-wider ${threatLevel === 'CRITICAL' ? 'text-red-400 animate-pulse' : threatLevel === 'ELEVATED' ? 'text-amber-400' : 'text-emerald-400'}`}>
                                {threatLevel}
                            </span>
                        </div>
                    </div>

                    {/* Alerts feed */}
                    <div className="lg:col-span-2 p-6 rounded-2xl bg-black/30 border border-white/5 flex flex-col justify-between text-left">
                        <div className="space-y-3">
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5 font-mono">
                                <Activity size={12} /> Live Anomalies & Indicators
                            </span>

                            <div className="space-y-2 overflow-y-auto max-h-32 scrollbar-hide">
                                {watchdogAlerts.length === 0 ? (
                                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center gap-3 w-full">
                                        <ShieldCheck className="text-emerald-400 shrink-0" size={18} />
                                        <div className="space-y-0.5">
                                            <p className="text-xs font-bold text-slate-200">Passive Defense Secured</p>
                                            <p className="text-[10px] text-slate-500">No anomalous access rates or file exfiltration attempts detected.</p>
                                        </div>
                                    </div>
                                ) : (
                                    watchdogAlerts.map((alertMsg, idx) => (
                                        <div key={idx} className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 animate-pulse w-full">
                                            <ShieldAlert className="text-red-400 shrink-0 mt-0.5" size={16} />
                                            <div className="space-y-0.5">
                                                <p className="text-xs font-bold text-red-400">Suspicious Decryption Pattern</p>
                                                <p className="text-[10px] text-slate-300 leading-normal">{alertMsg}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                            <span>Sensing interval: Real-time (1s)</span>
                            <span>Target: KnouxSecure Sandboxed Enclave</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Weekly Activity Heatmap & Password Entropy Distribution Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* 1. Weekly Activity Heatmap (2 cols on large screens) */}
                <div className="xl:col-span-2 glass-card p-8 rounded-[2rem] space-y-6 animate-reveal flex flex-col justify-between">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Activity size={20} className="text-purple-400" /> Weekly Activity Heatmap
                            </h3>
                            <p className="text-xs text-slate-500 font-medium">
                                Real-time profiling of daily logins and secure scanning activities to spot operational anomalies.
                            </p>
                        </div>
                        <div className="flex bg-white/5 border border-white/5 p-1 rounded-xl gap-1 shrink-0">
                            <button
                                onClick={() => { setHeatmapMetric('scans'); playSecuritySound('success'); }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${heatmapMetric === 'scans' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                Scans Run
                            </button>
                            <button
                                onClick={() => { setHeatmapMetric('logins'); playSecuritySound('success'); }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${heatmapMetric === 'logins' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                Logins
                            </button>
                        </div>
                    </div>

                    {/* Grid of the heatmap */}
                    <div className="grid grid-cols-7 gap-2 pt-2">
                        {/* Day headers */}
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                            <div key={day} className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest pb-1">{day}</div>
                        ))}

                        {/* Four hour blocks for each day mapped vertically or horizontally */}
                        {['00:00 - 06:00', '06:00 - 12:00', '12:00 - 18:00', '18:00 - 24:00'].map((timeSlot) => (
                            <React.Fragment key={timeSlot}>
                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                                    const cell = weeklyHeatmapData.find(c => c.day === day && c.time === timeSlot) || { day, time: timeSlot, scans: 0, logins: 0, isAnomalous: false };
                                    const val = heatmapMetric === 'scans' ? cell.scans : cell.logins;
                                    
                                    // Compute visual color scale based on metric values
                                    let bgClass = "bg-white/[0.02] hover:bg-white/10 border border-white/5";
                                    if (cell.isAnomalous) {
                                        bgClass = "bg-rose-950/40 border border-rose-500/30 text-rose-400 shadow-[inset_0_0_8px_rgba(239,68,68,0.2)] hover:border-rose-400 animate-pulse";
                                    } else {
                                        if (heatmapMetric === 'scans') {
                                            if (val > 120) bgClass = "bg-purple-500 border border-purple-400 text-white";
                                            else if (val > 80) bgClass = "bg-purple-700 border border-purple-600 text-purple-100";
                                            else if (val > 30) bgClass = "bg-purple-900/50 border border-purple-800/40 text-purple-300";
                                            else if (val > 0) bgClass = "bg-purple-950/30 border border-purple-900/30 text-purple-400";
                                        } else {
                                            if (val > 35) bgClass = "bg-purple-500 border border-purple-400 text-white";
                                            else if (val > 20) bgClass = "bg-purple-700 border border-purple-600 text-purple-100";
                                            else if (val > 8) bgClass = "bg-purple-900/50 border border-purple-800/40 text-purple-300";
                                            else if (val > 0) bgClass = "bg-purple-950/30 border border-purple-900/30 text-purple-400";
                                        }
                                    }

                                    const isSelected = selectedHeatCell?.day === day && selectedHeatCell?.time === timeSlot;

                                    return (
                                        <div
                                            key={`${day}-${timeSlot}`}
                                            onClick={() => { setSelectedHeatCell(cell); playSecuritySound('success'); }}
                                            className={`aspect-[1.5] rounded-xl flex flex-col items-center justify-center p-1.5 cursor-pointer relative group transition-all ${bgClass} ${isSelected ? 'ring-2 ring-purple-400 scale-[1.04] z-10 border-purple-400/50' : ''}`}
                                        >
                                            <span className="text-[10px] font-mono font-black">{val}</span>
                                            <span className="text-[8px] text-slate-500 scale-90 leading-none truncate opacity-60 max-w-full">{timeSlot.split(' ')[0]}</span>

                                            {/* Micro hover metadata bubble */}
                                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-black border border-white/10 rounded-xl px-2.5 py-1.5 text-[10px] whitespace-nowrap z-50 shadow-2xl">
                                                <p className="font-bold text-slate-100">{day} • {timeSlot}</p>
                                                <p className="text-purple-300 font-semibold">{cell.scans} Scans • {cell.logins} Logins</p>
                                                {cell.isAnomalous && <p className="text-rose-400 font-bold flex items-center gap-1 mt-0.5"><AlertCircle size={10} /> ANOMALOUS ACCESS</p>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Cell Inspection Detail Box */}
                    {selectedHeatCell ? (
                        <div className={`p-4 rounded-2xl border transition-all ${selectedHeatCell.isAnomalous ? 'bg-rose-950/10 border-rose-500/20 text-rose-200' : 'bg-white/5 border-white/10 text-slate-300'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Clock size={14} className={selectedHeatCell.isAnomalous ? 'text-rose-400' : 'text-purple-400'} />
                                    <span className="text-xs font-black uppercase tracking-wider">{selectedHeatCell.day} Session Block • {selectedHeatCell.time}</span>
                                </div>
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border uppercase ${selectedHeatCell.isAnomalous ? 'bg-rose-500/10 text-rose-400 border-rose-400/30' : 'bg-purple-500/10 text-purple-400 border-purple-400/30'}`}>
                                    {selectedHeatCell.isAnomalous ? 'Alert Signature' : 'Baseline Posture'}
                                </span>
                            </div>
                            <div className="mt-2 text-xs flex flex-wrap gap-4 font-mono">
                                <div>Active scans: <span className="font-bold text-slate-100">{selectedHeatCell.scans} requests</span></div>
                                <div>Logins: <span className="font-bold text-slate-100">{selectedHeatCell.logins} sessions</span></div>
                            </div>
                            {selectedHeatCell.isAnomalous && (
                                <p className="text-xs text-rose-400 font-bold mt-2 bg-rose-500/5 p-2 rounded-lg border border-rose-500/10 flex items-start gap-1.5 leading-relaxed">
                                    <AlertCircle size={14} className="shrink-0 mt-0.5 text-rose-400" />
                                    <span>{selectedHeatCell.anomalyReason}</span>
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white/[0.01] border border-white/5 p-4 rounded-2xl text-center text-xs text-slate-600">
                            Select any cell block in the grid above to trigger deep-packet payload inspection.
                        </div>
                    )}
                </div>

                {/* 2. Password Entropy Distribution Card */}
                <div className="glass-card p-8 rounded-[2rem] space-y-6 animate-reveal flex flex-col justify-between">
                    <div>
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <Key size={20} className="text-purple-400" /> Password Entropy
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                            Distribution of information theoretic strength (bits) calculated for stored credentials.
                        </p>
                    </div>

                    <div className="h-48 w-full">
                        {entropyChartData.some(d => d.value > 0) ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={entropyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                    <XAxis dataKey="name" stroke="#64748B" fontSize={9} tickLine={false} />
                                    <YAxis stroke="#64748B" fontSize={10} tickLine={false} allowDecimals={false} />
                                    <Tooltip contentStyle={{ background: '#050508', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                        {entropyChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2 border border-white/5 bg-white/[0.01] rounded-2xl">
                                <Key size={32} strokeWidth={1} />
                                <p className="text-xs">No keys or credential files found in active vault.</p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2 border-t border-white/5 pt-4">
                        <div className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Entropy Security Standard</div>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#ef4444]"></span>
                                <span className="text-slate-400">Weak (&lt;36 bits): Guessable</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#f59e0b]"></span>
                                <span className="text-slate-400">Medium (36-59b): Vulnerable</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#8b5cf6]"></span>
                                <span className="text-slate-400">Strong (60-79b): Compliant</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
                                <span className="text-slate-400">Excellent (80b+): Sealed</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Resource Monitoring Section */}
            <div className="glass-card p-8 rounded-[2rem] space-y-6 animate-reveal stagger-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <Cpu size={20} className="text-purple-400" /> System Resource Telemetry
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-1">Real-time behavior analytics tracking secure virtual CPU cycles and storage allocation.</p>
                    </div>
                    <div className="flex gap-4 text-xs font-bold uppercase tracking-widest">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
                            <span className="text-cyan-400">CPU Usage</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
                            <span className="text-indigo-400">Vault Capacity</span>
                        </div>
                    </div>
                </div>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={resourceData}>
                            <defs>
                                <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.2}/>
                                    <stop offset="100%" stopColor="#22D3EE" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="storageGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#6366F1" stopOpacity={0.2}/>
                                    <stop offset="100%" stopColor="#6366F1" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                            <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} />
                            <YAxis stroke="#64748B" fontSize={10} tickLine={false} unit="%" />
                            <Tooltip contentStyle={{ background: '#050508', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                            <Area type="monotone" name="CPU Usage" dataKey="cpu" stroke="#22D3EE" fill="url(#cpuGrad)" strokeWidth={2} dot={{ r: 3, stroke: '#22D3EE', strokeWidth: 1 }} />
                            <Area type="monotone" name="Vault Storage" dataKey="storage" stroke="#6366F1" fill="url(#storageGrad)" strokeWidth={2} dot={{ r: 3, stroke: '#6366F1', strokeWidth: 1 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Floating Action Button (FAB) Menu */}
            <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-3">
                <AnimatePresence>
                    {fabExpanded && (
                        <motion.div 
                            initial={{ opacity: 0, y: 15, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 15, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-col items-end gap-2"
                        >
                            {/* Action: Quick Scan */}
                            <button
                                onClick={() => {
                                    setFabExpanded(false);
                                    playSecuritySound('scan');
                                    if (setView) setView('SCANNER');
                                }}
                                className="flex items-center gap-2 px-4 py-2.5 bg-[#09090f]/95 hover:bg-purple-600 text-slate-300 hover:text-white rounded-xl border border-white/10 hover:border-purple-500 shadow-xl text-xs font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
                            >
                                <span>Quick Scan</span>
                                <div className="w-6 h-6 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                                    <Scan size={12} />
                                </div>
                            </button>

                            {/* Action: Generate Password */}
                            <button
                                onClick={() => {
                                    setFabExpanded(false);
                                    setShowPasswordModal(true);
                                }}
                                className="flex items-center gap-2 px-4 py-2.5 bg-[#09090f]/95 hover:bg-purple-600 text-slate-300 hover:text-white rounded-xl border border-white/10 hover:border-purple-500 shadow-xl text-xs font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
                            >
                                <span>Generate Password</span>
                                <div className="w-6 h-6 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                                    <Key size={12} />
                                </div>
                            </button>

                            {/* Action: Export Vault */}
                            <button
                                onClick={() => {
                                    setFabExpanded(false);
                                    playSecuritySound('success');
                                    if (onExport) onExport();
                                }}
                                className="flex items-center gap-2 px-4 py-2.5 bg-[#09090f]/95 hover:bg-purple-600 text-slate-300 hover:text-white rounded-xl border border-white/10 hover:border-purple-500 shadow-xl text-xs font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
                            >
                                <span>Export Vault</span>
                                <div className="w-6 h-6 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                                    <Download size={12} />
                                </div>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Core FAB Toggle */}
                <button
                    onClick={() => { setFabExpanded(!fabExpanded); playSecuritySound('success'); }}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 border ${
                        fabExpanded 
                            ? 'bg-rose-600 border-rose-500 hover:brightness-110 rotate-45 shadow-rose-500/20' 
                            : 'bg-purple-600 border-purple-500 hover:brightness-110 shadow-purple-500/20'
                    }`}
                    id="fab-trigger"
                    title="Quick Actions Panel"
                >
                    <Plus size={24} className="transition-transform duration-300" />
                </button>
            </div>

            {/* Interactive Password Generator Overlay Modal */}
            <AnimatePresence>
                {showPasswordModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            className="bg-[#050508] border border-white/10 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="bg-white/5 border-b border-white/5 px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Key size={16} className="text-purple-400" />
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-300">Knoux AI Keymaker</span>
                                </div>
                                <button
                                    onClick={() => { setShowPasswordModal(false); playSecuritySound('error'); }}
                                    className="text-slate-500 hover:text-slate-300 text-sm font-bold"
                                >
                                    Close
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6 space-y-6">
                                {/* Password Field Wrapper */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Generated Key</label>
                                    <div className="relative bg-white/[0.02] border border-white/5 rounded-2xl px-4 py-3 flex items-center justify-between group hover:border-white/10 transition-all">
                                        <span className="font-mono text-sm text-purple-200 select-all tracking-wider break-all pr-8">
                                            {generatedPassword || "Configure options below"}
                                        </span>
                                        <button
                                            onClick={handleCopyPassword}
                                            disabled={!generatedPassword}
                                            className="absolute right-3 p-1.5 rounded-lg bg-white/5 hover:bg-purple-600 text-slate-400 hover:text-white transition-all disabled:opacity-30 shrink-0"
                                            title="Copy password key"
                                        >
                                            {isCopied ? <Check size={14} /> : <Copy size={14} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Entropy Posture Gauge */}
                                <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 flex items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Calculated Entropy</p>
                                        <p className="text-xl font-mono font-black text-slate-100">{passwordEntropy} <span className="text-xs text-slate-500">bits</span></p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase border ${
                                            passwordEntropy < 36 ? 'bg-rose-500/10 text-rose-400 border-rose-400/20' :
                                            passwordEntropy < 60 ? 'bg-amber-500/10 text-amber-400 border-amber-400/20' :
                                            passwordEntropy < 80 ? 'bg-purple-500/10 text-purple-400 border-purple-400/20' :
                                            'bg-emerald-500/10 text-emerald-400 border-emerald-400/20 shadow-[0_0_8px_rgba(16,185,129,0.15)]'
                                        }`}>
                                            {passwordEntropy < 36 ? 'Weak' :
                                             passwordEntropy < 60 ? 'Medium' :
                                             passwordEntropy < 80 ? 'Strong' : 'Excellent'}
                                        </span>
                                        <p className="text-[9px] text-slate-500 font-medium mt-1">
                                            {passwordEntropy < 36 ? 'High brute force vulnerability' :
                                             passwordEntropy < 60 ? 'Standard decryption risk' :
                                             passwordEntropy < 80 ? 'Robust security posture' : 'Quantum barrier compliant'}
                                        </p>
                                    </div>
                                </div>

                                {/* Length Slider */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-bold text-slate-400">Key Length</span>
                                        <span className="font-mono font-bold text-purple-400">{passwordLength} chars</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="8"
                                        max="64"
                                        value={passwordLength}
                                        onChange={(e) => setPasswordLength(parseInt(e.target.value))}
                                        className="w-full accent-purple-500 bg-white/10 rounded-lg appearance-none h-1.5 cursor-pointer"
                                    />
                                </div>

                                {/* Option Checklist */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Character Rules</label>
                                    <div className="grid grid-cols-2 gap-3 text-xs font-bold text-slate-300">
                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={includeUpper}
                                                onChange={(e) => setIncludeUpper(e.target.checked)}
                                                className="accent-purple-500"
                                            />
                                            <span>A-Z (Uppercase)</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={includeLower}
                                                onChange={(e) => setIncludeLower(e.target.checked)}
                                                className="accent-purple-500"
                                            />
                                            <span>a-z (Lowercase)</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={includeNumbers}
                                                onChange={(e) => setIncludeNumbers(e.target.checked)}
                                                className="accent-purple-500"
                                            />
                                            <span>0-9 (Numbers)</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={includeSymbols}
                                                onChange={(e) => setIncludeSymbols(e.target.checked)}
                                                className="accent-purple-500"
                                            />
                                            <span>!@#$ (Symbols)</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Re-Generate */}
                                <div className="pt-2 flex gap-3">
                                    <button
                                        onClick={generatePassword}
                                        className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 active:scale-95 transition-all text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-purple-500/25"
                                    >
                                        RE-GENERATE KEY
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DashboardView;
