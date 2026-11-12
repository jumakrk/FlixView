'use client';

import { useEffect } from 'react';

/**
 * Origin-aware press feedback: any element marked `data-ripple` answers a
 * click with a soft Sand ripple spreading from the exact point pressed. One
 * delegated listener serves the whole app; the ripple is a single
 * compositor-only element that removes itself when done.
 */
export default function Ripples() {
    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const onPointerDown = (event: PointerEvent) => {
            if (event.button !== 0) return;
            const host = (event.target as Element | null)?.closest<HTMLElement>('[data-ripple]');
            if (!host) return;

            const rect = host.getBoundingClientRect();
            if (getComputedStyle(host).position === 'static') host.style.position = 'relative';

            const layer = document.createElement('span');
            layer.className = 'ripple-layer';
            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            const size = Math.max(rect.width, rect.height) * 2.3;
            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${event.clientX - rect.left}px`;
            ripple.style.top = `${event.clientY - rect.top}px`;
            layer.appendChild(ripple);
            host.appendChild(layer);

            ripple.addEventListener('animationend', () => layer.remove(), { once: true });
            // Safety net if the animation is interrupted (element unmounted).
            window.setTimeout(() => layer.remove(), 1000);
        };

        document.addEventListener('pointerdown', onPointerDown, { passive: true });
        return () => document.removeEventListener('pointerdown', onPointerDown);
    }, []);

    return null;
}
