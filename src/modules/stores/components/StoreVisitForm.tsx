'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { Store, StoreVisit } from '@/types/modules';
import { logVisit, updateVisit } from '@/redux/features/storeSlice';

interface StoreVisitFormProps {
  store: Store;
  initialData?: StoreVisit;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const StoreVisitForm: React.FC<StoreVisitFormProps> = ({ store, initialData, onSuccess, onCancel }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  const [formData, setFormData] = useState<Partial<StoreVisit>>({
    storeId: store.id,
    agentId: user?.id || '',
    visitDate: new Date().toISOString().split('T')[0],
    notes: '',
    productInterest: '',
    nextVisitDate: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        storeId: initialData.storeId,
        agentId: initialData.agentId,
        visitDate: new Date(initialData.visitDate).toISOString().split('T')[0],
        notes: initialData.notes,
        productInterest: initialData.productInterest,
        nextVisitDate: initialData.nextVisitDate ? new Date(initialData.nextVisitDate).toISOString().split('T')[0] : '',
      });
    } else {
      setFormData({
        storeId: store.id,
        agentId: user?.id || '',
        visitDate: new Date().toISOString().split('T')[0],
        notes: '',
        productInterest: '',
        nextVisitDate: '',
      });
    }
  }, [initialData, store.id, user?.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      id: initialData?.id,
      store_id: store.id,
      notes: formData.notes,
      product_interest: formData.productInterest,
      next_visit_date: formData.nextVisitDate,
      visit_date: formData.visitDate,
    };

    try {
      setIsSubmitting(true);
      if (initialData?.id) {
        await (dispatch as any)(updateVisit({ ...payload, id: initialData.id as string })).unwrap();
      } else {
        await (dispatch as any)(logVisit(payload)).unwrap();
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      alert('Failed to log visit: ' + err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card shadow-md border-0 rounded-4 overflow-hidden mb-4">
      <div className="card-header bg-white border-0 pt-4 px-4 pb-0">
        <h6 className="fw-800 text-dark mb-0 tracking-tight uppercase">
          {initialData ? 'EDIT VISIT LOG' : 'CAPTURE VISIT NOTES'}
        </h6>
      </div>
      <div className="card-body p-4">
        <form onSubmit={handleSubmit}>
          {/* ... (rest of the form fields remain the same in structure, let's keep them here) */}
          <div className="row g-4 mb-4">
            <div className="col-md-6">
              <label className="xx-small fw-800 text-muted uppercase tracking-widest mb-2 d-block">Visit Date / Time</label>
              <input
                type="date"
                className="form-control fw-700"
                name="visitDate"
                value={formData.visitDate}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="xx-small fw-800 text-muted uppercase tracking-widest mb-2 d-block">Next Follow-up Date</label>
              <input
                type="date"
                className="form-control fw-700 text-primary"
                name="nextVisitDate"
                value={formData.nextVisitDate}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="xx-small fw-800 text-muted uppercase tracking-widest mb-2 d-block">Product / Tooling Interest</label>
            <input
              type="text"
              className="form-control fw-700"
              name="productInterest"
              value={formData.productInterest}
              onChange={handleChange}
              placeholder="Ex. Diamond Tools, Grinding Wheels, Carbide Pins..."
            />
          </div>

          <div className="mb-4">
            <label className="xx-small fw-800 text-muted uppercase tracking-widest mb-2 d-block">Detailed Discussion Feedback</label>
            <textarea
              className="form-control fw-700"
              name="notes"
              rows={4}
              value={formData.notes}
              onChange={handleChange}
              placeholder="Record your discussion notes here..."
              required
            ></textarea>
          </div>

          <div className="text-end d-flex gap-2 justify-content-end pt-3">
            <button type="button" className="btn btn-light px-4 py-2 rounded-pill fw-800 text-muted border" onClick={onCancel}>
              CLEAR
            </button>
            <button 
              type="submit" 
              className="btn btn-primary px-5 py-2 rounded-pill shadow-accent fw-800 tracking-wider d-flex align-items-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  <span>SUBMITTING...</span>
                </>
              ) : (
                'SUBMIT'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StoreVisitForm;
