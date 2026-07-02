
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
}
