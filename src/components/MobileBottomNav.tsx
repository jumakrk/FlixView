'use client';

import Link from 'next/link';
import { Home, TrendingUp, Film, Tv, Bookmark, Heart } from 'lucide-react';
import styles from './MobileBottomNav.module.css';

const NAV_LINKS = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/trending', label: 'Trending', icon: TrendingUp },
    { href: '/movies', label: 'Movies', icon: Film },
    { href: '/series', label: 'Series', icon: Tv },
    { href: '/watchlist', label: 'Watchlist', icon: Bookmark },
];

export default function MobileBottomNav() {
    return (
        <div className={styles.mobileBottomNav}>
            {NAV_LINKS.map((link) => (
                <Link
                    key={link.label}
                    href={link.href}
                    className={styles.mobileNavLink}
                >
                    <link.icon size={22} />
                </Link>
            ))}
        </div>
    );
}
