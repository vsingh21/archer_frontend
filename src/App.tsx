import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom'; // Import routing components
import './App.css'; // Import global styles
import { useTheme } from './hooks/useTheme'; // Keep the theme hook
import { useAuth } from './hooks/useAuth'; // Import auth hook
import NavigationBar from './components/NavigationBar'; // Keep the persistent navigation

import SearchPage from './pages/SearchPage';
import AboutPage from './pages/AboutPage';
import ContributePage from './pages/ContributePage';
import AdminPage from './pages/AdminPage';

// Protected route component
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  
  // Show loading state
  if (loading) {
    return <div>Loading...</div>;
  }
  
  // Only check if user is authenticated, not role
  if (!user) {
    console.log('Not authenticated. User:', user);
    return <Navigate to="/admin" />;
  }
  
  console.log('User authenticated:', user);
  // If authenticated, render the children
  return <>{children}</>;
};

function App() {
  const [theme, toggleTheme] = useTheme();

  return (
    <div className={`app ${theme}-mode-app-container`}>
      <NavigationBar theme={theme} toggleTheme={toggleTheme} />
      <main>
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/about" element={<AboutPage />} />

          {/* Route for the Contribute page */}
          <Route path="/contribute" element={<ContributePage />} />
          
          {/* Route for the Admin login page - accessible to all */}
          <Route path="/admin" element={<AdminPage />} />
          
          {/* Protected route for admin dashboard */}
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute>
                <AdminPage dashboard={true} />
              </ProtectedRoute>
            } 
          />

          {/* Optional: Catch-all route for 404 Not Found pages */}
          {/* <Route path="*" element={<NotFoundPage />} /> */}
        </Routes>
      </main>
    </div>
  );
}

export default App;