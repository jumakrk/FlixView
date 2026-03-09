'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import OfflineOverlay from '@/components/OfflineOverlay';

interface ConnectivityContextType {
    isOnline: boolean;
    checkConnection: () => Promise<void>;
}

const ConnectivityContext = createContext<ConnectivityContextType | undefined>(undefined);

export function ConnectivityProvider({ children }: { children: ReactNode }) {
    const [isOnline, setIsOnline] = useState(true); // Default to true to prevent flash
    const [isChecking, setIsChecking] = useState(false);
    const [showToast, setShowToast] = useState(false);

    // Robust check using fetch
    const checkConnection = useCallback(async () => {
        if (!navigator.onLine) {
            setIsOnline(false);
            return;
        }

        setIsChecking(true);
        try {
            // Ping a reliable public endpoint or our own API
            // Using a simple fetch to our own domain is safest/fastest
            const res = await fetch('/icon.png', { method: 'HEAD', cache: 'no-store' });
            if (res.ok) {
                setIsOnline(true);
            } else {
                setIsOnline(false);
            }
        } catch (error) {
            // Fetch failed = offline
            setIsOnline(false);
        } finally {
            setIsChecking(false);
        }
    }, []);

    // Initial load and Event Listeners
    useEffect(() => {
        // Initial check
        checkConnection();

        const handleOnline = () => {
            // Browser thinks we are online, verify it
            checkConnection();
        };

        const handleOffline = () => {
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [checkConnection]);

    // Interval Check (every 30 seconds when idle/active)
    useEffect(() => {
        const intervalId = setInterval(() => {
            checkConnection();
        }, 30000); // 30s interval

        return () => clearInterval(intervalId);
    }, [checkConnection]);

    // Click/Interaction Listener
    useEffect(() => {
        const handleInteraction = () => {
            // Only check if we suspect issues or just strictly every click?
            // User requested "every time a button is clicked". 
            // To avoid spamming network, we can throttle this or checks navigator.onLine first.
            // But to be compliant with "checks if the device is connected", we'll run the check.
            // We'll limit it to only triggering if we haven't checked recently? 
            // For now, let's keep it simple: reliable check on click.
            checkConnection();
        };

        // Use 'click' - this covers buttons, links, etc.
        window.addEventListener('click', handleInteraction);

        return () => window.removeEventListener('click', handleInteraction);
    }, [checkConnection]);

    const handleRetry = async () => {
        await checkConnection();

        // After check, if still offline, show toast
        // We need a way to know the result of that specific check instantly
        // Re-checking state effectively:
        if (!navigator.onLine) { // Basic browser check failed immediately
            triggerToast();
        } else {
            // We can assume the async check will update state. 
            // Ideally we'd await the result. 
            // Let's modify checkConnection to return bool or use a ref, 
            // but strictly: if !isOnline stays true after check resolves.

            // Hack for immediate feedback in this function:
            try {
                const res = await fetch('/icon.png', { method: 'HEAD', cache: 'no-store' });
                if (!res.ok) triggerToast();
            } catch {
                triggerToast();
            }
        }
    };

    const triggerToast = () => {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    return (
        <ConnectivityContext.Provider value={{ isOnline, checkConnection }}>
            {children}
            {!isOnline && (
                <OfflineOverlay
                    onRetry={handleRetry}
                    isChecking={isChecking}
                    showToast={showToast}
                />
            )}
        </ConnectivityContext.Provider>
    );
}

export function useConnectivity() {
    const context = useContext(ConnectivityContext);
    if (context === undefined) {
        throw new Error('useConnectivity must be used within a ConnectivityProvider');
    }
    return context;
}
