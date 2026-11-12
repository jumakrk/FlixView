'use client';

import { useEffect } from 'react';
import { lockPageScroll } from '@/components/ui/SmoothScroll';

/** Keeps the page behind a modal from scrolling while `active` is true. */
export function useScrollLock(active: boolean) {
    useEffect(() => {
        if (!active) return;
        return lockPageScroll();
    }, [active]);
}
