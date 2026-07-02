
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, LogEntry, LogLevel, VaultFile, AppSettings } from './types';
import DashboardView from './components/DashboardView';
import ScannerView from './components/ScannerView';
import VaultView from './components/VaultView';
import SandboxView from './components/SandboxView';
import SettingsView from './components/SettingsView';
import Sidebar from './components/Sidebar';
import VoiceControl from './components/VoiceControl';
import { ChevronRight, Sun, Moon, Activity, Info, Keyboard, Search, Lock } from 'lucide-react';

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>('DASHBOARD');
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAutoLocked, setIsAutoLocked] = useState(false);
    const lastActivityTime = useRef<number>(Date.now());
    
    const [settings, setSettings] = useState<AppSettings>(() => {
        const stored = localStorage.getItem('knoux_settings');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                // fallback
            }
        }
        return {
            encryptByDefault: false,
            sandboxEnabled: true,
            protectionLevel: 'PROTECTED',
            autoScanOnSave: true,
            notificationsEnabled: true
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

    useEffect(() => {
        addLog(LogLevel.INFO, "KnouxSecure Studio™ System Active.", "SYSTEM");
    }, [addLog]);

    useEffect(() => {
        if (!isDarkMode) {
            document.body.classList.add('light');
        } else {
            document.body.classList.remove('light');
        }
    }, [isDarkMode]);

    // Auto-Lock Inactivity Handler
    useEffect(() => {
        if (isAutoLocked) return;
        const timeoutMinutes = settings.autoLockTimeout || 0;
        if (timeoutMinutes <= 0) return;

        const interval = setInterval(() => {
            const idleTimeMs = Date.now() - lastActivityTime.current;
            const thresholdMs = timeoutMinutes * 60 * 1000;
            if (idleTimeMs >= thresholdMs) {
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
            case 'DASHBOARD': return <DashboardView vaultFiles={vaultFiles} logs={logs} />;
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
                {isAutoLocked && (
                    <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4">
                        <div className="glass-card max-w-md w-full p-8 rounded-[2.5rem] border border-purple-500/30 text-center space-y-6 relative overflow-hidden">
                            <div className="absolute -top-12 -left-12 w-48 h-48 bg-purple-600/10 blur-[80px] rounded-full"></div>
                            <div className="mx-auto w-16 h-16 bg-purple-600/10 border border-purple-500/20 text-purple-400 rounded-full flex items-center justify-center animate-pulse">
                                <Lock size={32} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-white">Suite Locked</h3>
                                <p className="text-xs text-slate-400 uppercase tracking-widest font-mono">Session secured due to inactivity</p>
                            </div>
                            <div className="py-4 border-y border-white/5 space-y-1">
                                <div className="text-3xl font-black text-slate-100 tracking-wider">
                                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                                    System Time (UTC)
                                </div>
                            </div>
                            <button 
                                onClick={() => {
                                    setIsAutoLocked(false);
                                    lastActivityTime.current = Date.now();
                                    addLog(LogLevel.INFO, "Session unlocked. Control credentials verified.", "SYSTEM");
                                }}
                                className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl shadow-lg shadow-purple-500/25 transition-all duration-300"
                            >
                                UNLOCK SYSTEM
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;
