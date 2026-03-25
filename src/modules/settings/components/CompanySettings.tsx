'use client';

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { updateCompany } from '@/redux/features/companySlice';

const CompanySettings: React.FC = () => {
  const dispatch = useDispatch();
  const { company: activeCompany } = useSelector((state: RootState) => state.auth);
  
  const [formData, setFormData] = useState({
    name: activeCompany?.name || '',
    slug: activeCompany?.slug || '',
    plan: activeCompany?.plan || 'Free',
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany) return;

    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      const updatedCompany = {
        ...activeCompany,
        name: formData.name,
        slug: formData.slug,
      };
      dispatch(updateCompany(updatedCompany));
      // Note: In a real app, we'd also update the context in authSlice if needed
      setSaving(false);
      setMessage('Company details updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    }, 1000);
  };

  if (!activeCompany) {
    return (
      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-body p-5 text-center">
            <i className="bi bi-building-exclamation display-1 text-muted opacity-25 mb-4"></i>
            <h5 className="fw-bold">No Company Context</h5>
            <p className="text-muted">Please select a company context to manage its settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card border-0 shadow-sm rounded-4">
      <div className="card-body p-4">
        <h5 className="fw-bold mb-4">Enterprise Configuration</h5>
        
        {message && (
          <div className="alert alert-primary border-0 shadow-sm mb-4">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="row g-4">
            <div className="col-md-6">
              <label className="form-label small text-muted text-uppercase fw-bold">Company Name</label>
              <input 
                type="text" 
                className="form-control" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label small text-muted text-uppercase fw-bold">Company URL Slug</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-muted small">app.globus.com/</span>
                <input 
                  type="text" 
                  className="form-control border-start-0" 
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="col-md-6">
              <label className="form-label small text-muted text-uppercase fw-bold">Active Plan</label>
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill fw-bold">
                  {formData.plan.toUpperCase()}
                </span>
                <button type="button" className="btn btn-link btn-sm text-primary fw-bold text-decoration-none">Upgrade Plan</button>
              </div>
            </div>

             <div className="col-md-6">
              <label className="form-label small text-muted text-uppercase fw-bold">Company Status</label>
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill fw-bold text-uppercase">
                  Active
                </span>
              </div>
            </div>

            <div className="col-12 mt-5">
              <button 
                type="submit" 
                className="btn btn-dark px-5 rounded-pill shadow-sm"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Updating...
                  </>
                ) : 'Update Company Profile'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanySettings;
