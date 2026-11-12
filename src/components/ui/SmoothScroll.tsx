'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';

let lenis: Lenis | null = null;

let locks = 0;

/**
 * Freeze the page behind a modal: stops Lenis and native scrolling. Nested
 * modals stack; the page scrolls again once every lock is released. Inner
 * scroll areas marked `data-lenis-prevent` keep scrolling.
 */
export function lockPageScroll(): () => void {
    locks += 1;
    if (locks === 1) {
        const root = document.documentElement;
        const gutter = window.innerWidth - root.clientWidth;
        lenis?.stop();
        root.style.overflow = 'hidden';
        if (gutter > 0) root.style.paddingRight = `${gutter}px`;
    }
    let released = false;
    return () => {
        if (released) return;
        released = true;
        locks -= 1;
        if (locks === 0) {
            const root = document.documentElement;
            root.style.overflow = '';
            root.style.paddingRight = '';
            lenis?.start();
        }
    };
}

/** Scroll the page to a position, through Lenis when it is running. */
export function scrollPageTo(top: number, immediate = false) {
    if (lenis) lenis.scrollTo(top, { immediate });
    else window.scrollTo({ top, behavior: immediate ? 'auto' : 'smooth' });
}

/**
 * Eased page scrolling with Lenis (darkroomengineering/lenis), tuned for a
 * silky glide that still keeps up with the wheel (too low a lerp makes the
 * page trail behind it, which reads as lag). Nested scroll areas (episode lists, modals) opt out
 * with the `data-lenis-prevent` attribute and keep native scrolling. Disabled
 * when the user prefers reduced motion. Also returns the page to the top on
 * every route change.
 */
export default function SmoothScroll() {
    const pathname = usePathname();

    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const instance = new Lenis({
            // Glide factor: lower is silkier but trails the wheel more.
            lerp: 0.12,
            wheelMultiplier: 1,
            touchMultiplier: 1.4,
            // Smooth-scroll in-page anchor links too.
            anchors: true,
            // Inner scroll areas (episode lists, menus) keep scrolling on their own.
            allowNestedScroll: true,
            // A glide in progress stops when the user navigates away.
            stopInertiaOnNavigate: true,
            autoRaf: true,
        });
        lenis = instance;
        return () => {
            instance.destroy();
            if (lenis === instance) lenis = null;
        };
    }, []);

    useEffect(() => {
        scrollPageTo(0, true);
    }, [pathname]);

    return null;
}
