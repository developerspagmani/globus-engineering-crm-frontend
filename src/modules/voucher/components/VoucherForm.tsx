'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter, useSearchParams } from 'next/navigation';
import { RootState } from '@/redux/store';
import { createVoucher, updateVoucher } from '@/redux/features/voucherSlice';
import { fetchInvoices } from '@/redux/features/invoiceSlice';
import { fetchCustomers } from '@/redux/features/customerSlice';
import { Voucher } from '@/types/modules';
import StatusModal from '@/components/StatusModal';

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
      (dispatch as any)(fetchInvoices(activeCompany.id));
      // Ensure customers are fetched if the list is empty
      if (customers.length === 0) {
        (dispatch as any)(fetchCustomers(activeCompany.id));
      }
    }
  }, [dispatch, activeCompany, customers.length]);

  useEffect(() => {
    if (initialData) {
      // Use String comparison to handle ID type mismatches (14 vs '14')
      const targetId = String(initialData.partyId);
      const foundCustomer = customers.find(c => String(c.id) === targetId);

      const name = initialData.partyName || foundCustomer?.company || foundCustomer?.name || '';

      if (name) {
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
    }
  }, [initialData, customers, customers.length]); // Dependency on customers.length ensures it re-runs when list size changes

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const customer = customers.find(c => c.id === id);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId) return;

    try {
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
          title: 'Voucher Added!',
          message: 'The payment has been successfully recorded.'
        });
      } else {
        await (dispatch as any)(updateVoucher({ ...initialData!, ...voucherPayload } as any)).unwrap();
        setModal({
          isOpen: true,
          type: 'success',
          title: 'Voucher Updated',
          message: 'The payment details have been saved.'
        });
      }
    } catch (err: any) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: err.message || 'Failed to save payment.'
      });
    }
  };

  // Filter invoices for selected customer
  const customerInvoices = allInvoices.filter(inv =>
    inv.customerId === formData.customerId &&
    inv.status?.toLowerCase() !== 'paid'
  );

  return (
    <div className="card shadow-sm border-0 bg-white p-4">
      <form onSubmit={handleSubmit}>
        <div className="row g-4 mb-5">
          <div className="col-md-6 d-flex align-items-center gap-3">
            <label className="text-muted small fw-bold col-2">Date</label>
            <input
              type="date"
              className="form-control border-0 border-bottom rounded-0 shadow-none px-0"
              style={{ borderBottomStyle: 'dotted' as any }}
              value={formData.date}
              onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
              disabled={mode === 'view'}
            />
          </div>
          <div className="col-md-6 d-flex align-items-center gap-3">
            <label className="text-muted small fw-bold col-3">Cheque No</label>
            <input
              type="text"
              className="form-control border-0 border-bottom rounded-0 shadow-none px-2"
              placeholder="Cheque No"
              value={formData.chequeNo}
              onChange={e => setFormData(prev => ({ ...prev, chequeNo: e.target.value }))}
              disabled={mode === 'view'}
            />
          </div>
          <div className="col-md-12 d-flex align-items-center gap-3">
            <label className="text-muted small fw-bold col-1">Customer</label>
            {initialData ? (
              <div className="w-100 text-center fw-900 text-uppercase fs-3 tracking-tighter" style={{ borderBottom: '2px dotted #ddd', paddingBottom: '5px', color: '#000' }}>
                {formData.customerName || 'LOADING CUSTOMER...'}
              </div>
            ) : (
              <select
                className="form-select border-0 border-bottom rounded-0 shadow-none px-0 text-center fw-bold text-uppercase fs-5"
                style={{ borderBottomStyle: 'dotted' as any }}
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
                  <td className="small fw-bold text-end text-dark">{(inv.grandTotal - (inv.paidAmount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
              {formData.customerId && customerInvoices.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-5 text-muted small">No pending invoices for this customer</td>
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
                <td className="fw-bold text-end py-4 fs-4 text-dark border-top border-dark border-2">
                  {formData.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="d-flex justify-content-center gap-3 mt-5">
          {mode !== 'view' ? (
            <>
              <button type="submit" className="btn btn-success px-5 rounded-1 fw-bold border-0" style={{ backgroundColor: '#00a65a' }}>{mode === 'create' ? 'ADD' : 'SAVE'}</button>
              <button type="button" className="btn btn-danger px-4 rounded-1 fw-bold border-0" style={{ backgroundColor: '#dd4b39' }} onClick={() => router.push(redirectPath)}>CANCEL</button>
            </>
          ) : (
            <button type="button" className="btn btn-secondary px-5 rounded-1 fw-bold border-0" onClick={() => router.push(redirectPath)}>BACK</button>
          )}
        </div>
      </form>

      <StatusModal
        isOpen={modal.isOpen}
        onClose={() => {
          setModal(prev => ({ ...prev, isOpen: false }));
          if (modal.type === 'success') {
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
        type={modal.type}
        title={modal.title}
        message={modal.message}
      />
    </div>
  );
};

export default VoucherForm;
