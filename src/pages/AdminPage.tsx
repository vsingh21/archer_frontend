import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

interface Report {
  id: string;
  relationship_id: string;
  image_url: string;
  reason: string;
  additional_info: string;
  status: 'pending' | 'reviewed';
  created_at: string;
}

interface AdminPageProps {
  dashboard?: boolean;
}

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';
type AdminView = 'contributions' | 'reports';

const AdminPage: React.FC<AdminPageProps> = ({ dashboard = false }) => {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredContributions, setFilteredContributions] = useState<Contribution[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('pending');
  const [currentView, setCurrentView] = useState<AdminView>('contributions');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editingContribution, setEditingContribution] = useState<Contribution | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { user, token, loading, login, logout } = useAuth();
  const navigate = useNavigate();

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

    // If we're on the dashboard page and authenticated, fetch data
    if (dashboard && !loading && user) {
      console.log('Fetching data for dashboard');
      fetchContributions();
      fetchReports();
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

  // Apply filters for reports
  useEffect(() => {
    if (filterStatus === 'all') {
      setFilteredReports(reports);
    } else {
      // Map 'pending' and 'approved'/'rejected' to report status values
      const reportStatus = filterStatus === 'pending' ? 'pending' : 'reviewed';
      setFilteredReports(
        reports.filter(report => report.status === reportStatus)
      );
    }
  }, [reports, filterStatus]);

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

  const fetchReports = async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/getReports`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch reports: ${response.status}`);
      }

      const data = await response.json();
      setReports(data.reports || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching reports');
      console.error('Error fetching reports:', err);
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

  const handleReviewReport = async (id: string, deleteConnection: boolean) => {
    if (!token) return;

    try {
      setIsLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/api/reviewReport`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reportId: id,
          deleteConnection
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to process report: ${response.status}`);
      }

      // Update the UI
      setReports(prevReports => 
        prevReports.map(report => 
          report.id === id 
            ? { ...report, status: 'reviewed' }
            : report
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error reviewing report');
      console.error('Error reviewing report:', err);
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

  const handleViewChange = (view: AdminView) => {
    setCurrentView(view);
  };

  const handleOpenEditModal = (contribution: Contribution) => {
    setEditingContribution(contribution);
  };

  const handleCloseEditModal = () => {
    setEditingContribution(null);
  };

  const handleSaveContribution = async (updatedContribution: Contribution) => {
    if (!token) return;

    try {
      setIsSaving(true);
      
      const response = await fetch(`${API_BASE_URL}/api/updateContribution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedContribution)
      });

      if (!response.ok) {
        throw new Error(`Failed to update contribution: ${response.status}`);
      }

      // Update the UI
      setContributions(prevContributions => 
        prevContributions.map(contribution => 
          contribution.id === updatedContribution.id 
            ? updatedContribution
            : contribution
        )
      );

      setEditingContribution(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating contribution');
      console.error('Error updating contribution:', err);
    } finally {
      setIsSaving(false);
    }
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
          <p>Loading data...</p>
        </div>
      </div>
    );
  }

  // Edit Contribution Modal
  const EditContributionModal = () => {
    const [name, setName] = useState(editingContribution?.name || '');
    const [email, setEmail] = useState(editingContribution?.email || '');
    const [description, setDescription] = useState(editingContribution?.description || '');
    const [date, setDate] = useState(editingContribution?.date || '');
    const [isOwner, setIsOwner] = useState(editingContribution?.is_owner || false);
    const [ownerName, setOwnerName] = useState(editingContribution?.owner_name || '');
    const [landingUrl, setLandingUrl] = useState(editingContribution?.landing_url || '');
    const [publicAcknowledgment, setPublicAcknowledgment] = useState(editingContribution?.public_acknowledgment || false);
    const [peopleList, setPeopleList] = useState<string[]>([]);
    const [isNewPersonList, setIsNewPersonList] = useState<boolean[]>([]);

    // Initialize people and is_new_person arrays from JSON strings
    useEffect(() => {
      if (editingContribution) {
        try {
          if (editingContribution.people) {
            setPeopleList(JSON.parse(editingContribution.people));
          }
          if (editingContribution.is_new_person) {
            setIsNewPersonList(JSON.parse(editingContribution.is_new_person));
          }
        } catch (e) {
          console.error("Error parsing people data:", e);
        }
      }
    }, [editingContribution]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!editingContribution) return;
      
      const updatedContribution: Contribution = {
        ...editingContribution,
        name,
        email,
        description,
        date,
        is_owner: isOwner,
        owner_name: ownerName,
        landing_url: landingUrl,
        public_acknowledgment: publicAcknowledgment,
        people: JSON.stringify(peopleList),
        is_new_person: JSON.stringify(isNewPersonList)
      };
      
      handleSaveContribution(updatedContribution);
    };

    const updatePerson = (index: number, value: string) => {
      const newPeopleList = [...peopleList];
      newPeopleList[index] = value;
      setPeopleList(newPeopleList);
    };

    const updateIsNewPerson = (index: number, value: boolean) => {
      const newIsNewPersonList = [...isNewPersonList];
      newIsNewPersonList[index] = value;
      setIsNewPersonList(newIsNewPersonList);
    };

    const addNewPerson = () => {
      setPeopleList([...peopleList, '']);
      setIsNewPersonList([...isNewPersonList, false]);
    };

    const removePerson = (index: number) => {
      const newPeopleList = [...peopleList];
      const newIsNewPersonList = [...isNewPersonList];
      
      newPeopleList.splice(index, 1);
      newIsNewPersonList.splice(index, 1);
      
      setPeopleList(newPeopleList);
      setIsNewPersonList(newIsNewPersonList);
    };

    if (!editingContribution) return null;

    return (
      <div className="modal-overlay" onClick={handleCloseEditModal}>
        <div className="modal-content edit-contribution-modal" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={handleCloseEditModal}>×</button>
          <h2>Edit Contribution</h2>
          
          <form onSubmit={handleSubmit} className="edit-form">
            <div className="form-group">
              <label htmlFor="name">Contributor Name</label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Contributor Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="date">Date</label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Image</label>
              <div className="thumbnail-preview">
                <img 
                  src={editingContribution.photo_path} 
                  alt="Contribution" 
                  className="edit-thumbnail"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>People in Photo</label>
              <div className="people-edit-list">
                {peopleList.map((person, index) => (
                  <div key={index} className="person-edit-item">
                    <input
                      type="text"
                      value={person}
                      onChange={(e) => updatePerson(index, e.target.value)}
                      required
                    />
                    <div className="toggle-container">
                      <label>
                        <input
                          type="checkbox"
                          checked={isNewPersonList[index]}
                          onChange={(e) => updateIsNewPerson(index, e.target.checked)}
                        />
                        New Person
                      </label>
                    </div>
                    <button 
                      type="button" 
                      className="remove-person-button"
                      onClick={() => removePerson(index)}
                      title="Remove person"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button 
                  type="button" 
                  className="add-person-button"
                  onClick={addNewPerson}
                >
                  + Add Person
                </button>
              </div>
            </div>
            
            <div className="form-group">
              <label>Ownership</label>
              <div className="ownership-toggle">
                <label>
                  <input
                    type="checkbox"
                    checked={isOwner}
                    onChange={(e) => setIsOwner(e.target.checked)}
                  />
                  Contributor owns this photo
                </label>
              </div>
            </div>
            
            {!isOwner && (
              <>
                <div className="form-group">
                  <label htmlFor="owner-name">Photo Owner Name</label>
                  <input
                    id="owner-name"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="landing-url">Source URL</label>
                  <input
                    id="landing-url"
                    value={landingUrl}
                    onChange={(e) => setLandingUrl(e.target.value)}
                  />
                </div>
              </>
            )}
            
            {isOwner && (
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={publicAcknowledgment}
                    onChange={(e) => setPublicAcknowledgment(e.target.checked)}
                  />
                  Public acknowledgment
                </label>
              </div>
            )}
            
            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-button" 
                onClick={handleCloseEditModal}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="submit-button" 
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Render admin panel with contributions table
  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Admin Panel</h1>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {/* View selector */}
      <div className="view-selector">
        <button 
          className={`view-button ${currentView === 'contributions' ? 'active' : ''}`}
          onClick={() => handleViewChange('contributions')}
        >
          Contributions
        </button>
        <button 
          className={`view-button ${currentView === 'reports' ? 'active' : ''}`}
          onClick={() => handleViewChange('reports')}
        >
          Reports
        </button>
      </div>
      
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
        {currentView === 'contributions' ? (
          <>
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
          </>
        ) : (
          <button 
            className={`filter-button ${filterStatus === 'approved' ? 'active' : ''}`} 
            onClick={() => handleFilterChange('approved')}
          >
            Reviewed
          </button>
        )}
      </div>
      
      {/* Contributions View */}
      {currentView === 'contributions' && (
        filteredContributions.length === 0 ? (
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
                    <tr 
                      key={contribution.id} 
                      className={`status-${contribution.status}`}
                      onClick={() => handleOpenEditModal(contribution)}
                    >
                      <td className="image-cell" onClick={(e) => {
                        e.stopPropagation();
                        openImageModal(contribution.photo_path);
                      }}>
                        {contribution.photo_path && (
                          <img 
                            src={contribution.photo_path}
                            alt="Contribution"
                            className="thumbnail"
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
                                onClick={(e) => e.stopPropagation()}
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
                      <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                        {contribution.status === 'pending' && (
                          <div className="action-buttons">
                            <button
                              className="approve-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApprove(contribution.id, true);
                              }}
                              disabled={isLoading}
                              title="Approve"
                            >
                              ✓
                            </button>
                            <button
                              className="reject-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApprove(contribution.id, false);
                              }}
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
        )
      )}
      
      {/* Reports View */}
      {currentView === 'reports' && (
        filteredReports.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🚩</div>
            <h3>No {filterStatus !== 'all' ? filterStatus : ''} reports found</h3>
            <p>
              {filterStatus === 'pending' 
                ? 'When users report content, the reports will appear here for review.' 
                : `No ${filterStatus === 'approved' ? 'reviewed' : filterStatus} reports found. Try changing the filter.`}
            </p>
          </div>
        ) : (
          <div className="contributions-table-container">
            <table className="contributions-table reports-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Relationship ID</th>
                  <th>Reason</th>
                  <th>Additional Info</th>
                  <th>Date Reported</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => (
                  <tr key={report.id} className={`status-${report.status}`}>
                    <td className="image-cell">
                      <img 
                        src={report.image_url}
                        alt="Reported content"
                        className="thumbnail"
                        onClick={() => openImageModal(report.image_url)}
                      />
                    </td>
                    <td>{report.relationship_id}</td>
                    <td>{report.reason}</td>
                    <td className="description-cell">
                      <div className="scrollable-content">
                        {report.additional_info || 'No additional information provided'}
                      </div>
                    </td>
                    <td>{new Date(report.created_at).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge ${report.status}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="actions-cell">
                      {report.status === 'pending' && (
                        <div className="action-buttons">
                          <button
                            className="approve-button"
                            onClick={() => handleReviewReport(report.id, true)}
                            disabled={isLoading}
                            title="Approve and delete connection"
                          >
                            ✓
                          </button>
                          <button
                            className="reject-button"
                            onClick={() => handleReviewReport(report.id, false)}
                            disabled={isLoading}
                            title="Reject report"
                          >
                            ✗
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
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

      {/* Edit Contribution Modal */}
      {editingContribution && (
        <EditContributionModal />
      )}
    </div>
  );
};

export default AdminPage; 