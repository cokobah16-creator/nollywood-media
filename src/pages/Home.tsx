import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCatalog } from "../context/CatalogProvider";
import { Film } from "../lib/catalog";
import { ContentSlider } from "../components/ContentSlider";
import { Play, Info } from "lucide-react";

export default function Home() {
  const [films, setFilms] = useState<Film[]>([]);
  const [featuredFilm, setFeaturedFilm] = useState<Film | null>(null);
  const navigate = useNavigate();
  const { filmCatalog } = useCatalog();

  useEffect(() => {
    if (filmCatalog && filmCatalog.length > 0) {
      setFilms(filmCatalog);
      const randomFilm = filmCatalog[Math.floor(Math.random() * filmCatalog.length)];
      setFeaturedFilm(randomFilm);
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
      title: 'TV Series',
      filter: (f: Film) => f.tags?.toLowerCase().includes('series') || f.tags?.toLowerCase().includes('anthology')
    },
    {
      title: 'Anime Collection',
      filter: (f: Film) => f.tags?.toLowerCase().includes('anime')
    },
    {
      title: 'Music & Concerts',
      filter: (f: Film) => f.tags?.toLowerCase().includes('music') || f.tags?.toLowerCase().includes('concert')
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
    {
      title: 'Horror & Supernatural',
      filter: (f: Film) => f.genre.includes('Horror')
    },
  ];

  return (
    <div className="bg-white min-h-screen pt-14 lg:pl-60">
      {featuredFilm && (
        <div className="relative h-[70vh] -mt-14 pt-14 mb-8">
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
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-lg">
                {featuredFilm.title}
              </h1>
              <p className="text-lg text-gray-200 mb-6 line-clamp-3 drop-shadow-lg">
                {featuredFilm.logline || featuredFilm.synopsis}
              </p>
              <div className="flex items-center gap-4 mb-6">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm rounded font-medium">
                  {featuredFilm.rating}
                </span>
                <span className="text-white text-sm">{featuredFilm.release_year}</span>
                <span className="text-white text-sm">{featuredFilm.runtime_min} min</span>
                <span className="px-3 py-1 bg-red-600 text-white text-sm rounded font-medium">
                  {featuredFilm.genre}
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate(`/watch/${featuredFilm.id}`)}
                  className="flex items-center gap-2 px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg"
                >
                  <Play className="w-5 h-5 fill-white" />
                  Watch Now
                </button>
                <button
                  onClick={() => navigate(`/watch/${featuredFilm.id}`)}
                  className="flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-lg font-semibold transition-all border border-white/40"
                >
                  <Info className="w-5 h-5" />
                  More Info
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 -mt-20">
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
      </div>
    </div>
  );
}
