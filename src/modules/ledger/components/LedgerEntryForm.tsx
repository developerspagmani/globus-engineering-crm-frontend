'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '@/redux/store';
import { addLedgerEntry, fetchLedgerEntries } from '@/redux/features/ledgerSlice';
import { fetchCustomers } from '@/redux/features/customerSlice';
import StatusModal from '@/components/StatusModal';

const LedgerEntryForm: React.FC = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items: customers } = useSelector((state: RootState) => state.customers);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    customerId: '',
    type: 'credit' as 'debit' | 'credit',
    amount: '',
    description: ''
  });

  const [modal, setModal] = useState<{ isOpen: boolean; type: 'success' | 'error'; title: string; message: string }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  useEffect(() => {
    if (activeCompany?.id) {
       (dispatch as any)(fetchCustomers(activeCompany.id));
    }
  }, [dispatch, activeCompany?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId || !formData.amount) return;

    try {
      const selectedCustomer = customers.find(c => String(c.id) === String(formData.customerId));
      const payload = {
        partyId: formData.customerId,
        partyName: selectedCustomer?.company || selectedCustomer?.name || 'Customer',
        partyType: 'customer',
        company_id: activeCompany?.id,
        companyId: activeCompany?.id,
        date: formData.date,
        type: formData.type,
        amount: parseFloat(formData.amount),
        description: formData.description,
        referenceId: `MAN-${Date.now().toString().slice(-6)}`
      };

      await (dispatch as any)(addLedgerEntry(payload)).unwrap();
      
      setModal({
        isOpen: true,
        type: 'success',
        title: 'Entry Recorded!',
        message: 'The manual ledger transaction has been successfully saved.'
      });
    } catch (err: any) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: err.message || 'Failed to save transaction.'
      });
    }
  };

  return (
    <>
        <form onSubmit={handleSubmit}>
          {/* Card 1: Basic Details */}
          <div className="card shadow-sm border-0 bg-white p-5 rounded-4 mb-4">
            <h5 className="text-primary fw-bold mb-4">Basic Details</h5>
            
            <div className="row g-4">
              <div className="col-md-6 d-flex flex-column gap-2">
                <label className="text-muted x-small fw-bold text-uppercase tracking-wider">Transaction Date</label>
                <input
                  type="date"
                  className="form-control rounded-3 border-secondary-subtle bg-white shadow-none py-2 px-3 fw-semibold text-dark"
                  value={formData.date}
                  onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
              
              <div className="col-md-6 d-flex flex-column gap-2">
                <label className="text-muted x-small fw-bold text-uppercase tracking-wider">Select Customer</label>
                <select
                  className="form-select rounded-3 border-secondary-subtle bg-white shadow-none py-2 px-3 fw-semibold text-muted"
                  value={formData.customerId}
                  onChange={e => setFormData(prev => ({ ...prev, customerId: e.target.value }))}
                  required
                >
                  <option value="">Choose Customer...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.company || c.name}</option>
                  ))}
                </select>
              </div>

              {/* Transaction Type Picker */}
              <div className="col-md-12 d-flex flex-column gap-2 mt-3">
                <label className="text-muted x-small fw-bold text-uppercase tracking-wider">Financial Transaction Type</label>
                <div className="d-flex gap-3">
                    <button 
                      type="button" 
                      onClick={() => setFormData({...formData, type: 'debit'})}
                      className={`flex-fill p-3 rounded-4 d-flex align-items-center justify-content-between border-2 transition-all ${formData.type === 'debit' ? 'border-danger bg-danger-subtle' : 'border-secondary-subtle bg-white grayscale'}`}
                      style={{ height: '80px', cursor: 'pointer' }}
                    >
                      <div className="text-start">
                          <div className={`x-small fw-bold text-uppercase ${formData.type === 'debit' ? 'text-danger' : 'text-muted'}`}>Debit (Owes +)</div>
                          <div className="small fw-900 text-dark tracking-tight">Increase Customer Balance</div>
                      </div>
                      <i className={`bi bi-plus-circle-fill fs-3 ${formData.type === 'debit' ? 'text-danger animate-scale-up' : 'text-muted'}`}></i>
                    </button>

                    <button 
                      type="button" 
                      onClick={() => setFormData({...formData, type: 'credit'})}
                      className={`flex-fill p-3 rounded-4 d-flex align-items-center justify-content-between border-2 transition-all ${formData.type === 'credit' ? 'border-success bg-success-subtle' : 'border-secondary-subtle bg-white grayscale'}`}
                      style={{ height: '80px', cursor: 'pointer' }}
                    >
                      <div className="text-start">
                          <div className={`x-small fw-bold text-uppercase ${formData.type === 'credit' ? 'text-success' : 'text-muted'}`}>Credit (Paid -)</div>
                          <div className="small fw-900 text-dark tracking-tight">Reduce Customer Balance</div>
                      </div>
                      <i className={`bi bi-dash-circle-fill fs-3 ${formData.type === 'credit' ? 'text-success animate-scale-up' : 'text-muted'}`}></i>
                    </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Financial Adjustment */}
          <div className="card shadow-sm border-0 bg-white p-5 rounded-4 mb-4">
            <h5 className="text-primary fw-bold mb-4">Financial Adjustment</h5>
            
            <div className="row g-4">
              <div className="col-md-6 d-flex flex-column gap-2">
                <label className="text-muted x-small fw-bold text-uppercase tracking-wider">Adjusted Amount</label>
                <div className="input-group">
                    <span className="input-group-text bg-white border-secondary-subtle border-end-0 rounded-start-3 ps-3 fw-bold text-muted">₹</span>
                    <input
                      type="number"
                      className="form-control rounded-end-3 border-secondary-subtle bg-white shadow-none py-2 pe-3 fw-bold text-dark"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      required
                    />
                </div>
              </div>

              <div className="col-md-6 d-flex flex-column gap-2">
                <label className="text-muted x-small fw-bold text-uppercase tracking-wider">Adjustment Particulars</label>
                <input
                  type="text"
                  className="form-control rounded-3 border-secondary-subtle bg-white shadow-none py-2 px-3 fw-semibold text-dark"
                  placeholder="Opening Balance, Credit Memo, etc."
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>
            </div>
          </div>

          {/* Form Action Section */}
          <div className="d-flex justify-content-center gap-3 mt-4 mb-5 pb-5">
             <button type="submit" className="btn btn-dark px-5 py-3 rounded-pill fw-bold border-0 shadow-sm transition-all hover-scale d-flex align-items-center gap-2">
                <i className="bi bi-check2-circle-fill"></i>
                <span>RECORD TRANSACTION</span>
             </button>
          </div>
        </form>

        <StatusModal
          isOpen={modal.isOpen}
          onClose={() => {
            setModal(prev => ({ ...prev, isOpen: false }));
            if (modal.type === 'success') {
                (dispatch as any)(fetchLedgerEntries({ companyId: activeCompany?.id }));
                router.push('/ledger');
            }
          }}
          type={modal.type}
          title={modal.title}
          message={modal.message}
        />

      <style jsx>{`
        .fw-900 { font-weight: 900; }
        .x-small { font-size: 0.7rem !important; }
        .grayscale { filter: grayscale(1); opacity: 0.6; }
        .transition-all { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
        .animate-scale-up { animation: scaleUp 0.3s ease-out; }
        .hover-scale:hover { transform: scale(1.02); }
        @keyframes scaleUp {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default LedgerEntryForm;
