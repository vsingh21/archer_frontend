import React from 'react';
import './PageStyles.css';

const AboutPage: React.FC = () => {
  return (
    <div className="page-content">
      <h1>About Archer</h1>
      <p>
        Archer is a tool designed to explore the connections between public figures (and maybe even <a href="/contribute">you</a> 👀),
        visualized through a chain of related photographs. Think of it as the <a href="https://en.wikipedia.org/wiki/Six_degrees_of_separation">Six Degrees of Separation</a> idea
        but based on visual media appearances. We wanted to create a visual, interactive way to uncover those connections.
      </p>

      <h2>How it Works</h2>
      <p>
        Simply enter the names of two individuals you're curious about. Archer queries its
        database (powered by several online sources and user contributions) to find
        photographs featuring both individuals, or a sequence of photos connecting them
        indirectly through other people they've appeared with.
      </p>
      <p>
        For example, finding a connection between Person A and Person C might involve a photo
        of Person A with Person B, and another photo of Person B with Person C.
      </p>

      <h2>Technology</h2>
      <p>
        Archer is built with React and TypeScript on the frontend. The backend is powered by
        Python and Flask, which handle the connection logic, image metadata parsing, and API routing.
        We use a Neo4j graph database to efficiently model and traverse the relationships between people
        based on shared appearances in photographs. 
      </p>

      <h2>Disclaimer</h2>
      <p>
        The connections shown are based on publicly available photographic records and their associated metadata.
        The accuracy and completeness depend on the data sources. This tool is intended for informational
        and entertainment purposes.
      </p>

      <h2>About the Creators</h2>
      <p>
        Archer was developed by developed by Viraj Singh (University of Illinois Urbana-Champaign) and Nishanth Jadav (Villanova University), Class of 2028.
      </p>

    </div>
  );
};

export default AboutPage;
