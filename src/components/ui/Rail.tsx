'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RailProps {
    /** Classes for the scrolling strip itself (gap, padding). */
    className?: string;
    /** Fade the two ends of the strip. Off by default: the mask is costly on long rows. */
    fade?: boolean;
    children: ReactNode;
}

/**
 * Horizontal scroller shared by every row: edge fades, and frosted arrow
 * buttons that appear on hover whenever there is more to see in that
 * direction. Trackpads, touch and Shift+wheel still scroll it natively.
 */
export default function Rail({ className, fade = false, children }: RailProps) {
    const scroller = useRef<HTMLDivElement>(null);
    const [canScroll, setCanScroll] = useState({ back: false, forward: false });

    const update = useCallback(() => {
        const el = scroller.current;
        if (!el) return;
        const back = el.scrollLeft > 8;
        const forward = el.scrollLeft + el.clientWidth < el.scrollWidth - 8;
        setCanScroll(previous => (previous.back === back && previous.forward === forward ? previous : { back, forward }));
    }, []);

    useEffect(() => {
        const el = scroller.current;
        if (!el) return;
        update();
        // Content can arrive later (images, async rows) and the window resizes.
        const observer = new ResizeObserver(update);
        observer.observe(el);
        if (el.firstElementChild) observer.observe(el.firstElementChild);
        return () => observer.disconnect();
    }, [update]);

    // While the strip moves, cards slide under a still pointer and each one
    // would start its hover animation (zoom, glare, glass panel), which is
    // what made sideways scrolling stutter. Hover is paused until the strip
    // settles, and the arrow state is updated at most once per frame.
    const settleTimer = useRef(0);
    const frame = useRef(0);
    const onScroll = () => {
        const el = scroller.current;
        if (!el) return;
        if (!('scrolling' in el.dataset)) el.dataset.scrolling = '';
        window.clearTimeout(settleTimer.current);
        settleTimer.current = window.setTimeout(() => { delete el.dataset.scrolling; }, 160);
        if (!frame.current) {
            frame.current = requestAnimationFrame(() => {
                frame.current = 0;
                update();
            });
        }
    };

    useEffect(() => () => {
        window.clearTimeout(settleTimer.current);
        cancelAnimationFrame(frame.current);
    }, []);

    const page = (direction: 1 | -1) => {
        const el = scroller.current;
        if (!el) return;
        el.scrollBy({ left: direction * el.clientWidth * 0.82, behavior: 'smooth' });
    };

    const arrow = 'glass-panel absolute top-1/2 z-40 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-white opacity-0 transition-all duration-300 hover:scale-110 hover:border-violet-300/50 hover:bg-violet-500/40 group-hover/rail:opacity-100';

    return (
        <div className="group/rail relative">
            <div ref={scroller} onScroll={onScroll} className={cn('rail-scroller', fade && 'mask-fade-x', className)}>
                {children}
            </div>

            {canScroll.back && (
                <button type="button" onClick={() => page(-1)} className={cn(arrow, 'left-[1.1%]')} aria-label="Scroll back">
                    <ChevronLeft size={20} />
                </button>
            )}
            {canScroll.forward && (
                <button type="button" onClick={() => page(1)} className={cn(arrow, 'right-[1.1%]')} aria-label="Scroll forward">
                    <ChevronRight size={20} />
                </button>
            )}
        </div>
    );
}
