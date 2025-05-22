import React from 'react';
import { ConnectionData } from '../types';
import ConnectionImage from './ConnectionImage';

interface ConnectionResultsProps {
  isLoading: boolean;
  data: ConnectionData | null;
  submitted1: string;
  submitted2: string;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

const ConnectionResults: React.FC<ConnectionResultsProps> = ({
  isLoading,
  data,
  submitted1,
  submitted2,
  scrollRef,
}) => {


  const shouldCenterPath = (relationships: any[] = []) => {
    return relationships.length <= 3;
  };

  const renderContent = () => {
    if (isLoading) {
      return <h2>Searching for connections...</h2>;
    }

    if (data && data.relationships.length > 0) {
      const relationships = data.relationships;
      const names = data.names;
      const isCentered = shouldCenterPath(relationships);

      return (
        <>
          <h2>
            {submitted1.split(" - ")[0]} is connected to {submitted2.split(" - ")[0]} through a chain of{' '}
            {relationships.length} photo{relationships.length !== 1 ? 's' : ''}.
          </h2>

          <div
            ref={scrollRef}
            className={`scrollable-container ${isCentered ? 'scrollable-container-few-cards' : ''}`}
          >
            <div className={`connection-path ${isCentered ? 'connection-path-centered' : ''}`}>
              {relationships.map((rel, index) => (
                <ConnectionImage
                  key={rel.id ?? `conn-${index}`}
                  url={rel.thumbUrl}
                  names={names}
                  index={index}
                  caption={rel.caption}
                  date={rel.dateCreated}
                  relid={rel.relid}
                />
              ))}
            </div>
          </div>
        </>
      );
    }


    return <h2>No connection found between {submitted1.split(" - ")[0]} and {submitted2.split(" - ")[0]}.</h2>;
  };

  return (
    <div className="connection-result">
      {renderContent()}
    </div>
  );
};

export default ConnectionResults;