'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface Chip<T extends string | number> {
    value: T;
    label: string;
}

interface ChipRailProps<T extends string | number> {
    /** Unique per rail on a page: the sliding highlight is keyed by it. */
    id: string;
    chips: Chip<T>[];
    /** `null` selects the leading "All" chip. */
    value: T | null;
    onChange: (value: T | null) => void;
    allLabel?: string;
    className?: string;
}

/**
 * One-line, horizontally scrolling chip picker (genres). The active chip has
 * a sliding highlight and is scrolled into view when selected. Mouse wheels
 * scroll it sideways.
 */
export default function ChipRail<T extends string | number>({
    id,
    chips,
    value,
    onChange,
    allLabel = 'All',
    className,
}: ChipRailProps<T>) {
    const scroller = useRef<HTMLDivElement>(null);

    // Vertical wheel movement scrolls the strip sideways instead of the page.
    useEffect(() => {
        const el = scroller.current;
        if (!el) return;
        const onWheel = (event: WheelEvent) => {
            if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
            if (el.scrollWidth <= el.clientWidth) return;
            event.preventDefault();
            el.scrollBy({ left: event.deltaY });
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, []);

    useEffect(() => {
        scroller.current
            ?.querySelector<HTMLElement>('[aria-pressed="true"]')
            ?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    }, [value]);

    const all: { value: T | null; label: string }[] = [{ value: null, label: allLabel }, ...chips];

    return (
        <div
            ref={scroller}
            data-lenis-prevent
            className={cn('flex items-center gap-2 overflow-x-auto py-1', className)}
        >
            {all.map(chip => {
                const active = chip.value === value;
                return (
                    <button
                        key={String(chip.value)}
                        type="button"
                        aria-pressed={active}
                        data-ripple
                        onClick={() => onChange(chip.value)}
                        className={cn(
                            'relative shrink-0 rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors duration-300',
                            active
                                ? 'border-transparent text-white'
                                : 'border-white/[0.08] bg-white/[0.03] text-white/60 hover:border-white/20 hover:bg-white/[0.07] hover:text-white'
                        )}
                    >
                        {active && (
                            <motion.span
                                layoutId={`chip-${id}`}
                                className="absolute inset-0 rounded-full bg-white shadow-[0_6px_22px_rgba(255,255,255,0.25)]"
                                transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                            />
                        )}
                        <span className={cn('relative', active && 'text-[#00332e]')}>{chip.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
