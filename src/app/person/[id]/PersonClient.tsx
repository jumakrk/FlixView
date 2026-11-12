'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import { Cake, ChevronDown, Clapperboard, Film, Flower2, LayoutGrid, MapPin, Star, Tv, User } from 'lucide-react';
import { fetchPersonCredits, fetchPersonDetails, Movie, PersonCredits, PersonDetails } from '@/lib/tmdb';
import MovieCard from '@/components/MovieCard';
import BackButton from '@/components/BackButton';
import ExpandableDescription from '@/components/ExpandableDescription';
import Rail from '@/components/ui/Rail';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { Reveal } from '@/components/ui/Reveal';
import { cn } from '@/lib/utils';

const EASE = [0.16, 1, 0.3, 1] as const;
const PROFILE = 'https://image.tmdb.org/t/p/h632';
const BACKDROP = 'https://image.tmdb.org/t/p/w1280';
const THUMB = 'https://image.tmdb.org/t/p/w154';

type Credit = Movie & { character?: string; job?: string };
type Kind = 'all' | 'movie' | 'tv';

const KINDS = [
    { value: 'all' as const, label: 'All', icon: <LayoutGrid size={14} /> },
    { value: 'movie' as const, label: 'Movies', icon: <Film size={14} /> },
    { value: 'tv' as const, label: 'Series', icon: <Tv size={14} /> },
];

const FILMOGRAPHY_STEP = 30;

function creditDate(credit: Credit) {
    return credit.release_date || credit.first_air_date || '';
}

function formatDate(value: string) {
    return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function yearsBetween(from: string, to: number) {
    const start = new Date(from);
    const end = new Date(to);
    let age = end.getFullYear() - start.getFullYear();
    if (end.getMonth() < start.getMonth() || (end.getMonth() === start.getMonth() && end.getDate() < start.getDate())) age -= 1;
    return age;
}

/** Acting roles for actors; their crew jobs for directors, writers, etc. */
function pickCredits(person: PersonDetails, credits: PersonCredits | null): Credit[] {
    if (!credits) return [];
    const acting = person.known_for_department === 'Acting';
    const source: Credit[] = acting || !credits.crew?.length ? credits.cast : credits.crew;
    // One entry per title (crew lists repeat a title for each job).
    const unique = new Map<string, Credit>();
    for (const credit of source) {
        const key = `${credit.media_type}-${credit.id}`;
        const existing = unique.get(key);
        if (!existing) unique.set(key, { ...credit });
        else if (credit.job && existing.job && !existing.job.includes(credit.job)) existing.job = `${existing.job}, ${credit.job}`;
    }
    // Talk shows and award ceremonies flood the list with self appearances.
    return [...unique.values()].filter(credit => !/^(self|himself|herself|themselves)\b/i.test(credit.character ?? ''));
}

export default function PersonClient({ id }: { id: string }) {
    const [person, setPerson] = useState<PersonDetails | null>(null);
    const [credits, setCredits] = useState<PersonCredits | null>(null);
    const [loading, setLoading] = useState(true);
    const [today] = useState(() => Date.now());

    useEffect(() => {
        let cancelled = false;
        Promise.all([fetchPersonDetails(id), fetchPersonCredits(id)])
            .then(([details, creditData]) => {
                if (cancelled) return;
                setPerson(details);
                setCredits(creditData);
            })
            .catch(error => console.error('Failed to fetch person details:', error))
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [id]);

    if (loading) return <PersonSkeleton />;
    if (!person) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
                <User size={44} className="text-white/25" />
                <p className="text-lg text-white/60">This profile could not be loaded.</p>
                <BackButton />
            </div>
        );
    }

    return <PersonView person={person} credits={pickCredits(person, credits)} today={today} />;
}

function PersonView({ person, credits, today }: { person: PersonDetails; credits: Credit[]; today: number }) {
    const [kind, setKind] = useState<Kind>('all');
    const [shown, setShown] = useState(FILMOGRAPHY_STEP);

    const { scrollY } = useScroll();
    const backdropY = useTransform(scrollY, [0, 700], [0, 160]);
    const backdropOpacity = useTransform(scrollY, [0, 600], [1, 0.25]);

    // Best known: most voted titles with artwork.
    const knownFor = useMemo(
        () => [...credits].filter(c => c.poster_path).sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0)).slice(0, 16),
        [credits]
    );
    const backdrop = knownFor.find(c => c.backdrop_path)?.backdrop_path;

    const counts = useMemo(() => ({
        all: credits.length,
        movie: credits.filter(c => c.media_type === 'movie').length,
        tv: credits.filter(c => c.media_type === 'tv').length,
    }), [credits]);

    const years = credits.map(c => creditDate(c).slice(0, 4)).filter(Boolean).map(Number).sort((a, b) => a - b);
    const rated = knownFor.filter(c => c.vote_count > 50);
    const avgRating = rated.length ? rated.reduce((sum, c) => sum + c.vote_average, 0) / rated.length : 0;

    // Filmography: newest first; upcoming (undated) titles lead.
    const filmography = useMemo(
        () => credits
            .filter(c => kind === 'all' || c.media_type === kind)
            .sort((a, b) => (creditDate(b) || '9999').localeCompare(creditDate(a) || '9999')),
        [credits, kind]
    );

    const age = person.birthday ? yearsBetween(person.birthday, person.deathday ? new Date(person.deathday).getTime() : today) : null;
    // Career: first credit, and years on screen up to their latest released
    // title (announced future titles do not count).
    const thisYear = new Date(today).getFullYear();
    const debut = years[0];
    const lastReleased = years.filter(year => year <= thisYear).pop() ?? debut;
    const onScreen = debut ? Math.max(0, lastReleased - debut) : 0;
    const stats = [
        { label: 'Credits', value: String(credits.length), note: `${counts.movie} films · ${counts.tv} series` },
        debut ? { label: 'Debut', value: String(debut), note: onScreen > 0 ? `${onScreen} ${onScreen === 1 ? 'year' : 'years'} on screen` : 'First credit' } : null,
        avgRating ? { label: 'Avg. rating', value: avgRating.toFixed(1), note: 'Across best known' } : null,
        age !== null ? { label: person.deathday ? 'Aged' : 'Age', value: String(age), note: person.deathday ? `${new Date(person.birthday!).getFullYear()} to ${new Date(person.deathday).getFullYear()}` : `Born ${new Date(person.birthday!).getFullYear()}` } : null,
    ].filter(Boolean) as { label: string; value: string; note: string }[];

    return (
        <div className="relative min-h-screen pb-24">
            {/* Cinematic backdrop from their best-known title. */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[78vh] overflow-hidden">
                {backdrop && (
                    <motion.div
                        className="absolute inset-0 will-change-transform"
                        style={{ y: backdropY, opacity: backdropOpacity }}
                        initial={{ scale: 1.08, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 1.6, ease: EASE }}
                    >
                        <div
                            className="absolute inset-0 bg-cover bg-center opacity-45 saturate-[0.85] [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_55%,transparent)]"
                            style={{ backgroundImage: `url(${BACKDROP}${backdrop})` }}
                        />
                    </motion.div>
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-[#040b0a]/30 via-[#040b0a]/75 to-[#040b0a]" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#040b0a] via-[#040b0a]/50 to-transparent" />
                <div className="absolute -left-40 top-20 h-[420px] w-[420px] rounded-full bg-[#004741]/40 blur-[120px]" />
            </div>

            <div className="relative px-[4%] pt-10">
                <BackButton />

                <div className="mt-10 flex flex-col gap-10 md:flex-row md:items-end md:gap-14">
                    {/* Portrait */}
                    <motion.div
                        className="relative w-[220px] shrink-0 md:w-[280px]"
                        initial={{ opacity: 0, y: 30, scale: 0.94 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.9, ease: EASE }}
                    >
                        <div className="absolute -inset-3 rounded-[34px] bg-gradient-to-b from-[#2f8a7f]/35 to-transparent blur-2xl" />
                        <div className="relative aspect-[2/3] overflow-hidden rounded-[28px] border border-[#f0ede4]/15 bg-white/[0.04] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9)]">
                            {person.profile_path ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={`${PROFILE}${person.profile_path}`}
                                    alt={person.name}
                                    className="h-full w-full object-cover"
                                    decoding="async"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                    <User size={72} className="text-white/15" />
                                </div>
                            )}
                            <div className="pointer-events-none absolute inset-0 rounded-[28px] shadow-[inset_0_1px_0_rgba(240,237,228,0.25)]" />
                        </div>
                    </motion.div>

                    {/* Identity */}
                    <div className="min-w-0 flex-1 pb-2">
                        <motion.span
                            className="inline-flex items-center gap-2 rounded-full border border-[#2f8a7f]/40 bg-[#004741]/60 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#cfe6e1]"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
                        >
                            <Clapperboard size={12} />
                            {person.known_for_department || 'Cast'}
                        </motion.span>
                        <motion.h1
                            className="mt-4 text-5xl font-extrabold leading-[1.02] tracking-tight text-gradient md:text-7xl"
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: EASE, delay: 0.16 }}
                        >
                            {person.name}
                        </motion.h1>

                        <motion.div
                            className="mt-5 flex flex-wrap gap-2.5"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, ease: EASE, delay: 0.24 }}
                        >
                            {person.birthday && (
                                <Fact icon={<Cake size={14} />}>Born {formatDate(person.birthday)}</Fact>
                            )}
                            {person.deathday && (
                                <Fact icon={<Flower2 size={14} />}>Died {formatDate(person.deathday)}</Fact>
                            )}
                            {person.place_of_birth && (
                                <Fact icon={<MapPin size={14} />}>{person.place_of_birth}</Fact>
                            )}
                        </motion.div>

                        {stats.length > 0 && (
                            <motion.dl
                                className="mt-8 grid max-w-2xl grid-cols-2 gap-px overflow-hidden rounded-[22px] border border-white/[0.08] bg-white/[0.06] sm:grid-cols-4"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.7, ease: EASE, delay: 0.32 }}
                            >
                                {stats.map(stat => (
                                    <div key={stat.label} className="bg-[#07110f]/90 px-5 py-4">
                                        <dt className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/40">{stat.label}</dt>
                                        <dd className="mt-1 flex items-center gap-1.5 whitespace-nowrap text-2xl font-bold tracking-tight text-white">
                                            {stat.label === 'Avg. rating' && <Star size={16} className="text-amber-300" fill="currentColor" />}
                                            {stat.value}
                                        </dd>
                                        <dd className="mt-0.5 truncate text-[12px] font-medium text-white/45">{stat.note}</dd>
                                    </div>
                                ))}
                            </motion.dl>
                        )}
                    </div>
                </div>

                {/* Biography */}
                {person.biography && (
                    <Reveal className="mt-14 max-w-4xl" delay={0.1}>
                        <SectionHeading>Biography</SectionHeading>
                        <ExpandableDescription
                            text={person.biography}
                            title={person.name}
                            lines={5}
                            className="text-[15.5px] leading-[1.8] text-white/70"
                        />
                        {person.also_known_as?.length > 0 && (
                            <p className="mt-4 text-[13px] text-white/40">
                                Also known as {person.also_known_as.slice(0, 3).join(' · ')}
                            </p>
                        )}
                    </Reveal>
                )}
            </div>

            {/* Known for */}
            {knownFor.length > 0 && (
                <Reveal className="mt-16">
                    <div className="px-[4%]"><SectionHeading>Known for</SectionHeading></div>
                    <Rail className="flex items-start gap-5 overflow-x-auto overflow-y-hidden px-[4%] pb-8 pt-3">
                        {knownFor.map(credit => (
                            <div key={`${credit.media_type}-${credit.id}`} className="w-[170px] shrink-0 md:w-[190px]">
                                <MovieCard movie={credit} fullWidth />
                                <p className="mt-2.5 truncate px-1 text-[12.5px] text-white/45">
                                    {credit.character ? `as ${credit.character}` : credit.job}
                                </p>
                            </div>
                        ))}
                    </Rail>
                </Reveal>
            )}

            {/* Filmography timeline */}
            {credits.length > 0 && (
                <Reveal className="mt-16 px-[4%]">
                    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                        <SectionHeading className="mb-0">Filmography</SectionHeading>
                        <SegmentedControl
                            id="person-kind"
                            size="sm"
                            options={KINDS.map(k => ({ ...k, label: `${k.label} ${counts[k.value]}` }))}
                            value={kind}
                            onChange={value => { setKind(value); setShown(FILMOGRAPHY_STEP); }}
                        />
                    </div>

                    <div className="overflow-hidden rounded-[24px] border border-white/[0.07] bg-gradient-to-b from-white/[0.035] to-white/[0.01]">
                        <AnimatePresence mode="popLayout" initial={false}>
                            {filmography.slice(0, shown).map((credit, index) => (
                                <TimelineRow
                                    key={`${credit.media_type}-${credit.id}`}
                                    credit={credit}
                                    showYear={index === 0 || creditDate(filmography[index - 1]).slice(0, 4) !== creditDate(credit).slice(0, 4)}
                                    first={index === 0}
                                />
                            ))}
                        </AnimatePresence>
                        {filmography.length === 0 && (
                            <p className="px-6 py-10 text-center text-sm text-white/45">No titles in this category.</p>
                        )}
                    </div>

                    {filmography.length > shown && (
                        <div className="mt-6 flex justify-center">
                            <button
                                type="button"
                                data-ripple
                                onClick={() => setShown(count => count + FILMOGRAPHY_STEP)}
                                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-6 py-3 text-sm font-semibold text-white/80 transition-colors hover:bg-white/[0.1] hover:text-white"
                            >
                                Show more <span className="text-white/40">({filmography.length - shown})</span>
                                <ChevronDown size={16} />
                            </button>
                        </div>
                    )}
                </Reveal>
            )}
        </div>
    );
}

function SectionHeading({ children, className }: { children: string; className?: string }) {
    return (
        <h2 className={cn('mb-5 flex items-center gap-3 text-2xl font-bold tracking-tight text-white', className)}>
            <span className="h-6 w-1 rounded-full bg-gradient-to-b from-[#f0ede4] to-[#2f8a7f]" />
            {children}
        </h2>
    );
}

function Fact({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.09] bg-white/[0.05] px-3.5 py-1.5 text-[13px] font-medium text-white/75">
            <span className="text-[#8cc2b8]">{icon}</span>
            {children}
        </span>
    );
}

function TimelineRow({ credit, showYear, first }: { credit: Credit; showYear: boolean; first: boolean }) {
    const date = creditDate(credit);
    const isTv = credit.media_type === 'tv';
    const href = `/details?type=${isTv ? 'series' : 'movie'}&id=${credit.id}`;
    const role = credit.character || credit.job;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className={cn(!first && 'border-t border-white/[0.05]')}
        >
            <Link
                href={href}
                data-ripple
                className="group relative flex items-center gap-4 overflow-hidden px-4 py-3 transition-colors duration-300 hover:bg-white/[0.04] sm:gap-5 sm:px-6"
            >
                <span className={cn('w-12 shrink-0 text-[13px] font-bold tabular-nums', showYear ? 'text-[#8cc2b8]' : 'text-transparent')}>
                    {date ? date.slice(0, 4) : 'TBA'}
                </span>
                <span className="relative h-[60px] w-10 shrink-0 overflow-hidden rounded-[5px] bg-white/[0.05]">
                    {credit.poster_path && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={`${THUMB}${credit.poster_path}`} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    )}
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-white transition-colors group-hover:text-[#f0ede4]">
                        {credit.title || credit.name}
                    </span>
                    {role && <span className="block truncate text-[13px] text-white/45">{credit.character ? `as ${role}` : role}</span>}
                </span>
                <span className="hidden shrink-0 rounded-full border border-white/[0.08] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-white/50 sm:inline">
                    {isTv ? 'Series' : 'Movie'}
                </span>
                <span className="flex w-12 shrink-0 items-center justify-end gap-1 text-[13px] font-semibold text-white/60">
                    {credit.vote_count >= 10 && (
                        <><Star size={12} className="text-amber-300" fill="currentColor" />{credit.vote_average.toFixed(1)}</>
                    )}
                </span>
            </Link>
        </motion.div>
    );
}

function PersonSkeleton() {
    return (
        <div className="min-h-screen px-[4%] pt-10">
            <div className="h-10 w-24 rounded-full skeleton" />
            <div className="mt-10 flex flex-col gap-10 md:flex-row md:items-end md:gap-14">
                <div className="aspect-[2/3] w-[220px] rounded-[28px] skeleton md:w-[280px]" />
                <div className="flex-1 space-y-5 pb-2">
                    <div className="h-6 w-28 rounded-full skeleton" />
                    <div className="h-16 w-2/3 rounded-2xl skeleton" />
                    <div className="flex gap-2.5">
                        <div className="h-8 w-44 rounded-full skeleton" />
                        <div className="h-8 w-52 rounded-full skeleton" />
                    </div>
                    <div className="h-20 max-w-2xl rounded-[22px] skeleton" />
                </div>
            </div>
        </div>
    );
}
