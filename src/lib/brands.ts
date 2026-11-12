/**
 * Streaming services and studios shown on the home page and the brand pages.
 *
 * `type` decides how a brand's catalogue is queried (see fetchBrandContent):
 * TMDB networks list their TV shows by network and their movies by watch
 * provider, studios by production company, and pure streaming providers by
 * watch provider for both.
 */
export interface Brand {
    id: string;
    name: string;
    type: 'company' | 'network' | 'provider';
    /** Where the brand is listed: streaming services or production studios. */
    group: 'streaming' | 'studio';
    tmdbId: number;
    providerId?: number;
    /** Brand colour, used for tile gradients and page accents. */
    accent: string;
}

export const BRANDS: Brand[] = [
    // Streaming
    { id: 'netflix', name: 'Netflix', type: 'network', group: 'streaming', tmdbId: 213, providerId: 8, accent: '#e50914' },
    { id: 'disney', name: 'Disney+', type: 'network', group: 'streaming', tmdbId: 2739, providerId: 337, accent: '#1f80e0' },
    { id: 'apple-tv', name: 'Apple TV+', type: 'network', group: 'streaming', tmdbId: 2552, providerId: 350, accent: '#cbd5e1' },
    { id: 'prime-video', name: 'Prime Video', type: 'network', group: 'streaming', tmdbId: 1024, providerId: 9, accent: '#00a8e1' },
    { id: 'hulu', name: 'Hulu', type: 'network', group: 'streaming', tmdbId: 453, providerId: 15, accent: '#1ce783' },
    { id: 'hbo', name: 'HBO / Max', type: 'network', group: 'streaming', tmdbId: 49, providerId: 1899, accent: '#2f8a7f' },
    { id: 'paramount-plus', name: 'Paramount+', type: 'network', group: 'streaming', tmdbId: 4330, providerId: 531, accent: '#0064ff' },
    // A watch provider rather than a TMDB network, so TV and movies both list
    // its full catalogue.
    { id: 'crunchyroll', name: 'Crunchyroll', type: 'provider', group: 'streaming', tmdbId: 283, providerId: 283, accent: '#f47521' },

    // Studios
    { id: 'marvel', name: 'Marvel Studios', type: 'company', group: 'studio', tmdbId: 420, accent: '#e23636' },
    { id: 'dc', name: 'DC Films', type: 'company', group: 'studio', tmdbId: 9993, accent: '#0476f2' },
    { id: 'warner-bros', name: 'Warner Bros.', type: 'company', group: 'studio', tmdbId: 174, accent: '#e3b23c' },
    { id: 'pixar', name: 'Pixar', type: 'company', group: 'studio', tmdbId: 3, accent: '#3b82f6' },
    { id: 'disney-pictures', name: 'Disney Pictures', type: 'company', group: 'studio', tmdbId: 2, accent: '#93c5fd' },
    { id: 'universal', name: 'Universal Pictures', type: 'company', group: 'studio', tmdbId: 33, accent: '#94a3b8' },
    { id: 'sony-pictures', name: 'Sony Pictures', type: 'company', group: 'studio', tmdbId: 34, accent: '#d4af37' },
    { id: 'columbia', name: 'Columbia Pictures', type: 'company', group: 'studio', tmdbId: 5, accent: '#f5c84c' },
    { id: 'dreamworks', name: 'DreamWorks', type: 'company', group: 'studio', tmdbId: 7, accent: '#60a5fa' },
    { id: 'mgm', name: 'MGM', type: 'company', group: 'studio', tmdbId: 21, accent: '#d4af37' },
    { id: 'lionsgate', name: 'Lionsgate', type: 'company', group: 'studio', tmdbId: 35, accent: '#c8a028' },
    { id: 'a24', name: 'A24', type: 'company', group: 'studio', tmdbId: 41077, accent: '#e5e7eb' },
    { id: 'new-line', name: 'New Line Cinema', type: 'company', group: 'studio', tmdbId: 12, accent: '#a5b4fc' },
    { id: 'lucasfilm', name: 'Lucasfilm', type: 'company', group: 'studio', tmdbId: 1, accent: '#22c55e' },
    { id: 'searchlight', name: 'Searchlight Pictures', type: 'company', group: 'studio', tmdbId: 43, accent: '#facc15' },
];

const DEFAULT_ACCENT = '#004741';

export function findBrand(id: string): Brand | undefined {
    return BRANDS.find(brand => brand.id === id);
}

/** Link to a brand's page (the query string the studios page reads). */
export function brandHref(brand: Brand): string {
    const params = new URLSearchParams({
        id: String(brand.tmdbId),
        type: brand.type,
        name: brand.name,
        logoId: brand.id,
    });
    if (brand.providerId) params.set('providerId', String(brand.providerId));
    return `/studios?${params.toString()}`;
}

/** A brand's accent colour as `rgba()` at the given opacity. */
export function brandColor(id: string, alpha = 1): string {
    const hex = (findBrand(id)?.accent ?? DEFAULT_ACCENT).replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
