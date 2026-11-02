'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Star, Tv } from 'lucide-react';
import WatchClient from '@/components/WatchClient';
import AnimeEpisodeList from '@/components/AnimeEpisodeList';
import InteractionButtons from '@/components/InteractionButtons';
import MovieCard from '@/components/MovieCard';
import {
    AniListMedia,
    animeEpisodeCount,
    animeToMovie,
    animeTitle,
    fetchAnimeById,
    fetchAnimeRecommendations,
    isAnimeMovie,
    stripAnimeHtml,
} from '@/lib/anilist';
import { resolveImageUrl } from '@/lib/images';

export default function AnimeWatchPageClient({ id }: { id: string }) {
    const searchParams = useSearchParams();
    const currentEpisode = parseInt(searchParams.get('episode') || '1', 10) || 1;

    const [media, setMedia] = useState<AniListMedia | null>(null);
    const [recommendations, setRecommendations] = useState<AniListMedia[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            try {
                const mediaData = await fetchAnimeById(id);
                if (cancelled) return;
                setMedia(mediaData);

                if (mediaData) {
                    const recommended = await fetchAnimeRecommendations(id);
                    if (!cancelled) setRecommendations(recommended);
                }
            } catch (error) {
                console.error('Failed to load anime playback:', error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="mt-4 text-violet-400 font-medium">Preparing playback...</span>
                </div>
            </div>
        );
    }

    if (!media) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
                <h1 className="text-2xl font-bold">Anime not found</h1>
                <p className="text-gray-400">AniList could not find an anime with ID {id}.</p>
            </div>
        );
    }

    const title = animeTitle(media);
    const movie = isAnimeMovie(media);
    const totalEpisodes = animeEpisodeCount(media);
    const poster = media.coverImage?.extraLarge || media.coverImage?.large;
    const backdrop = media.bannerImage || poster;
    const score = (media.averageScore ?? media.meanScore ?? 0) / 10;
    const formatLabel = (media.format || 'ANIME').replace(/_/g, ' ');

    return (
        <div className="min-h-screen bg-black text-white p-0 relative overflow-x-hidden">
            <div className="fixed inset-0 z-0">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-20 blur-3xl scale-110"
                    style={{ backgroundImage: `url(${resolveImageUrl(backdrop, 'original')})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-black/60" />
            </div>

            <div className="relative z-10 p-6 pt-0 max-w-[1600px] mx-auto">
                <WatchClient
                    id={id}
                    type="anime"
                    title={title}
                    posterPath={poster}
                    backdropPath={backdrop}
                    maxEpisode={totalEpisodes}
                    isAnimeMovie={movie}
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mt-8 px-2">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="flex flex-col md:flex-row gap-6 items-start bg-white/5 p-6 rounded-3xl border border-white/5 backdrop-blur-sm">
                            <div className="hidden md:block relative w-[140px] aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex-shrink-0">
                                <div
                                    className="absolute inset-0 bg-cover bg-center"
                                    style={{ backgroundImage: `url(${resolveImageUrl(poster, 'w500')})` }}
                                />
                            </div>

                            <div className="flex-1 space-y-4">
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                                        {title}
                                    </h1>

                                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-4 font-medium">
                                        {score > 0 && (
                                            <div className="flex items-center gap-1 text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-lg border border-yellow-500/20">
                                                <Star size={16} fill="currentColor" />
                                                <span className="text-yellow-500">{score.toFixed(1)}</span>
                                            </div>
                                        )}
                                        {media.seasonYear && <span>{media.seasonYear}</span>}
                                        <span className="flex items-center gap-1">
                                            <Tv size={16} /> {movie ? 'Movie' : `${totalEpisodes} Episodes`}
                                        </span>
                                        <span className="px-2 py-0.5 bg-white/10 rounded-md text-xs uppercase tracking-wider border border-white/10">{formatLabel}</span>
                                    </div>
                                </div>

                                <p className="text-gray-300 leading-relaxed text-lg font-light">
                                    {stripAnimeHtml(media.description) || 'No description available.'}
                                </p>

                                <div className="flex flex-wrap gap-2 pt-2">
                                    {media.genres?.map((genre) => (
                                        <span key={genre} className="text-xs px-3 py-1 bg-white/5 rounded-full text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white transition-colors cursor-default">
                                            {genre}
                                        </span>
                                    ))}
                                </div>

                                <div className="pt-2">
                                    <InteractionButtons
                                        contentId={media.id}
                                        mediaType="anime"
                                        title={title}
                                        poster={poster}
                                    />
                                </div>
                            </div>
                        </div>

                        {!movie && (
                            <div className="bg-white/5 rounded-3xl p-6 border border-white/5 backdrop-blur-sm">
                                <AnimeEpisodeList
                                    animeId={id}
                                    totalEpisodes={totalEpisodes}
                                    currentEpisode={currentEpisode}
                                    title={title}
                                    fallbackImage={backdrop}
                                    nextAiringEpisode={media.nextAiringEpisode}
                                    listClassName="max-h-[960px] overflow-y-auto pr-2"
                                />
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-xl font-bold sticky top-0 bg-black/90 py-2 z-10 backdrop-blur-xl">More Like This</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {recommendations.slice(0, 8).map((item) => (
                                <MovieCard
                                    key={item.id}
                                    movie={animeToMovie(item)}
                                    fullWidth
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
