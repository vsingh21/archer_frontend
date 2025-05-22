import React from 'react';

interface GettyImageEmbedProps {
  embedHTML: string;
}

const GettyImageEmbed = React.memo(({ embedHTML }: GettyImageEmbedProps) => {

  const gettyUrl = embedHTML.match(/href='([^']+)'/)?.[1] || '';

  return (
    <a
      href={gettyUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="getty-embed-container"
      style={{
        width: '100%',
        height: '100%',
        minHeight: '400px',
        backgroundColor: '#1a1a1a',
        textDecoration: 'none',
        color: '#999',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      View on Getty Images
    </a>
  );
});

export default GettyImageEmbed;