import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Film, Check, X, Home } from 'lucide-react';

export function AddFilm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    logline: '',
    synopsis: '',
    genre: '',
    release_year: new Date().getFullYear(),
    runtime_min: '',
    rating: '',
    country: 'Nigeria',
    languages_audio: 'English',
    languages_subtitles: '',
    cast: '',
    director: '',
    studio_label: '',
    tags: '',
    video_url: '',
    poster_url: '',
    thumbnail_url: '',
    status: 'published',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const genres = [
    'Action', 'Comedy', 'Drama', 'Romance', 'Thriller', 'Horror',
    'Sci-Fi', 'Animation', 'Documentary', 'Fantasy', 'Adventure', 'Mystery'
  ];

  const ratings = ['G', 'PG', 'PG-13', 'R', 'NC-17', 'NR'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const filmData = {
        id: `film-${Date.now()}`,
        title: formData.title,
        logline: formData.logline,
        synopsis: formData.synopsis || formData.logline,
        genre: formData.genre,
        release_year: parseInt(formData.release_year.toString()),
        runtime_min: parseInt(formData.runtime_min),
        rating: formData.rating,
        setting_region: formData.country,
        languages_audio: formData.languages_audio,
        languages_subtitles: formData.languages_subtitles || formData.languages_audio,
        cast_members: formData.cast,
        director: formData.director,
        studio_label: formData.studio_label,
        tags: formData.tags,
        video_url: formData.video_url,
        poster_url: formData.poster_url,
        thumbnail_url: formData.thumbnail_url || formData.poster_url,
        status: formData.status,
        views: 0,
        created_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase
        .from('films')
        .insert(filmData);

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => {
        navigate('/admin/films');
      }, 2000);
    } catch (err: any) {
      console.error('Error adding film:', err);
      setError(err.message || 'Failed to add film');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Film Added Successfully!
          </h2>
          <p className="text-gray-600 mb-6">
            The film has been added to your catalog.
          </p>
          <p className="text-sm text-gray-500">
            Redirecting to films list...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Add New Film</h1>
          <p className="text-gray-600">Add a new film to your catalog</p>
        </div>
        <Link
          to="/"
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
        >
          <Home className="h-4 w-4" />
          Back to Home
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 flex items-start gap-3">
          <X className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600 flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Enter film title"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logline <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="logline"
              value={formData.logline}
              onChange={handleChange}
              required
              maxLength={150}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="One-line summary (max 150 characters)"
            />
            <p className="text-xs text-gray-500 mt-1">{formData.logline.length}/150</p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Synopsis
            </label>
            <textarea
              name="synopsis"
              value={formData.synopsis}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Detailed description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Genre <span className="text-red-500">*</span>
            </label>
            <select
              name="genre"
              value={formData.genre}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">Select genre</option>
              {genres.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating <span className="text-red-500">*</span>
            </label>
            <select
              name="rating"
              value={formData.rating}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">Select rating</option>
              {ratings.map(rating => (
                <option key={rating} value={rating}>{rating}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Release Year <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="release_year"
              value={formData.release_year}
              onChange={handleChange}
              required
              min="1900"
              max={new Date().getFullYear() + 5}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Runtime (minutes) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="runtime_min"
              value={formData.runtime_min}
              onChange={handleChange}
              required
              min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country/Region <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Audio Language <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="languages_audio"
              value={formData.languages_audio}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subtitle Languages
            </label>
            <input
              type="text"
              name="languages_subtitles"
              value={formData.languages_subtitles}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Comma-separated"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Director
            </label>
            <input
              type="text"
              name="director"
              value={formData.director}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Studio Label <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="studio_label"
              value={formData.studio_label}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cast
            </label>
            <input
              type="text"
              name="cast"
              value={formData.cast}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Comma-separated cast members"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Comma-separated tags"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              name="video_url"
              value={formData.video_url}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="https://example.com/video.mp4"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Poster URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              name="poster_url"
              value={formData.poster_url}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="https://example.com/poster.jpg"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thumbnail URL
            </label>
            <input
              type="url"
              name="thumbnail_url"
              value={formData.thumbnail_url}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="https://example.com/thumbnail.jpg (optional, uses poster if empty)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/admin/films')}
            className="px-6 py-2 text-gray-700 hover:text-gray-900 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Adding Film...
              </>
            ) : (
              <>
                <Film className="h-4 w-4" />
                Add Film
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
