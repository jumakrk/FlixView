'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';

/** Glide factor shared by every scroller: lower is silkier but trails the wheel more. */
const LERP = 0.12;

let lenis: Lenis | null = null;

/* ---------------------------------------------------------------------------
   One animation loop drives every Lenis instance (the page and each nested
   scroller), so twenty rails do not mean twenty requestAnimationFrame loops.
   Lenis eases by elapsed time, so the glide feels the same at 60, 120 or
   144 Hz and simply gets smoother on faster displays.
--------------------------------------------------------------------------- */
const instances = new Set<Lenis>();
let frame = 0;

function tick(time: number) {
    instances.forEach(instance => instance.raf(time));
    frame = requestAnimationFrame(tick);
}

function register(instance: Lenis) {
    instances.add(instance);
    if (!frame) frame = requestAnimationFrame(tick);
}

function unregister(instance: Lenis) {
    instances.delete(instance);
    if (instances.size === 0 && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
    }
}

function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

let locks = 0;

/**
 * Freeze the page behind a modal: stops Lenis and native scrolling. Nested
 * modals stack; the page scrolls again once every lock is released. Scroll
 * areas inside the modal (marked `data-smooth`) keep scrolling.
 */
export function lockPageScroll(): () => void {
    locks += 1;
    if (locks === 1) {
        const root = document.documentElement;
        const gutter = window.innerWidth - root.clientWidth;
        lenis?.stop();
        root.style.overflow = 'hidden';
        if (gutter > 0) root.style.paddingRight = `${gutter}px`;
    }
    let released = false;
    return () => {
        if (released) return;
        released = true;
        locks -= 1;
        if (locks === 0) {
            const root = document.documentElement;
            root.style.overflow = '';
            root.style.paddingRight = '';
            lenis?.start();
        }
    };
}

/**
 * Scroll the page to a position, through Lenis when it is running. `duration`
 * (seconds) gives a fixed-length glide instead of the usual easing, which
 * keeps long jumps short.
 */
export function scrollPageTo(top: number, immediate = false, duration?: number) {
    if (lenis) lenis.scrollTo(top, duration ? { immediate, duration } : { immediate });
    else window.scrollTo({ top, behavior: immediate ? 'auto' : 'smooth' });
}

/**
 * Brings a sticky filter bar back to its pinned spot at the top, so the
 * freshly filtered results start right under it. `anchor` is an element that
 * marks where the bar sits in the page (it must not be the sticky element
 * itself); `pinnedTop` is the bar's sticky `top` in pixels. Does nothing when
 * the page is above that point already.
 */
export function scrollToResults(anchor: HTMLElement | null, pinnedTop: number) {
    if (!anchor) return;
    const target = Math.max(0, anchor.getBoundingClientRect().top + window.scrollY - pinnedTop);
    if (window.scrollY > target + 1) scrollPageTo(target, false, 0.6);
}

/* ---------------------------------------------------------------------------
   Nested smooth scrollers. Any element marked `data-smooth` gets its own
   Lenis instance, with the same glide as the page:
     data-smooth="y"      vertical list (episode lists, modals, menus)
     data-smooth="x"      horizontal rail: sideways gestures and Shift+wheel;
                          the plain wheel keeps scrolling the page
     data-smooth="chips"  horizontal strip where the plain wheel also scrolls
                          it sideways (filter chips)
   Elements are picked up when they mount and released when they unmount.
--------------------------------------------------------------------------- */
const nested = new Map<HTMLElement, Lenis>();

/** The Lenis instance driving a nested scroller, if it has one. */
export function getSmoothScroller(el: HTMLElement | null): Lenis | undefined {
    return el ? nested.get(el) : undefined;
}

function attach(el: HTMLElement) {
    if (nested.has(el)) return;
    const mode = el.dataset.smooth;
    const horizontal = mode === 'x' || mode === 'chips';
    const instance = new Lenis({
        wrapper: el,
        content: el,
        eventsTarget: el,
        orientation: horizontal ? 'horizontal' : 'vertical',
        gestureOrientation: mode === 'chips' ? 'both' : horizontal ? 'horizontal' : 'vertical',
        lerp: LERP,
        smoothWheel: true,
        // Read the size on demand: rows and lists grow as cards load.
        naiveDimensions: true,
        autoResize: false,
        // A strip with nothing to scroll leaves the wheel to the page.
        virtualScroll: () => (horizontal ? el.scrollWidth > el.clientWidth + 1 : el.scrollHeight > el.clientHeight + 1),
    });
    nested.set(el, instance);
    register(instance);
}

function detach(el: HTMLElement) {
    const instance = nested.get(el);
    if (!instance) return;
    nested.delete(el);
    unregister(instance);
    instance.destroy();
}

function attachWithin(node: Node) {
    if (!(node instanceof HTMLElement)) return;
    if (node.dataset.smooth) attach(node);
    node.querySelectorAll<HTMLElement>('[data-smooth]').forEach(attach);
}

/**
 * Eased page scrolling with Lenis (darkroomengineering/lenis), tuned for a
 * silky glide that still keeps up with the wheel (too low a lerp makes the
 * page trail behind it, which reads as lag), plus the nested scrollers above.
 * Disabled when the user prefers reduced motion. Also returns the page to the
 * top on every route change.
 */
export default function SmoothScroll() {
    const pathname = usePathname();

    useEffect(() => {
        if (prefersReducedMotion()) return;

        const instance = new Lenis({
            lerp: LERP,
            wheelMultiplier: 1,
            touchMultiplier: 1.4,
            // Smooth-scroll in-page anchor links too.
            anchors: true,
            // Scroll areas without their own Lenis keep scrolling on their own.
            allowNestedScroll: true,
            // A glide in progress stops when the user navigates away.
            stopInertiaOnNavigate: true,
        });
        lenis = instance;
        register(instance);

        // Nested scrollers: everything already on screen, then whatever mounts later.
        attachWithin(document.body);
        const observer = new MutationObserver(records => {
            for (const record of records) {
                record.addedNodes.forEach(attachWithin);
                if (record.removedNodes.length) {
                    nested.forEach((_, el) => { if (!el.isConnected) detach(el); });
                }
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });

        return () => {
            observer.disconnect();
            [...nested.keys()].forEach(detach);
            unregister(instance);
            instance.destroy();
            if (lenis === instance) lenis = null;
        };
    }, []);

    useEffect(() => {
        scrollPageTo(0, true);
    }, [pathname]);

    return null;
}
