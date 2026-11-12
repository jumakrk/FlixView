'use client';

import { useCallback, useRef } from 'react';
import type { PointerEvent } from 'react';

/**
 * Pointer-driven 3D tilt. Spread the returned handlers on an element; they
 * write CSS custom properties on it instead of React state, so moving the
 * pointer never re-renders:
 *   --tilt-x / --tilt-y   rotation in degrees
 *   --glare-x / --glare-y pointer position in percent, for a glare highlight
 * Updates are batched to one per animation frame.
 */
export function useTilt<T extends HTMLElement>(maxDegrees = 9) {
    const frame = useRef(0);

    const onPointerMove = useCallback((event: PointerEvent<T>) => {
        if (event.pointerType === 'touch') return;
        const el = event.currentTarget;
        const { clientX, clientY } = event;
        cancelAnimationFrame(frame.current);
        frame.current = requestAnimationFrame(() => {
            const rect = el.getBoundingClientRect();
            const px = (clientX - rect.left) / rect.width;
            const py = (clientY - rect.top) / rect.height;
            el.style.setProperty('--tilt-x', `${((0.5 - py) * 2 * maxDegrees).toFixed(2)}deg`);
            el.style.setProperty('--tilt-y', `${((px - 0.5) * 2 * maxDegrees).toFixed(2)}deg`);
            el.style.setProperty('--glare-x', `${(px * 100).toFixed(1)}%`);
            el.style.setProperty('--glare-y', `${(py * 100).toFixed(1)}%`);
        });
    }, [maxDegrees]);

    const onPointerLeave = useCallback((event: PointerEvent<T>) => {
        cancelAnimationFrame(frame.current);
        event.currentTarget.style.setProperty('--tilt-x', '0deg');
        event.currentTarget.style.setProperty('--tilt-y', '0deg');
    }, []);

    return { onPointerMove, onPointerLeave };
}
