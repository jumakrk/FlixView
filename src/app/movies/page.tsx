import { fetchPopularMovies, fetchNowPlaying, fetchUpcoming } from '@/lib/tmdb';
import SectionRow from '@/components/SectionRow';
import DiscoverFilters from '@/components/DiscoverFilters';
import ContentGrid from '@/components/ContentGrid';
import { Suspense } from 'react';
import PageHeader from '@/components/ui/PageHeader';

export default async function MoviesPage() {
    const popular = await fetchPopularMovies();
    const nowPlaying = await fetchNowPlaying();
    const upcoming = await fetchUpcoming();

    return (
        <div className="min-h-screen pb-20">
            <PageHeader eyebrow="Browse" title="Movies" subtitle="Now playing, coming soon, and the whole catalogue to explore." />

            {/* Curated Sections */}
            <div className="space-y-4 mb-16">
                <SectionRow title="Now Playing" movies={nowPlaying} />
                <SectionRow title="Upcoming" movies={upcoming} />
            </div>

            {/* Discover Section */}
            <div className="px-[4%] mt-20">
                <h2 className="text-3xl font-bold mb-6 text-gradient">Discover Movies</h2>
                <Suspense fallback={<div className="h-12 w-full animate-pulse bg-white/5 rounded-lg mb-8" />}>
                    <DiscoverFilters />
                </Suspense>

                <Suspense fallback={<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 w-full animate-pulse"><div className="aspect-[2/3] bg-white/5 rounded-lg" /></div>}>
                    <ContentGrid initialItems={popular} type="movie" />
                </Suspense>
            </div>
        </div>
    );
}
