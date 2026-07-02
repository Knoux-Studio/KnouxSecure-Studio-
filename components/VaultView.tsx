
import React from 'react';
import { VaultFile, LogLevel } from '../types';
import { Lock, Unlock, FileText, Trash2, Shield, MoreVertical, Plus } from 'lucide-react';

interface VaultViewProps {
    files: VaultFile[];
    setFiles: React.Dispatch<React.SetStateAction<VaultFile[]>>;
    onLog: (level: LogLevel, message: string, source: string) => void;
}

const VaultView: React.FC<VaultViewProps> = ({ files, setFiles, onLog }) => {
    const toggleLock = (id: string) => {
        setFiles(prev => prev.map(f => {
            if (f.id === id) {
                const newStatus = f.status === 'LOCKED' ? 'UNLOCKED' : 'LOCKED';
                onLog(LogLevel.INFO, `File ${f.name} status changed to ${newStatus}`, "VAULT");
                return { ...f, status: newStatus };
            }
            return f;
        }));
    };

    const deleteFile = (id: string, name: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
        onLog(LogLevel.WARN, `Removed file ${name} from secure storage.`, "VAULT");
    };

    return (
        <div className="p-8 h-full space-y-8 overflow-y-auto scrollbar-hide">
            <div className="flex justify-between items-end">
                <div className="flex flex-col gap-1">
                    <h2 className="text-3xl font-bold tracking-tight">Secure Vault</h2>
                    <p className="text-slate-500">AES-256 GCM encrypted filesystem storage.</p>
                </div>
                <button className="bg-white/5 border border-white/10 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-white/10 transition-all">
                    <Plus size={18} />
                    <span>IMPORT SCRIPT</span>
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {files.length === 0 ? (
                    <div className="glass p-20 rounded-3xl flex flex-col items-center justify-center text-slate-600 gap-4">
                        <Shield size={64} strokeWidth={1} />
                        <p>No files currently protected in the vault.</p>
                    </div>
                ) : (
                    files.map(file => (
                        <div key={file.id} className="glass group p-5 rounded-2xl flex items-center gap-6 hover:bg-white/[0.05] transition-all border border-white/5">
                            <div className={`p-4 rounded-xl shrink-0 ${
                                file.status === 'LOCKED' ? 'bg-purple-600/10 text-purple-400' : 'bg-emerald-600/10 text-emerald-400'
                            }`}>
                                {file.status === 'LOCKED' ? <Lock size={24} /> : <Unlock size={24} />}
                            </div>
                            
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-bold text-slate-100">{file.name}</h4>
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-slate-500 uppercase">{file.type}</span>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-slate-500">
                                    <span>Added {file.encryptedAt}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                    <span>{file.size}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                    <span className={`font-bold ${file.status === 'LOCKED' ? 'text-purple-500' : 'text-emerald-500'}`}>
                                        {file.status}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => toggleLock(file.id)}
                                    title={file.status === 'LOCKED' ? 'Decrypt' : 'Encrypt'}
                                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                >
                                    {file.status === 'LOCKED' ? <Unlock size={18} /> : <Lock size={18} />}
                                </button>
                                <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                                    <FileText size={18} />
                                </button>
                                <button 
                                    onClick={() => deleteFile(file.id, file.name)}
                                    className="p-2 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                                <div className="w-px h-6 bg-white/5 mx-2"></div>
                                <button className="p-2 text-slate-600 hover:text-slate-400">
                                    <MoreVertical size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Security Notice */}
            <div className="bg-indigo-600/10 border border-indigo-500/20 p-6 rounded-3xl flex gap-4">
                <div className="p-2 rounded-lg bg-indigo-500 text-white shrink-0 h-fit">
                    <Shield size={20} />
                </div>
                <div>
                    <h5 className="font-bold text-indigo-300 mb-1">Authenticated Encryption Protocol</h5>
                    <p className="text-sm text-indigo-300/60 leading-relaxed">
                        Files in this vault are encrypted using AES-256-GCM. Decryption keys are derived locally from your machine ID and a workspace salt. They never leave this environment and are destroyed when the vault session expires.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default VaultView;
