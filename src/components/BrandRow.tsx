'use client';

import React from 'react';
import Link from 'next/link';
import styles from './BrandRow.module.css';
import BrandLogo from './BrandLogo';

interface Brand {
    id: string;
    name: string;
    type: 'company' | 'network';
    tmdbId: number;
    glow: string;
    providerId?: number;
}

const BRANDS: Brand[] = [
    // Streaming Networks
    { id: 'netflix', name: 'Netflix', type: 'network', tmdbId: 213, glow: 'rgba(229, 9, 20, 0.5)', providerId: 8 },
    { id: 'disney', name: 'Disney+', type: 'network', tmdbId: 2739, glow: 'rgba(0, 210, 255, 0.5)', providerId: 337 },
    { id: 'apple-tv', name: 'Apple TV+', type: 'network', tmdbId: 2552, glow: 'rgba(255, 255, 255, 0.3)', providerId: 350 },
    { id: 'prime-video', name: 'Prime Video', type: 'network', tmdbId: 1024, glow: 'rgba(0, 168, 225, 0.5)', providerId: 9 },
    { id: 'hulu', name: 'Hulu', type: 'network', tmdbId: 453, glow: 'rgba(28, 231, 131, 0.5)', providerId: 15 },
    { id: 'hbo', name: 'HBO / Max', type: 'network', tmdbId: 49, glow: 'rgba(167, 139, 250, 0.5)', providerId: 1899 },
    { id: 'paramount-plus', name: 'Paramount+', type: 'network', tmdbId: 4330, glow: 'rgba(0, 100, 255, 0.5)', providerId: 531 },

    // Production Studios
    { id: 'marvel', name: 'Marvel Studios', type: 'company', tmdbId: 420, glow: 'rgba(229, 9, 20, 0.5)' },
    { id: 'dc', name: 'DC Films', type: 'company', tmdbId: 9993, glow: 'rgba(0, 75, 255, 0.5)' },
    { id: 'warner-bros', name: 'Warner Bros.', type: 'company', tmdbId: 174, glow: 'rgba(255, 215, 0, 0.4)' },
    { id: 'pixar', name: 'Pixar', type: 'company', tmdbId: 3, glow: 'rgba(59, 130, 246, 0.4)' },
    { id: 'disney-pictures', name: 'Disney Pictures', type: 'company', tmdbId: 2, glow: 'rgba(255, 255, 255, 0.3)' },
    { id: 'universal', name: 'Universal Pictures', type: 'company', tmdbId: 33, glow: 'rgba(255, 255, 255, 0.3)' },
    { id: 'sony-pictures', name: 'Sony Pictures', type: 'company', tmdbId: 34, glow: 'rgba(212, 175, 55, 0.4)' },
    { id: 'columbia', name: 'Columbia Pictures', type: 'company', tmdbId: 5, glow: 'rgba(255, 215, 0, 0.4)' },
    { id: 'dreamworks', name: 'DreamWorks', type: 'company', tmdbId: 7, glow: 'rgba(255, 255, 255, 0.3)' },
    { id: 'mgm', name: 'MGM', type: 'company', tmdbId: 21, glow: 'rgba(212, 175, 55, 0.4)' },
    { id: 'lionsgate', name: 'Lionsgate', type: 'company', tmdbId: 35, glow: 'rgba(200, 160, 40, 0.4)' },
    { id: 'a24', name: 'A24', type: 'company', tmdbId: 41077, glow: 'rgba(255, 255, 255, 0.25)' },
    { id: 'new-line', name: 'New Line Cinema', type: 'company', tmdbId: 12, glow: 'rgba(180, 180, 255, 0.4)' },
    { id: 'lucasfilm', name: 'Lucasfilm', type: 'company', tmdbId: 1, glow: 'rgba(0, 255, 100, 0.4)' },
    { id: 'searchlight', name: 'Searchlight Pictures', type: 'company', tmdbId: 43, glow: 'rgba(255, 215, 0, 0.4)' }
];

export default function BrandRow() {
    return (
        <section className={styles.section}>
            <div className={styles.rail}>
                {BRANDS.map((brand) => {
                    const destination = `/studios?id=${brand.tmdbId}&type=${brand.type}&name=${encodeURIComponent(brand.name)}&logoId=${brand.id}${brand.providerId ? `&providerId=${brand.providerId}` : ''}`;
                    
                    return (
                        <Link 
                            key={brand.id} 
                            href={destination} 
                            className={styles.card}
                            style={{ '--brand-glow': brand.glow } as React.CSSProperties}
                        >
                            <div className={styles.logoWrapper}>
                                <BrandLogo brandId={brand.id} className={styles.logo} />
                            </div>
                            
                            {/* Glass shine element */}
                            <div className={styles.shine} />
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
