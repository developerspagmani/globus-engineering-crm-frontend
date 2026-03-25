'use client';

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { updateUser } from '@/redux/features/authSlice';

const ProfileSettings: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    avatar: '',
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      dispatch(updateUser({
        ...user,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      }));
      setSaving(false);
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    }, 1000);
  };

  return (
    <div className="card border-0 shadow-sm rounded-4">
      <div className="card-body p-4">
        <h5 className="fw-bold mb-4">Account Profile</h5>
        
        {message && (
          <div className="alert alert-success border-0 shadow-sm mb-4">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="row g-4">
            <div className="col-12 d-flex align-items-center gap-4 mb-2">
              <div 
                className="bg-primary bg-gradient text-white rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm"
                style={{ width: '80px', height: '80px', fontSize: '2rem' }}
              >
                {formData.name.charAt(0)}
              </div>
              <div>
                <button type="button" className="btn btn-outline-primary btn-sm rounded-pill px-3 me-2">Change Avatar</button>
                <button type="button" className="btn btn-link text-muted text-decoration-none btn-sm fw-600">Remove</button>
                <div className="text-muted x-small mt-2">JPG, GIF or PNG. Max size of 800K</div>
              </div>
            </div>

            <div className="col-md-6">
              <label className="form-label small text-muted text-uppercase fw-bold">Full Name</label>
              <input 
                type="text" 
                className="form-control" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label small text-muted text-uppercase fw-bold">Email Address</label>
              <input 
                type="email" 
                className="form-control" 
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label small text-muted text-uppercase fw-bold">Phone Number</label>
              <input 
                type="text" 
                className="form-control" 
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="col-12 mt-5">
              <button 
                type="submit" 
                className="btn btn-primary px-5 rounded-pill shadow-accent"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Saving...
                  </>
                ) : 'Save Profile Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;
