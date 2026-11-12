'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, animate, motion } from 'framer-motion';
import {
    AlertCircle, ArrowUpCircle, Bookmark, Check, CheckCircle2, ChevronDown, Copy, Database,
    Download, FolderOpen, Heart, History, Loader2, RefreshCw, RotateCcw, Settings,
    ShieldAlert, Sparkles, Trash2, Upload,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { useUpdates, platformLabel } from '@/context/UpdateContext';
import PageHeader from '@/components/ui/PageHeader';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { cn } from '@/lib/utils';
import type { MediaType } from '@/lib/types';

const EASE = [0.16, 1, 0.3, 1] as const;

const TABS = [
    { id: 'library', label: 'Library', hint: 'Your saved titles and storage', icon: Bookmark },
    { id: 'backup', label: 'Backup & Restore', hint: 'Export or import your data', icon: Database },
    { id: 'updates', label: 'App Updates', hint: 'Version and update checks', icon: ArrowUpCircle },
    { id: 'danger', label: 'Danger Zone', hint: 'Clear or reset your data', icon: ShieldAlert },
] as const;

type TabId = typeof TABS[number]['id'];
type ClearType = 'favorites' | 'watchlist' | 'progress' | 'all';

interface ClearTarget {
    type: ClearType;
    title: string;
    message: ReactNode;
    successTitle: string;
    successMessage: string;
}

/** Counts per media type, for the "3 movies · 2 series" breakdowns. */
function breakdown(types: MediaType[]) {
    return {
        movie: types.filter(t => t === 'movie').length,
        tv: types.filter(t => t === 'tv').length,
        anime: types.filter(t => t === 'anime').length,
    };
}

function plural(count: number, one: string, many = `${one}s`) {
    return `${count} ${count === 1 ? one : many}`;
}

export default function SettingsPage() {
    const { watchlist, favorites, progress, clearData } = useData();
    const [activeTab, setActiveTab] = useState<TabId>('library');
    const [target, setTarget] = useState<ClearTarget | null>(null);

    const counts = { watchlist: watchlist.length, favorites: favorites.length, progress: progress.length };
    const total = counts.watchlist + counts.favorites + counts.progress;

    const requestClear = (type: ClearType) => {
        const strong = (text: string) => <strong className="font-semibold text-white">{text}</strong>;
        const targets: Record<ClearType, ClearTarget> = {
            watchlist: {
                type,
                title: 'Clear your watchlist?',
                message: <>This removes {strong(plural(counts.watchlist, 'title'))} you saved to watch later.</>,
                successTitle: 'Watchlist cleared',
                successMessage: 'Your watchlist is now empty.',
            },
            favorites: {
                type,
                title: 'Clear your favourites?',
                message: <>This removes {strong(plural(counts.favorites, 'title'))} from your favourites.</>,
                successTitle: 'Favourites cleared',
                successMessage: 'Your favourites list is now empty.',
            },
            progress: {
                type,
                title: 'Clear watch history?',
                message: <>This deletes {strong(plural(counts.progress, 'progress record'))}. Continue Watching and resume points will be reset.</>,
                successTitle: 'History cleared',
                successMessage: 'Your watch history and resume points were removed.',
            },
            all: {
                type,
                title: 'Reset FlixView?',
                message: <>This deletes {strong('everything')}: your watchlist, favourites and watch history ({plural(total, 'item')}).</>,
                successTitle: 'FlixView has been reset',
                successMessage: 'All of your local data was removed. You are starting fresh.',
            },
        };
        setTarget(targets[type]);
    };

    return (
        <div className="min-h-screen pb-24">
            <PageHeader
                eyebrow="Preferences"
                title="Settings & Data"
                subtitle="Your library, backups and updates. Everything stays on this device."
                icon={<Settings size={28} />}
            />

            <div className="grid grid-cols-1 items-start gap-8 px-[4%] lg:grid-cols-[280px_minmax(0,1fr)]">
                {/* Section nav */}
                <nav className="glass-panel flex flex-col gap-1 rounded-[26px] p-3 lg:sticky lg:top-8" aria-label="Settings sections">
                    {TABS.map((tab, index) => {
                        const active = activeTab === tab.id;
                        const danger = tab.id === 'danger';
                        return (
                            <motion.button
                                key={tab.id}
                                type="button"
                                data-ripple
                                onClick={() => setActiveTab(tab.id)}
                                aria-current={active ? 'page' : undefined}
                                initial={{ opacity: 0, x: -14 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, ease: EASE, delay: 0.1 + index * 0.05 }}
                                className={cn(
                                    'group relative flex items-center gap-3.5 overflow-hidden rounded-[18px] px-3 py-3 text-left transition-colors duration-300',
                                    active ? 'text-white' : 'text-white/55 hover:bg-white/[0.04] hover:text-white'
                                )}
                            >
                                {active && (
                                    <motion.span
                                        layoutId="settings-tab"
                                        className={cn(
                                            'absolute inset-0 rounded-[18px] border',
                                            danger
                                                ? 'border-red-400/20 bg-gradient-to-r from-red-500/[0.16] to-red-500/[0.03]'
                                                : 'border-[#2f8a7f]/40 bg-gradient-to-r from-[#004741]/90 to-[#004741]/30 shadow-[0_10px_30px_-12px_rgba(0,71,65,0.9),inset_0_1px_0_rgba(240,237,228,0.1)]'
                                        )}
                                        transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                                    />
                                )}
                                <span
                                    className={cn(
                                        'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] border transition-colors duration-300',
                                        active
                                            ? danger ? 'border-red-400/25 bg-red-500/15 text-red-300' : 'border-[#f0ede4]/15 bg-[#f0ede4]/10 text-[#f0ede4]'
                                            : 'border-white/[0.06] bg-white/[0.03] text-white/50 group-hover:text-white/80'
                                    )}
                                >
                                    <tab.icon size={18} />
                                </span>
                                <span className="relative min-w-0">
                                    <span className="block text-[14.5px] font-semibold">{tab.label}</span>
                                    <span className="block truncate text-[12px] text-white/40">{tab.hint}</span>
                                </span>
                            </motion.button>
                        );
                    })}
                </nav>

                {/* Section content */}
                <div className="min-w-0">
                    <AnimatePresence mode="wait">
                        <motion.section
                            key={activeTab}
                            initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, y: -10, filter: 'blur(6px)' }}
                            transition={{ duration: 0.45, ease: EASE }}
                        >
                            {activeTab === 'library' && <LibrarySection />}
                            {activeTab === 'backup' && <BackupSection />}
                            {activeTab === 'updates' && <UpdatesSection />}
                            {activeTab === 'danger' && <DangerSection counts={counts} total={total} onClear={requestClear} />}
                        </motion.section>
                    </AnimatePresence>
                </div>
            </div>

            <ConfirmDialog
                open={target !== null}
                title={target?.title ?? ''}
                message={target?.message}
                confirmLabel={target?.type === 'all' ? 'Reset' : 'Delete'}
                successTitle={target?.successTitle}
                successMessage={target?.successMessage}
                onConfirm={async () => {
                    if (target) await clearData(target.type);
                }}
                onClose={() => setTarget(null)}
            />
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Building blocks                                                     */
/* ------------------------------------------------------------------ */

function SectionTitle({ icon: Icon, title, text, tone = 'default' }: { icon: LucideIcon; title: string; text: string; tone?: 'default' | 'danger' }) {
    return (
        <div className="mb-7">
            <h2 className="flex items-center gap-3 text-[26px] font-bold tracking-tight text-white">
                <Icon size={22} className={tone === 'danger' ? 'text-red-300' : 'text-[#8cc2b8]'} />
                {title}
            </h2>
            <p className="mt-2 max-w-2xl text-[14.5px] leading-relaxed text-white/55">{text}</p>
        </div>
    );
}

function Card({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay }}
            className={cn(
                'relative overflow-hidden rounded-[24px] border border-white/[0.07] bg-gradient-to-b from-white/[0.045] to-white/[0.015] p-6 shadow-[inset_0_1px_0_rgba(240,237,228,0.05)]',
                className
            )}
        >
            {children}
        </motion.div>
    );
}

/** Number that counts up from zero when it appears. */
function CountUp({ value }: { value: number }) {
    const ref = useRef<HTMLSpanElement>(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const controls = animate(0, value, {
            duration: 1.1,
            ease: EASE,
            onUpdate: latest => { el.textContent = String(Math.round(latest)); },
        });
        return () => controls.stop();
    }, [value]);
    return <span ref={ref}>0</span>;
}

function PrimaryButton({ children, onClick, disabled, className }: { children: ReactNode; onClick: () => void; disabled?: boolean; className?: string }) {
    return (
        <button
            type="button"
            data-ripple
            onClick={onClick}
            disabled={disabled}
            className={cn(
                'relative flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[#f0ede4] px-6 py-3.5 text-sm font-bold text-[#00332e] shadow-[0_12px_30px_-12px_rgba(240,237,228,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-12px_rgba(240,237,228,0.6)] active:translate-y-0 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
                className
            )}
        >
            {children}
        </button>
    );
}

function StatusLine({ status }: { status: { type: 'success' | 'error'; message: string } | null }) {
    return (
        <AnimatePresence>
            {status && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.35, ease: EASE }}
                    className="overflow-hidden"
                >
                    <div
                        className={cn(
                            'mt-4 flex items-start gap-2 rounded-xl border px-3.5 py-3 text-[13px] leading-snug',
                            status.type === 'success'
                                ? 'border-[#2f8a7f]/30 bg-[#004741]/40 text-[#cfe6e1]'
                                : 'border-red-400/20 bg-red-500/10 text-red-200'
                        )}
                    >
                        {status.type === 'success' ? <CheckCircle2 size={16} className="mt-px shrink-0" /> : <AlertCircle size={16} className="mt-px shrink-0" />}
                        <span className="break-all">{status.message}</span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/* ------------------------------------------------------------------ */
/* Library                                                             */
/* ------------------------------------------------------------------ */

function LibrarySection() {
    const { watchlist, favorites, progress } = useData();
    const [dataPath, setDataPath] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.electron) return;
        window.electron.getDataPath().then(setDataPath);
    }, []);

    const copyPath = () => {
        navigator.clipboard.writeText(dataPath || 'FlixView User Data');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const openFolder = () => {
        window.electron?.openDataFolder?.();
    };

    const tiles = [
        { label: 'Watchlist', icon: Bookmark, value: watchlist.length, split: breakdown(watchlist.map(i => i.mediaType)), accent: '#f0ede4' },
        { label: 'Favourites', icon: Heart, value: favorites.length, split: breakdown(favorites.map(i => i.mediaType)), accent: '#e9a8a0' },
        { label: 'Watch history', icon: History, value: progress.length, split: breakdown(progress.map(p => p.media_type)), accent: '#8cc2b8' },
    ];
    const total = tiles.reduce((sum, tile) => sum + tile.value, 0);

    return (
        <>
            <SectionTitle
                icon={Bookmark}
                title="Your library"
                text="FlixView keeps your data private and local. No account, no cloud: your lists and progress live in the app's data folder on this computer."
            />

            {/* Overview: total plus a proportional bar. */}
            <Card className="mb-5 p-7">
                <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#2f8a7f]/20 blur-3xl" />
                <div className="relative flex flex-wrap items-end justify-between gap-6">
                    <div>
                        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">Items on this device</span>
                        <div className="mt-1 text-6xl font-extrabold tracking-tight text-gradient">
                            <CountUp value={total} />
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-4 text-[13px] text-white/60">
                        {tiles.map(tile => (
                            <span key={tile.label} className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full" style={{ background: tile.accent }} />
                                {tile.label}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="relative mt-6 flex h-2.5 w-full gap-1 overflow-hidden rounded-full bg-white/[0.05]">
                    {total > 0 && tiles.map((tile, index) => tile.value > 0 && (
                        <motion.span
                            key={tile.label}
                            className="h-full rounded-full"
                            style={{ background: tile.accent }}
                            initial={{ width: 0 }}
                            animate={{ width: `${(tile.value / total) * 100}%` }}
                            transition={{ duration: 1.1, ease: EASE, delay: 0.2 + index * 0.1 }}
                        />
                    ))}
                </div>
            </Card>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                {tiles.map((tile, index) => (
                    <Card key={tile.label} delay={0.08 + index * 0.06} className="group transition-colors duration-300 hover:border-white/[0.14]">
                        <div className="flex items-start justify-between">
                            <span
                                className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-white/[0.08] bg-white/[0.04] transition-transform duration-500 group-hover:-translate-y-0.5"
                                style={{ color: tile.accent }}
                            >
                                <tile.icon size={20} />
                            </span>
                            <span className="text-4xl font-extrabold tracking-tight text-white">
                                <CountUp value={tile.value} />
                            </span>
                        </div>
                        <div className="mt-5 text-[15px] font-semibold text-white">{tile.label}</div>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                            {([['movie', 'Movie', 'Movies'], ['tv', 'Series', 'Series'], ['anime', 'Anime', 'Anime']] as const).map(([key, one, many]) => (
                                <span key={key} className="rounded-full border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 text-[11.5px] font-medium text-white/55">
                                    {tile.split[key]} {tile.split[key] === 1 ? one : many}
                                </span>
                            ))}
                        </div>
                    </Card>
                ))}
            </div>

            <Card delay={0.25} className="mt-5 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-white/[0.08] bg-[#004741]/50 text-[#8cc2b8]">
                        <FolderOpen size={20} />
                    </span>
                    <div className="min-w-0">
                        <div className="text-[15px] font-semibold text-white">Data folder</div>
                        <code className="mt-1 block truncate font-mono text-[12.5px] text-white/50">{dataPath || 'FlixView User Data'}</code>
                    </div>
                </div>
                <div className="flex shrink-0 gap-2">
                    {dataPath && (
                        <button
                            type="button"
                            data-ripple
                            onClick={openFolder}
                            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-[13px] font-semibold text-white/80 transition-colors hover:bg-white/[0.09] hover:text-white"
                        >
                            <FolderOpen size={15} /> Open
                        </button>
                    )}
                    <button
                        type="button"
                        data-ripple
                        onClick={copyPath}
                        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-[13px] font-semibold text-white/80 transition-colors hover:bg-white/[0.09] hover:text-white"
                    >
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.span
                                key={copied ? 'done' : 'copy'}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.2 }}
                                className={cn('flex items-center gap-2', copied && 'text-[#8cc2b8]')}
                            >
                                {copied ? <Check size={15} /> : <Copy size={15} />}
                                {copied ? 'Copied' : 'Copy path'}
                            </motion.span>
                        </AnimatePresence>
                    </button>
                </div>
            </Card>
        </>
    );
}

/* ------------------------------------------------------------------ */
/* Backup                                                              */
/* ------------------------------------------------------------------ */

function BackupSection() {
    const [exportStatus, setExportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [howOpen, setHowOpen] = useState(false);

    const handleExport = async () => {
        if (typeof window === 'undefined' || !window.electron) {
            setExportStatus({ type: 'error', message: 'Export is only available in the desktop app.' });
            return;
        }
        setIsExporting(true);
        try {
            const result = await window.electron.exportData();
            if (result.success) {
                setExportStatus({ type: 'success', message: `Exported to ${result.path}` });
            } else if (!result.canceled) {
                setExportStatus({ type: 'error', message: result.error || 'Export failed.' });
            }
        } catch (error) {
            setExportStatus({ type: 'error', message: error instanceof Error ? error.message : 'An error occurred during export.' });
        } finally {
            setIsExporting(false);
            setTimeout(() => setExportStatus(null), 6000);
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
                setImportStatus({ type: 'success', message: 'Imported. Reloading to apply...' });
                setTimeout(() => window.location.reload(), 2000);
            } else if (!result.canceled) {
                setImportStatus({ type: 'error', message: result.error || 'Import failed. Make sure you selected a valid export folder.' });
            }
        } catch (error) {
            setImportStatus({ type: 'error', message: error instanceof Error ? error.message : 'An error occurred during import.' });
        } finally {
            setIsImporting(false);
            setTimeout(() => setImportStatus(null), 6000);
        }
    };

    const cards = [
        {
            icon: Download,
            title: 'Export library',
            text: 'Save your watchlist, favourites and watch history as JSON files in a folder you choose.',
            action: 'Export data',
            busy: isExporting,
            onClick: handleExport,
            status: exportStatus,
        },
        {
            icon: Upload,
            title: 'Import library',
            text: 'Restore from a "FlixView User Data Export" folder. The app reloads to apply it.',
            action: 'Import data',
            busy: isImporting,
            onClick: handleImport,
            status: importStatus,
        },
    ];

    return (
        <>
            <SectionTitle
                icon={Database}
                title="Backup & restore"
                text="Keep a copy of your library, or move it to another computer. Exports work across Windows, macOS and Linux."
            />

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {cards.map((card, index) => (
                    <Card key={card.title} delay={index * 0.07} className="group flex flex-col p-7">
                        <span className="flex h-12 w-12 items-center justify-center rounded-[15px] border border-[#2f8a7f]/30 bg-gradient-to-b from-[#0d6b61]/60 to-[#004741]/40 text-[#f0ede4] shadow-[0_10px_24px_-10px_rgba(0,71,65,0.9)] transition-transform duration-500 group-hover:-translate-y-0.5">
                            <card.icon size={21} />
                        </span>
                        <h3 className="mt-5 text-lg font-bold text-white">{card.title}</h3>
                        <p className="mt-1.5 flex-1 text-[13.5px] leading-relaxed text-white/55">{card.text}</p>
                        <PrimaryButton onClick={card.onClick} disabled={card.busy} className="mt-6 w-full">
                            {card.busy ? <Loader2 size={16} className="animate-spin" /> : <card.icon size={16} />}
                            {card.action}
                        </PrimaryButton>
                        <StatusLine status={card.status} />
                    </Card>
                ))}
            </div>

            <Card delay={0.15} className="mt-5 p-0">
                <button
                    type="button"
                    onClick={() => setHowOpen(open => !open)}
                    className="flex w-full items-center justify-between px-6 py-5 text-left"
                    aria-expanded={howOpen}
                >
                    <span className="flex items-center gap-3 text-[15px] font-semibold text-white">
                        <Sparkles size={17} className="text-[#8cc2b8]" />
                        How backup and restore work
                    </span>
                    <motion.span animate={{ rotate: howOpen ? 180 : 0 }} transition={{ duration: 0.35, ease: EASE }} className="text-white/45">
                        <ChevronDown size={18} />
                    </motion.span>
                </button>
                <AnimatePresence initial={false}>
                    {howOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.4, ease: EASE }}
                            className="overflow-hidden"
                        >
                            <div className="grid gap-5 border-t border-white/[0.06] px-6 py-5 text-[13.5px] leading-relaxed text-white/55 md:grid-cols-2">
                                <div>
                                    <h4 className="mb-1 font-semibold text-white/85">Works on any platform</h4>
                                    Exports are plain JSON files. Copy the folder from Windows and import it on macOS or Linux, or the other way round.
                                </div>
                                <div>
                                    <h4 className="mb-1 font-semibold text-white/85">Applied on reload</h4>
                                    An import merges the backup into your local data, then reloads the app so every list shows it straight away.
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>
        </>
    );
}

/* ------------------------------------------------------------------ */
/* Updates                                                             */
/* ------------------------------------------------------------------ */

function UpdatesSection() {
    const { status, newVersion, downloadPercent, error, appVersion, platform, checkForUpdates } = useUpdates();
    const isElectron = typeof window !== 'undefined' && Boolean(window.electron);
    const busy = status === 'checking' || status === 'downloading' || status === 'downloaded';

    const label =
        status === 'checking' ? 'Checking' :
        status === 'downloading' ? `Downloading ${downloadPercent}%` :
        status === 'downloaded' ? 'Installing' :
        status === 'available' ? 'Update available' :
        'Check for updates';

    return (
        <>
            <SectionTitle
                icon={ArrowUpCircle}
                title="App updates"
                text="FlixView checks for a new version every time it starts and every 30 minutes while it is open. You will be asked before anything installs."
            />

            <Card className="p-7">
                <div className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full bg-[#2f8a7f]/20 blur-3xl" />
                <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-5">
                        <span className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-gradient-to-b from-[#0d6b61] to-[#004741] text-[#f0ede4] shadow-[0_14px_36px_-12px_rgba(0,71,65,0.95),inset_0_1px_0_rgba(240,237,228,0.25)]">
                            <ArrowUpCircle size={28} />
                        </span>
                        <div>
                            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">Installed version</span>
                            <div className="flex items-baseline gap-3">
                                <span className="text-4xl font-extrabold tracking-tight text-white">v{appVersion || '0.0.0'}</span>
                                {platform && <span className="text-[13px] font-medium text-white/45">{platformLabel(platform)}</span>}
                            </div>
                        </div>
                    </div>
                    <PrimaryButton onClick={checkForUpdates} disabled={!isElectron || busy}>
                        <RefreshCw size={16} className={cn(busy && 'animate-spin')} />
                        {label}
                    </PrimaryButton>
                </div>

                <AnimatePresence mode="wait">
                    {status === 'uptodate' && (
                        <motion.p key="ok" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="relative mt-5 flex items-center gap-2 text-[13.5px] font-medium text-[#8cc2b8]">
                            <CheckCircle2 size={16} /> You are on the latest version.
                        </motion.p>
                    )}
                    {status === 'available' && newVersion && (
                        <motion.p key="new" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="relative mt-5 flex items-center gap-2 text-[13.5px] font-medium text-[#f0ede4]">
                            <Sparkles size={16} /> Version {newVersion} is ready to install.
                        </motion.p>
                    )}
                    {status === 'error' && (
                        <motion.p key="err" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="relative mt-5 flex items-start gap-2 text-[13.5px] font-medium text-red-300">
                            <AlertCircle size={16} className="mt-px shrink-0" /> Could not check for updates{error ? `: ${error}` : '.'}
                        </motion.p>
                    )}
                </AnimatePresence>
                {!isElectron && <p className="relative mt-5 text-[13px] text-white/45">Updates are only available in the desktop app.</p>}
            </Card>

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                <Card delay={0.08}>
                    <div className="text-[15px] font-semibold text-white">Automatic checks</div>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/55">On every launch, then every 30 minutes.</p>
                </Card>
                <Card delay={0.14}>
                    <div className="text-[15px] font-semibold text-white">Your data is kept</div>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/55">Updating never touches your watchlist, favourites or history.</p>
                </Card>
            </div>
        </>
    );
}

/* ------------------------------------------------------------------ */
/* Danger zone                                                         */
/* ------------------------------------------------------------------ */

function DangerSection({
    counts,
    total,
    onClear,
}: {
    counts: { watchlist: number; favorites: number; progress: number };
    total: number;
    onClear: (type: ClearType) => void;
}) {
    const rows = [
        { type: 'watchlist' as const, icon: Bookmark, title: 'Clear watchlist', text: 'Remove every title you saved to watch later.', count: counts.watchlist },
        { type: 'favorites' as const, icon: Heart, title: 'Clear favourites', text: 'Remove every title from your favourites.', count: counts.favorites },
        { type: 'progress' as const, icon: History, title: 'Clear watch history', text: 'Reset Continue Watching and every resume point.', count: counts.progress },
    ];

    return (
        <>
            <SectionTitle
                icon={ShieldAlert}
                tone="danger"
                title="Danger zone"
                text="These actions permanently delete data from this computer. Export a backup first if you might want it back."
            />

            <div className="overflow-hidden rounded-[24px] border border-white/[0.07] bg-gradient-to-b from-white/[0.04] to-white/[0.01]">
                {rows.map((row, index) => (
                    <motion.div
                        key={row.type}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, ease: EASE, delay: index * 0.06 }}
                        className={cn('flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between', index > 0 && 'border-t border-white/[0.06]')}
                    >
                        <div className="flex items-center gap-4">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-white/[0.08] bg-white/[0.04] text-white/70">
                                <row.icon size={19} />
                            </span>
                            <div>
                                <div className="flex items-center gap-2.5 text-[15px] font-semibold text-white">
                                    {row.title}
                                    <span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[11px] font-semibold text-white/55">
                                        {plural(row.count, 'item')}
                                    </span>
                                </div>
                                <p className="mt-0.5 text-[13px] text-white/50">{row.text}</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            data-ripple
                            disabled={row.count === 0}
                            onClick={() => onClear(row.type)}
                            className="flex shrink-0 items-center justify-center gap-2 rounded-xl border border-red-400/25 bg-red-500/[0.08] px-4 py-2.5 text-[13px] font-semibold text-red-200 transition-all duration-300 hover:border-red-400/50 hover:bg-red-500/[0.16] hover:text-white disabled:cursor-not-allowed disabled:border-white/[0.06] disabled:bg-transparent disabled:text-white/30"
                        >
                            <Trash2 size={15} />
                            {row.count === 0 ? 'Nothing to clear' : 'Clear'}
                        </button>
                    </motion.div>
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: EASE, delay: 0.2 }}
                className="relative mt-5 overflow-hidden rounded-[24px] border border-red-400/20 bg-gradient-to-br from-red-500/[0.12] via-red-500/[0.04] to-transparent p-7"
            >
                <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-red-500/15 blur-3xl" />
                <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] border border-red-400/25 bg-red-500/15 text-red-300">
                            <RotateCcw size={21} />
                        </span>
                        <div>
                            <h3 className="text-lg font-bold text-white">Reset FlixView</h3>
                            <p className="mt-1 max-w-md text-[13.5px] leading-relaxed text-white/55">
                                Delete your watchlist, favourites and watch history in one go, and start fresh.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        data-ripple
                        disabled={total === 0}
                        onClick={() => onClear('all')}
                        className="flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-red-400/40 bg-gradient-to-b from-[#e5484d] to-[#c4363b] px-6 py-3.5 text-sm font-bold text-white shadow-[0_12px_30px_-10px_rgba(229,72,77,0.6)] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:border-white/[0.06] disabled:bg-none disabled:bg-white/[0.04] disabled:text-white/30 disabled:shadow-none"
                    >
                        <Trash2 size={16} />
                        Reset everything
                    </button>
                </div>
            </motion.div>
        </>
    );
}
