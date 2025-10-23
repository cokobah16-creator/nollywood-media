import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface StarRatingProps {
  filmId: string;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
}

export function StarRating({ filmId, readonly = false, size = 'md', showCount = true }: StarRatingProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  useEffect(() => {
    loadRatings();
  }, [filmId, user]);

  const loadRatings = async () => {
    try {
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('ratings')
        .select('stars')
        .eq('film_id', filmId);

      if (ratingsError) throw ratingsError;

      if (ratingsData && ratingsData.length > 0) {
        const avg = ratingsData.reduce((sum, r) => sum + r.stars, 0) / ratingsData.length;
        setAverageRating(avg);
        setRatingCount(ratingsData.length);
      }

      if (user) {
        const { data: userRatingData } = await supabase
          .from('ratings')
          .select('stars')
          .eq('film_id', filmId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (userRatingData) {
          setUserRating(userRatingData.stars);
          setRating(userRatingData.stars);
        }
      }
    } catch (error) {
      console.error('Error loading ratings:', error);
    }
  };

  const handleRate = async (stars: number) => {
    if (readonly || !user || loading) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('ratings')
        .upsert({
          user_id: user.id,
          film_id: filmId,
          stars,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,film_id'
        });

      if (error) throw error;

      setUserRating(stars);
      setRating(stars);
      await loadRatings();
    } catch (error) {
      console.error('Error saving rating:', error);
    } finally {
      setLoading(false);
    }
  };

  const displayRating = readonly ? averageRating : (hoverRating || rating);

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => !readonly && handleRate(star)}
            onMouseEnter={() => !readonly && setHoverRating(star)}
            onMouseLeave={() => !readonly && setHoverRating(0)}
            disabled={readonly || loading}
            className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform ${sizes[size]}`}
          >
            <Star
              className={`${
                star <= displayRating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-none text-gray-300 dark:text-gray-600'
              } ${sizes[size]}`}
            />
          </button>
        ))}
      </div>

      {showCount && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {readonly ? (
            <>
              <span className="font-medium">{averageRating.toFixed(1)}</span>
              {ratingCount > 0 && <span> ({ratingCount.toLocaleString()})</span>}
            </>
          ) : userRating > 0 ? (
            <span>Your rating: {userRating}</span>
          ) : (
            <span>Rate this</span>
          )}
        </div>
      )}
    </div>
  );
}
