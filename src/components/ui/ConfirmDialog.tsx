'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Loader2, Trash2, X } from 'lucide-react';
import OriginPop from './OriginPop';
import { useScrollLock } from '@/lib/useScrollLock';
import { cn } from '@/lib/utils';

const EASE = [0.16, 1, 0.3, 1] as const;

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    /** The warning: what will be deleted and that it cannot be undone. */
    message: ReactNode;
    confirmLabel?: string;
    /** Seconds the confirm button stays locked after the dialog opens. */
    holdSeconds?: number;
    successTitle?: string;
    successMessage?: ReactNode;
    /** Runs the deletion. A thrown error is shown in the dialog. */
    onConfirm: () => Promise<void>;
    onClose: () => void;
}

/**
 * Destructive-action confirmation. The confirm button stays greyed out with a
 * countdown and a filling progress bar for `holdSeconds`, so nothing is
 * deleted on a reflex click. After the action runs, the dialog turns into a
 * success message. Opens from, and closes back into, the clicked control.
 */
export default function ConfirmDialog(props: ConfirmDialogProps) {
    useScrollLock(props.open);
    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {props.open && <DialogBody key="confirm" {...props} />}
        </AnimatePresence>,
        document.body
    );
}

type Phase = 'confirm' | 'working' | 'done' | 'error';

function DialogBody({
    title,
    message,
    confirmLabel = 'Delete',
    holdSeconds = 5,
    successTitle = 'Deleted',
    successMessage = 'Your data was removed from this device.',
    onConfirm,
    onClose,
}: ConfirmDialogProps) {
    const [phase, setPhase] = useState<Phase>('confirm');
    const [remaining, setRemaining] = useState(holdSeconds);
    const [error, setError] = useState('');
    const cancelRef = useRef<HTMLButtonElement>(null);
    const doneRef = useRef<HTMLButtonElement>(null);

    // Count down whole seconds; the bar on the button animates smoothly.
    useEffect(() => {
        const started = performance.now();
        const timer = window.setInterval(() => {
            const left = Math.max(0, holdSeconds - (performance.now() - started) / 1000);
            setRemaining(Math.ceil(left));
            if (left <= 0) window.clearInterval(timer);
        }, 100);
        return () => window.clearInterval(timer);
    }, [holdSeconds]);

    useEffect(() => {
        const focus = window.setTimeout(() => cancelRef.current?.focus(), 60);
        return () => window.clearTimeout(focus);
    }, []);

    useEffect(() => {
        if (phase === 'done') doneRef.current?.focus();
    }, [phase]);

    const busy = phase === 'working';
    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !busy) onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [busy, onClose]);

    const locked = remaining > 0;

    const confirm = async () => {
        if (locked || busy) return;
        setPhase('working');
        try {
            await onConfirm();
            setPhase('done');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong.');
            setPhase('error');
        }
    };

    return (
        <motion.div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-[rgba(2,6,5,0.78)] p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.25, delay: 0.05 } }}
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !busy) onClose();
            }}
        >
            <OriginPop
                className="relative w-full max-w-[440px] overflow-hidden rounded-[28px] border border-white/[0.09] bg-[rgba(9,19,17,0.96)] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.85)]"
            >
                <div
                    role="alertdialog"
                    aria-modal="true"
                    aria-labelledby="confirm-title"
                    aria-describedby="confirm-message"
                >
                    {/* Hairline accent along the top edge. */}
                    <div
                        className={cn(
                            'absolute inset-x-0 top-0 h-px transition-colors duration-500',
                            phase === 'done'
                                ? 'bg-gradient-to-r from-transparent via-[#8cc2b8] to-transparent'
                                : 'bg-gradient-to-r from-transparent via-[#f87171] to-transparent'
                        )}
                    />
                    <div
                        className={cn(
                            'pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full blur-3xl transition-colors duration-700',
                            phase === 'done' ? 'bg-[#2f8a7f]/30' : 'bg-red-500/[0.14]'
                        )}
                    />

                    {phase !== 'working' && phase !== 'done' && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="absolute right-4 top-4 z-10 rounded-full p-2 text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white"
                            aria-label="Close"
                        >
                            <X size={17} />
                        </button>
                    )}

                    <AnimatePresence mode="wait" initial={false}>
                        {phase === 'done' ? (
                            <motion.div
                                key="done"
                                className="relative flex flex-col items-center px-8 pb-8 pt-10 text-center"
                                initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
                                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                transition={{ duration: 0.5, ease: EASE }}
                            >
                                <SuccessMark />
                                <h3 id="confirm-title" className="mt-6 text-[22px] font-bold tracking-tight text-white">
                                    {successTitle}
                                </h3>
                                <p id="confirm-message" className="mt-2 max-w-[320px] text-[14.5px] leading-relaxed text-white/60">
                                    {successMessage}
                                </p>
                                <button
                                    ref={doneRef}
                                    type="button"
                                    data-ripple
                                    onClick={onClose}
                                    className="mt-8 w-full rounded-2xl bg-[#f0ede4] py-3.5 text-sm font-bold text-[#00332e] shadow-[0_10px_30px_-8px_rgba(240,237,228,0.45)] transition-transform duration-300 hover:scale-[1.015] active:scale-[0.98]"
                                >
                                    Done
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="confirm"
                                className="relative flex flex-col items-center px-8 pb-8 pt-10 text-center"
                                exit={{ opacity: 0, y: -10, filter: 'blur(6px)', transition: { duration: 0.22 } }}
                            >
                                <motion.div
                                    className="flex h-16 w-16 items-center justify-center rounded-[20px] border border-red-400/20 bg-gradient-to-b from-red-500/20 to-red-500/[0.04] text-red-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                                    initial={{ rotate: -8, scale: 0.8 }}
                                    animate={{ rotate: 0, scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.08 }}
                                >
                                    <AlertTriangle size={28} strokeWidth={2.2} />
                                </motion.div>
                                <h3 id="confirm-title" className="mt-6 text-[22px] font-bold tracking-tight text-white">
                                    {title}
                                </h3>
                                <div id="confirm-message" className="mt-2.5 text-[14.5px] leading-relaxed text-white/60">
                                    {message}
                                </div>

                                <div className="mt-5 flex w-full items-start gap-3 rounded-2xl border border-red-400/15 bg-red-500/[0.07] px-4 py-3 text-left text-[13px] leading-snug text-red-200/85">
                                    <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-300" />
                                    <span>This is permanent. Deleted data cannot be recovered unless you exported a backup.</span>
                                </div>

                                {phase === 'error' && (
                                    <p className="mt-4 text-[13px] font-medium text-red-300">{error}</p>
                                )}

                                <div className="mt-7 flex w-full gap-3">
                                    <button
                                        ref={cancelRef}
                                        type="button"
                                        data-ripple
                                        onClick={onClose}
                                        disabled={busy}
                                        className="flex-1 rounded-2xl border border-white/10 bg-white/[0.05] py-3.5 text-sm font-semibold text-white/85 transition-colors hover:bg-white/[0.1] hover:text-white disabled:opacity-40"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={confirm}
                                        disabled={locked || busy}
                                        aria-disabled={locked || busy}
                                        data-ripple={locked ? undefined : true}
                                        className={cn(
                                            'relative flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-2xl py-3.5 text-sm font-bold transition-all duration-500',
                                            locked
                                                ? 'cursor-not-allowed border border-white/[0.07] bg-white/[0.04] text-white/35'
                                                : 'border border-red-400/40 bg-gradient-to-b from-[#e5484d] to-[#c4363b] text-white shadow-[0_12px_30px_-10px_rgba(229,72,77,0.65)] hover:brightness-110 active:scale-[0.98]'
                                        )}
                                    >
                                        {/* Progress: fills left to right while the button is locked. */}
                                        <AnimatePresence>
                                            {locked && (
                                                <motion.span
                                                    className="absolute inset-y-0 left-0 w-full origin-left bg-gradient-to-r from-red-500/10 to-red-400/25"
                                                    initial={{ scaleX: 0 }}
                                                    animate={{ scaleX: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{ duration: holdSeconds, ease: 'linear' }}
                                                />
                                            )}
                                        </AnimatePresence>
                                        <span className="relative flex items-center gap-2">
                                            {busy ? (
                                                <><Loader2 size={16} className="animate-spin" /> Deleting</>
                                            ) : locked ? (
                                                <>
                                                    <CountdownRing seconds={holdSeconds} remaining={remaining} />
                                                    {confirmLabel} in {remaining}s
                                                </>
                                            ) : (
                                                <><Trash2 size={16} /> {confirmLabel}</>
                                            )}
                                        </span>
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </OriginPop>
        </motion.div>
    );
}

/** Small ring that empties as the countdown runs. */
function CountdownRing({ seconds, remaining }: { seconds: number; remaining: number }) {
    const r = 7;
    const c = 2 * Math.PI * r;
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" className="-rotate-90" aria-hidden>
            <circle cx="9" cy="9" r={r} fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
            <circle
                cx="9"
                cy="9"
                r={r}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={c}
                strokeDashoffset={c * (1 - remaining / seconds)}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
        </svg>
    );
}

/** Animated check: the ring draws, then the tick. */
function SuccessMark() {
    return (
        <motion.div
            className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-b from-[#0d6b61] to-[#004741] text-[#f0ede4] shadow-[0_18px_50px_-12px_rgba(31,128,115,0.8),inset_0_1px_0_rgba(240,237,228,0.25)]"
            initial={{ scale: 0.4 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 15 }}
        >
            <motion.span
                className="absolute inset-0 rounded-full border border-[#8cc2b8]/50"
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 1.7, opacity: 0 }}
                transition={{ duration: 1.1, ease: 'easeOut', delay: 0.15 }}
            />
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden>
                <motion.path
                    d="M5 12.5l4.5 4.5L19 7.5"
                    stroke="currentColor"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.45, ease: 'easeOut', delay: 0.2 }}
                />
            </svg>
        </motion.div>
    );
}
