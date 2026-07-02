
export enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR'
}

export interface LogEntry {
    id: string;
    timestamp: string;
    level: LogLevel;
    message: string;
    source: string;
}

export interface SecurityIssue {
    line: number;
    type: 'DANGEROUS_COMMAND' | 'OBFUSCATION' | 'SUSPICIOUS_PATTERN';
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface VaultFile {
    id: string;
    name: string;
    type: string;
    encryptedAt: string;
    size: string;
    status: 'LOCKED' | 'UNLOCKED';
    passwordValue?: string;
    entropy?: number;
}

export interface SandboxResult {
    output: string;
    exitCode: number;
    duration: number;
    securityWarnings: string[];
}

export type View = 'DASHBOARD' | 'SCANNER' | 'VAULT' | 'LOGS' | 'SANDBOX' | 'SETTINGS' | 'HELP';

export interface AppSettings {
    encryptByDefault: boolean;
    sandboxEnabled: boolean;
    protectionLevel: 'UNPROTECTED' | 'PROTECTED' | 'LOCKED';
    autoScanOnSave: boolean;
    notificationsEnabled: boolean;
    autoLockTimeout?: number; // Inactivity timeout in minutes (0 = disabled)
    securityPin?: string; // 4-digit PIN for auto-lock (e.g. '1337')
    trustedNetworkEnabled?: boolean;
    trustedSSID?: string;
    trustedIP?: string;
    customAccentColor?: string;
    autoLogoutTimeout?: number; // Session limit in minutes (0 = disabled)
}

export interface CVEAlert {
    id: string;
    title: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    publishedDate: string;
    sourceUrl?: string;
}

