'use client';

import {
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import styles from './ExpandableDescription.module.css';
import { AnimatePresence, motion } from 'framer-motion';
import OriginPop from './ui/OriginPop';
import { useScrollLock } from '@/lib/useScrollLock';

interface ExpandableDescriptionProps {
    /** Plain text description (HTML should already be stripped). */
    text?: string | null;
    /** Media title shown in the modal header. */
    title?: string;
    /** Class applied to the clamped wrapper, normally the page's overview style. */
    className?: string;
    /** Number of visible lines before the Read more control appears. */
    lines?: number;
    emptyText?: string;
}

// Layout effects warn during server rendering. The client gets the synchronous
// measurement (no visible jump); the server simply falls back to useEffect.
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default function ExpandableDescription({
    text,
    title,
    className,
    lines = 3,
    emptyText = 'No description available.',
}: ExpandableDescriptionProps) {
    const cleanText = text?.trim() ? text.trim() : emptyText;
    const [isOverflowing, setIsOverflowing] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const textRef = useRef<HTMLParagraphElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const headingId = useId();
    const bodyId = useId();

    // Only show the control when the text really needs more than `lines`.
    useIsomorphicLayoutEffect(() => {
        const element = textRef.current;
        if (!element) return;

        const measure = () => {
            const computed = window.getComputedStyle(element);
            const fontSize = Number.parseFloat(computed.fontSize) || 16;
            const lineHeight = Number.parseFloat(computed.lineHeight) || fontSize * 1.5;

            // Temporarily remove the clamp and measure the natural height. This
            // happens synchronously before paint on the client, so the clamped
            // paragraph never flashes at full height.
            const previous = {
                display: element.style.display,
                overflow: element.style.overflow,
                webkitLineClamp: element.style.webkitLineClamp,
                webkitBoxOrient: element.style.webkitBoxOrient,
            };

            element.style.display = 'block';
            element.style.overflow = 'visible';
            element.style.webkitLineClamp = 'none';
            element.style.webkitBoxOrient = 'horizontal';

            const fullHeight = element.scrollHeight;

            element.style.display = previous.display;
            element.style.overflow = previous.overflow;
            element.style.webkitLineClamp = previous.webkitLineClamp;
            element.style.webkitBoxOrient = previous.webkitBoxOrient;

            const clampedHeight = lineHeight > 0 ? lineHeight * lines : 0;
            setIsOverflowing(fullHeight > clampedHeight + 2);
        };

        measure();
        window.addEventListener('resize', measure);

        let cancelled = false;
        document.fonts?.ready
            .then(() => {
                if (!cancelled) measure();
            })
            .catch(() => {});

        return () => {
            cancelled = true;
            window.removeEventListener('resize', measure);
        };
    }, [cleanText, lines]);

    useScrollLock(isOpen);

    // Wire Escape / focus while the modal is open.
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            } else if (event.key === 'Tab') {
                // The modal only contains the close button, so keep focus there.
                event.preventDefault();
                closeButtonRef.current?.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 0);
        const trigger = triggerRef.current;

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            window.clearTimeout(focusTimer);
            if (trigger?.isConnected) trigger.focus();
        };
    }, [isOpen]);

    return (
        <>
            <div className={cn(styles.wrapper, className)}>
                <p
                    ref={textRef}
                    className={styles.text}
                    style={{ WebkitLineClamp: lines }}
                >
                    {cleanText}
                </p>

                {isOverflowing && (
                    <button
                        ref={triggerRef}
                        type="button"
                        className={styles.readMore}
                        onClick={() => setIsOpen(true)}
                        aria-haspopup="dialog"
                    >
                        <span className={styles.dots} aria-hidden="true">…</span>
                        Read more
                    </button>
                )}
            </div>

            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                {isOpen && (
                <motion.div
                    className={styles.overlay}
                    data-lenis-prevent
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.24 } }}
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) setIsOpen(false);
                    }}
                >
                    <OriginPop className={styles.pop}>
                    <div
                        className={styles.modal}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={headingId}
                        aria-describedby={bodyId}
                    >
                        <div className={styles.glow} aria-hidden="true" />

                        <header className={styles.header}>
                            <div>
                                <span className={styles.eyebrow}>Full description</span>
                                <h2 id={headingId} className={styles.modalTitle}>
                                    {title || 'Overview'}
                                </h2>
                            </div>
                            <button
                                ref={closeButtonRef}
                                type="button"
                                className={styles.close}
                                onClick={() => setIsOpen(false)}
                                aria-label="Close description"
                            >
                                <X size={20} />
                            </button>
                        </header>

                        <div id={bodyId} className={styles.body}>
                            <p>{cleanText}</p>
                        </div>
                    </div>
                    </OriginPop>
                </motion.div>
                )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}
