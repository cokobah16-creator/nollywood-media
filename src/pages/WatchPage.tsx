import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, ThumbsUp, Send } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { MP4Video } from "../components/MP4Video";

interface Film {
  id: string;
  title: string;
  poster_url: string;
  logline: string;
  synopsis: string;
  genre: string;
  release_year: number;
  runtime_min: number;
  rating: string;
  director: string;
  cast_members: string;
  video_url: string;
}

interface Comment {
  id: string;
  content: string;
  rating: number | null;
  created_at: string;
  user_id: string;
  user_profile: {
    display_name: string;
    avatar_url: string;
  } | null;
  likes_count: number;
  user_has_liked: boolean;
}

export default function WatchPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [film, setFilm] = useState<Film | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [userRating, setUserRating] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      loadFilmAndComments();
    }
  }, [id, user]);

  const loadFilmAndComments = async () => {
    try {
      // Load film
      const { data: filmData, error: filmError } = await supabase
        .from("films")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (filmError) throw filmError;
      setFilm(filmData);

      // Load comments with profiles and like counts
      await loadComments();
    } catch (error) {
      console.error("Error loading film:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const { data: commentsData, error } = await supabase
        .from("film_comments")
        .select(`
          *,
          user_profile:user_profiles(display_name, avatar_url)
        `)
        .eq("film_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get like counts and user's likes for each comment
      const commentsWithLikes = await Promise.all(
        (commentsData || []).map(async (comment) => {
          const { count } = await supabase
            .from("comment_likes")
            .select("*", { count: "exact", head: true })
            .eq("comment_id", comment.id);

          let userHasLiked = false;
          if (user) {
            const { data: likeData } = await supabase
              .from("comment_likes")
              .select("id")
              .eq("comment_id", comment.id)
              .eq("user_id", user.id)
              .maybeSingle();
            userHasLiked = !!likeData;
          }

          return {
            ...comment,
            likes_count: count || 0,
            user_has_liked: userHasLiked,
          };
        })
      );

      setComments(commentsWithLikes);
    } catch (error) {
      console.error("Error loading comments:", error);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Please sign in to comment");
      return;
    }
    if (!commentText.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("film_comments").insert({
        film_id: id,
        user_id: user.id,
        content: commentText.trim(),
        rating: userRating > 0 ? userRating : null,
      });

      if (error) throw error;

      setCommentText("");
      setUserRating(0);
      await loadComments();
    } catch (error: any) {
      console.error("Error submitting comment:", error);
      alert("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string, currentlyLiked: boolean) => {
    if (!user) {
      alert("Please sign in to like comments");
      return;
    }

    try {
      if (currentlyLiked) {
        await supabase
          .from("comment_likes")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", user.id);
      } else {
        await supabase.from("comment_likes").insert({
          comment_id: commentId,
          user_id: user.id,
        });
      }

      await loadComments();
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-red-600 mx-auto"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

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

  const averageRating =
    comments.length > 0
      ? comments.filter((c) => c.rating).reduce((sum, c) => sum + (c.rating || 0), 0) /
        comments.filter((c) => c.rating).length
      : 0;

  return (
    <div className="min-h-screen bg-slate-950 pt-16">
      <div className="container mx-auto px-4 py-6">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        {/* Video Player */}
        <div className="mb-8">
          {film.video_url ? (
            <MP4Video
              src={film.video_url}
              poster={film.poster_url}
              title={film.title}
            />
          ) : (
            <div className="aspect-video bg-slate-900 rounded-lg flex items-center justify-center">
              <p className="text-slate-400">Video URL not configured</p>
            </div>
          )}
        </div>

        {/* Film Info */}
        <div className="mb-8 rounded-lg border border-slate-800 bg-slate-900 p-6">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-white">{film.title}</h1>
              <div className="flex items-center gap-4 text-sm text-slate-300">
                <span className="rounded bg-red-600 px-2 py-1 text-xs font-semibold">
                  {film.rating}
                </span>
                <span>{film.release_year}</span>
                <span>{film.runtime_min} min</span>
                <span className="font-semibold text-yellow-400">{film.genre}</span>
              </div>
            </div>
            {averageRating > 0 && (
              <div className="text-center">
                <div className="flex items-center gap-1 text-yellow-400">
                  <Star className="h-6 w-6 fill-current" />
                  <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
                </div>
                <p className="text-xs text-slate-400">
                  {comments.filter((c) => c.rating).length} ratings
                </p>
              </div>
            )}
          </div>

          <p className="mb-4 text-lg font-semibold text-slate-200">{film.logline}</p>

          {film.synopsis && (
            <div className="mb-4">
              <h3 className="mb-2 font-semibold text-white">Synopsis</h3>
              <p className="text-slate-300">{film.synopsis}</p>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {film.director && (
              <div>
                <span className="font-semibold text-slate-400">Director:</span>{" "}
                <span className="text-white">{film.director}</span>
              </div>
            )}
            {film.cast_members && (
              <div>
                <span className="font-semibold text-slate-400">Cast:</span>{" "}
                <span className="text-white">{film.cast_members}</span>
              </div>
            )}
          </div>
        </div>

        {/* Comments Section */}
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-6 text-2xl font-bold text-white">
            Comments ({comments.length})
          </h2>

          {/* Comment Form */}
          {user ? (
            <form onSubmit={handleSubmitComment} className="mb-8">
              <div className="mb-4">
                <label className="mb-2 block text-sm font-semibold text-slate-300">
                  Your Rating (Optional)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setUserRating(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= userRating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-slate-600"
                        }`}
                      />
                    </button>
                  ))}
                  {userRating > 0 && (
                    <button
                      type="button"
                      onClick={() => setUserRating(0)}
                      className="ml-2 text-sm text-slate-400 hover:text-white"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share your thoughts..."
                  rows={3}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white placeholder-slate-400 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
                />
                <button
                  type="submit"
                  disabled={submitting || !commentText.trim()}
                  className="flex items-center gap-2 rounded-lg bg-red-600 px-6 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  <Send className="h-4 w-4" />
                  Post
                </button>
              </div>
            </form>
          ) : (
            <div className="mb-8 rounded-lg border border-slate-700 bg-slate-800 p-4 text-center">
              <p className="text-slate-400">
                <button
                  onClick={() => navigate("/")}
                  className="text-red-600 hover:text-red-500 font-semibold"
                >
                  Sign in
                </button>{" "}
                to leave a comment
              </p>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-center text-slate-400">
                No comments yet. Be the first to share your thoughts!
              </p>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className="rounded-lg border border-slate-800 bg-slate-800/50 p-4"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {comment.user_profile?.avatar_url ? (
                        <img
                          src={comment.user_profile.avatar_url}
                          alt={comment.user_profile.display_name || "User"}
                          className="h-10 w-10 rounded-full"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700">
                          <span className="font-semibold text-white">
                            {(comment.user_profile?.display_name || "U")[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-white">
                          {comment.user_profile?.display_name || "Anonymous User"}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(comment.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    {comment.rating && (
                      <div className="flex items-center gap-1 text-yellow-400">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="font-semibold">{comment.rating}</span>
                      </div>
                    )}
                  </div>

                  <p className="mb-3 text-slate-200">{comment.content}</p>

                  <button
                    onClick={() =>
                      handleLikeComment(comment.id, comment.user_has_liked)
                    }
                    className={`flex items-center gap-2 rounded-lg px-3 py-1 text-sm transition-colors ${
                      comment.user_has_liked
                        ? "bg-red-600 text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    <span>{comment.likes_count}</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
