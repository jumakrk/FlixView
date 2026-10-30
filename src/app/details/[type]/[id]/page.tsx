import DetailsClient from './DetailsClient';
import AnimeDetailsClient from '../../AnimeDetailsClient';

interface PageProps {
    params: Promise<{
        type: string;
        id: string;
    }>;
}

export function generateStaticParams() {
    return [{ type: 'movie', id: '1' }];
}

export default async function DetailsPage({ params }: PageProps) {
    const { type, id } = await params;

    if (type === 'anime') {
        return <AnimeDetailsClient id={id} />;
    }

    return <DetailsClient id={id} type={type} />;
}
