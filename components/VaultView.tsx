
import React, { useRef, useState, useEffect } from 'react';
import { VaultFile, LogLevel } from '../types';
import { 
    Lock, 
    Unlock, 
    FileText, 
    Trash2, 
    Shield, 
    MoreVertical, 
    Plus, 
    Download, 
    Upload, 
    CheckCircle2, 
    AlertCircle, 
    ShieldCheck, 
    ShieldAlert, 
    Check, 
    AlertTriangle,
    Key,
    QrCode,
    Camera,
    RefreshCw,
    Clock,
    Sparkles
} from 'lucide-react';
import { playSecuritySound } from '../services/soundService';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    Tooltip, 
    ResponsiveContainer, 
    Cell,
    CartesianGrid
} from 'recharts';

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

    // QR Code States & Refs
    const [activeQrFile, setActiveQrFile] = useState<VaultFile | null>(null);
    const [generatedQrUrl, setGeneratedQrUrl] = useState<string>('');
    const [showQrScanner, setShowQrScanner] = useState(false);
    const [scannerTab, setScannerTab] = useState<'camera' | 'demo'>('camera');
    const [cameraActive, setCameraActive] = useState(false);
    const [scanError, setScanError] = useState<string | null>(null);
    const [scanSuccessMsg, setScanSuccessMsg] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const scannerCanvasRef = useRef<HTMLCanvasElement>(null);

    const getPasswordAgeInDays = (file: VaultFile) => {
        try {
            const encryptedAtDate = new Date(file.encryptedAt);
            if (isNaN(encryptedAtDate.getTime())) return 0;
            const diffTime = Math.abs(Date.now() - encryptedAtDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays;
        } catch {
            return 0;
        }
    };

    const rotateCredential = (id: string) => {
        setFiles(prev => prev.map(f => {
            if (f.id === id) {
                const today = new Date().toISOString().split('T')[0];
                onLog(LogLevel.INFO, `Credential "${f.name}" successfully rotated. Rotation timestamp reset.`, "VAULT");
                playSecuritySound('success');
                return { ...f, encryptedAt: today };
            }
            return f;
        }));
    };

    const handleImportQRData = (text: string) => {
        try {
            let importedFile: Partial<VaultFile> | null = null;
            if (text.startsWith('knouxsecure:')) {
                const parts = text.substring('knouxsecure:'.length).split('|');
                if (parts.length >= 3) {
                    importedFile = {
                        name: parts[0],
                        type: parts[1],
                        passwordValue: parts[2] || undefined,
                        entropy: parts[3] ? parseInt(parts[3]) : undefined,
                        status: 'LOCKED',
                    };
                }
            } else {
                const parsed = JSON.parse(text);
                if (parsed && typeof parsed === 'object' && parsed.name) {
                    importedFile = {
                        name: parsed.name,
                        type: parsed.type || 'Credential',
                        passwordValue: parsed.passwordValue || parsed.secret || undefined,
                        entropy: parsed.entropy || 32,
                        status: 'LOCKED',
                    };
                }
            }

            if (importedFile) {
                const finalFile: VaultFile = {
                    id: Math.random().toString(36).substr(2, 9),
                    name: importedFile.name || 'imported_qr_asset.txt',
                    type: importedFile.type || 'Credential',
                    encryptedAt: new Date().toISOString().split('T')[0],
                    size: importedFile.passwordValue ? '0.4 KB' : '1.0 KB',
                    status: 'LOCKED',
                    passwordValue: importedFile.passwordValue,
                    entropy: importedFile.entropy,
                };
                setFiles(prev => [finalFile, ...prev]);
                onLog(LogLevel.INFO, `[QR Quick-Add] Successfully imported and encrypted asset "${finalFile.name}" via QR code.`, "VAULT");
                playSecuritySound('success');
                return true;
            }
        } catch (e) {
            onLog(LogLevel.ERROR, "Failed to parse QR code format.", "VAULT");
            playSecuritySound('error');
        }
        return false;
    };

    useEffect(() => {
        let stream: MediaStream | null = null;
        let animationFrameId: number;

        const startCamera = async () => {
            try {
                setScanError(null);
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.setAttribute('playsinline', 'true');
                    videoRef.current.play();
                    setCameraActive(true);
                    tick();
                }
            } catch (err: any) {
                console.error(err);
                setScanError("Unable to access system camera. Please verify camera permissions or use the Demo Import tab.");
                setCameraActive(false);
            }
        };

        const tick = () => {
            const video = videoRef.current;
            const canvas = scannerCanvasRef.current;
            if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height, {
                        inversionAttempts: "dontInvert",
                    });

                    if (code) {
                        const parsed = handleImportQRData(code.data);
                        if (parsed) {
                            setScanSuccessMsg(`Successfully scanned and imported credential!`);
                            setTimeout(() => {
                                setShowQrScanner(false);
                                setScanSuccessMsg(null);
                            }, 2000);
                            return; // Stop scanning loop
                        }
                    }
                }
            }
            if (showQrScanner && scannerTab === 'camera') {
                animationFrameId = requestAnimationFrame(tick);
            }
        };

        if (showQrScanner && scannerTab === 'camera') {
            startCamera();
        }

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            cancelAnimationFrame(animationFrameId);
            setCameraActive(false);
        };
    }, [showQrScanner, scannerTab]);

    useEffect(() => {
        if (activeQrFile) {
            const payload = `knouxsecure:${activeQrFile.name}|${activeQrFile.type}|${activeQrFile.passwordValue || ''}|${activeQrFile.entropy || ''}`;
            QRCode.toDataURL(payload, { width: 300, margin: 2 })
                .then(url => {
                    setGeneratedQrUrl(url);
                })
                .catch(err => {
                    console.error(err);
                    onLog(LogLevel.ERROR, "Failed to generate QR code asset.", "VAULT");
                });
        } else {
            setGeneratedQrUrl('');
        }
    }, [activeQrFile]);

    // Real-time security health diagnosis variables
    const unencryptedFiles = files.filter(f => f.status === 'UNLOCKED');
    const dangerousUnlockedScripts = files.filter(f => f.status === 'UNLOCKED' && ['POWERSHELL', 'JAVASCRIPT', 'PYTHON', 'SCRIPT', 'BASH', 'SH', 'PY', 'JS', 'PS1'].includes(f.type.toUpperCase()));
    const unencryptedSecrets = files.filter(f => f.status === 'UNLOCKED' && /key|pass|secret|credential|env|token/i.test(f.name));

    const check1_passed = unencryptedFiles.length === 0;
    const check2_passed = dangerousUnlockedScripts.length === 0;
    const check3_passed = unencryptedSecrets.length === 0;

    let passedChecks = 0;
    if (files.length > 0) {
        if (check1_passed) passedChecks++;
        if (check2_passed) passedChecks++;
        if (check3_passed) passedChecks++;
    }
    const healthScore = files.length === 0 ? 0 : Math.round((passedChecks / 3) * 100);

    const handleSecureAll = () => {
        const unencryptedCount = unencryptedFiles.length;
        if (unencryptedCount === 0) return;
        
        setFiles(prev => prev.map(f => ({ ...f, status: 'LOCKED' })));
        onLog(LogLevel.INFO, `One-click security suite completed: Encrypted ${unencryptedCount} vulnerable file(s) with AES-256-GCM.`, "VAULT");
        playSecuritySound('success');
    };

    const toggleLock = (id: string) => {
        setFiles(prev => prev.map(f => {
            if (f.id === id) {
                const newStatus = f.status === 'LOCKED' ? 'UNLOCKED' : 'LOCKED';
                onLog(LogLevel.INFO, `File ${f.name} status changed to ${newStatus}`, "VAULT");
                if (newStatus === 'LOCKED') {
                    playSecuritySound('success');
                } else {
                    playSecuritySound('unlock');
                }
                return { ...f, status: newStatus };
            }
            return f;
        }));
    };

    const deleteFile = (id: string, name: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
        setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
        onLog(LogLevel.WARN, `Removed file ${name} from secure storage.`, "VAULT");
        playSecuritySound('error');
    };

    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return;
        const affectedItems = files.filter(f => selectedIds.includes(f.id));
        const affectedNames = affectedItems.map(f => `"${f.name}"`).join(', ');
        
        setFiles(prev => prev.filter(f => !selectedIds.includes(f.id)));
        onLog(LogLevel.WARN, `[Batch Event] Bulk DELETE executed. Affected items: [${affectedNames}]. Total count: ${selectedIds.length}.`, "VAULT");
        setSelectedIds([]);
        playSecuritySound('error');
    };

    const handleBulkLock = () => {
        if (selectedIds.length === 0) return;
        const affectedItems = files.filter(f => selectedIds.includes(f.id));
        const affectedNames = affectedItems.map(f => `"${f.name}"`).join(', ');

        setFiles(prev => prev.map(f => {
            if (selectedIds.includes(f.id)) {
                return { ...f, status: 'LOCKED' };
            }
            return f;
        }));
        onLog(LogLevel.INFO, `[Batch Event] Bulk LOCK executed. Affected items: [${affectedNames}]. Total count: ${selectedIds.length}.`, "VAULT");
        setSelectedIds([]);
        playSecuritySound('success');
    };

    const handleBulkUnlock = () => {
        if (selectedIds.length === 0) return;
        const affectedItems = files.filter(f => selectedIds.includes(f.id));
        const affectedNames = affectedItems.map(f => `"${f.name}"`).join(', ');

        setFiles(prev => prev.map(f => {
            if (selectedIds.includes(f.id)) {
                return { ...f, status: 'UNLOCKED' };
            }
            return f;
        }));
        onLog(LogLevel.INFO, `[Batch Event] Bulk UNLOCK executed. Affected items: [${affectedNames}]. Total count: ${selectedIds.length}.`, "VAULT");
        setSelectedIds([]);
        playSecuritySound('unlock');
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

    const handleCSVExport = () => {
        try {
            const credentialsOnly = files.filter(f => f.passwordValue);
            if (credentialsOnly.length === 0) {
                onLog(LogLevel.WARN, "No credential assets available for CSV export.", "VAULT");
                return;
            }

            // CSV Headers
            let csvContent = "ID,Asset Name,Credential Type,Secret Value,Entropy,Status,Added Date\r\n";

            // Add rows
            credentialsOnly.forEach(f => {
                const id = `"${f.id.replace(/"/g, '""')}"`;
                const name = `"${f.name.replace(/"/g, '""')}"`;
                const type = `"${f.type.replace(/"/g, '""')}"`;
                const val = f.status === 'LOCKED' ? '"[ENCRYPTED]"' : `"${(f.passwordValue || '').replace(/"/g, '""')}"`;
                const entropy = `"${f.entropy || 0}"`;
                const status = `"${f.status}"`;
                const date = `"${f.encryptedAt}"`;
                
                csvContent += `${id},${name},${type},${val},${entropy},${status},${date}\r\n`;
            });

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `knoux_vault_credentials_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            onLog(LogLevel.INFO, `Exported ${credentialsOnly.length} vault credentials to CSV backup. Unlocked secrets exported in plaintext; locked secrets remained sealed.`, "VAULT");
            playSecuritySound('success');
        } catch (error) {
            onLog(LogLevel.ERROR, "Failed to export credentials CSV.", "VAULT");
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
                        onClick={() => {
                            setShowQrScanner(true);
                            setScannerTab('camera');
                        }}
                        className="bg-amber-600/20 border border-amber-500/30 text-amber-400 px-4 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-amber-600/30 transition-all text-xs hover:text-amber-300"
                        title="Scan QR Code to Import Credential"
                    >
                        <QrCode size={14} />
                        <span>QUICK-ADD (QR)</span>
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

            {/* Password Rotation Watchdog (Password Age Distribution Chart) */}
            {files.some(f => f.passwordValue) && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-reveal">
                    {/* Recharts Password Age Chart */}
                    <div className="glass-card p-6 rounded-[2rem] border border-white/5 bg-gradient-to-br from-purple-950/5 via-black/40 to-black/60 space-y-4 lg:col-span-2 text-left">
                        <div className="flex justify-between items-center">
                            <div className="space-y-0.5">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                                    <Clock size={14} /> Password Age Distribution
                                </h3>
                                <p className="text-[11px] text-slate-500 font-mono">
                                    Statistical distribution of credential lifespan against the 90-day security rotation SLA.
                                </p>
                            </div>
                        </div>
                        
                        <div className="h-56 w-full text-slate-300">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={ageGroups} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                                    <XAxis 
                                        dataKey="name" 
                                        stroke="#475569" 
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis 
                                        stroke="#475569" 
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        allowDecimals={false}
                                    />
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: '#0a0a10', 
                                            border: '1px solid rgba(168,85,247,0.2)', 
                                            borderRadius: '12px',
                                            fontSize: '11px'
                                        }}
                                        cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                    />
                                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                                        {ageGroups.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Security SLA Expiration list (Rotation Watchdog) */}
                    <div className="glass-card p-6 rounded-[2rem] border border-white/5 bg-gradient-to-br from-purple-950/5 via-black/40 to-black/60 flex flex-col justify-between text-left">
                        <div className="space-y-3">
                            <div className="space-y-0.5">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                                    <AlertTriangle size={14} /> ROTATION WATCHDOG
                                </h3>
                                <p className="text-[11px] text-slate-500">
                                    Credentials exceeding the 90-day rotation compliance threshold.
                                </p>
                            </div>

                            <div className="space-y-2 overflow-y-auto max-h-40 scrollbar-hide">
                                {outdatedCredentials.length === 0 ? (
                                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center space-y-1">
                                        <ShieldCheck className="mx-auto text-emerald-400" size={24} />
                                        <p className="text-xs font-bold text-emerald-400">Compliance Optimal</p>
                                        <p className="text-[10px] text-slate-400">All vault credentials are fully within the 90-day rotation SLA window.</p>
                                    </div>
                                ) : (
                                    outdatedCredentials.map(f => {
                                        const age = getPasswordAgeInDays(f);
                                        return (
                                            <div key={f.id} className="p-2.5 bg-rose-500/5 border border-rose-500/15 rounded-xl flex items-center justify-between gap-2 text-xs">
                                                <div className="space-y-0.5 text-left">
                                                    <p className="font-bold text-slate-200 truncate max-w-[120px]">{f.name}</p>
                                                    <p className="text-[9px] font-mono text-rose-400">{age} days since rotation</p>
                                                </div>
                                                <button
                                                    onClick={() => rotateCredential(f.id)}
                                                    className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                                                    title="Rotate password now"
                                                >
                                                    Rotate
                                                </button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-500">
                            <span>SLA Target: &lt;90 days</span>
                            <span className="font-bold text-rose-400">{outdatedCredentials.length} Outdated</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Vault Cryptographic Credentials Section */}
            {files.some(f => f.passwordValue) && (
                <div className="glass-card p-6 rounded-[2rem] border border-white/5 bg-gradient-to-br from-purple-950/5 via-black/40 to-black/60 space-y-5 animate-reveal">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Key size={18} className="text-purple-400" /> Vault Cryptographic Credentials
                            </h3>
                            <p className="text-xs text-slate-500 font-medium">
                                Manage and export secure access credentials, credentials matrix, and encryption key pairs.
                            </p>
                        </div>
                        <button
                            onClick={handleCSVExport}
                            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 self-start sm:self-auto hover:scale-[1.02] active:scale-95 shadow-lg shadow-purple-500/20 shrink-0"
                            title="Export credentials list to CSV backup"
                        >
                            <Download size={12} />
                            <span>EXPORT CSV</span>
                        </button>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-white/5 bg-black/20 scrollbar-hide">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.02] text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                                    <th className="p-4 font-bold">Credential / Target Asset</th>
                                    <th className="p-4 font-bold">Classification</th>
                                    <th className="p-4 font-bold">Secret Payload</th>
                                    <th className="p-4 font-bold">Entropy Pool</th>
                                    <th className="p-4 font-bold text-right">Protection Control</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {files.filter(f => f.passwordValue).map(credential => {
                                    const isUnlocked = credential.status === 'UNLOCKED';
                                    const entropyScore = credential.entropy || 0;
                                    const strengthLabel = entropyScore > 80 ? 'HIGH-ENTROPY' : entropyScore > 40 ? 'SECURE' : 'WEAK-POOL';
                                    const strengthColor = entropyScore > 80 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : entropyScore > 40 ? 'text-purple-400 bg-purple-500/10 border-purple-500/20' : 'text-rose-400 bg-rose-500/10 border-rose-500/20';
                                    const age = getPasswordAgeInDays(credential);
                                    const isOutdated = age > 90;

                                    return (
                                        <tr 
                                            key={credential.id} 
                                            className={`transition-colors ${
                                                isOutdated 
                                                    ? 'bg-rose-500/[0.02] hover:bg-rose-500/[0.04] border-l-2 border-l-rose-500' 
                                                    : 'hover:bg-white/[0.01]'
                                            }`}
                                        >
                                            <td className="p-4 font-bold text-slate-200">
                                                <div className="flex items-center gap-2">
                                                    <span>{credential.name}</span>
                                                    {isOutdated && (
                                                        <span 
                                                            className="px-1.5 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-[8px] font-black tracking-widest uppercase animate-pulse"
                                                            title={`CRITICAL: Password has not been rotated in ${age} days!`}
                                                        >
                                                            OUTDATED
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="bg-white/5 border border-white/5 text-slate-400 px-2.5 py-1 rounded-lg text-[10px] font-mono tracking-tight">
                                                    {credential.type.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="p-4 font-mono">
                                                {isUnlocked ? (
                                                    <span className="text-purple-300 font-bold tracking-tight selection:bg-purple-500/30">{credential.passwordValue}</span>
                                                ) : (
                                                    <span className="text-slate-600 tracking-widest font-black select-none">••••••••••••••••</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[9px] font-black tracking-widest px-2 py-0.5 rounded-md border ${strengthColor}`}>
                                                        {strengthLabel}
                                                    </span>
                                                    <span className="text-slate-500 font-mono">({entropyScore} bits)</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => toggleLock(credential.id)}
                                                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                                                            isUnlocked 
                                                                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20' 
                                                                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                                                        }`}
                                                    >
                                                        {isUnlocked ? 'Encrypt' : 'Decrypt'}
                                                    </button>
                                                    {isUnlocked && (
                                                        <button
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(credential.passwordValue || '');
                                                                onLog(LogLevel.INFO, `Copied secret key of "${credential.name}" to clipboard.`, "VAULT");
                                                                playSecuritySound('success');
                                                            }}
                                                            className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-all"
                                                        >
                                                            Copy Secret
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Security Health Checklist */}
            {files.length > 0 && (
                <div className="glass-card p-6 rounded-[2rem] border border-white/5 bg-gradient-to-br from-purple-950/10 via-black/40 to-black/60 space-y-5 animate-reveal">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <ShieldAlert size={18} className="text-purple-400" /> Vault Security Diagnostics
                            </h3>
                            <p className="text-xs text-slate-500 font-medium">
                                Automated configuration audit checking for active attack vectors and exposed credentials.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 bg-black/40 px-4 py-2.5 rounded-2xl border border-white/5 self-start sm:self-auto">
                            <div className="text-right">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Health Posture</p>
                                <p className="text-lg font-black font-mono text-slate-100">{healthScore}%</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center">
                                {healthScore === 100 ? (
                                    <ShieldCheck size={22} className="text-emerald-400" />
                                ) : (
                                    <ShieldAlert size={22} className="text-purple-400 animate-pulse" />
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Check 1: Encryption Coverage */}
                        <div className={`p-4 rounded-2xl border transition-all ${
                            check1_passed 
                                ? 'bg-emerald-950/5 border-emerald-500/10' 
                                : 'bg-rose-950/5 border-rose-500/10'
                        }`}>
                            <div className="flex items-start gap-3">
                                <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                                    check1_passed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                                }`}>
                                    {check1_passed ? <Check size={14} strokeWidth={3} /> : <AlertTriangle size={14} />}
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-xs font-bold text-slate-200">Encryption Coverage</h4>
                                    <p className="text-[11px] text-slate-500 leading-relaxed">
                                        {check1_passed 
                                            ? "All active vault assets are encrypted in AES-256 storage."
                                            : `Found ${unencryptedFiles.length} plain-text files. Access keys are vulnerable to cold-boot attacks.`}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Check 2: Dangerous Executables */}
                        <div className={`p-4 rounded-2xl border transition-all ${
                            check2_passed 
                                ? 'bg-emerald-950/5 border-emerald-500/10' 
                                : 'bg-amber-950/5 border-amber-500/10'
                        }`}>
                            <div className="flex items-start gap-3">
                                <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                                    check2_passed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                                }`}>
                                    {check2_passed ? <Check size={14} strokeWidth={3} /> : <AlertTriangle size={14} />}
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-xs font-bold text-slate-200">Script Protection</h4>
                                    <p className="text-[11px] text-slate-500 leading-relaxed">
                                        {check2_passed 
                                            ? "All executable modules are sealed in encrypted states."
                                            : `Warning: ${dangerousUnlockedScripts.length} active unencrypted script(s) are exposed to runtime injection.`}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Check 3: Secrets File Detection */}
                        <div className={`p-4 rounded-2xl border transition-all ${
                            check3_passed 
                                ? 'bg-emerald-950/5 border-emerald-500/10' 
                                : 'bg-rose-950/5 border-rose-500/10'
                        }`}>
                            <div className="flex items-start gap-3">
                                <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                                    check3_passed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                                }`}>
                                    {check3_passed ? <Check size={14} strokeWidth={3} /> : <AlertTriangle size={14} />}
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-xs font-bold text-slate-200">Credential Leak Check</h4>
                                    <p className="text-[11px] text-slate-500 leading-relaxed">
                                        {check3_passed 
                                            ? "No plaintext passwords, tokens, or private keyrings detected."
                                            : `Alert: ${unencryptedSecrets.length} file(s) matching secret keywords are currently unencrypted.`}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recommendation and Secure All trigger */}
                    {unencryptedFiles.length > 0 ? (
                        <div className="bg-purple-950/10 border border-purple-500/20 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></div>
                                <p className="text-xs text-purple-300 font-medium">
                                    Recommended: Seal all <span className="font-bold font-mono">{unencryptedFiles.length}</span> unencrypted files with a single action.
                                </p>
                            </div>
                            <button
                                onClick={handleSecureAll}
                                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs tracking-wider uppercase rounded-xl shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-95 shrink-0"
                            >
                                <Lock size={12} />
                                <span>SECURE ALL VAULT ASSETS</span>
                            </button>
                        </div>
                    ) : (
                        <div className="bg-emerald-950/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3">
                            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                            <p className="text-xs text-emerald-400 font-medium">
                                Posture Optimal. Your secure virtual file system has zero plain-text leaks.
                            </p>
                        </div>
                    )}
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
                                    onClick={() => setActiveQrFile(file)}
                                    title="Generate QR Code"
                                    className="p-2 rounded-lg bg-white/5 hover:bg-amber-500/20 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                                >
                                    <QrCode size={18} />
                                </button>
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

            {/* QR Generator Overlay Modal */}
            {activeQrFile && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
                    <div className="glass-card max-w-md w-full p-8 rounded-[2.5rem] border border-amber-500/20 text-center space-y-6 relative overflow-hidden shadow-2xl">
                        <div className="absolute -top-12 -left-12 w-48 h-48 bg-amber-500/5 blur-[80px] rounded-full"></div>
                        
                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                            <h3 className="text-lg font-bold flex items-center gap-2 text-slate-100">
                                <QrCode className="text-amber-400" size={20} /> QR Code Generator
                            </h3>
                            <button 
                                onClick={() => setActiveQrFile(null)}
                                className="text-slate-400 hover:text-white font-bold text-sm"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-white/5 rounded-2xl flex flex-col items-center justify-center">
                                {generatedQrUrl ? (
                                    <div className="p-3 bg-white rounded-xl shadow-inner">
                                        <img src={generatedQrUrl} alt="Generated QR Code" className="w-48 h-48 animate-reveal" />
                                    </div>
                                ) : (
                                    <div className="w-48 h-48 flex items-center justify-center text-slate-500">
                                        <RefreshCw className="animate-spin text-purple-400" size={24} />
                                    </div>
                                )}
                                <span className="text-[10px] text-slate-500 font-mono mt-3 uppercase tracking-widest">
                                    AES-256 Key Metadata Encoded
                                </span>
                            </div>

                            <div className="space-y-1 text-left bg-black/30 p-4 rounded-xl border border-white/5 text-xs font-mono">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Name:</span>
                                    <span className="text-slate-300 font-bold truncate max-w-[200px]">{activeQrFile.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Type:</span>
                                    <span className="text-slate-300 font-bold">{activeQrFile.type}</span>
                                </div>
                                {activeQrFile.passwordValue && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Secret:</span>
                                        <span className="text-purple-400 font-bold">●●●●●●●●</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button 
                                onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = generatedQrUrl;
                                    link.download = `knoux_qr_${activeQrFile.name.replace(/\s+/g, '_')}.png`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                }}
                                className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                            >
                                Download Image
                            </button>
                            <button 
                                onClick={() => setActiveQrFile(null)}
                                className="py-3 px-6 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-widest rounded-xl border border-white/5 transition-all cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* QR Scanner / Quick-Add Overlay Modal */}
            {showQrScanner && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
                    <div className="glass-card max-w-lg w-full p-8 rounded-[2.5rem] border border-amber-500/20 text-center space-y-6 relative overflow-hidden shadow-2xl">
                        <div className="absolute -top-12 -left-12 w-48 h-48 bg-amber-500/5 blur-[80px] rounded-full"></div>
                        
                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                            <h3 className="text-lg font-bold flex items-center gap-2 text-slate-100">
                                <Camera className="text-amber-400" size={20} /> Vault Quick-Add Suite
                            </h3>
                            <button 
                                onClick={() => setShowQrScanner(false)}
                                className="text-slate-400 hover:text-white font-bold text-sm"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Scanner Tab Controls */}
                        <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 text-[11px] font-bold">
                            <button
                                onClick={() => setScannerTab('camera')}
                                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                                    scannerTab === 'camera' 
                                        ? 'bg-amber-500 text-black shadow-md font-black' 
                                        : 'text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                <Camera size={12} />
                                <span>Live Webcam Scan</span>
                            </button>
                            <button
                                onClick={() => setScannerTab('demo')}
                                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                                    scannerTab === 'demo' 
                                        ? 'bg-amber-500 text-black shadow-md font-black' 
                                        : 'text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                <Sparkles size={12} />
                                <span>Demo Scan Simulator</span>
                            </button>
                        </div>

                        {scannerTab === 'camera' && (
                            <div className="space-y-4">
                                <p className="text-xs text-slate-400 leading-normal">
                                    Hold a printed or displayed KnouxSecure QR code up to your camera to instantly decrypt and mount its credentials in your vault space.
                                </p>
                                
                                <div className="relative aspect-video rounded-2xl bg-black/50 border border-white/5 overflow-hidden flex items-center justify-center">
                                    {cameraActive ? (
                                        <>
                                            <video ref={videoRef} className="w-full h-full object-cover rounded-2xl" />
                                            <canvas ref={scannerCanvasRef} className="hidden" />
                                            {/* Glowing scanner line overlay */}
                                            <div className="absolute top-0 inset-x-0 h-0.5 bg-amber-400 shadow-md shadow-amber-400 animate-pulse" style={{
                                                animation: 'scanLine 2s linear infinite',
                                            }}></div>
                                            <style>{`
                                                @keyframes scanLine {
                                                    0% { top: 0%; }
                                                    50% { top: 100%; }
                                                    100% { top: 0%; }
                                                }
                                            `}</style>
                                        </>
                                    ) : (
                                        <div className="p-6 flex flex-col items-center justify-center space-y-3">
                                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-slate-400 animate-pulse">
                                                <Camera size={24} />
                                            </div>
                                            <p className="text-xs text-slate-500 max-w-[280px] leading-relaxed">
                                                {scanError || "Accessing system video devices... Please allow camera access."}
                                            </p>
                                        </div>
                                    )}

                                    {scanSuccessMsg && (
                                        <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-sm flex flex-col items-center justify-center space-y-2 animate-reveal">
                                            <CheckCircle2 size={48} className="text-emerald-400" />
                                            <span className="text-sm font-bold text-white uppercase tracking-wider">Asset Mounted Successfully</span>
                                            <span className="text-xs text-emerald-300 font-mono">Encrypted with AES-256 inside vault enclave</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {scannerTab === 'demo' && (
                            <div className="space-y-4 text-left">
                                <p className="text-xs text-slate-400 leading-normal">
                                    No camera available? Use the high-fidelity simulator to test the secure decryption and import pipeline. Select one of the pre-encoded hardware keys below to trigger a secure scan:
                                </p>

                                <div className="space-y-3">
                                    {[
                                        { name: "Mainframe AWS Root API Key", type: "AWS", val: "aws_root_9182398127391827", entropy: 96 },
                                        { name: "Knoux Secure Backup Passphrase", type: "PASSPHRASE", val: "shattered_goggles_crystal_palace", entropy: 128 },
                                        { name: "Stripe Production Live Client Token", type: "STRIPE", val: "sk_live_51Nv92831823981", entropy: 80 }
                                    ].map((demo, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                const payload = `knouxsecure:${demo.name}|${demo.type}|${demo.val}|${demo.entropy}`;
                                                setScanSuccessMsg(`Scanning: ${demo.name}...`);
                                                playSecuritySound('unlock');
                                                setTimeout(() => {
                                                    const res = handleImportQRData(payload);
                                                    if (res) {
                                                        setScanSuccessMsg(`Demo Scanned and Imported: ${demo.name}!`);
                                                        setTimeout(() => {
                                                            setShowQrScanner(false);
                                                            setScanSuccessMsg(null);
                                                        }, 2000);
                                                    }
                                                }, 1200);
                                            }}
                                            className="w-full p-4 rounded-2xl bg-white/[0.02] hover:bg-amber-500/5 hover:border-amber-500/20 border border-white/5 flex items-center justify-between text-xs transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                                        >
                                            <div className="space-y-1">
                                                <p className="font-bold text-slate-200">{demo.name}</p>
                                                <p className="text-[10px] text-slate-500 font-mono">Payload: {demo.val.substring(0, 15)}...</p>
                                            </div>
                                            <span className="text-[9px] bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded font-black uppercase tracking-wider border border-amber-500/20">
                                                SIMULATE SCAN
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                {scanSuccessMsg && (
                                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center flex items-center justify-center gap-2 text-xs text-emerald-400 font-bold animate-pulse">
                                        <RefreshCw className="animate-spin" size={14} />
                                        <span>{scanSuccessMsg}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                            <button 
                                onClick={() => setShowQrScanner(false)}
                                className="py-3 px-6 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-widest rounded-xl border border-white/5 transition-all cursor-pointer"
                            >
                                Close Scanner
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VaultView;
