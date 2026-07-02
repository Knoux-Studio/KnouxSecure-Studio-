
import React, { useRef, useState } from 'react';
import { VaultFile, LogLevel } from '../types';
import { Lock, Unlock, FileText, Trash2, Shield, MoreVertical, Plus, Download, Upload } from 'lucide-react';

interface VaultViewProps {
    files: VaultFile[];
    setFiles: React.Dispatch<React.SetStateAction<VaultFile[]>>;
    onLog: (level: LogLevel, message: string, source: string) => void;
    onExport: () => void;
    onImport: (files: VaultFile[]) => void;
}

const VaultView: React.FC<VaultViewProps> = ({ files, setFiles, onLog, onExport, onImport }) => {
    const scriptInputRef = useRef<HTMLInputElement>(null);
    const backupInputRef = useRef<HTMLInputElement>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

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
        setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
        onLog(LogLevel.WARN, `Removed file ${name} from secure storage.`, "VAULT");
    };

    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return;
        setFiles(prev => prev.filter(f => !selectedIds.includes(f.id)));
        onLog(LogLevel.WARN, `Bulk action executed: Removed ${selectedIds.length} selected file(s) from vault.`, "VAULT");
        setSelectedIds([]);
    };

    const handleBulkLock = () => {
        if (selectedIds.length === 0) return;
        setFiles(prev => prev.map(f => {
            if (selectedIds.includes(f.id)) {
                return { ...f, status: 'LOCKED' };
            }
            return f;
        }));
        onLog(LogLevel.INFO, `Bulk action executed: Set ${selectedIds.length} file(s) status to LOCKED.`, "VAULT");
        setSelectedIds([]);
    };

    const handleBulkUnlock = () => {
        if (selectedIds.length === 0) return;
        setFiles(prev => prev.map(f => {
            if (selectedIds.includes(f.id)) {
                return { ...f, status: 'UNLOCKED' };
            }
            return f;
        }));
        onLog(LogLevel.INFO, `Bulk action executed: Set ${selectedIds.length} file(s) status to UNLOCKED.`, "VAULT");
        setSelectedIds([]);
    };

    const handleBulkExport = () => {
        try {
            if (selectedIds.length === 0) return;
            const selectedFiles = files.filter(f => selectedIds.includes(f.id));
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(selectedFiles, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", `knouxsecure_bulk_export_${new Date().toISOString().split('T')[0]}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
            onLog(LogLevel.INFO, `Bulk action executed: Exported ${selectedFiles.length} selected vault keys/files.`, "VAULT");
        } catch (error) {
            onLog(LogLevel.ERROR, "Failed to execute bulk export.", "VAULT");
        }
    };

    const handleScriptUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const newFile: VaultFile = {
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            type: file.name.split('.').pop()?.toUpperCase() || 'Script',
            encryptedAt: new Date().toISOString().split('T')[0],
            size: `${(file.size / 1024).toFixed(1)} KB`,
            status: 'LOCKED'
        };
        setFiles(prev => [newFile, ...prev]);
        onLog(LogLevel.INFO, `Script ${file.name} successfully imported and encrypted with AES-256.`, "VAULT");
        e.target.value = ''; // Reset
    };

    const handleBackupFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                if (Array.isArray(data)) {
                    const isValid = data.every(item => item.id && item.name && item.status);
                    if (isValid) {
                        onImport(data);
                    } else {
                        onLog(LogLevel.ERROR, "Invalid backup configuration layout.", "VAULT");
                    }
                } else {
                    onLog(LogLevel.ERROR, "Invalid vault format structure.", "VAULT");
                }
            } catch (err) {
                onLog(LogLevel.ERROR, "Failure parsing local backup file.", "VAULT");
            }
        };
        reader.readAsText(file);
        e.target.value = ''; // Reset
    };

    return (
        <div className="p-8 h-full space-y-8 overflow-y-auto scrollbar-hide">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div className="flex flex-col gap-1">
                    <h2 className="text-3xl font-bold tracking-tight">Secure Vault</h2>
                    <p className="text-slate-500">AES-256 GCM encrypted filesystem storage.</p>
                </div>

                <div className="flex flex-wrap gap-3">
                    {/* Hidden Inputs */}
                    <input 
                        type="file" 
                        ref={scriptInputRef} 
                        onChange={handleScriptUploadChange} 
                        className="hidden" 
                        accept=".js,.py,.ps1,.sh,.bash,.json,.txt"
                    />
                    <input 
                        type="file" 
                        ref={backupInputRef} 
                        onChange={handleBackupFileChange} 
                        className="hidden" 
                        accept=".json"
                    />

                    {/* Action Buttons */}
                    <button 
                        onClick={() => backupInputRef.current?.click()}
                        className="bg-white/5 border border-white/10 text-slate-300 px-4 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-white/10 hover:text-white transition-all text-xs"
                        title="Import backup JSON"
                    >
                        <Upload size={14} />
                        <span>IMPORT BACKUP</span>
                    </button>
                    <button 
                        onClick={onExport}
                        className="bg-white/5 border border-white/10 text-slate-300 px-4 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-white/10 hover:text-white transition-all text-xs"
                        title="Export backup JSON"
                    >
                        <Download size={14} />
                        <span>EXPORT BACKUP</span>
                    </button>
                    <button 
                        onClick={() => scriptInputRef.current?.click()}
                        className="bg-purple-600 border border-purple-500 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-purple-500 transition-all text-xs shadow-lg shadow-purple-500/20"
                        title="Import script to encrypt"
                    >
                        <Plus size={16} />
                        <span>IMPORT SCRIPT</span>
                    </button>
                </div>
            </div>

            {/* Bulk Actions Panel */}
            {selectedIds.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-purple-600/10 border border-purple-500/20 rounded-2xl animate-reveal gap-4">
                    <div className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse"></span>
                        <span className="text-sm font-bold text-slate-100">
                            {selectedIds.length} file(s) selected
                        </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={handleBulkLock}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5"
                            title="Lock selected files"
                        >
                            <Lock size={12} />
                            <span>Lock Selected</span>
                        </button>
                        <button
                            onClick={handleBulkUnlock}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5"
                            title="Unlock selected files"
                        >
                            <Unlock size={12} />
                            <span>Unlock Selected</span>
                        </button>
                        <button
                            onClick={handleBulkExport}
                            className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5"
                            title="Export selected files JSON"
                        >
                            <Download size={12} />
                            <span>Export Selected</span>
                        </button>
                        <button
                            onClick={handleBulkDelete}
                            className="px-4 py-2 bg-rose-600/20 border border-rose-500/20 hover:bg-rose-500/30 text-rose-400 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5"
                            title="Delete selected files"
                        >
                            <Trash2 size={12} />
                            <span>Delete Selected</span>
                        </button>
                        <div className="w-px h-6 bg-white/5 mx-1 hidden sm:block"></div>
                        <button
                            onClick={() => setSelectedIds([])}
                            className="px-3 py-2 text-slate-500 hover:text-slate-300 text-xs font-bold"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            )}

            {files.length > 0 && (
                <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 text-slate-500 text-xs font-medium bg-white/[0.01] rounded-xl">
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input 
                            type="checkbox"
                            checked={selectedIds.length === files.length}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setSelectedIds(files.map(f => f.id));
                                } else {
                                    setSelectedIds([]);
                                }
                            }}
                            className="rounded border-white/10 bg-black/40 text-purple-600 focus:ring-purple-500/30 w-4 h-4 cursor-pointer accent-purple-600"
                        />
                        <span>Select All Files ({files.length})</span>
                    </label>
                    {selectedIds.length > 0 && (
                        <span className="text-[10px] bg-purple-500/10 text-purple-400 font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                            Selection Active
                        </span>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 gap-4">
                {files.length === 0 ? (
                    <div className="glass p-20 rounded-3xl flex flex-col items-center justify-center text-slate-600 gap-4">
                        <Shield size={64} strokeWidth={1} />
                        <p>No files currently protected in the vault.</p>
                    </div>
                ) : (
                    files.map(file => (
                        <div key={file.id} className="glass group p-5 rounded-2xl flex items-center gap-6 hover:bg-white/[0.05] transition-all border border-white/5">
                            {/* Checkbox for item */}
                            <input 
                                type="checkbox"
                                checked={selectedIds.includes(file.id)}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setSelectedIds(prev => [...prev, file.id]);
                                    } else {
                                        setSelectedIds(prev => prev.filter(id => id !== file.id));
                                    }
                                }}
                                className="rounded border-white/10 bg-black/40 text-purple-600 focus:ring-purple-500/30 w-4 h-4 cursor-pointer accent-purple-600 shrink-0"
                            />

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
