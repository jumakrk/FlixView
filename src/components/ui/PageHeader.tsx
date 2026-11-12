'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const EASE = [0.16, 1, 0.3, 1] as const;

interface PageHeaderProps {
    /** Small label above the title. */
    eyebrow?: string;
    title: string;
    subtitle?: string;
    icon?: ReactNode;
    /** Extra content on the right (counts, filters). */
    children?: ReactNode;
    className?: string;
}

/** Page title block shared by the browse and library pages. */
export default function PageHeader({ eyebrow, title, subtitle, icon, children, className }: PageHeaderProps) {
    return (
        <header className={cn('flex flex-wrap items-end justify-between gap-6 px-[4%] pb-8 pt-20', className)}>
            <div className="min-w-0">
                {eyebrow && (
                    <motion.span
                        className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-violet-200"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: EASE }}
                    >
                        {eyebrow}
                    </motion.span>
                )}
                <motion.h1
                    className="flex items-center gap-4 text-5xl font-extrabold tracking-tight md:text-6xl"
                    initial={{ opacity: 0, y: 22 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.75, ease: EASE, delay: 0.05 }}
                >
                    {icon && (
                        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-violet-300 shadow-[0_10px_30px_rgba(31,128,115,0.3)]">
                            {icon}
                        </span>
                    )}
                    <span className="text-gradient">{title}</span>
                </motion.h1>
                {subtitle && (
                    <motion.p
                        className="mt-4 max-w-2xl text-[15.5px] leading-relaxed text-white/60"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.75, ease: EASE, delay: 0.14 }}
                    >
                        {subtitle}
                    </motion.p>
                )}
            </div>
            {children && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.75, ease: EASE, delay: 0.2 }}
                >
                    {children}
                </motion.div>
            )}
        </header>
    );
}
