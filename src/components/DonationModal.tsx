'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import Link from 'next/link';

interface DonationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function DonationModal({ isOpen, onClose }: DonationModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!isOpen || !mounted) return null;

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
            <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="relative bg-[#1a1a1a] border border-white/10 p-8 rounded-2xl max-w-md w-full mx-4 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
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
                            <img
                                src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
                                alt="Buy Me A Coffee"
                                style={{ height: '60px', width: '217px' }}
                                className="rounded-lg shadow-lg"
                            />
                        </Link>
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
}
