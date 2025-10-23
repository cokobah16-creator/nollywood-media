import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Upload as UploadIcon, Film, Image, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Upload() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    logline: '',
    genre: '',
    tags: '',
    runtime_min: '',
    video_url: '',
    thumbnail_url: '',
    poster_url: '',
    creator_confirmation: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const genres = [
    'Action', 'Comedy', 'Drama', 'Romance', 'Thriller',
    'Horror', 'Sci-Fi', 'Animation', 'Documentary', 'Fantasy'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError('You must be logged in to upload content');
      return;
    }

    if (!formData.creator_confirmation) {
      setError('You must confirm that this content is AI-generated and created by you');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const { data, error: uploadError } = await supabase
        .from('user_uploads')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          logline: formData.logline,
          genre: formData.genre,
          tags: tagsArray,
          runtime_min: formData.runtime_min ? parseInt(formData.runtime_min) : null,
          video_url: formData.video_url || null,
          thumbnail_url: formData.thumbnail_url || null,
          poster_url: formData.poster_url || null,
          creator_confirmation: formData.creator_confirmation,
          ai_verification_status: 'pending',
          status: 'pending',
        })
        .select()
        .single();

      if (uploadError) throw uploadError;

      setSuccess(true);
      setTimeout(() => {
        navigate('/account/my-uploads');
      }, 2000);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload content');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Upload Submitted Successfully!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Your content has been submitted for moderation. You'll be notified once it's reviewed.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Redirecting to your uploads...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Upload Your Content
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Share your AI-generated content with the community. All uploads are reviewed by our moderation team.
        </p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Content Guidelines
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Content must be AI-generated and created by you</li>
              <li>• No copyrighted material or unauthorized content</li>
              <li>• Content must comply with our Terms of Service</li>
              <li>• Inappropriate or offensive content will be rejected</li>
              <li>• Videos should be in MP4 or HLS format</li>
            </ul>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 flex items-start gap-3">
          <X className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600 dark:text-red-400 flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-600 dark:text-red-400 hover:text-red-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="Enter content title"
          />
        </div>

        <div>
          <label htmlFor="logline" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Logline <span className="text-red-500">*</span>
          </label>
          <input
            id="logline"
            name="logline"
            type="text"
            value={formData.logline}
            onChange={handleChange}
            required
            maxLength={150}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="One-line summary (max 150 characters)"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {formData.logline.length}/150 characters
          </p>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="Detailed description of your content"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="genre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Genre <span className="text-red-500">*</span>
            </label>
            <select
              id="genre"
              name="genre"
              value={formData.genre}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select genre</option>
              {genres.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="runtime_min" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Runtime (minutes)
            </label>
            <input
              id="runtime_min"
              name="runtime_min"
              type="number"
              value={formData.runtime_min}
              onChange={handleChange}
              min="1"
              max="300"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="e.g., 90"
            />
          </div>
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tags
          </label>
          <input
            id="tags"
            name="tags"
            type="text"
            value={formData.tags}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="e.g., AI-generated, animation, sci-fi (comma-separated)"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Separate tags with commas
          </p>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Film className="h-5 w-5" />
            Media URLs
          </h3>

          <div className="space-y-4">
            <div>
              <label htmlFor="video_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Video URL <span className="text-red-500">*</span>
              </label>
              <input
                id="video_url"
                name="video_url"
                type="url"
                value={formData.video_url}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="https://example.com/video.mp4"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Direct link to your video file (MP4, HLS)
              </p>
            </div>

            <div>
              <label htmlFor="poster_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Poster Image URL
              </label>
              <input
                id="poster_url"
                name="poster_url"
                type="url"
                value={formData.poster_url}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="https://example.com/poster.jpg"
              />
            </div>

            <div>
              <label htmlFor="thumbnail_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Thumbnail URL
              </label>
              <input
                id="thumbnail_url"
                name="thumbnail_url"
                type="url"
                value={formData.thumbnail_url}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="https://example.com/thumbnail.jpg"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="flex items-start gap-3">
            <input
              id="creator_confirmation"
              name="creator_confirmation"
              type="checkbox"
              checked={formData.creator_confirmation}
              onChange={handleChange}
              required
              className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
            <label htmlFor="creator_confirmation" className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">I confirm that:</span>
              <ul className="mt-1 space-y-1 text-gray-600 dark:text-gray-400">
                <li>• This content is AI-generated</li>
                <li>• I am the original creator of this content</li>
                <li>• This content does not infringe on any copyrights</li>
                <li>• This content complies with the Terms of Service</li>
              </ul>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => navigate('/account')}
            className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
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
                Submitting...
              </>
            ) : (
              <>
                <UploadIcon className="h-4 w-4" />
                Submit for Review
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
