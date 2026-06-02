'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, TrendingUp, Film, Tv, Bookmark, Heart, Search, Play, Settings, RefreshCw, ArrowUpCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import styles from './Sidebar.module.css';
import DonationModal from './DonationModal';
import DonateIcon from './DonateIcon';

import UpdateModal from './UpdateModal';

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
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [version, setVersion] = useState<string>('');
    const [updateStatus, setUpdateStatus] = useState<'none' | 'available' | 'downloading' | 'downloaded'>('none');
    const [downloadPercent, setDownloadPercent] = useState(0);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.electron) {
            // Get version
            window.electron.getAppVersion().then(v => setVersion(v));

            // Listen for updates
            window.electron.onUpdateAvailable(() => setUpdateStatus('available'));
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
    }, []);

    const handleUpdateAction = () => {
        setIsUpdateModalOpen(true);
    };

    const handleUpdateNow = () => {
        if (window.electron) {
            window.electron.downloadUpdate();
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
                            <span className={styles.versionLabel}>Version {version || '0.0.0'}</span>
                            {updateStatus === 'downloading' && (
                                <span className={styles.downloadProgress}>{downloadPercent}%</span>
                            )}
                        </div>

                        {updateStatus !== 'none' && (
                            <button 
                                onClick={handleUpdateAction}
                                className={`${styles.updateBtn} ${styles[updateStatus]}`}
                            >
                                {updateStatus === 'available' && (
                                    <>
                                        <ArrowUpCircle size={14} className="animate-bounce" />
                                        <span>Update Available</span>
                                    </>
                                )}
                                {updateStatus === 'downloading' && (
                                    <>
                                        <RefreshCw size={14} className="animate-spin" />
                                        <span>Downloading...</span>
                                    </>
                                )}
                                {updateStatus === 'downloaded' && (
                                    <>
                                        <RefreshCw size={14} className="animate-spin text-green-400" />
                                        <span className="text-green-400">Installing...</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </aside>
            <DonationModal isOpen={isDonateOpen} onClose={() => setIsDonateOpen(false)} />
            <UpdateModal 
                isOpen={isUpdateModalOpen}
                onClose={() => setIsUpdateModalOpen(false)}
                onUpdateNow={handleUpdateNow}
                status={updateStatus}
                downloadPercent={downloadPercent}
                version={version}
            />
        </>
    );
}
