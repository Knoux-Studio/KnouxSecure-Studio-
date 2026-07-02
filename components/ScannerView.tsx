
import React, { useState } from 'react';
import { LogLevel, SecurityIssue } from '../types';
import { analyzeCodeWithAI } from '../services/geminiService';
import { playSecuritySound } from '../services/soundService';
// Added missing 'Scan' icon to imports
import { Terminal, ShieldAlert, CheckCircle2, Loader2, Play, AlertTriangle, Scan } from 'lucide-react';

interface ScannerViewProps {
    onLog: (level: LogLevel, message: string, source: string) => void;
}

const ScannerView: React.FC<ScannerViewProps> = ({ onLog }) => {
    const [code, setCode] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [results, setResults] = useState<SecurityIssue[] | null>(null);

    const handleScan = async () => {
        if (!code.trim()) return;
        
        setIsAnalyzing(true);
        onLog(LogLevel.INFO, "Starting AI security audit...", "SCANNER");
        
        try {
            const findings = await analyzeCodeWithAI(code);
            setResults(findings);
            
            if (findings.length > 0) {
                onLog(LogLevel.WARN, `Analysis complete. Found ${findings.length} potential issues.`, "SCANNER");
            } else {
                onLog(LogLevel.INFO, "Analysis complete. No threats detected.", "SCANNER");
            }
            playSecuritySound('scan');
        } catch (error) {
            onLog(LogLevel.ERROR, "AI analysis engine failed to respond.", "SCANNER");
            playSecuritySound('error');
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="p-8 h-full flex flex-col gap-8 overflow-y-auto scrollbar-hide">
            <div className="flex justify-between items-end">
                <div className="flex flex-col gap-1">
                    <h2 className="text-3xl font-bold tracking-tight">Script Scanner</h2>
                    <p className="text-slate-500">Static code analysis powered by Knoux AI Intelligence.</p>
                </div>
                <button 
                    onClick={handleScan}
                    disabled={isAnalyzing || !code.trim()}
                    className="bg-neon-purple text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:brightness-110 disabled:opacity-50 transition-all shadow-lg"
                >
                    {isAnalyzing ? <Loader2 className="animate-spin" /> : <Play size={18} fill="white" />}
                    {isAnalyzing ? 'ANALYZING...' : 'RUN SECURITY SCAN'}
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 flex-1 min-h-[500px]">
                {/* Code Editor Container */}
                <div className="flex flex-col glass rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                    <div className="bg-white/5 px-6 py-3 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Terminal size={16} className="text-slate-400" />
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Input Sandbox</span>
                        </div>
                        <span className="text-xs text-slate-500 italic">Supports .ps1, .js, .py, .ts</span>
                    </div>
                    <textarea 
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Paste script content here for security auditing..."
                        className="flex-1 bg-transparent p-6 code-font text-sm text-purple-100 placeholder:text-slate-700 outline-none resize-none leading-relaxed"
                    />
                </div>

                {/* Analysis Results */}
                <div className="flex flex-col glass rounded-3xl overflow-hidden border border-white/10">
                    <div className="bg-white/5 px-6 py-3 border-b border-white/5 flex items-center gap-2">
                        <ShieldAlert size={16} className="text-slate-400" />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Findings Dashboard</span>
                    </div>
                    
                    <div className="flex-1 p-6 overflow-y-auto space-y-4">
                        {!results && !isAnalyzing && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4 opacity-50">
                                <Scan size={64} strokeWidth={1} />
                                <p className="text-sm">Wait for scan completion to view results</p>
                            </div>
                        )}

                        {isAnalyzing && (
                            <div className="h-full flex flex-col items-center justify-center text-purple-400 space-y-4">
                                <Loader2 size={48} className="animate-spin" />
                                <p className="text-sm font-bold animate-pulse">Scanning Byte Patterns...</p>
                            </div>
                        )}

                        {results && results.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-emerald-500 space-y-4">
                                <CheckCircle2 size={64} strokeWidth={1} />
                                <p className="text-sm font-medium">Clear. No known threat signatures found.</p>
                            </div>
                        )}

                        {results && results.length > 0 && results.map((issue, idx) => (
                            <div key={idx} className={`p-4 rounded-2xl border flex gap-4 ${
                                issue.severity === 'HIGH' ? 'bg-rose-500/10 border-rose-500/20' :
                                issue.severity === 'MEDIUM' ? 'bg-amber-500/10 border-amber-500/20' :
                                'bg-blue-500/10 border-blue-500/20'
                            }`}>
                                <div className={`mt-1 ${
                                    issue.severity === 'HIGH' ? 'text-rose-400' :
                                    issue.severity === 'MEDIUM' ? 'text-amber-400' :
                                    'text-blue-400'
                                }`}>
                                    <AlertTriangle size={20} />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-sm text-slate-100">{issue.type.replace('_', ' ')}</span>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                                            issue.severity === 'HIGH' ? 'text-rose-400 border-rose-400/30' :
                                            issue.severity === 'MEDIUM' ? 'text-amber-400 border-amber-400/30' :
                                            'text-blue-400 border-blue-400/30'
                                        }`}>{issue.severity}</span>
                                    </div>
                                    <p className="text-sm text-slate-400">{issue.description}</p>
                                    <div className="text-[10px] text-slate-500 font-mono">Location: Line {issue.line}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScannerView;
