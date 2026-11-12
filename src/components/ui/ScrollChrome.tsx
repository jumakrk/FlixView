'use client';

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import { useState } from 'react';
import { scrollPageTo } from './SmoothScroll';

/** A "back to top" button that appears once the page has been scrolled. */
export default function ScrollChrome() {
    const { scrollY } = useScroll();
    const [showTop, setShowTop] = useState(false);

    useMotionValueEvent(scrollY, 'change', (value) => {
        // React skips the re-render when the value is unchanged.
        setShowTop(value > 700);
    });

    return (
        <AnimatePresence>
            {showTop && (
                <motion.div
                    className="fixed bottom-7 right-7 z-[900]"
                    initial={{ opacity: 0, y: 18, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 18, scale: 0.8 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                >
                    <button
                        type="button"
                        onClick={() => scrollPageTo(0)}
                        aria-label="Back to top"
                        className="glass-panel flex h-12 w-12 items-center justify-center rounded-full text-white transition-transform duration-300 hover:-translate-y-1 hover:border-violet-300/50"
                    >
                        <ArrowUp size={20} />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
