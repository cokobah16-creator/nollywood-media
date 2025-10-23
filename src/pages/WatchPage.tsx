import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ThumbsUp, ThumbsDown, Share2, MoreHorizontal, Eye, Play } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { MP4Video } from "../components/MP4Video";
import { ContentCard } from "../components/ContentCard";
import { WatchlistButton } from "../components/WatchlistButton";
import { AdSpace } from "../components/AdSpace";

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
  studio_label: string;
  views: number;
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
  const [relatedFilms, setRelatedFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  useEffect(() => {
    if (id) {
      loadFilmAndComments();
      loadRelatedFilms();
    }
  }, [id, user]);

  const loadFilmAndComments = async () => {
    try {
      const { data: filmData, error: filmError } = await supabase
        .from("films")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (filmError) throw filmError;
      setFilm(filmData);

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
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

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

  const loadRelatedFilms = async () => {
    try {
      const { data, error } = await supabase
        .from("films")
        .select("*")
        .neq("id", id)
        .limit(10);

      if (error) throw error;
      setRelatedFilms(data || []);
    } catch (error) {
      console.error("Error loading related films:", error);
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
      });

      if (error) throw error;

      setCommentText("");
      await loadComments();
    } catch (error: any) {
      console.error("Error submitting comment:", error);
      alert("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!user) {
      alert("Please sign in to like comments");
      return;
    }

    try {
      const comment = comments.find((c) => c.id === commentId);
      if (!comment) return;

      if (comment.user_has_liked) {
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
      console.error("Error liking comment:", error);
    }
  };

  if (loading || !film) {
    return (
      <div className="bg-white min-h-screen pt-14 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen pt-14 lg:pl-60">
      <div className="flex gap-6">
        <div className="flex-1 max-w-6xl px-4 sm:px-6 py-6">
          <div className="aspect-video bg-black rounded-xl overflow-hidden mb-4 relative">
            {film.video_url ? (
              <MP4Video src={film.video_url} poster={film.poster_url} />
            ) : (
              <div className="w-full h-full relative">
                <img
                  src={film.poster_url}
                  alt={film.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
                  <div className="bg-red-600 p-4 rounded-full mb-4">
                    <Play className="w-12 h-12 fill-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Video Coming Soon</h3>
                  <p className="text-gray-300 text-sm">This content will be available shortly</p>
                </div>
              </div>
            )}
          </div>

          <h1 className="text-xl font-semibold text-gray-900 mb-2">{film.title}</h1>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{film.views?.toLocaleString() || '0'} views</span>
              </div>
              <span>•</span>
              <span>{new Date().toLocaleDateString()}</span>
            </div>

            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium transition-colors">
                <ThumbsUp className="w-5 h-5" />
                <span>Like</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium transition-colors">
                <ThumbsDown className="w-5 h-5" />
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium transition-colors">
                <Share2 className="w-5 h-5" />
                <span>Share</span>
              </button>
              <WatchlistButton filmId={film.id} size="md" />
              <button className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="bg-gray-100 rounded-xl p-4 mb-6">
            <div className="flex gap-3 mb-2">
              <span className="font-semibold text-gray-900">{film.studio_label}</span>
            </div>
            <p className={`text-sm text-gray-900 ${!showFullDescription ? 'line-clamp-2' : ''}`}>
              {film.synopsis || film.logline}
            </p>
            <button
              onClick={() => setShowFullDescription(!showFullDescription)}
              className="text-sm font-semibold text-gray-900 mt-2"
            >
              {showFullDescription ? 'Show less' : 'Show more'}
            </button>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {comments.length} Comments
            </h3>

            {user && (
              <form onSubmit={handleSubmitComment} className="flex gap-4 mb-6">
                <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full border-b border-gray-300 pb-2 focus:border-gray-900 focus:outline-none text-sm"
                  />
                  <div className="flex justify-end gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => setCommentText("")}
                      className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !commentText.trim()}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Comment
                    </button>
                  </div>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-900">
                        {comment.user_profile?.display_name || 'User'}
                      </span>
                      <span className="text-xs text-gray-600">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 mb-2">{comment.content}</p>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleLikeComment(comment.id)}
                        className={`flex items-center gap-2 text-sm ${
                          comment.user_has_liked ? 'text-blue-600' : 'text-gray-700'
                        }`}
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span>{comment.likes_count || ''}</span>
                      </button>
                      <button className="flex items-center gap-2 text-sm text-gray-700">
                        <ThumbsDown className="w-4 h-4" />
                      </button>
                      <button className="text-sm font-medium text-gray-700">Reply</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="hidden lg:block w-96 px-4 py-6">
          <div className="mb-6">
            <AdSpace variant="rectangle" />
          </div>

          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Related</h3>
          <div className="space-y-3">
            {relatedFilms.slice(0, 8).map((relatedFilm) => (
              <div key={relatedFilm.id} className="flex gap-2 cursor-pointer" onClick={() => navigate(`/watch/${relatedFilm.id}`)}>
                <div className="w-40 aspect-video bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={relatedFilm.poster_url || '/placeholder.jpg'}
                    alt={relatedFilm.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">
                    {relatedFilm.title}
                  </h4>
                  <p className="text-xs text-gray-600">{relatedFilm.studio_label}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                    <Eye className="w-3 h-3" />
                    <span>{relatedFilm.views?.toLocaleString() || '0'} views</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
