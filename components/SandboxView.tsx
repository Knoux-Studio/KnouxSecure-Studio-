import React, { useState } from 'react';
import { LogLevel, SandboxResult } from '../types';
import { runInSandbox } from '../security/sandbox';
// Fixed missing 'Activity' import and replaced non-existent 'ShieldInfo' with 'Shield'
import { Play, Square, Loader2, Terminal, AlertTriangle, CheckCircle, Shield, Activity } from 'lucide-react';

interface SandboxViewProps {
    onLog: (level: LogLevel, message: string, source: string) => void;
}

const SandboxView: React.FC<SandboxViewProps> = ({ onLog }) => {
    const [code, setCode] = useState<string>('');
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<SandboxResult | null>(null);
    const [language, setLanguage] = useState('PowerShell');

    const handleRun = async () => {
        if (!code.trim()) return;

        setIsRunning(true);
        setResult(null);
        onLog(LogLevel.INFO, `Initializing secure sandbox for ${language} script...`, "SANDBOX");

        try {
            const simulation = await runInSandbox(code, language);
            setResult(simulation);
            onLog(LogLevel.INFO, `Sandbox execution completed with exit code ${simulation.exitCode}.`, "SANDBOX");
            
            if (simulation.securityWarnings.length > 0) {
                onLog(LogLevel.WARN, `Sandbox flagged ${simulation.securityWarnings.length} runtime behavioral warnings.`, "SANDBOX");
            }
        } catch (error) {
            onLog(LogLevel.ERROR, "Sandbox runtime environment failed to initialize.", "SANDBOX");
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="p-8 h-full flex flex-col gap-8 overflow-y-auto scrollbar-hide animate-reveal">
            <div className="flex justify-between items-end">
                <div className="flex flex-col gap-1">
                    <h2 className="text-3xl font-bold tracking-tight">Isolated <span className="text-purple-500">Sandbox</span></h2>
                    <p className="text-slate-500 font-medium italic">Restricted execution environment with zero host access.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <select 
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="bg-white/5 border border-white/10 text-slate-400 text-xs font-bold rounded-xl px-4 py-3 outline-none focus:border-purple-500/50"
                    >
                        <option>PowerShell</option>
                        <option>JavaScript</option>
                        <option>Python</option>
                        <option>TypeScript</option>
                    </select>
                    <button 
                        onClick={handleRun}
                        disabled={isRunning || !code.trim()}
                        className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 transition-all shadow-lg shadow-purple-500/20"
                    >
                        {isRunning ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} fill="white" />}
                        {isRunning ? 'EXECUTING...' : 'RUN IN SANDBOX'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-[500px]">
                {/* Editor Section */}
                <div className="flex flex-col glass rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
                    <div className="bg-white/5 px-6 py-4 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Terminal size={16} className="text-slate-400" />
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Input Buffer</span>
                        </div>
                    </div>
                    <textarea 
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Enter code to execute in isolation..."
                        className="flex-1 bg-[#050508]/50 p-6 code-font text-sm text-purple-200 placeholder:text-slate-700 outline-none resize-none leading-relaxed"
                    />
                </div>

                {/* Console Output Section */}
                <div className="flex flex-col glass rounded-[2rem] overflow-hidden border border-white/10">
                    <div className="bg-white/5 px-6 py-4 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {/* Added missing Activity icon */}
                            <Activity size={16} className="text-slate-400" />
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Runtime Console</span>
                        </div>
                        {result && (
                            <div className="flex items-center gap-2 text-[10px] font-bold">
                                <span className="text-slate-500">Exit Code:</span>
                                <span className={result.exitCode === 0 ? 'text-emerald-400' : 'text-rose-400'}>{result.exitCode}</span>
                                <span className="text-slate-500 ml-2">Duration:</span>
                                <span className="text-purple-400">{result.duration}ms</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex-1 p-6 overflow-y-auto bg-black/40 code-font">
                        {!result && !isRunning && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-700 space-y-4 opacity-40">
                                <Square size={48} strokeWidth={1} />
                                <p className="text-xs uppercase tracking-widest font-black">Standby for Execution</p>
                            </div>
                        )}

                        {isRunning && (
                            <div className="space-y-4 animate-pulse">
                                <div className="text-purple-400 text-sm italic">&gt;&gt;&gt; Initializing Virtual Virtual Environment...</div>
                                <div className="text-slate-500 text-sm">&gt;&gt;&gt; Setting up restricted filesystem mounts...</div>
                                <div className="text-slate-500 text-sm">&gt;&gt;&gt; Attaching secure debugger...</div>
                            </div>
                        )}

                        {result && (
                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">Stdout</div>
                                    <pre className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                                        {result.output || "No output captured."}
                                    </pre>
                                </div>

                                {result.securityWarnings.length > 0 && (
                                    <div className="space-y-3 pt-6 border-t border-white/5">
                                        <div className="text-[10px] text-rose-500 uppercase font-black tracking-widest flex items-center gap-2">
                                            <AlertTriangle size={12} /> Runtime Behavioral Warnings
                                        </div>
                                        {result.securityWarnings.map((warning, i) => (
                                            <div key={i} className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-start gap-3">
                                                {/* Fixed non-existent ShieldInfo icon */}
                                                <Shield size={14} className="shrink-0 mt-0.5" />
                                                {warning}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {result.securityWarnings.length === 0 && (
                                    <div className="pt-6 border-t border-white/5 flex items-center gap-2 text-emerald-500 text-xs font-bold">
                                        <CheckCircle size={16} />
                                        Behavioral patterns align with safe baseline.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SandboxView;