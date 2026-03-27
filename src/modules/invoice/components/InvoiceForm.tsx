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

   const [formData, setFormData] = useState<any>({
      invoiceNumber: settings.nextInvoice || '',
      challanNumber: settings.nextChallan || '',
      customerId: '',
      customerName: '',
      company_id: company?.id || '',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      type: 'INVOICE',
      billType: 'With Process',
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
      grandTotal: 0,
      paidAmount: 0,
      notes: '',
   });

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

         // Fetch real-time next sequential numbers from database ONLY in create mode
         if (mode === 'create') {
            import('@/lib/axios').then(async ({ default: api }) => {
               try {
                  const { data } = await api.get(`/invoices/next-numbers?companyId=${company.id}`);
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

   // Separate effect for company ID initialization
   useEffect(() => {
      if (company?.id && !formData.company_id) {
         setFormData((prev: any) => ({ ...prev, company_id: company.id }));
      }
   }, [company?.id, formData.company_id]);

   // Helper to find fixed price with robust matching
   const findPrice = (compId: string, custId: string, itemName: string, procName: string) => {
      if (!custId || !itemName) return 0;

      // Find price fixing matching customer, item, and process
      const pf = priceFixings.find(pf => {
         const matchCust = String(pf.customerId) === String(custId);
         const matchItem = String(pf.itemName).toLowerCase() === String(itemName).toLowerCase();
         // Only match process if one is selected/expected
         const matchProc = !procName || String(pf.processName).toLowerCase() === String(procName).toLowerCase();

         return matchCust && matchItem && (procName ? matchProc : true);
      });

      return pf ? pf.price : 0;
   };

   // Sync pre-fetched sequential numbers from Redux to Form
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
         console.log('--- INVOICE EDIT: LOADED INITIAL DATA ---', initialData);
         const mappedData = {
            ...initialData,
            customerId: String(initialData.customerId || ''),
            invoiceNumber: initialData.invoiceNumber || (initialData as any).invoice_no,
            date: initialData.date || (initialData as any).invoice_date,
            billType: initialData.billType || (initialData as any).bill_type || 'With Process',
            poNo: (initialData as any).po_no || initialData.poNo || '',
            po_no: (initialData as any).po_no || initialData.poNo || '',
            dcNo: (initialData as any).dc_no || initialData.dcNo || '',
            dc_no: (initialData as any).dc_no || initialData.dcNo || '',
            poDate: initialData.poDate || (initialData as any).po_date || '',
            po_date: initialData.poDate || (initialData as any).po_date || '',
            dcDate: initialData.dcDate || (initialData as any).dc_date || '',
            dc_date: initialData.dcDate || (initialData as any).dc_date || '',
            gstin: (initialData as any).gstin || '',
            state: (initialData as any).state || '',
         };
         console.log('--- INVOICE EDIT: MAPPED FORM DATA ---', mappedData);
         setFormData(mappedData);
      } else if (inwardId && priceFixings.length > 0) {
         const inward = inwards.find(i => i.id === inwardId);
         if (inward) {
            setFormData((prev: any) => ({
               ...prev,
               customerId: inward.customerId || '',
               customerName: inward.customerName || '',
               address: inward.address || '',
               poNo: inward.poReference || '',
               po_no: inward.poReference || '',
               poDate: inward.poDate || '',
               po_date: inward.poDate || '',
               dcNo: inward.dcNo || '',
               dc_no: inward.dcNo || '',
               dcDate: inward.dcDate || '',
               dc_date: inward.dcDate || '',
               gstin: (inward as any).gstin || '',
               state: (inward as any).state || '',
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

   // Recalculate totals
   useEffect(() => {
      const subTotal = formData.items.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
      const taxTotal = formData.items.reduce((sum: number, item: any) => sum + (item.tax || 0), 0);
      const grandTotal = subTotal + taxTotal - (formData.discount || 0);

      if (formData.subTotal !== subTotal || formData.taxTotal !== taxTotal || formData.grandTotal !== grandTotal) {
         setFormData((prev: any) => ({
            ...prev,
            subTotal,
            taxTotal,
            grandTotal
         }));
      }
   }, [formData.items, formData.discount, formData.subTotal, formData.taxTotal, formData.grandTotal]);

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

   const handleGstLookup = async () => {
      if (!formData.gstin || formData.gstin.length !== 15) {
         setGstError('Enter 15-digit GSTIN');
         return;
      }

      try {
         setGstLoading(true);
         setGstError(null);
         const response = await fetch(`/api/gst-lookup?gstin=${formData.gstin.toUpperCase()}`);
         if (!response.ok) throw new Error('Lookup failed');
         const result = await response.json();
         const data = result.data;

         if (data) {
            setFormData((prev: any) => ({
               ...prev,
               customerName: data.legal_name || prev.customerName,
               address: data.address || prev.address,
               state: data.state_jurisdiction || prev.state
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
         item.tax = item.amount * 0.12;
         item.total = item.amount + item.tax;
      }

      newItems[index] = item;
      setFormData((prev: any) => ({ ...prev, items: newItems }));
   };

   return (
      <div className="container-fluid py-4 bg-white min-vh-100">
         <form onSubmit={e => e.preventDefault()}>
            <div className="d-flex align-items-center mb-5 pb-2">
               <button type="button" className="btn btn-outline-secondary border-0 p-0 me-3" onClick={() => router.back()} title="Back to Invoices">
                  <i className="bi bi-arrow-left-circle fs-3 text-muted"></i>
               </button>
               <h3 className="fw-bold mb-0 text-dark">{mode === 'create' ? 'Create New Invoice' : 'Edit Invoice'}</h3>
            </div>

            {mode === 'create' && (
               <div className="d-flex align-items-center mb-5 pb-4 border-bottom">
                  <h4 className="text-danger fw-bold mb-0 me-4">Select the Bill Type</h4>
                  <div style={{ width: '300px' }}>
                     <select
                        className="form-select border-0 border-bottom rounded-0 py-2 fs-5"
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
            <label className="col-sm-3 text-muted">Customer</label>
                        <div className="col-sm-9">
                           <select
                              className="form-select border-0 border-bottom rounded-0 bg-transparent shadow-none fw-bold"
                              name="customerId"
                              value={formData.customerId}
                              onChange={handleInputChange}
                           >
                              <option value="">{customersLoading ? 'Loading Customers...' : 'Choose Customer...'}</option>
                              {customers.map(c => (
                                 <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                           </select>
                        </div>
                     </div>
                     <div className="row mb-3 align-items-center">
            <label className="col-sm-3 text-muted">Address</label>
                        <div className="col-sm-9">
                           <input
                              type="text"
                              className="form-control border-0 border-bottom rounded-0 bg-transparent shadow-none"
                              name="address"
                              value={formData.address}
                              onChange={handleInputChange}
                              placeholder="Physical address..."
                           />
                        </div>
                     </div>
      </div>

      <div className="col-md-6">
         <div className="row mb-3 align-items-center">
            <label className="col-sm-3 text-muted">GSTIN</label>
            <div className="col-sm-9">
               <div className="d-flex align-items-center gap-2">
                  <input
                     type="text"
                     className="form-control border-0 border-bottom rounded-0 bg-transparent text-uppercase fw-bold shadow-none"
                     name="gstin"
                     placeholder="Enter GSTIN"
                     value={formData.gstin}
                     onChange={handleInputChange}
                     maxLength={15}
                  />
                  <button
                     className="btn btn-dark px-2 fw-bold rounded-1 shadow-sm d-flex align-items-center flex-shrink-0"
                     type="button"
                     onClick={handleGstLookup}
                     disabled={gstLoading}
                     style={{ height: '28px', fontSize: '0.62rem', whiteSpace: 'nowrap' }}
                  >
                     {gstLoading ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="bi bi-shield-check me-1"></i>}
                     {gstLoading ? 'WAIT' : 'VERIFY'}
                  </button>
               </div>
               {gstError && <div className="text-danger small mt-1">{gstError}</div>}
            </div>
         </div>
         <div className="row mb-3 align-items-center">
            <label className="col-sm-3 text-muted">State</label>
            <div className="col-sm-9">
               <input
                  type="text"
                  className="form-control border-0 border-bottom rounded-0 bg-transparent fw-bold shadow-none"
                  name="state"
                  placeholder="e.g. KARNATAKA"
                  value={formData.state}
                  onChange={handleInputChange}
               />
            </div>
         </div>
      </div>
   </div>
</div>

            <div className="mb-5">
               <div className="row g-4">
                  <div className="col-md-6">
                     {formData.billType === 'Without Process' ? (
                        <div className="row mb-3 align-items-center">
                           <label className="col-sm-3 text-muted">Delivery Challan</label>
                           <div className="col-sm-9">
                              <input type="text" className="form-control border-0 border-bottom rounded-0" name="challanNumber" value={formData.challanNumber} onChange={handleInputChange} />
                           </div>
                        </div>
                     ) : (
                        <>
                           <div className="row mb-3 align-items-center">
                              <label className="col-sm-3 text-muted">Invoice No</label>
                              <div className="col-sm-9">
                                 <input type="text" className="form-control border-0 border-bottom rounded-0" name="invoiceNumber" value={formData.invoiceNumber} onChange={handleInputChange} />
                              </div>
                           </div>
                           {formData.billType === 'Both' && (
                              <div className="row mb-3 align-items-center">
                                 <label className="col-sm-3 text-muted">Delivery Challan</label>
                                 <div className="col-sm-9">
                                    <input type="text" className="form-control border-0 border-bottom rounded-0" name="challanNumber" value={formData.challanNumber} onChange={handleInputChange} />
                                 </div>
                              </div>
                           )}
                        </>
                     )}
                     <div className="row mb-3 align-items-center">
                        <label className="col-sm-3 text-muted">Po No</label>
                        <div className="col-sm-9">
                           <input type="text" className="form-control border-0 border-bottom rounded-0" name="poNo" value={formData.poNo} onChange={handleInputChange} placeholder="Po No" />
                        </div>
                     </div>
                     <div className="row mb-3 align-items-center">
                        <label className="col-sm-3 text-muted">Dc No</label>
                        <div className="col-sm-9">
                           <input type="text" className="form-control border-0 border-bottom rounded-0" name="dcNo" value={formData.dcNo} onChange={handleInputChange} placeholder="Dc No" />
                        </div>
                     </div>
                  </div>

                  <div className="col-md-6">
                     
                     <div className="row mb-3 align-items-center">
                        <label className="col-sm-3 text-muted">Date</label>
                        <div className="col-sm-9">
                           <input type="date" className="form-control border-0 border-bottom rounded-0" name="date" value={formData.date} onChange={handleInputChange} />
                        </div>
                     </div>
                     <div className="row mb-3 align-items-center">
                        <label className="col-sm-3 text-muted">Po Date</label>
                        <div className="col-sm-9">
                           <input type="date" className="form-control border-0 border-bottom rounded-0" name="poDate" value={formData.poDate} onChange={handleInputChange} />
                        </div>
                     </div>
                     <div className="row mb-3 align-items-center">
                        <label className="col-sm-3 text-muted">Dc Date</label>
                        <div className="col-sm-9">
                           <input type="date" className="form-control border-0 border-bottom rounded-0" name="dcDate" value={formData.dcDate} onChange={handleInputChange} />
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
                     <div className="d-flex justify-content-between mb-3 text-muted">
                        <span>Sub Total</span>
                        <span className="text-dark">₹ {formData.subTotal?.toFixed(2)}</span>
                     </div>
                     <div className="d-flex justify-content-between mb-3 text-muted align-items-center">
                        <span>(-) Discount</span>
                        <div style={{ width: '100px' }}>
                           <input type="number" className="form-control form-control-sm border-0 border-bottom text-end rounded-0" value={formData.discount} onChange={e => setFormData((prev: any) => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))} />
                        </div>
                     </div>
                     <div className="d-flex justify-content-between mb-3 text-muted">
                        <span>(+) Other Charges</span>
                        <span className="text-dark">00.00</span>
                     </div>
                     <div className="d-flex justify-content-between mb-4 text-muted align-items-center">
                        <div className="d-flex align-items-center">
                           <span>(+) IGST</span>
                           <input type="number" className="form-control form-control-sm mx-2 border-0 border-bottom rounded-0 text-center" style={{ width: '40px' }} value={12} readOnly />
                           <span>%</span>
                        </div>
                        <span className="text-dark">₹ {formData.taxTotal?.toFixed(2)}</span>
                     </div>
                     <div className="border-top pt-3 d-flex justify-content-between align-items-center">
                        <h5 className="fw-bold mb-0">Grand Total</h5>
                        <h4 className="fw-bold mb-0">₹ {formData.grandTotal?.toFixed(2)}</h4>
                     </div>
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

         <StatusModal
            isOpen={modal.isOpen}
            onClose={() => {
               setModal(prev => ({ ...prev, isOpen: false }));
               if (modal.type === 'success') router.push('/invoices');
            }}
            type={modal.type}
            title={modal.title}
            message={modal.message}
         />
      </div>
   );
};

export default InvoiceForm;
