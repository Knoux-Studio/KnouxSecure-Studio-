
import React from 'react';
import { AppSettings, LogLevel } from '../types';
import { Settings, Shield, Zap, Lock, Eye, Bell, Save, RotateCcw } from 'lucide-react';

interface SettingsViewProps {
    settings: AppSettings;
    setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
    onLog: (level: LogLevel, message: string, source: string) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ settings, setSettings, onLog }) => {
    const handleToggle = (key: keyof AppSettings) => {
        setSettings(prev => {
            const nextValue = !prev[key];
            onLog(LogLevel.INFO, `Setting '${key}' changed to ${nextValue}`, "SETTINGS");
            return { ...prev, [key]: nextValue };
        });
    };

    const handleProtectionChange = (level: AppSettings['protectionLevel']) => {
        setSettings(prev => ({ ...prev, protectionLevel: level }));
        onLog(LogLevel.WARN, `Workspace protection level upgraded to: ${level}`, "SECURITY");
    };

    return (
        <div className="p-8 h-full overflow-y-auto scrollbar-hide space-y-10 animate-reveal">
            <div className="flex flex-col gap-1">
                <h2 className="text-4xl font-black tracking-tight">
                    Studio <span className="text-purple-500">Settings</span>
                </h2>
                <p className="text-slate-500 font-medium italic">Configure local security policies and engine behavior.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Core Protection Section */}
                <div className="glass-card p-8 rounded-[2.5rem] space-y-8">
                    <div className="flex items-center gap-3">
                        <Shield className="text-purple-500" />
                        <h3 className="text-xl font-bold">Workspace Protection</h3>
                    </div>
                    
                    <div className="flex p-1 bg-black/40 rounded-2xl border border-white/5">
                        {(['UNPROTECTED', 'PROTECTED', 'LOCKED'] as const).map((level) => (
                            <button
                                key={level}
                                onClick={() => handleProtectionChange(level)}
                                className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black tracking-widest transition-all ${
                                    settings.protectionLevel === level 
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' 
                                    : 'text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed">
                        <span className="text-purple-400 font-bold uppercase tracking-tight">Locked:</span> Enforces AES-256-GCM on all saved scripts and restricts sandbox execution to validated runtimes only.
                    </p>
                </div>

                {/* Automation Toggles */}
                <div className="glass-card p-8 rounded-[2.5rem] space-y-6">
                    <div className="flex items-center gap-3">
                        <Zap className="text-purple-500" />
                        <h3 className="text-xl font-bold">Automation Engine</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-purple-500/30 transition-all">
                            <div className="flex items-center gap-4">
                                <Lock size={20} className="text-slate-400 group-hover:text-purple-400 transition-colors" />
                                <div>
                                    <div className="text-sm font-bold">Encrypt by Default</div>
                                    <div className="text-[10px] text-slate-500 font-medium">Auto-vault script on manual save</div>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleToggle('encryptByDefault')}
                                className={`w-12 h-6 rounded-full transition-all relative ${settings.encryptByDefault ? 'bg-purple-600' : 'bg-slate-800'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.encryptByDefault ? 'right-1' : 'left-1'}`}></div>
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-purple-500/30 transition-all">
                            <div className="flex items-center gap-4">
                                <Eye size={20} className="text-slate-400 group-hover:text-purple-400 transition-colors" />
                                <div>
                                    <div className="text-sm font-bold">Automatic AI Scanning</div>
                                    <div className="text-[10px] text-slate-500 font-medium">Analyze patterns on every save</div>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleToggle('autoScanOnSave')}
                                className={`w-12 h-6 rounded-full transition-all relative ${settings.autoScanOnSave ? 'bg-purple-600' : 'bg-slate-800'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.autoScanOnSave ? 'right-1' : 'left-1'}`}></div>
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-purple-500/30 transition-all">
                            <div className="flex items-center gap-4">
                                <Bell size={20} className="text-slate-400 group-hover:text-purple-400 transition-colors" />
                                <div>
                                    <div className="text-sm font-bold">Security Alerts</div>
                                    <div className="text-[10px] text-slate-500 font-medium">Desktop notifications for threats</div>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleToggle('notificationsEnabled')}
                                className={`w-12 h-6 rounded-full transition-all relative ${settings.notificationsEnabled ? 'bg-purple-600' : 'bg-slate-800'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.notificationsEnabled ? 'right-1' : 'left-1'}`}></div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button className="flex items-center gap-2 px-6 py-3 bg-purple-600 rounded-xl text-white font-bold text-sm shadow-xl shadow-purple-500/20 hover:bg-purple-500 transition-all">
                    <Save size={18} />
                    Commit Settings
                </button>
                <button className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-400 font-bold text-sm hover:bg-white/10 transition-all">
                    <RotateCcw size={18} />
                    Reset to Factory
                </button>
            </div>
        </div>
    );
};

export default SettingsView;
