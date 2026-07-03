'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/redux/store';
import { createPurchaseBill, updatePurchaseBill } from '@/redux/features/purchaseSlice';
import { fetchVendors } from '@/redux/features/vendorSlice';
import { fetchCustomers } from '@/redux/features/customerSlice';
import { PurchaseBill } from '@/types/modules';

interface PurchaseFormProps {
  initialData?: PurchaseBill | null;
  isOpen: boolean;
  onClose: () => void;
}

const PurchaseForm: React.FC<PurchaseFormProps> = ({ initialData, isOpen, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items: vendors } = useSelector((state: RootState) => state.vendors);
  const { items: customers } = useSelector((state: RootState) => state.customers);

  const [formData, setFormData] = useState({
    receivedDate: '',
    companyName: '',
    gstTin: '',
    dcNo: '',
    invoiceNo: '',
    sac: '',
    qty: '',
    amount: '',
    cgst: '',
    sgst: '',
    igst: 0,
    roundOff: 0,
    vendorId: '',
    customerId: ''
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (activeCompany?.id) {
      dispatch(fetchVendors({ company_id: activeCompany.id, limit: 1000 }));
      dispatch(fetchCustomers({ company_id: activeCompany.id, limit: 1000 }));
    }
  }, [dispatch, activeCompany?.id]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        receivedDate: initialData.receivedDate ? new Date(initialData.receivedDate).toISOString().split('T')[0] : '',
        companyName: initialData.companyName || '',
        gstTin: initialData.gstTin || '',
        dcNo: initialData.dcNo || '',
        invoiceNo: initialData.invoiceNo || '',
        sac: initialData.sac || '',
        qty: initialData.qty?.toString() || '0',
        amount: initialData.amount?.toString() || '0',
        cgst: initialData.cgst?.toString() || '0',
        sgst: initialData.sgst?.toString() || '0',
        igst: initialData.igst || 0,
        roundOff: initialData.roundOff || 0,
        vendorId: initialData.vendorId || '',
        customerId: initialData.customerId || ''
      });
    } else {
      setFormData({
        receivedDate: new Date().toISOString().split('T')[0],
        companyName: '',
        gstTin: '',
        dcNo: '',
        invoiceNo: '',
        sac: '',
        qty: '',
        amount: '',
        cgst: '',
        sgst: '',
        igst: 0,
        roundOff: 0,
        vendorId: '',
        customerId: ''
      });
    }
    setErrorMsg('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  // Handle manual field change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle vendor/customer selection
  const handlePartySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    
    if (!value) {
      setFormData(prev => ({ 
        ...prev, 
        vendorId: '',
        customerId: '',
        companyName: '',
        gstTin: ''
      }));
      return;
    }

    const [type, id] = value.split('_');

    if (type === 'vendor') {
      const selectedVendor = vendors.find(v => String(v.id) === id);
      if (selectedVendor) {
        setFormData(prev => ({
          ...prev,
          vendorId: id,
          customerId: '',
          companyName: selectedVendor.name || '',
          gstTin: selectedVendor.gst || ''
        }));
      }
    } else if (type === 'customer') {
      const selectedCustomer = customers.find(c => String(c.id) === id);
      if (selectedCustomer) {
        setFormData(prev => ({
          ...prev,
          vendorId: '',
          customerId: id,
          companyName: selectedCustomer.name || '',
          gstTin: selectedCustomer.gst || ''
        }));
      }
    }
  };

  // Auto-calculated Grand Total
  const qtyNum = Number(formData.qty) || 0;
  const amountNum = Number(formData.amount) || 0;
  const cgstNum = Number(formData.cgst) || 0;
  const sgstNum = Number(formData.sgst) || 0;
  const igstNum = Number(formData.igst) || 0;
  const roundOffNum = Number(formData.roundOff) || 0;
  const grandTotal = amountNum + cgstNum + sgstNum + igstNum + roundOffNum;

  // Real-time CGST/SGST calculator helper
  const applyGstRate = (ratePercent: number) => {
    const halfRate = ratePercent / 2;
    const computedCgst = (amountNum * halfRate) / 100;
    const computedSgst = (amountNum * halfRate) / 100;
    setFormData(prev => ({
      ...prev,
      cgst: computedCgst.toFixed(2),
      sgst: computedSgst.toFixed(2),
      igst: 0
    }));
  };

  const applyIgstRate = (ratePercent: number) => {
    const computedIgst = (amountNum * ratePercent) / 100;
    setFormData(prev => ({
      ...prev,
      cgst: '0',
      sgst: '0',
      igst: computedIgst
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.receivedDate || !formData.companyName || !formData.invoiceNo) {
      setErrorMsg('Please fill in all required fields (Received Date, Company Name, and Invoice No).');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    const payload = {
      receivedDate: formData.receivedDate,
      companyName: formData.companyName,
      gstTin: formData.gstTin || undefined,
      dcNo: formData.dcNo || undefined,
      invoiceNo: formData.invoiceNo,
      sac: formData.sac || undefined,
      qty: qtyNum,
      amount: amountNum,
      cgst: cgstNum,
      sgst: sgstNum,
      igst: igstNum,
      roundOff: roundOffNum,
      vendorId: formData.vendorId || undefined,
      customerId: formData.customerId || undefined,
      company_id: activeCompany?.id
    };

    try {
      if (initialData) {
        await dispatch(updatePurchaseBill({ ...payload, id: initialData.id } as PurchaseBill)).unwrap();
      } else {
        await dispatch(createPurchaseBill(payload)).unwrap();
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err || 'Failed to save purchase bill entry');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content rounded-4 border-0 shadow-lg">
          <div className="modal-header border-bottom-0 p-4">
            <h5 className="modal-title fw-bold text-dark fs-4">
              {initialData ? 'Edit Purchase Bill' : 'New Purchase Bill Entry'}
            </h5>
            <button type="button" className="btn-close shadow-none" onClick={onClose} aria-label="Close"></button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="modal-body px-4 py-0" style={{ maxHeight: 'calc(100vh - 210px)', overflowY: 'auto' }}>
              {errorMsg && (
                <div className="alert alert-danger rounded-3 py-2 px-3 small border-0 mb-4 animate-fade-in">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {errorMsg}
                </div>
              )}

              <div className="row g-3">
                {/* Received Date */}
                <div className="col-md-6">
                  <label className="form-label text-muted small fw-bold text-uppercase">Received Date *</label>
                  <input
                    type="date"
                    name="receivedDate"
                    className="form-control rounded-3 border-light-subtle shadow-none py-2"
                    value={formData.receivedDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Party Select */}
                <div className="col-md-6">
                  <label className="form-label text-muted small fw-bold text-uppercase">Link Party (Optional)</label>
                  <select
                    className="form-select rounded-3 border-light-subtle shadow-none py-2"
                    value={formData.vendorId ? `vendor_${formData.vendorId}` : (formData.customerId ? `customer_${formData.customerId}` : '')}
                    onChange={handlePartySelect}
                  >
                    <option value="">-- Add Manually / Select Party --</option>
                    <optgroup label="Vendors">
                      {vendors.map(v => (
                        <option key={`vendor_${v.id}`} value={`vendor_${v.id}`}>{v.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Customers">
                      {customers.map(c => (
                        <option key={`customer_${c.id}`} value={`customer_${c.id}`}>{c.name}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Company Name */}
                <div className="col-md-6">
                  <label className="form-label text-muted small fw-bold text-uppercase">Company Name *</label>
                  <input
                    type="text"
                    name="companyName"
                    className="form-control rounded-3 border-light-subtle shadow-none py-2"
                    placeholder="Enter vendor or company name"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* GST TIN */}
                <div className="col-md-6">
                  <label className="form-label text-muted small fw-bold text-uppercase">GST TIN</label>
                  <input
                    type="text"
                    name="gstTin"
                    className="form-control rounded-3 border-light-subtle shadow-none py-2"
                    placeholder="22AAAAA0000A1Z5"
                    value={formData.gstTin}
                    onChange={handleChange}
                  />
                </div>

                {/* D.C No */}
                <div className="col-md-6">
                  <label className="form-label text-muted small fw-bold text-uppercase">D.C No</label>
                  <input
                    type="text"
                    name="dcNo"
                    className="form-control rounded-3 border-light-subtle shadow-none py-2"
                    placeholder="Delivery Challan Number"
                    value={formData.dcNo}
                    onChange={handleChange}
                  />
                </div>

                {/* Invoice No */}
                <div className="col-md-6">
                  <label className="form-label text-muted small fw-bold text-uppercase">Invoice No *</label>
                  <input
                    type="text"
                    name="invoiceNo"
                    className="form-control rounded-3 border-light-subtle shadow-none py-2"
                    placeholder="Invoice Number"
                    value={formData.invoiceNo}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* SAC Code */}
                <div className="col-md-4">
                  <label className="form-label text-muted small fw-bold text-uppercase">SAC / HSN</label>
                  <input
                    type="text"
                    name="sac"
                    className="form-control rounded-3 border-light-subtle shadow-none py-2"
                    placeholder="SAC code"
                    value={formData.sac}
                    onChange={handleChange}
                  />
                </div>

                {/* Qty */}
                <div className="col-md-4">
                  <label className="form-label text-muted small fw-bold text-uppercase">Quantity</label>
                  <input
                    type="number"
                    step="any"
                    name="qty"
                    className="form-control rounded-3 border-light-subtle shadow-none py-2"
                    placeholder="0.00"
                    value={formData.qty}
                    onChange={handleChange}
                  />
                </div>

                {/* Taxable Amount */}
                <div className="col-md-4">
                  <label className="form-label text-muted small fw-bold text-uppercase">Amount (Taxable Value)</label>
                  <input
                    type="number"
                    step="any"
                    name="amount"
                    className="form-control rounded-3 border-light-subtle shadow-none py-2"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={handleChange}
                  />
                </div>

                {/* Quick GST Actions */}
                <div className="col-12 py-1">
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <span className="text-muted small fw-bold me-2">Calculate GST:</span>
                    <button type="button" className="btn btn-sm btn-outline-secondary rounded-pill px-3" onClick={() => applyGstRate(12)}>CGST+SGST @ 12%</button>
                    <button type="button" className="btn btn-sm btn-outline-secondary rounded-pill px-3" onClick={() => applyGstRate(18)}>CGST+SGST @ 18%</button>
                    <button type="button" className="btn btn-sm btn-outline-secondary rounded-pill px-3" onClick={() => applyIgstRate(12)}>IGST @ 12%</button>
                    <button type="button" className="btn btn-sm btn-outline-secondary rounded-pill px-3" onClick={() => applyIgstRate(18)}>IGST @ 18%</button>
                  </div>
                </div>

                {/* CGST */}
                <div className="col-md-3">
                  <label className="form-label text-danger-emphasis small fw-bold text-uppercase">CGST</label>
                  <input
                    type="number"
                    step="any"
                    name="cgst"
                    className="form-control rounded-3 border-light-subtle shadow-none py-2 text-danger-emphasis"
                    placeholder="0.00"
                    value={formData.cgst}
                    onChange={handleChange}
                  />
                </div>

                {/* SGST */}
                <div className="col-md-3">
                  <label className="form-label text-danger-emphasis small fw-bold text-uppercase">SGST</label>
                  <input
                    type="number"
                    step="any"
                    name="sgst"
                    className="form-control rounded-3 border-light-subtle shadow-none py-2 text-danger-emphasis"
                    placeholder="0.00"
                    value={formData.sgst}
                    onChange={handleChange}
                  />
                </div>

                {/* IGST */}
                <div className="col-md-3">
                  <label className="form-label text-danger-emphasis small fw-bold text-uppercase">IGST</label>
                  <input
                    type="number"
                    step="any"
                    name="igst"
                    className="form-control rounded-3 border-light-subtle shadow-none py-2 text-danger-emphasis"
                    placeholder="0.00"
                    value={formData.igst}
                    onChange={handleChange}
                  />
                </div>

                {/* Round Off */}
                <div className="col-md-3">
                  <label className="form-label text-danger-emphasis small fw-bold text-uppercase">Round Off</label>
                  <input
                    type="number"
                    step="any"
                    name="roundOff"
                    className="form-control rounded-3 border-light-subtle shadow-none py-2 text-danger-emphasis"
                    placeholder="0.00"
                    value={formData.roundOff}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Dynamic Grand Total summary */}
              <div className="bg-light-subtle p-3 rounded-4 border border-light-subtle mt-4 d-flex justify-content-between align-items-center">
                <div>
                  <span className="text-muted small fw-bold text-uppercase d-block">Grand Total</span>
                  <span className="text-dark-emphasis small font-monospace">Taxable Value + Taxes + Round Off</span>
                </div>
                <div className="h3 fw-bold text-primary mb-0 font-monospace">
                  ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            <div className="modal-footer border-top-0 p-4">
              <button type="button" className="btn btn-light rounded-3 px-4 shadow-none" onClick={onClose} disabled={submitting}>Cancel</button>
              <button type="submit" className="btn btn-primary rounded-3 px-4 shadow-none btn-page-action" disabled={submitting}>
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Saving...
                  </>
                ) : (
                  'Save Bill'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PurchaseForm;
