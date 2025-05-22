import React from 'react';
import { Link } from 'react-router-dom';
import { Theme } from '../types';

interface NavigationBarProps {
  theme: Theme;
  toggleTheme: () => void;
}

const NavigationBar: React.FC<NavigationBarProps> = ({ theme, toggleTheme }) => {
  return (
    <nav className="top-nav">
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/about">About</Link></li>
        <li><Link to="/contribute">Contribute</Link></li>
        <li>
          <button
            onClick={toggleTheme}
            className="theme-toggle-button"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default NavigationBar;