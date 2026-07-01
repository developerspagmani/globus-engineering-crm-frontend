'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter, useSearchParams } from 'next/navigation';
import { RootState } from '@/redux/store';
import { createVoucher, updateVoucher, fetchVouchers } from '@/redux/features/voucherSlice';
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
    customerId: '',
    vendorId: '',
    partyId: '',
    partyName: '',
    selectedInvoices: [] as { id: string, invoiceNo: string, amount: number, adjustmentType: string, adjustmentValue: number }[]
  });

  // On mount: read partyType from URL and set form state immediately (window.location is guaranteed client-side)
  // This runs BEFORE the initialData effect so correct defaults are set first
  useEffect(() => {
    if (mode !== 'create') return;
    const params = new URLSearchParams(window.location.search);
    const pt = params.get('partyType');
    const vid = params.get('vendorId');
    if (pt === 'vendor' && vid) {
      setFormData(prev => ({
        ...prev,
        partyType: 'vendor',
        type: 'payment',
        vendorId: vid,
        partyId: vid,
        customerId: ''
      }));
    }
  }, []); // empty deps = run once on mount only
 
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
      // In edit/view mode, fetch all invoices so we can match by ID or number.
      // The referenceNo is a complex formatted string, not a simple filter param.
      (dispatch as any)(fetchInvoices({ 
        company_id: activeCompany.id, 
        limit: 1000
      }));

      // Ensure customers and vendors are fetched
      (dispatch as any)(fetchCustomers({ company_id: activeCompany.id, limit: 1000 }));
      (dispatch as any)(fetchVendors({ company_id: activeCompany.id, limit: 1000 }));
      (dispatch as any)(fetchInwards({ company_id: activeCompany.id, limit: 1000 }));
    }
  }, [dispatch, activeCompany]);

  useEffect(() => {
    const customerIdFromUrl = searchParams.get('customerId');
    const vendorIdFromUrl = searchParams.get('vendorId');
    const partyTypeFromUrl = searchParams.get('partyType'); // 'customer' or 'vendor'
    const invoiceIdFromUrl = searchParams.get('invoiceId');

    if (mode === 'create') {
      setFormData(prev => {
        let updated = { ...prev };
        let hasChanges = false;

        // 1a. Resolve Vendor name (partyType=vendor in URL)
        // Guard on partyName (not vendorId) because vendorId is pre-set in initial state from URL
        if (partyTypeFromUrl === 'vendor' && vendorIdFromUrl && !updated.partyName) {
          const vendor = (vendors as any[]).find(v => String(v.id) === String(vendorIdFromUrl));
          if (vendor) {
            updated.partyType = 'vendor';
            updated.type = 'payment';
            updated.vendorId = String(vendorIdFromUrl);
            updated.partyId = String(vendorIdFromUrl);
            updated.partyName = vendor.name || (vendor as any).company || '';
            updated.customerId = '';
            hasChanges = true;
          }
        }

        // 1b. Resolve Customer
        if ((!partyTypeFromUrl || partyTypeFromUrl === 'customer') && customerIdFromUrl && !updated.customerId) {
          const customer = customers.find(c => String(c.id) === String(customerIdFromUrl));
          if (customer) {
            updated.customerId = String(customerIdFromUrl);
            updated.partyId = String(customerIdFromUrl);
            updated.partyName = customer.company || customer.name || '';
            hasChanges = true;
          }
        }

        // 2. Resolve Invoice
        if (invoiceIdFromUrl) {
          const invoice = allInvoices.find(i => String(i.id) === String(invoiceIdFromUrl));
          const existingIndex = updated.selectedInvoices.findIndex(item => String(item.id) === String(invoiceIdFromUrl));

          if (invoice) {
            const pendingAmount = Number((invoice.grandTotal - (invoice.paidAmount || 0)).toFixed(2));
            const realNo = invoice.invoiceNumber || (invoice as any).invoice_no || String(invoiceIdFromUrl);

            // If it doesn't exist, add it
            if (existingIndex === -1) {
              updated.selectedInvoices = [...updated.selectedInvoices, {
                id: String(invoice.id),
                invoiceNo: realNo,
                amount: pendingAmount,
                adjustmentType: 'TDS',
                adjustmentValue: 0
              }];
              hasChanges = true;
            } else {
              // If it exists but has 0 amount (placeholder), update the amount but PRESERVE user input for TDS
              const existing = updated.selectedInvoices[existingIndex];
              if (existing.amount === 0) {
                const newSelected = [...updated.selectedInvoices];
                newSelected[existingIndex] = {
                  ...existing,
                  invoiceNo: realNo,
                  amount: pendingAmount
                };
                updated.selectedInvoices = newSelected;
                hasChanges = true;
              }
            }
          } else if (updated.selectedInvoices.length === 0) {
            // Initial placeholder if nothing exists yet
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
    
    // Auto-expand rows in view mode to show TDS adjustments by default
    if (mode === 'view' && initialData?.items && expandedRows.size === 0) {
      const ids = initialData.items.map((it: any) => 
        String(it.id || it.invoiceNo || it.invoice_no || it.invoiceNumber || '')
      ).filter(Boolean);
      if (ids.length > 0) setExpandedRows(new Set(ids));
    }
  }, [searchParams, mode, customers, vendors, allInvoices]);

  // Secondary auto-expand: triggers once selectedInvoices are loaded asynchronously in view mode
  useEffect(() => {
    if (mode === 'view' && formData.selectedInvoices.length > 0) {
      setExpandedRows(prev => {
        if (prev.size > 0) return prev; // already expanded
        const ids = formData.selectedInvoices.map((it: any) =>
          String(it.id || it.invoiceNo || it.invoice_no || it.invoiceNumber || '')
        ).filter(Boolean);
        return ids.length > 0 ? new Set(ids) : prev;
      });
    }
  }, [mode, formData.selectedInvoices]);

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
          // Priority 1: Use structured items array if available
          if (initialData.items && Array.isArray(initialData.items) && initialData.items.length > 0) {
            return initialData.items.map((it: any) => {
              // Resolve real UUID from allInvoices to ensure all downstream matching (toggle, detail change) works
              const itNo = String(it.invoiceNo || it.invoice_no || it.id || '').replace(/^0+/, '');
              const resolvedInv = allInvoices.find((i: any) => {
                const iNo = String(i.invoiceNumber || i.invoice_no || '').replace(/^0+/, '');
                return iNo !== '' && itNo !== '' && iNo === itNo;
              });
              return {
                id: resolvedInv ? String(resolvedInv.id) : (it.id || it.invoiceNo || it.invoice_no),
                invoiceNo: it.invoiceNo || it.invoice_no || resolvedInv?.invoiceNumber || '',
                invoiceDate: it.invoiceDate || it.invoice_date || (resolvedInv as any)?.invoice_date || (resolvedInv as any)?.date || '',
                amount: Number(Number(it.amount || 0).toFixed(2)) || (resolvedInv ? Number((resolvedInv.grandTotal || 0).toFixed(2)) : 0),
                adjustmentType: it.adjustmentType || it.adjustment_type || 'TDS',
                adjustmentValue: Number(it.adjustmentValue || it.adjustment_value || 0)
              };
            });
          }

          // Priority 2: Fallback to parsing referenceNo string (Legacy support)
          if (!initialData.referenceNo) return [];
          
          const results: any[] = [];
          const regex = /([^,(\s]+)\s*(?:\(([^)|]+)(?:\|([^)]+))?\))?/g;
          let match;
          
          while ((match = regex.exec(initialData.referenceNo)) !== null) {
            const invoiceNo = match[1].trim();
            if (['₹', 'RS', 'INR'].includes(invoiceNo.toUpperCase())) continue;
            
            let amount = parseFloat((match[2] || '').replace(/[^\d.]/g, '')) || 0;
            const adjStr = match[3] || '';
            let adjValue = parseFloat(adjStr.replace(/[^\d.]/g, '')) || 0;
            let adjType = adjStr.toUpperCase().includes('OTHERS') ? 'Others' : 'TDS';
            
            const normNo = invoiceNo.replace(/^0+/, '');
            const inv = allInvoices.find(i => {
              const iNo = String(i.invoiceNumber || (i as any).invoice_no || '').replace(/^0+/, '');
              return (iNo !== '' && iNo === normNo) || 
                     String(i.invoiceNumber) === invoiceNo || 
                     String(i.id) === invoiceNo;
            });
            
            if (amount === 0 && inv) {
              const pending = inv.grandTotal - (inv.paidAmount || 0);
              amount = Number((pending > 0 ? pending : inv.grandTotal).toFixed(2));
            }
            
            results.push({ 
              id: inv?.id || invoiceNo, 
              invoiceNo: inv?.invoiceNumber || invoiceNo, 
              amount: amount,
              adjustmentType: adjType,
              adjustmentValue: adjValue
            });
          }
          
          if (results.length === 1 && results[0].amount === 0 && initialData.amount > 0) {
            results[0].amount = initialData.amount + (initialData.tdsAmount || 0) + (initialData.othersAmount || 0);
          }
          
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
      type: type === 'vendor' ? 'payment' : 'receipt',
      customerId: type === 'customer' ? id : '',
      vendorId: type === 'vendor' ? id : '',
      selectedInvoices: preservedSelectedInvoices
    }));
  };

  const toggleInvoice = (invoice: any) => {
    setFormData(prev => {
      const isSelected = prev.selectedInvoices.find(item => String(item.id) === String(invoice.id));
      let newSelected;
      
      if (isSelected) {
        newSelected = prev.selectedInvoices.filter(item => String(item.id) !== String(invoice.id));
      } else {
        newSelected = [...prev.selectedInvoices, { 
          id: String(invoice.id), 
          invoiceNo: invoice.invoiceNumber || invoice.invoice_no || '', 
          amount: Number((invoice.grandTotal - (invoice.paidAmount || 0)).toFixed(2)),
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
        if (String(item.id) === String(invoiceId)) {
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

    try {
      setIsSubmitting(true);
      const calculatedTDS = formData.selectedInvoices.reduce((s, it) => s + (it.adjustmentType === 'TDS' ? Number(it.adjustmentValue || 0) : 0), 0);
      const calculatedOthers = formData.selectedInvoices.reduce((s, it) => s + (it.adjustmentType === 'Others' ? Number(it.adjustmentValue || 0) : 0), 0);

      const voucherPayload: any = {
        voucherNo: (mode === 'edit' && initialData?.voucherNo) ? initialData.voucherNo : '',
        date: formData.date,
        type: formData.type,
        partyId: formData.partyId,
        partyName: formData.partyName,
        partyType: formData.partyType,
        amount: netPayableAmount,
        tdsAmount: calculatedTDS,
        tds_amount: calculatedTDS, // Support snake_case backend
        othersAmount: calculatedOthers,
        others_amount: calculatedOthers, // Support snake_case backend
        paymentMode: formData.paymentMode as any,
        chequeNo: formData.paymentMode === 'cash' ? '' : formData.chequeNo,
        description: `Payment for ${formData.partyType}: ${formData.selectedInvoices.map(i => `${i.invoiceNo} (₹${i.amount})`).join(', ')} (Adjust: ₹${totalAdjustmentAmount})`,
        referenceNo: formData.selectedInvoices.map(i => `${i.invoiceNo} (${i.amount}|${i.adjustmentType}:${i.adjustmentValue})`).join(', '),
        status: 'posted',
        company_id: user?.company_id || activeCompany?.id || ''
      };
      
      if (!voucherPayload.company_id && activeCompany?.id) {
        voucherPayload.company_id = activeCompany.id;
      }
      if (!voucherPayload.company_id && user?.company_id) {
        voucherPayload.company_id = user.company_id;
      }

      if (mode === 'create') {
        // Scan ALL selected invoices for an inward link — not just the first one
        // (the first invoice may have been fetched without inwardId populated)
        let inwardId: string | null = null;
        let inwardNo: string | null = null;
        for (const sel of formData.selectedInvoices) {
          const inv = allInvoices.find(i => String(i.id) === String(sel.id));
          const iid = (inv as any)?.inwardId || (inv as any)?.inward_id;
          const ino = (inv as any)?.inwardNo || (inv as any)?.inward_no;
          if (iid) { inwardId = String(iid); inwardNo = ino ? String(ino) : null; break; }
        }
        console.log('[VoucherForm] Resolved inwardId:', inwardId, 'inwardNo:', inwardNo);

        const currentPaymentItems = formData.selectedInvoices.map(i => ({
          invoiceNo: i.invoiceNo,
          amount: i.amount,
          adjustmentType: i.adjustmentType,
          adjustment_type: i.adjustmentType,
          adjustmentValue: i.adjustmentValue,
          adjustment_value: i.adjustmentValue,
          date: formData.date
        }));

        if (inwardId) {
          try {
            const activeToken = authToken || localStorage.getItem('token');
            const res = await fetch(`/api/vouchers?inward_id=${inwardId}`, {
              headers: { 'Authorization': `Bearer ${activeToken?.replace(/^"|"$/g, '')}` }
            });
            const data = await res.json();
            
            // Find the correct voucher for this specific party and type
            console.log('[VoucherForm] Existing vouchers for inward:', data.items?.map((v: any) => ({
              id: v.id, voucherNo: v.voucherNo || v.voucher_no,
              partyId: v.party_id || v.partyId, partyType: v.party_type || v.partyType, type: v.type
            })));
            console.log('[VoucherForm] Matching against:', { partyId: voucherPayload.partyId, partyType: voucherPayload.partyType, type: voucherPayload.type });

            const existingVoucher = data.items && data.items.length > 0 
              ? data.items.find((v: any) => 
                  String(v.party_id || v.partyId).trim() === String(voucherPayload.partyId).trim() && 
                  String(v.party_type || v.partyType).trim().toLowerCase() === String(voucherPayload.partyType).trim().toLowerCase() &&
                  String(v.type).trim().toLowerCase() === String(voucherPayload.type).trim().toLowerCase()
                ) 
              : null;
            
            if (existingVoucher) {
              // Append to existing
              const updatedPayload = {
                ...existingVoucher,
                party_id: existingVoucher.party_id || existingVoucher.partyId || voucherPayload.partyId,
                party_name: existingVoucher.party_name || existingVoucher.partyName || voucherPayload.partyName,
                party_type: existingVoucher.party_type || existingVoucher.partyType || voucherPayload.partyType,
                type: existingVoucher.type || voucherPayload.type,
                amount: Number(existingVoucher.amount || 0) + netPayableAmount,
                tdsAmount: Number(existingVoucher.tds_amount || existingVoucher.tdsAmount || 0) + calculatedTDS,
                tds_amount: Number(existingVoucher.tds_amount || existingVoucher.tdsAmount || 0) + calculatedTDS,
                othersAmount: Number(existingVoucher.others_amount || existingVoucher.othersAmount || 0) + calculatedOthers,
                others_amount: Number(existingVoucher.others_amount || existingVoucher.othersAmount || 0) + calculatedOthers,
                description: `${existingVoucher.description_ || existingVoucher.description || ''}\n${voucherPayload.description}`,
                reference_no: `${existingVoucher.reference_no || existingVoucher.referenceNo || ''}, ${voucherPayload.referenceNo}`,
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

              // IMPORTANT: Refresh Redux state after consolidation so TDS cards and lists update
              if (activeCompany?.id) {
                (dispatch as any)(fetchInvoices({ company_id: activeCompany.id, limit: 1000 }));
                (dispatch as any)(fetchVouchers({ company_id: activeCompany.id, limit: 1000 }));
              }
              router.push('/vouchers'); // Navigate away to show updated list
            } else {
              // Create new with inwardId (either no existing voucher, or it belongs to a different party/type)
              await (dispatch as any)(createVoucher({ 
                ...voucherPayload, 
                inward_id: inwardId, 
                inward_no: inwardNo,
                items: currentPaymentItems
              } as any)).unwrap();
              
              // Refresh state after new creation too
              if (activeCompany?.id) {
                (dispatch as any)(fetchInvoices({ company_id: activeCompany.id, limit: 1000 }));
                (dispatch as any)(fetchVouchers({ company_id: activeCompany.id, limit: 1000 }));
              }
            }
          } catch (vchErr) {
             console.error("Consolidated Voucher failed", vchErr);
             await (dispatch as any)(createVoucher({ 
               ...voucherPayload, 
               items: currentPaymentItems 
             } as any)).unwrap();
          }
        } else {
          // No inwardId on the invoice — fallback: search for existing voucher by partyId + type + date
          // to still attempt consolidation (e.g. 3rd invoice paid separately without inward link)
          try {
            const activeToken = authToken || localStorage.getItem('token');
            const fallbackRes = await fetch(
              `/api/vouchers?company_id=${voucherPayload.company_id}&partyId=${voucherPayload.partyId}&limit=50`,
              { headers: { 'Authorization': `Bearer ${activeToken?.replace(/^\"|\"$/g, '')}` } }
            );
            const fallbackData = await fallbackRes.json();
            console.log('[VoucherForm] Fallback voucher search (no inwardId):', fallbackData.items?.length, 'vouchers for party');

            const fallbackVoucher = fallbackData.items && fallbackData.items.length > 0
              ? fallbackData.items.find((v: any) =>
                  String(v.party_id || v.partyId).trim() === String(voucherPayload.partyId).trim() &&
                  String(v.party_type || v.partyType).trim().toLowerCase() === String(voucherPayload.partyType).trim().toLowerCase() &&
                  String(v.type).trim().toLowerCase() === String(voucherPayload.type).trim().toLowerCase() &&
                  // Only consolidate into vouchers from same date to avoid cross-date merges
                  String(v.date || '').slice(0, 10) === String(voucherPayload.date || '').slice(0, 10)
                )
              : null;

            if (fallbackVoucher) {
              console.log('[VoucherForm] Fallback: appending to existing voucher', fallbackVoucher.voucher_no || fallbackVoucher.id);
              const activeTokenClean = activeToken?.replace(/^\"|\"$/g, '');
              const updatedPayload = {
                ...fallbackVoucher,
                party_id: fallbackVoucher.party_id || voucherPayload.partyId,
                party_name: fallbackVoucher.party_name || voucherPayload.partyName,
                party_type: fallbackVoucher.party_type || voucherPayload.partyType,
                type: fallbackVoucher.type || voucherPayload.type,
                amount: Number(fallbackVoucher.amount || 0) + netPayableAmount,
                tds_amount: Number(fallbackVoucher.tds_amount || 0) + calculatedTDS,
                tdsAmount: Number(fallbackVoucher.tds_amount || 0) + calculatedTDS,
                others_amount: Number(fallbackVoucher.others_amount || 0) + calculatedOthers,
                othersAmount: Number(fallbackVoucher.others_amount || 0) + calculatedOthers,
                description: `${fallbackVoucher.description_ || fallbackVoucher.description || ''}\n${voucherPayload.description}`,
                reference_no: `${fallbackVoucher.reference_no || ''}, ${voucherPayload.referenceNo}`,
                items: [...(fallbackVoucher.items || []), ...currentPaymentItems]
              };
              await fetch(`/api/vouchers/${fallbackVoucher.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${activeTokenClean}` },
                body: JSON.stringify(updatedPayload)
              });
              if (activeCompany?.id) {
                (dispatch as any)(fetchInvoices({ company_id: activeCompany.id, limit: 1000 }));
                (dispatch as any)(fetchVouchers({ company_id: activeCompany.id, limit: 1000 }));
              }
            } else {
              // Truly no matching existing voucher — create new
              await (dispatch as any)(createVoucher({ 
                ...voucherPayload, 
                items: currentPaymentItems 
              } as any)).unwrap();
              if (activeCompany?.id) {
                (dispatch as any)(fetchInvoices({ company_id: activeCompany.id, limit: 1000 }));
                (dispatch as any)(fetchVouchers({ company_id: activeCompany.id, limit: 1000 }));
              }
            }
          } catch (fallbackErr) {
            console.error('[VoucherForm] Fallback consolidation failed, creating new:', fallbackErr);
            await (dispatch as any)(createVoucher({ 
              ...voucherPayload, 
              items: currentPaymentItems 
            } as any)).unwrap();
          }
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
            adjustment_type: i.adjustmentType,
            adjustmentValue: i.adjustmentValue,
            adjustment_value: i.adjustmentValue,
            date: formData.date
          }))
        } as any)).unwrap();
        setModal({
          isOpen: true,
          type: 'success',
          title: 'Success!',
          message: "Voucher updated successfully."
        });
        
        // Refresh state after update so cards/totals are accurate
        if (activeCompany?.id) {
          (dispatch as any)(fetchInvoices({ company_id: activeCompany.id, limit: 1000 }));
          (dispatch as any)(fetchVouchers({ company_id: activeCompany.id, limit: 1000 }));
        }
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
    if (!inv) return false;
    const invId = String(inv.id || '');
    const invNo = String(inv.invoiceNumber || inv.invoice_no || '');
    const invInwardId = String(inv.inwardId || inv.inward_id || '');
    const normInvNo = invNo.replace(/^0+/, '');

    return formData.selectedInvoices.some(item => {
      const itemId = String(item.id || '');
      const itemNo = String(item.invoiceNo || '');
      const itemInwardId = String((item as any).inwardId || (item as any).inward_id || '');
      const normItemNo = itemNo.replace(/^0+/, '');

      // 1. Match by Database ID (strongest)
      if (invId !== '' && itemId !== '' && invId === itemId) return true;
      
      // 2. Match by normalized invoice number (handles '0015' vs '15')
      const numbersMatch = (invNo !== '' && itemNo !== '' && invNo === itemNo) ||
                           (normInvNo !== '' && normItemNo !== '' && normInvNo === normItemNo);

      if (numbersMatch) {
        // Both have inwardIds → they must match
        if (invInwardId !== '' && itemInwardId !== '') {
          return invInwardId === itemInwardId;
        }
        // Item has no inwardId (loaded from stored voucher data) → match by number alone
        if (itemInwardId === '') return true;
        // Invoice has no inwardId but item does → different record
        return false;
      }
      
      return false;
    });
  };

  // Check if an invoice was originally part of this voucher (used to keep rows visible when unchecked in edit)
  const isOriginalVoucherInvoice = (inv: any) => {
    if (!initialData?.items) return false;
    const invNo = String(inv.invoiceNumber || inv.invoice_no || '').replace(/^0+/, '');
    const invId = String(inv.id || '');
    return (initialData.items as any[]).some((it: any) => {
      if (invId !== '' && String(it.id || '') === invId) return true;
      const itNo = String(it.invoiceNo || it.invoice_no || it.id || '').replace(/^0+/, '');
      return itNo !== '' && invNo !== '' && itNo === invNo;
    });
  };

  // Filter invoices for selected customer or vendor
  const customerInvoices = allInvoices.filter((inv: any) => {
    const isSelected = isInvoiceSelected(inv);
    
    if (mode === 'view') return isSelected;

    // In edit mode: always show invoices that are selected OR were originally part of this voucher
    // This ensures rows don't disappear when unchecked (since original invoices are now PAID)
    if (mode === 'edit' && (isSelected || isOriginalVoucherInvoice(inv))) return true;

    // "Without Process" records are Delivery Challans, not payable invoices
    const isWOP = inv.billType === 'Without Process' || inv.billType === 'without_process' || inv.bill_type === 'Without Process' || inv.bill_type === 'without_process';
    if (isWOP) return false;

    const pendingAmount = Number(inv.grandTotal || 0) - Number(inv.paidAmount || 0);
    const isNotPaid = inv.status?.toLowerCase() !== 'paid' && inv.status?.toLowerCase() !== 'completed' && pendingAmount > 0;
    
    // Smart Filtering: If voucher is linked to a specific inward, show ONLY that context
    const vchInwardId = String((initialData as any)?.inwardId || (initialData as any)?.inward_id || '');
    const invInwardId = String(inv.inwardId || inv.inward_id || '');

    if (vchInwardId !== '') {
       // If this invoice is NOT from our inward, hide it (unless it's already selected)
       if (invInwardId !== vchInwardId && !isSelected) return false;
       // Otherwise (if it matches or is selected), show it
       if (invInwardId === vchInwardId) return isNotPaid || isSelected;
    }

    if (formData.partyType === 'vendor') {
      const matchedInward = (inwards || []).find(inw => String(inw.id) === invInwardId);
      const isMatched = !!matchedInward && (
        String(matchedInward.vendorId || (matchedInward as any).vendor_id) === String(formData.vendorId)
      );
      return (isMatched && isNotPaid) || isSelected;
    } else {
      const isMatched = String(inv.customerId || inv.customer_id) === String(formData.customerId);
      return (isMatched && isNotPaid) || isSelected;
    }
  });

  // Deduplicate by normalized invoice number — prefer selected invoices over unselected ones
  const invoicesByNormNo = new Map<string, any>();
  customerInvoices.forEach((inv: any) => {
    const normNo = String(inv.invoiceNumber || inv.invoice_no || inv.id || '').replace(/^0+/, '');
    const key = normNo || String(inv.id);
    const existing = invoicesByNormNo.get(key);
    // Keep the selected invoice; otherwise keep first found
    if (!existing || (!isInvoiceSelected(existing) && isInvoiceSelected(inv))) {
      invoicesByNormNo.set(key, inv);
    }
  });
  const uniqueCustomerInvoices = Array.from(invoicesByNormNo.values());

  return (

    <>
      <div className="card shadow-sm border-0 bg-white p-4">
        {/* form content ... */}
        <form onSubmit={handleSubmit}>
          <div className="row g-4 mb-5">
            <div className="col-md-6 d-flex align-items-center gap-3">
              <label className="text-muted small fw-bold col-3">DATE</label>
              <input
                type="date"
                className="form-control"
                value={formData.date}
                onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
               
                disabled={mode === 'view'}
              />
            </div>
             <div className="col-md-6 d-flex align-items-center gap-3">
              <label className="text-muted small fw-bold col-3">Payment</label>
              <select
                className="form-select"
                name="paymentMode"
                value={formData.paymentMode}
                onChange={e => setFormData(prev => ({ 
                  ...prev, 
                  paymentMode: e.target.value, 
                  chequeNo: e.target.value === 'cash' ? '' : prev.chequeNo 
                }))}
               
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
              <label className="text-muted small fw-bold col-3">Type</label>
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
              <label className="text-muted small fw-bold col-3">Party Type</label>
              <select
                className="form-select"
                value={formData.partyType}
                onChange={e => {
                  const newType = e.target.value as 'customer' | 'vendor';
                  setFormData(prev => ({
                    ...prev,
                    partyType: newType,
                    type: newType === 'vendor' ? 'payment' : 'receipt',
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
                    <td colSpan={6} className="text-center py-5">
                      <div className="spinner-border text-primary spinner-border-sm me-2" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <span className="text-muted small">Loading invoices...</span>
                    </td>
                  </tr>
                ) : (
                  <>
                    {(mode === 'view' ? formData.selectedInvoices : uniqueCustomerInvoices).map((invOrItem: any) => {
                      const inv: any = mode === 'view' ? (allInvoices.find(i => String(i.id) === String(invOrItem.id)) || invOrItem) : invOrItem;
                      const selectedData = mode === 'view' ? invOrItem : formData.selectedInvoices.find(item => {
                        const itemId = String(item.id || '');
                        const itemNo = String(item.invoiceNo || '');
                        const itemInwardId = String((item as any).inwardId || (item as any).inward_id || '');
                        const invId = String(inv.id || '');
                        const invNo = String(inv.invoiceNumber || inv.invoice_no || '');
                        const invInwardId = String(inv.inwardId || inv.inward_id || '');
                        
                        if (invId !== '' && itemId !== '' && invId === itemId) return true;
                        if (invNo !== '' && itemNo !== '' && invNo === itemNo) {
                          if (invInwardId !== '' && itemInwardId !== '') {
                            if (invInwardId === itemInwardId) return true;
                          } else if (invInwardId !== '' || itemInwardId !== '') {
                            return false;
                          } else {
                            return true;
                          }
                        }
                        return false;
                      });
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
                           <td className="small text-muted">{(inv.date || inv.invoice_date) ? new Date(inv.date || inv.invoice_date).toLocaleDateString('en-GB').replace(/\//g, '-') : '-'}</td>
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
                           <td className="small fw-bold text-end" style={{ color: '#000' }}>
                             {(Number(selectedData?.amount ?? inv.grandTotal ?? 0) - Number(selectedData?.adjustmentValue ?? 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                           </td>
                         </tr>
                         {selectedData && (expandedRows.has(invoiceId) || mode === 'view') && (
                           <tr className="bg-light-subtle border-bottom border-light">
                             <td colSpan={1} className="py-0"></td>
                             <td colSpan={5} className="py-2">
                               <div className="d-flex align-items-center justify-content-start gap-4 py-1 border-start border-orange border-3" style={{ marginLeft: '60px', paddingLeft: '90px' }}>
                                 <div className="d-flex flex-column text-start">
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
                                 <div className="d-flex flex-column text-start">
                                   <span className="text-muted fw-bold text-uppercase mb-1" style={{ fontSize: '9px', letterSpacing: '0.5px' }}>Deduction Amt</span>
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
                                 <div className="flex-grow-1"></div>
                                 <div className="d-flex flex-column justify-content-end ms-1">
                                    <span className="text-muted fw-bold text-uppercase mb-1" style={{ fontSize: '9px', letterSpacing: '0.5px' }}>&nbsp;</span>
                                    <div className="fw-bold" style={{ fontSize: '13px', height: '30px', display: 'flex', alignItems: 'center', color: '#64748b' }}>
                                      -{Number(selectedData.adjustmentValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                                    </div>
                                  </div>
                               </div>
                             </td>
                           </tr>
                         )}
                       </React.Fragment>
                      );
                    })}
                    {formData.partyType === 'customer' && formData.customerId && customerInvoices.length === 0 && mode !== 'view' && (
                      <tr>
                        <td colSpan={6} className="text-center py-5 text-muted small">
                          {allInvoices.some(inv => String(inv.customerId) === String(formData.customerId)) 
                            ? "All invoices for this customer are fully paid" 
                            : "No invoices found for this customer"}
                        </td>
                      </tr>
                    )}
                    {formData.partyType === 'vendor' && formData.vendorId && customerInvoices.length === 0 && mode !== 'view' && (
                      <tr>
                        <td colSpan={6} className="text-center py-5 text-muted small">
                          {allInvoices.some(inv => String((inv as any).vendorId || (inv as any).vendor_id) === String(formData.vendorId)) 
                            ? "All inward bills for this vendor are fully paid" 
                            : "No outstanding invoices found for this vendor"}
                        </td>
                      </tr>
                    )}
                    {formData.partyType === 'customer' && !formData.customerId && (
                      <tr>
                        <td colSpan={6} className="text-center py-5 text-muted small">Please select a customer to view invoices</td>
                      </tr>
                    )}
                    {formData.partyType === 'vendor' && !formData.vendorId && (
                      <tr>
                        <td colSpan={6} className="text-center py-5 text-muted small">Please select a vendor to view invoices</td>
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
  
          <div className="d-flex justify-content-end gap-2 mt-5">
            {mode !== 'view' ? (
              <>
                <button type="button" className="btn px-5 py-2 rounded-pill fw-bold text-white" style={{ backgroundColor: '#475569', border: 'none' }} onClick={() => setFormData(prev => ({
                  ...prev,
                  partyId: '', partyName: '', customerId: '', vendorId: '',
                  selectedInvoices: [], chequeNo: ''
                }))}>CLEAR</button>
                <button
                  type="submit"
                  className="btn px-5 py-2 rounded-pill fw-bold shadow-sm text-white d-flex align-items-center gap-2"
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
              </>
            ) : (
              <button type="button" className="btn btn-secondary px-5 py-2 rounded-pill fw-bold shadow-sm" onClick={() => router.push(redirectPath)}>BACK</button>
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
                  (dispatch as any)(fetchInvoices({ company_id: activeCompany.id, limit: 1000 }));
                  (dispatch as any)(fetchVouchers({ company_id: activeCompany.id, limit: 1000 }));
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
