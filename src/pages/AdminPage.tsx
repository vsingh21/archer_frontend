import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './PageStyles.css';
import './AdminPage.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

interface Contribution {
  id: string;
  name: string;
  email: string;
  description: string;
  date: string;
  photo_path: string;
  people: string;
  is_new_person: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  is_owner: boolean;
  owner_name: string;
  landing_url: string;
  public_acknowledgment: boolean;
}

interface AdminPageProps {
  dashboard?: boolean;
}

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

const AdminPage: React.FC<AdminPageProps> = ({ dashboard = false }) => {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [filteredContributions, setFilteredContributions] = useState<Contribution[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { user, token, loading, login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Log auth state for debugging
    console.log('AdminPage auth state:', { 
      loading, 
      user, 
      dashboard, 
      hasToken: !!token,
      userRole: user?.role
    });

    // If we're on the login page and already logged in, redirect to dashboard
    if (!loading && user && !dashboard) {
      console.log('Redirecting to dashboard - user is authenticated');
      navigate('/admin/dashboard');
      return;
    }

    // If we're on the dashboard page and authenticated, fetch contributions
    if (dashboard && !loading && user) {
      console.log('Fetching contributions for dashboard');
      fetchContributions();
    }
  }, [loading, user, token, dashboard, navigate]);

  // Apply filters whenever contributions or filter status change
  useEffect(() => {
    if (filterStatus === 'all') {
      setFilteredContributions(contributions);
    } else {
      setFilteredContributions(
        contributions.filter(contribution => contribution.status === filterStatus)
      );
    }
  }, [contributions, filterStatus]);

  const fetchContributions = async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/getContributions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch contributions: ${response.status}`);
      }

      const data = await response.json();
      setContributions(data.contributions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching contributions');
      console.error('Error fetching contributions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string, approve: boolean) => {
    if (!token) return;

    try {
      setIsLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/api/approveContribution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          contributionId: id,
          approve
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${approve ? 'approve' : 'reject'} contribution: ${response.status}`);
      }

      // Update the UI
      setContributions(prevContributions => 
        prevContributions.map(contribution => 
          contribution.id === id 
            ? { ...contribution, status: approve ? 'approved' : 'rejected' }
            : contribution
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : `Error ${approve ? 'approving' : 'rejecting'} contribution`);
      console.error(`Error ${approve ? 'approving' : 'rejecting'} contribution:`, err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    
    if (!loginEmail || !loginPassword) {
      setLoginError('Please enter both email and password');
      return;
    }
    
    console.log('Attempting login with:', loginEmail);
    const result = await login(loginEmail, loginPassword);
    
    console.log('Login result:', result);
    
    if (!result.success) {
      setLoginError(result.error as string);
    } else {
      console.log('Login successful, user data:', result.data);
      // Force navigation to dashboard after successful login
      navigate('/admin/dashboard');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin');
  };

  const openImageModal = (imagePath: string) => {
    setSelectedImage(imagePath);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  const handleFilterChange = (status: FilterStatus) => {
    setFilterStatus(status);
  };

  // Display login form if not authenticated and not on dashboard
  if (!dashboard && !user) {
    return (
      <div className="page-content">
        <h1>Admin Login</h1>
        {loginError && <div className="error-message">{loginError}</div>}
        <form onSubmit={handleLoginSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>
          <button type="submit" className="submit-button">Login</button>
        </form>
      </div>
    );
  }

  // Show loading state
  if (loading || isLoading) {
    return (
      <div className="page-content">
        <h1>Admin Panel</h1>
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Loading contributions...</p>
        </div>
      </div>
    );
  }

  // Render admin panel with contributions table
  return (
    <div className="page-content admin-page">
      <div className="admin-header">
        <h1>Admin Panel - Contributions</h1>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {/* Filter controls */}
      <div className="filter-controls">
        <button 
          className={`filter-button ${filterStatus === 'all' ? 'active' : ''}`} 
          onClick={() => handleFilterChange('all')}
        >
          All
        </button>
        <button 
          className={`filter-button ${filterStatus === 'pending' ? 'active' : ''}`} 
          onClick={() => handleFilterChange('pending')}
        >
          Pending
        </button>
        <button 
          className={`filter-button ${filterStatus === 'approved' ? 'active' : ''}`} 
          onClick={() => handleFilterChange('approved')}
        >
          Approved
        </button>
        <button 
          className={`filter-button ${filterStatus === 'rejected' ? 'active' : ''}`} 
          onClick={() => handleFilterChange('rejected')}
        >
          Rejected
        </button>
      </div>
      
      {filteredContributions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>No {filterStatus !== 'all' ? filterStatus : ''} contributions found</h3>
          <p>
            {filterStatus === 'pending' 
              ? 'When users submit photos through the contribute form, they will appear here for review.' 
              : `No ${filterStatus} contributions found. Try changing the filter.`}
          </p>
        </div>
      ) : (
        <div className="contributions-table-container">
          <table className="contributions-table">
            <thead>
              <tr>
                <th>Preview</th>
                <th>Contributor</th>
                <th>Date</th>
                <th>Caption</th>
                <th>People</th>
                <th>Ownership</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContributions.map((contribution) => {
                const people = JSON.parse(contribution.people || '[]');
                return (
                  <tr key={contribution.id} className={`status-${contribution.status}`}>
                    <td className="image-cell">
                      {contribution.photo_path && (
                        <img 
                          src={contribution.photo_path}
                          alt="Contribution"
                          className="thumbnail"
                          onClick={() => openImageModal(contribution.photo_path)}
                        />
                      )}
                    </td>
                    <td>
                      <div className="contributor-info">
                        <div className="contributor-name">{contribution.name}</div>
                        <div className="contributor-email">{contribution.email}</div>
                      </div>
                    </td>
                    <td>{contribution.date}</td>
                    <td className="description-cell">
                      <div className="scrollable-content">
                        {contribution.description}
                      </div>
                    </td>
                    <td className="people-cell">
                      <div className="scrollable-content">
                        <ul>
                          {people.map((person: string, index: number) => (
                            <li key={index}>{person}</li>
                          ))}
                        </ul>
                      </div>
                    </td>
                    <td className="ownership-cell">
                      {contribution.is_owner ? (
                        <div>
                          <span className="ownership-label">Owner: </span>Yes
                          <br />
                          <span className="ownership-label">Public: </span>
                          {contribution.public_acknowledgment ? 'Yes' : 'No'}
                        </div>
                      ) : (
                        <div>
                          <span className="ownership-label">Owner: </span>No
                          <br />
                          <span className="ownership-label">Photo by: </span>
                          {contribution.owner_name || 'Not specified'}
                          <br />
                          <span className="ownership-label">Source: </span>
                          {contribution.landing_url ? (
                            <a 
                              href={contribution.landing_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="source-link"
                            >
                              View source
                            </a>
                          ) : 'Not provided'}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${contribution.status}`}>
                        {contribution.status}
                      </span>
                    </td>
                    <td className="actions-cell">
                      {contribution.status === 'pending' && (
                        <div className="action-buttons">
                          <button
                            className="approve-button"
                            onClick={() => handleApprove(contribution.id, true)}
                            disabled={isLoading}
                            title="Approve"
                          >
                            ✓
                          </button>
                          <button
                            className="reject-button"
                            onClick={() => handleApprove(contribution.id, false)}
                            disabled={isLoading}
                            title="Reject"
                          >
                            ✗
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Image Modal */}
      {selectedImage && (
        <div className="image-modal-overlay" onClick={closeImageModal}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="image-modal-close" onClick={closeImageModal}>×</button>
            <img src={selectedImage} alt="Full size" className="full-size-image" />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage; 