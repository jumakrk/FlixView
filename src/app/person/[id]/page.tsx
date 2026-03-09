import PersonClient from './PersonClient';

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export function generateStaticParams() {
    return [{ id: '1' }];
}

export default async function PersonPage({ params }: PageProps) {
    const { id } = await params;
    return <PersonClient id={id} />;
}
