import React, { useState } from 'react';
import ReportModal from './ReportModal';

// Report icon SVG component
const ReportIcon = ({ className = '', width = "24", height = "24", ...props }) => (
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
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
    <path d="M13 2v7h7"></path>
    <path d="M10 16l4-4"></path>
    <path d="M14 16l-4-4"></path>
  </svg>
);

interface ReportButtonProps {
  connectionData: any;
}

const ReportButton: React.FC<ReportButtonProps> = ({ connectionData }) => {
  const [isModalOpen, setModalOpen] = useState(false);

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  return (
    <>
      <button 
        className="report-button" 
        onClick={handleOpenModal}
        title="Report content"
        aria-label="Report inappropriate content"
      >
        <ReportIcon width="24" height="24" />
      </button>
      
      {isModalOpen && (
        <ReportModal 
          isOpen={isModalOpen} 
          onClose={handleCloseModal} 
          connectionData={connectionData} 
        />
      )}
    </>
  );
};

export default ReportButton; 