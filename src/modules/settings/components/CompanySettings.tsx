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
    logo: activeCompany?.logo || '',
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany) return;
    
    setSaving(true);
    const result = await (dispatch as any)(updateCompany({
      ...activeCompany,
      name: formData.name,
      slug: formData.slug,
      logo: formData.logo,
    }));

    setSaving(false);
    if (updateCompany.fulfilled.match(result)) {
      setMessage('Company details updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage('Failed to update company: ' + (result.payload || 'Unknown error'));
    }
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
            <div className="col-12">
              <label className="form-label small text-muted text-uppercase fw-bold">Company Logo</label>
              <div className="d-flex align-items-center gap-3">
                <div className="bg-light rounded-3 overflow-hidden d-flex align-items-center justify-content-center border" style={{ width: '80px', height: '80px' }}>
                  {formData.logo ? (
                    <img src={formData.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <i className="bi bi-image text-muted fs-3"></i>
                  )}
                </div>
                <div>
                  <input 
                    type="file" 
                    className="form-control form-control-sm mb-1 shadow-none" 
                    accept="image/*" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData({ ...formData, logo: reader.result as string });
                        };
                        reader.readAsDataURL(file);
                      }
                    }} 
                  />
                  <span className="text-muted" style={{ fontSize: '0.75rem' }}>Upload a company logo (Square recommended).</span>
                </div>
              </div>
            </div>

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
                <span className="badge bg-opacity-10 text-primary px-3 py-2 rounded-pill fw-bold">
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
