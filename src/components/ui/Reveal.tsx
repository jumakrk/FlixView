'use client';

import { useEffect, useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';

/* ---------------------------------------------------------------------------
   Scroll reveals. Elements fade and lift in the first time they enter the
   viewport. The motion is a CSS transition (see globals.css, [data-reveal]),
   so it runs on the compositor: no JavaScript per frame while the page
   scrolls, which framer-motion's whileInView needed for every card. One
   shared IntersectionObserver serves the whole app.
--------------------------------------------------------------------------- */

let observer: IntersectionObserver | null = null;

function reveal(el: HTMLElement) {
    el.classList.add('is-revealed');
}

function sharedObserver(): IntersectionObserver {
    if (!observer) {
        observer = new IntersectionObserver(entries => {
            for (const entry of entries) {
                if (!entry.isIntersecting) continue;
                const el = entry.target as HTMLElement;
                observer?.unobserve(el);
                reveal(el);
            }
        }, { rootMargin: '0px 0px -6% 0px' });
    }
    return observer;
}

/** Ref for an element that should reveal itself on first view. */
export function useReveal<T extends HTMLElement>(enabled = true) {
    const ref = useRef<T>(null);
    useEffect(() => {
        const el = ref.current;
        if (!el || !enabled) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            reveal(el);
            return;
        }
        const io = sharedObserver();
        io.observe(el);
        return () => io.unobserve(el);
    }, [enabled]);
    return ref;
}

interface RevealProps {
    children: ReactNode;
    className?: string;
    /** Seconds to wait before animating in. */
    delay?: number;
    /** Distance (px) the content rises as it appears. */
    y?: number;
}

/** Fades and lifts its content into place the first time it scrolls into view. */
export function Reveal({ children, className, delay = 0, y = 28 }: RevealProps) {
    const ref = useReveal<HTMLDivElement>();
    const style = { '--reveal-y': `${y}px`, '--reveal-delay': `${delay}s` } as CSSProperties;
    return (
        <div ref={ref} data-reveal="" className={className} style={style}>
            {children}
        </div>
    );
}

interface RevealGroupProps {
    children: ReactNode;
    className?: string;
}

/**
 * Reveals a whole row or list as one piece. Cards used to come in one after
 * another, but every card animating on its own got its own GPU layer while
 * the row scrolled into view, which halved the frame rate (measured on the
 * first pass down the home page: median frame 33 ms per card, 16.7 ms with
 * the row as one piece).
 */
export function RevealGroup({ children, className }: RevealGroupProps) {
    const ref = useReveal<HTMLDivElement>();
    return (
        <div ref={ref} data-reveal-group="" className={className}>
            {children}
        </div>
    );
}

/** A child of a RevealGroup. Kept as a wrapper so rows keep their layout. */
export function RevealItem({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div data-reveal-item="" className={className}>
            {children}
        </div>
    );
}
