'use client';

import { useState, useEffect } from 'react';

interface CountdownProps {
    targetDate: string;
    className?: string;
    compact?: boolean;
}

export default function Countdown({ targetDate, className, compact }: CountdownProps) {
    const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = +new Date(targetDate) - +new Date();
            if (difference <= 0) return null;

            return {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        };

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        setTimeLeft(calculateTimeLeft());
        return () => clearInterval(timer);
    }, [targetDate]);

    if (!timeLeft) return null;

    if (compact) {
        return (
            <div className={`flex items-center gap-1 font-mono text-[11px] font-bold text-white/90 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10 ${className || ''}`}>
                <span>{timeLeft.days}d</span>
                <span className="opacity-40 text-[9px]">:</span>
                <span>{timeLeft.hours}h</span>
                <span className="opacity-40 text-[9px]">:</span>
                <span>{timeLeft.minutes}m</span>
            </div>
        );
    }

    const CounterItem = ({ value, label }: { value: number; label: string }) => (
        <div className="flex flex-col items-center">
            <span className="text-2xl md:text-4xl font-black tracking-tighter text-white leading-none">
                {String(value).padStart(2, '0')}
            </span>
            <span className="text-[8px] md:text-[10px] uppercase font-bold tracking-[0.15em] text-white/40 mt-1.5">
                {label}
            </span>
        </div>
    );

    return (
        <div className={`flex items-start gap-3 md:gap-5 ${className || ''}`}>
            <CounterItem value={timeLeft.days} label="Days" />
            <span className="text-xl md:text-2xl font-light text-white/20 mt-1">:</span>
            <CounterItem value={timeLeft.hours} label="Hours" />
            <span className="text-xl md:text-2xl font-light text-white/20 mt-1">:</span>
            <CounterItem value={timeLeft.minutes} label="Mins" />
            <span className="text-xl md:text-2xl font-light text-white/20 mt-1">:</span>
            <CounterItem value={timeLeft.seconds} label="Secs" />
        </div>
    );
}
