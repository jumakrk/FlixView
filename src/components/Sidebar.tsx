'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, TrendingUp, Film, Tv, Bookmark, Heart, Search, Play, Settings } from 'lucide-react';
import { useState } from 'react';
import { useUpdates, platformLabel } from '@/context/UpdateContext';
import styles from './Sidebar.module.css';
import DonationModal from './DonationModal';
import DonateIcon from './DonateIcon';
import AnimeIcon from './AnimeIcon';

const NAV_LINKS = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/trending', label: 'Trending', icon: TrendingUp },
    { href: '/movies', label: 'Movies', icon: Film },
    { href: '/series', label: 'Series', icon: Tv },
    { href: '/anime', label: 'Anime', icon: AnimeIcon },
    { href: '/watchlist', label: 'My Watchlist', icon: Bookmark },
    { href: '/favorites', label: 'My Favorites', icon: Heart },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [isDonateOpen, setIsDonateOpen] = useState(false);
    // Update checks and the Update/Cancel prompt live in UpdateProvider; the
    // manual "Check for updates" button is on the Settings page.
    const { appVersion, platform, status: updateStatus, downloadPercent } = useUpdates();
    const osLabel = platformLabel(platform);

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

                    {/* Version display */}
                    <div className={styles.versionSection}>
                        <div className={styles.versionInfo}>
                            <span className={styles.versionLabel}>Version {appVersion || '0.0.0'}{osLabel ? ` · ${osLabel}` : ''}</span>
                            {updateStatus === 'downloading' && (
                                <span className={styles.downloadProgress}>{downloadPercent}%</span>
                            )}
                        </div>
                    </div>
                </div>
            </aside>
            <DonationModal isOpen={isDonateOpen} onClose={() => setIsDonateOpen(false)} />
        </>
    );
}
