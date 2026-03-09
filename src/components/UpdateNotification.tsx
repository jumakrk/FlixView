'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, AlertCircle, X, ChevronRight } from 'lucide-react';
import styles from './UpdateNotification.module.css';

export default function UpdateNotification() {
    const [show, setShow] = useState(false);
    const [status, setStatus] = useState<'available' | 'downloading' | 'downloaded' | 'error'>('available');
    const [progress, setProgress] = useState(0);
    const [version, setVersion] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        // Only run in Electron environment
        if (typeof window === 'undefined' || !window.electron) return;

        window.electron.onUpdateAvailable((info) => {
            setVersion(info.version);
            setStatus('available');
            setShow(true);
        });

        window.electron.onDownloadProgress((progressObj) => {
            setStatus('downloading');
            setProgress(Math.round(progressObj.percent));
            if (!show) setShow(true);
        });

        window.electron.onUpdateDownloaded((info) => {
            setStatus('downloaded');
            setProgress(100);
            if (!show) setShow(true);
        });

        window.electron.onUpdateError((err) => {
            setError(err);
            setStatus('error');
            setTimeout(() => setShow(false), 5000);
        });

    }, []);

    const handleInstall = () => {
        if (window.electron) {
            window.electron.quitAndInstall();
        }
    };

    const handleClose = () => {
        setShow(false);
    };

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.9 }}
                    className={styles.notification}
                >
                    <div className={styles.header}>
                        <div className={styles.icon}>
                            {status === 'error' ? <AlertCircle size={20} /> : <Download size={20} />}
                        </div>
                        <h3 className={styles.title}>
                            {status === 'available' && 'Update Available'}
                            {status === 'downloading' && 'Downloading Update'}
                            {status === 'downloaded' && 'Update Ready'}
                            {status === 'error' && 'Update Error'}
                        </h3>
                    </div>

                    <div className={styles.content}>
                        {status === 'available' && `A new version (${version}) is available. It's downloading in the background.`}
                        {status === 'downloading' && `Downloading version ${version}...`}
                        {status === 'downloaded' && `Version ${version} has been downloaded and is ready to be installed.`}
                        {status === 'error' && `Failed to update: ${error}`}
                    </div>

                    {(status === 'downloading' || status === 'downloaded') && (
                        <div className={styles.progressWrapper}>
                            <div className="flex justify-between text-xs mb-1 opacity-70">
                                <span>{progress}%</span>
                                <span>{status === 'downloaded' ? 'Complete' : 'Downloading...'}</span>
                            </div>
                            <div className={styles.progressBar}>
                                <motion.div 
                                    className={styles.progressFill}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    <div className={styles.footer}>
                        {status === 'downloaded' ? (
                            <button onClick={handleInstall} className={styles.installButton}>
                                Restart and Install
                            </button>
                        ) : (
                            <button onClick={handleClose} className={styles.closeButton}>
                                {status === 'error' ? 'Close' : 'Dismiss'}
                            </button>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
