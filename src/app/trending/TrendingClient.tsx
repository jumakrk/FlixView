'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUp, CalendarDays, ChevronRight, Clock3, Film, Flame, Info, LayoutGrid, Minus, Star, Tv } from 'lucide-react';
import { fetchTrending, Movie } from '@/lib/tmdb';
import PlayButton from '@/components/PlayButton';
import PageHeader from '@/components/ui/PageHeader';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal';
import { cn } from '@/lib/utils';
import styles from './Trending.module.css';

type ChartWindow = 'day' | 'week';
type Kind = 'all' | 'movie' | 'tv';

const WINDOWS = [
    { value: 'day' as const, label: 'Today', icon: <Clock3 size={15} /> },
    { value: 'week' as const, label: 'This week', icon: <CalendarDays size={15} /> },
];

const KINDS = [
    { value: 'all' as const, label: 'All', icon: <LayoutGrid size={15} /> },
    { value: 'movie' as const, label: 'Movies', icon: <Film size={15} /> },
    { value: 'tv' as const, label: 'Series', icon: <Tv size={15} /> },
];

const IMG = 'https://image.tmdb.org/t/p/';

function art(item: Movie, size: string): string | null {
    const path = item.backdrop_path || item.poster_path;
    return path ? `${IMG}${size}${path}` : null;
}

function year(item: Movie): string {
    const date = item.release_date || item.first_air_date;
    return date ? String(new Date(date).getFullYear()) : '';
}

function itemKey(item: Movie): string {
    return `${item.media_type}-${item.id}`;
}

function detailsHref(item: Movie): string {
    return `/details?type=${item.media_type === 'tv' ? 'series' : 'movie'}&id=${item.id}`;
}

/**
 * Change since the other chart: positive climbed, negative fell, null is a
 * new entry, undefined means there is nothing to compare with.
 */
type Movement = number | null | undefined;

function MovementBadge({ movement, className }: { movement: Movement; className?: string }) {
    if (movement === undefined) return null;
    if (movement === null) {
        return <span className={cn(styles.move, styles.moveNew, className)}>New</span>;
    }
    if (movement === 0) {
        return <span className={cn(styles.move, styles.moveSame, className)} title="Same place as this week"><Minus size={13} /></span>;
    }
    const up = movement > 0;
    return (
        <span
            className={cn(styles.move, up ? styles.moveUp : styles.moveDown, className)}
            title={`${up ? 'Up' : 'Down'} ${Math.abs(movement)} on this week's chart`}
        >
            {up ? <ArrowUp size={13} strokeWidth={2.6} /> : <ArrowDown size={13} strokeWidth={2.6} />}
            {Math.abs(movement)}
        </span>
    );
}

function Meta({ item, movement }: { item: Movie; movement: Movement }) {
    return (
        <div className={styles.meta}>
            {item.vote_average > 0 && (
                <span className={styles.rating}><Star size={13} fill="currentColor" /> {item.vote_average.toFixed(1)}</span>
            )}
            {year(item) && <span>{year(item)}</span>}
            <span className={styles.kind}>{item.media_type === 'tv' ? 'Series' : 'Movie'}</span>
            <MovementBadge movement={movement} />
        </div>
    );
}

/** No. 1: a full-width cinematic banner. */
function Spotlight({ item, movement, windowLabel }: { item: Movie; movement: Movement; windowLabel: string }) {
    const image = art(item, 'w1280');
    const type = item.media_type === 'tv' ? 'tv' : 'movie';
    return (
        <section className={styles.spotlight}>
            {image && <div className={styles.spotlightArt} style={{ backgroundImage: `url(${image})` }} />}
            <div className={styles.spotlightShade} />
            <span className={styles.spotlightRank} aria-hidden="true">1</span>

            <div className={styles.spotlightCopy}>
                <span className={styles.badge}><Flame size={13} /> No. 1 {windowLabel}</span>
                <Link href={detailsHref(item)} className={styles.spotlightTitle}>{item.title || item.name}</Link>
                <Meta item={item} movement={movement} />
                {item.overview && <p className={styles.spotlightText}>{item.overview}</p>}
                <div className={styles.actions}>
                    <PlayButton
                        id={item.id}
                        type={type}
                        className="bg-white text-[#00332e] shadow-[0_10px_34px_rgba(255,255,255,0.22)] transition-transform hover:-translate-y-0.5"
                        releaseDate={item.release_date || item.first_air_date}
                    />
                    <Link href={detailsHref(item)} className={styles.ghost}>
                        <Info size={18} /> More info
                    </Link>
                </div>
            </div>
        </section>
    );
}

/** Nos. 2 to 4: wide artwork cards with the rank set large in the corner. */
function RunnerUp({ item, rank, movement }: { item: Movie; rank: number; movement: Movement }) {
    const image = art(item, 'w780');
    return (
        <Link href={detailsHref(item)} className={styles.runner}>
            <div className={styles.runnerArt}>
                {image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt="" loading="lazy" decoding="async" draggable={false} />
                )}
            </div>
            <div className={styles.runnerShade} />
            <span className={styles.runnerRank} aria-hidden="true">{rank}</span>
            <div className={styles.runnerCopy}>
                <h3 className={styles.runnerTitle}>{item.title || item.name}</h3>
                <Meta item={item} movement={movement} />
            </div>
        </Link>
    );
}

/** No. 5 onwards: one row of the chart. */
function ChartRow({ item, rank, movement }: { item: Movie; rank: number; movement: Movement }) {
    const image = art(item, 'w300');
    return (
        <Link href={detailsHref(item)} className={styles.row}>
            <span className={styles.rowRank}>{rank}</span>
            <div className={styles.rowArt}>
                {image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt="" loading="lazy" decoding="async" draggable={false} />
                )}
            </div>
            <div className={styles.rowCopy}>
                <h3 className={styles.rowTitle}>{item.title || item.name}</h3>
                <div className={styles.meta}>
                    {item.vote_average > 0 && (
                        <span className={styles.rating}><Star size={12} fill="currentColor" /> {item.vote_average.toFixed(1)}</span>
                    )}
                    {year(item) && <span>{year(item)}</span>}
                    <span className={styles.kind}>{item.media_type === 'tv' ? 'Series' : 'Movie'}</span>
                </div>
            </div>
            <MovementBadge movement={movement} className={styles.rowMove} />
            <ChevronRight size={18} className={styles.rowChevron} />
        </Link>
    );
}

export default function TrendingClient({ initialDay }: { initialDay: Movie[] }) {
    const [chart, setChart] = useState<ChartWindow>('day');
    const [kind, setKind] = useState<Kind>('all');
    const [lists, setLists] = useState<Partial<Record<ChartWindow, Movie[]>>>({ day: initialDay });

    // This week's chart loads in the background: it is the selectable second
    // chart and also what today's movement arrows compare against.
    useEffect(() => {
        if (lists.week) return;
        let cancelled = false;
        fetchTrending('week')
            .then(items => { if (!cancelled) setLists(previous => ({ ...previous, week: items })); })
            .catch(() => { if (!cancelled) setLists(previous => ({ ...previous, week: [] })); });
        return () => { cancelled = true; };
    }, [lists.week]);

    const loading = !lists[chart];

    const filter = useMemo(() => (list: Movie[] | undefined) => (list ?? [])
        .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
        .filter(item => kind === 'all' || item.media_type === kind), [kind]);

    const items = useMemo(() => filter(lists[chart]), [filter, lists, chart]);

    // Places on this week's chart (same filter), for today's movement arrows.
    const weekRanks = useMemo(() => {
        if (chart !== 'day' || !lists.week?.length) return null;
        return new Map(filter(lists.week).map((item, index) => [itemKey(item), index + 1]));
    }, [chart, filter, lists.week]);

    const movementOf = (item: Movie, rank: number): Movement => {
        if (!weekRanks) return undefined;
        const weekRank = weekRanks.get(itemKey(item));
        return weekRank === undefined ? null : weekRank - rank;
    };

    const [first, ...others] = items;
    const runners = others.slice(0, 3);
    const rest = others.slice(3);
    const viewKey = `${chart}-${kind}`;
    const windowLabel = chart === 'day' ? 'today' : 'this week';

    return (
        <div className="min-h-screen pb-24">
            <PageHeader
                eyebrow="Live chart"
                title="Trending Now"
                subtitle="What everyone is watching right now, ranked. Switch between today and this week, or focus on movies or series."
            >
                <div className={styles.controls}>
                    <SegmentedControl id="trend-window" options={WINDOWS} value={chart} onChange={setChart} />
                    <SegmentedControl id="trend-kind" size="sm" options={KINDS} value={kind} onChange={setKind} />
                </div>
            </PageHeader>

            <div className="px-[4%]">
                {loading && items.length === 0 ? (
                    <div className="flex flex-col gap-5">
                        <div className="skeleton h-[min(62vh,560px)] rounded-[32px]" />
                        <div className="grid gap-5 md:grid-cols-3">
                            {[0, 1, 2].map(index => <div key={index} className="skeleton aspect-[16/10] rounded-[26px]" />)}
                        </div>
                    </div>
                ) : items.length === 0 ? (
                    <p className="py-24 text-center text-white/50">Nothing trending here right now.</p>
                ) : (
                    // Keyed by the view, so switching charts plays the entrance again.
                    <div key={viewKey} className={styles.view}>
                        {first && <Spotlight item={first} movement={movementOf(first, 1)} windowLabel={windowLabel} />}

                        {runners.length > 0 && (
                            <div className={styles.runners}>
                                {runners.map((item, index) => (
                                    <RunnerUp key={itemKey(item)} item={item} rank={index + 2} movement={movementOf(item, index + 2)} />
                                ))}
                            </div>
                        )}

                        {rest.length > 0 && (
                            <>
                                <Reveal className={styles.chartHead}>
                                    <div>
                                        <h2 className="text-3xl font-bold text-gradient">The full chart</h2>
                                        <p className="mt-2 text-sm text-white/50">
                                            {weekRanks
                                                ? 'Arrows show each title\'s move against this week\'s chart.'
                                                : `${items.length} titles trending ${windowLabel}.`}
                                        </p>
                                    </div>
                                    <span className={styles.count}>{items.length} titles</span>
                                </Reveal>
                                <RevealGroup className={styles.chart}>
                                    {rest.map((item, index) => (
                                        <RevealItem key={itemKey(item)}>
                                            <ChartRow item={item} rank={index + 5} movement={movementOf(item, index + 5)} />
                                        </RevealItem>
                                    ))}
                                </RevealGroup>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
