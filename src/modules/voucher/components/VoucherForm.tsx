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
import SearchableSelect from '@/components/shared/SearchableSelect';

import { fetchVendors } from '@/redux/features/vendorSlice';
import { fetchInwards } from '@/redux/features/inwardSlice';

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
  const { items: vendors } = useSelector((state: RootState) => state.vendors);
  const { items: inwards } = useSelector((state: RootState) => state.inward);
  const { items: allInvoices, loading: invoicesLoading } = useSelector((state: RootState) => state.invoices);
  const { user, company: activeCompany, token: authToken } = useSelector((state: RootState) => state.auth);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'receipt' as 'receipt' | 'payment',
    partyType: 'customer' as 'customer' | 'vendor',
    paymentMode: 'cash',
    chequeNo: '',
    customerId: '', // Using customerId/vendorId internal keys but unified UI
    vendorId: '',
    partyId: '',
    partyName: '',
    selectedInvoices: [] as { id: string, invoiceNo: string, amount: number, adjustmentType: string, adjustmentValue: number }[]
  });
 
   const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
 
   const toggleExpand = (id: string) => {
     setExpandedRows(prev => {
       const next = new Set(prev);
       if (next.has(id)) next.delete(id);
       else next.add(id);
       return next;
     });
   };

  const totalInvoiceAmount = formData.selectedInvoices.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalAdjustmentAmount = formData.selectedInvoices.reduce((sum, item) => sum + (Number(item.adjustmentValue) || 0), 0);
  const netPayableAmount = totalInvoiceAmount - totalAdjustmentAmount;

  const [modal, setModal] = useState<{ isOpen: boolean; type: 'success' | 'error'; title: string; message: string }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });



  useEffect(() => {
    if (activeCompany?.id) {
      // 1. Determine which invoices to fetch
      let invoiceNosParam = undefined;
      
      if ((mode === 'view' || mode === 'edit') && initialData?.referenceNo) {
        invoiceNosParam = initialData.referenceNo;
      } else {
        // In create mode, if we have an invoiceId in URL, fetch it specifically
        invoiceNosParam = searchParams.get('invoiceId') || undefined;
      }

      (dispatch as any)(fetchInvoices({ 
        company_id: activeCompany.id, 
        limit: 1000,
        invoice_nos: invoiceNosParam
      }));

      // Ensure customers and vendors are fetched
      (dispatch as any)(fetchCustomers({ company_id: activeCompany.id, limit: 1000 }));
      (dispatch as any)(fetchVendors({ company_id: activeCompany.id, limit: 1000 }));
      (dispatch as any)(fetchInwards({ company_id: activeCompany.id, limit: 1000 }));
    }
  }, [dispatch, activeCompany]);

  useEffect(() => {
    const customerIdFromUrl = searchParams.get('customerId');
    const invoiceIdFromUrl = searchParams.get('invoiceId');

    if (mode === 'create') {
      setFormData(prev => {
        let updated = { ...prev };
        let hasChanges = false;

        // 1. Resolve Customer
        if (customerIdFromUrl && !updated.customerId) {
          const customer = customers.find(c => String(c.id) === String(customerIdFromUrl));
          if (customer) {
            updated.customerId = String(customerIdFromUrl);
            updated.partyName = customer.company || customer.name || '';
            hasChanges = true;
          }
        }

        // 2. Resolve Invoice
        if (invoiceIdFromUrl) {
          const invoice = allInvoices.find(i => String(i.id) === String(invoiceIdFromUrl));
          const existing = updated.selectedInvoices.find(item => item.id === String(invoiceIdFromUrl));

          if (invoice) {
            const pendingAmount = invoice.grandTotal - (invoice.paidAmount || 0);
            const realNo = invoice.invoiceNumber || (invoice as any).invoice_no || String(invoiceIdFromUrl);

            if (!existing || existing.amount === 0 || existing.invoiceNo === String(invoiceIdFromUrl)) {
              updated.selectedInvoices = [{
                id: String(invoice.id),
                invoiceNo: realNo,
                amount: pendingAmount,
                adjustmentType: 'TDS',
                adjustmentValue: 0
              }];
              hasChanges = true;
            }
          } else if (updated.selectedInvoices.length === 0) {
            // Initial placeholder
            updated.selectedInvoices = [{
              id: String(invoiceIdFromUrl),
              invoiceNo: String(invoiceIdFromUrl),
              amount: 0,
              adjustmentType: 'TDS',
              adjustmentValue: 0
            }];
            hasChanges = true;
          }
        }
        
        return hasChanges ? updated : prev;
      });
    }
  }, [searchParams, mode, customers, allInvoices]);

  useEffect(() => {
    if (initialData) {
      // Use String comparison to handle ID type mismatches (14 vs '14')
      const targetId = String(initialData.partyId || (initialData as any).party_id || '');
      const type = (initialData.partyType || (initialData as any).party_type || 'customer') as 'customer' | 'vendor';
      
      const foundParty = type === 'customer' 
        ? customers.find(c => String(c.id) === targetId)
        : vendors.find(v => String(v.id) === targetId);

      const name = initialData.partyName || (initialData as any).party_name || foundParty?.name || (foundParty as any)?.company || '';

      setFormData(prev => ({
        ...prev,
        date: initialData.date,
        type: (initialData.type || 'receipt') as any,
        partyType: type,
        paymentMode: initialData.paymentMode || (initialData.chequeNo ? 'bank' : 'cash'),
        chequeNo: initialData.chequeNo || '',
        partyId: targetId,
        partyName: name,
        customerId: type === 'customer' ? targetId : '',
        vendorId: type === 'vendor' ? targetId : '',
        selectedInvoices: (() => {
          if (!initialData.referenceNo) return [];
          
          const results: any[] = [];
          // Regex to match: InvoiceNo (Amount|TDS) or InvoiceNo (Amount) or just InvoiceNo
          // It handles spaces, missing commas, and various symbols
          const regex = /([^,(\s]+)\s*(?:\(([^)|]+)(?:\|([^)]+))?\))?/g;
          let match;
          
          while ((match = regex.exec(initialData.referenceNo)) !== null) {
            const invoiceNo = match[1].trim();
            // Skip common noise like currency symbols if they got matched as invoice numbers
            if (['₹', 'RS', 'INR'].includes(invoiceNo.toUpperCase())) continue;
            
            let amount = parseFloat((match[2] || '').replace(/[^\d.]/g, '')) || 0;
            let tds = parseFloat((match[3] || '').replace(/[^\d.]/g, '')) || 0;
            
            // Robust matching: compare normalized strings (no leading zeros) or exact matches
            const normNo = invoiceNo.replace(/^0+/, '');
            const inv = allInvoices.find(i => {
              const iNo = String(i.invoiceNumber || (i as any).invoice_no || '').replace(/^0+/, '');
              return (iNo !== '' && iNo === normNo) || 
                     String(i.invoiceNumber) === invoiceNo || 
                     String(i.id) === invoiceNo;
            });
            
            // Fallback for amount: if parsed as 0 and we found the invoice, use its remaining balance
            if (amount === 0 && inv) {
              amount = inv.grandTotal - (inv.paidAmount || 0);
            }
            
            results.push({ 
              id: inv?.id || invoiceNo, 
              invoiceNo: inv?.invoiceNumber || invoiceNo, 
              amount: amount,
              adjustmentType: 'TDS',
              adjustmentValue: tds
            });
          }
          
          // Fallback 1: If it's a single invoice voucher and we parsed 0 amount (no brackets), use the voucher's total
          if (results.length === 1 && results[0].amount === 0 && initialData.amount > 0) {
            results[0].amount = initialData.amount;
          }
          
          // Fallback 2: If regex found nothing but voucher has an amount, assume a single old-format reference
          if (results.length === 0 && initialData.amount > 0 && initialData.referenceNo) {
             results.push({
               id: initialData.referenceNo,
               invoiceNo: initialData.referenceNo,
               amount: initialData.amount,
               adjustmentType: 'TDS',
               adjustmentValue: 0
             });
          }
          
          return results;
        })()
      }));
    }
  }, [initialData, customers, vendors, allInvoices]); // Dependency on customers/vendors ensure it re-runs when lists size changes

  const handlePartyChange = (id: string, type: 'customer' | 'vendor') => {
    const party = type === 'customer' 
      ? customers.find(c => String(c.id) === String(id))
      : vendors.find(v => String(v.id) === String(id));
      
    const invoiceIdFromUrl = searchParams.get('invoiceId');
    let preservedSelectedInvoices: any[] = [];
    
    if (invoiceIdFromUrl) {
      const invoice = allInvoices.find(i => String(i.id) === String(invoiceIdFromUrl));
      if (invoice) {
        const pendingAmount = invoice.grandTotal - (invoice.paidAmount || 0);
        const realNo = invoice.invoiceNumber || (invoice as any).invoice_no || String(invoiceIdFromUrl);
        preservedSelectedInvoices = [{
          id: String(invoice.id),
          invoiceNo: realNo,
          amount: pendingAmount,
          adjustmentType: 'TDS',
          adjustmentValue: 0
        }];
      }
    }

    setFormData(prev => ({
      ...prev,
      partyType: type,
      partyId: id,
      partyName: party?.name || (party as any)?.company || '',
      customerId: type === 'customer' ? id : '',
      vendorId: type === 'vendor' ? id : '',
      selectedInvoices: preservedSelectedInvoices
    }));
  };

  const toggleInvoice = (invoice: any) => {
    setFormData(prev => {
      const isSelected = prev.selectedInvoices.find(item => item.id === invoice.id);
      let newSelected;
      
      if (isSelected) {
        newSelected = prev.selectedInvoices.filter(item => item.id !== invoice.id);
      } else {
        newSelected = [...prev.selectedInvoices, { 
          id: invoice.id, 
          invoiceNo: invoice.invoiceNumber || invoice.invoice_no || '', 
          amount: invoice.grandTotal - (invoice.paidAmount || 0),
          adjustmentType: 'TDS',
          adjustmentValue: 0
        }];
      }

      return {
        ...prev,
        selectedInvoices: newSelected
      };
    });
  };

  const handleInvoiceDetailChange = (invoiceId: string, field: 'invoiceNo' | 'amount' | 'adjustmentType' | 'adjustmentValue', value: any) => {
    setFormData(prev => {
      const newSelected = prev.selectedInvoices.map(item => {
        if (item.id === invoiceId) {
          // Allow empty string in state for better input handling (backspace)
          const finalVal = (field === 'amount' || field === 'adjustmentValue') 
            ? (value === '' ? '' : parseFloat(value)) 
            : value;
          return { ...item, [field]: finalVal };
        }
        return item;
      });
      
      return {
        ...prev,
        selectedInvoices: newSelected
      };
    });
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.partyId) return;

    try {
      setIsSubmitting(true);
      const voucherPayload: Omit<Voucher, 'id' | 'createdAt'> = {
        voucherNo: `VCH-${Date.now().toString().slice(-6)}`,
        date: formData.date,
        type: formData.type,
        partyId: formData.partyId,
        partyName: formData.partyName,
        partyType: formData.partyType,
        amount: netPayableAmount,
        tdsAmount: totalAdjustmentAmount,
        paymentMode: formData.paymentMode as any,
        chequeNo: formData.paymentMode === 'cash' ? '' : formData.chequeNo,
        description: `Payment for ${formData.partyType}: ${formData.selectedInvoices.map(i => `${i.invoiceNo} (₹${i.amount})`).join(', ')}`,
        referenceNo: formData.selectedInvoices.map(i => `${i.invoiceNo} (${i.amount}|${i.adjustmentValue})`).join(', '),
        status: 'posted',
        company_id: user?.company_id || activeCompany?.id || ''
      };
      
      if (!(voucherPayload as any).company_id && activeCompany?.id) {
        (voucherPayload as any).company_id = activeCompany.id;
      }
      if (!(voucherPayload as any).company_id && user?.company_id) {
        (voucherPayload as any).company_id = user.company_id;
      }

      if (mode === 'create') {
        const firstInvoice = allInvoices.find(inv => inv.id === formData.selectedInvoices[0]?.id);
        const inwardId = (firstInvoice as any)?.inwardId || (firstInvoice as any)?.inward_id;
        const inwardNo = (firstInvoice as any)?.inwardNo || (firstInvoice as any)?.inward_no;

        const currentPaymentItems = formData.selectedInvoices.map(i => ({
          invoiceNo: i.invoiceNo,
          amount: i.amount,
          adjustmentType: i.adjustmentType,
          adjustmentValue: i.adjustmentValue,
          date: formData.date
        }));

        if (inwardId) {
          try {
            const activeToken = authToken || localStorage.getItem('token');
            const res = await fetch(`/api/vouchers?inward_id=${inwardId}`, {
              headers: { 'Authorization': `Bearer ${activeToken?.replace(/^"|"$/g, '')}` }
            });
            const data = await res.json();
            const existingVoucher = data.items && data.items.length > 0 ? data.items[0] : null;
            
            // Only consolidate if same party_id, party_type, and type, or if existing voucher has no party
            const isSameParty = !existingVoucher || (
              (!existingVoucher.party_id || String(existingVoucher.party_id) === String(voucherPayload.partyId)) &&
              (!existingVoucher.party_type || String(existingVoucher.party_type) === String(voucherPayload.partyType)) &&
              (!existingVoucher.type || String(existingVoucher.type) === String(voucherPayload.type))
            );

            if (existingVoucher && isSameParty) {
              // Append to existing
              const updatedPayload = {
                ...existingVoucher,
                party_id: existingVoucher.party_id || voucherPayload.partyId,
                party_name: existingVoucher.party_name || voucherPayload.partyName,
                party_type: existingVoucher.party_type || voucherPayload.partyType,
                type: existingVoucher.type || voucherPayload.type,
                amount: Number(existingVoucher.amount || 0) + netPayableAmount,
                tds_amount: Number(existingVoucher.tds_amount || 0) + totalAdjustmentAmount,
                description: `${existingVoucher.description_ || existingVoucher.description || ''}\n${voucherPayload.description}`,
                reference_no: `${existingVoucher.reference_no || ''}, ${voucherPayload.referenceNo}`,
                inward_id: inwardId,
                inward_no: inwardNo,
                items: [...(existingVoucher.items || []), ...currentPaymentItems]
              };
              
              const activeTokenClean = activeToken?.replace(/^"|"$/g, '');
              const updateRes = await fetch(`/api/vouchers/${existingVoucher.id}`, {
                method: 'PUT',
                headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${activeTokenClean}` 
                },
                body: JSON.stringify(updatedPayload)
              });

              if (!updateRes.ok) {
                const errData = await updateRes.json();
                throw new Error(errData.error || 'Failed to update existing voucher');
              }
            } else {
              // Create new with inwardId (either no existing voucher, or it belongs to a different party/type)
              await (dispatch as any)(createVoucher({ 
                ...voucherPayload, 
                inward_id: inwardId, 
                inward_no: inwardNo,
                items: currentPaymentItems
              } as any)).unwrap();
            }
          } catch (vchErr) {
             console.error("Consolidated Voucher failed", vchErr);
             await (dispatch as any)(createVoucher({ ...voucherPayload, items: currentPaymentItems } as any)).unwrap();
          }
        } else {
          await (dispatch as any)(createVoucher({ ...voucherPayload, items: currentPaymentItems } as any)).unwrap();
        }

        setModal({
          isOpen: true,
          type: 'success',
          title: 'Success!',
          message: "Voucher recorded successfully. Consolidated records updated."
        });
      } else {
        await (dispatch as any)(updateVoucher({ 
          ...initialData!, 
          ...voucherPayload,
          items: formData.selectedInvoices.map(i => ({
            invoiceNo: i.invoiceNo,
            amount: i.amount,
            adjustmentType: i.adjustmentType,
            adjustmentValue: i.adjustmentValue,
            date: formData.date
          }))
        } as any)).unwrap();
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

  const isInvoiceSelected = (inv: any) => {
    return formData.selectedInvoices.some(item => item.id === inv.id);
  };

  // Filter invoices for selected customer or vendor
  const customerInvoices = allInvoices.filter(inv => {
    const isSelected = isInvoiceSelected(inv);
    
    if (mode === 'view') {
      // In view mode, show ALL invoices that are part of this voucher
      // Prioritize isSelected over isMatched to handle migrated data with customer mismatches
      return isSelected;
    }

    const isNotPaid = inv.status?.toLowerCase() !== 'paid';

    if (formData.partyType === 'vendor') {
      // For vendor, find the inward entry linked to this invoice
      const matchedInward = (inwards || []).find(inw => String(inw.id) === String(inv.inwardId));
      // Check if that inward is linked to our selected vendor
      const isMatched = !!matchedInward && (
        String(matchedInward.vendorId) === String(formData.vendorId) ||
        String((matchedInward as any).vendor_id) === String(formData.vendorId)
      );
      return isMatched && (isNotPaid || isSelected);
    } else {
      const isMatched = String(inv.customerId) === String(formData.customerId);
      return isMatched && (isNotPaid || isSelected);
    }
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
                value={formData.paymentMode}
                onChange={e => setFormData(prev => ({ 
                  ...prev, 
                  paymentMode: e.target.value, 
                  chequeNo: e.target.value === 'cash' ? '' : prev.chequeNo 
                }))}
                required
                disabled={mode === 'view'}
              >
                <option value="cash">Cash</option>
                <option value="netbanking">Net Banking</option>
                <option value="card">Card</option>
                <option value="bank">Bank</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
            <div className="col-md-6 d-flex align-items-center gap-3">
              <label className="text-muted small fw-bold col-3">Cheque No</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ref No / Cheque No"
                value={formData.chequeNo}
                onChange={e => setFormData(prev => ({ ...prev, chequeNo: e.target.value }))}
                disabled={mode === 'view' || formData.paymentMode === 'cash'}
              />
            </div>
            <div className="col-md-6 d-flex align-items-center gap-3">
              <label className="text-muted small fw-bold col-3">Type <span className="text-danger">*</span></label>
              <select
                className="form-select fw-bold text-primary"
                value={formData.type}
                onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                disabled={mode === 'view'}
              >
                <option value="receipt">RECEIPT (IN)</option>
                <option value="payment">PAYMENT (OUT)</option>
              </select>
            </div>
            <div className="col-md-6 d-flex align-items-center gap-3">
              <label className="text-muted small fw-bold col-3">Party Type <span className="text-danger">*</span></label>
              <select
                className="form-select"
                value={formData.partyType}
                onChange={e => {
                  const newType = e.target.value as 'customer' | 'vendor';
                  setFormData(prev => ({
                    ...prev,
                    partyType: newType,
                    partyId: '',
                    partyName: '',
                    customerId: '',
                    vendorId: ''
                  }));
                }}
                disabled={mode === 'view'}
              >
                <option value="customer">Customer</option>
                <option value="vendor">Vendor</option>
              </select>
            </div>
            <div className="col-md-12 d-flex align-items-center gap-3">
              <label className="text-muted x-small fw-bold" style={{ width: '12.5%', flexShrink: 0 }}>SELECT PARTY <span className="text-danger">*</span></label>
              {mode !== 'create' ? (
                <div className="w-100 fw-bold text-uppercase" style={{ border: '1px solid #dee2e6', borderRadius: '8px', padding: '10px 12px', color: '#334155', backgroundColor: '#f8fafc', fontSize: '0.85rem', height: '38px', display: 'flex', alignItems: 'center' }}>
                  {formData.partyName || 'LOADING PARTY...'}
                </div>
              ) : (
                <SearchableSelect
                  options={formData.partyType === 'customer' 
                    ? customers.map(c => ({ value: c.id, label: c.company || c.name }))
                    : (vendors as any[]).map(v => ({ value: v.id, label: v.name }))
                  }
                  value={formData.partyId}
                  onChange={(val) => handlePartyChange(String(val), formData.partyType)}
                  placeholder={`Select ${formData.partyType === 'customer' ? 'Customer' : 'Vendor'}`}
                  className="w-100"
                />
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
                  <th className="small fw-bold py-3 text-muted text-end">NET</th>
                </tr>
              </thead>
              <tbody className="border-0">
                {invoicesLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-5">
                      <div className="spinner-border text-primary spinner-border-sm me-2" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <span className="text-muted small">Loading invoices...</span>
                    </td>
                  </tr>
                ) : (
                  <>
                    {(mode === 'view' ? formData.selectedInvoices : customerInvoices).map((invOrItem: any) => {
                      const inv = mode === 'view' ? (allInvoices.find(i => String(i.id) === String(invOrItem.id)) || invOrItem) : invOrItem;
                      const selectedData = mode === 'view' ? invOrItem : formData.selectedInvoices.find(item => String(item.id) === String(inv.id));
                      const invoiceId = inv.id || inv.invoiceNo || Math.random().toString();
                      return (
                        <React.Fragment key={invoiceId}>
                          <tr className="border-bottom border-light">
                            <td className="text-center">
                              <div className="d-flex align-items-center justify-content-center gap-2">
                                <input
                                  type="checkbox"
                                  className="form-check-input shadow-none border-secondary-subtle"
                                  checked={!!selectedData}
                                  onChange={() => toggleInvoice(inv)}
                                  disabled={mode === 'view'}
                                />
                                {selectedData && (
                                  <button 
                                    type="button" 
                                    className="btn btn-link p-0 text-decoration-none border-0 shadow-none"
                                    onClick={() => toggleExpand(invoiceId)}
                                    style={{ color: '#6c757d' }}
                                  >
                                    <i className={`bi bi-${expandedRows.has(invoiceId) ? 'dash-circle-fill' : 'plus-circle-fill'}`} style={{ fontSize: '16px' }}></i>
                                  </button>
                                )}
                              </div>
                            </td>
                           <td className="small text-muted">{inv.date ? new Date(inv.date).toLocaleDateString('en-GB').replace(/\//g, '-') : '-'}</td>
                           <td className="small fw-bold text-center text-dark">
                             {selectedData && mode !== 'view' ? (
                               <input 
                                 type="text" 
                                 className="form-control form-control-sm border-0 border-bottom text-center bg-transparent" 
                                 value={selectedData.invoiceNo} 
                                 onChange={(e) => handleInvoiceDetailChange(inv.id, 'invoiceNo', e.target.value)}
                                 style={{ fontWeight: 'inherit' }}
                               />
                             ) : (
                               selectedData?.invoiceNo || inv.invoiceNumber
                             )}
                           </td>
                           <td className="small fw-bold text-end text-dark">
                             {selectedData && mode !== 'view' ? (
                               <input 
                                 type="number" 
                                 className="form-control form-control-sm border-0 border-bottom text-end bg-transparent" 
                                 value={selectedData.amount} 
                                 onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                 onChange={(e) => handleInvoiceDetailChange(inv.id, 'amount', e.target.value)}
                                 style={{ fontWeight: 'inherit' }}
                               />
                             ) : (
                               (Number(selectedData?.amount ?? inv.grandTotal ?? 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })
                             )}
                           </td>
                           <td className="small fw-bold text-end text-dark">
                             {(Number(selectedData?.amount ?? inv.grandTotal ?? 0) - Number(selectedData?.adjustmentValue ?? 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                           </td>
                         </tr>
                         {selectedData && expandedRows.has(invoiceId) && (
                           <tr className="bg-light-subtle border-bottom border-light">
                             <td colSpan={1} className="py-0"></td>
                             <td colSpan={4} className="py-2">
                               <div className="d-flex align-items-center gap-4 ps-3 py-1 border-start border-orange border-3 ms-2">
                                 <div className="d-flex flex-column">
                                   <span className="text-muted fw-bold text-uppercase mb-1" style={{ fontSize: '9px', letterSpacing: '0.5px' }}>Deduction Type</span>
                                   <select 
                                     className="form-select form-select-sm bg-white border border-light-subtle shadow-none fw-bold text-dark" 
                                     style={{ width: '120px', fontSize: '11px', height: '30px', borderRadius: '6px' }}
                                     value={selectedData.adjustmentType || 'TDS'}
                                     onChange={e => handleInvoiceDetailChange(inv.id, 'adjustmentType', e.target.value)}
                                     disabled={mode === 'view'}
                                   >
                                     <option value="TDS">TDS</option>
                                     <option value="Others">Others</option>
                                   </select>
                                 </div>
                                 <div className="d-flex flex-column">
                                   <span className="text-muted fw-bold text-uppercase mb-1" style={{ fontSize: '9px', letterSpacing: '0.5px' }}>Amount</span>
                                   <div className="input-group input-group-sm" style={{ width: '130px' }}>
                                     <span className="input-group-text bg-white border border-light-subtle border-end-0 small text-muted" style={{ borderRadius: '6px 0 0 6px' }}>₹</span>
                                     <input 
                                       type="number" 
                                       className="form-control border border-light-subtle border-start-0 shadow-none fw-bold" 
                                       style={{ fontSize: '11px', height: '30px', borderRadius: '0 6px 6px 0' }}
                                       value={selectedData.adjustmentValue || 0}
                                       onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                       onChange={e => handleInvoiceDetailChange(inv.id, 'adjustmentValue', e.target.value)}
                                       placeholder="0.00"
                                       disabled={mode === 'view'}
                                     />
                                   </div>
                                 </div>
                                 {selectedData.adjustmentValue > 0 && (
                                   <div className="ms-auto pe-4 pt-3">
                                     <span className="badge bg-light text-secondary border border-secondary-subtle rounded-pill px-3 py-2" style={{ fontSize: '10px' }}>
                                       Applied {selectedData.adjustmentType}: ₹ {Number(selectedData.adjustmentValue).toFixed(2)}
                                     </span>
                                   </div>
                                 )}
                               </div>
                             </td>
                           </tr>
                         )}
                       </React.Fragment>
                      );
                    })}
                    {formData.partyType === 'customer' && formData.customerId && customerInvoices.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-5 text-muted small">
                          {allInvoices.some(inv => String(inv.customerId) === String(formData.customerId)) 
                            ? "All invoices for this customer are fully paid" 
                            : "No invoices found for this customer"}
                        </td>
                      </tr>
                    )}
                    {formData.partyType === 'vendor' && formData.vendorId && customerInvoices.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-5 text-muted small">
                          No outstanding invoices found for this vendor
                        </td>
                      </tr>
                    )}
                    {formData.partyType === 'customer' && !formData.customerId && (
                      <tr>
                        <td colSpan={5} className="text-center py-5 text-muted small">Please select a customer to view invoices</td>
                      </tr>
                    )}
                    {formData.partyType === 'vendor' && !formData.vendorId && (
                      <tr>
                        <td colSpan={5} className="text-center py-5 text-muted small">Please select a vendor to view invoices</td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
              <tfoot className="border-0">
                <tr>
                  <td colSpan={3}></td>
                  <td className="text-end py-2 text-muted small fw-semibold">Gross Total:</td>
                  <td className="fw-bold text-end py-2 text-dark" style={{ minWidth: '150px' }}>
                    ₹ {totalInvoiceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr>
                  <td colSpan={3}></td>
                  <td className="text-end py-2 text-muted small fw-semibold">Total Adjustments:</td>
                  <td className="fw-bold text-end py-2 text-muted">
                    (-) ₹ {totalAdjustmentAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr>
                  <td colSpan={3}></td>
                  <td className="text-end py-3 fs-6 fw-bold text-secondary border-top border-secondary-subtle">Net Payable:</td>
                  <td className="fw-bold text-end py-3 fs-5 text-dark border-top border-secondary-subtle">
                    ₹ {netPayableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
                  style={{ backgroundColor: '#6c757d', border: 'none', minWidth: '150px' }}
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
                setFormData(prev => ({
                  ...prev,
                  selectedInvoices: []
                }));
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
