'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

const EASE = [0.16, 1, 0.3, 1] as const;

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
    return (
        <motion.div
            className={className}
            initial={{ opacity: 0, y }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px 0px -8% 0px' }}
            transition={{ duration: 0.7, ease: EASE, delay }}
        >
            {children}
        </motion.div>
    );
}

interface RevealGroupProps {
    children: ReactNode;
    className?: string;
    /** Seconds between each child's entrance. */
    stagger?: number;
}

/** Reveals its RevealItem children one after another as the group enters view. */
export function RevealGroup({ children, className, stagger = 0.045 }: RevealGroupProps) {
    return (
        <motion.div
            className={className}
            initial="hidden"
            whileInView="shown"
            viewport={{ once: true, margin: '0px 0px -6% 0px' }}
            variants={{ hidden: {}, shown: { transition: { staggerChildren: stagger } } }}
        >
            {children}
        </motion.div>
    );
}

export function RevealItem({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <motion.div
            className={className}
            variants={{
                hidden: { opacity: 0, y: 26, scale: 0.96 },
                shown: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: EASE } },
            }}
        >
            {children}
        </motion.div>
    );
}
