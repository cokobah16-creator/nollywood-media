import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCatalog } from "../context/CatalogProvider";
import { Film } from "../lib/catalog";
import { ContentSlider } from "../components/ContentSlider";
import { Play, Info } from "lucide-react";

export default function Home() {
  const [films, setFilms] = useState<Film[]>([]);
  const [featuredFilm, setFeaturedFilm] = useState<Film | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { filmCatalog } = useCatalog();

  useEffect(() => {
    if (filmCatalog && filmCatalog.length > 0) {
      setFilms(filmCatalog);
      const randomFilm = filmCatalog[Math.floor(Math.random() * filmCatalog.length)];
      setFeaturedFilm(randomFilm);
      setLoading(false);
    }
  }, [filmCatalog]);

  const categories = [
    {
      title: 'Trending Now',
      filter: (f: Film) => f.release_year >= new Date().getFullYear() - 1
    },
    {
      title: 'New Releases',
      filter: (f: Film) => f.release_year === new Date().getFullYear()
    },
    {
      title: 'Nigerian Movies',
      filter: (f: Film) => f.setting_region?.toLowerCase().includes('nigeria')
    },
    {
      title: 'All Movies',
      filter: (f: Film) => true
    },
    {
      title: 'Romance',
      filter: (f: Film) => f.genre.includes('Romance')
    },
    {
      title: 'Drama',
      filter: (f: Film) => f.genre.includes('Drama')
    },
    {
      title: 'Action & Thriller',
      filter: (f: Film) => f.genre.includes('Action') || f.genre.includes('Thriller')
    },
    {
      title: 'Comedy',
      filter: (f: Film) => f.genre.includes('Comedy')
    },
  ];

  if (loading) {
    return (
      <div className="bg-white min-h-screen pt-14 lg:pl-60 flex items-center justify-center">
        <div className="text-gray-600 text-lg">Loading content...</div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pt-14 lg:pl-60">
      {featuredFilm && (
        <div className="relative h-[60vh] md:h-[70vh] bg-gray-900">
          <div className="absolute inset-0">
            <img
              src={featuredFilm.poster_url || '/placeholder.jpg'}
              alt={featuredFilm.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
          </div>

          <div className="relative h-full flex items-center px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 drop-shadow-lg">
                {featuredFilm.title}
              </h1>
              <p className="text-base sm:text-lg text-gray-200 mb-4 line-clamp-2 sm:line-clamp-3 drop-shadow-lg">
                {featuredFilm.logline || featuredFilm.synopsis}
              </p>
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className="px-2 sm:px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs sm:text-sm rounded font-medium">
                  {featuredFilm.rating}
                </span>
                <span className="text-white text-xs sm:text-sm">{featuredFilm.release_year}</span>
                <span className="text-white text-xs sm:text-sm">{featuredFilm.runtime_min} min</span>
                <span className="px-2 sm:px-3 py-1 bg-red-600 text-white text-xs sm:text-sm rounded font-medium">
                  {featuredFilm.genre}
                </span>
              </div>
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={() => navigate(`/watch/${featuredFilm.id}`)}
                  className="flex items-center gap-2 px-4 sm:px-8 py-2 sm:py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg text-sm sm:text-base"
                >
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
                  Watch Now
                </button>
                <button
                  onClick={() => navigate(`/watch/${featuredFilm.id}`)}
                  className="flex items-center gap-2 px-3 sm:px-6 py-2 sm:py-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-lg font-semibold transition-all border border-white/40 text-sm sm:text-base"
                >
                  <Info className="w-4 h-4 sm:w-5 sm:h-5" />
                  More Info
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="py-8">
        {categories.map((category) => {
          const categoryFilms = films.filter(category.filter);
          if (categoryFilms.length === 0) return null;

          return (
            <ContentSlider
              key={category.title}
              title={category.title}
              films={categoryFilms}
            />
          );
        })}

        {films.length === 0 && !loading && (
          <div className="text-center py-20">
            <p className="text-gray-600 text-lg">No content available</p>
          </div>
        )}
      </div>
    </div>
  );
}
