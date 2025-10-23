import { Play, Star } from 'lucide-react';
import { Movie, TVShow } from '../types';
import { WatchlistButton } from './WatchlistButton';

interface ContentCardProps {
  content: Movie | TVShow;
  type: 'movie' | 'tv_show';
  onPlayClick: () => void;
}

export function ContentCard({ content, type, onPlayClick }: ContentCardProps) {
  return (
    <div className="group relative rounded-lg overflow-hidden bg-slate-900 transition-all hover:scale-105 hover:z-10">
      <div className="aspect-[2/3] relative overflow-hidden">
        <img
          src={content.poster_url}
          alt={content.title}
          className="w-full h-full object-cover transition-transform group-hover:scale-110"
        />

        <div className="absolute top-2 right-2 z-10">
          <WatchlistButton filmId={content.id} size="md" />
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center space-x-2 mb-2">
            <button
              onClick={onPlayClick}
              className="p-2 bg-white text-slate-950 rounded-full hover:bg-slate-200 transition-colors"
            >
              <Play className="w-4 h-4 fill-current" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-white line-clamp-1">{content.title}</h3>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-1 text-yellow-400">
            <Star className="w-4 h-4 fill-current" />
            <span className="text-white font-medium">{content.rating}</span>
          </div>
          <span className="text-slate-400">{content.release_year}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {content.genres.slice(0, 2).map((genre) => (
            <span
              key={genre}
              className="text-xs px-2 py-1 bg-slate-800 text-slate-300 rounded"
            >
              {genre}
            </span>
          ))}
        </div>

        {type === 'tv_show' && 'seasons' in content && (
          <p className="text-sm text-slate-400">
            {content.seasons} Season{content.seasons > 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  );
}
