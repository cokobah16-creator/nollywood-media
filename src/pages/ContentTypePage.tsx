import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useCatalog } from "../context/CatalogProvider";
import { Film } from "../lib/catalog";
import { Play, X, ArrowLeft } from "lucide-react";

const contentTypeLabels: Record<string, string> = {
  movie: "Movies",
  series: "TV Series",
  anime: "Anime",
  music: "Music & Concerts",
  documentary: "Documentaries",
};

export default function ContentTypePage() {
  const { type } = useParams<{ type: string }>();
  const { films, filter } = useCatalog();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Film | null>(null);

  const contentType = type || "movie";
  const pageTitle = contentTypeLabels[contentType] || contentType;

  const filteredFilms = films.filter(
    (f) => f.content_type === contentType
  );

  const sortedFilms = filter({}, "newest").filter(
    (f) => f.content_type === contentType
  );

  return (
    <div className="min-h-screen bg-slate-950 pt-20">
      <div className="container mx-auto px-4 py-8">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white">{pageTitle}</h1>
          <p className="mt-2 text-slate-400">
            {filteredFilms.length} {filteredFilms.length === 1 ? "title" : "titles"} available
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {sortedFilms.map((film) => (
            <div
              key={film.id}
              className="group relative cursor-pointer transition-transform hover:scale-105"
              onClick={() => setSelected(film)}
            >
              <div className="aspect-[2/3] overflow-hidden rounded-lg bg-gradient-to-br from-slate-800 to-slate-900">
                {film.poster_url ? (
                  <img
                    src={film.poster_url}
                    alt={film.title}
                    className="h-full w-full object-cover transition-opacity group-hover:opacity-75"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-4 text-center text-sm text-slate-500">
                    {film.title}
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                  <Play className="h-12 w-12 text-white" />
                </div>
              </div>
              <div className="mt-2">
                <h3 className="line-clamp-2 text-sm font-semibold text-white">{film.title}</h3>
                <p className="mt-1 text-xs text-slate-400">
                  {film.genre} • {film.release_year}
                </p>
              </div>
            </div>
          ))}
        </div>

        {sortedFilms.length === 0 && (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <p className="text-xl text-slate-400">No content available in this category</p>
              <Link
                to="/"
                className="mt-4 inline-block text-red-600 hover:underline"
              >
                Browse all content
              </Link>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-lg border border-slate-700 bg-slate-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 border-b border-slate-700 bg-slate-900/95 backdrop-blur">
              <div className="flex items-start justify-between gap-4 p-4">
                <div className="flex-1">
                  <h2 className="text-xl font-bold leading-tight text-white">
                    {selected.title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {selected.genre} • {selected.release_year} • {selected.runtime_min} min
                  </p>
                  <button
                    onClick={() => navigate(`/watch/${selected.id}`)}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    Watch Now
                  </button>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="rounded-full border border-slate-700 p-2 hover:bg-slate-800"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="grid gap-4 p-4 sm:grid-cols-2">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Synopsis
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  {selected.synopsis || selected.logline}
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Cast
                  </h3>
                  <p className="mt-1 text-sm text-slate-300">{selected.cast || "TBD"}</p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Director
                  </h3>
                  <p className="mt-1 text-sm text-slate-300">{selected.director || "TBD"}</p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Languages
                  </h3>
                  <p className="mt-1 text-sm text-slate-300">{selected.languages_audio}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
