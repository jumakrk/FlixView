// Removed 'use server' for static export compatibility

import { fetchPopularMovies, fetchPopularSeries } from './tmdb';

export async function getMoreMovies(page: number) {
    return await fetchPopularMovies(page);
}

export async function getMoreSeries(page: number) {
    return await fetchPopularSeries(page);
}
