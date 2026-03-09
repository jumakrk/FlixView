import { fetchTrending } from '@/lib/tmdb';
import MovieCard from '@/components/MovieCard';

export default async function TrendingPage() {
    const trending = await fetchTrending();

    return (
        <div className="min-h-screen pt-24 pb-20 bg-black">
            <div className="px-[4%]">
                <h1 className="text-4xl font-bold mb-10 text-white">Trending Now</h1>
                <p className="text-gray-400 mb-8 max-w-2xl">
                    Discover what everyone is watching. From blockbuster movies to must-watch series, stay up to date with the latest trends.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {trending.map((movie) => (
                        <MovieCard key={movie.id} movie={movie} className="w-full" />
                    ))}
                </div>
            </div>
        </div>
    );
}
