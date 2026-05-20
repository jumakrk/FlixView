'use client';

import { useState } from 'react';
import { useData } from '@/context/DataContext';
import { 
    Settings, Download, Upload, Bookmark, Heart, Database, 
    CheckCircle2, AlertCircle, Loader2, Trash2, AlertTriangle, 
    X, Info, BarChart3, ShieldAlert, Copy, Check, ExternalLink 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TABS = [
    { id: 'stats', label: 'Library & Stats', icon: BarChart3, color: 'text-violet-400', activeColor: 'bg-violet-600', glow: 'rgba(139, 92, 246, 0.25)' },
    { id: 'backup', label: 'Backup & Sync', icon: Database, color: 'text-blue-400', activeColor: 'bg-blue-600', glow: 'rgba(59, 130, 246, 0.25)' },
    { id: 'danger', label: 'Danger Zone', icon: ShieldAlert, color: 'text-red-400', activeColor: 'bg-red-600', glow: 'rgba(239, 68, 68, 0.25)' }
] as const;

type TabId = typeof TABS[number]['id'];

export default function SettingsPage() {
    const { watchlist, favorites, progress, clearData } = useData();

    const [activeTab, setActiveTab] = useState<TabId>('stats');
    const [exportStatus, setExportStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    
    const [clearModal, setClearModal] = useState<{ isOpen: boolean, type: 'favorites' | 'watchlist' | 'progress' | 'all' | null, title: string }>({ isOpen: false, type: null, title: '' });
    const [isClearing, setIsClearing] = useState(false);
    const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
    const [copiedPath, setCopiedPath] = useState(false);

    const handleClearRequest = (type: 'favorites' | 'watchlist' | 'progress' | 'all', title: string) => {
        setClearModal({ isOpen: true, type, title });
    };

    const confirmClear = async () => {
        if (!clearModal.type) return;
        setIsClearing(true);
        try {
            await clearData(clearModal.type);
        } catch (error) {
            console.error('Failed to clear data', error);
        } finally {
            setIsClearing(false);
            setClearModal({ isOpen: false, type: null, title: '' });
        }
    };

    const handleExport = async () => {
        if (typeof window === 'undefined' || !window.electron) {
            setExportStatus({ type: 'error', message: 'Export is only available in the desktop app.' });
            return;
        }

        setIsExporting(true);
        try {
            const result = await window.electron.exportData();
            if (result.success) {
                setExportStatus({ type: 'success', message: `Data successfully exported to: ${result.path}` });
            } else if (!result.canceled) {
                setExportStatus({ type: 'error', message: result.error || 'Export failed.' });
            }
        } catch (error: any) {
            setExportStatus({ type: 'error', message: error.message || 'An error occurred during export.' });
        } finally {
            setIsExporting(false);
            setTimeout(() => setExportStatus(null), 5000);
        }
    };

    const handleImport = async () => {
        if (typeof window === 'undefined' || !window.electron) {
            setImportStatus({ type: 'error', message: 'Import is only available in the desktop app.' });
            return;
        }

        setIsImporting(true);
        try {
            const result = await window.electron.importData();
            if (result.success) {
                setImportStatus({ type: 'success', message: 'Data successfully imported. Reloading to apply...' });
                setTimeout(() => window.location.reload(), 2000);
            } else if (!result.canceled) {
                setImportStatus({ type: 'error', message: result.error || 'Import failed. Make sure you selected a valid export folder.' });
            }
        } catch (error: any) {
            setImportStatus({ type: 'error', message: error.message || 'An error occurred during import.' });
        } finally {
            setIsImporting(false);
            setTimeout(() => setImportStatus(null), 5000);
        }
    };

    const handleCopyPath = () => {
        navigator.clipboard.writeText("Documents/FlixView User Data");
        setCopiedPath(true);
        setTimeout(() => setCopiedPath(false), 2000);
    };

    const stats = [
        { label: 'Watchlist Items', value: watchlist.length, icon: Bookmark, color: 'text-violet-400', bg: 'from-violet-500/20 to-indigo-500/5', barColor: 'bg-violet-500', glow: 'rgba(139, 92, 246, 0.4)' },
        { label: 'Favorites', value: favorites.length, icon: Heart, color: 'text-rose-400', bg: 'from-rose-500/20 to-red-500/5', barColor: 'bg-rose-500', glow: 'rgba(244, 63, 94, 0.4)' },
        { label: 'Watch Progress Logs', value: progress.length, icon: Database, color: 'text-blue-400', bg: 'from-blue-500/20 to-cyan-500/5', barColor: 'bg-blue-500', glow: 'rgba(59, 130, 246, 0.4)' },
    ];

    const activeTabObj = TABS.find(t => t.id === activeTab);

    return (
        <div className="container max-w-6xl mx-auto px-6 pb-24 font-sans antialiased text-white">
            {/* Header banner */}
            <div className="relative w-full flex flex-col md:flex-row items-center justify-between gap-6 mb-12 py-10 border-b border-white/5 overflow-hidden">
                <div 
                    className="absolute -left-10 top-0 w-72 h-72 rounded-full opacity-[0.12] blur-[80px] pointer-events-none transition-all duration-500"
                    style={{
                        background: activeTabObj?.glow || 'rgba(139, 92, 246, 0.25)'
                    }}
                />
                
                <div className="flex items-center gap-5 z-10">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-xl backdrop-blur-xl">
                        <Settings size={28} className="text-violet-400 animate-spin-slow" />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase">Settings & Data</h1>
                        <p className="text-gray-400 text-sm mt-1 font-medium">Configure preferences and manage your library catalogs.</p>
                    </div>
                </div>
            </div>

            {/* Sidebar Dual-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                
                {/* Navigation Sidebar */}
                <div className="lg:col-span-3 flex flex-col gap-2.5 bg-[#12141a]/60 border border-white/5 rounded-2xl p-4.5 backdrop-blur-md">
                    <span className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-gray-500 px-3.5 mb-1 select-none">Categories</span>
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-bold tracking-wide transition-all relative group ${isActive ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                            >
                                {isActive && (
                                    <motion.div 
                                        layoutId="activeTabIndicator"
                                        className={`absolute inset-0 rounded-xl bg-gradient-to-r ${tab.id === 'stats' ? 'from-violet-600/20 to-indigo-600/5 border border-violet-500/20' : tab.id === 'backup' ? 'from-blue-600/20 to-cyan-600/5 border border-blue-500/20' : 'from-red-600/20 to-rose-600/5 border border-red-500/20'}`}
                                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                    />
                                )}
                                <Icon size={18} className={`relative z-10 transition-transform group-hover:scale-105 duration-300 ${isActive ? tab.color : 'text-gray-500 group-hover:text-gray-300'}`} />
                                <span className="relative z-10">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Main Content Workspace */}
                <div className="lg:col-span-9">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.35, ease: 'easeOut' }}
                            className="bg-[#12141a]/40 border border-white/5 rounded-3xl p-8 backdrop-blur-md shadow-2xl relative overflow-hidden min-h-[460px] flex flex-col"
                        >
                            
                            {/* TAB 1: LIBRARY STATS */}
                            {activeTab === 'stats' && (
                                <div className="space-y-8 flex-grow flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-2xl font-black uppercase text-white mb-2 tracking-wide flex items-center gap-2.5">
                                            <BarChart3 className="text-violet-400" size={24} />
                                            Library Storage & Stats
                                        </h3>
                                        <p className="text-gray-400 text-sm leading-relaxed mb-6 font-medium">
                                            FlixView keeps your watch data entirely local and private. Your information is securely stored inside your system documents directory. No cloud server accounts required.
                                        </p>
                                        
                                        {/* Dynamic Stats Cards */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
                                            {stats.map((stat, idx) => {
                                                const Icon = stat.icon;
                                                return (
                                                    <div 
                                                        key={stat.label} 
                                                        className="bg-gradient-to-br from-white/4 to-white/1 border border-white/5 rounded-2xl p-6 relative overflow-hidden transition-all duration-300 hover:border-white/10 group"
                                                        style={{
                                                            boxShadow: `0 15px 30px -10px ${stat.glow}`
                                                        }}
                                                    >
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.bg} ${stat.color} shadow-lg`}>
                                                                <Icon size={22} className="group-hover:scale-110 transition-transform duration-300" />
                                                            </div>
                                                            <span className="text-3xl font-black text-white tracking-tight">{stat.value}</span>
                                                        </div>
                                                        <span className="text-xs text-gray-400 font-extrabold uppercase tracking-wider block">{stat.label}</span>
                                                        
                                                        {/* Interactive status meter bar */}
                                                        <div className="w-full h-1 bg-white/5 rounded-full mt-5 overflow-hidden">
                                                            <motion.div 
                                                                initial={{ width: 0 }}
                                                                animate={{ width: stat.value > 0 ? `${Math.min(100, (stat.value / 50) * 100)}%` : '4%' }}
                                                                className={`h-full ${stat.barColor} rounded-full`}
                                                                transition={{ delay: 0.1 * idx, duration: 1, ease: 'easeOut' }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Local storage location card */}
                                    <div className="bg-white/3 border border-white/5 rounded-2xl p-6 mt-8 flex flex-col md:flex-row items-center justify-between gap-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-violet-600/10 border border-violet-500/10 flex items-center justify-center text-violet-400 shrink-0 shadow-lg">
                                                <ExternalLink size={20} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black uppercase text-white tracking-wider">Local Data Directory</h4>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <code className="text-xs bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 text-violet-300 font-mono tracking-wide break-all">
                                                        Documents/FlixView User Data
                                                    </code>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleCopyPath}
                                            className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-xs font-black uppercase tracking-wider border border-white/10 hover:border-white/20 transition-all flex items-center gap-2 whitespace-nowrap"
                                        >
                                            {copiedPath ? (
                                                <>
                                                    <Check size={14} className="text-green-400 animate-bounce" />
                                                    <span className="text-green-400">Copied!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy size={14} className="text-violet-400" />
                                                    <span>Copy Path</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: BACKUP & SYNC */}
                            {activeTab === 'backup' && (
                                <div className="space-y-8 flex-grow flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between gap-4 mb-2">
                                            <h3 className="text-2xl font-black uppercase text-white tracking-wide flex items-center gap-2.5">
                                                <Database className="text-blue-400" size={24} />
                                                Backup & Restore Library
                                            </h3>
                                        </div>
                                        <p className="text-gray-400 text-sm leading-relaxed mb-8 font-medium">
                                            Export your saved titles and progress log files to back them up securely, or import them onto a different machine to restore your local database.
                                        </p>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Export Data Card */}
                                            <div 
                                                className="bg-gradient-to-br from-white/4 to-white/1 border border-white/5 rounded-2xl p-6 flex flex-col justify-between relative group hover:border-white/10 transition-colors"
                                                style={{ boxShadow: '0 15px 35px -10px rgba(59, 130, 246, 0.15)' }}
                                            >
                                                <div>
                                                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-5 shadow-lg border border-blue-500/10">
                                                        <Download size={22} className="text-blue-400 group-hover:-translate-y-0.5 transition-transform duration-300" />
                                                    </div>
                                                    <h4 className="text-base font-black uppercase text-white mb-2 tracking-wide">Export Library</h4>
                                                    <p className="text-xs text-gray-400 leading-relaxed mb-6 font-medium">
                                                        Generates backups of your Watchlist, Favorites, and watch log stats in JSON format within a target directory.
                                                    </p>
                                                </div>
                                                
                                                <button
                                                    onClick={handleExport}
                                                    disabled={isExporting}
                                                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-95 text-xs uppercase tracking-wider"
                                                >
                                                    {isExporting ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                                                    <span>Export Data</span>
                                                </button>

                                                <AnimatePresence>
                                                    {exportStatus && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            className="w-full mt-4"
                                                        >
                                                            <div className={`text-xs p-3 rounded-lg flex items-start gap-2 text-left ${exportStatus.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                                                                {exportStatus.type === 'success' ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 mt-0.5" />}
                                                                <span>{exportStatus.message}</span>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            {/* Import Data Card */}
                                            <div 
                                                className="bg-gradient-to-br from-white/4 to-white/1 border border-white/5 rounded-2xl p-6 flex flex-col justify-between relative group hover:border-white/10 transition-colors"
                                                style={{ boxShadow: '0 15px 35px -10px rgba(74, 222, 128, 0.12)' }}
                                            >
                                                <div>
                                                    <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-5 shadow-lg border border-green-500/10">
                                                        <Upload size={22} className="text-green-400 group-hover:translate-y-0.5 transition-transform duration-300" />
                                                    </div>
                                                    <h4 className="text-base font-black uppercase text-white mb-2 tracking-wide">Import Library</h4>
                                                    <p className="text-xs text-gray-400 leading-relaxed mb-6 font-medium">
                                                        Loads a previously generated <code className="text-green-400 font-bold bg-black/20 px-1 py-0.5 rounded">FlixView User Data Export</code> folder to restore your data.
                                                    </p>
                                                </div>

                                                <button
                                                    onClick={handleImport}
                                                    disabled={isImporting}
                                                    className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-extrabold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-600/20 active:scale-95 text-xs uppercase tracking-wider"
                                                >
                                                    {isImporting ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                                                    <span>Import Data</span>
                                                </button>

                                                <AnimatePresence>
                                                    {importStatus && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            className="w-full mt-4"
                                                        >
                                                            <div className={`text-xs p-3 rounded-lg flex items-start gap-2 text-left ${importStatus.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                                                                {importStatus.type === 'success' ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 mt-0.5" />}
                                                                <span>{importStatus.message}</span>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expandable How it works info accordion */}
                                    <div className="border border-white/5 rounded-2xl overflow-hidden mt-8 transition-colors hover:border-white/10">
                                        <button
                                            onClick={() => setIsHowItWorksOpen(!isHowItWorksOpen)}
                                            className="w-full flex items-center justify-between px-6 py-4 bg-white/3 font-bold text-sm text-gray-300 hover:text-white transition-colors"
                                        >
                                            <span className="flex items-center gap-2">
                                                <Info size={16} className="text-blue-400" />
                                                <span>How Backup & Restore works</span>
                                            </span>
                                            <span className="text-gray-500">{isHowItWorksOpen ? 'Collapse' : 'Expand'}</span>
                                        </button>
                                        
                                        <AnimatePresence>
                                            {isHowItWorksOpen && (
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: 'auto' }}
                                                    exit={{ height: 0 }}
                                                    className="overflow-hidden bg-[#0d0f14]/50 border-t border-white/5"
                                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                >
                                                    <div className="p-6 space-y-4 text-xs text-gray-400 leading-relaxed font-medium">
                                                        <div>
                                                            <h5 className="font-extrabold uppercase text-gray-300 mb-1 flex items-center gap-1.5">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> 
                                                                Cross-Platform Compatibility
                                                            </h5>
                                                            <p>
                                                                Exported database directories are structured as clean, raw JSON files. You can copy the exported folder from Windows to restore it on a macOS or Linux machine running FlixView, and vice versa.
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <h5 className="font-extrabold uppercase text-gray-300 mb-1 flex items-center gap-1.5">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                                Dynamic Re-loading
                                                            </h5>
                                                            <p>
                                                                Upon importing, the app decodes the back-up files, overlays them over your local files, and triggers a full application reload to guarantee UI lists synchronize instantly.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: DANGER ZONE */}
                            {activeTab === 'danger' && (
                                <div className="space-y-8 flex-grow flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-2xl font-black uppercase text-red-500 tracking-wide flex items-center gap-2.5">
                                            <ShieldAlert className="text-red-500 animate-pulse" size={24} />
                                            Danger Zone
                                        </h3>
                                        <p className="text-gray-400 text-sm leading-relaxed mb-8 font-medium">
                                            Reset your databases and clear stored logs. Stored information is deleted permanently from your local device storage. **These actions are irreversible.**
                                        </p>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {/* Clear Favourites */}
                                            <button 
                                                onClick={() => handleClearRequest('favorites', 'Favourites')}
                                                className="bg-[#1a1315]/30 hover:bg-[#2e191b]/50 border border-red-500/10 hover:border-red-500/25 transition-all duration-300 rounded-2xl p-5 flex items-center justify-between text-left group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-11 h-11 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 shrink-0">
                                                        <Heart size={20} className="group-hover:scale-110 transition-transform" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black uppercase text-white tracking-wide">Clear Favourites</h4>
                                                        <span className="text-[10px] text-gray-500 font-semibold block mt-0.5">Deletes all favorited movies/shows</span>
                                                    </div>
                                                </div>
                                                <Trash2 size={16} className="text-gray-600 group-hover:text-red-400 transition-colors" />
                                            </button>

                                            {/* Clear Watchlist */}
                                            <button 
                                                onClick={() => handleClearRequest('watchlist', 'Watchlist')}
                                                className="bg-[#1a1315]/30 hover:bg-[#2e191b]/50 border border-red-500/10 hover:border-red-500/25 transition-all duration-300 rounded-2xl p-5 flex items-center justify-between text-left group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-11 h-11 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 shrink-0">
                                                        <Bookmark size={20} className="group-hover:scale-110 transition-transform" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black uppercase text-white tracking-wide">Clear Watchlist</h4>
                                                        <span className="text-[10px] text-gray-500 font-semibold block mt-0.5">Deletes your queued watchlist</span>
                                                    </div>
                                                </div>
                                                <Trash2 size={16} className="text-gray-600 group-hover:text-red-400 transition-colors" />
                                            </button>

                                            {/* Clear History */}
                                            <button 
                                                onClick={() => handleClearRequest('progress', 'Watch History')}
                                                className="bg-[#1a1315]/30 hover:bg-[#2e191b]/50 border border-red-500/10 hover:border-red-500/25 transition-all duration-300 rounded-2xl p-5 flex items-center justify-between text-left group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-11 h-11 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 shrink-0">
                                                        <Database size={20} className="group-hover:scale-110 transition-transform" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black uppercase text-white tracking-wide">Clear History</h4>
                                                        <span className="text-[10px] text-gray-500 font-semibold block mt-0.5">Resets continue watching logs</span>
                                                    </div>
                                                </div>
                                                <Trash2 size={16} className="text-gray-600 group-hover:text-red-400 transition-colors" />
                                            </button>

                                            {/* Clear All */}
                                            <button 
                                                onClick={() => handleClearRequest('all', 'All Data')}
                                                className="bg-red-950/20 hover:bg-red-900/30 border border-red-500/20 hover:border-red-500/40 transition-all duration-300 rounded-2xl p-5 flex items-center justify-between text-left group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-11 h-11 rounded-xl bg-red-600/15 flex items-center justify-center text-red-400 shrink-0 shadow-lg">
                                                        <AlertTriangle size={20} className="animate-pulse" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black uppercase text-red-400 tracking-wide">Reset FlixView</h4>
                                                        <span className="text-[10px] text-red-400/50 font-extrabold block mt-0.5">Wipe all local datasets</span>
                                                    </div>
                                                </div>
                                                <Trash2 size={16} className="text-red-400" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Warnings Box */}
                                    <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-5 mt-8 flex items-start gap-4">
                                        <AlertTriangle size={22} className="text-red-500 shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="text-xs font-black uppercase text-red-400 tracking-wider">Warning</h4>
                                            <p className="text-xs text-gray-400 mt-1 leading-relaxed font-medium">
                                                Clearing datasets resets player trackers, favorited playlists, and watchlist queues instantly. Ensure backups are exported beforehand if you want to restore them later.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* HIGH-BLUR CONFIRMATION MODAL */}
            <AnimatePresence>
                {clearModal.isOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            className="bg-[#12141a]/95 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
                            style={{
                                boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.25)'
                            }}
                        >
                            <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-red-600 via-rose-500 to-red-600" />
                            
                            <button 
                                onClick={() => !isClearing && setClearModal({ isOpen: false, type: null, title: '' })}
                                className="absolute top-5 right-5 text-gray-500 hover:text-white hover:bg-white/5 p-1.5 rounded-lg transition-colors"
                            >
                                <X size={18} />
                            </button>
                            
                            <div className="flex flex-col items-center text-center pt-4">
                                <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/15 flex items-center justify-center mb-5 shadow-inner">
                                    <AlertTriangle size={32} className="text-red-500 animate-bounce" />
                                </div>
                                <h3 className="text-2xl font-black uppercase text-white mb-2 tracking-wide">Clear {clearModal.title}?</h3>
                                <p className="text-sm text-gray-400 leading-relaxed mb-8 font-medium">
                                    Are you absolutely sure? This will delete all saved entries inside your <strong className="text-white">{clearModal.title}</strong> registry. Stored documents will be deleted from your computer. This cannot be undone.
                                </p>
                                
                                <div className="flex w-full gap-3.5">
                                    <button 
                                        onClick={() => setClearModal({ isOpen: false, type: null, title: '' })}
                                        disabled={isClearing}
                                        className="flex-1 px-5 py-3.5 rounded-xl font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors disabled:opacity-50 text-xs uppercase tracking-wider"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={confirmClear}
                                        disabled={isClearing}
                                        className="flex-1 px-5 py-3.5 rounded-xl font-black bg-red-600 hover:bg-red-700 text-white flex justify-center items-center gap-2 transition-colors disabled:opacity-50 text-xs uppercase tracking-wider shadow-lg shadow-red-600/20"
                                    >
                                        {isClearing ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                                        {isClearing ? 'Deleting...' : 'Delete Stored Data'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
