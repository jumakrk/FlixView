'use client';

import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import Glass from './ui/Glass';
import OriginPop from './ui/OriginPop';
import { useScrollLock } from '@/lib/useScrollLock';

interface DonationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function DonationModal({ isOpen, onClose }: DonationModalProps) {
    useScrollLock(isOpen);
    // The portal needs a live document; static-export prerendering has none.
    if (typeof document === 'undefined') return null;

    return createPortal(
        <>
            <style jsx global>{`
                #donate-button img {
                    height: 60px !important;
                    width: 217px !important;
                    object-fit: contain;
                    border-radius: 0.5rem;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                }
            `}</style>
            <AnimatePresence>
            {isOpen && (
            <motion.div
                data-lenis-prevent
                className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/55"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.24 } }}
                onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
            >
                <OriginPop className="max-w-md w-full mx-4">
                <Glass preset="panel" className="p-8 rounded-[28px] w-full">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>

                    <h2 className="text-2xl font-bold text-center mb-2 text-white">Support FlixView</h2>
                    <p className="text-center text-gray-400 mb-8">Choose your preferred way to support us!</p>

                    <div className="space-y-6 flex flex-col items-center">
                        {/* PayPal Button Link */}
                        <a
                            href="https://www.paypal.com/donate/?hosted_button_id=6YYPN9NCB4DC8"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex justify-center w-full transform hover:scale-105 transition-transform duration-200"
                        >
                            {/* Third-party donation button artwork; next/image's
                                optimizer cannot be configured for these CDNs. */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="https://pics.paypal.com/00/s/ZThhYmNiZDktMzcwNC00MTgwLWIxNzgtM2YyNDVkMjM1ZDMx/file.PNG"
                                alt="Donate with PayPal"
                                style={{ height: '60px', width: '217px' }}
                                className="rounded-lg shadow-lg object-contain bg-white"
                            />
                        </a>

                        <div className="w-full h-px bg-white/10" />

                        {/* Buy Me a Coffee */}
                        <Link
                            href="https://buymeacoffee.com/flixview"
                            target="_blank"
                            className="transform hover:scale-105 transition-transform duration-200 block"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
                                alt="Buy Me A Coffee"
                                style={{ height: '60px', width: '217px' }}
                                className="rounded-lg shadow-lg"
                            />
                        </Link>
                    </div>
                </Glass>
                </OriginPop>
            </motion.div>
            )}
            </AnimatePresence>
        </>,
        document.body
    );
}
