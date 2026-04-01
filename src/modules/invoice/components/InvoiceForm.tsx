'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter, useSearchParams } from 'next/navigation';
import { RootState } from '@/redux/store';
import { addInvoice, updateInvoice } from '@/redux/features/invoiceSlice';
import { fetchItems, fetchProcesses, fetchPriceFixings } from '@/redux/features/masterSlice';
import { fetchInwards } from '@/redux/features/inwardSlice';
import { fetchCustomers } from '@/redux/features/customerSlice';
import { Invoice } from '@/types/modules';
import StatusModal from '@/components/StatusModal';

interface InvoiceFormProps {
   initialData?: Invoice;
   mode: 'create' | 'edit';
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ initialData, mode }) => {
   const dispatch = useDispatch();
   const router = useRouter();
   const searchParams = useSearchParams();
   const inwardId = searchParams.get('inwardId');

   const { company } = useSelector((state: RootState) => state.auth);
   const { items: customers, loading: customersLoading } = useSelector((state: RootState) => state.customers);
   const { items: inwards } = useSelector((state: RootState) => state.inward);
   const { settings } = useSelector((state: RootState) => state.invoices);
   const { items: masterItems, processes: masterProcesses, priceFixings } = useSelector((state: RootState) => state.master);

   const typeParam = searchParams.get('type');
   const defaultBillType = typeParam === 'wp' ? 'With Process' : typeParam === 'wop' ? 'Without Process' : typeParam === 'both' ? 'Both' : 'With Process';

   const [formData, setFormData] = useState<any>({
      invoiceNumber: settings.nextInvoice || '',
      challanNumber: settings.nextChallan || '',
      customerId: '',
      customerName: '',
      company_id: company?.id || '',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      type: 'INVOICE',
      billType: defaultBillType,
      inwardId: inwardId || undefined,
      status: 'draft',
      poNo: '',
      po_no: '',
      poDate: '',
      po_date: '',
      dcNo: '',
      dc_no: '',
      dcDate: '',
      dc_date: '',
      address: '',
      gstin: '',
      state: '',
      items: [{ id: '1', description: '', process: '', quantity: 1, wopQty: 0, unitPrice: 0, tax: 0, amount: 0, total: 0 }],
      subTotal: 0,
      taxTotal: 0,
      discount: 0,
      otherCharges: 0,
      taxRate: 12,
      grandTotal: 0,
      paidAmount: 0,
      notes: '',
   });

   const [selectionMode, setSelectionMode] = useState<'CUSTOMER' | 'GSTN'>('CUSTOMER');

   const [gstLoading, setGstLoading] = useState(false);
   const [gstError, setGstError] = useState<string | null>(null);

   const [modal, setModal] = useState<{ isOpen: boolean; type: 'success' | 'error'; title: string; message: string }>({
      isOpen: false,
      type: 'success',
      title: '',
      message: ''
   });

   useEffect(() => {
      if (company?.id) {
         (dispatch as any)(fetchItems(company.id));
         (dispatch as any)(fetchProcesses(company.id));
         (dispatch as any)(fetchPriceFixings(company.id));
         (dispatch as any)(fetchCustomers(company.id));

         if (mode === 'create') {
            import('@/redux/features/invoiceSlice').then(async ({ fetchNextNumbers }) => {
               try {
                  const data = await (dispatch as any)(fetchNextNumbers(company.id)).unwrap();
                  setFormData((prev: any) => ({
                     ...prev,
                     invoiceNumber: prev.invoiceNumber || String(data.nextInvoice || data.nextInvoiceNo || '').padStart(4, '0'),
                     challanNumber: prev.challanNumber || String(data.nextChallan || data.nextDeliveryNo || '').padStart(4, '0')
                  }));
               } catch (err) {
                  console.error('Failed to pre-fetch next sequence numbers:', err);
               }
            });
         }
      } else {
         (dispatch as any)(fetchCustomers());
      }
   }, [dispatch, company?.id]);

   useEffect(() => {
      if (company?.id && !formData.company_id) {
         setFormData((prev: any) => ({ ...prev, company_id: company.id }));
      }
   }, [company?.id, formData.company_id]);

   const findPrice = (compId: string, custId: string, itemName: string, procName: string) => {
      if (!custId || !itemName) return 0;

      const pf = priceFixings.find(pf => {
         const matchCust = String(pf.customerId) === String(custId);
         const matchItem = String(pf.itemName).toLowerCase() === String(itemName).toLowerCase();
         const matchProc = !procName || String(pf.processName).toLowerCase() === String(procName).toLowerCase();

         return matchCust && matchItem && (procName ? matchProc : true);
      });

      return pf ? pf.price : 0;
   };

   useEffect(() => {
      if (mode === 'create' && !formData.invoiceNumber && settings.nextInvoice) {
         setFormData((prev: any) => ({
            ...prev,
            invoiceNumber: settings.nextInvoice,
            challanNumber: settings.nextChallan,
         }));
      }
   }, [settings.nextInvoice, settings.nextChallan, mode, formData.invoiceNumber]);

   useEffect(() => {
      if (initialData) {
         const mappedData = {
            ...initialData,
            customerId: String(initialData.customerId || ''),
            invoiceNumber: initialData.invoiceNumber || (initialData as any).invoice_no,
            date: initialData.date || (initialData as any).invoice_date,
            billType: (initialData.billType || (initialData as any).bill_type || initialData.type || 'with_process').toLowerCase().includes('without') ||
               (initialData.billType || (initialData as any).bill_type || initialData.type) === 'WOP' ? 'Without Process' :
               (initialData.billType || (initialData as any).bill_type || initialData.type || '').toLowerCase() === 'both' ? 'Both' : 'With Process',
            poNo: (initialData as any).po_no || initialData.poNo || '',
            po_no: (initialData as any).po_no || initialData.poNo || '',
            dcNo: (initialData as any).dc_no || initialData.dcNo || '',
            dc_no: (initialData as any).dc_no || initialData.dcNo || '',
            poDate: initialData.poDate || (initialData as any).po_date || '',
            po_date: initialData.poDate || (initialData as any).po_date || '',
            dcDate: initialData.dcDate || (initialData as any).dc_date || '',
            dc_date: initialData.dcDate || (initialData as any).dc_date || '',
            state: (initialData as any).state || '',
            challanNumber: (initialData as any).invoice_no || initialData.invoiceNumber || (initialData as any).challanNumber,
            otherCharges: initialData.otherCharges || (initialData as any).other_charges || 0,
            taxRate: initialData.taxRate || (initialData as any).tax_rate || 12,
            discount: initialData.discount || 0,
         };
         setFormData(mappedData);
      } else if (inwardId && priceFixings.length > 0 && customers.length > 0) {
         const inward = inwards.find(i => i.id === inwardId);
         if (inward) {
            const customer = customers.find(c => String(c.id) === String(inward.customerId));
            const formattedAddress = [customer?.street1, customer?.city, customer?.state].filter(Boolean).join(', ');
            
            setFormData((prev: any) => ({
               ...prev,
               customerId: inward.customerId || '',
               customerName: inward.customerName || '',
               address: inward.address || formattedAddress || '',
               poNo: inward.poReference || '',
               po_no: inward.poReference || '',
               poDate: inward.poDate || '',
               po_date: inward.poDate || '',
               dcNo: inward.dcNo || '',
               dc_no: inward.dcNo || '',
               dcDate: inward.dcDate || '',
               dc_date: inward.dcDate || '',
               gstin: (inward as any).gstin || customer?.gst || '',
               state: (inward as any).state || customer?.state || '',
               inwardId: inward.id,
               items: inward.items.map((item, idx) => {
                  const unitPrice = findPrice(
                     prev.company_id,
                     inward.customerId || '',
                     item.description,
                     item.process || ''
                  );

                  const qty = item.quantity;
                  const amount = qty * unitPrice;
                  const tax = amount * 0.12;

                  return {
                     id: idx.toString(),
                     description: item.description,
                     process: item.process || '',
                     quantity: qty,
                     unitPrice: unitPrice,
                     amount: amount,
                     tax: tax,
                     total: amount + tax
                  };
               })
            }));
         }
      }
   }, [initialData, inwardId, inwards, priceFixings, customers]);

   useEffect(() => {
      const subTotal = formData.items.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
      const taxableAmount = subTotal - (formData.discount || 0) + (formData.otherCharges || 0);
      const taxTotal = (taxableAmount * (formData.taxRate || 0)) / 100;
      const grandTotal = taxableAmount + taxTotal;

      if (formData.subTotal !== subTotal || formData.taxTotal !== taxTotal || formData.grandTotal !== grandTotal) {
         setFormData((prev: any) => ({
            ...prev,
            subTotal,
            taxTotal,
            grandTotal
         }));
      }
   }, [formData.items, formData.discount, formData.otherCharges, formData.taxRate, formData.subTotal, formData.taxTotal, formData.grandTotal]);

   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      if (name === 'customerId') {
         const customer = customers.find(c => c.id === value);
         setFormData((prev: any) => ({
            ...prev,
            [name]: value,
            customerName: customer?.name || '',
            address: customer?.street1 || '',
            gstin: customer?.gst || '',
            state: customer?.state || ''
         }));
      } else {
         let updates: any = { [name]: value };
         if (name === 'poNo') updates.po_no = value;
         if (name === 'dcNo') updates.dc_no = value;
         if (name === 'poDate') updates.po_date = value;
         if (name === 'dcDate') updates.dc_date = value;

         setFormData((prev: any) => ({ ...prev, ...updates }));
      }
   };

   const handleGstLookup = async (gstinOverride?: string) => {
      const gstinToVerify = gstinOverride || formData.gstin;
      if (!gstinToVerify || gstinToVerify.length !== 15) {
         setGstError('Enter 15-digit GSTIN');
         return;
      }

      try {
         setGstLoading(true);
         setGstError(null);
         const response = await fetch(`/api/gst-lookup?gstin=${gstinToVerify.toUpperCase()}`);
         if (!response.ok) throw new Error('Lookup failed');
         const result = await response.json();
         const data = result.data;

         if (data) {
            setFormData((prev: any) => ({
               ...prev,
               customerName: data.legal_name || prev.customerName,
               address: data.address || prev.address,
               state: data.state_jurisdiction || prev.state,
               gstin: gstinToVerify.toUpperCase()
            }));
         }
      } catch (err) {
         setGstError('GSTIN lookup failed. Please fill manually.');
      } finally {
         setGstLoading(false);
      }
   };

   const handleItemChange = (index: number, field: string, value: any) => {
      const newItems = [...formData.items];
      const item = { ...newItems[index], [field]: value };

      if (field === 'description' || field === 'process' || field === 'customerId') {
         const desc = field === 'description' ? value : item.description;
         const proc = field === 'process' ? value : item.process;
         item.unitPrice = findPrice(formData.company_id, formData.customerId, desc, proc);
      }

      if (field === 'quantity' || field === 'unitPrice' || field === 'description' || field === 'process') {
         item.amount = (item.quantity || 0) * (item.unitPrice || 0);
         item.tax = item.amount * (formData.taxRate / 100);
         item.total = item.amount + item.tax;
      }

      newItems[index] = item;
      setFormData((prev: any) => ({ ...prev, items: newItems }));
   };

   return (
      <>
         <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
            <div className="card-body p-4 p-lg-5">
               <form onSubmit={e => e.preventDefault()}>
            <div className="d-flex align-items-center justify-content-between mb-5 pb-2 gap-4 flex-wrap">
               <div className="d-flex align-items-center">
                  <button
                     type="button"
                     className="btn btn-outline-secondary border-0 p-0 me-3"
                     onClick={() => {
                        const tab = searchParams.get('tab');
                        if (tab) {
                           router.push(`/invoices?tab=${tab}`);
                        } else {
                           router.back();
                        }
                     }}
                     title="Back to Invoices"
                  >
                     <i className="bi bi-arrow-left-circle fs-3 text-muted"></i>
                  </button>
                  <h3 className="fw-bold mb-0 text-dark">{mode === 'create' ? 'Create New Invoice' : 'Edit Invoice'}</h3>
               </div>

               {mode === 'create' && (
                  <div className="d-flex align-items-center gap-3 ms-auto">
                     {/* Toggle pill */}
                     <div
                        className="d-flex align-items-center p-1"
                        style={{
                           background: 'var(--bs-secondary-bg, #f1f3f5)',
                           borderRadius: '999px',
                           border: '0.5px solid rgba(0,0,0,0.08)',
                           gap: '2px',
                        }}
                     >
                        <button
                           type="button"
                           onClick={() => setSelectionMode('CUSTOMER')}
                           style={{
                              padding: '6px 18px',
                              borderRadius: '999px',
                              border: 'none',
                              fontSize: '13px',
                              fontWeight: 500,
                              cursor: 'pointer',
                              background: selectionMode === 'CUSTOMER' ? '#f97316' : 'transparent',
                              color: selectionMode === 'CUSTOMER' ? '#fff' : '#6c757d',
                              transition: 'all 0.15s',
                           }}
                        >
                           By Customer
                        </button>
                        <button
                           type="button"
                           onClick={() => setSelectionMode('GSTN')}
                           style={{
                              padding: '6px 18px',
                              borderRadius: '999px',
                              border: 'none',
                              fontSize: '13px',
                              fontWeight: 500,
                              cursor: 'pointer',
                              background: selectionMode === 'GSTN' ? '#f97316' : 'transparent',
                              color: selectionMode === 'GSTN' ? '#fff' : '#6c757d',
                              transition: 'all 0.15s',
                           }}
                        >
                           By GSTIN
                        </button>
                     </div>

                     {/* Divider */}
                     <div style={{ width: '1px', height: '28px', background: 'rgba(0,0,0,0.12)' }} />

                     {selectionMode === 'CUSTOMER' ? (
                        <div
                           className="d-flex align-items-center gap-2"
                           style={{
                              border: '1px solid #dee2e6',
                              borderRadius: '8px',
                              padding: '6px 12px',
                              minWidth: '200px',
                              maxWidth: '240px',
                              background: '#fff',
                              cursor: 'pointer',
                           }}
                        >
                           <i className="bi bi-person" style={{ fontSize: '15px', color: '#6c757d', flexShrink: 0 }}></i>
                           <select
                              name="customerId"
                              value={formData.customerId}
                              onChange={handleInputChange}
                              style={{
                                 border: 'none',
                                 outline: 'none',
                                 fontSize: '13px',
                                 fontWeight: 500,
                                 color: formData.customerId ? '#212529' : '#6c757d',
                                 flex: 1,
                                 appearance: 'none',
                                 WebkitAppearance: 'none',
                                 cursor: 'pointer',
                                 background: 'transparent',
                                 width: '100%',
                                 padding: 0,
                              }}
                           >
                              <option value="">Choose Customer</option>
                              {customers.map(c => (
                                 <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                           </select>
                           <i className="bi bi-chevron-down" style={{ fontSize: '11px', color: '#6c757d', flexShrink: 0 }}></i>
                        </div>
                     ) : (
                        <div
                           className="d-flex align-items-center gap-2"
                           style={{
                              borderBottom: '1.5px solid #dee2e6',
                              paddingBottom: '4px',
                              minWidth: '220px',
                           }}
                        >
                           <i className="bi bi-hash" style={{ fontSize: '16px', color: '#6c757d' }}></i>
                           <input
                              type="text"
                              className="bg-transparent fw-bold text-uppercase"
                              placeholder="Enter GSTIN"
                              name="gstin"
                              value={formData.gstin}
                              onChange={(e) => {
                                 const val = e.target.value.toUpperCase();
                                 handleInputChange(e);
                                 if (val.length === 15) {
                                    setTimeout(() => handleGstLookup(val), 100);
                                 }
                              }}
                              maxLength={15}
                              style={{
                                 border: 'none',
                                 outline: 'none',
                                 fontSize: '14px',
                                 flex: 1,
                                 letterSpacing: '0.04em',
                              }}
                           />
                           {gstLoading && <span className="spinner-border spinner-border-sm text-primary"></span>}
                        </div>
                     )}
                  </div>
               )}
            </div>

            {mode === 'create' && (
               <div className="d-flex align-items-center mb-5 pb-4 border-bottom">
                  <h5 className="text-danger fw-bold mb-0 me-4">Select the Bill Type</h5>
                  <div style={{ width: '300px' }}>
                     <select
                        className="form-select border-0 border-bottom rounded-0 py-2"
                        style={{ fontSize: '0.85rem' }}
                        name="billType"
                        value={formData.billType}
                        onChange={handleInputChange}
                     >
                        <option value="With Process">With Process</option>
                        <option value="Without Process">Without Process</option>
                        <option value="Both">Both</option>
                     </select>
                  </div>
               </div>
            )}

            <div className="">
               <div className="row g-4">
                  <div className="col-md-6">
                     <div className="row mb-3 align-items-center">
                        <label className="col-sm-3 text-muted small text-uppercase fw-bold p-0">Customer</label>
                        <div className="col-sm-9">
                           <input
                              type="text"
                              className="form-control border-0 border-bottom rounded-0 fw-bold px-2 bg-light bg-opacity-50"
                              style={{ height: '42px', cursor: 'not-allowed' }}
                              value={formData.customerName || ''}
                              readOnly
                              placeholder="Select customer to view name..."
                           />
                        </div>
                     </div>
                     <div className="row mb-3 align-items-center">
                        <label className="col-sm-3 text-muted small text-uppercase fw-bold p-0">Address</label>
                        <div className="col-sm-9">
                           <input
                              type="text"
                              className="form-control border-0 border-bottom rounded-0 bg-transparent shadow-none px-2"
                              name="address"
                              value={formData.address}
                              onChange={handleInputChange}
                              placeholder="Physical address..."
                              style={{ height: '42px' }}
                           />
                        </div>
                     </div>
                  </div>

                  <div className="col-md-6">
                     <div className="row mb-3 align-items-center">
                        <label className="col-sm-3 text-muted small text-uppercase fw-bold p-0">GSTIN</label>
                        <div className="col-sm-9">
                           <input
                              type="text"
                              className="form-control border-0 border-bottom rounded-0 bg-light bg-opacity-50 text-uppercase fw-bold shadow-none px-2"
                              name="gstin"
                              placeholder="GSTIN"
                              value={formData.gstin}
                              readOnly
                              style={{ height: '42px', cursor: 'not-allowed' }}
                           />
                           {gstError && <div className="text-danger small mt-1">{gstError}</div>}
                        </div>
                     </div>
                     <div className="row mb-3 align-items-center">
                        <label className="col-sm-3 text-muted small text-uppercase fw-bold p-0">State</label>
                        <div className="col-sm-9">
                           <input
                              type="text"
                              className="form-control border-0 border-bottom rounded-0 bg-transparent fw-bold shadow-none px-2"
                              name="state"
                              placeholder="e.g. KARNATAKA"
                              value={formData.state}
                              onChange={handleInputChange}
                              style={{ height: '42px' }}
                           />
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="mb-5">
               <div className="row g-4">
                  <div className="col-md-6">
                     {(formData.billType === 'Without Process' || formData.billType === 'WOP' || String(formData.billType).toLowerCase().includes('without')) ? (
                        <div className="row mb-3 align-items-center">
                           <label className="col-sm-3 text-muted small text-uppercase fw-bold p-0">Delivery Challan</label>
                           <div className="col-sm-9">
                              <input type="text" className="form-control border-0 border-bottom rounded-0 px-2 shadow-none" name="challanNumber" value={formData.challanNumber} onChange={handleInputChange} disabled={mode === 'edit'} style={mode === 'edit' ? { backgroundColor: '#f4f4f4', cursor: 'not-allowed', height: '42px' } : { height: '42px' }} />
                           </div>
                        </div>
                     ) : (
                        <>
                           <div className="row mb-3 align-items-center">
                              <label className="col-sm-3 text-muted small text-uppercase fw-bold p-0">Invoice No</label>
                              <div className="col-sm-9">
                                 <input type="text" className="form-control border-0 border-bottom rounded-0 px-2 fw-bold shadow-none" name="invoiceNumber" value={formData.invoiceNumber} onChange={handleInputChange} disabled={mode === 'edit'} style={mode === 'edit' ? { backgroundColor: '#f4f4f4', cursor: 'not-allowed', height: '42px' } : { height: '42px' }} />
                              </div>
                           </div>
                           {formData.billType === 'Both' && (
                              <div className="row mb-3 align-items-center">
                                 <label className="col-sm-3 text-muted small text-uppercase fw-bold p-0">Delivery Challan</label>
                                 <div className="col-sm-9">
                                    <input type="text" className="form-control border-0 border-bottom rounded-0 px-2 shadow-none" name="challanNumber" value={formData.challanNumber} onChange={handleInputChange} disabled={mode === 'edit'} style={mode === 'edit' ? { backgroundColor: '#f4f4f4', cursor: 'not-allowed', height: '42px' } : { height: '42px' }} />
                                 </div>
                              </div>
                           )}
                        </>
                     )}
                     <div className="row mb-3 align-items-center">
                        <label className="col-sm-3 text-muted small text-uppercase fw-bold p-0">Po No</label>
                        <div className="col-sm-9">
                           <input type="text" className="form-control border-0 border-bottom rounded-0 shadow-none px-2" name="poNo" value={formData.poNo} onChange={handleInputChange} placeholder="Po No" style={{ height: '42px' }} />
                        </div>
                     </div>
                     <div className="row mb-3 align-items-center">
                        <label className="col-sm-3 text-muted small text-uppercase fw-bold p-0">Dc No</label>
                        <div className="col-sm-9">
                           <input type="text" className="form-control border-0 border-bottom rounded-0 shadow-none px-2" name="dcNo" value={formData.dcNo} onChange={handleInputChange} placeholder="Dc No" style={{ height: '42px' }} />
                        </div>
                     </div>
                  </div>

                  <div className="col-md-6">
                     <div className="row mb-3 align-items-center">
                        <label className="col-sm-3 text-muted small text-uppercase fw-bold p-0">Date</label>
                        <div className="col-sm-9">
                           <input type="date" className="form-control border-0 border-bottom rounded-0 shadow-none px-2 bg-transparent" name="date" value={formData.date} onChange={handleInputChange} style={{ height: '42px' }} />
                        </div>
                     </div>
                     <div className="row mb-3 align-items-center">
                        <label className="col-sm-3 text-muted small text-uppercase fw-bold p-0">Po Date</label>
                        <div className="col-sm-9">
                           <input type="date" className="form-control border-0 border-bottom rounded-0 shadow-none px-2 bg-transparent" name="poDate" value={formData.poDate} onChange={handleInputChange} style={{ height: '42px' }} />
                        </div>
                     </div>
                     <div className="row mb-3 align-items-center">
                        <label className="col-sm-3 text-muted small text-uppercase fw-bold p-0">Dc Date</label>
                        <div className="col-sm-9">
                           <input type="date" className="form-control border-0 border-bottom rounded-0 shadow-none px-2 bg-transparent" name="dcDate" value={formData.dcDate} onChange={handleInputChange} style={{ height: '42px' }} />
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="table-responsive mb-4">
               <table className="table table-borderless align-middle">
                  <thead>
                     <tr className="text-muted border-bottom small text-uppercase">
                        <th className="py-3">Item</th>
                        <th className="py-3">Process</th>
                        <th className="py-3" style={{ width: '80px' }}>Qty</th>
                        {formData.billType === 'Both' && <th className="py-3" style={{ width: '100px' }}>Wop-Qty</th>}
                        {formData.billType !== 'Without Process' && (
                           <>
                              <th className="py-3" style={{ width: '120px' }}>Price</th>
                              <th className="py-3 text-end" style={{ width: '150px' }}>Amount</th>
                           </>
                        )}
                        <th className="py-3 text-center" style={{ width: '60px' }}></th>
                     </tr>
                  </thead>
                  <tbody>
                     {formData.items?.map((item: any, index: number) => (
                        <tr key={item.id} className="border-bottom">
                           <td className="py-3">
                              <select className="form-select border-0 bg-transparent fw-bold" value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)}>
                                 <option value="">Select Item</option>
                                 {masterItems.map(mi => <option key={mi.id} value={mi.itemName}>{mi.itemName}</option>)}
                              </select>
                           </td>
                           <td className="py-3">
                              <select className="form-select border-0 bg-transparent" value={item.process} onChange={e => handleItemChange(index, 'process', e.target.value)}>
                                 <option value="">Select Process</option>
                                 {masterProcesses.map(p => <option key={p.id} value={p.processName}>{p.processName}</option>)}
                              </select>
                           </td>
                           <td className="py-3">
                              <input type="number" className="form-control border-0 border-bottom rounded-0 bg-transparent p-1 text-center" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', parseInt(e.target.value))} />
                           </td>
                           {formData.billType === 'Both' && (
                              <td className="py-3">
                                 <input type="number" className="form-control border-0 border-bottom rounded-0 bg-transparent p-1 text-center" value={item.wopQty} onChange={e => handleItemChange(index, 'wopQty', parseInt(e.target.value))} />
                              </td>
                           )}
                           {formData.billType !== 'Without Process' && (
                              <>
                                 <td className="py-3">
                                    <input type="number" className="form-control border-0 border-bottom rounded-0 bg-transparent p-1 text-center" value={item.unitPrice} onChange={e => handleItemChange(index, 'unitPrice', parseFloat(e.target.value))} />
                                 </td>
                                 <td className="py-3 text-end fw-semibold">
                                    ₹ {(item.amount || 0).toFixed(2)}
                                 </td>
                              </>
                           )}
                           <td className="py-3 text-center">
                              <button type="button" className="btn btn-danger p-1 d-flex align-items-center justify-content-center border-0 shadow-sm" style={{ width: '32px', height: '32px' }} onClick={() => {
                                 const newItems = formData.items.filter((_: any, i: number) => i !== index);
                                 setFormData((prev: any) => ({ ...prev, items: newItems }));
                              }}>
                                 <i className="bi bi-x-lg"></i>
                              </button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
               <button type="button" className="btn btn-sm btn-link text-decoration-none mt-2" onClick={() => {
                  setFormData((prev: any) => ({
                     ...prev,
                     items: [...(prev.items || []), { id: Date.now().toString(), description: '', process: '', quantity: 1, wopQty: 0, unitPrice: 0, tax: 0, amount: 0, total: 0 }]
                  }));
               }}>+ Add Item</button>
            </div>

            {formData.billType !== 'Without Process' && (
               <div className="row justify-content-end mt-4">
                  <div className="col-md-4">
                     <div className="row mb-3 align-items-center">
                        <div className="col-7 text-muted fw-bold small text-uppercase">Sub Total</div>
                        <div className="col-5 d-flex justify-content-end align-items-center gap-2 text-dark fw-bold">
                           <span className="small">₹</span>
                           <span className="text-end" style={{ width: '80px' }}>{formData.subTotal?.toFixed(2)}</span>
                        </div>
                     </div>
                     <div className="row mb-3 align-items-center">
                        <div className="col-7 text-muted fw-bold small text-uppercase">(-) Discount</div>
                        <div className="col-5">
                           <div className="d-flex align-items-center justify-content-end gap-2 border-bottom border-secondary border-opacity-25 pb-1">
                              <span className="text-dark fw-bold small">₹</span>
                              <input
                                 type="number"
                                 step="0.01"
                                 className="border-0 bg-transparent text-end fw-bold text-dark p-0 no-spinner"
                                 style={{ width: '80px', outline: 'none' }}
                                 value={formData.discount || '0.00'}
                                 onChange={e => setFormData((prev: any) => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                              />
                           </div>
                        </div>
                     </div>
                     <div className="row mb-3 align-items-center">
                        <div className="col-7 text-muted fw-bold small text-uppercase">(+) Other Charges</div>
                        <div className="col-5">
                           <div className="d-flex align-items-center justify-content-end gap-2 border-bottom border-secondary border-opacity-25 pb-1">
                              <span className="text-dark fw-bold small">₹</span>
                              <input
                                 type="number"
                                 step="0.01"
                                 className="border-0 bg-transparent text-end fw-bold text-dark p-0 no-spinner"
                                 style={{ width: '80px', outline: 'none' }}
                                 value={formData.otherCharges || '0.00'}
                                 onChange={e => setFormData((prev: any) => ({ ...prev, otherCharges: parseFloat(e.target.value) || 0 }))}
                              />
                           </div>
                        </div>
                     </div>
                     <div className="row mb-4 align-items-center pb-2 border-bottom">
                        <div className="col-7 text-muted fw-bold small text-uppercase d-flex align-items-center gap-2">
                           <span>(+) IGST</span>
                           <div className="d-flex align-items-center bg-light px-2 py-1 rounded shadow-inner" style={{ width: '70px' }}>
                              <input
                                 type="number"
                                 className="border-0 bg-transparent text-center fw-bold no-spinner p-0"
                                 style={{ width: '30px', fontSize: '0.75rem', outline: 'none' }}
                                 value={formData.taxRate ?? 12}
                                 onChange={e => setFormData((prev: any) => ({ ...prev, taxRate: parseInt(e.target.value) || 0 }))}
                              />
                              <span className="small text-muted fw-bold">%</span>
                           </div>
                        </div>
                        <div className="col-5 d-flex justify-content-end align-items-center gap-2 text-dark fw-bold">
                           <span className="small">₹</span>
                           <span className="text-end" style={{ width: '80px' }}>{formData.taxTotal?.toFixed(2)}</span>
                        </div>
                     </div>
                     <div className="pt-3 row align-items-center">
                        <div className="col-7 h5 fw-black text-uppercase mb-0">Grand Total</div>
                        <div className="col-5 d-flex justify-content-end align-items-center gap-2 h4 fw-black text-danger mb-0">
                           <span className="h5 mb-0">₹</span>
                           <span className="text-end" style={{ width: '80px' }}>{formData.grandTotal?.toFixed(2)}</span>
                        </div>
                     </div>
                     <style jsx>{`
                        .no-spinner::-webkit-inner-spin-button, 
                        .no-spinner::-webkit-outer-spin-button { 
                           -webkit-appearance: none; 
                           margin: 0; 
                        }
                        .no-spinner {
                           -moz-appearance: textfield;
                        }
                     `}</style>
                  </div>
               </div>
            )}

            <div className="mt-5 pt-4 text-center">
               <button type="submit" className="btn btn-success px-5 py-2 fw-bold text-uppercase me-2" onClick={() => {
                  const submitData = { ...formData, id: mode === 'edit' ? initialData?.id : undefined };
                  const action = mode === 'create' ? addInvoice(submitData) : updateInvoice(submitData);

                  (dispatch as any)(action).then(() => {
                     if (company?.id) {
                        (dispatch as any)(fetchInwards(company.id));
                     }
                  });
                  setModal({ isOpen: true, type: 'success', title: 'Success', message: `Invoice ${mode === 'create' ? 'submitted' : 'updated'} successfully!` });
               }}>Submit</button>
               <button type="button" className="btn btn-danger px-5 py-2 fw-bold text-uppercase">Reset</button>
            </div>
         </form>
      </div>
   </div>

         <StatusModal
            isOpen={modal.isOpen}
            onClose={() => {
               setModal(prev => ({ ...prev, isOpen: false }));
               if (modal.type === 'success') {
                  const tab = searchParams.get('tab');
                  router.push(`/invoices${tab ? '?tab=' + tab : ''}`);
               }
            }}
            type={modal.type}
            title={modal.title}
            message={modal.message}
         />
      </>
   );
};

export default InvoiceForm;
