import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Play, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

interface WatchlistItem {
  id: string;
  film_id: string;
  created_at: string;
  film: {
    id: string;
    title: string;
    poster_url: string;
    logline: string;
    genre: string;
    release_year: number;
    runtime_min: number;
    rating: string;
  };
}

export function Watchlist() {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWatchlist();
  }, [user]);

  const loadWatchlist = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_watchlist')
        .select(`
          *,
          film:films(id, title, poster_url, logline, genre, release_year, runtime_min, rating)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWatchlist(data || []);
    } catch (error) {
      console.error('Error loading watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWatchlist = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_watchlist')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setWatchlist(watchlist.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      alert('Failed to remove from watchlist');
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-red-600 mx-auto"></div>
          <p className="text-slate-400">Loading watchlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">My Watchlist</h1>
        <p className="mt-2 text-slate-400">
          {watchlist.length} {watchlist.length === 1 ? 'title' : 'titles'} saved
        </p>
      </div>

      {watchlist.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-slate-800 bg-slate-900 p-12 text-center">
          <Bookmark className="mx-auto h-12 w-12 text-slate-600" />
          <h3 className="mt-4 text-lg font-semibold text-slate-400">Your watchlist is empty</h3>
          <p className="mt-2 text-sm text-slate-500">
            Add films you want to watch later
          </p>
          <Link
            to="/"
            className="mt-6 inline-block rounded-lg bg-red-600 px-6 py-2 font-semibold text-white hover:bg-red-700 transition-colors"
          >
            Browse Content
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {watchlist.map((item) => (
            <div
              key={item.id}
              className="group overflow-hidden rounded-lg border border-slate-800 bg-slate-900 transition-all hover:scale-105 hover:border-red-500 hover:shadow-xl hover:shadow-red-500/20"
            >
              <Link to={`/watch/${item.film.id}`} className="relative block aspect-[2/3] overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
                {item.film.poster_url ? (
                  <>
                    <img
                      src={item.film.poster_url}
                      alt={item.film.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-3">
                      <div className="text-xs font-bold uppercase tracking-wider text-yellow-400 drop-shadow-lg">
                        {item.film.genre}
                      </div>
                      <h3 className="mt-1 line-clamp-2 text-base font-black uppercase leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
                        style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.9), -1px -1px 2px rgba(0,0,0,0.5)' }}
                      >
                        {item.film.title}
                      </h3>
                      <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                        <span className="rounded bg-red-600 px-1.5 py-0.5">{item.film.rating}</span>
                        <span>{item.film.release_year}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center p-3 text-center">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {item.film.genre}
                    </div>
                    <div className="mt-2 text-sm font-bold leading-tight">{item.film.title}</div>
                    <div className="mt-2 text-xs text-slate-400">
                      {item.film.release_year} • {item.film.runtime_min}m
                    </div>
                  </div>
                )}

                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <Play className="h-12 w-12 text-white drop-shadow-lg" />
                </div>
              </Link>

              <div className="p-4">
                <p className="line-clamp-2 text-sm text-slate-300">{item.film.logline}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Added {new Date(item.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <button
                    onClick={() => removeFromWatchlist(item.id)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors"
                    aria-label="Remove from watchlist"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
