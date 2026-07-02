import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Sparkles, HelpCircle, Volume2 } from 'lucide-react';
import { View, LogLevel } from '../types';

interface VoiceControlProps {
    currentView: View;
    setView: (view: View) => void;
    onLog: (level: LogLevel, message: string, source: string) => void;
}

const VoiceControl: React.FC<VoiceControlProps> = ({ currentView, setView, onLog }) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [lastRecognized, setLastRecognized] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [showHelp, setShowHelp] = useState(false);
    const recognitionRef = useRef<any>(null);

    // Initialize Web Speech API SpeechRecognition
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setErrorMsg('Speech recognition not supported in this browser.');
            return;
        }

        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = false;
        rec.lang = 'en-US';

        rec.onstart = () => {
            setIsListening(true);
            setErrorMsg('');
            setTranscript('Listening...');
        };

        rec.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'not-allowed') {
                setErrorMsg('Microphone access denied.');
            } else if (event.error === 'no-speech') {
                // Ignore transient no-speech errors in continuous mode
            } else {
                setErrorMsg(`Error: ${event.error}`);
            }
            setIsListening(false);
        };

        rec.onend = () => {
            setIsListening(false);
        };

        rec.onresult = (event: any) => {
            const results = event.results;
            const latestResult = results[results.length - 1];
            if (latestResult.isFinal) {
                const text = latestResult[0].transcript.trim().toLowerCase();
                setTranscript(text);
                processCommand(text);
            }
        };

        recognitionRef.current = rec;

        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (e) {}
            }
        };
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            setErrorMsg('Speech recognition is not supported.');
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            try {
                recognitionRef.current.start();
            } catch (e) {
                console.error('Failed to start speech recognition', e);
                // In case it was already started or failed
                try {
                    recognitionRef.current.stop();
                    setTimeout(() => recognitionRef.current.start(), 200);
                } catch (err) {}
            }
        }
    };

    const processCommand = (command: string) => {
        onLog(LogLevel.DEBUG, `Voice captured: "${command}"`, "VOICE");

        // Command processing logic
        const formatted = command.toLowerCase();

        const routes: { keywords: string[]; view: View; label: string }[] = [
            { keywords: ['dashboard', 'main view', 'overview'], view: 'DASHBOARD', label: 'Dashboard' },
            { keywords: ['scanner', 'script scanner', 'static analysis', 'code analysis'], view: 'SCANNER', label: 'Script Scanner' },
            { keywords: ['vault', 'secure vault', 'keys', 'encryption vault'], view: 'VAULT', label: 'Secure Vault' },
            { keywords: ['logs', 'activity logs', 'audit logs', 'show logs'], view: 'LOGS', label: 'Activity Logs' },
            { keywords: ['sandbox', 'secure sandbox', 'virtual environment'], view: 'SANDBOX', label: 'Secure Sandbox' },
            { keywords: ['settings', 'configuration', 'options'], view: 'SETTINGS', label: 'Settings' },
            { keywords: ['help', 'documentation', 'docs'], view: 'HELP', label: 'Documentation' },
        ];

        let matched = false;
        for (const route of routes) {
            // Check if any keyword matches
            const matchesKeyword = route.keywords.some(keyword => {
                // match things like "go to vault", "open vault", "show vault", "vault"
                return formatted.includes(keyword) || (formatted.includes('go to') && formatted.includes(keyword)) || (formatted.includes('show') && formatted.includes(keyword)) || (formatted.includes('open') && formatted.includes(keyword));
            });

            if (matchesKeyword) {
                setView(route.view);
                setLastRecognized(`Navigated to ${route.label}`);
                onLog(LogLevel.INFO, `Hands-free command matched: "${command}" -> Switched to ${route.label}`, "VOICE");
                matched = true;
                break;
            }
        }

        if (!matched) {
            setLastRecognized(`Unrecognized command: "${command}"`);
            onLog(LogLevel.WARN, `Voice command unrecognized: "${command}"`, "VOICE");
        }
    };

    return (
        <div className="relative flex items-center gap-2">
            {/* Visual transcript display when listening or after recognizing */}
            {(isListening || lastRecognized) && (
                <div className="hidden lg:flex flex-col items-end mr-2 text-right max-w-[200px]">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                        {isListening ? (
                            <>
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                                <span className="text-red-400 font-bold">Voice System Active</span>
                            </>
                        ) : (
                            <span className="text-purple-400 font-bold">Voice Status</span>
                        )}
                    </div>
                    <div className="text-[11px] font-medium text-slate-300 truncate w-full" title={transcript}>
                        {isListening ? `Hearing: "${transcript || '...'}"` : lastRecognized}
                    </div>
                </div>
            )}

            {/* Error Message Tooltip */}
            {errorMsg && (
                <div className="absolute right-0 bottom-12 bg-rose-950/90 border border-rose-500/20 text-rose-300 text-[10px] px-3 py-1.5 rounded-xl whitespace-nowrap z-50">
                    {errorMsg}
                </div>
            )}

            {/* Microphone Toggle Button */}
            <button
                onClick={toggleListening}
                className={`p-2.5 rounded-xl border transition-all duration-300 relative group flex items-center justify-center ${
                    isListening 
                    ? 'bg-red-600/15 border-red-500/40 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.25)] animate-pulse' 
                    : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
                title={isListening ? 'Stop listening' : 'Start voice commands'}
                id="voice-command-toggle"
            >
                {isListening ? <Mic size={16} className="text-red-400" /> : <MicOff size={16} />}
            </button>

            {/* Voice Info/Help Button */}
            <button
                onClick={() => setShowHelp(!showHelp)}
                className={`p-2 rounded-xl transition-all ${
                    showHelp ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20' : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Voice guide"
                id="voice-help-toggle"
            >
                <HelpCircle size={15} />
            </button>

            {/* Voice Command Helper Dialog */}
            {showHelp && (
                <div className="absolute right-0 top-12 w-64 bg-[#09090f]/95 border border-white/10 rounded-2xl p-4 shadow-2xl z-50 backdrop-blur-md space-y-3">
                    <div className="flex items-center gap-1.5 border-b border-white/5 pb-2">
                        <Sparkles size={14} className="text-purple-400" />
                        <span className="text-xs font-black tracking-wider uppercase text-slate-200">Voice Navigation</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                        Control Knoux hands-free. Click the microphone icon to toggle the voice command system.
                    </p>
                    <div className="space-y-1.5 text-[10px] font-mono">
                        <div className="text-[9px] font-bold text-purple-400 uppercase tracking-widest mt-1">Available Commands</div>
                        <div className="bg-white/[0.02] border border-white/5 p-2 rounded-lg space-y-1 text-slate-300">
                            <div>• <span className="text-slate-100 font-bold">"Go to Dashboard"</span></div>
                            <div>• <span className="text-slate-100 font-bold">"Go to Vault"</span></div>
                            <div>• <span className="text-slate-100 font-bold">"Show Logs"</span></div>
                            <div>• <span className="text-slate-100 font-bold">"Go to Scanner"</span></div>
                            <div>• <span className="text-slate-100 font-bold">"Go to Sandbox"</span></div>
                            <div>• <span className="text-slate-100 font-bold">"Go to Settings"</span></div>
                        </div>
                    </div>
                    <div className="flex justify-between items-center text-[9px] text-slate-500 pt-1">
                        <span className="flex items-center gap-1"><Volume2 size={10} /> English (US)</span>
                        <button onClick={() => setShowHelp(false)} className="hover:text-white font-bold">Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VoiceControl;
