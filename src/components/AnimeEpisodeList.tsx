'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Play } from 'lucide-react';
import { useData } from '@/context/DataContext';

interface AnimeEpisodeListProps {
    animeId: string;
    totalEpisodes: number;
    currentEpisode?: number;
    className?: string;
}

// Long-running shows can have 1000+ episodes; rendering every card would be
// wasteful. Everything up to this limit is rendered, and a jump box is offered
// for anything beyond it.
const MAX_RENDERED_EPISODES = 300;

export default function AnimeEpisodeList({
    animeId,
    totalEpisodes,
    currentEpisode,
    className
}: AnimeEpisodeListProps) {
    const router = useRouter();
    const { getProgress } = useData();
    const [jumpTo, setJumpTo] = useState('');

    const record = getProgress(animeId, 'anime');
    const count = Math.max(1, totalEpisodes);
    const rendered = Math.min(count, MAX_RENDERED_EPISODES);

    const episodes = useMemo(
        () => Array.from({ length: rendered }, (_, index) => index + 1),
        [rendered]
    );

    const handleJump = (event: React.FormEvent) => {
        event.preventDefault();
        const requested = parseInt(jumpTo, 10);
        if (!Number.isFinite(requested)) return;
        const episode = Math.min(count, Math.max(1, requested));
        router.push(`/watch?type=anime&id=${animeId}&season=1&episode=${episode}`);
    };

    return (
        <div className={className}>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                {episodes.map((episodeNumber) => {
                    const epProgress = record?.episodes?.[`s1e${episodeNumber}`];
                    const pct = epProgress && epProgress.duration_seconds > 0
                        ? Math.min(100, Math.max(0, (epProgress.watched_seconds / epProgress.duration_seconds) * 100))
                        : 0;
                    const isCurrent = currentEpisode === episodeNumber;

                    return (
                        <Link
                            key={episodeNumber}
                            href={`/watch?type=anime&id=${animeId}&season=1&episode=${episodeNumber}`}
                            className={`group relative rounded-xl border p-3 transition-all ${
                                isCurrent
                                    ? 'border-violet-500/60 bg-violet-600/20'
                                    : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10'
                            }`}
                            title={`Episode ${episodeNumber}`}
                        >
                            <div className="flex items-center justify-between gap-1 mb-2">
                                <span className="text-xs font-bold text-white/80">
                                    {episodeNumber}
                                </span>
                                <Play
                                    size={12}
                                    fill="currentColor"
                                    className="text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                />
                            </div>
                            <div className="h-1 rounded-full bg-black/40 overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-violet-500"
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                        </Link>
                    );
                })}
            </div>

            {count > MAX_RENDERED_EPISODES && (
                <form onSubmit={handleJump} className="mt-5 flex items-center gap-3">
                    <label htmlFor={`jump-${animeId}`} className="text-sm text-gray-400">
                        Jump to episode
                    </label>
                    <input
                        id={`jump-${animeId}`}
                        type="number"
                        min={1}
                        max={count}
                        value={jumpTo}
                        onChange={(event) => setJumpTo(event.target.value)}
                        placeholder={`1–${count}`}
                        className="w-28 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-violet-500"
                    />
                    <button
                        type="submit"
                        className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 transition-colors"
                    >
                        Go
                    </button>
                </form>
            )}
        </div>
    );
}
