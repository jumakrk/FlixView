const API_KEY = 'e3e0dac3e79f074f3b5908195a80c23e'; // Hardcoded for debugging
const BASE_URL = 'https://api.themoviedb.org/3';

console.log('TMDB Client Initialized with Key length:', API_KEY?.length);

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
    media_type?: string;
    genre_ids?: number[];
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
    const res = await fetch(
        `${BASE_URL}/movie/now_playing?api_key=${API_KEY}&language=en-US&page=1`,
        { next: { revalidate: 3600 } }
    );
    if (!res.ok) throw new Error('Failed to fetch now playing');
    const data = await res.json();
    return data.results.map((m: any) => ({ ...m, media_type: 'movie' }));
};

export const fetchUpcoming = async (): Promise<Movie[]> => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    // Use discover with popularity sort to find high-profile upcoming movies
    const res = await fetch(
        `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=en-US&region=US&sort_by=popularity.desc&primary_release_date.gte=${todayStr}&page=1`,
        { next: { revalidate: 86400 } }
    );
    if (!res.ok) throw new Error('Failed to fetch upcoming movies');
    const data = await res.json();
    return data.results
        .filter((m: any) => m.release_date && new Date(m.release_date) > today)
        .map((m: any) => ({ ...m, media_type: 'movie' }));
};

export const fetchPopularMovies = async (page: number = 1): Promise<Movie[]> => {
    const res = await fetch(
        `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=en-US&page=${page}`,
        { next: { revalidate: 86400 } }
    );
    if (!res.ok) throw new Error('Failed to fetch popular movies');
    const data = await res.json();
    return data.results.map((m: any) => ({ ...m, media_type: 'movie' }));
};

export const fetchAiringTodaySeries = async (): Promise<Movie[]> => {
    const res = await fetch(
        `${BASE_URL}/tv/airing_today?api_key=${API_KEY}&language=en-US&page=1`,
        { next: { revalidate: 3600 } }
    );
    if (!res.ok) throw new Error('Failed to fetch airing today series');
    const data = await res.json();
    return data.results.map((show: any) => ({ ...show, title: show.name, media_type: 'tv' }));
};

export const fetchOnTheAirSeries = async (): Promise<Movie[]> => {
    const res = await fetch(
        `${BASE_URL}/tv/on_the_air?api_key=${API_KEY}&language=en-US&page=1`,
        { next: { revalidate: 3600 } }
    );
    if (!res.ok) throw new Error('Failed to fetch on the air series');
    const data = await res.json();
    return data.results.map((show: any) => ({ ...show, title: show.name, media_type: 'tv' }));
};

export const fetchPopularSeries = async (page: number = 1): Promise<Movie[]> => {
    const res = await fetch(
        `${BASE_URL}/tv/popular?api_key=${API_KEY}&language=en-US&page=${page}`,
        { next: { revalidate: 86400 } }
    );
    if (!res.ok) throw new Error('Failed to fetch popular series');
    const data = await res.json();
    return data.results.map((show: any) => ({ ...show, title: show.name, media_type: 'tv' }));
};

export const fetchTopRatedMovies = async (page: number = 1): Promise<Movie[]> => {
    const res = await fetch(
        `${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=en-US&page=${page}`,
        { next: { revalidate: 86400 } }
    );
    if (!res.ok) throw new Error('Failed to fetch top rated movies');
    const data = await res.json();
    return data.results.map((m: any) => ({ ...m, media_type: 'movie' }));
};

export const fetchTopRatedSeries = async (page: number = 1): Promise<Movie[]> => {
    const res = await fetch(
        `${BASE_URL}/tv/top_rated?api_key=${API_KEY}&language=en-US&page=${page}`,
        { next: { revalidate: 86400 } }
    );
    if (!res.ok) throw new Error('Failed to fetch top rated series');
    const data = await res.json();
    return data.results.map((show: any) => ({ ...show, title: show.name, media_type: 'tv' }));
};

export const fetchUpcomingSeries = async (): Promise<Movie[]> => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    // Use discover with popularity sort to find high-profile upcoming series
    const res = await fetch(
        `${BASE_URL}/discover/tv?api_key=${API_KEY}&language=en-US&sort_by=popularity.desc&first_air_date.gte=${todayStr}&page=1`,
        { next: { revalidate: 86400 } }
    );
    if (!res.ok) throw new Error('Failed to fetch upcoming series');
    const data = await res.json();
    return data.results
        .filter((show: any) => show.first_air_date && new Date(show.first_air_date) > today)
        .map((show: any) => ({ ...show, title: show.name, media_type: 'tv' }));
};

export const fetchGenreMovies = async (genreId: number): Promise<Movie[]> => {
    const res = await fetch(
        `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}&language=en-US&page=1`,
        { next: { revalidate: 86400 } }
    );
    if (!res.ok) throw new Error('Failed to fetch genre movies');
    const data = await res.json();
    return data.results;
}

export const fetchDetails = async (id: string, type: 'movie' | 'tv' = 'movie', isRetry: boolean = false): Promise<MovieDetails> => {
    try {
        const res = await fetch(
            `${BASE_URL}/${type}/${id}?api_key=${API_KEY}&language=en-US`,
            { next: { revalidate: 86400 } }
        );

        if (!res.ok) {
            console.warn(`fetchDetails failed for ${type} with ID ${id}, status: ${res.status}`);
            if (!isRetry) {
                const nextType = type === 'movie' ? 'tv' : 'movie';
                console.log(`Retrying fetchDetails as ${nextType} for ID ${id}`);
                return fetchDetails(id, nextType, true);
            }
            throw new Error(`Failed to fetch details for ${type} with ID ${id} after retry.`);
        }
        const data = await res.json();
        return data;
    } catch (error) {
        if (!isRetry) {
            const nextType = type === 'movie' ? 'tv' : 'movie';
            return fetchDetails(id, nextType, true);
        }
        throw error;
    }
};

export const fetchCredits = async (id: string, type: 'movie' | 'tv' = 'movie'): Promise<Cast[]> => {
    const res = await fetch(
        `${BASE_URL}/${type}/${id}/credits?api_key=${API_KEY}&language=en-US`,
        { next: { revalidate: 86400 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.cast) return [];
    return data.cast.slice(0, 10); // Limit to top 10 cast
};

export const fetchSimilar = async (id: string, type: 'movie' | 'tv' = 'movie'): Promise<Movie[]> => {
    const res = await fetch(
        `${BASE_URL}/${type}/${id}/similar?api_key=${API_KEY}&language=en-US&page=1`,
        { next: { revalidate: 86400 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.results;
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
        return data.results.map((item: any) => ({
            ...item,
            title: item.title || item.name,
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
        return (data.parts || []).map((m: any) => ({ ...m, media_type: 'movie' }));
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
    return data.results.filter((item: Movie) => item.backdrop_path || item.poster_path); // Filter out items without images
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
        const logo = data.logos.find((l: any) => l.iso_639_1 === 'en') || data.logos[0];
        return logo ? logo.file_path : null;
    } catch (error) {
        console.error('Error fetching logo:', error);
        return null;
    }
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
    place_of_birth: string | null;
    known_for_department: string;
    also_known_as: string[];
}

export interface PersonCredits {
    cast: (Movie & { character: string })[];
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
        } else {
            url += `&sort_by=popularity.desc`;
        }

        const res = await fetch(url, { next: { revalidate: 3600 } });
        if (!res.ok) throw new Error(`Discovery fetch failed: ${res.status}`);
        const data = await res.json();
        return data.results.map((item: any) => ({
            ...item,
            title: item.title || item.name,
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
