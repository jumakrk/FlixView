import { fetchTrending } from '@/lib/tmdb';
import TrendingClient from './TrendingClient';

export default async function TrendingPage() {
    const trending = await fetchTrending('day');
    return <TrendingClient initialDay={trending} />;
}
