'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import styles from './BackButton.module.css';

interface BackButtonProps {
    className?: string;
}

export default function BackButton({ className }: BackButtonProps) {
    const router = useRouter();

    return (
        <button
            onClick={() => router.back()}
            className={cn(styles.backBtn, className)}
            aria-label="Go back"
        >
            <ArrowLeft size={20} />
            <span>Back</span>
        </button>
    );
}
