'use client';

import { X, Download, ArrowUpCircle, AlertCircle, RefreshCw } from 'lucide-react';
import styles from './UpdateModal.module.css';

interface UpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdateNow: () => void;
    status: 'none' | 'available' | 'downloading' | 'downloaded';
    downloadPercent: number;
    version: string;
}

export default function UpdateModal({
    isOpen,
    onClose,
    onUpdateNow,
    status,
    downloadPercent,
    version
}: UpdateModalProps) {
    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <button onClick={onClose} className={styles.closeBtn} disabled={status === 'downloading'}>
                    <X size={20} />
                </button>

                <div className={styles.header}>
                    <div className={styles.iconContainer}>
                        <ArrowUpCircle size={32} className="text-violet-400" />
                    </div>
                    <h2 className={styles.title}>Update Available</h2>
                    <p className={styles.subtitle}>
                        A new version of FlixView is ready to install! Keep your app up to date to enjoy the latest features and bug fixes.
                    </p>
                </div>

                <div className={styles.content}>
                    {status === 'available' && (
                        <div className={styles.actions}>
                            <button onClick={onUpdateNow} className={styles.primaryBtn}>
                                <Download size={18} />
                                Update Now
                            </button>
                            <button onClick={onClose} className={styles.secondaryBtn}>
                                Update Later
                            </button>
                        </div>
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
                            <p className={styles.helpText}>Please don't close the app while downloading.</p>
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
            </div>
        </div>
    );
}
