// TMDB API key. For your own builds set NEXT_PUBLIC_TMDB_API_KEY (see
// .env.example); the fallback is the FlixView project key so local dev and
// release builds work without extra setup.
import { compactSearchText } from './searchQuery';

const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || 'e3e0dac3e79f074f3b5908195a80c23e';
const BASE_URL = 'https://api.themoviedb.org/3';

export interface Movie {
    id: number;
    title: string;
    name?: string; // TV shows use 'name'
    overview: string;
    backdrop_path: string | null;
    poster_path: string | null;
    release_date?: string;
    first_air_date?: string;
    vote_average: number;
    vote_count: number;
    popularity?: number;
    media_type?: string;
    genre_ids?: number[];
    original_language?: string;
}

export interface Episode {
    id: number;
    name: string;
    overview: string;
    still_path: string | null;
    episode_number: number;
    air_date: string;
    vote_average: number;
}

export interface SeasonDetails {
    id: number;
    name: string;
    overview: string;
    poster_path: string | null;
    season_number: number;
    episodes: Episode[];
}

export interface MovieDetails extends Movie {
    genres: { id: number; name: string }[];
    runtime?: number;
    number_of_seasons?: number;
    number_of_episodes?: number;
    production_companies?: {
        id: number;
        name: string;
        logo_path: string | null;
    }[];
    seasons?: {
        id: number;
        name: string;
        overview: string;
        poster_path: string | null;
        season_number: number;
        episode_count: number;
    }[];
    belongs_to_collection?: {
        id: number;
        name: string;
        poster_path: string | null;
        backdrop_path: string | null;
    } | null;
    tagline?: string;
    status?: string;
    last_air_date?: string;
    homepage?: string;
    videos?: {
        results: {
            id: string;
            key: string;
            name: string;
            site: string;
            type: string;
        }[];
    };
    images?: {
        backdrops: { file_path: string; aspect_ratio: number; file_size: number; height: number; width: number }[];
        posters: { file_path: string; aspect_ratio: number; file_size: number; height: number; width: number }[];
    };
    reviews?: {
        results: {
            author: string;
            author_details: {
                name: string;
                username: string;
                avatar_path: string | null;
                rating: number | null;
            };
            content: string;
            created_at: string;
            id: string;
        }[];
    };
}


export interface Cast {
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
}

export const fetchTrending = async (timeWindow: 'day' | 'week' = 'day'): Promise<Movie[]> => {
    try {
        const res = await fetch(
            `${BASE_URL}/trending/all/${timeWindow}?api_key=${API_KEY}&language=en-US`,
            { next: { revalidate: 3600 } }
        );

        if (!res.ok) {
            const errorBody = await res.text();
            console.error(`TMDB Trending Fetch Error (${res.status}):`, errorBody);
            throw new Error(`Failed to fetch trending: ${res.status}`);
        }
        const data = await res.json();
        return data.results;
    } catch (error) {
        console.error('fetchTrending exception:', error);
        return [];
    }
};

export const fetchNowPlaying = async (): Promise<Movie[]> => {
    try {
        const res = await fetch(
            `${BASE_URL}/movie/now_playing?api_key=${API_KEY}&language=en-US&page=1`,
            { next: { revalidate: 3600 } }
        );
        if (!res.ok) throw new Error(`Failed to fetch now playing: ${res.status}`);
        const data = await res.json();
        return data.results.map((m: Movie) => ({ ...m, media_type: 'movie' }));
    } catch (error) {
        console.error('fetchNowPlaying:', error);
        return [];
    }
};

export const fetchUpcoming = async (): Promise<Movie[]> => {
    try {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        // Use discover with popularity sort to find high-profile upcoming movies
        const res = await fetch(
            `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=en-US&region=US&sort_by=popularity.desc&primary_release_date.gte=${todayStr}&page=1`,
            { next: { revalidate: 86400 } }
        );
        if (!res.ok) throw new Error(`Failed to fetch upcoming movies: ${res.status}`);
        const data = await res.json();
        return data.results
            .filter((m: Movie) => m.release_date && new Date(m.release_date) > today)
            .map((m: Movie) => ({ ...m, media_type: 'movie' }));
    } catch (error) {
        console.error('fetchUpcoming:', error);
        return [];
    }
};

export const fetchPopularMovies = async (page: number = 1): Promise<Movie[]> => {
    try {
        const res = await fetch(
            `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=en-US&page=${page}`,
            { next: { revalidate: 86400 } }
        );
        if (!res.ok) throw new Error(`Failed to fetch popular movies: ${res.status}`);
        const data = await res.json();
        return data.results.map((m: Movie) => ({ ...m, media_type: 'movie' }));
    } catch (error) {
        console.error('fetchPopularMovies:', error);
        return [];
    }
};

export const fetchAiringTodaySeries = async (): Promise<Movie[]> => {
    try {
        const res = await fetch(
            `${BASE_URL}/tv/airing_today?api_key=${API_KEY}&language=en-US&page=1`,
            { next: { revalidate: 3600 } }
        );
        if (!res.ok) throw new Error(`Failed to fetch airing today series: ${res.status}`);
        const data = await res.json();
        return data.results.map((show: Movie) => ({ ...show, title: show.name ?? show.title, media_type: 'tv' }));
    } catch (error) {
        console.error('fetchAiringTodaySeries:', error);
        return [];
    }
};

export const fetchOnTheAirSeries = async (): Promise<Movie[]> => {
    try {
        const res = await fetch(
            `${BASE_URL}/tv/on_the_air?api_key=${API_KEY}&language=en-US&page=1`,
            { next: { revalidate: 3600 } }
        );
        if (!res.ok) throw new Error(`Failed to fetch on the air series: ${res.status}`);
        const data = await res.json();
        return data.results.map((show: Movie) => ({ ...show, title: show.name ?? show.title, media_type: 'tv' }));
    } catch (error) {
        console.error('fetchOnTheAirSeries:', error);
        return [];
    }
};

export const fetchPopularSeries = async (page: number = 1): Promise<Movie[]> => {
    try {
        const res = await fetch(
            `${BASE_URL}/tv/popular?api_key=${API_KEY}&language=en-US&page=${page}`,
            { next: { revalidate: 86400 } }
        );
        if (!res.ok) throw new Error(`Failed to fetch popular series: ${res.status}`);
        const data = await res.json();
        return data.results.map((show: Movie) => ({ ...show, title: show.name ?? show.title, media_type: 'tv' }));
    } catch (error) {
        console.error('fetchPopularSeries:', error);
        return [];
    }
};

export const fetchTopRatedMovies = async (page: number = 1): Promise<Movie[]> => {
    try {
        const res = await fetch(
            `${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=en-US&page=${page}`,
            { next: { revalidate: 86400 } }
        );
        if (!res.ok) throw new Error(`Failed to fetch top rated movies: ${res.status}`);
        const data = await res.json();
        return data.results.map((m: Movie) => ({ ...m, media_type: 'movie' }));
    } catch (error) {
        console.error('fetchTopRatedMovies:', error);
        return [];
    }
};

export const fetchTopRatedSeries = async (page: number = 1): Promise<Movie[]> => {
    try {
        const res = await fetch(
            `${BASE_URL}/tv/top_rated?api_key=${API_KEY}&language=en-US&page=${page}`,
            { next: { revalidate: 86400 } }
        );
        if (!res.ok) throw new Error(`Failed to fetch top rated series: ${res.status}`);
        const data = await res.json();
        return data.results.map((show: Movie) => ({ ...show, title: show.name ?? show.title, media_type: 'tv' }));
    } catch (error) {
        console.error('fetchTopRatedSeries:', error);
        return [];
    }
};

export const fetchUpcomingSeries = async (): Promise<Movie[]> => {
    try {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        // Use discover with popularity sort to find high-profile upcoming series
        const res = await fetch(
            `${BASE_URL}/discover/tv?api_key=${API_KEY}&language=en-US&sort_by=popularity.desc&first_air_date.gte=${todayStr}&page=1`,
            { next: { revalidate: 86400 } }
        );
        if (!res.ok) throw new Error(`Failed to fetch upcoming series: ${res.status}`);
        const data = await res.json();
        return data.results
            .filter((show: Movie) => show.first_air_date && new Date(show.first_air_date) > today)
            .map((show: Movie) => ({ ...show, title: show.name ?? show.title, media_type: 'tv' }));
    } catch (error) {
        console.error('fetchUpcomingSeries:', error);
        return [];
    }
};

export const fetchGenreMovies = async (genreId: number): Promise<Movie[]> => {
    try {
        const res = await fetch(
            `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}&language=en-US&page=1`,
            { next: { revalidate: 86400 } }
        );
        if (!res.ok) throw new Error(`Failed to fetch genre movies: ${res.status}`);
        const data = await res.json();
        return data.results;
    } catch (error) {
        console.error('fetchGenreMovies:', error);
        return [];
    }
};

export const fetchDetails = async (id: string, type: 'movie' | 'tv' = 'movie', isRetry: boolean = false): Promise<MovieDetails> => {
    const cleanId = id.toString().trim();
    const res = await fetch(
        `${BASE_URL}/${type}/${cleanId}?api_key=${API_KEY}&language=en-US&append_to_response=videos,images,reviews&include_image_language=en,null`,
        { next: { revalidate: 86400 } }
    );

    if (!res.ok) {
        // A 404 usually means the id belongs to the other namespace (a TV
        // id opened as a movie or vice versa); retry once as the flipped
        // type. Anything else (rate limit, server error) is a real error
        // and must not be masked by a type flip.
        if (res.status === 404 && !isRetry) {
            const nextType = type === 'movie' ? 'tv' : 'movie';
            console.log(`fetchDetails: ${type}/${cleanId} not found, retrying as ${nextType}`);
            return fetchDetails(cleanId, nextType, true);
        }
        throw new Error(`Failed to fetch details for ${type} with ID ${cleanId}. Status: ${res.status}`);
    }
    const data = await res.json();
    return data;
};

export const fetchCredits = async (id: string, type: 'movie' | 'tv' = 'movie'): Promise<Cast[]> => {
    try {
        const res = await fetch(
            `${BASE_URL}/${type}/${id}/credits?api_key=${API_KEY}&language=en-US`,
            { next: { revalidate: 86400 } }
        );
        if (!res.ok) return [];
        const data = await res.json();
        if (!data.cast) return [];
        return (data.cast as Cast[]).slice(0, 10); // Limit to top 10 cast
    } catch (error) {
        console.error('fetchCredits:', error);
        return [];
    }
};

export const fetchSimilar = async (id: string, type: 'movie' | 'tv' = 'movie'): Promise<Movie[]> => {
    try {
        const res = await fetch(
            `${BASE_URL}/${type}/${id}/similar?api_key=${API_KEY}&language=en-US&page=1`,
            { next: { revalidate: 86400 } }
        );
        if (!res.ok) return [];
        const data = await res.json();
        return data.results;
    } catch (error) {
        console.error('fetchSimilar:', error);
        return [];
    }
};

export const fetchRecommendations = async (id: string, type: 'movie' | 'tv' = 'movie'): Promise<Movie[]> => {
    try {
        const res = await fetch(
            `${BASE_URL}/${type}/${id}/recommendations?api_key=${API_KEY}&language=en-US&page=1`,
            { next: { revalidate: 86400 } }
        );
        if (!res.ok) {
            console.warn(`fetchRecommendations failed for ${type} ${id}, falling back to fetchSimilar`);
            return fetchSimilar(id, type);
        }
        const data = await res.json();
        return data.results.map((item: Movie) => ({
            ...item,
            title: item.title || item.name || '',
            media_type: type
        }));
    } catch (error) {
        console.error('fetchRecommendations error:', error);
        return fetchSimilar(id, type);
    }
};

export const fetchCollection = async (collectionId: number): Promise<Movie[]> => {
    try {
        const res = await fetch(
            `${BASE_URL}/collection/${collectionId}?api_key=${API_KEY}&language=en-US`,
            { next: { revalidate: 86400 } }
        );
        if (!res.ok) return [];
        const data = await res.json();
        return (data.parts || []).map((m: Movie) => ({ ...m, media_type: 'movie' }));
    } catch (error) {
        console.error('fetchCollection error:', error);
        return [];
    }
};

export const searchContent = async (query: string): Promise<Movie[]> => {
    const res = await fetch(
        `${BASE_URL}/search/multi?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(query)}&page=1&include_adult=false`
    );

    if (!res.ok) throw new Error('Failed to search');
    const data = await res.json();
    return data.results.filter((item: Movie) => {
        // Anime is fetched from AniList, never TMDB. Japanese animation is the
        // reliable signal available in TMDB's multi-search payload.
        const looksLikeAnime = item.original_language === 'ja' && item.genre_ids?.includes(16);
        return !looksLikeAnime && (item.backdrop_path || item.poster_path);
    });
};

export const fetchMovieLogo = async (id: number, type: 'movie' | 'tv'): Promise<string | null> => {
    try {
        const res = await fetch(
            `${BASE_URL}/${type}/${id}/images?api_key=${API_KEY}`,
            { next: { revalidate: 86400 } }
        );
        if (!res.ok) return null;
        const data = await res.json();
        // detailed logic: find first 'en' logo, or first logo
        const logos: { file_path: string; iso_639_1: string | null }[] = data.logos || [];
        const logo = logos.find(l => l.iso_639_1 === 'en') || logos[0];
        return logo ? logo.file_path : null;
    } catch (error) {
        console.error('Error fetching logo:', error);
        return null;
    }
};

interface TmdbLogoSearchResult {
    id: number;
    media_type?: string;
    title?: string;
    name?: string;
    original_title?: string;
    original_name?: string;
    release_date?: string;
    first_air_date?: string;
}

const animeLogoCache = new Map<string, Promise<string | null>>();

/**
 * Find a transparent title logo for an AniList anime.
 *
 * Anime metadata (titles, synopsis, episodes, artwork) stays on AniList; this
 * only borrows TMDB's logo image for the hero heading, exactly like the
 * movie/TV details pages already do. The title and year must match an exact
 * TMDB entry, so a wrong title can never pick up an unrelated logo. When no
 * match/logo exists the caller keeps the normal text heading.
 */
export const fetchAnimeLogo = async (
    titles: (string | null | undefined)[],
    year?: number | null
): Promise<string | null> => {
    const uniqueTitles = [...new Set(
        titles
            .map((title) => title?.trim())
            .filter((title): title is string => Boolean(title))
    )].slice(0, 2);

    if (uniqueTitles.length === 0) return null;

    const cacheKey = `${uniqueTitles.join('|')}|${year ?? ''}`;
    const cached = animeLogoCache.get(cacheKey);
    if (cached) return cached;

    const request = (async () => {
        for (const title of uniqueTitles) {
            try {
                const res = await fetch(
                    `${BASE_URL}/search/multi?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(title)}&page=1&include_adult=false`
                );
                if (!res.ok) continue;

                const data = await res.json();
                const compactTitle = compactSearchText(title);
                const matches: TmdbLogoSearchResult[] = (data.results || []).filter(
                    (item: TmdbLogoSearchResult) => {
                        if (item.media_type !== 'movie' && item.media_type !== 'tv') return false;
                        const names = [item.title, item.name, item.original_title, item.original_name]
                            .filter((value): value is string => Boolean(value))
                            .map(compactSearchText);
                        return names.includes(compactTitle);
                    }
                );

                if (matches.length === 0) continue;

                const yearMatches = matches.filter((item) => {
                    if (!year) return true;
                    const date = item.release_date || item.first_air_date;
                    if (!date) return true;
                    const releaseYear = new Date(date).getFullYear();
                    return Number.isFinite(releaseYear) && Math.abs(releaseYear - year) <= 1;
                });

                const candidate = yearMatches[0] || matches[0];
                if (!candidate) continue;

                const logo = await fetchMovieLogo(candidate.id, candidate.media_type as 'movie' | 'tv');
                if (logo) return logo;
            } catch (error) {
                console.error('fetchAnimeLogo:', error);
            }
        }

        return null;
    })();

    animeLogoCache.set(cacheKey, request);
    return request;
};

export const fetchSeasonDetails = async (seriesId: string, seasonNumber: number): Promise<SeasonDetails | null> => {
    try {
        const res = await fetch(
            `${BASE_URL}/tv/${seriesId}/season/${seasonNumber}?api_key=${API_KEY}&language=en-US`,
            { next: { revalidate: 86400 } }
        );
        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        console.error('Error fetching season details:', error);
        return null;
    }
};

export interface PersonDetails {
    id: number;
    name: string;
    biography: string;
    profile_path: string | null;
    birthday: string | null;
    deathday?: string | null;
    place_of_birth: string | null;
    known_for_department: string;
    also_known_as: string[];
}

export interface PersonCredits {
    cast: (Movie & { character: string })[];
    crew?: (Movie & { job: string; department?: string })[];
}

export const fetchPersonDetails = async (id: string): Promise<PersonDetails | null> => {
    try {
        const res = await fetch(`${BASE_URL}/person/${id}?api_key=${API_KEY}&language=en-US`);
        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        console.error('Error fetching person details:', error);
        return null;
    }
};

export const fetchPersonCredits = async (id: string): Promise<PersonCredits | null> => {
    try {
        const res = await fetch(`${BASE_URL}/person/${id}/combined_credits?api_key=${API_KEY}&language=en-US`);
        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        console.error('Error fetching person credits:', error);
        return null;
    }
};
export const fetchDiscover = async (
    type: 'movie' | 'tv',
    page: number = 1,
    genre?: string,
    year?: string,
    sortBy?: string
): Promise<Movie[]> => {
    try {
        let url = `${BASE_URL}/discover/${type}?api_key=${API_KEY}&language=en-US&page=${page}`;

        if (genre && genre !== 'All Genres') {
            const genreId = getGenreId(genre);
            if (genreId) url += `&with_genres=${genreId}`;
        }

        if (year && year !== 'All Years') {
            const dateField = type === 'movie' ? 'primary_release_year' : 'first_air_date_year';
            url += `&${dateField}=${year}`;
        }

        if (sortBy) {
            const sortMap: Record<string, string> = {
                'Popularity Descending': 'popularity.desc',
                'Popularity Ascending': 'popularity.asc',
                'Rating Descending': 'vote_average.desc',
                'Release Date Descending': type === 'movie' ? 'release_date.desc' : 'first_air_date.desc'
            };
            url += `&sort_by=${sortMap[sortBy] || 'popularity.desc'}`;
            // Rating sorts need a vote floor, or obscure titles with a single 10/10
            // vote crowd out everything else.
            if (sortBy === 'Rating Descending') url += '&vote_count.gte=300';
        } else {
            url += `&sort_by=popularity.desc`;
        }

        const res = await fetch(url, { next: { revalidate: 3600 } });
        if (!res.ok) throw new Error(`Discovery fetch failed: ${res.status}`);
        const data = await res.json();
        return data.results.map((item: Movie) => ({
            ...item,
            title: item.title || item.name || '',
            media_type: type
        }));
    } catch (error) {
        console.error('fetchDiscover error:', error);
        return [];
    }
};

const getGenreId = (genreName: string): number | null => {
    const genres: Record<string, number> = {
        'Action': 28, 'Adventure': 12, 'Animation': 16, 'Comedy': 35, 'Crime': 80,
        'Documentary': 99, 'Drama': 18, 'Family': 10751, 'Fantasy': 14, 'History': 36,
        'Horror': 27, 'Music': 10402, 'Mystery': 9648, 'Romance': 10749,
        'Science Fiction': 878, 'TV Movie': 10770, 'Thriller': 53, 'War': 10752, 'Western': 37
    };
    // TV specific genres that differ:
    const tvGenres: Record<string, number> = {
        'Action & Adventure': 10759, 'Kids': 10762, 'News': 10763, 'Reality': 10764,
        'Sci-Fi & Fantasy': 10765, 'Soap': 10766, 'Talk': 10767, 'War & Politics': 10768
    };
    return genres[genreName] || tvGenres[genreName] || null;
};

export const fetchBrandContent = async (
    brandType: 'company' | 'network' | 'provider',
    id: number,
    mediaType: 'movie' | 'tv',
    page: number = 1,
    genreId?: number,
    sortBy?: string
): Promise<Movie[]> => {
    try {
        let url = `${BASE_URL}/discover/${mediaType}?api_key=${API_KEY}&language=en-US&page=${page}`;

        if (brandType === 'provider') {
            // Pure streaming providers (e.g. Crunchyroll) have tiny TMDB network
            // catalogues, so both media types filter by watch provider.
            url += `&with_watch_providers=${id}&watch_region=US`;
        } else if (mediaType === 'movie') {
            if (brandType === 'company') {
                url += `&with_companies=${id}`;
            } else {
                url += `&with_watch_providers=${id}&watch_region=US`;
            }
        } else {
            if (brandType === 'company') {
                url += `&with_companies=${id}`;
            } else {
                url += `&with_networks=${id}`;
            }
        }

        if (genreId) {
            url += `&with_genres=${genreId}`;
        }

        const sort = sortBy || 'popularity.desc';
        if (sort === 'primary_release_date.desc') {
            // "Newest": TV uses first_air_date, and titles dated in the future
            // are left out so it lists what has actually come out.
            const field = mediaType === 'tv' ? 'first_air_date' : 'primary_release_date';
            const today = new Date().toISOString().slice(0, 10);
            url += `&sort_by=${field}.desc&${field}.lte=${today}`;
        } else {
            url += `&sort_by=${sort}`;
            // Rating sorts need a vote floor, or obscure titles with a single
            // 10/10 vote crowd out everything else.
            if (sort.startsWith('vote_average')) url += '&vote_count.gte=150';
        }

        const res = await fetch(url, { next: { revalidate: 3600 } });
        if (!res.ok) throw new Error(`Brand discovery fetch failed: ${res.status}`);
        const data = await res.json();
        return data.results.map((item: Movie) => ({
            ...item,
            title: item.title || item.name || '',
            media_type: mediaType
        }));
    } catch (error) {
        console.error('fetchBrandContent error:', error);
        return [];
    }
};
