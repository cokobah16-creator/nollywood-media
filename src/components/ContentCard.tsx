import { Clock, Eye } from 'lucide-react';
import { Movie, TVShow } from '../types';
import { WatchlistButton } from './WatchlistButton';

interface ContentCardProps {
  content: Movie | TVShow;
  type: 'movie' | 'tv_show';
  onPlayClick: () => void;
}

export function ContentCard({ content, type, onPlayClick }: ContentCardProps) {
  return (
    <div className="group cursor-pointer" onClick={onPlayClick}>
      <div className="relative aspect-video bg-gray-200 rounded-xl overflow-hidden mb-3">
        <img
          src={content.poster_url}
          alt={content.title}
          className="w-full h-full object-cover"
        />

        <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
          {content.runtime_min}m
        </div>

        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
            <span className="text-white font-medium">Watch Now</span>
          </div>
        </div>

        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <WatchlistButton filmId={content.id} size="sm" />
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1 text-sm">
            {content.title}
          </h3>
          <p className="text-xs text-gray-600 mb-1">{content.studio_label}</p>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{(content as any).views?.toLocaleString() || '0'} views</span>
            </div>
            <span>•</span>
            <span>{content.release_year}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
