import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CatalogContentRow } from "../components/CatalogContentRow";
import { Film } from "../lib/catalog";
import { X, Play } from "lucide-react";

export default function Home() {
  const [selected, setSelected] = useState<Film | null>(null);
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-slate-950 pt-20">
      <div className="container mx-auto pb-16">
        <div className="mb-8 px-4">
          <h1 className="text-4xl font-bold text-white">Discover Nollywood</h1>
          <p className="mt-2 text-slate-400">Explore authentic Nigerian cinema</p>
        </div>

        <CatalogContentRow
          title="New Releases"
          where={{ yearEq: currentYear }}
          sort="newest"
          onSelect={setSelected}
        />

        <CatalogContentRow
          title="Romance"
          where={{ genre: "Romance" }}
          sort="az"
          onSelect={setSelected}
        />

        <CatalogContentRow
          title="Drama"
          where={{ genre: "Drama" }}
          sort="newest"
          onSelect={setSelected}
        />

        <CatalogContentRow
          title="Thriller"
          where={{ genre: "Thriller" }}
          sort="newest"
          onSelect={setSelected}
        />

        <CatalogContentRow
          title="Fantasy"
          where={{ genre: "Fantasy" }}
          sort="newest"
          onSelect={setSelected}
        />

        <CatalogContentRow
          title="Action & Adventure"
          where={{ genre: "Action" }}
          sort="newest"
          onSelect={setSelected}
        />

        <CatalogContentRow
          title="Comedy"
          where={{ genre: "Comedy" }}
          sort="newest"
          onSelect={setSelected}
        />

        <CatalogContentRow
          title="Anime"
          where={{ tagsIncludesAny: ["anime"] }}
          sort="newest"
          onSelect={setSelected}
        />

        <CatalogContentRow
          title="Music & Concerts"
          where={{ tagsIncludesAny: ["music", "concert", "afrobeats", "afrobeat"] }}
          sort="newest"
          onSelect={setSelected}
        />

        <CatalogContentRow
          title="Horror & Supernatural"
          where={{ genre: "Horror" }}
          sort="newest"
          onSelect={setSelected}
        />

        <CatalogContentRow
          title="TV Series"
          where={{ tagsIncludesAny: ["crime", "anthology"] }}
          sort="newest"
          onSelect={setSelected}
        />

        <CatalogContentRow
          title="Documentaries"
          where={{ genre: "Documentary" }}
          sort="newest"
          onSelect={setSelected}
        />

        <CatalogContentRow
          title="Family Stories"
          where={{ tagsIncludesAny: ["family drama", "maternal love", "family"] }}
          sort="newest"
          onSelect={setSelected}
        />
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
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
