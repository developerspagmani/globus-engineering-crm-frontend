'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '@/redux/store';
import { addLedgerEntry, fetchLedgerEntries } from '@/redux/features/ledgerSlice';
import { fetchCustomers } from '@/redux/features/customerSlice';
import { fetchInvoices } from '@/redux/features/invoiceSlice';
import { fetchInwards } from '@/redux/features/inwardSlice';
import { fetchVendors } from '@/redux/features/vendorSlice';
import StatusModal from '@/components/StatusModal';

const LedgerEntryForm: React.FC = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items: customers } = useSelector((state: RootState) => state.customers);
  const { items: vendors } = useSelector((state: RootState) => state.vendors);
  const { items: allInvoices } = useSelector((state: RootState) => state.invoices);
  const { items: allInwards } = useSelector((state: RootState) => state.inward);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    partyType: 'customer' as 'customer' | 'vendor',
    customerId: '', // Reused for VendorId based on partyType
    type: 'credit' as 'debit' | 'credit',
    amount: '',
    description: '',
    linkedInvoiceId: '', // Reused for linkedInwardId based on partyType
  });

  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({ isOpen: false, type: 'success', title: '', message: '' });

  useEffect(() => {
    if (activeCompany?.id) {
      (dispatch as any)(fetchCustomers(activeCompany.id));
      (dispatch as any)(fetchVendors(activeCompany.id));
      (dispatch as any)(fetchInvoices(activeCompany.id));
      (dispatch as any)(fetchInwards(activeCompany.id));
    }
  }, [dispatch, activeCompany?.id]);

  // Reset mapping when customer changes
  useEffect(() => {
    setFormData(p => ({ ...p, linkedInvoiceId: '' }));
  }, [formData.customerId]);

  const customerInvoices = allInvoices.filter(inv => 
    String(inv.customerId) === String(formData.customerId) && inv.status !== 'paid'
  );

  const vendorInwards = allInwards.filter(inw => 
    String(inw.vendorId) === String(formData.customerId) && inw.status !== 'completed'
  );

  const customerInwards = allInwards.filter(inw => 
    String(inw.customerId) === String(formData.customerId) && inw.status !== 'completed'
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId || !formData.amount) return;

    try {
      setIsSubmitting(true);
      const selectedParty = formData.partyType === 'customer' 
        ? customers.find((c) => String(c.id) === String(formData.customerId))
        : vendors.find((v) => String(v.id) === String(formData.customerId));

      const refId = `MAN-${Date.now().toString().slice(-6)}`;
      
      let invoiceSuffix = '';
      if (formData.partyType === 'customer') {
        const selectedInvoice = allInvoices.find(inv => inv.id === formData.linkedInvoiceId);
        invoiceSuffix = selectedInvoice ? ` [Mapped to Inv #${selectedInvoice.invoiceNumber}]` : '';
      } else {
        const selectedInward = allInwards.find(inw => inw.id === formData.linkedInvoiceId);
        invoiceSuffix = selectedInward ? ` [Mapped to Inward #${selectedInward.inwardNo}]` : '';
      }

      const payload = {
        partyId: formData.customerId,
        partyName: (selectedParty as any)?.company || (selectedParty as any)?.name || (selectedParty as any)?.customer_name || 'Party',
        partyType: formData.partyType,
        company_id: activeCompany?.id,
        companyId: activeCompany?.id,
        date: formData.date,
        type: formData.type,
        vchType: formData.type === 'credit' ? 'RECEIPT' : 'PAYMENT',
        amount: parseFloat(formData.amount),
        description: `Manual Entry Generated: ${refId}${invoiceSuffix}`,
        referenceId: refId,
        linkedInvoiceId: formData.linkedInvoiceId, // Reused backend logic handles both
      };

      await (dispatch as any)(addLedgerEntry(payload)).unwrap();
      setModal({
        isOpen: true,
        type: 'success',
        title: 'Entry recorded',
        message: 'The manual ledger transaction has been successfully saved.',
      });
    } catch (err: any) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: err.message || 'Failed to save transaction.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="lef-card">

          {/* Row 1: Date & Customer */}
          <div className="lef-grid lef-grid--1-2 lef-mb">
            <div className="lef-field">
              <label className="lef-label">Date</label>
              <input
                type="date"
                className="lef-input"
                value={formData.date}
                onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
                required
              />
            </div>
            <div className="lef-field">
              <label className="lef-label">Customer</label>
              <select
                className="lef-input lef-select"
                value={formData.customerId}
                onChange={(e) => setFormData((p) => ({ ...p, customerId: e.target.value }))}
                required
              >
                <option value="">Choose customer…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company || c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Transaction Type */}
          <div className="lef-field lef-mb">
            <label className="lef-label">Transaction type</label>
            <div className="lef-type-grid">
              <button
                type="button"
                onClick={() => setFormData((p) => ({ ...p, type: 'debit' }))}
                className={`lef-type-btn ${formData.type === 'debit' ? 'lef-type-btn--debit-active' : ''}`}
              >
                <div>
                  <div className={`lef-type-name ${formData.type === 'debit' ? 'lef-type-name--debit' : ''}`}>
                    Debit
                  </div>
                  <div className="lef-type-desc">Increase balance</div>
                </div>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
                  className={`lef-type-icon ${formData.type === 'debit' ? 'lef-type-icon--debit' : ''}`}>
                  <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M10 6v8M6 10h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => setFormData((p) => ({ ...p, type: 'credit' }))}
                className={`lef-type-btn ${formData.type === 'credit' ? 'lef-type-btn--credit-active' : ''}`}
              >
                <div>
                  <div className={`lef-type-name ${formData.type === 'credit' ? 'lef-type-name--credit' : ''}`}>
                    Credit
                  </div>
                  <div className="lef-type-desc">Reduce balance</div>
                </div>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
                  className={`lef-type-icon ${formData.type === 'credit' ? 'lef-type-icon--credit' : ''}`}>
                  <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M6 10h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* Row 3: Amount & Optional Invoice Link */}
          <div className={`lef-grid ${formData.type === 'credit' ? 'lef-grid--1-2' : ''} lef-mb`}>
            <div className="lef-field">
              <label className="lef-label">Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="lef-input"
                placeholder="0.00"
                value={formData.amount}
                style={formData.type !== 'credit' ? { maxWidth: '300px' } : {}}
                onChange={(e) => setFormData((p) => ({ ...p, amount: e.target.value }))}
                required
              />
            </div>
            
            {formData.type === 'credit' && (
              <div className="lef-field">
                <label className="lef-label">
                  Link to Invoice (Optional)
                  {customerInvoices.length > 0 && (
                    <span className="ms-2 px-2 py-0.5 rounded bg-primary bg-opacity-10 text-primary fw-900 border-0" 
                      style={{ fontSize: '9px', verticalAlign: 'middle' }}>
                      {customerInvoices.length} PENDING
                    </span>
                  )}
                </label>
                <select
                  className="lef-input lef-select"
                  value={formData.linkedInvoiceId}
                  onChange={(e) => setFormData((p) => ({ ...p, linkedInvoiceId: e.target.value }))}
                  disabled={!formData.customerId || customerInvoices.length === 0}
                >
                  {(customerInvoices.length > 0) ? (
                    <>
                      <option value="">-- NO LINK (GENERAL CREDIT) --</option>
                      {customerInvoices.map((inv) => {
                        const balanceRemaining = inv.grandTotal - (inv.paidAmount || 0);
                        return (
                          <option key={inv.id} value={inv.id}>
                            Invoice #{inv.invoiceNumber} - Balance: ₹{balanceRemaining.toLocaleString()}
                          </option>
                        );
                      })}
                    </>
                  ) : (
                    <option value="">No pending invoices found</option>
                  )}
                </select>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="lef-actions">
            <button
              type="button"
              className="btn btn-light px-4 py-2 rounded-pill fw-800 text-muted border-0"
             > Discard
            </button>
            <button 
              type="submit" 
              className="btn btn-primary d-flex align-items-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  <span>RECORDING...</span>
                </>
              ) : (
                'Record transaction'
              )}
            </button>
          </div>
        </div>
      </form>

      <StatusModal
        isOpen={modal.isOpen}
        onClose={() => {
          setModal((p) => ({ ...p, isOpen: false }));
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
        .lef-card {
          background: #ffffff;
          border: 0.5px solid rgba(0, 0, 0, 0.1);
          border-radius: 12px;
          padding: 1.5rem;
        
        }
        .lef-mb { margin-bottom: 1.25rem; }
        .lef-grid {
          display: grid;
          gap: 16px;
        }
        .lef-grid--1-2 {
          grid-template-columns: 1fr 2fr;
        }
        .lef-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .lef-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #6b7280;
        }
        .lef-input {
          width: 100%;
          box-sizing: border-box;
          height: 38px;
          padding: 0 12px;
          font-size: 14px;
          color: #111827;
          background: #ffffff;
          border: 0.5px solid rgba(0, 0, 0, 0.18);
          border-radius: 8px;
          outline: none;
          transition: border-color 0.15s;
          appearance: none;
          -webkit-appearance: none;
        }
        .lef-input:focus {
          border-color: rgba(0, 0, 0, 0.4);
          box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.06);
        }
        .lef-select {
          background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 7L11 1' stroke='%236B7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 36px;
          cursor: pointer;
        }
        .lef-type-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .lef-type-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          background: #ffffff;
          border: 0.5px solid rgba(0, 0, 0, 0.15);
          border-radius: 8px;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s, border-color 0.15s, border-width 0.15s;
        }
        .lef-type-btn:hover {
          background: #f9fafb;
        }
        .lef-type-btn--debit-active {
          background: #fef2f2;
          border: 2px solid #fca5a5;
        }
        .lef-type-btn--credit-active {
          background: #f0fdf4;
          border: 2px solid #86efac;
        }
        .lef-type-name {
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          margin-bottom: 2px;
        }
        .lef-type-name--debit { color: #dc2626; }
        .lef-type-name--credit { color: #16a34a; }
        .lef-type-desc {
          font-size: 13px;
          color: #111827;
        }
        .lef-type-icon {
          opacity: 0.3;
          color: #6b7280;
          flex-shrink: 0;
          transition: opacity 0.15s, color 0.15s;
        }
        .lef-type-icon--debit {
          opacity: 1;
          color: #dc2626;
        }
        .lef-type-icon--credit {
          opacity: 1;
          color: #16a34a;
        }
        .lef-actions {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 10px;
          padding-top: 1rem;
          border-top: 0.5px solid rgba(0, 0, 0, 0.08);
        }
        .lef-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 20px;
          font-size: 13px;
          font-weight: 500;
          border-radius: 999px;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
          border: 0.5px solid transparent;
        }
        .lef-btn:active { transform: scale(0.98); }
        .lef-btn--ghost {
          background: transparent;
          border-color: rgba(0, 0, 0, 0.18);
          color: #6b7280;
        }
        .lef-btn--ghost:hover { background: #f3f4f6; }
        .lef-btn--primary {
          background: #111827;
          border-color: #111827;
          color: #ffffff;
        }
        .lef-btn--primary:hover { background: #1f2937; }

        @media (max-width: 560px) {
          .lef-grid--1-2 { grid-template-columns: 1fr; }
          .lef-type-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
};

export default LedgerEntryForm;
