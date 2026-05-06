'use client';

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { updatePassword } from '@/redux/features/authSlice';
import FullPageStatus from '@/components/FullPageStatus';

const SecuritySettings: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<{ isOpen: boolean; type: 'success' | 'error' | 'warning'; title: string; message: string }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (formData.newPassword !== formData.confirmPassword) {
      setModal({
        isOpen: true,
        type: 'warning',
        title: 'Validation Error',
        message: "The new password and confirmation password do not match. Please verify and try again."
      });
      return;
    }

    setSaving(true);
    const result = await (dispatch as any)(updatePassword({
      id: user.id,
      password: formData.newPassword
    }));

    setSaving(false);
    if (updatePassword.fulfilled.match(result)) {
      setModal({
        isOpen: true,
        type: 'success',
        title: 'Security Updated',
        message: 'Your account password has been changed successfully. Please use your new credentials for the next login.'
      });
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Update Failed',
        message: (result.payload as any) || 'The system was unable to update your password at this time.'
      });
    }
  };

  return (
    <div className="card border-0 shadow-sm rounded-4">
      <div className="card-body p-4">
        <h5 className="fw-bold mb-4">Security & Authentication</h5>

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
      {modal.isOpen && (
        <FullPageStatus 
          type={modal.type}
          title={modal.title}
          message={modal.message}
          onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
        />
      )}
    </div>
  );
};

export default SecuritySettings;
