'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import UpdateModal from '@/components/UpdateModal';

export type UpdateStatus = 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'uptodate' | 'error';

interface UpdateContextValue {
    status: UpdateStatus;
    /** Version offered by the update feed (empty until one is found). */
    newVersion: string;
    downloadPercent: number;
    error: string;
    appVersion: string;
    platform: string;
    /** User-initiated check (Settings). Always prompts if an update exists. */
    checkForUpdates: () => void;
}

const UpdateContext = createContext<UpdateContextValue | null>(null);

// How long the "Up to date" confirmation stays visible after a manual check.
const UP_TO_DATE_RESET_MS = 4000;

export function UpdateProvider({ children }: { children: React.ReactNode }) {
    const [status, setStatus] = useState<UpdateStatus>('idle');
    const [newVersion, setNewVersion] = useState('');
    const [downloadPercent, setDownloadPercent] = useState(0);
    const [error, setError] = useState('');
    const [appVersion, setAppVersion] = useState('');
    const [platform, setPlatform] = useState('');
    const [isPromptOpen, setIsPromptOpen] = useState(false);

    // A manual check always shows the prompt; background checks skip a version
    // the user already cancelled this session so they are not nagged every
    // interval. It is offered again on the next launch.
    const manualCheck = useRef(false);
    const dismissedVersion = useRef<string | null>(null);
    const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.electron) return;
        const electron = window.electron;

        electron.getAppVersion().then(setAppVersion);
        electron.getPlatform().then(setPlatform);

        // The preload bridge has no way to remove listeners, so they are
        // registered exactly once here for the lifetime of the app.
        electron.onUpdateAvailable((info) => {
            const wasManual = manualCheck.current;
            manualCheck.current = false;
            setNewVersion(info.version);
            setStatus((current) => (current === 'downloading' || current === 'downloaded' ? current : 'available'));
            if (wasManual || dismissedVersion.current !== info.version) {
                setIsPromptOpen(true);
            }
        });

        electron.onUpdateNotAvailable(() => {
            const wasManual = manualCheck.current;
            manualCheck.current = false;
            if (!wasManual) return;
            setStatus('uptodate');
            if (resetTimer.current) clearTimeout(resetTimer.current);
            resetTimer.current = setTimeout(() => setStatus('idle'), UP_TO_DATE_RESET_MS);
        });

        electron.onUpdateError((message) => {
            const wasManual = manualCheck.current;
            manualCheck.current = false;
            setError(message);
            // Silent background failures (offline, feed hiccup) should not
            // interrupt the user; only surface errors they can act on.
            setStatus((current) => (wasManual || current === 'downloading' ? 'error' : current));
        });

        electron.onDownloadProgress((progress) => {
            setStatus('downloading');
            setDownloadPercent(Math.round(progress.percent));
        });

        electron.onUpdateDownloaded(() => {
            setStatus('downloaded');
            setDownloadPercent(100);
            setIsPromptOpen(true);
            // Same behaviour as before: install automatically once downloaded.
            setTimeout(() => electron.quitAndInstall(), 2000);
        });

        // Check on every launch. The main process also re-checks periodically;
        // checking from here guarantees the listeners above are ready.
        electron.checkForUpdates();

        return () => {
            if (resetTimer.current) clearTimeout(resetTimer.current);
        };
    }, []);

    const checkForUpdates = useCallback(() => {
        if (typeof window === 'undefined' || !window.electron) return;
        if (status === 'checking' || status === 'downloading' || status === 'downloaded') return;
        // An update already found but cancelled: reopen the prompt directly.
        if (status === 'available') {
            setIsPromptOpen(true);
            return;
        }
        manualCheck.current = true;
        setError('');
        setStatus('checking');
        window.electron.checkForUpdates();
    }, [status]);

    const startDownload = useCallback(() => {
        if (!window.electron) return;
        setError('');
        setDownloadPercent(0);
        setStatus('downloading');
        window.electron.downloadUpdate();
    }, []);

    const cancelPrompt = useCallback(() => {
        dismissedVersion.current = newVersion || null;
        setIsPromptOpen(false);
        // A failed download can be retried later from Settings.
        setStatus((current) => (current === 'error' ? (newVersion ? 'available' : 'idle') : current));
    }, [newVersion]);

    return (
        <UpdateContext.Provider
            value={{ status, newVersion, downloadPercent, error, appVersion, platform, checkForUpdates }}
        >
            {children}
            <UpdateModal
                isOpen={isPromptOpen}
                status={status}
                version={newVersion}
                currentVersion={appVersion}
                downloadPercent={downloadPercent}
                error={error}
                onUpdate={startDownload}
                onCancel={cancelPrompt}
            />
        </UpdateContext.Provider>
    );
}

export function useUpdates(): UpdateContextValue {
    const context = useContext(UpdateContext);
    if (!context) throw new Error('useUpdates must be used within an UpdateProvider');
    return context;
}

/** Human-readable OS name for a Node `process.platform` value. */
export function platformLabel(platform: string): string {
    if (platform === 'win32') return 'Windows';
    if (platform === 'darwin') return 'macOS';
    if (platform === 'linux') return 'Linux';
    return platform;
}
