import Hero from "@/components/Hero";
import SectionRow from "@/components/SectionRow";
import TopTenRow from "@/components/TopTenRow";
import ContinueWatchingRow from "@/components/ContinueWatchingRow";
import { 
  fetchTrending, 
  fetchTopRatedMovies, 
  fetchTopRatedSeries,
  fetchPopularMovies,
  fetchPopularSeries,
  fetchNowPlaying,
  fetchUpcoming,
  fetchUpcomingSeries,
  fetchMovieLogo, 
  Movie 
} from "@/lib/tmdb";

export default async function Home() {
  let trendingDay: Movie[] = [];
  let trendingWeek: Movie[] = [];
  let nowPlaying: Movie[] = [];
  let popularMovies: Movie[] = [];
  let popularSeries: Movie[] = [];
  let topRatedMovies: Movie[] = [];
  let topRatedSeries: Movie[] = [];
  let upcomingMovies: Movie[] = [];
  let upcomingSeries: Movie[] = [];
  let heroMoviesWithLogos: (Movie & { logo_path?: string | null })[] = [];

  try {
    // Parallelize all initial API calls
    const [
      trendingDayRes, 
      trendingWeekRes, 
      nowPlayingRes, 
      popMoviesRes, 
      popSeriesRes, 
      topMoviesRes, 
      topSeriesRes, 
      upMoviesRes, 
      upSeriesRes
    ] = await Promise.all([
      fetchTrending('day'),
      fetchTrending('week'),
      fetchNowPlaying(),
      fetchPopularMovies(),
      fetchPopularSeries(),
      fetchTopRatedMovies(),
      fetchTopRatedSeries(),
      fetchUpcoming(),
      fetchUpcomingSeries()
    ]);

    trendingDay = trendingDayRes || [];
    trendingWeek = trendingWeekRes || [];
    nowPlaying = nowPlayingRes || [];
    popularMovies = popMoviesRes || [];
    popularSeries = popSeriesRes || [];
    topRatedMovies = topMoviesRes || [];
    topRatedSeries = topSeriesRes || [];
    upcomingMovies = upMoviesRes || [];
    upcomingSeries = upSeriesRes || [];

    // Combine daily and weekly for a richer pool for the Hero
    const combinedTrending = new Map<number, Movie>();
    [...trendingDay, ...trendingWeek].forEach(movie => combinedTrending.set(movie.id, movie));
    const uniquePool = Array.from(combinedTrending.values());

    // Shuffle and pick 5 for Hero
    const heroSlice = uniquePool.sort(() => 0.5 - Math.random()).slice(0, 5);

    // Fetch logos for the Hero items
    heroMoviesWithLogos = await Promise.all(
      heroSlice.map(async (movie) => {
        try {
          const logo = await fetchMovieLogo(movie.id, movie.media_type === 'tv' ? 'tv' : 'movie');
          return { ...movie, logo_path: logo };
        } catch {
          return { ...movie, logo_path: null };
        }
      })
    );

  } catch (error) {
    console.error("Home page data fetch error:", error);
  }

  return (
    <main style={{ minHeight: '100vh', paddingBottom: '100px' }}>
      <Hero movies={heroMoviesWithLogos} />
      
      <div style={{ position: 'relative', zIndex: 10 }}>
        {/* 1. Continue Watching */}
        <ContinueWatchingRow />

        {/* 2. Top 10 Trending Today */}
        <TopTenRow title="Top 10 Trending Today" movies={trendingDay.slice(0, 10)} />

        {/* 3. In Theaters Now */}
        <SectionRow title="In Theaters Now" movies={nowPlaying} />

        {/* 4. Popular Movies */}
        <SectionRow title="Popular Movies" movies={popularMovies} />

        {/* 5. Popular TV Shows */}
        <SectionRow title="Popular TV Shows" movies={popularSeries} />

        {/* 6. Top Rated Movies */}
        <SectionRow title="Top Rated Movies" movies={topRatedMovies} />

        {/* 7. Top Rated TV Shows */}
        <SectionRow title="Top Rated TV Shows" movies={topRatedSeries} />

        {/* 8. Upcoming Movies */}
        <SectionRow title="Upcoming Movies" movies={upcomingMovies} />

        {/* 9. Upcoming TV Shows */}
        <SectionRow title="Upcoming TV Shows" movies={upcomingSeries} />
      </div>
    </main>
  );
}

