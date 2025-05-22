import React, { useState } from 'react';
import ImageModal from './ImageModal';

const LikeIcon = ({ className = '', width = "20", height = "20", ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
    aria-hidden="true"
    focusable="false"
  >
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
  </svg>
);

const DislikeIcon = ({ className = '', width = "20", height = "20", ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
    aria-hidden="true"
    focusable="false"
  >
    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path>
  </svg>
);

interface ConnectionImageProps {
  url: string;
  names: string[];
  index: number;
  caption: string;
  date: string;
  relid?: string;
}

const ConnectionImage = React.memo(({
  url,
  names,
  caption,
  date,
  index,
  relid,
}: ConnectionImageProps) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [ratingStatus, setRatingStatus] = useState<'liked' | 'disliked' | null>(null);
  const [isRatingSubmitting, setIsRatingSubmitting] = useState(false);

  const name1 = names?.[index]?.split(" - ")[0] ?? 'N/A';
  const name2 = names?.[index + 1]?.split(" - ")[0] ?? 'N/A';

  const formattedDate = date ? new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }) : '';

  const submitRating = async (rating: 'like' | 'dislike') => {
    if (!relid) {
      console.error('No relationship ID available for rating');
      return;
    }

    console.log(`Submitting ${rating} rating for relationship ID: ${relid}`);
    setIsRatingSubmitting(true);
    try {
      const isLike = rating === 'like';
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/updateRating?relid=${encodeURIComponent(relid)}&isLike=${isLike}`;
      console.log(`Requesting: ${apiUrl}`);
      
      const response = await fetch(apiUrl);
      
      if (response.ok) {
        const responseText = await response.text();
        console.log(`Rating update success: ${responseText}`);
        setRatingStatus(rating === 'like' ? 'liked' : 'disliked');
      } else {
        const errorText = await response.text();
        console.error(`Failed to submit ${rating} (${response.status}):`, errorText);
        alert(`Failed to update rating: ${errorText}`);
      }
    } catch (error) {
      console.error(`Error submitting ${rating}:`, error);
    } finally {
      setIsRatingSubmitting(false);
    }
  };

  const handleLike = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    submitRating('like');
  };

  const handleDislike = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    submitRating('dislike');
  };

  return (
    <>
      <div className="connection-image" onClick={() => setModalOpen(true)}>
        <div className="image-container">
          <img
            src={url}
            alt={`Connection between ${name1} and ${name2}`}
            className="connection-img"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/placeholder-image.png';
              (e.currentTarget as HTMLImageElement).alt = 'Image unavailable';
            }}
          />
          <div className="image-actions">
            <button
              onClick={handleLike}
              className={`action-button like-button ${ratingStatus === 'liked' ? 'active' : ''}`}
              aria-label="Like this image"
              title="Like"
              disabled={isRatingSubmitting || ratingStatus !== null}
            >
              <LikeIcon width="18" height="18" />
            </button>
            <button
              onClick={handleDislike}
              className={`action-button dislike-button ${ratingStatus === 'disliked' ? 'active' : ''}`}
              aria-label="Dislike this image"
              title="Dislike"
              disabled={isRatingSubmitting || ratingStatus !== null}
            >
              <DislikeIcon width="18" height="18" />
            </button>
          </div>
        </div>
        <div className="connection-details">
           <div className="connection-info">
             <div className="connection-date">
               {formattedDate && <p>{formattedDate}</p>}
             </div>
             <div className="connection-names">
               {name1 !== 'N/A' && <p>{name1}</p>}
               <p>↓</p>
               {name2 !== 'N/A' && <p>{name2}</p>}
             </div>
           </div>
           {caption && <hr />}
           <div className="connection-caption">
             {caption && <p>{caption}</p>}
           </div>
        </div>
      </div>
      <ImageModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        url={url}
        caption={caption}
        date={date}
        names={names}
        index={index}
      />
    </>
  );
});

export default ConnectionImage;