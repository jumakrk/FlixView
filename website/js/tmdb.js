/* FlixView website: artwork from TMDB
 * Fetches this week's trending movies and series, popular anime and top-rated
 * films, caches them for six hours, and hands them to main.js through
 * window.__tmdb and a 'flix:tmdb' event. If TMDB cannot be reached nothing
 * happens, and the page keeps its generated artwork.
 *
 * This product uses the TMDB API but is not endorsed or certified by TMDB.
 */
(function () {
  'use strict';

  // The same public key the FlixView app ships with.
  var API_KEY = 'e3e0dac3e79f074f3b5908195a80c23e';
  var API = 'https://api.themoviedb.org/3';
  var CACHE_KEY = 'flixview:tmdb:v2';
  var CACHE_MS = 6 * 60 * 60 * 1000;

  function get(path, params) {
    var q = 'api_key=' + API_KEY + '&language=en-GB' + (params ? '&' + params : '');
    return fetch(API + path + '?' + q).then(function (res) {
      if (!res.ok) throw new Error('TMDB ' + res.status);
      return res.json();
    });
  }

  function slim(item, kind) {
    return {
      id: item.id,
      title: item.title || item.name || '',
      type: kind || (item.media_type === 'tv' ? 'Series' : 'Movie'),
      year: (item.release_date || item.first_air_date || '').slice(0, 4),
      rating: item.vote_average ? item.vote_average.toFixed(1) : '',
      poster: item.poster_path,
      backdrop: item.backdrop_path,
    };
  }

  function load() {
    try {
      var cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (cached && Date.now() - cached.at < CACHE_MS) return Promise.resolve(cached.data);
    } catch (e) { /* storage unavailable */ }

    return Promise.all([
      get('/trending/all/week'),
      get('/trending/all/day'),
      get('/discover/tv', 'with_genres=16&with_original_language=ja&sort_by=popularity.desc&vote_count.gte=200'),
      get('/movie/top_rated'),
    ]).then(function (r) {
      var seen = {};
      var keep = function (list, kind) {
        var out = [];
        list.forEach(function (item) {
          if (!kind && item.media_type !== 'movie' && item.media_type !== 'tv') return;
          if (!item.poster_path || seen[item.id]) return;
          seen[item.id] = true;
          out.push(slim(item, kind));
        });
        return out;
      };
      var data = {
        trending: keep(r[0].results.concat(r[1].results)),
        anime: keep(r[2].results, 'Anime'),
        classics: keep(r[3].results, 'Movie'),
      };
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data: data })); } catch (e) { /* ignore */ }
      return data;
    });
  }

  load().then(function (data) {
    if (!data || !data.trending || data.trending.length < 6) return;
    window.__tmdb = data;
    window.dispatchEvent(new CustomEvent('flix:tmdb', { detail: data }));
  }).catch(function () { /* keep the generated artwork */ });
})();
