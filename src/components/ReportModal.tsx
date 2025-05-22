import React, { useState } from 'react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectionData: any;
}

const reportReasons = [
  "Inappropriate content",
  "Copyright violation",
  "Incorrect information",
  "Person misidentified",
  "Poor image quality",
  "Other"
];

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, connectionData }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [selectedRelId, setSelectedRelId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedImage || !selectedRelId || !reason) {
      setSubmitError("Please select an image and reason for reporting");
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/reportContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          relationship_id: selectedRelId,
          image_url: selectedImageUrl,
          reason,
          additional_info: additionalInfo
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      setSubmitSuccess(true);
      // Auto close after 3 seconds on success
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (error) {
      console.error("Error submitting report:", error);
      setSubmitError(error instanceof Error ? error.message : "Failed to submit report");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSelectImage = (index: number, url: string, relId: string) => {
    setSelectedImage(`Image ${index + 1}`);
    setSelectedImageUrl(url);
    setSelectedRelId(relId);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content report-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <h2>Report Content</h2>
        
        {submitSuccess ? (
          <div className="report-success">
            <p>Thank you for your report. We will review it shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Select Image to Report:</label>
              <div className="report-images-grid">
                {connectionData?.relationships?.map((rel: any, index: number) => (
                  <div 
                    key={index} 
                    className={`report-image-item ${selectedImage === `Image ${index + 1}` ? 'selected' : ''}`}
                    onClick={() => handleSelectImage(index, rel.thumbUrl, rel.relid)}
                  >
                    <img src={rel.thumbUrl} alt={`Connection ${index + 1}`} />
                    <div className="report-image-label">Image {index + 1}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="report-reason">Reason for Reporting:</label>
              <select 
                id="report-reason" 
                value={reason} 
                onChange={(e) => setReason(e.target.value)}
                required
              >
                <option value="">-- Select a reason --</option>
                {reportReasons.map((reportReason, index) => (
                  <option key={index} value={reportReason}>
                    {reportReason}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="additional-info">Additional Information:</label>
              <textarea 
                id="additional-info" 
                value={additionalInfo} 
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="Please provide any additional details about your report"
                rows={3}
              />
            </div>
            
            {submitError && <div className="error-message">{submitError}</div>}
            
            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-button" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="submit-button" 
                disabled={isSubmitting || !selectedImage || !reason}
              >
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReportModal; 