
import React from 'react';
import { View } from '../types';
import { Shield, LayoutDashboard, ScanLine, Lock, Activity, Settings, HelpCircle, Box } from 'lucide-react';

interface SidebarProps {
    currentView: View;
    setView: (view: View) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
    const menuItems = [
        { id: 'DASHBOARD', icon: LayoutDashboard, label: 'Dashboard' },
        { id: 'SCANNER', icon: ScanLine, label: 'Script Scanner' },
        { id: 'SANDBOX', icon: Box, label: 'Secure Sandbox' },
        { id: 'VAULT', icon: Lock, label: 'Secure Vault' },
        { id: 'LOGS', icon: Activity, label: 'Activity Logs' },
    ];

    return (
        <aside className="w-64 bg-[#0F0B1D]/50 border-r border-white/5 flex flex-col shrink-0 z-30">
            <div className="p-6 mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 shadow-lg bg-black/40 flex items-center justify-center shrink-0">
                        <img 
                            src="https://i.postimg.cc/WbBbwkGT/cropped-circle-image.png" 
                            alt="Knoux Logo" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                        />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight text-white leading-none">KNOUX</h1>
                        <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Secure Studio™</span>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-1">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setView(item.id as View)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                            currentView === item.id 
                            ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20' 
                            : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                        }`}
                    >
                        <item.icon size={20} className={currentView === item.id ? 'text-purple-400' : 'text-slate-500 group-hover:text-slate-300'} />
                        <span className="font-medium text-sm">{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="p-4 border-t border-white/5 mt-auto">
                <button 
                    onClick={() => setView('SETTINGS')}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl transition-colors text-sm ${
                        currentView === 'SETTINGS' ? 'bg-purple-600/10 text-purple-400' : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                    <Settings size={18} />
                    <span>Settings</span>
                </button>
                <button 
                    onClick={() => setView('HELP')}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl transition-colors text-sm ${
                        currentView === 'HELP' ? 'bg-purple-600/10 text-purple-400' : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                    <HelpCircle size={18} />
                    <span>Documentation</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
