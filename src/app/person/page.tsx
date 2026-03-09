'use client';

import { useSearchParams } from 'next/navigation';
import PersonClient from './[id]/PersonClient';
import { Suspense } from 'react';

function PersonContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');

    if (!id) return <div className="p-10 text-center">Invalid ID</div>;

    return <PersonClient id={id} />;
}

export default function PersonPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black" />}>
            <PersonContent />
        </Suspense>
    );
}
