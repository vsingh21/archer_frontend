import React from 'react';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  caption: string;
  date: string;
  names?: string[];
  index?: number;
}

const ImageModal: React.FC<ImageModalProps> = ({ isOpen, onClose, url, caption, date, names, index }) => {

  if (!isOpen) return null;

  let nameDisplay = '';
  if (names && index !== undefined) {
    const name1 = names?.[index]?.split(" - ")[0] ?? '';
    const name2 = names?.[index + 1]?.split(" - ")[0] ?? '';
    if (name1 && name2) {
      nameDisplay = `${name1} → ${name2}`;
    }
  }

  const formattedDate = date ? new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : '';

  return (
    <div className="image-modal-overlay" onClick={onClose}>
      <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="image-modal-close" onClick={onClose} aria-label="Close">
          ✖
        </button>
        <div className="image-modal-inner">
          <div className="image-modal-img-container">
            <img src={url} alt={caption} className="image-modal-img" />
          </div>
          <div className="image-modal-details">
            {nameDisplay && <h3 className="image-modal-names">{nameDisplay}</h3>}
            {formattedDate && <p className="image-modal-date">{formattedDate}</p>}
            <p className="image-modal-caption">{caption}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageModal;
