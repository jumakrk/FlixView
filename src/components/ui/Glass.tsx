'use client';

import { useEffect, useRef } from 'react';
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import { liquidGlass, LiquidGlassOptions } from '@/lib/liquidGlass';
import { cn } from '@/lib/utils';

/**
 * Optics tuned per element size. The displacement map's curvature (mapBlur)
 * and neutral inset (border) must shrink with the element, or a small button
 * turns into one big lens and its label smears.
 */
const PRESETS = {
    /** Icon buttons and chips (roughly 32-56px tall). */
    button: { scale: -42, chroma: 3, mapBlur: 5, border: 0.16, blur: 2, saturate: 1.6 },
    /** Pills and bars (roughly 48-72px tall, wide). */
    bar: { scale: -70, chroma: 4, mapBlur: 8, border: 0.14, blur: 4, saturate: 1.6 },
    /** Cards and tiles. */
    card: { scale: -90, chroma: 5, mapBlur: 10, border: 0.08, blur: 3, saturate: 1.5 },
    /** Modals and large panels: stronger blur keeps their text legible. */
    panel: { scale: -112, chroma: 6, mapBlur: 14, border: 0.06, blur: 14, saturate: 1.7 },
} satisfies Record<string, LiquidGlassOptions>;

type GlassOwnProps<T extends ElementType> = {
    as?: T;
    preset?: keyof typeof PRESETS;
    /** Fine-tune or override the preset's optics. */
    options?: LiquidGlassOptions;
    /** Material tint: neutral dark glass, or glass tinted with the accent. */
    tint?: 'dark' | 'accent' | 'clear';
    className?: string;
    children?: ReactNode;
};

type GlassProps<T extends ElementType> = GlassOwnProps<T> &
    Omit<ComponentPropsWithoutRef<T>, keyof GlassOwnProps<T>>;

/**
 * Liquid glass surface: real refraction at the rim (Chromium, so always in
 * the desktop app) with a frosted fallback elsewhere. Use it where content
 * passes behind the element; keep it off very large surfaces (GPU cost).
 */
export default function Glass<T extends ElementType = 'div'>({
    as,
    preset = 'card',
    options,
    tint = 'dark',
    className,
    children,
    ...rest
}: GlassProps<T>) {
    const ref = useRef<HTMLElement>(null);
    // Options are read once per mount; the optics do not change at runtime.
    const optionsRef = useRef({ ...PRESETS[preset], ...options });

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const glass = liquidGlass(el, optionsRef.current);
        return () => glass.destroy();
    }, []);

    const Tag = (as ?? 'div') as ElementType;

    return (
        <Tag
            {...rest}
            ref={ref}
            className={cn('lg-glass', tint !== 'dark' && `lg-glass--${tint}`, className)}
        >
            {children}
        </Tag>
    );
}
