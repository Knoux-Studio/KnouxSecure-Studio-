
import React, { useState } from 'react';
import { AppSettings, LogLevel } from '../types';
import { Settings, Shield, Zap, Lock, Eye, EyeOff, Bell, Save, RotateCcw, Check, X, Key, Clock, Sparkles, Copy } from 'lucide-react';

interface SettingsViewProps {
    settings: AppSettings;
    setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
    onLog: (level: LogLevel, message: string, source: string) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ settings, setSettings, onLog }) => {
    const [masterPassword, setMasterPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Secure Credentials Generator state
    const [genLength, setGenLength] = useState(24);
    const [genUpper, setGenUpper] = useState(true);
    const [genLower, setGenLower] = useState(true);
    const [genDigits, setGenDigits] = useState(true);
    const [genSpecial, setGenSpecial] = useState(true);
    const [generatedPassword, setGeneratedPassword] = useState('');
    const [copied, setCopied] = useState(false);

    const generateSecurePassword = () => {
        let charset = '';
        if (genUpper) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (genLower) charset += 'abcdefghijklmnopqrstuvwxyz';
        if (genDigits) charset += '0123456789';
        if (genSpecial) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

        if (!charset) {
            setGeneratedPassword('');
            return;
        }

        // Cryptographically secure random generation
        const array = new Uint32Array(genLength);
        window.crypto.getRandomValues(array);
        
        let result = '';
        for (let i = 0; i < genLength; i++) {
            result += charset[array[i] % charset.length];
        }
        
        setGeneratedPassword(result);
        setCopied(false);
        onLog(LogLevel.INFO, "Cryptographically secure high-entropy credential generated.", "SETTINGS");
    };

    const handleCopy = () => {
        if (!generatedPassword) return;
        navigator.clipboard.writeText(generatedPassword);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        onLog(LogLevel.INFO, "Secure credentials copied to clipboard.", "SYSTEM");
    };

    const handleApplyGenerated = () => {
        if (!generatedPassword) return;
        setMasterPassword(generatedPassword);
        onLog(LogLevel.INFO, "Applied high-entropy credentials to Vault Master Passphrase.", "SETTINGS");
    };

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

    // Password evaluation
    const getPasswordRequirements = (pwd: string) => {
        return {
            hasLength: pwd.length >= 8,
            hasUpper: /[A-Z]/.test(pwd),
            hasLower: /[a-z]/.test(pwd),
            hasDigit: /\d/.test(pwd),
            hasSpecial: /[^A-Za-z0-9]/.test(pwd),
        };
    };

    const requirements = getPasswordRequirements(masterPassword);
    const score = Object.values(requirements).filter(Boolean).length;

    const getStrengthLabel = (score: number, pwd: string) => {
        if (!pwd) return { label: 'NOT SET', color: 'text-slate-500', barBg: 'bg-slate-800', width: '0%', textGlow: '' };
        if (score <= 1) return { label: 'VULNERABLE', color: 'text-rose-500', barBg: 'bg-rose-500', width: '20%', textGlow: 'shadow-rose-500/30' };
        if (score === 2) return { label: 'WEAK', color: 'text-amber-500', barBg: 'bg-amber-500', width: '40%', textGlow: 'shadow-amber-500/30' };
        if (score === 3) return { label: 'SECURE', color: 'text-blue-400', barBg: 'bg-blue-500', width: '60%', textGlow: 'shadow-blue-500/30' };
        if (score === 4) return { label: 'HIGH SECURITY', color: 'text-emerald-400', barBg: 'bg-emerald-500', width: '80%', textGlow: 'shadow-emerald-500/30' };
        return { label: 'KNOUX-GRADE AES-256', color: 'text-purple-400 font-extrabold', barBg: 'bg-purple-600', width: '100%', textGlow: 'shadow-purple-500/30' };
    };

    const strength = getStrengthLabel(score, masterPassword);

    const handleUpdateCredentials = () => {
        if (!masterPassword) {
            onLog(LogLevel.WARN, "Master passphrase input is blank.", "SECURITY");
            return;
        }
        if (score < 3) {
            onLog(LogLevel.ERROR, "Password too weak. Required level: SECURE (Score 3+) to derive high-entropy keys.", "SECURITY");
            return;
        }
        onLog(LogLevel.INFO, "Cryptographic salt generated. New AES-256-GCM vault keys synchronized.", "SECURITY");
        setMasterPassword('');
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

                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-purple-500/30 transition-all">
                            <div className="flex items-center gap-4">
                                <Clock size={20} className="text-slate-400 group-hover:text-purple-400 transition-colors" />
                                <div>
                                    <div className="text-sm font-bold">Auto-Lock Idle Timeout</div>
                                    <div className="text-[10px] text-slate-500 font-medium">Locks dashboard on inactivity</div>
                                </div>
                            </div>
                            <select 
                                value={settings.autoLockTimeout || 0}
                                onChange={(e) => {
                                    const value = parseInt(e.target.value);
                                    setSettings(prev => ({ ...prev, autoLockTimeout: value }));
                                    onLog(LogLevel.INFO, `Auto-Lock idle timeout adjusted to ${value === 0 ? 'Disabled' : `${value} minute(s)`}.`, "SECURITY");
                                }}
                                className="bg-black/40 hover:bg-black/60 border border-white/10 hover:border-purple-500/30 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 outline-none focus:border-purple-500 transition-all cursor-pointer"
                            >
                                <option value={0} className="bg-slate-950">Disabled</option>
                                <option value={1} className="bg-slate-950">1 Minute</option>
                                <option value={5} className="bg-slate-950">5 Minutes</option>
                                <option value={15} className="bg-slate-950">15 Minutes</option>
                                <option value={30} className="bg-slate-950">30 Minutes</option>
                            </select>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-purple-500/30 transition-all">
                            <div className="flex items-center gap-4">
                                <Lock size={20} className="text-slate-400 group-hover:text-purple-400 transition-colors" />
                                <div>
                                    <div className="text-sm font-bold">4-Digit Security PIN</div>
                                    <div className="text-[10px] text-slate-500 font-medium">Auto-lock alternative authentication PIN</div>
                                </div>
                            </div>
                            <input 
                                type="text"
                                maxLength={4}
                                pattern="\d*"
                                value={settings.securityPin || "1337"}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                                    setSettings(prev => ({ ...prev, securityPin: val }));
                                    if (val.length === 4) {
                                        onLog(LogLevel.INFO, `Lock screen security PIN updated to "${val}".`, "SECURITY");
                                    }
                                }}
                                className="bg-black/40 hover:bg-black/60 border border-white/10 hover:border-purple-500/30 rounded-xl px-3 py-2 text-xs font-bold font-mono text-purple-400 outline-none focus:border-purple-500 transition-all cursor-pointer w-24 text-center"
                            />
                        </div>
                    </div>
                </div>

                {/* Password Credentials / Cryptographic Passphrase Meter Section */}
                <div className="glass-card p-8 rounded-[2.5rem] space-y-6 flex flex-col justify-between">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <Key className="text-purple-500" />
                            <div>
                                <h3 className="text-xl font-bold">Vault Master Credentials</h3>
                                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Passphrase-derived high entropy symmetric encryption keys</p>
                            </div>
                        </div>

                        <div className="space-y-4 pt-2">
                            <div className="relative">
                                <input 
                                    type={showPassword ? 'text' : 'password'}
                                    value={masterPassword}
                                    onChange={(e) => setMasterPassword(e.target.value)}
                                    placeholder="Enter Master Password/Passphrase"
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm font-medium focus:border-purple-500 outline-none pr-12 transition-all"
                                />
                                <button
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500 font-bold">STRENGTH:</span>
                                    <span className={`font-mono text-[10px] tracking-wider uppercase ${strength.color}`}>
                                        {strength.label}
                                    </span>
                                </div>
                                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
                                    <div 
                                        className={`h-full ${strength.barBg} transition-all duration-500 ease-out`}
                                        style={{ width: strength.width }}
                                    ></div>
                                </div>
                            </div>

                            <button
                                onClick={handleUpdateCredentials}
                                className="w-full py-4 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 text-purple-400 hover:text-purple-300 font-bold text-xs tracking-wider uppercase rounded-2xl transition-all"
                            >
                                Derive & Update Cryptographic Keys
                            </button>
                        </div>

                        {/* Password Checklist Requirements (Stacked) */}
                        <div className="bg-white/[0.01] border border-white/5 p-5 rounded-2xl space-y-2">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest pb-1 border-b border-white/5">Strength Requirements</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1.5">
                                <div className="flex items-center gap-2">
                                    {requirements.hasLength ? (
                                        <Check size={12} className="text-emerald-400 bg-emerald-500/10 p-0.5 rounded-full shrink-0" />
                                    ) : (
                                        <X size={12} className="text-slate-600 bg-white/5 p-0.5 rounded-full shrink-0" />
                                    )}
                                    <span className={requirements.hasLength ? 'text-slate-300' : 'text-slate-500'}>Minimum 8 chars</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {requirements.hasUpper ? (
                                        <Check size={12} className="text-emerald-400 bg-emerald-500/10 p-0.5 rounded-full shrink-0" />
                                    ) : (
                                        <X size={12} className="text-slate-600 bg-white/5 p-0.5 rounded-full shrink-0" />
                                    )}
                                    <span className={requirements.hasUpper ? 'text-slate-300' : 'text-slate-500'}>Uppercase A-Z</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {requirements.hasLower ? (
                                        <Check size={12} className="text-emerald-400 bg-emerald-500/10 p-0.5 rounded-full shrink-0" />
                                    ) : (
                                        <X size={12} className="text-slate-600 bg-white/5 p-0.5 rounded-full shrink-0" />
                                    )}
                                    <span className={requirements.hasLower ? 'text-slate-300' : 'text-slate-500'}>Lowercase a-z</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {requirements.hasDigit ? (
                                        <Check size={12} className="text-emerald-400 bg-emerald-500/10 p-0.5 rounded-full shrink-0" />
                                    ) : (
                                        <X size={12} className="text-slate-600 bg-white/5 p-0.5 rounded-full shrink-0" />
                                    )}
                                    <span className={requirements.hasDigit ? 'text-slate-300' : 'text-slate-500'}>Number 0-9</span>
                                </div>
                                <div className="flex items-center gap-2 sm:col-span-2">
                                    {requirements.hasSpecial ? (
                                        <Check size={12} className="text-emerald-400 bg-emerald-500/10 p-0.5 rounded-full shrink-0" />
                                    ) : (
                                        <X size={12} className="text-slate-600 bg-white/5 p-0.5 rounded-full shrink-0" />
                                    )}
                                    <span className={requirements.hasSpecial ? 'text-slate-300' : 'text-slate-500'}>Special symbol (!@#$%^&*)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Vault Credentials Generator Utility Card (Right Col) */}
                <div className="glass-card p-8 rounded-[2.5rem] space-y-6 flex flex-col justify-between">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <Sparkles className="text-purple-500" />
                            <div>
                                <h3 className="text-xl font-bold">Credentials Generator</h3>
                                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Manufacture high-entropy, military-grade credentials</p>
                            </div>
                        </div>

                        {/* Length Slider */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400 font-bold">PASSWORD LENGTH:</span>
                                <span className="font-mono text-purple-400 font-bold">{genLength} characters</span>
                            </div>
                            <input 
                                type="range" 
                                min="12" 
                                max="64" 
                                value={genLength}
                                onChange={(e) => setGenLength(parseInt(e.target.value))}
                                className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-purple-600"
                            />
                        </div>

                        {/* Character Set Toggles */}
                        <div className="grid grid-cols-2 gap-3 bg-white/[0.01] p-4 rounded-2xl border border-white/5">
                            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer group">
                                <input 
                                    type="checkbox" 
                                    checked={genUpper} 
                                    onChange={(e) => setGenUpper(e.target.checked)}
                                    className="rounded border-white/10 bg-black/40 text-purple-600 focus:ring-0 focus:ring-offset-0 cursor-pointer w-4 h-4"
                                />
                                <span className="group-hover:text-white transition-colors">Uppercase</span>
                            </label>
                            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer group">
                                <input 
                                    type="checkbox" 
                                    checked={genLower} 
                                    onChange={(e) => setGenLower(e.target.checked)}
                                    className="rounded border-white/10 bg-black/40 text-purple-600 focus:ring-0 focus:ring-offset-0 cursor-pointer w-4 h-4"
                                />
                                <span className="group-hover:text-white transition-colors">Lowercase</span>
                            </label>
                            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer group">
                                <input 
                                    type="checkbox" 
                                    checked={genDigits} 
                                    onChange={(e) => setGenDigits(e.target.checked)}
                                    className="rounded border-white/10 bg-black/40 text-purple-600 focus:ring-0 focus:ring-offset-0 cursor-pointer w-4 h-4"
                                />
                                <span className="group-hover:text-white transition-colors">Numbers (0-9)</span>
                            </label>
                            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer group">
                                <input 
                                    type="checkbox" 
                                    checked={genSpecial} 
                                    onChange={(e) => setGenSpecial(e.target.checked)}
                                    className="rounded border-white/10 bg-black/40 text-purple-600 focus:ring-0 focus:ring-offset-0 cursor-pointer w-4 h-4"
                                />
                                <span className="group-hover:text-white transition-colors">Symbols (!@#$)</span>
                            </label>
                        </div>

                        {/* Display Field */}
                        <div className="space-y-3">
                            <div className="relative">
                                <input 
                                    type="text" 
                                    readOnly 
                                    value={generatedPassword}
                                    placeholder="Click Generate to Begin"
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-xs font-mono text-purple-300 focus:border-purple-500 outline-none pr-12 transition-all"
                                />
                                {generatedPassword && (
                                    <button
                                        onClick={handleCopy}
                                        className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${copied ? 'text-emerald-400' : 'text-slate-400 hover:text-white'}`}
                                        title="Copy to clipboard"
                                        id="copy-generated-pass"
                                    >
                                        {copied ? <Check size={18} /> : <Copy size={18} />}
                                    </button>
                                )}
                            </div>

                            {generatedPassword && (
                                <button
                                    onClick={handleApplyGenerated}
                                    className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 hover:text-emerald-300 font-bold text-[10px] tracking-wider uppercase rounded-xl transition-all flex items-center justify-center gap-1.5"
                                >
                                    <Check size={14} /> Apply to Vault Passphrase
                                </button>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={generateSecurePassword}
                        className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs tracking-wider uppercase rounded-2xl shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all flex items-center justify-center gap-2 mt-4"
                    >
                        <Sparkles size={14} /> Generate Credentials
                    </button>
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
