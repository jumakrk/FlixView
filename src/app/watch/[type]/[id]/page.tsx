import WatchPageClient from './WatchPageClient';

interface PageProps {
    params: Promise<{
        type: string;
        id: string;
    }>;
}

export function generateStaticParams() {
    return [{ type: 'movie', id: '1' }];
}

export default async function WatchPage({ params }: PageProps) {
    const { type, id } = await params;
    return <WatchPageClient id={id} type={type} />;
}
