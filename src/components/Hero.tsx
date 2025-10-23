import { Play, Info, Plus } from 'lucide-react';
import { Movie } from '../types';

interface HeroProps {
  movie: Movie;
  onPlayClick: () => void;
  onMoreInfoClick?: () => void;
}

export function Hero({ movie, onPlayClick, onMoreInfoClick }: HeroProps) {
  return (
    <div className="relative h-screen">
      <div className="absolute inset-0">
        <img
          src={movie.backdrop_url}
          alt={movie.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-transparent to-transparent" />
      </div>

      <div className="relative container mx-auto px-4 h-full flex items-center">
        <div className="max-w-2xl space-y-6">
          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 bg-red-600 text-white text-sm font-semibold rounded">
              Featured
            </span>
            <div className="flex items-center space-x-2 text-slate-300">
              {movie.genres.slice(0, 3).map((genre, index) => (
                <span key={genre}>
                  {genre}
                  {index < Math.min(movie.genres.length, 3) - 1 && (
                    <span className="mx-2">•</span>
                  )}
                </span>
              ))}
            </div>
          </div>

          <h1 className="text-6xl font-bold text-white leading-tight">
            {movie.title}
          </h1>

          <div className="flex items-center space-x-4 text-slate-300">
            <div className="flex items-center space-x-1">
              <span className="text-yellow-400 text-lg">★</span>
              <span className="font-semibold text-white">{movie.rating}</span>
            </div>
            <span>•</span>
            <span>{movie.release_year}</span>
            <span>•</span>
            <span>{movie.duration} min</span>
          </div>

          <p className="text-lg text-slate-300 leading-relaxed max-w-xl">
            {movie.description}
          </p>

          <div className="flex items-center space-x-4">
            <button
              onClick={onPlayClick}
              className="flex items-center space-x-2 px-8 py-3 bg-white text-slate-950 rounded-lg font-semibold hover:bg-slate-200 transition-colors"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Play Now</span>
            </button>

            <button
              onClick={onMoreInfoClick || onPlayClick}
              className="flex items-center space-x-2 px-8 py-3 bg-slate-800/80 text-white rounded-lg font-semibold hover:bg-slate-700 transition-colors backdrop-blur-sm"
            >
              <Info className="w-5 h-5" />
              <span>More Info</span>
            </button>

            <button className="p-3 bg-slate-800/80 text-white rounded-lg hover:bg-slate-700 transition-colors backdrop-blur-sm">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
