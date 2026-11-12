'use client';

/**
 * Where the pointer last went down, in viewport coordinates. Origin-aware
 * animations (OriginPop, page transitions, ripples) read it so things open
 * from, and close back into, the point the user clicked.
 */
interface PointerMark {
    x: number;
    y: number;
    at: number;
}

let last: PointerMark | null = null;

if (typeof window !== 'undefined') {
    window.addEventListener(
        'pointerdown',
        (event) => {
            last = { x: event.clientX, y: event.clientY, at: performance.now() };
        },
        { capture: true, passive: true }
    );
}

/** The last pointer-down position, if it happened within `maxAgeMs`. */
export function recentPointer(maxAgeMs = 1200): { x: number; y: number } | null {
    if (!last || performance.now() - last.at > maxAgeMs) return null;
    return { x: last.x, y: last.y };
}

/**
 * Transform origin (px, relative to the element's own box) that points at
 * the given viewport position. Measured from the element's centre and layout
 * size, so it is correct even while a scale transform is already applied.
 */
export function originFor(el: HTMLElement, point: { x: number; y: number } | null, fallback: 'center' | 'top' = 'center'): string {
    const rect = el.getBoundingClientRect();
    const width = el.offsetWidth;
    const height = el.offsetHeight;
    const left = rect.left + rect.width / 2 - width / 2;
    const top = rect.top + rect.height / 2 - height / 2;

    if (!point) {
        return fallback === 'top' ? `${width / 2}px 0px` : `${width / 2}px ${height / 2}px`;
    }
    return `${Math.round(point.x - left)}px ${Math.round(point.y - top)}px`;
}
