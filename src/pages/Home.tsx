import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ContentCard } from "../components/ContentCard";
import { useCatalog } from "../context/CatalogProvider";
import { Film } from "../lib/catalog";

export default function Home() {
  const [films, setFilms] = useState<Film[]>([]);
  const navigate = useNavigate();
  const { filmCatalog } = useCatalog();

  useEffect(() => {
    setFilms(filmCatalog || []);
  }, [filmCatalog]);

  const handlePlayClick = (film: Film) => {
    navigate(`/watch/${film.id}`);
  };

  const categories = [
    { title: 'New Releases', filter: (f: Film) => f.release_year === new Date().getFullYear() },
    { title: 'Popular', filter: (f: Film) => (f as any).views > 0 },
    { title: 'Romance', filter: (f: Film) => f.genre.includes('Romance') },
    { title: 'Drama', filter: (f: Film) => f.genre.includes('Drama') },
    { title: 'Action', filter: (f: Film) => f.genre.includes('Action') },
    { title: 'Comedy', filter: (f: Film) => f.genre.includes('Comedy') },
  ];

  return (
    <div className="bg-white min-h-screen pt-14 pl-60">
      <div className="px-6 py-6">
        {categories.map((category) => {
          const categoryFilms = films.filter(category.filter).slice(0, 12);

          if (categoryFilms.length === 0) return null;

          return (
            <div key={category.title} className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {category.title}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
                {categoryFilms.map((film) => (
                  <ContentCard
                    key={film.id}
                    content={{
                      ...film,
                      genres: [film.genre],
                      poster_url: film.poster_url || '/placeholder.jpg'
                    }}
                    type="movie"
                    onPlayClick={() => handlePlayClick(film)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
