'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, TrendingUp, Film, Tv, Bookmark, Heart, Search, Play } from 'lucide-react';
import { useState } from 'react';
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

import AuthModal from './AuthModal';
import { useAuth } from '@/context/AuthContext';
import { LogIn, LogOut, User, RefreshCw, ArrowUpCircle } from 'lucide-react';
import { useEffect } from 'react';

export default function Sidebar() {
    const pathname = usePathname();
    const [isDonateOpen, setIsDonateOpen] = useState(false);
    const [version, setVersion] = useState<string>('');
    const [updateStatus, setUpdateStatus] = useState<'none' | 'available' | 'downloading' | 'downloaded'>('none');
    const [downloadPercent, setDownloadPercent] = useState(0);

    const { user, logout, isAuthModalOpen, openAuthModal, closeAuthModal } = useAuth();

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
            window.electron.onUpdateDownloaded(() => setUpdateStatus('downloaded'));
        }
    }, []);

    const handleUpdateAction = () => {
        if (updateStatus === 'downloaded' && window.electron) {
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

                    {user ? (
                        <div className="mt-2 w-full">
                            <Link
                                href="/profile"
                                className={`${styles.actionBtn} group relative overflow-hidden !bg-white/5 hover:!bg-white/10 !border-white/5 ${pathname === '/profile' ? '!border-violet-500/50' : ''}`}
                                title="My Profile"
                            >
                                <div className="h-6 w-6 rounded-full bg-violet-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0 overflow-hidden">
                                    {user.profilePicture ? (
                                        <img src={user.profilePicture} alt={user.username} className="w-full h-full object-cover" />
                                    ) : (
                                        user.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()
                                    )}
                                </div>
                                <span className={`${styles.label} truncate`}>
                                    {user.username || user.email.split('@')[0]}
                                </span>
                            </Link>
                        </div>
                    ) : (
                        <button
                            onClick={openAuthModal}
                            className={styles.actionBtn}
                            title="Log In / Register"
                        >
                            <LogIn size={22} />
                            <span className={styles.label}>Log In</span>
                        </button>
                    )}

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
                                disabled={updateStatus === 'downloading' || updateStatus === 'available'}
                            >
                                {updateStatus === 'available' && (
                                    <>
                                        <RefreshCw size={14} className="animate-spin" />
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
                                        <ArrowUpCircle size={14} />
                                        <span>Restart to Update</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </aside>
            <DonationModal isOpen={isDonateOpen} onClose={() => setIsDonateOpen(false)} />
            <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />
        </>
    );
}
