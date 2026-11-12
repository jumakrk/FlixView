import { fetchPopularSeries, fetchAiringTodaySeries, fetchOnTheAirSeries } from '@/lib/tmdb';
import SectionRow from '@/components/SectionRow';
import DiscoverFilters from '@/components/DiscoverFilters';
import ContentGrid from '@/components/ContentGrid';
import { Suspense } from 'react';
import PageHeader from '@/components/ui/PageHeader';

export default async function SeriesPage() {
    const popular = await fetchPopularSeries();
    const airingToday = await fetchAiringTodaySeries();
    const onTheAir = await fetchOnTheAirSeries();

    return (
        <div className="min-h-screen pb-20">
            <PageHeader eyebrow="Browse" title="Series" subtitle="On the air now, coming soon, and every show worth a binge." />

            {/* Curated Sections */}
            <div className="space-y-4 mb-16">
                <SectionRow title="Airing Today" movies={airingToday} />
                <SectionRow title="On The Air" movies={onTheAir} />
            </div>

            {/* Discover Section */}
            <div className="px-[4%] mt-20">
                <h2 className="text-3xl font-bold mb-6 text-gradient">Discover Series</h2>
                <Suspense fallback={<div className="h-12 w-full animate-pulse bg-white/5 rounded-lg mb-8" />}>
                    <DiscoverFilters type="tv" />
                </Suspense>

                <Suspense fallback={<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 w-full animate-pulse"><div className="aspect-[2/3] bg-white/5 rounded-lg" /></div>}>
                    <ContentGrid initialItems={popular} type="tv" />
                </Suspense>
            </div>
        </div>
    );
}
