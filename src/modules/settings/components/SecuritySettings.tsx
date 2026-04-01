'use client';

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { updatePassword } from '@/redux/features/authSlice';

const SecuritySettings: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (formData.newPassword !== formData.confirmPassword) {
      alert("New passwords don't match!");
      return;
    }

    setSaving(true);
    const result = await (dispatch as any)(updatePassword({
      id: user.id,
      password: formData.newPassword
    }));

    setSaving(false);
    if (updatePassword.fulfilled.match(result)) {
      setMessage('Password changed successfully!');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage('Failed to update password: ' + (result.payload || 'Unknown error'));
    }
  };

  return (
    <div className="card border-0 shadow-sm rounded-4">
      <div className="card-body p-4">
        <h5 className="fw-bold mb-4">Security & Authentication</h5>
        
        {message && (
          <div className="alert alert-warning border-0 shadow-sm mb-4">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="row g-4">
            <div className="col-md-12">
              <label className="form-label small text-muted text-uppercase fw-bold">Current Password</label>
              <input 
                type="password" 
                className="form-control" 
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label small text-muted text-uppercase fw-bold">New Password</label>
              <input 
                type="password" 
                className="form-control" 
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label small text-muted text-uppercase fw-bold">Confirm New Password</label>
              <input 
                type="password" 
                className="form-control" 
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
            </div>

            <div className="col-12 mt-5">
              <button 
                type="submit" 
                className="btn btn-danger px-5 rounded-pill shadow-sm"
                disabled={saving}
              >
                {saving ? 'Updating Password...' : 'Change Password'}
              </button>
            </div>

            <div className="col-12 mt-4 pt-4 border-top">
              <h6 className="fw-bold mb-3">Two-Factor Authentication</h6>
              <p className="text-muted small">Add an extra layer of security to your account by requiring more than just a password to log in.</p>
              <button type="button" className="btn btn-outline-dark btn-sm rounded-pill px-3">Enable 2FA</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SecuritySettings;
