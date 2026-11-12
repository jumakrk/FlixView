'use client';

import { X, Download, ArrowUpCircle, RefreshCw, AlertCircle } from 'lucide-react';
import type { UpdateStatus } from '@/context/UpdateContext';
import styles from './UpdateModal.module.css';
import { AnimatePresence, motion } from 'framer-motion';
import Glass from './ui/Glass';
import OriginPop from './ui/OriginPop';
import { useScrollLock } from '@/lib/useScrollLock';

interface UpdateModalProps {
    isOpen: boolean;
    status: UpdateStatus;
    version: string;
    currentVersion: string;
    downloadPercent: number;
    error: string;
    onUpdate: () => void;
    onCancel: () => void;
}

export default function UpdateModal({
    isOpen,
    status,
    version,
    currentVersion,
    downloadPercent,
    error,
    onUpdate,
    onCancel,
}: UpdateModalProps) {
    useScrollLock(isOpen);
    const isBusy = status === 'downloading' || status === 'downloaded';

    return (
        <AnimatePresence>
        {isOpen && (
        <motion.div
            className={styles.overlay}
            role="dialog"
            aria-modal="true"
            aria-labelledby="update-modal-title"
            data-lenis-prevent
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.24 } }}
        >
            <OriginPop className={styles.pop}>
            <Glass preset="panel" className={styles.modal}>
                <button onClick={onCancel} className={styles.closeBtn} disabled={isBusy} aria-label="Close">
                    <X size={20} />
                </button>

                <div className={styles.header}>
                    <div className={styles.iconContainer}>
                        {status === 'error'
                            ? <AlertCircle size={32} className="text-red-400" />
                            : <ArrowUpCircle size={32} className="text-violet-400" />}
                    </div>
                    <h2 id="update-modal-title" className={styles.title}>
                        {status === 'error' ? 'Update Failed' : 'Update Available'}
                    </h2>
                    <p className={styles.subtitle}>
                        {status === 'error'
                            ? 'The update could not be downloaded. Check your connection and try again.'
                            : <>
                                FlixView {version ? <strong className="text-white">v{version}</strong> : 'a new version'} is ready
                                {currentVersion ? <> (you have v{currentVersion})</> : null}. Update now to get the latest features and fixes.
                            </>}
                    </p>
                </div>

                <div className={styles.content}>
                    {(status === 'available' || status === 'error') && (
                        <div className={styles.actions}>
                            <button onClick={onUpdate} className={styles.primaryBtn}>
                                <Download size={18} />
                                {status === 'error' ? 'Try Again' : 'Update'}
                            </button>
                            <button onClick={onCancel} className={styles.secondaryBtn}>
                                Cancel
                            </button>
                        </div>
                    )}

                    {status === 'error' && error && (
                        <p className={styles.helpText}>{error}</p>
                    )}

                    {status === 'downloading' && (
                        <div className={styles.downloadSection}>
                            <div className={styles.progressHeader}>
                                <span>Downloading Update...</span>
                                <span>{downloadPercent}%</span>
                            </div>
                            <div className={styles.progressBar}>
                                <div
                                    className={styles.progressFill}
                                    style={{ width: `${downloadPercent}%` }}
                                />
                            </div>
                            <p className={styles.helpText}>Please don&apos;t close the app while downloading.</p>
                        </div>
                    )}

                    {status === 'downloaded' && (
                        <div className={styles.successSection}>
                            <RefreshCw size={24} className="animate-spin text-green-400 mx-auto mb-3" />
                            <h3 className="text-white font-medium text-lg">Update Ready!</h3>
                            <p className="text-zinc-400 text-sm mt-1">Restarting app automatically to install...</p>
                        </div>
                    )}
                </div>
            </Glass>
            </OriginPop>
        </motion.div>
        )}
        </AnimatePresence>
    );
}
