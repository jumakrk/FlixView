'use client';

import { useState, useEffect } from 'react';
import { fetchDetails, fetchCredits, fetchSimilar } from '@/lib/tmdb';
import WatchClient from '@/components/WatchClient';
import { Star, Clock, Tv } from 'lucide-react';
import Image from 'next/image';
import InteractionButtons from '@/components/InteractionButtons';
import SeasonSelector from '@/components/SeasonSelector';
import Link from 'next/link';

export default function WatchPageClient({ id, type }: { id: string; type: string }) {
    const mediaType = (type === 'series' || type === 'tv') ? 'tv' : 'movie';
    const numericId = parseInt(id);

    const [details, setDetails] = useState<any>(null);
    const [credits, setCredits] = useState<any[]>([]);
    const [similar, setSimilar] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const [detailsData, creditsData, similarData] = await Promise.all([
                    fetchDetails(id, mediaType),
                    fetchCredits(id, mediaType),
                    fetchSimilar(id, mediaType)
                ]);

                setDetails(detailsData);
                setCredits(creditsData);
                setSimilar(similarData);
            } catch (error) {
                console.error('Failed to fetch watch details:', error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [id, mediaType]);

    if (loading || !details) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="mt-4 text-violet-400 font-medium">Preparing playback...</span>
                </div>
            </div>
        );
    }

    const releaseYear = details.release_date
        ? new Date(details.release_date).getFullYear()
        : details.first_air_date
            ? new Date(details.first_air_date).getFullYear()
            : 'N/A';

    const imageBaseUrl = 'https://image.tmdb.org/t/p/w200';
    const profileBaseUrl = 'https://image.tmdb.org/t/p/w185';
    const backdropBaseUrl = 'https://image.tmdb.org/t/p/original';

    return (
        <div className="min-h-screen bg-black text-white p-0 relative overflow-x-hidden">
            {/* Background Backdrop with Gradient */}
            <div className="fixed inset-0 z-0">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-20 blur-3xl scale-110"
                    style={{ backgroundImage: `url(${backdropBaseUrl}${details.backdrop_path})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-black/60" />
            </div>

            <div className="relative z-10 p-6 pt-0 max-w-[1600px] mx-auto">
                {/* Player Section */}
                <WatchClient
                    id={id}
                    type={mediaType}
                    title={details.title || details.name || ''}
                    posterPath={details.poster_path}
                    backdropPath={details.backdrop_path}
                />

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mt-8 px-2">
                    {/* Main Details Column */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="flex flex-col md:flex-row gap-6 items-start bg-white/5 p-6 rounded-3xl border border-white/5 backdrop-blur-sm">
                            {/* Poster */}
                            <div className="hidden md:block relative w-[140px] aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex-shrink-0 group">
                                {details.poster_path ? (
                                    <Image
                                        src={`${imageBaseUrl}${details.poster_path}`}
                                        alt={details.title || details.name || 'Poster'}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        className="object-cover transition-transform group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                        <span className="text-gray-500 text-xs">No Image</span>
                                    </div>
                                )}
                            </div>

                            {/* Metadata */}
                            <div className="flex-1 space-y-4">
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                                        {details.title || details.name}
                                    </h1>

                                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-4 font-medium">
                                        <div className="flex items-center gap-1 text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-lg border border-yellow-500/20">
                                            <Star size={16} fill="currentColor" />
                                            <span className="text-yellow-500">{details.vote_average.toFixed(1)}</span>
                                        </div>
                                        <span>{releaseYear}</span>
                                        {details.runtime ? (
                                            <span className="flex items-center gap-1"><Clock size={16} /> {Math.floor(details.runtime / 60)}h {details.runtime % 60}m</span>
                                        ) : details.number_of_seasons ? (
                                            <span className="flex items-center gap-1"><Tv size={16} /> {details.number_of_seasons} Seasons</span>
                                        ) : null}
                                        <span className="px-2 py-0.5 bg-white/10 rounded-md text-xs uppercase tracking-wider border border-white/10">{mediaType === 'tv' ? 'Series' : 'Movie'}</span>
                                    </div>
                                </div>

                                <p className="text-gray-300 leading-relaxed text-lg font-light">
                                    {details.overview}
                                </p>

                                <div className="flex flex-wrap gap-2 pt-2">
                                    {details.genres?.map((g: any) => (
                                        <span key={g.id} className="text-xs px-3 py-1 bg-white/5 rounded-full text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white transition-colors cursor-default">
                                            {g.name}
                                        </span>
                                    ))}
                                </div>

                                <div className="pt-2">
                                    <InteractionButtons
                                        contentId={numericId}
                                        mediaType={mediaType}
                                        title={details.title || details.name}
                                        poster={details.poster_path}
                                        showFavorite={true}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Top Cast Rail - Moved above Series Episodes */}
                        {credits && credits.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold flex items-center gap-2">Top Cast</h3>
                                <div className="flex gap-4 overflow-x-auto pb-4 snap-x [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                    {credits.map((person) => (
                                        <Link key={person.id} href={`/person?id=${person.id}`} className="min-w-[120px] w-[120px] snap-start group flex flex-col items-center">
                                            <div className="relative w-full aspect-square rounded-full overflow-hidden mb-3 bg-white/5 border border-white/5 ring-2 ring-white/5 group-hover:ring-[#7c3aed] transition-all">
                                                <Image
                                                    src={person.profile_path ? `${profileBaseUrl}${person.profile_path}` : '/placeholder-avatar.svg'}
                                                    alt={person.name}
                                                    fill
                                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                    className="object-cover transition-transform group-hover:scale-110"
                                                />
                                            </div>
                                            <p className="font-semibold text-sm truncate w-full text-center group-hover:text-[#7c3aed] transition-colors">{person.name}</p>
                                            <p className="text-xs text-gray-500 truncate w-full text-center">{person.character}</p>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Series Episodes Selector - Moved below Top Cast */}
                        {mediaType === 'tv' && details.seasons && (
                            <div className="bg-white/5 rounded-3xl p-6 border border-white/5 backdrop-blur-sm">
                                <SeasonSelector
                                    seriesId={id}
                                    seasons={details.seasons.filter((s: any) => s.season_number > 0 && s.episode_count > 0)}
                                    listClassName="max-h-[960px] overflow-y-auto pr-2"
                                />
                            </div>
                        )}
                    </div>

                    {/* Sidebar Column: Similar Content */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold sticky top-0 bg-black/90 py-2 z-10 backdrop-blur-xl">More Like This</h3>
                        <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                            {similar && similar.slice(0, 11).map((item: any) => (
                                <Link key={item.id} href={`/watch?type=${mediaType}&id=${item.id}`} className="group flex gap-4 items-center bg-white/5 p-3 rounded-2xl hover:bg-white/10 transition-all border border-transparent hover:border-white/10">
                                    <div className="relative w-20 aspect-[2/3] rounded-lg overflow-hidden flex-shrink-0 bg-black/40">
                                        {item.poster_path ? (
                                            <Image
                                                src={`${imageBaseUrl}${item.poster_path}`}
                                                alt={item.title || item.name}
                                                fill
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                className="object-cover"
                                            />
                                        ) : <div className="w-full h-full bg-white/10" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-sm truncate group-hover:text-[#7c3aed] transition-colors">{item.title || item.name}</h4>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                            <span className="flex items-center gap-1 text-yellow-500"><Star size={10} fill="currentColor" /> {item.vote_average.toFixed(1)}</span>
                                            <span>•</span>
                                            <span>{item.release_date ? new Date(item.release_date).getFullYear() : (item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'N/A')}</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
