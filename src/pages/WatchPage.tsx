import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useCatalog } from "../context/CatalogProvider";
import { MP4Video } from "../components/MP4Video";
import { ArrowLeft } from "lucide-react";

interface StreamData {
  type: "mp4" | "hls" | "dash";
  url: string;
  poster?: string;
  captions?: Array<{ lang: string; label: string; url: string; default?: boolean }>;
}

export default function WatchPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { films, filter } = useCatalog();
  const [streamData, setStreamData] = useState<StreamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const film = films.find((f) => f.id === id);

  const upNext = film
    ? filter({ genre: film.genre }, "newest")
        .filter((f) => f.id !== id)
        .slice(0, 5)
    : [];

  useEffect(() => {
    if (!id) return;

fetch("/streams.sample.json")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load streams");
        return res.json();
      })
      .then((data) => {
        const mappedId = `MLN-${id.padStart(3, "0")}`;
        if (data[mappedId]) {
          setStreamData(data[mappedId]);
        } else if (data[id]) {
          setStreamData(data[id]);
        } else {
          setStreamData({
            type: "mp4",
            url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            poster: film?.poster_url
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load stream:", err);
        setStreamData({
          type: "mp4",
          url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
          poster: film?.poster_url
        });
        setLoading(false);
      });
  }, [id]);

  if (!film) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Film not found</h1>
          <Link to="/" className="mt-4 inline-block text-red-600 hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-red-600"></div>
          <p>Loading video...</p>
        </div>
      </div>
    );
  }

  if (error || !streamData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{error || "Stream not available"}</h1>
          <p className="mt-2 text-slate-400">This title is not available for streaming yet.</p>
          <Link
            to="/"
            className="mt-4 inline-block rounded-lg bg-red-600 px-6 py-3 hover:bg-red-700"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const resumeFrom = parseFloat(localStorage.getItem(`watch_progress_${id}`) || "0");

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-4 py-8">
        <Link
          to="/"
          className="mb-4 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Browse
        </Link>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="aspect-video overflow-hidden rounded-lg bg-slate-900">
              {streamData.type === "mp4" ? (
                <MP4Video
                  src={streamData.url}
                  poster={streamData.poster || film.poster_url}
                  filmId={id!}
                  resumeFrom={resumeFrom}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-white">
                  <p>Unsupported stream type: {streamData.type}</p>
                </div>
              )}
            </div>

            <div className="mt-6 rounded-lg border border-slate-800 bg-slate-900 p-6">
              <h1 className="text-3xl font-bold text-white">{film.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-400">
                <span className="rounded bg-red-600 px-2 py-1 font-semibold text-white">
                  {film.rating}
                </span>
                <span>{film.release_year}</span>
                <span>•</span>
                <span>{film.runtime_min} min</span>
                <span>•</span>
                <span>{film.genre}</span>
              </div>

              <p className="mt-4 text-lg text-slate-300">{film.logline}</p>

              {film.synopsis && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Synopsis
                  </h3>
                  <p className="mt-2 whitespace-pre-line text-slate-300">{film.synopsis}</p>
                </div>
              )}

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Director
                  </div>
                  <div className="mt-1 text-slate-200">{film.director || "TBD"}</div>
                </div>
                <div>
                  <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Cast
                  </div>
                  <div className="mt-1 text-slate-200">{film.cast || "TBD"}</div>
                </div>
                <div>
                  <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Region
                  </div>
                  <div className="mt-1 text-slate-200">{film.setting_region}</div>
                </div>
                <div>
                  <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Languages
                  </div>
                  <div className="mt-1 text-slate-200">{film.languages_audio}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <h2 className="mb-4 text-xl font-bold text-white">Up Next</h2>
            <div className="space-y-3">
              {upNext.map((nextFilm) => (
                <Link
                  key={nextFilm.id}
                  to={`/watch/${nextFilm.id}`}
                  className="flex gap-3 rounded-lg border border-slate-800 bg-slate-900 p-3 transition-colors hover:border-slate-700 hover:bg-slate-800"
                >
                  <div className="h-20 w-32 flex-shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-slate-800 to-slate-900">
                    {nextFilm.poster_url ? (
                      <img
                        src={nextFilm.poster_url}
                        alt={nextFilm.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center p-2 text-xs text-slate-500">
                        {nextFilm.title}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-white">{nextFilm.title}</div>
                    <div className="mt-1 text-xs text-slate-400">
                      {nextFilm.genre} • {nextFilm.runtime_min} min
                    </div>
                    <div className="mt-1 line-clamp-2 text-xs text-slate-500">
                      {nextFilm.logline}
                    </div>
                  </div>
                </Link>
              ))}
              {upNext.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-700 p-4 text-center text-sm text-slate-500">
                  No more titles in this genre
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
