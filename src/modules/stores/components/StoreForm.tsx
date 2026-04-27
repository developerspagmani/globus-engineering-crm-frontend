'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '@/redux/store';
import { Store } from '@/types/modules';
import { addStore, updateStore } from '@/redux/features/storeSlice';

interface StoreFormProps {
  initialData?: Store;
  mode: 'create' | 'edit' | 'view';
}

const StoreForm: React.FC<StoreFormProps> = ({ initialData, mode }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const router = useRouter();

  const [formData, setFormData] = useState<Partial<Store>>({
    name: '',
    ownerName: '',
    phone: '',
    address: '',
    area: user?.assignedArea || '',
    city: '',
    company_id: user?.company_id || '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        ownerName: initialData.ownerName,
        phone: initialData.phone,
        address: initialData.address,
        area: initialData.area,
        city: initialData.city,
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      // Map to backend snake_case if necessary
      const payload = {
        ...formData,
        owner_name: formData.ownerName,
      };

      if (mode === 'create') {
        await (dispatch as any)(addStore(payload));
      } else if (mode === 'edit' && initialData) {
        await (dispatch as any)(updateStore({ ...initialData, ...payload } as any));
      }
      router.push('/stores');
    } catch (err) {
      // Handle error
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card shadow-sm border-0">
      <div className="card-body p-4">
        <form onSubmit={handleSubmit}>
          <div className="row g-4 mb-4">
            <div className="col-md-6">
              <label className="form-label small fw-bold text-uppercase text-muted">Store / Shop Name <span className="text-danger">*</span></label>

              <input 
                type="text" 
                className="form-control" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                placeholder="Ex. Global Hardware & Tools"
                required 
                disabled={mode === 'view'}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-bold text-uppercase text-muted">Owner Name <span className="text-danger">*</span></label>

              <input 
                type="text" 
                className="form-control" 
                name="ownerName" 
                value={formData.ownerName} 
                onChange={handleChange} 
                placeholder="Ex. Mr. Srinivasan"
                required
                disabled={mode === 'view'}
              />

            </div>
          </div>

          <div className="row g-4 mb-4">
            <div className="col-md-6">
              <label className="form-label small fw-bold text-uppercase text-muted">Contact Phone <span className="text-danger">*</span></label>

              <input 
                type="text" 
                className="form-control" 
                name="phone" 
                value={formData.phone} 
                onChange={handleChange} 
                placeholder="+91 9XXXX XXXXX"
                required 
                disabled={mode === 'view'}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-bold text-uppercase text-muted">Area / Cluster <span className="text-danger">*</span></label>

              <input 
                type="text" 
                className="form-control" 
                name="area" 
                value={formData.area} 
                onChange={handleChange} 
                placeholder="Ex. Ambattur Industrial Estate"
                required
                disabled={mode === 'view'}

              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label small fw-bold text-uppercase text-muted">Complete Address <span className="text-danger">*</span></label>

            <textarea 
              className="form-control" 
              name="address" 
              rows={3} 
              value={formData.address} 
              onChange={handleChange}
              placeholder="Door No, Street, Landmark..."
              required
              disabled={mode === 'view'}
            ></textarea>

          </div>

          <div className="text-end pt-4 border-top">
            <button type="button" className="btn btn-link text-muted me-3 text-decoration-none" onClick={() => router.push('/stores')}>
              Cancel
            </button>
            {mode !== 'view' && (
              <button 
                type="submit" 
                className="btn btn-primary px-5 rounded-pill shadow-sm d-flex align-items-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>{mode === 'create' ? 'Registering...' : 'Saving...'}</span>
                  </>
                ) : (
                  mode === 'create' ? 'Register Store' : 'Save Changes'
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default StoreForm;
