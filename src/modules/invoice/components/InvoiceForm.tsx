'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter, useSearchParams } from 'next/navigation';
import { RootState } from '@/redux/store';
import api from '@/lib/axios';
import { addInvoice, updateInvoice } from '@/redux/features/invoiceSlice';
import { fetchItems, fetchProcesses, fetchPriceFixings, updatePriceFixingThunk, createPriceFixingThunk } from '@/redux/features/masterSlice';
import { fetchInwards } from '@/redux/features/inwardSlice';
import { fetchCustomers } from '@/redux/features/customerSlice';
import { fetchVendors } from '@/redux/features/vendorSlice';
import { Invoice } from '@/types/modules';
import BackButton from '@/components/BackButton';
import FullPageStatus from '@/components/FullPageStatus';
import SearchableSelect from '@/components/shared/SearchableSelect';
import PageModeIndicator from '@/components/PageModeIndicator';


interface InvoiceFormProps {
   initialData?: Invoice;
   mode: 'create' | 'edit';
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ initialData, mode }) => {
   const dispatch = useDispatch();
   const router = useRouter();
   const searchParams = useSearchParams();
   const inwardId = searchParams.get('inwardId');

   const { company, token: authToken } = useSelector((state: RootState) => state.auth);
   const { items: customers, loading: customersLoading } = useSelector((state: RootState) => state.customers);
   const { items: vendors, loading: vendorsLoading } = useSelector((state: RootState) => state.vendors);
   const { items: inwards, loading: inwardsLoading } = useSelector((state: RootState) => state.inward);
   const { settings } = useSelector((state: RootState) => state.invoices);
   const { items: masterItems, processes: masterProcesses, priceFixings, loading: masterLoading } = useSelector((state: RootState) => state.master);

   const typeParam = searchParams.get('type');
   const defaultBillType = typeParam === 'wp' ? 'With Process' : typeParam === 'wop' ? 'Without Process' : typeParam === 'both' ? 'Both' : 'With Process';

   const [formData, setFormData] = useState<any>({
      invoiceNumber: settings.nextInvoice || '',
      challanNumber: settings.nextChallan || '',
      customerId: '',
      customerName: '',
      company_id: company?.id || '',
      date: new Date().toISOString().split('T')[0],
      dueDate: '', // Manual due date entry
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
      taxRate: 18,
      grandTotal: 0,
      paidAmount: 0,
      notes: '',
   });

   const [pendingInwards, setPendingInwards] = useState<any[]>([]);
   const [inwardLoading, setInwardLoading] = useState(false);

   const [selectionMode, setSelectionMode] = useState<'CUSTOMER' | 'GSTN'>('CUSTOMER');


   const [gstLoading, setGstLoading] = useState(false);
   const [gstError, setGstError] = useState<string | null>(null);

   const [modal, setModal] = useState<{ isOpen: boolean; type: 'success' | 'error'; title: string; message: string }>({
      isOpen: false,
      type: 'success',
      title: '',
      message: ''
   });

   const [loading, setLoading] = useState(false);

   const [isComponentMounted, setIsComponentMounted] = useState(false);
   const [sequenceLoading, setSequenceLoading] = useState(false);
   const [inwardInitLoading, setInwardInitLoading] = useState(!!inwardId);



   useEffect(() => {
      if (company?.id) {
         (dispatch as any)(fetchItems({ company_id: company.id, limit: 1000 }));
         (dispatch as any)(fetchProcesses({ company_id: company.id, limit: 1000 }));
         (dispatch as any)(fetchPriceFixings({ company_id: company.id, limit: 1000 }));
         (dispatch as any)(fetchCustomers({ company_id: company.id, limit: 1000 }));
         (dispatch as any)(fetchVendors({ company_id: company.id, limit: 1000 }));

         if (mode === 'create') {
            (dispatch as any)(fetchInwards({ company_id: company.id, status: 'all', limit: 1000 }));
            setSequenceLoading(true);
            import('@/redux/features/invoiceSlice').then(async ({ fetchNextNumbers }) => {
               try {
                  const data = await (dispatch as any)(fetchNextNumbers({ companyId: company.id })).unwrap();
                  setFormData((prev: any) => ({
                     ...prev,
                     invoiceNumber: prev.invoiceNumber || String(data.nextInvoice || data.nextInvoiceNo || '').padStart(4, '0'),
                     challanNumber: prev.challanNumber || String(data.nextChallan || data.nextDeliveryNo || '').padStart(4, '0')
                  }));
               } catch (err) {
                  // console.error('Failed to pre-fetch next sequence numbers:', err);
               } finally {
                  setSequenceLoading(false);
               }
            });
         }
      } else {
         (dispatch as any)(fetchCustomers({}));
      }
      setIsComponentMounted(true);
   }, [dispatch, company?.id, mode]);

   useEffect(() => {
      if (company?.id && !formData.company_id) {
         setFormData((prev: any) => ({ ...prev, company_id: company.id }));
      }
   }, [company?.id, formData.company_id]);

   const findPrice = (compId: string, custId: string, itemName: string, procName: string) => {
      if (!custId || !itemName) return null;

      const pf = priceFixings.find(pf => {
         const matchCust = String(pf.customerId) === String(custId);
         const matchItem = String(pf.itemName).toLowerCase() === String(itemName).toLowerCase();
         const matchProc = !procName || String(pf.processName).toLowerCase() === String(procName).toLowerCase();

         return matchCust && matchItem && (procName ? matchProc : true);
      });

      return pf || null;
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
            challanNumber: initialData.challanNumber || (initialData as any).delivery_no || (initialData as any).challanNumber || '',
            otherCharges: initialData.otherCharges || (initialData as any).other_charges || 0,
            taxRate: initialData.taxRate || (initialData as any).tax_rate || 12,
            discount: initialData.discount || 0,
         };
         setFormData(mappedData);
      }
   }, [initialData]);

   const populateFromInward = (inward: any) => {
      const partyId = inward.customerId || inward.customer_id || inward.vendorId || (inward as any).vendor_id;
      const isVendor = !!(inward.vendorId || (inward as any).vendor_id || inward.partyType === 'vendor' || (inward as any).party_type === 'vendor');
      
      const party = isVendor 
         ? vendors.find(v => String(v.id) === String(partyId))
         : customers.find(c => String(c.id) === String(partyId));

      const formattedAddress = isVendor 
         ? [(party as any)?.address, (party as any)?.city, (party as any)?.state].filter(Boolean).join(', ')
         : [(party as any)?.street1, (party as any)?.city, (party as any)?.state].filter(Boolean).join(', ');

      const formatToDateInput = (d: any) => {
         if (!d) return '';
         try {
            return new Date(d).toISOString().split('T')[0];
         } catch (e) { return ''; }
      };

      setFormData((prev: any) => {
         try {
            const pDate = formatToDateInput(inward.po_date || inward.poDate);
            const dDate = formatToDateInput(inward.dc_date || inward.dcDate);

            return {
               ...prev,
               customerId: partyId || prev.customerId,
               customerName: inward.customerName || inward.customer_name || inward.vendorName || (inward as any).vendor_name || party?.name || (party as any)?.company || prev.customerName,
               address: inward.address || formattedAddress || prev.address,
               poNo: inward.po_reference || inward.poReference || '',
               po_no: inward.po_reference || inward.poReference || '',
               poDate: pDate,
               po_date: pDate,
               dcNo: inward.dc_no || inward.dcNo || '',
               dc_no: inward.dc_no || inward.dcNo || '',
               dcDate: dDate,
               dc_date: dDate,
               gstin: (inward as any).gstin || party?.gst || (party as any)?.gstin || prev.gstin,
               state: (inward as any).state || party?.state || prev.state,
               inwardId: inward.id,
               items: (inward.items || []).map((item: any, idx: number) => {
                  const pf = findPrice(
                     prev.company_id,
                     inward.customerId || inward.customer_id || prev.customerId,
                     item.item_name || item.description || '',
                     item.process || ''
                  ) as any;

                  const unitPrice = pf ? pf.price : 0;
                  const qty = item.vendorWorkBalance ?? item.billingBalance ?? item.remainingQty ?? item.quantity ?? 0;
                  const amount = qty * unitPrice;
                  const tax = amount * (prev.taxRate / 100);

                  return {
                     id: idx.toString(),
                     description: item.item_name || item.description || '',
                     process: item.process || '',
                     quantity: qty,
                     wopQty: 0,
                     unitPrice: unitPrice,
                     priceFixingId: pf ? pf.id : undefined,
                     amount: amount,
                     tax: tax,
                     total: amount + tax
                  };
               })
            };
         } catch (err) {
            return prev;
         }
      });
   };

   const fetchPendingForCustomer = async (custId: string) => {
      if (!custId) {
         setPendingInwards([]);
         return;
      }

      setInwardLoading(true);
      const activeToken = authToken || localStorage.getItem('token');
      if (activeToken) {
         try {
            const res = await fetch(`/api/inward/pending/${custId}`, {
               headers: {
                  'Authorization': `Bearer ${activeToken.replace(/^"|"$/g, '')}`
               }
            });
            const data = await res.json();
            setPendingInwards(Array.isArray(data) ? data : []);
         } catch (err) {
         } finally {
            setInwardLoading(false);
         }
      } else {
         setInwardLoading(false);
      }
   };

   useEffect(() => {
      if (inwardId && inwards.length > 0 && customers.length > 0) {
         const inward = inwards.find(i => i.id === inwardId);
         if (inward) {
            populateFromInward(inward);
            fetchPendingForCustomer((inward as any).customerId || (inward as any).customer_id || '')
               .then(() => setInwardInitLoading(false))
               .catch(() => setInwardInitLoading(false));
         } else {
            setInwardInitLoading(false);
         }
      } else if (!inwardId) {
         setInwardInitLoading(false);
      }
   }, [inwardId, inwards, priceFixings, customers]);

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

   // Recalculate items when billType or taxRate changes
   useEffect(() => {
      if (formData.items.length > 0) {
         const updatedItems = formData.items.map((item: any) => {
            const taxableQty = (item.quantity || 0);
            
            const amount = taxableQty * (item.unitPrice || 0);
            const tax = amount * (formData.taxRate / 100);
            return {
               ...item,
               amount,
               tax,
               total: amount + tax
            };
         });
         
         const hasChanged = JSON.stringify(updatedItems) !== JSON.stringify(formData.items);
         if (hasChanged) {
            setFormData((prev: any) => ({ ...prev, items: updatedItems }));
         }
      }
   }, [formData.billType, formData.taxRate]);

   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      if (name === 'customerId') {
         const customer = customers.find(c => c.id === value);
         const vendor = vendors.find(v => v.id === value);
         const entity = customer || vendor;

         setFormData((prev: any) => ({
            ...prev,
            [name]: value,
            customerName: entity?.name || (entity as any)?.company || '',
            address: (entity as any)?.address || (entity as any)?.street1 || '',
            gstin: entity?.gst || (entity as any)?.gstin || '',
            state: entity?.state || '',
            inwardId: undefined
         }));

         fetchPendingForCustomer(value);
      } else {
         let updates: any = { [name]: value };
         if (name === 'poNo') updates.po_no = value;
         if (name === 'dcNo') updates.dc_no = value;
         if (name === 'poDate') updates.po_date = value;
         if (name === 'dcDate') updates.dc_date = value;

         setFormData((prev: any) => ({ ...prev, ...updates }));
      }
   };

   const handleSearchByReference = async (query: string) => {
      if (!query || query.length < 3) return;
      
      setInwardLoading(true);
      try {
         const activeToken = authToken || localStorage.getItem('token');
         const res = await fetch(`/api/inward?search=${encodeURIComponent(query)}&status=pending&limit=10`, {
            headers: {
               'Authorization': `Bearer ${activeToken?.replace(/^"|"$/g, '')}`
            }
         });
         const data = await res.json();
         const results = data.items || [];
         
         if (results.length > 0) {
            // Find exact match first
            const exactMatch = results.find((r: any) => 
               String(r.dcNo || r.dc_no || '').toLowerCase() === query.toLowerCase() || 
               String(r.poReference || r.po_reference || '').toLowerCase() === query.toLowerCase()
            );
            
            const target = exactMatch || results[0];
            populateFromInward(target);
            fetchPendingForCustomer(target.customerId || target.customer_id || target.vendorId || (target as any).vendor_id);
         } else {
            setModal({
               isOpen: true,
               type: 'error',
               title: 'No Record Found',
               message: `No pending inward record found for reference "${query}".`
            });
         }
      } catch (err) {
         console.error('Search failed', err);
      } finally {
         setInwardLoading(false);
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
         const pf = findPrice(formData.company_id, formData.customerId, desc, proc);
         item.unitPrice = pf ? pf.price : 0;
         item.priceFixingId = pf ? pf.id : undefined;
      }

      if (field === 'quantity' || field === 'wopQty' || field === 'unitPrice' || field === 'description' || field === 'process') {
         const taxableQty = (item.quantity || 0);
            
         item.amount = taxableQty * (item.unitPrice || 0);
         item.tax = item.amount * (formData.taxRate / 100);
         item.total = item.amount + item.tax;
      }

      newItems[index] = item;
      setFormData((prev: any) => ({ ...prev, items: newItems }));
   };

   const [isDirty, setIsDirty] = useState(false);

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (loading) return;
      

      try {
         setLoading(true);

         // Clean items to remove internal UI fields (like priceFixingId) before sending to backend
         const cleanedItems = formData.items.map(({ priceFixingId, ...rest }: any) => rest);
         const submissionData = { ...formData, items: cleanedItems };

         if (mode === 'create') {
            const result = await (dispatch as any)(addInvoice(submissionData)).unwrap();
            
             console.log("Invoice created successfully, backend handled challan consolidation.");

            // Sync Price Fixing Changes
            for (const item of formData.items) {
               if (item.unitPrice > 0) {
                  try {
                     if (item.priceFixingId) {
                        // UPDATE EXISTING
                        const masterPf = priceFixings.find(pf => String(pf.id) === String(item.priceFixingId));
                        if (masterPf && Number(masterPf.price) !== Number(item.unitPrice)) {
                           await (dispatch as any)(updatePriceFixingThunk({ 
                              ...masterPf,
                              price: Number(item.unitPrice) 
                           })).unwrap();
                        }
                     } else {
                        // CREATE NEW IF NOT EXISTS
                        const existingPf = findPrice(formData.company_id, formData.customerId, item.description, item.process);
                        
                        if (!existingPf) {
                           const masterItem = masterItems.find(mi => String(mi.itemName).toLowerCase() === String(item.description).toLowerCase());
                           const masterProc = masterProcesses.find(mp => String(mp.processName).toLowerCase() === String(item.process).toLowerCase());
                           
                           // ONLY CREATE IF ALL DATA IS PRESENT
                           if (formData.customerId && formData.customerName && masterItem?.id) {
                              await (dispatch as any)(createPriceFixingThunk({
                                 customerId: String(formData.customerId),
                                 customerName: String(formData.customerName),
                                 itemId: String(masterItem.id),
                                 itemName: String(item.description),
                                 processId: masterProc?.id ? String(masterProc.id) : '',
                                 processName: item.process || '',
                                 price: Number(item.unitPrice),
                                 company_id: String(formData.company_id)
                              })).unwrap();
                           }
                        } else if (Number(existingPf.price) !== Number(item.unitPrice)) {
                           await (dispatch as any)(updatePriceFixingThunk({ 
                              id: existingPf.id, 
                              price: Number(item.unitPrice),
                              customerId: String(formData.customerId),
                              customerName: String(formData.customerName),
                              itemId: String(existingPf.itemId),
                              itemName: String(item.description),
                              processId: String(existingPf.processId),
                              processName: String(item.process || ''),
                              company_id: String(formData.company_id)
                           })).unwrap();
                        }
                     }
                  } catch (pfErr: any) {
                     console.error("Price fixing sync failed for item:", item.description, pfErr?.response?.data || pfErr.message || pfErr);
                  }
               }
            }

            setModal({
               isOpen: true,
               type: 'success',
               title: 'Success!',
               message: "Invoice created successfully. Consolidated Challan updated."
            });
         } else {
            await (dispatch as any)(updateInvoice({ ...submissionData, id: initialData?.id || '' })).unwrap();

            // Sync Price Fixing Changes (also for edit mode)
            for (const item of formData.items) {
               if (item.unitPrice > 0) {
                  try {
                     if (item.priceFixingId) {
                        // UPDATE EXISTING
                        const masterPf = priceFixings.find(pf => String(pf.id) === String(item.priceFixingId));
                        if (masterPf && Number(masterPf.price) !== Number(item.unitPrice)) {
                           await (dispatch as any)(updatePriceFixingThunk({ 
                              ...masterPf,
                              price: Number(item.unitPrice) 
                           })).unwrap();
                        }
                     } else {
                        // CREATE NEW IF NOT EXISTS
                        const existingPf = findPrice(formData.company_id, formData.customerId, item.description, item.process);
                        
                        if (!existingPf) {
                           const masterItem = masterItems.find(mi => String(mi.itemName).toLowerCase() === String(item.description).toLowerCase());
                           const masterProc = masterProcesses.find(mp => String(mp.processName).toLowerCase() === String(item.process).toLowerCase());
                           
                           // ONLY CREATE IF ALL DATA IS PRESENT
                           if (formData.customerId && formData.customerName && masterItem?.id) {
                              await (dispatch as any)(createPriceFixingThunk({
                                 customerId: String(formData.customerId),
                                 customerName: String(formData.customerName),
                                 itemId: String(masterItem.id),
                                 itemName: String(item.description),
                                 processId: masterProc?.id ? String(masterProc.id) : '',
                                 processName: item.process || '',
                                 price: Number(item.unitPrice),
                                 company_id: String(formData.company_id)
                              })).unwrap();
                           }
                        } else if (Number(existingPf.price) !== Number(item.unitPrice)) {
                           await (dispatch as any)(updatePriceFixingThunk({ 
                              id: existingPf.id, 
                              price: Number(item.unitPrice),
                              customerId: String(formData.customerId),
                              customerName: String(formData.customerName),
                              itemId: String(existingPf.itemId),
                              itemName: String(item.description),
                              processId: String(existingPf.processId),
                              processName: String(item.process || ''),
                              company_id: String(formData.company_id)
                           })).unwrap();
                        }
                     }
                  } catch (pfErr: any) {
                     console.error("Price fixing sync failed for item in edit mode:", item.description, pfErr?.response?.data || pfErr.message || pfErr);
                  }
               }
            }

            setModal({
               isOpen: true,
               type: 'success',
               title: 'Success!',
               message: "Invoice updated successfully."
            });
         }

      } catch (error: any) {
         setModal({
            isOpen: true,
            type: 'error',
            title: 'Error',
            message: error.message || 'Something went wrong.'
         });
      } finally {
         setLoading(false);
      }
   };



   const memoizedItemOptions = React.useMemo(() => {
      return (masterItems || []).map(mi => ({
         value: mi.itemName,
         label: mi.itemName
      }));
   }, [masterItems]);

   const memoizedProcessOptions = React.useMemo(() => {
      return (masterProcesses || []).map(p => ({
         value: p.processName,
         label: p.processName
      }));
   }, [masterProcesses]);

   const isPageLoading = !isComponentMounted || 
                         customersLoading || 
                         vendorsLoading ||
                         masterLoading || 
                         sequenceLoading || 
                         inwardInitLoading;

   if (isPageLoading) {
      return (
         <div className="d-flex flex-column align-items-center justify-content-center py-5 my-5" style={{ minHeight: '400px', gap: '1.5rem' }}>
            <div className="spinner-border text-primary" role="status" style={{ width: '3.5rem', height: '3.5rem', borderWidth: '4px' }}>
               <span className="visually-hidden">Loading...</span>
            </div>
            <div className="text-center">
               <h4 className="fw-bold text-dark mb-1">Loading Data...</h4>
               <p className="text-muted small mb-0">Please wait while we prepare your invoice form.</p>
            </div>
         </div>
      );
   }

   return (

      <>
         <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
            <div className="card-body p-4 p-lg-5">
               <form onSubmit={handleSubmit}>
                  <div className="d-flex align-items-center justify-content-between mb-5 pb-2 gap-4 flex-wrap">
                     <div className="d-flex align-items-center">
                        <BackButton
                           onClick={() => {
                              const tab = searchParams.get('tab');
                              if (tab) {
                                 router.push(`/invoices?tab=${tab}`);
                              } else {
                                 router.back();
                              }
                           }}
                           title="Back to Invoices"
                        />
                        <h3 className="fw-bold mb-0 text-dark">{mode === 'create' ? 'Create New Invoice' : 'Edit Invoice'}</h3>
                     </div>

                      {mode === 'create' && !inwardId && (
                         <div className="d-flex align-items-center gap-3 ms-auto">
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
                         </div>
                      )}
                  </div>

                  {mode === 'create' && (
                     <div className="d-flex align-items-center mb-5 pb-4 border-bottom gap-4">
                        <div className="d-flex align-items-center">
                           <h5 className="text-danger fw-bold mb-0 me-4" style={{ whiteSpace: 'nowrap' }}>Select the Bill Type</h5>
                           <div style={{ width: '220px' }}>
                              <select
                                 className="form-select py-2 fw-bold"
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

                        <div className="d-flex align-items-center gap-2"
                           style={{
                              border: formData.customerId ? (pendingInwards.length > 0 ? '1px solid #f97316' : '1px solid #dee2e6') : '1px solid #dee2e6',
                              borderRadius: '8px',
                              padding: '6px 14px',
                              minWidth: '280px',
                              background: formData.customerId && pendingInwards.length > 0 ? '#fff' : '#f8f9fa',
                              opacity: formData.customerId ? 1 : 0.6
                           }}
                        >
                           <i className="bi bi-box-seam" style={{ fontSize: '15px', color: formData.customerId && pendingInwards.length > 0 ? '#f97316' : '#6c757d' }}></i>
                           <select
                              className="border-0 bg-transparent fw-bold"
                              style={{ outline: 'none', fontSize: '13px', color: '#212529', flex: 1, cursor: formData.customerId ? 'pointer' : 'not-allowed' }}
                              onChange={(e) => {
                                 const selected = pendingInwards.find(i => i.id === e.target.value);
                                 if (selected) populateFromInward(selected);
                              }}
                              value={formData.inwardId || ''}
                              disabled={!formData.customerId || pendingInwards.length === 0}
                           >
                              {!formData.customerId ? (
                                 <option value="">Select customer first...</option>
                              ) : pendingInwards.length === 0 ? (
                                 <option value="">No pending records found</option>
                              ) : (
                                 <>
                                    <option value="">Select Inward Reference</option>
                                    {pendingInwards.map(i => (
                                       <option key={i.id} value={i.id}>
                                          #{i.inward_no} - {i.po_reference || 'No PO'} ({i.items.reduce((s: number, it: any) => s + ((it.vendorWorkBalance ?? it.billingBalance) || 0), 0)} billable)
                                       </option>
                                    ))}
                                 </>
                              )}
                           </select>
                           {inwardLoading && <span className="spinner-border spinner-border-sm text-orange"></span>}
                        </div>
                     </div>
                  )}

                  <div className="">
                     <div className="row g-4">
                        <div className="col-md-6">
                           <div className="row mb-3 align-items-center">
                              <label className="col-sm-3 text-muted x-small text-uppercase fw-bold p-0">Customer</label>
                              <div className="col-sm-9">
                                 {selectionMode === 'CUSTOMER' ? (
                                    <SearchableSelect
                                       options={[
                                          ...customers.map(c => ({ value: c.id, label: `${c.company || c.name}` })),
                                          ...vendors.map(v => ({ value: v.id, label: `${v.name}` }))
                                       ]}
                                       value={formData.customerId}
                                       onChange={(val) => handleInputChange({ target: { name: 'customerId', value: val } } as any)}
                                       placeholder={customersLoading || vendorsLoading ? 'Loading...' : 'Select Customer/Vendor'}
                                       disabled={customersLoading || vendorsLoading || !!inwardId}
                                       className="w-100"
                                    />
                                  ) : (
                                    <div className="input-group input-group-sm border rounded overflow-hidden">
                                       <span className="input-group-text border-0 bg-transparent ps-3"><i className="bi bi-hash text-muted"></i></span>
                                       <input
                                          type="text"
                                          className="form-control border-0 shadow-none py-2 text-uppercase fw-bold"
                                          placeholder="Enter GSTIN for lookup"
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
                                          disabled={!!inwardId}
                                       />
                                       {gstLoading && <div className="input-group-text border-0 bg-transparent pe-3"><span className="spinner-border spinner-border-sm text-primary"></span></div>}
                                    </div>
                                  )}

                              </div>
                           </div>
                           <div className="row mb-3 align-items-center">
                              <label className="col-sm-3 text-muted x-small text-uppercase fw-bold p-0">Address</label>
                              <div className="col-sm-9">
                                 <input
                                    type="text"
                                    className="form-control bg-transparent shadow-none px-2"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    placeholder="Physical address..."
                                    style={{ height: '38px', fontSize: '0.85rem' }}
                                 />
                              </div>
                           </div>
                        </div>

                        <div className="col-md-6">
                           <div className="row mb-3 align-items-center">
                              <label className="col-sm-3 text-muted x-small text-uppercase fw-bold p-0">GSTIN</label>
                              <div className="col-sm-9">
                                 <input
                                    type="text"
                                    className="form-control bg-transparent text-uppercase fw-bold shadow-none px-2"
                                    name="gstin"
                                    placeholder="GSTIN"
                                    value={formData.gstin}
                                    onChange={handleInputChange}
                                    style={{ height: '38px', fontSize: '0.85rem' }}
                                 />
                                 {gstError && <div className="text-danger small mt-1">{gstError}</div>}
                              </div>
                           </div>
                           <div className="row mb-3 align-items-center">
                              <label className="col-sm-3 text-muted x-small text-uppercase fw-bold p-0">State</label>
                              <div className="col-sm-9">
                                 <input
                                    type="text"
                                    className="form-control bg-transparent fw-bold shadow-none px-2"
                                    name="state"
                                    placeholder="e.g. KARNATAKA"
                                    value={formData.state}
                                    onChange={handleInputChange}
                                    style={{ height: '38px', fontSize: '0.85rem' }}
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
                                 <label className="col-sm-3 text-muted x-small text-uppercase fw-bold p-0">Delivery Challan</label>
                                 <div className="col-sm-9">
                                    <input type="text" className="form-control px-2 shadow-none" name="challanNumber" value={formData.challanNumber} onChange={handleInputChange} disabled={mode === 'edit'} style={mode === 'edit' ? { backgroundColor: '#f4f4f4', cursor: 'not-allowed', height: '38px', fontSize: '0.85rem' } : { height: '38px', fontSize: '0.85rem' }} />
                                 </div>
                              </div>
                           ) : (
                              <>
                                 <div className="row mb-3 align-items-center">
                                    <label className="col-sm-3 text-muted x-small text-uppercase fw-bold p-0">Invoice No</label>
                                    <div className="col-sm-9">
                                       <input type="text" className="form-control px-2 fw-bold shadow-none" name="invoiceNumber" value={formData.invoiceNumber} onChange={handleInputChange} disabled={mode === 'edit'} style={mode === 'edit' ? { backgroundColor: '#f4f4f4', cursor: 'not-allowed', height: '38px', fontSize: '0.85rem' } : { height: '38px', fontSize: '0.85rem' }} />
                                    </div>
                                 </div>
                                 {formData.billType === 'Both' && (
                                    <div className="row mb-3 align-items-center">
                                       <label className="col-sm-3 text-muted x-small text-uppercase fw-bold p-0">Delivery Challan</label>
                                       <div className="col-sm-9">
                                          <input type="text" className="form-control px-2 shadow-none" name="challanNumber" value={formData.challanNumber} onChange={handleInputChange} disabled={mode === 'edit'} style={mode === 'edit' ? { backgroundColor: '#f4f4f4', cursor: 'not-allowed', height: '38px', fontSize: '0.85rem' } : { height: '38px', fontSize: '0.85rem' }} />
                                       </div>
                                    </div>
                                 )}
                              </>
                           )}
                           <div className="row mb-3 align-items-center">
                              <label className="col-sm-3 text-muted x-small text-uppercase fw-bold p-0">Po No</label>
                              <div className="col-sm-9">
                                     <input 
                                        type="text" 
                                        className="form-control shadow-none px-2" 
                                        name="poNo" 
                                        value={formData.poNo} 
                                        onChange={handleInputChange} 
                                        onKeyDown={(e) => {
                                           if (e.key === 'Enter') {
                                              e.preventDefault();
                                              handleSearchByReference(formData.poNo);
                                           }
                                        }}
                                        placeholder="Type PO No" 
                                        style={{ height: '38px', fontSize: '0.85rem' }} 
                                        
                                     />

                              </div>
                           </div>
                           <div className="row mb-3 align-items-center">
                              <label className="col-sm-3 text-muted x-small text-uppercase fw-bold p-0">Dc No</label>
                              <div className="col-sm-9">
                                     <input 
                                        type="text" 
                                        className="form-control shadow-none px-2" 
                                        name="dcNo" 
                                        value={formData.dcNo} 
                                        onChange={handleInputChange} 
                                        onKeyDown={(e) => {
                                           if (e.key === 'Enter') {
                                              e.preventDefault();
                                              handleSearchByReference(formData.dcNo);
                                           }
                                        }}
                                        placeholder="Type DC No" 
                                        style={{ height: '38px', fontSize: '0.85rem' }} 
                                        
                                     />

                              </div>
                           </div>
                        </div>

                        <div className="col-md-6">
                           <div className="row mb-3 align-items-center">
                              <label className="col-sm-3 text-muted x-small text-uppercase fw-bold p-0">Date</label>
                              <div className="col-sm-9">
                                 <input type="date" className="form-control shadow-none px-2 bg-transparent" name="date" value={formData.date} onChange={handleInputChange} style={{ height: '38px', fontSize: '0.85rem' }} />
                              </div>
                           </div>
                           <div className="row mb-3 align-items-center">
                              <label className="col-sm-3 text-muted x-small text-uppercase fw-bold p-0">Po Date</label>
                              <div className="col-sm-9">
                                 <input type="date" className="form-control shadow-none px-2 bg-transparent" name="poDate" value={formData.poDate} onChange={handleInputChange} style={{ height: '38px', fontSize: '0.85rem' }} />
                              </div>
                           </div>
                           <div className="row mb-3 align-items-center">
                              <label className="col-sm-3 text-muted x-small text-uppercase fw-bold p-0">Dc Date</label>
                              <div className="col-sm-9">
                                 <input type="date" className="form-control shadow-none px-2 bg-transparent" name="dcDate" value={formData.dcDate} onChange={handleInputChange} style={{ height: '38px', fontSize: '0.85rem' }} />
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
                                     <SearchableSelect
                                        options={[
                                           ...memoizedItemOptions,
                                           ...(item.description && !masterItems.some(mi => mi.itemName === item.description) 
                                              ? [{ value: item.description, label: `${item.description} (Legacy)` }] 
                                              : [])
                                        ]}
                                        value={item.description}
                                        onChange={val => handleItemChange(index, 'description', val)}
                                        placeholder="Select Item"
                                     />
                                  </td>
                                  <td className="py-3">
                                     <SearchableSelect
                                        options={[
                                           ...memoizedProcessOptions,
                                           ...(item.process && !masterProcesses.some(mp => mp.processName === item.process) 
                                              ? [{ value: item.process, label: `${item.process} (Legacy)` }] 
                                              : [])
                                        ]}
                                        value={String(item.process || '')}
                                        onChange={val => handleItemChange(index, 'process', val)}
                                        placeholder="Select Process"
                                     />
                                  </td>
                                  <td className="py-3">
                                     <input type="number" className="form-control bg-transparent p-1 text-center" style={{ width: '60px' }} value={item.quantity} onWheel={(e) => (e.target as HTMLInputElement).blur()} onChange={e => handleItemChange(index, 'quantity', e.target.value)} />
                                  </td>
                                  {formData.billType === 'Both' && (
                                     <td className="py-3">
                                        <input type="number" className="form-control bg-transparent p-1 text-center" style={{ width: '85px' }} value={item.wopQty} onWheel={(e) => (e.target as HTMLInputElement).blur()} onChange={e => handleItemChange(index, 'wopQty', e.target.value)} />
                                     </td>
                                  )}
                                  {formData.billType !== 'Without Process' && (
                                     <>
                                        <td className="py-3">
                                           <input type="number" className="form-control bg-transparent p-1 text-end" value={item.unitPrice} onWheel={(e) => (e.target as HTMLInputElement).blur()} onChange={e => handleItemChange(index, 'unitPrice', e.target.value)} />
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
                      <div className="col-lg-5 ms-auto">
                         <div className="mt-4 pt-4 border-top">
                           <div className="d-flex align-items-center justify-content-between mb-4 pb-2" style={{ borderBottom: '1px dashed #dee2e6' }}>
                              <h6 className="text-muted fw-bold small text-uppercase mb-0">Sub Total</h6>
                              <div className="d-flex align-items-center gap-2 text-dark fs-5 fw-bold">
                                 <span>₹</span>
                                 <span>{formData.subTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                              </div>
                           </div>
                           <div className="d-flex align-items-center justify-content-between mb-4 pb-2" style={{ borderBottom: '1px dashed #dee2e6' }}>
                              <h6 className="text-muted fw-bold small text-uppercase mb-0">(-) Discount</h6>
                              <div className="d-flex align-items-center justify-content-center text-dark fw-bold fs-5">
                                 <span className="me-2">₹</span>
                                 <input
                                    type="number"
                                    step="0.01"
                                    className="form-control bg-light text-end fw-bold p-1 no-spinner"
                                    style={{ width: '120px' }}
                                    value={formData.discount}
                                    placeholder="0.00"
                                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                    onChange={e => setFormData((prev: any) => ({ ...prev, discount: e.target.value }))}
                                 />
                              </div>
                           </div>

                           <div className="d-flex align-items-center justify-content-between mb-4 pb-2" style={{ borderBottom: '1px dashed #dee2e6' }}>
                              <h6 className="text-muted fw-bold small text-uppercase mb-0">(+) Other Charges</h6>
                              <div className="d-flex align-items-center justify-content-center text-dark fw-bold fs-5">
                                 <span className="me-2">₹</span>
                                 <input
                                    type="number"
                                    step="0.01"
                                    className="form-control bg-light text-end fw-bold p-1 no-spinner"
                                    style={{ width: '120px' }}
                                    value={formData.otherCharges}
                                    placeholder="0.00"
                                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                    onChange={e => setFormData((prev: any) => ({ ...prev, otherCharges: e.target.value }))}
                                 />
                              </div>
                           </div>

                           {(() => {
                              const isIntraState = (formData.state || '').toLowerCase().replace(/[^a-z]/g, '') === 'tamilnadu';
                              const taxRate = formData.taxRate || 0;
                              const taxTotal = formData.taxTotal || 0;

                              if (isIntraState) {
                                 return (
                                    <>
                                       <div className="d-flex align-items-center justify-content-between mb-3 pb-2" style={{ borderBottom: '1px dashed #dee2e6' }}>
                                          <div className="d-flex align-items-center gap-4">
                                             <h6 className="text-muted fw-bold small text-uppercase mb-0">(+) CGST</h6>
                                             <div className="d-flex align-items-center gap-1">
                                                <span className="small fw-bold">{taxRate / 2}%</span>
                                             </div>
                                          </div>
                                          <div className="d-flex align-items-center gap-2 text-dark fs-6 fw-bold">
                                             <span>₹</span>
                                             <span>{(taxTotal / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                          </div>
                                       </div>
                                       <div className="d-flex align-items-center justify-content-between mb-4 pb-2" style={{ borderBottom: '1px dashed #dee2e6' }}>
                                          <div className="d-flex align-items-center gap-4">
                                             <h6 className="text-muted fw-bold small text-uppercase mb-0">(+) SGST</h6>
                                             <div className="d-flex align-items-center gap-1">
                                                <span className="small fw-bold">{taxRate / 2}%</span>
                                             </div>
                                          </div>
                                          <div className="d-flex align-items-center gap-2 text-dark fs-6 fw-bold">
                                             <span>₹</span>
                                             <span>{(taxTotal / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                          </div>
                                       </div>
                                       <div className="d-flex align-items-center justify-content-between mb-4">
                                          <h6 className="text-muted fw-bold small text-uppercase mb-0">GST Percentage</h6>
                                          <div className="d-flex align-items-center gap-1 border-bottom pb-1" style={{ width: '80px' }}>
                                             <input
                                                type="number"
                                                className="form-control bg-light text-center fw-bold p-1 no-spinner w-100"
                                                style={{ fontSize: '14px' }}
                                                value={formData.taxRate}
                                                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                                onChange={e => setFormData((prev: any) => ({ ...prev, taxRate: e.target.value }))}
                                             />
                                             <span className="small fw-bold">%</span>
                                          </div>
                                       </div>
                                    </>
                                 );
                              } else {
                                 return (
                                    <div className="d-flex align-items-center justify-content-between mb-4 pb-2" style={{ borderBottom: '1px dashed #dee2e6' }}>
                                       <div className="d-flex align-items-center gap-4">
                                          <h6 className="text-muted fw-bold small text-uppercase mb-0">(+) IGST</h6>
                                          <div className="d-flex align-items-center gap-1 border-bottom pb-1" style={{ width: '80px' }}>
                                             <input
                                                type="number"
                                                className="form-control bg-light text-center fw-bold p-1 no-spinner w-100"
                                                style={{ fontSize: '14px' }}
                                                value={formData.taxRate}
                                                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                                onChange={e => setFormData((prev: any) => ({ ...prev, taxRate: e.target.value }))}
                                             />
                                             <span className="small fw-bold">%</span>
                                          </div>
                                       </div>
                                       <div className="d-flex align-items-center gap-2 text-dark fs-5 fw-bold">
                                          <span>₹</span>
                                          <span>{formData.taxTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                       </div>
                                    </div>
                                 );
                              }
                           })()}

                           <div className="d-flex align-items-center justify-content-between pt-3 pb-2" style={{ borderBottom: '2.5px solid #212529' }}>
                              <h4 className="fw-bold mb-0 text-dark text-uppercase small" style={{ letterSpacing: '1px' }}>Grand Total</h4>
                              <div className="d-flex align-items-center gap-2 text-danger fw-bold fs-2">
                                 <span>₹</span>
                                 <span className="text-nowrap">{formData.grandTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                              </div>
                           </div>
                        </div>
                     </div>
                  )}

                  <div className="d-flex justify-content-center gap-3 mt-5">
                     <button
                        type="submit"
                        className="btn btn-primary px-5 py-2 rounded-pill fw-bold shadow-sm d-flex align-items-center gap-2"
                        disabled={loading || !formData.invoiceNumber}
                        style={{ minWidth: '150px' }}
                     >
                        {loading ? (
                           <>
                              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                              <span>SAVING...</span>
                           </>
                        ) : !formData.invoiceNumber ? (
                           'LOADING...'
                        ) : (
                           'SUBMIT'
                        )}
                     </button>
                     <button type="button" className="btn btn-light px-5 py-2 rounded-pill fw-bold border" onClick={() => router.back()}>CANCEL</button>
                  </div>
               </form>
            </div>
         </div>

         {modal.isOpen && (
            <FullPageStatus
               type={modal.type}
               title={modal.title}
               message={modal.message}
               onClose={() => {
                  setModal(prev => ({ ...prev, isOpen: false }));
                  if (modal.type === 'success') {
                     const tab = searchParams.get('tab');
                     router.push(`/invoices?tab=${tab || 'all'}`);
                  }
               }}
            />
         )}
      </>

   );
};

export default InvoiceForm;
