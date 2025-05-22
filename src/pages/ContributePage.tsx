import React, { useState, useEffect } from 'react';
import AutocompleteInput from '../components/AutocompleteInput';
import './PageStyles.css';
import './ContributePage.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const MAX_CAPTION_LENGTH = 125;

type ImageSourceType = 'upload' | 'url';

const ContributePage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    photo: null as File | null,
    photoUrl: '',
    description: '',
    date: '',
    people: ['', ''],
    isOwner: false,
    ownerName: '',
    landingUrl: '',
    publicAcknowledgment: false
  });
  const [imageSource, setImageSource] = useState<ImageSourceType>('upload');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isNewPerson, setIsNewPerson] = useState<boolean[]>([false, false]);

  useEffect(() => {
    if (success) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, [success]);

  const isFormValid = () => {
    const hasValidImage = 
      (imageSource === 'upload' && formData.photo !== null) || 
      (imageSource === 'url' && formData.photoUrl.trim() !== '');
    
    const hasValidOwnershipInfo = 
      (formData.isOwner && formData.publicAcknowledgment) || 
      (!formData.isOwner && formData.ownerName.trim() !== '' && formData.landingUrl.trim() !== '');

    return (
      formData.name.trim() !== '' &&
      formData.email.trim() !== '' &&
      hasValidImage &&
      formData.description.trim() !== '' &&
      formData.description.length <= MAX_CAPTION_LENGTH &&
      formData.date !== '' &&
      formData.people.every(person => person.trim() !== '') &&
      hasValidOwnershipInfo
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // For description field, enforce character limit
    if (name === 'description' && value.length > MAX_CAPTION_LENGTH) {
      return;
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleImageSourceChange = (source: ImageSourceType) => {
    setImageSource(source);
    // Clear the other source type when switching
    if (source === 'upload') {
      setFormData(prev => ({ ...prev, photoUrl: '' }));
    } else {
      setFormData(prev => ({ ...prev, photo: null }));
    }
  };

  const handlePersonChange = (index: number, value: string) => {
    setFormData(prev => {
      const newPeople = [...prev.people];
      newPeople[index] = value;
      return { ...prev, people: newPeople };
    });
  };

  const handlePersonConfirm = (index: number, value: string) => {
    setFormData(prev => {
      const newPeople = [...prev.people];
      newPeople[index] = value;
      return { ...prev, people: newPeople };
    });
  };

  const toggleNewPerson = (index: number) => {
    setIsNewPerson(prev => {
      const newIsNewPerson = [...prev];
      newIsNewPerson[index] = !newIsNewPerson[index];
      return newIsNewPerson;
    });

    handlePersonChange(index, '');
  };

  const addPersonField = () => {
    setFormData(prev => ({
      ...prev,
      people: [...prev.people, '']
    }));
    setIsNewPerson(prev => [...prev, false]);
  };

  const removePersonField = (index: number) => {
    setFormData(prev => {
      const newPeople = [...prev.people];
      newPeople.splice(index, 1);
      return { ...prev, people: newPeople };
    });
    setIsNewPerson(prev => {
      const newIsNewPerson = [...prev];
      newIsNewPerson.splice(index, 1);
      return newIsNewPerson;
    });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, photo: e.target.files![0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid()) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('date', formData.date);
      formDataToSend.append('image_source', imageSource);
      formDataToSend.append('is_owner', formData.isOwner.toString());
      
      if (formData.isOwner) {
        formDataToSend.append('public_acknowledgment', formData.publicAcknowledgment.toString());
      } else {
        formDataToSend.append('owner_name', formData.ownerName);
        formDataToSend.append('landing_url', formData.landingUrl);
      }
      
      formData.people.forEach((person, index) => {
        formDataToSend.append(`people[${index}]`, person);
        formDataToSend.append(`isNew[${index}]`, isNewPerson[index].toString());
      });

      if (imageSource === 'upload' && formData.photo) {
        formDataToSend.append('photo', formData.photo);
      } else if (imageSource === 'url') {
        formDataToSend.append('photo_url', formData.photoUrl);
      }

      const response = await fetch(`${API_BASE_URL}/api/addUserConnection`, {
        method: 'POST',
        body: formDataToSend
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit contribution');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-content">
      <h1>Contribute Your Photo</h1>
      {error && <div className="error-message">{error}</div>}
      {success && (
        <div className="success-message">
          <div>
            <h3>Thank you for your contribution!</h3>
            <p>Your photo and information have been successfully submitted. It will take approximately 24-48 hours to review and add your contribution to our collection.</p>
          </div>
        </div>
      )}
      {!success && (
        <form onSubmit={handleSubmit} className="contribute-form">
          <div className="form-group">
            <label htmlFor="name">Your Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="date">Date of Photo</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              required
              className="date-input"
            />
          </div>

          <div className="form-group">
            <label>Photo</label>
            <div className="image-source-toggle">
              <button
                type="button"
                className={`image-source-button ${imageSource === 'upload' ? 'active' : ''}`}
                onClick={() => handleImageSourceChange('upload')}
              >
                Upload Image
              </button>
              <button
                type="button"
                className={`image-source-button ${imageSource === 'url' ? 'active' : ''}`}
                onClick={() => handleImageSourceChange('url')}
              >
                Image URL
              </button>
            </div>

            {imageSource === 'upload' ? (
              <div
                className="file-upload-container"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    const file = e.dataTransfer.files[0];
                    if (file.type.startsWith('image/')) {
                      setFormData(prev => ({ ...prev, photo: file }));
                    }
                  }
                }}
              >
                <input
                  type="file"
                  id="photo"
                  name="photo"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="file-input"
                />
                {formData.photo ? (
                  <div className="image-preview">
                    <img
                      src={URL.createObjectURL(formData.photo)}
                      alt="Preview"
                      className="preview-image"
                    />
                    <button
                      type="button"
                      className="delete-image-button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setFormData(prev => ({ ...prev, photo: null }));
                      }}
                      aria-label="Remove image"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <label htmlFor="photo" className="file-upload-button">
                    <div className="upload-icon">📁</div>
                    <div>Drag and drop or click here to upload</div>
                    <div className="upload-hint">Supports: JPG, PNG, GIF</div>
                  </label>
                )}
              </div>
            ) : (
              <div className="url-input-container">
                <input
                  type="url"
                  id="photoUrl"
                  name="photoUrl"
                  value={formData.photoUrl}
                  onChange={handleInputChange}
                  placeholder="Enter image URL (https://...)"
                  className="url-input"
                />
                {formData.photoUrl && (
                  <div className="image-preview">
                    <img
                      src={formData.photoUrl}
                      alt="Preview"
                      className="preview-image"
                      onError={(e) => {
                        e.currentTarget.src = '';
                        e.currentTarget.alt = 'Invalid image URL';
                        e.currentTarget.classList.add('invalid-image');
                      }}
                    />
                    {formData.photoUrl && (
                      <button
                        type="button"
                        className="delete-image-button"
                        onClick={(e) => {
                          e.preventDefault();
                          setFormData(prev => ({ ...prev, photoUrl: '' }));
                        }}
                        aria-label="Remove image URL"
                      >
                        ×
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>People in the Photo</label>
            <div className="people-inputs">
              {formData.people.map((person, index) => (
                <div key={index} className="person-input-container">
                  <div className="person-input-wrapper">
                    {isNewPerson[index] ? (
                      <input
                        type="text"
                        value={person}
                        onChange={(e) => handlePersonChange(index, e.target.value)}
                        placeholder={`Enter name (ex. "John Doe - Gardener - Born 1982")`}
                        required
                        className="new-person-input"
                      />
                    ) : (
                      <AutocompleteInput
                        id={`person-${index}`}
                        placeholder={`Search for person`}
                        initialValue={person}
                        onValueChange={(value) => handlePersonChange(index, value)}
                        onValueConfirm={(value) => handlePersonConfirm(index, value)}
                      />
                    )}
                    <div className={`person-type-toggle ${isNewPerson[index] ? 'new' : ''}`}>
                      <span
                        className={`toggle-label ${!isNewPerson[index] ? 'active' : ''}`}
                        onClick={() => toggleNewPerson(index)}
                      >
                        Existing
                      </span>
                      <span
                        className={`toggle-label ${isNewPerson[index] ? 'active' : ''}`}
                        onClick={() => toggleNewPerson(index)}
                      >
                        New
                      </span>
                      <input
                        type="checkbox"
                        checked={isNewPerson[index]}
                        onChange={() => toggleNewPerson(index)}
                        style={{ display: 'none' }}
                      />
                    </div>
                  </div>
                  {formData.people.length > 2 && (
                    <button
                      type="button"
                      className="delete-person-button"
                      onClick={() => removePersonField(index)}
                      aria-label="Remove person"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="add-person-button"
                onClick={addPersonField}
              >
                +
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">
              Caption 
              <span 
                className={`character-limit ${
                  formData.description.length > MAX_CAPTION_LENGTH * 0.9 
                    ? formData.description.length === MAX_CAPTION_LENGTH 
                      ? 'at-limit' 
                      : 'near-limit' 
                    : ''
                }`}
              >
                ({formData.description.length}/{MAX_CAPTION_LENGTH})
              </span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Tell us about this photo..."
              required
              maxLength={MAX_CAPTION_LENGTH}
            />
          </div>

          <div className="form-group">
            <div className="ownership-section">
              <div className="ownership-checkbox">
                <label>
                  <input
                    type="checkbox"
                    id="isOwner"
                    name="isOwner"
                    checked={formData.isOwner}
                    onChange={handleCheckboxChange}
                  />
                  I am the owner of this photo
                </label>
              </div>

              {formData.isOwner ? (
                <div className="acknowledgment-checkbox">
                  <label>
                    <input
                      type="checkbox"
                      id="publicAcknowledgment"
                      name="publicAcknowledgment"
                      checked={formData.publicAcknowledgment}
                      onChange={handleCheckboxChange}
                      required={formData.isOwner}
                    />
                    I acknowledge that my photo will be publicly available on the internet
                  </label>
                </div>
              ) : (
                <div className="owner-name-field">
                  <label htmlFor="ownerName">Name of the photo owner</label>
                  <input
                    type="text"
                    id="ownerName"
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleInputChange}
                    placeholder="Enter the name of the person who owns this photo"
                    required={!formData.isOwner}
                  />
                  
                  <label htmlFor="landingUrl" className="landing-url-label">Source URL</label>
                  <input
                    type="url"
                    id="landingUrl"
                    name="landingUrl"
                    value={formData.landingUrl}
                    onChange={handleInputChange}
                    placeholder="Enter the URL where you found this image"
                    required={!formData.isOwner}
                    className="landing-url-input"
                  />
                  <div className="field-hint">
                    Please provide the link to where you found this image (news article, YouTube, social media, etc.)
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={isLoading || !isFormValid()}
          >
            {isLoading ? 'Submitting...' : 'Submit Contribution'}
          </button>
        </form>
      )}
    </div>
  );
};

export default ContributePage;