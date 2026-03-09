'use client';

import Link from 'next/link';
import { Search, Bell, User, Home, TrendingUp, Film, Tv, Bookmark, Heart, ChevronLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import styles from './Navbar.module.css';

const NAV_LINKS = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/trending', label: 'Trending', icon: TrendingUp },
    { href: '/movies', label: 'Movies', icon: Film },
    { href: '/series', label: 'Series', icon: Tv },
    { href: '/watchlist', label: 'My Watchlist', icon: Bookmark },
    { href: '/favorites', label: 'My Favorites', icon: Heart },
];

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const isHomePage = pathname === '/';

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 0) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            <nav className={`${styles.navbar} ${isScrolled ? styles.scrolled : ''}`}>
                <div className={styles.titleBar} />
                <div className={styles.container}>
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <Link href="/" className={`${styles.logo} no-drag`}>
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-bold text-lg">F</span>
                            </div>
                            <span className={styles['logo-text']}>FLIXVIEW</span>
                        </Link>
                    </div>

                    {/* Desktop/Tablet Centered Links */}
                    <div className={`${styles['nav-links-desktop']} no-drag`}>
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className={styles['nav-link']}
                            >
                                <link.icon className={styles['nav-icon']} size={20} />
                                <span className={styles['nav-label']}>{link.label}</span>
                            </Link>
                        ))}
                    </div>

                    {/* Right Actions */}
                    <div className={`${styles['right-section']} no-drag`}>
                        <Link
                            href="/search"
                            className={`${styles['icon-btn']} ${pathname === '/search' ? styles.active : ''}`}
                        >
                            <Search size={18} />
                        </Link>

                        <button className={styles['icon-btn']}>
                            <Bell size={18} />
                        </button>


                    </div>
                </div>
            </nav>

            {/* Mobile Bottom Nav */}
            <div className={styles['mobile-bottom-nav']}>
                {NAV_LINKS.map((link) => (
                    <Link
                        key={link.label}
                        href={link.href}
                        className={styles['mobile-nav-link']}
                    >
                        <link.icon size={22} />
                    </Link>
                ))}
            </div>
        </>
    );
}
