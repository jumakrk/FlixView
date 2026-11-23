'use client';

import { useCallback, useRef } from 'react';
import type { ReactNode, RefObject } from 'react';
import { cn } from '@/lib/utils';
import { scrollToResults } from './SmoothScroll';

/**
 * A filter bar that stays pinned under the title bar while its results
 * scroll past. Call `toResults()` whenever a filter changes: if the user had
 * scrolled into the results, the page glides back so the bar sits at the top
 * and the new results start on the first row right under it.
 */
export function useFilterDock() {
    const anchor = useRef<HTMLDivElement>(null);
    const dock = useRef<HTMLDivElement>(null);
    const toResults = useCallback(() => {
        const el = dock.current;
        if (!el) return;
        scrollToResults(anchor.current, parseFloat(getComputedStyle(el).top) || 0);
    }, []);
    return { anchor, dock, toResults };
}

interface FilterDockProps {
    anchor: RefObject<HTMLDivElement | null>;
    dock: RefObject<HTMLDivElement | null>;
    className?: string;
    children: ReactNode;
}

export default function FilterDock({ anchor, dock, className, children }: FilterDockProps) {
    return (
        <>
            {/* Marks where the bar sits in the page; the sticky bar itself
                reports its pinned position once it is stuck. */}
            <div ref={anchor} aria-hidden="true" />
            <div ref={dock} className={cn('sticky z-40', className)} style={{ top: 'calc(var(--titlebar-height) + 10px)' }}>
                {children}
            </div>
        </>
    );
}
