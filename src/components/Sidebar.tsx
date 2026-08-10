'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, TrendingUp, Film, Tv, Bookmark, Heart, Search, Play, Settings, RefreshCw, ArrowUpCircle, CheckCircle2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import styles from './Sidebar.module.css';
import DonationModal from './DonationModal';
import DonateIcon from './DonateIcon';

const NAV_LINKS = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/trending', label: 'Trending', icon: TrendingUp },
    { href: '/movies', label: 'Movies', icon: Film },
    { href: '/series', label: 'Series', icon: Tv },
    { href: '/watchlist', label: 'My Watchlist', icon: Bookmark },
    { href: '/favorites', label: 'My Favorites', icon: Heart },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [isDonateOpen, setIsDonateOpen] = useState(false);
    const [version, setVersion] = useState<string>('');
    const [platform, setPlatform] = useState<string>('');
    const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'uptodate'>('idle');
    const [downloadPercent, setDownloadPercent] = useState(0);
    // When the user clicks the button, keep downloading automatically once the
    // check finds an update (check -> download -> install, all from one click).
    const autoDownloadOnAvailable = useRef(false);
    const upToDateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const platformLabel = platform === 'win32' ? 'Windows'
        : platform === 'darwin' ? 'macOS'
        : platform === 'linux' ? 'Linux'
        : platform;

    useEffect(() => {
        if (typeof window !== 'undefined' && window.electron) {
            // Get version + detect the user's OS (electron-updater picks the
            // correct artifact per platform; we surface it for the UI).
            window.electron.getAppVersion().then(v => setVersion(v));
            window.electron.getPlatform().then(p => setPlatform(p));

            // Listen for updates
            window.electron.onUpdateAvailable(() => {
                setUpdateStatus('available');
                // If this availability came from the user clicking the button,
                // continue automatically: download now.
                if (autoDownloadOnAvailable.current) {
                    autoDownloadOnAvailable.current = false;
                    window.electron.downloadUpdate();
                }
            });
            window.electron.onUpdateNotAvailable(() => {
                setUpdateStatus('uptodate');
                if (upToDateTimer.current) clearTimeout(upToDateTimer.current);
                upToDateTimer.current = setTimeout(() => setUpdateStatus('idle'), 4000);
            });
            window.electron.onUpdateError(() => {
                setUpdateStatus('idle');
            });
            window.electron.onDownloadProgress((p) => {
                setUpdateStatus('downloading');
                setDownloadPercent(Math.round(p.percent));
            });
            window.electron.onUpdateDownloaded(() => {
                setUpdateStatus('downloaded');
                // Automatically install after a brief delay
                setTimeout(() => {
                    if (window.electron) window.electron.quitAndInstall();
                }, 2000);
            });
        }
        return () => {
            if (upToDateTimer.current) clearTimeout(upToDateTimer.current);
        };
    }, []);

    // One click: check for the latest version for this OS, download it, and
    // install automatically.
    const handleUpdateClick = () => {
        if (!window.electron) return;
        if (updateStatus === 'idle' || updateStatus === 'uptodate') {
            autoDownloadOnAvailable.current = true;
            setUpdateStatus('checking');
            window.electron.checkForUpdates();
        } else if (updateStatus === 'available') {
            setUpdateStatus('downloading');
            window.electron.downloadUpdate();
        } else if (updateStatus === 'downloaded') {
            window.electron.quitAndInstall();
        }
    };

    return (
        <>
            <aside className={styles.sidebar}>
                <div className={styles.logoSection}>
                    <Link href="/" className={styles.logo}>
                        <div className={styles.logoIcon}>
                            <Play size={20} fill="currentColor" />
                        </div>
                        <span className={styles.logoText}>FLIXVIEW</span>
                    </Link>
                </div>

                <nav className={styles.nav}>
                    <div className={styles.searchSection}>
                        <Link
                            href="/search"
                            className={`${styles.navLink} ${(pathname === '/search' || pathname === '/search/') ? styles.active : ''}`}
                            title="Search"
                        >
                            <Search size={22} />
                            <span className={styles.label}>Search</span>
                        </Link>
                    </div>

                    {NAV_LINKS.map((link) => {
                        const isActive = link.href === '/'
                            ? (pathname === '/' || pathname === '')
                            : (pathname === link.href || pathname === link.href + '/');

                        return (
                            <Link
                                key={link.label}
                                href={link.href}
                                className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                                title={link.label}
                            >
                                <link.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                                <span className={styles.label}>{link.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className={styles.bottomSection}>
                    <button
                        onClick={() => setIsDonateOpen(true)}
                        className={styles.actionBtn}
                        title="Support FlixView"
                    >
                        <DonateIcon size={22} />
                        <span className={styles.label}>Support the Project</span>
                    </button>

                    <div className="mt-2 w-full">
                        <Link
                            href="/settings"
                            className={`${styles.actionBtn} group relative overflow-hidden !bg-white/5 hover:!bg-white/10 !border-white/5 ${pathname === '/settings' ? '!border-violet-500/50' : ''}`}
                            title="Settings & Data"
                        >
                            <div className="h-6 w-6 rounded-full bg-violet-600/20 flex items-center justify-center shrink-0">
                                <Settings size={14} className="text-violet-400" />
                            </div>
                            <span className={`${styles.label} truncate`}>
                                Settings & Data
                            </span>
                        </Link>
                    </div>

                    {/* Version & Update Display */}
                    <div className={styles.versionSection}>
                        <div className={styles.versionInfo}>
                            <span className={styles.versionLabel}>Version {version || '0.0.0'}{platformLabel ? ` · ${platformLabel}` : ''}</span>
                            {updateStatus === 'downloading' && (
                                <span className={styles.downloadProgress}>{downloadPercent}%</span>
                            )}
                        </div>

                        <button
                            onClick={handleUpdateClick}
                            disabled={updateStatus === 'checking' || updateStatus === 'downloading'}
                            className={`${styles.updateBtn} ${updateStatus === 'downloaded' ? styles.downloaded : ''}`}
                            title={updateStatus === 'idle' || updateStatus === 'uptodate'
                                ? `Check for updates${platformLabel ? ` (${platformLabel})` : ''}`
                                : undefined}
                        >
                            {updateStatus === 'idle' && (
                                <>
                                    <ArrowUpCircle size={14} />
                                    <span>Check for Updates</span>
                                </>
                            )}
                            {updateStatus === 'checking' && (
                                <>
                                    <RefreshCw size={14} className="animate-spin" />
                                    <span>Checking...</span>
                                </>
                            )}
                            {updateStatus === 'available' && (
                                <>
                                    <ArrowUpCircle size={14} className="animate-bounce" />
                                    <span>Update Available</span>
                                </>
                            )}
                            {updateStatus === 'downloading' && (
                                <>
                                    <RefreshCw size={14} className="animate-spin" />
                                    <span>Downloading... {downloadPercent}%</span>
                                </>
                            )}
                            {updateStatus === 'downloaded' && (
                                <>
                                    <RefreshCw size={14} className="animate-spin text-green-400" />
                                    <span className="text-green-400">Installing...</span>
                                </>
                            )}
                            {updateStatus === 'uptodate' && (
                                <>
                                    <CheckCircle2 size={14} className="text-green-400" />
                                    <span className="text-green-400">Up to Date</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </aside>
            <DonationModal isOpen={isDonateOpen} onClose={() => setIsDonateOpen(false)} />
        </>
    );
}
