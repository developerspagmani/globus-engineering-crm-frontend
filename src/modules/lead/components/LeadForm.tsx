'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '@/redux/store';
import { Lead } from '@/types/modules';
import { addLead, updateLead } from '@/redux/features/leadSlice';
import FullPageStatus from '@/components/FullPageStatus';


interface LeadFormProps {
  initialData?: Lead;
  mode: 'create' | 'edit' | 'view';
}

const LeadForm: React.FC<LeadFormProps> = ({ initialData, mode }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const router = useRouter();

  const [formData, setFormData] = useState<Omit<Lead, 'id' | 'createdAt'>>({
    name: '',
    email: '',
    phone: '',
    company: '',
    industry: 'Automotive',
    source: 'Web',
    status: 'new',
    agentId: user?.id || '',
    company_id: user?.company_id || 'comp_globus',
    notes: '',
    assignedArea: '',
  });

  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({ isOpen: false, type: 'success', title: '', message: '' });


  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        email: initialData.email,
        phone: initialData.phone,
        company: initialData.company,
        industry: initialData.industry,
        source: initialData.source,
        status: initialData.status,
        agentId: initialData.agentId,
        company_id: initialData.company_id,
        notes: initialData.notes || '',
        assignedArea: initialData.assignedArea || '',
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const payload = {
        ...formData,
        assigned_area: formData.assignedArea,
      };
      if (mode === 'create') {
        await (dispatch as any)(addLead(payload)).unwrap();
        setModal({
          isOpen: true,
          type: 'success',
          title: 'Success!',
          message: "Lead incorporated successfully."
        });
      } else if (mode === 'edit' && initialData) {
        await (dispatch as any)(updateLead({ ...initialData, ...payload })).unwrap();
        setModal({
          isOpen: true,
          type: 'success',
          title: 'Success!',
          message: "Prospect updated successfully."
        });
      }
    } catch (err: any) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: err.message || "Failed to save lead."
      });
    } finally {

      setIsSubmitting(false);
    }
  };


  return (
    <div className="card shadow-sm border-0 animate-fade-in">
      <div className="card-body p-4 p-md-5">
        <form onSubmit={handleSubmit}>
          <div className="row g-4 mb-4">
            <div className="col-md-6">
              <label className="form-label small fw-800 text-uppercase tracking-wider">Prospect Name <span className="text-danger">*</span></label>

              <input 
                type="text" 
                className="form-control" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                placeholder="Ex. Michael Scott"
                required 
                disabled={mode === 'view'}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-800 text-uppercase tracking-wider">Company Name <span className="text-danger">*</span></label>

              <input 
                type="text" 
                className="form-control" 
                name="company" 
                value={formData.company} 
                onChange={handleChange} 
                placeholder="Ex. Dunder Mifflin"
                required 
                disabled={mode === 'view'}
              />
            </div>
          </div>

          <div className="row g-4 mb-4">
            <div className="col-md-6">
              <label className="form-label small fw-800 text-uppercase tracking-wider">Email Address <span className="text-danger">*</span></label>

              <input 
                type="email" 
                className="form-control" 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
                required 
                disabled={mode === 'view'}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-800 text-uppercase tracking-wider">Phone Number <span className="text-danger">*</span></label>

              <input 
                type="text" 
                className="form-control" 
                name="phone" 
                value={formData.phone} 
                onChange={handleChange} 
                required 
                disabled={mode === 'view'}
              />
            </div>
          </div>

          <div className="row g-4 mb-4">
            <div className="col-md-4">
              <label className="form-label small fw-800 text-uppercase tracking-wider">Industry</label>
              <select className="form-select" name="industry" value={formData.industry} onChange={handleChange} disabled={mode === 'view'}>
                <option value="Automotive">Automotive</option>
                <option value="Electronics">Electronics</option>
                <option value="Construction">Construction</option>
                <option value="Machinery">Machinery</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-800 text-uppercase tracking-wider">Lead Source</label>
              <select className="form-select" name="source" value={formData.source} onChange={handleChange} disabled={mode === 'view'}>
                <option value="Web">Website / Organic</option>
                <option value="Exhibition">Engineering Exhibition</option>
                <option value="Referral">Client Referral</option>
                <option value="Cold Call">Direct Calling</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-800 text-uppercase tracking-wider">Current Status</label>
              <select className="form-select" name="status" value={formData.status} onChange={handleChange} disabled={mode === 'view'}>
                <option value="new">New Entry</option>
                <option value="contacted">Attempted Contact</option>
                <option value="qualified">Qualified Lead</option>
                <option value="converted">Deal Closed (Converted)</option>
              </select>
            </div>
          </div>

          <div className="row g-4 mb-4">
            <div className="col-md-12">
              <label className="form-label small fw-800 text-uppercase tracking-wider">Geographic Area / Cluster <span className="text-danger">*</span></label>

              <input 
                type="text" 
                className="form-control" 
                name="assignedArea" 
                value={formData.assignedArea} 
                onChange={handleChange} 
                placeholder="Ex. Coimbatore Industrial Area"
                required
                disabled={mode === 'view'}
              />

            </div>
          </div>


          <div className="mb-4">
            <label className="form-label small fw-800 text-uppercase tracking-wider">Engagement Notes</label>
            <textarea 
              className="form-control" 
              name="notes" 
              rows={4} 
              value={formData.notes} 
              onChange={handleChange}
              placeholder="Record initial interest, machine requirements, or procurement timelines..."
              disabled={mode === 'view'}
            ></textarea>
          </div>

          <div className="text-end pt-4 border-top">
            <button type="button" className="btn btn-link text-muted me-3 fw-700 text-decoration-none" onClick={() => router.push('/leads')}>
              {mode === 'view' ? 'Back' : 'Dismiss'}
            </button>
            {mode !== 'view' && (
              <button 
                type="submit" 
                className="btn btn-primary px-5 shadow-accent fw-bold rounded-pill d-flex align-items-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>{mode === 'create' ? 'Incorporating...' : 'Updating...'}</span>
                  </>
                ) : (
                  mode === 'create' ? 'Incorporate Lead' : 'Update Prospect'
                )}
              </button>
            )}
          </div>
        </form>
      </div>
      {modal.isOpen && (
        <FullPageStatus
          type={modal.type}
          title={modal.title}
          message={modal.message}
          onClose={() => {
            setModal(prev => ({ ...prev, isOpen: false }));
            if (modal.type === 'success') router.push('/leads');
          }}
        />
      )}
    </div>

  );
};

export default LeadForm;
