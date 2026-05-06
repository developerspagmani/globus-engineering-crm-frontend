'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter, useSearchParams } from 'next/navigation';
import { RootState } from '@/redux/store';
import { createVoucher, updateVoucher } from '@/redux/features/voucherSlice';
import { fetchInvoices } from '@/redux/features/invoiceSlice';
import { fetchCustomers } from '@/redux/features/customerSlice';
import { Voucher } from '@/types/modules';
import FullPageStatus from '@/components/FullPageStatus';



interface VoucherFormProps {
  initialData?: Voucher;
  mode: 'create' | 'edit' | 'view';
}

const VoucherForm: React.FC<VoucherFormProps> = ({ initialData, mode }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/vouchers';
  const { items: customers } = useSelector((state: RootState) => state.customers);
  const { items: allInvoices } = useSelector((state: RootState) => state.invoices);
  const { user, company: activeCompany } = useSelector((state: RootState) => state.auth);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    chequeNo: '',
    customerId: '',
    customerName: '',
    selectedInvoices: [] as string[],
    totalAmount: 0
  });

  const [modal, setModal] = useState<{ isOpen: boolean; type: 'success' | 'error'; title: string; message: string }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });



  useEffect(() => {
    if (activeCompany?.id) {
      (dispatch as any)(fetchInvoices({ company_id: activeCompany.id, limit: 1000 }));
      // Ensure customers are fetched if the list is empty
      if (customers.length === 0) {
        (dispatch as any)(fetchCustomers({ company_id: activeCompany.id, limit: 1000 }));
      }
    }
  }, [dispatch, activeCompany, customers.length]);

  useEffect(() => {
    if (initialData) {
      // Use String comparison to handle ID type mismatches (14 vs '14')
      const targetId = String(initialData.partyId);
      const foundCustomer = customers.find(c => String(c.id) === targetId);

      const name = initialData.partyName || foundCustomer?.company || foundCustomer?.name || '';

      setFormData(prev => ({
        ...prev,
        date: initialData.date,
        chequeNo: initialData.chequeNo || '',
        customerId: targetId,
        customerName: name,
        selectedInvoices: initialData.referenceNo 
          ? initialData.referenceNo.split(',').map(s => s.trim()) 
          : [],
        totalAmount: initialData.amount
      }));
    }
  }, [initialData, customers, customers.length]); // Dependency on customers.length ensures it re-runs when list size changes

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const customer = customers.find(c => String(c.id) === String(id));
    setFormData(prev => ({
      ...prev,
      customerId: id,
      customerName: customer?.company || customer?.name || '',
      selectedInvoices: [],
      totalAmount: 0
    }));
  };

  const toggleInvoice = (invoiceId: string, amount: number) => {
    setFormData(prev => {
      const isSelected = prev.selectedInvoices.includes(invoiceId);
      const newSelected = isSelected
        ? prev.selectedInvoices.filter(id => id !== invoiceId)
        : [...prev.selectedInvoices, invoiceId];

      const newAmount = isSelected ? prev.totalAmount - amount : prev.totalAmount + amount;

      return {
        ...prev,
        selectedInvoices: newSelected,
        totalAmount: newAmount
      };
    });
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId) return;

    try {
      setIsSubmitting(true);
      const voucherPayload: Omit<Voucher, 'id' | 'createdAt'> = {
        voucherNo: `VCH-${Date.now().toString().slice(-6)}`,
        date: formData.date,
        type: 'receipt',
        partyId: formData.customerId,
        partyName: formData.customerName,
        partyType: 'customer',
        amount: formData.totalAmount,
        paymentMode: formData.chequeNo ? 'bank' : 'cash',
        chequeNo: formData.chequeNo,
        description: `Payment for Invoices: ${formData.selectedInvoices.join(', ')}`,
        referenceNo: formData.selectedInvoices.join(', '),
        status: 'posted',
        company_id: user?.company_id || activeCompany?.id || ''
      };
      
      // Mirror InwardForm logic to ensure company_id is present
      if (!(voucherPayload as any).company_id && activeCompany?.id) {
        (voucherPayload as any).company_id = activeCompany.id;
      }
      if (!(voucherPayload as any).company_id && user?.company_id) {
        (voucherPayload as any).company_id = user.company_id;
      }

      if (mode === 'create') {
        await (dispatch as any)(createVoucher(voucherPayload)).unwrap();
        setModal({
          isOpen: true,
          type: 'success',
          title: 'Success!',
          message: "Voucher recorded successfully."
        });
      } else {
        await (dispatch as any)(updateVoucher({ ...initialData!, ...voucherPayload } as any)).unwrap();
        setModal({
          isOpen: true,
          type: 'success',
          title: 'Success!',
          message: "Voucher updated successfully."
        });
      }


    } catch (err: any) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: err.message || 'Failed to save payment.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter invoices for selected customer
  const customerInvoices = allInvoices.filter(inv => {
    const isMatched = String(inv.customerId) === String(formData.customerId);
    const isSelected = formData.selectedInvoices.includes(String(inv.id));
    const isNotPaid = inv.status?.toLowerCase() !== 'paid';
    
    // Show if it belongs to customer AND (is not paid OR was already selected for this voucher)
    return isMatched && (isNotPaid || isSelected);
  });

  return (

    <>
      <div className="card shadow-sm border-0 bg-white p-4">
        {/* form content ... */}
        <form onSubmit={handleSubmit}>
          <div className="row g-4 mb-5">
            <div className="col-md-6 d-flex align-items-center gap-3">
              <label className="text-muted small fw-bold col-3">DATE <span className="text-danger">*</span></label>
              <input
                type="date"
                className="form-control"
                value={formData.date}
                onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                required
                disabled={mode === 'view'}
              />
            </div>
            <div className="col-md-6 d-flex align-items-center gap-3">
              <label className="text-muted small fw-bold col-3">Payment <span className="text-danger">*</span></label>
              <select
                className="form-select"
                name="paymentMode"
                value={formData.chequeNo ? 'bank' : 'cash'}
                onChange={e => setFormData(prev => ({ ...prev, chequeNo: e.target.value === 'cash' ? '' : prev.chequeNo }))}
                required
                disabled={mode === 'view'}
              >
                <option value="cash">Cash</option>
                <option value="bank">Bank / Cheque</option>
              </select>
            </div>
            <div className="col-md-6 d-flex align-items-center gap-3">
              <label className="text-muted small fw-bold col-3">Cheque No</label>
              <input
                type="text"
                className="form-control"
                placeholder="Cheque No (If Bank)"
                value={formData.chequeNo}
                onChange={e => setFormData(prev => ({ ...prev, chequeNo: e.target.value }))}
                disabled={mode === 'view'}
              />
            </div>
            <div className="col-md-12 d-flex align-items-center gap-3">
              <label className="text-muted x-small fw-bold" style={{ width: '12.5%', flexShrink: 0 }}>CUSTOMER <span className="text-danger">*</span></label>
              {initialData ? (
                <div className="w-100 fw-bold text-uppercase" style={{ border: '1px solid #dee2e6', borderRadius: '8px', padding: '10px 12px', color: '#334155', backgroundColor: '#f8fafc', fontSize: '0.85rem', height: '38px', display: 'flex', alignItems: 'center' }}>
                  {formData.customerName || 'LOADING CUSTOMER...'}
                </div>
              ) : (
                <select
                  className="form-select fw-semibold text-uppercase"
                  style={{ fontSize: '0.85rem', height: '38px' }}
                  value={formData.customerId}
                  onChange={handleCustomerChange}
                  required
                >
                  <option value="">Select Customer</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.company || c.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
  
          <div className="table-responsive mb-4 mt-2">
            <table className="table align-middle border-top border-light">
              <thead className="bg-light-subtle">
                <tr className="border-bottom border-light">
                  <th className="small fw-bold py-3 text-muted" style={{ width: '80px' }}>SELECT</th>
                  <th className="small fw-bold py-3 text-muted">INVOICE DATE</th>
                  <th className="small fw-bold py-3 text-muted text-center">INVOICE NO</th>
                  <th className="small fw-bold py-3 text-muted text-end">AMOUNT</th>
                </tr>
              </thead>
              <tbody className="border-0">
                {customerInvoices.map(inv => (
                  <tr key={inv.id} className="border-bottom border-light">
                    <td className="text-center">
                      <input
                        type="checkbox"
                        className="form-check-input shadow-none border-secondary-subtle"
                        checked={formData.selectedInvoices.includes(inv.id)}
                        onChange={() => toggleInvoice(inv.id, inv.grandTotal - (inv.paidAmount || 0))}
                        disabled={mode === 'view'}
                      />
                    </td>
                    <td className="small text-muted">{new Date(inv.date).toLocaleDateString()}</td>
                    <td className="small fw-bold text-center text-dark">{inv.invoiceNumber}</td>
                    <td className="small fw-bold text-end text-dark">
                      {(inv.grandTotal - (inv.paidAmount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                {formData.customerId && customerInvoices.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-5 text-muted small">
                      {allInvoices.some(inv => String(inv.customerId) === String(formData.customerId)) 
                        ? "All invoices for this customer are fully paid" 
                        : "No invoices found for this customer"}
                    </td>
                  </tr>
                )}
                {!formData.customerId && (
                  <tr>
                    <td colSpan={4} className="text-center py-5 text-muted small">Please select a customer to view invoices</td>
                  </tr>
                )}
              </tbody>
              <tfoot className="border-0">
                <tr>
                  <td colSpan={3}></td>
                  <td className="fw-bold text-end py-4 fs-6 text-dark border-top border-dark border-2">
                    {formData.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
  
          <div className="d-flex justify-content-center gap-3 mt-5">
            {mode !== 'view' ? (
              <>
                <button 
                  type="submit" 
                  className="btn btn-primary px-5 py-2 rounded-pill fw-bold shadow-sm d-flex align-items-center gap-2" 
                  style={{ backgroundColor: 'var(--accent-color)', border: 'none', minWidth: '150px' }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      <span>SUBMITTING...</span>
                    </>
                  ) : (
                    mode === 'create' ? 'SUBMIT' : 'SAVE CHANGES'
                  )}
                </button>
                <button type="button" className="btn btn-light px-5 py-2 rounded-pill fw-bold border" onClick={() => router.push(redirectPath)}>CLEAR</button>
              </>
            ) : (
              <button type="button" className="btn btn-secondary px-5 py-2 rounded-pill fw-bold shadow-sm" onClick={() => router.push(redirectPath)}>BACK TO LIST</button>
            )}
          </div>
        </form>
  
        {modal.isOpen && (
          <FullPageStatus
            type={modal.type}
            title={modal.title}
            message={modal.message}
            onClose={() => {
              setModal(prev => ({ ...prev, isOpen: false }));
              if (modal.type === 'success') {
                // Refresh invoices to update balances in Pending Payment/Ledger before redirecting
                if (activeCompany?.id) {
                  (dispatch as any)(fetchInvoices({ company_id: activeCompany.id }));
                }
                
                // Reset local state if successful
                setFormData({
                  date: new Date().toISOString().split('T')[0],
                  chequeNo: '',
                  customerId: '',
                  customerName: '',
                  selectedInvoices: [],
                  totalAmount: 0
                });
                router.push(redirectPath);
              }
            }}
          />
        )}

      </div>
      <style jsx>{`
        .form-control {
          font-size: 0.85rem !important;
          height: 38px !important;
        }
        .form-select {
          font-size: 0.85rem !important;
          height: 38px !important;
      }
      `}</style>
    </>
  );
};

export default VoucherForm;
