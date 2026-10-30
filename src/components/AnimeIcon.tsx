'use client';

import React from 'react';

interface AnimeIconProps {
    size?: number;
    /** Lucide-equivalent stroke width (on a 24px grid) so it matches the other nav icons. */
    strokeWidth?: number;
    className?: string;
}

// Drawn on a 192 grid, so strokes scale by 8 to line up with 24px Lucide icons.
export default function AnimeIcon({ size = 24, strokeWidth = 2, className }: AnimeIconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 192 192"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth * 8}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M169.445 81.588A75 75 0 1 0 59.5 165.952" />
            <path d="M154.201 99.466a51.502 51.502 0 0 1-26.891 54.699 51.497 51.497 0 0 1-69.453-69.519 51.5 51.5 0 0 1 54.725-26.839" />
            <path d="M154.125 99.377a29.502 29.502 0 0 1-39.486-2.02 29.498 29.498 0 0 1-2.013-39.486" />
        </svg>
    );
}
