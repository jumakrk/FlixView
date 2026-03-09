'use client';

import { WifiOff, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

interface OfflineOverlayProps {
    onRetry: () => void;
    isChecking: boolean;
    showToast: boolean;
}

export default function OfflineOverlay({ onRetry, isChecking, showToast }: OfflineOverlayProps) {
    if (typeof window === 'undefined') return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-[#0f0b1e] flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="flex flex-col items-center max-w-md text-center space-y-6">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <WifiOff size={48} className="text-red-500" />
                </div>

                <h2 className="text-3xl font-bold text-white">No Internet Connection</h2>
                <p className="text-white/60 text-lg">
                    It seems you are not connected to the internet. Please check your connection and try again.
                </p>

                <button
                    onClick={onRetry}
                    disabled={isChecking}
                    className="mt-8 px-8 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <RefreshCw size={20} className={isChecking ? "animate-spin" : ""} />
                    {isChecking ? 'Checking...' : 'Retry Connection'}
                </button>
            </div>

            {/* Transient Toast Message */}
            {showToast && (
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-red-500/10 border border-red-500/20 text-red-200 px-6 py-3 rounded-lg shadow-xl backdrop-blur-md animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <div className="flex items-center gap-2">
                        <WifiOff size={16} />
                        <span>No internet connection available</span>
                    </div>
                </div>
            )}
        </div>
    );
}
