import DetailsClient from './DetailsClient';

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
    return <DetailsClient id={id} type={type} />;
}
