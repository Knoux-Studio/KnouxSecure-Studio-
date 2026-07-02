
import React from 'react';
import { LogEntry, VaultFile, LogLevel } from '../types';
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
    Terminal
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

const DashboardView: React.FC<DashboardViewProps> = ({ vaultFiles, logs }) => {
    const lockedCount = vaultFiles.filter(f => f.status === 'LOCKED').length;
    const alertCount = logs.filter(l => l.level === LogLevel.WARN || l.level === LogLevel.ERROR).length;
    const totalScans = logs.filter(l => l.source === 'SCANNER').length;

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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
        </div>
    );
};

export default DashboardView;
