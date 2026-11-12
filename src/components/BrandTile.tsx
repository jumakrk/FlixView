'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Brand, brandColor, brandHref } from '@/lib/brands';
import { useTilt } from '@/lib/useTilt';
import BrandLogo from './BrandLogo';
import styles from './BrandTile.module.css';

/**
 * Brand tile: the logo on a dark card lit from below in the brand's colour.
 * Hovering tilts it toward the pointer, floods it with that colour and slides
 * up an "Explore" label.
 */
export default function BrandTile({ brand, size = 'md' }: { brand: Brand; size?: 'md' | 'sm' }) {
    const { onPointerMove, onPointerLeave } = useTilt<HTMLAnchorElement>(7);

    return (
        <Link
            href={brandHref(brand)}
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
            className={`${styles.tile} ${size === 'sm' ? styles.small : ''}`}
            style={{
                '--brand': brandColor(brand.id),
                '--brand-soft': brandColor(brand.id, 0.35),
                '--brand-faint': brandColor(brand.id, 0.14),
            } as React.CSSProperties}
            aria-label={`Explore ${brand.name}`}
        >
            <span className={styles.glow} />
            <span className={styles.logo}>
                <BrandLogo brandId={brand.id} />
            </span>
            <span className={styles.footer}>
                <span className={styles.name}>{brand.name}</span>
                <span className={styles.explore}>
                    Explore <ArrowUpRight size={13} />
                </span>
            </span>
        </Link>
    );
}
