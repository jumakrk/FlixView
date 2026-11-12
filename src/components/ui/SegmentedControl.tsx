'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface SegmentOption<T extends string> {
    value: T;
    label: ReactNode;
    icon?: ReactNode;
}

interface SegmentedControlProps<T extends string> {
    /** Unique per control on a page: the sliding highlight is keyed by it. */
    id: string;
    options: SegmentOption<T>[];
    value: T;
    onChange: (value: T) => void;
    size?: 'sm' | 'md';
    className?: string;
}

/** Pill-shaped option switcher with a highlight that slides to the selection. */
export default function SegmentedControl<T extends string>({
    id,
    options,
    value,
    onChange,
    size = 'md',
    className,
}: SegmentedControlProps<T>) {
    return (
        <div
            role="radiogroup"
            className={cn(
                'relative inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.04] p-1',
                className
            )}
        >
            {options.map(option => {
                const active = option.value === value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        role="radio"
                        data-ripple
                        aria-checked={active}
                        onClick={() => onChange(option.value)}
                        className={cn(
                            'relative flex items-center gap-2 whitespace-nowrap rounded-full font-semibold transition-colors duration-300',
                            size === 'sm' ? 'px-3.5 py-1.5 text-[13px]' : 'px-5 py-2.5 text-sm',
                            active ? 'text-white' : 'text-white/55 hover:text-white'
                        )}
                    >
                        {active && (
                            <motion.span
                                layoutId={`segment-${id}`}
                                className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-[0_6px_20px_rgba(31,128,115,0.45),inset_0_1px_0_rgba(255,255,255,0.3)]"
                                transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                            />
                        )}
                        {option.icon && <span className="relative">{option.icon}</span>}
                        <span className="relative">{option.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
