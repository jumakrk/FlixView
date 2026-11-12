'use client';

import { useLayoutEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { CSSProperties, ReactNode } from 'react';
import { originFor, recentPointer } from '@/lib/origin';

interface OriginPopProps {
    children: ReactNode;
    className?: string;
    style?: CSSProperties;
    /** Where to grow from when nothing was clicked (keyboard, automatic). */
    fallback?: 'center' | 'top';
}

/**
 * Origin-aware open/close for dialogs and panels: grows out of the point the
 * user clicked to open it, and shrinks back into that same point on close.
 * Render it inside <AnimatePresence> so the closing animation can play.
 */
export default function OriginPop({ children, className, style, fallback = 'center' }: OriginPopProps) {
    const ref = useRef<HTMLDivElement>(null);

    // Before the first paint: aim the transform origin at the click.
    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.style.transformOrigin = originFor(el, recentPointer(), fallback);
    }, [fallback]);

    return (
        <motion.div
            ref={ref}
            className={className}
            style={style}
            initial={{ opacity: 0, scale: 0.45 }}
            animate={{ opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 360, damping: 30, mass: 0.9 } }}
            exit={{ opacity: 0, scale: 0.45, transition: { duration: 0.26, ease: [0.4, 0, 0.6, 1] } }}
        >
            {children}
        </motion.div>
    );
}
