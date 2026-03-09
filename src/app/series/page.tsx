import { fetchPopularSeries, fetchAiringTodaySeries, fetchOnTheAirSeries } from '@/lib/tmdb';
import MovieCard from '@/components/MovieCard';
import SectionRow from '@/components/SectionRow';
import DiscoverFilters from '@/components/DiscoverFilters';
import ContentGrid from '@/components/ContentGrid';
import { Suspense } from 'react';

export default async function SeriesPage() {
    const popular = await fetchPopularSeries();
    const airingToday = await fetchAiringTodaySeries();
    const onTheAir = await fetchOnTheAirSeries();

    return (
        <div className="min-h-screen pt-24 pb-20 bg-black">
            <div className="px-[4%]">
                <h1 className="text-4xl font-bold mb-10 text-white">Series</h1>
            </div>

            {/* Curated Sections */}
            <div className="space-y-4 mb-16">
                <SectionRow title="Airing Today" movies={airingToday} />
                <SectionRow title="On The Air" movies={onTheAir} />
            </div>

            {/* Discover Section */}
            <div className="px-[4%] mt-20">
                <h2 className="text-2xl font-bold mb-6 text-white">Discover Series</h2>
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
