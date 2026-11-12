'use client';

import { useLayoutEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { originFor, recentPointer } from '@/lib/origin';

/**
 * Origin-aware page transition. A template re-mounts on every navigation, so
 * each page eases in from the point that was clicked to open it (a card, a
 * sidebar link), or from the top when nothing was clicked.
 *
 * framer-motion clears the transform once it settles at scale 1, so it never
 * lingers to re-anchor `position: fixed` / sticky children.
 */
export default function Template({ children }: { children: React.ReactNode }) {
    const ref = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const el = ref.current;
        if (el) el.style.transformOrigin = originFor(el, recentPointer(1500), 'top');
    }, []);

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.975 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
            {children}
        </motion.div>
    );
}
