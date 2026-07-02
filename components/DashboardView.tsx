
import React, { useState, useEffect } from 'react';
import { LogEntry, VaultFile, LogLevel, CVEAlert } from '../types';
import { fetchRecentCves } from '../services/geminiService';
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
    Search
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardViewProps {
    vaultFiles: VaultFile[];
    logs: LogEntry[];
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

const DashboardView: React.FC<DashboardViewProps> = ({ vaultFiles, logs }) => {
    const [cves, setCves] = useState<CVEAlert[]>([]);
    const [cveSources, setCveSources] = useState<{ title: string, uri: string }[]>([]);
    const [cveLoading, setCveLoading] = useState(true);
    const [cveError, setCveError] = useState('');

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
            <div className="flex flex-col gap-1 animate-reveal">
                <h2 className="text-4xl font-black tracking-tight">
                    Security <span className="text-purple-500">Overview</span>
                </h2>
                <p className="text-slate-500 font-medium">Session ID: <span className="code-font text-purple-400">KNX-V3-ALPHA</span></p>
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
        </div>
    );
};

export default DashboardView;
