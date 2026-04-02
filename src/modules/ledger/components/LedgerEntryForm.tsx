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
      <div className="card shadow-sm border-0 bg-white p-5 rounded-4 mt-2">
        <h4 className="fw-900 text-uppercase tracking-tighter mb-5 pb-3 border-bottom border-light" style={{ fontSize: '1.25rem' }}>
            Record New Transaction
        </h4>

        <form onSubmit={handleSubmit}>
          <div className="row g-5 mb-5">
            {/* Row 1: Date and Customer */}
            <div className="col-md-6 d-flex align-items-center gap-4">
              <label className="text-muted small fw-bold text-uppercase tracking-wider col-2">Date</label>
              <input
                type="date"
                className="form-control border-0 border-bottom rounded-0 shadow-none px-0 fw-bold fs-5"
                style={{ borderBottomStyle: 'dotted' as any, borderBottomWidth: '2px' }}
                value={formData.date}
                onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>
            
            <div className="col-md-6 d-flex align-items-center gap-4">
              <label className="text-muted small fw-bold text-uppercase tracking-wider col-3">Customer</label>
              <select
                className="form-select border-0 border-bottom rounded-0 shadow-none px-0 fw-bold fs-5 text-uppercase"
                style={{ borderBottomStyle: 'dotted' as any, borderBottomWidth: '2px' }}
                value={formData.customerId}
                onChange={e => setFormData(prev => ({ ...prev, customerId: e.target.value }))}
                required
              >
                <option value="">Select Customer...</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.company || c.name}</option>
                ))}
              </select>
            </div>

            {/* Row 2: Type as Large Buttons */}
            <div className="col-md-12 d-flex flex-column gap-3 mt-4">
               <label className="text-muted small fw-bold text-uppercase tracking-wider">Transaction Type</label>
               <div className="d-flex gap-4">
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, type: 'debit'})}
                    className={`btn flex-fill py-4 rounded-3 fw-bold border-0 fs-5 shadow-sm transition-all ${formData.type === 'debit' ? 'btn-danger text-white shadow' : 'btn-light text-muted'}`}
                    style={{ opacity: formData.type === 'debit' ? 1 : 0.6 }}
                  >
                    DEBIT (Customer Owes You +)
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, type: 'credit'})}
                    className={`btn flex-fill py-4 rounded-3 fw-bold border-0 fs-5 shadow-sm transition-all ${formData.type === 'credit' ? 'btn-success text-white shadow' : 'btn-light text-muted'}`}
                    style={{ opacity: formData.type === 'credit' ? 1 : 0.6 }}
                  >
                    CREDIT (Customer Paid You -)
                  </button>
               </div>
            </div>

            {/* Row 3: Amount and Particulars */}
            <div className="col-md-6 d-flex align-items-center gap-4 mt-5">
              <label className="text-muted small fw-bold text-uppercase tracking-wider col-2">Amount</label>
              <div className="input-group flex-nowrap border-bottom border-dark border-2">
                 <span className="input-group-text bg-transparent border-0 fw-bold fs-3 pe-1 px-0">₹</span>
                 <input
                    type="number"
                    className="form-control border-0 shadow-none px-2 fw-900 fs-1"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    required
                 />
              </div>
            </div>

            <div className="col-md-6 d-flex align-items-center gap-4 mt-5">
              <label className="text-muted small fw-bold text-uppercase tracking-wider col-3">Particulars</label>
              <input
                type="text"
                className="form-control border-0 border-bottom rounded-0 shadow-none px-0 fw-semibold fs-5"
                style={{ borderBottomStyle: 'dotted' as any, borderBottomWidth: '2px' }}
                placeholder="Reason for this transaction..."
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="d-flex justify-content-center gap-4 mt-5 pt-5">
            <button type="submit" className="btn btn-dark px-5 py-3 rounded-pill fw-bold border-0 shadow-lg fs-5">
                SAVE TRANSACTION
            </button>
            <button type="button" className="btn btn-light px-5 py-3 rounded-pill fw-bold border-0 fs-5" onClick={() => router.push('/ledger')}>
                CANCEL
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
      </div>

      <style jsx>{`
        .fw-900 { font-weight: 900; }
        .tracking-tighter { letter-spacing: -0.05em; }
        .tracking-wider { letter-spacing: 0.1em; }
        .transition-all { transition: all 0.2s ease-in-out; }
      `}</style>
    </>
  );
};

export default LedgerEntryForm;
