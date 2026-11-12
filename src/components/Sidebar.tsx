'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, TrendingUp, Film, Tv, Bookmark, Heart, Search, Play, Settings, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useState } from 'react';
import { useUpdates, platformLabel } from '@/context/UpdateContext';
import { cn } from '@/lib/utils';
import styles from './Sidebar.module.css';
import DonationModal from './DonationModal';
import DonateIcon from './DonateIcon';
import AnimeIcon from './AnimeIcon';
import Glass from './ui/Glass';
import { openCommandPalette } from './CommandPalette';

const NAV_LINKS = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/trending', label: 'Trending', icon: TrendingUp },
    { href: '/movies', label: 'Movies', icon: Film },
    { href: '/series', label: 'Series', icon: Tv },
    { href: '/anime', label: 'Anime', icon: AnimeIcon },
];

const LIBRARY_LINKS = [
    { href: '/watchlist', label: 'My Watchlist', icon: Bookmark },
    { href: '/favorites', label: 'My Favourites', icon: Heart },
];

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
}

function isActivePath(pathname: string, href: string): boolean {
    if (href === '/') return pathname === '/' || pathname === '';
    return pathname === href || pathname === `${href}/`;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
    const pathname = usePathname();
    const [isDonateOpen, setIsDonateOpen] = useState(false);
    // Update checks and the Update/Cancel prompt live in UpdateProvider; the
    // manual "Check for updates" button is on the Settings page.
    const { appVersion, platform, status: updateStatus, downloadPercent } = useUpdates();
    const osLabel = platformLabel(platform);

    const renderLink = (link: { href: string; label: string; icon: typeof Home | typeof AnimeIcon }) => {
        const active = isActivePath(pathname, link.href);
        return (
            <Link
                key={link.href}
                href={link.href}
                className={cn(styles.navLink, active && styles.active)}
                title={link.label}
                data-ripple
                aria-current={active ? 'page' : undefined}
            >
                {/* One shared highlight slides between items (layoutId). */}
                {active && (
                    <motion.span
                        layoutId="sidebar-active"
                        className={styles.activePill}
                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    >
                        <Glass as="span" preset="bar" tint="accent" className={styles.activeGlass} />
                    </motion.span>
                )}
                <span className={styles.icon}>
                    <link.icon size={21} strokeWidth={active ? 2.4 : 2} />
                </span>
                <span className={styles.label}>{link.label}</span>
            </Link>
        );
    };

    return (
        <>
            <aside className={cn(styles.sidebar, 'glass-panel', collapsed && styles.collapsed)}>
                <div className={styles.logoSection}>
                    <Link href="/" className={styles.logo} title="FlixView">
                        <span className={styles.logoIcon}>
                            <Play size={18} fill="currentColor" />
                        </span>
                        <span className={styles.logoText}>FLIXVIEW</span>
                    </Link>
                    <button
                        type="button"
                        onClick={onToggle}
                        className={styles.collapseBtn}
                        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                    </button>
                </div>

                <button
                    type="button"
                    onClick={() => openCommandPalette()}
                    data-ripple
                    className={styles.searchBtn}
                    title="Search (Ctrl K)"
                >
                    <span className={styles.icon}><Search size={19} /></span>
                    <span className={styles.label}>Search</span>
                    <kbd className={styles.kbd}>Ctrl K</kbd>
                </button>

                <nav className={styles.nav} data-lenis-prevent>
                    <span className={styles.groupLabel}>Browse</span>
                    {NAV_LINKS.map(renderLink)}
                    <span className={styles.groupLabel}>Library</span>
                    {LIBRARY_LINKS.map(renderLink)}
                </nav>

                <div className={styles.bottomSection}>
                    <button
                        type="button"
                        onClick={() => setIsDonateOpen(true)}
                        data-ripple
                        className={styles.navLink}
                        title="Support FlixView"
                    >
                        <span className={styles.icon}><DonateIcon size={21} /></span>
                        <span className={styles.label}>Support the Project</span>
                    </button>

                    {renderLink({ href: '/settings', label: 'Settings & Data', icon: Settings })}

                    <div className={styles.versionInfo}>
                        <span className={styles.versionLabel}>
                            v{appVersion || '0.0.0'}{osLabel ? ` · ${osLabel}` : ''}
                        </span>
                        {updateStatus === 'downloading' && (
                            <span className={styles.downloadProgress}>{downloadPercent}%</span>
                        )}
                    </div>
                </div>
            </aside>
            <DonationModal isOpen={isDonateOpen} onClose={() => setIsDonateOpen(false)} />
        </>
    );
}
