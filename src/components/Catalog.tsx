import { useMemo, useState } from "react";
import { Search, X, Filter } from "lucide-react";
import { Film } from "../lib/catalog";
import { useCatalog } from "../context/CatalogProvider";
import { tokenizeCSVish } from "../lib/catalog";

export default function Catalog() {
  const { films, loading } = useCatalog();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Film | null>(null);
  const [filterGenre, setFilterGenre] = useState<string>("all");
  const [filterRegion, setFilterRegion] = useState<string>("all");
  const [filterLanguage, setFilterLanguage] = useState<string>("all");
  const [filterRating, setFilterRating] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  const genres = useMemo(() => {
    const g = new Set<string>();
    films.forEach((f) => g.add(f.genre));
    return ["all", ...Array.from(g).sort()];
  }, [films]);

  const regions = useMemo(() => {
    const r = new Set<string>();
    films.forEach((f) => r.add(f.setting_region));
    return ["all", ...Array.from(r).sort()];
  }, [films]);

  const languages = useMemo(() => {
    const l = new Set<string>();
    films.forEach((f) => {
      tokenizeCSVish(f.languages_audio).forEach((lang) => l.add(lang));
    });
    return ["all", ...Array.from(l).sort()];
  }, [films]);

  const ratings = useMemo(() => {
    const r = new Set<string>();
    films.forEach((f) => r.add(f.rating));
    return ["all", ...Array.from(r).sort()];
  }, [films]);

  const filtered = useMemo(() => {
    let result = films.filter((f) => {
      const matchSearch = search
        ? f.title.toLowerCase().includes(search.toLowerCase()) ||
          f.logline.toLowerCase().includes(search.toLowerCase()) ||
          f.tags?.toLowerCase().includes(search.toLowerCase())
        : true;
      const matchGenre = filterGenre === "all" || f.genre === filterGenre;
      const matchRegion = filterRegion === "all" || f.setting_region === filterRegion;
      const matchLanguage =
        filterLanguage === "all" || f.languages_audio.includes(filterLanguage);
      const matchRating = filterRating === "all" || f.rating === filterRating;
      return matchSearch && matchGenre && matchRegion && matchLanguage && matchRating;
    });

    if (sortBy === "newest") {
      result.sort((a, b) => b.release_year - a.release_year);
    } else if (sortBy === "alpha") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "runtime") {
      result.sort((a, b) => b.runtime_min - a.runtime_min);
    }

    return result;
  }, [films, search, filterGenre, filterRegion, filterLanguage, filterRating, sortBy]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="text-xl text-slate-400">Loading catalog...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-4xl font-bold">Nollywood Originals Catalog</h1>

        <div className="mb-6 flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search titles, tags, or descriptions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 py-3 pl-11 pr-4 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Filter className="h-5 w-5 text-slate-400" />

            <select
              value={filterGenre}
              onChange={(e) => setFilterGenre(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            >
              {genres.map((g) => (
                <option key={g} value={g}>
                  {g === "all" ? "All Genres" : g}
                </option>
              ))}
            </select>

            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            >
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r === "all" ? "All Regions" : r}
                </option>
              ))}
            </select>

            <select
              value={filterLanguage}
              onChange={(e) => setFilterLanguage(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            >
              {languages.map((l) => (
                <option key={l} value={l}>
                  {l === "all" ? "All Languages" : l}
                </option>
              ))}
            </select>

            <select
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            >
              {ratings.map((r) => (
                <option key={r} value={r}>
                  {r === "all" ? "All Ratings" : r}
                </option>
              ))}
            </select>

            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-slate-400">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="newest">Newest</option>
                <option value="alpha">A–Z</option>
                <option value="runtime">Longest</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mb-4 text-sm text-slate-400">
          Showing {filtered.length} of {films.length} titles
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((film) => (
            <div
              key={film.id}
              onClick={() => setSelected(film)}
              className="group cursor-pointer overflow-hidden rounded-lg border border-slate-800 bg-slate-900 transition-all hover:scale-105 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/20"
            >
              <div className="relative aspect-[2/3] overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
                {film.poster_url ? (
                  <>
                    <img
                      src={film.poster_url}
                      alt={film.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.parentElement?.querySelector('.fallback-poster');
                        if (fallback) fallback.classList.remove('hidden');
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <div className="text-xs font-bold uppercase tracking-wider text-yellow-400 drop-shadow-lg">
                        {film.genre}
                      </div>
                      <h3 className="mt-1 text-2xl font-black uppercase leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.9), -1px -1px 2px rgba(0,0,0,0.5)' }}>
                        {film.title}
                      </h3>
                      <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-slate-200">
                        <span className="rounded bg-red-600 px-2 py-0.5">{film.rating}</span>
                        <span>{film.release_year}</span>
                        <span>•</span>
                        <span>{film.runtime_min}m</span>
                      </div>
                    </div>
                  </>
                ) : null}
                <div className={film.poster_url ? "fallback-poster hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 p-4 text-center" : "absolute inset-0 flex flex-col items-center justify-center p-4 text-center"}>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {film.genre}
                  </div>
                  <div className="mt-2 text-lg font-bold leading-tight">{film.title}</div>
                  <div className="mt-2 text-xs text-slate-400">
                    {film.release_year} • {film.runtime_min}m
                  </div>
                </div>
              </div>
              <div className="p-4">
                <p className="line-clamp-2 text-sm text-slate-300">{film.logline}</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                  <span className="rounded bg-slate-800 px-2 py-1">{film.rating}</span>
                  <span>{film.setting_region}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-xl text-slate-400">No films match your filters</p>
            <p className="mt-2 text-slate-500">Try adjusting your search or filters</p>
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
                <div>
                  <h2 className="text-xl font-bold leading-tight">{selected.title}</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {selected.genre} • {selected.release_year} • {selected.runtime_min} min
                  </p>
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
                  Logline
                </h3>
                <p className="mt-1 text-sm text-slate-200">{selected.logline}</p>
                {selected.synopsis && (
                  <>
                    <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Synopsis
                    </h3>
                    <p className="mt-1 whitespace-pre-line text-sm text-slate-200">
                      {selected.synopsis}
                    </p>
                  </>
                )}
                <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Cast
                </h3>
                <p className="mt-1 text-sm text-slate-200">{selected.cast || "TBD"}</p>
                <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Director
                </h3>
                <p className="mt-1 text-sm text-slate-200">{selected.director || "TBD"}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Region & Languages
                </h3>
                <p className="mt-1 text-sm text-slate-200">
                  {selected.setting_region} • Audio: {selected.languages_audio} • Subs:{" "}
                  {selected.languages_subtitles}
                </p>
                <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Studio Label
                </h3>
                <p className="mt-1 text-sm text-slate-200">{selected.studio_label}</p>
                {selected.tags && (
                  <>
                    <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Tags
                    </h3>
                    <p className="mt-1 text-sm text-slate-200">{selected.tags}</p>
                  </>
                )}
                {selected.poster_prompt && (
                  <>
                    <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Poster Prompt
                    </h3>
                    <p className="mt-1 text-sm text-slate-200">{selected.poster_prompt}</p>
                  </>
                )}
                {selected.trailer_prompt && (
                  <>
                    <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Trailer Prompt
                    </h3>
                    <p className="mt-1 text-sm text-slate-200">{selected.trailer_prompt}</p>
                  </>
                )}
                {selected.availability_note && (
                  <>
                    <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Availability
                    </h3>
                    <p className="mt-1 text-sm text-slate-200">{selected.availability_note}</p>
                  </>
                )}
                {selected.licensing_note && (
                  <>
                    <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Licensing
                    </h3>
                    <p className="mt-1 text-sm text-slate-200">{selected.licensing_note}</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
