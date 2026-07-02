
import React, { useState, useEffect, useCallback } from 'react';
import { View, LogEntry, LogLevel, VaultFile, AppSettings } from './types';
import DashboardView from './components/DashboardView';
import ScannerView from './components/ScannerView';
import VaultView from './components/VaultView';
import SandboxView from './components/SandboxView';
import SettingsView from './components/SettingsView';
import Sidebar from './components/Sidebar';
import { ChevronRight, Sun, Moon, Activity, Info } from 'lucide-react';

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>('DASHBOARD');
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [settings, setSettings] = useState<AppSettings>({
        encryptByDefault: false,
        sandboxEnabled: true,
        protectionLevel: 'PROTECTED',
        autoScanOnSave: true,
        notificationsEnabled: true
    });
    
    const [vaultFiles, setVaultFiles] = useState<VaultFile[]>([
        { id: '1', name: 'security_config.ps1', type: 'PowerShell', encryptedAt: '2025-05-12', size: '1.2 KB', status: 'LOCKED' },
        { id: '2', name: 'api_gateway.js', type: 'JavaScript', encryptedAt: '2025-05-14', size: '4.5 KB', status: 'LOCKED' },
        { id: '3', name: 'payload_scanner.py', type: 'Python', encryptedAt: '2025-05-15', size: '2.8 KB', status: 'UNLOCKED' },
    ]);

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

    useEffect(() => {
        addLog(LogLevel.INFO, "KnouxSecure Studio™ System Active.", "SYSTEM");
        if (!isDarkMode) {
            document.body.classList.add('light');
        } else {
            document.body.classList.remove('light');
        }
    }, [isDarkMode, addLog]);

    const renderView = () => {
        switch (currentView) {
            case 'DASHBOARD': return <DashboardView vaultFiles={vaultFiles} logs={logs} />;
            case 'SCANNER': return <ScannerView onLog={addLog} />;
            case 'VAULT': return <VaultView files={vaultFiles} setFiles={setVaultFiles} onLog={addLog} />;
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
                            and utilizes the <strong>Gemini 3 Intelligence Engine</strong> for behavioral sandboxing.
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

    return (
        <div className={`flex h-screen ${isDarkMode ? 'bg-[#050508] text-slate-200' : 'bg-slate-50 text-slate-800'} transition-colors duration-300`}>
            <Sidebar currentView={currentView} setView={setCurrentView} />
            
            <main className="flex-1 relative overflow-hidden flex flex-col">
                <header className="h-16 glass border-b border-white/5 flex items-center justify-between px-8 shrink-0 z-20">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-500">Workspaces</span>
                        <ChevronRight size={14} className="text-slate-600" />
                        <span className="text-sm font-semibold tracking-wide">Main-Secure-Repo</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-slate-400"
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
            </main>
        </div>
    );
};

export default App;
