'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '@/redux/store';
import { createOutward, updateOutward, fetchOutwards } from '@/redux/features/outwardSlice';
import { fetchCustomers } from '@/redux/features/customerSlice';
import { fetchVendors } from '@/redux/features/vendorSlice';
import { fetchInwards } from '@/redux/features/inwardSlice';
import { fetchProcesses } from '@/redux/features/masterSlice';
import { OutwardEntry } from '@/types/modules';
import StatusModal from '@/components/StatusModal';
import FullPageStatus from '@/components/FullPageStatus';


interface OutwardFormProps {
  initialData?: OutwardEntry;
  mode: 'create' | 'edit' | 'view';
}

const OutwardForm: React.FC<OutwardFormProps> = ({ initialData, mode }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { items: customers } = useSelector((state: RootState) => state.customers);
  const { items: vendors } = useSelector((state: RootState) => state.vendors);
  const { items: inwards } = useSelector((state: RootState) => state.inward);
  const { processes } = useSelector((state: RootState) => state.master);
  const { company: activeCompany, user } = useSelector((state: RootState) => state.auth);
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });


  const [formData, setFormData] = useState<Omit<OutwardEntry, 'id' | 'createdAt'>>({
    outwardNo: initialData?.outwardNo || `CH-${Math.floor(1000 + Math.random() * 9000)}`,
    partyType: initialData?.partyType || 'customer',
    customerId: initialData?.customerId || '',
    customerName: initialData?.customerName || '',
    vendorId: initialData?.vendorId || '',
    vendorName: initialData?.vendorName || '',
    processName: initialData?.processName || '',
    invoiceReference: initialData?.invoiceReference || '',
    challanNo: initialData?.challanNo || '',
    vehicleNo: initialData?.vehicleNo || '',
    driverName: initialData?.driverName || '',
    notes: initialData?.notes || '',
    company_id: initialData?.company_id || activeCompany?.id || '',
    inwardId: initialData?.inwardId || '',
    inwardNo: initialData?.inwardNo || '',
    date: initialData?.date || new Date().toISOString().split('T')[0],
    status: initialData?.status || 'completed',
    items: initialData?.items || [{ description: '', quantity: 0, unit: 'pcs' }],
    amount: initialData?.amount || 0,
  });

  useEffect(() => {
    if (activeCompany?.id) {
      (dispatch as any)(fetchCustomers(activeCompany.id));
      (dispatch as any)(fetchVendors(activeCompany.id));
      (dispatch as any)(fetchInwards(activeCompany.id));
      (dispatch as any)(fetchProcesses(activeCompany.id));
    }
  }, [dispatch, activeCompany?.id]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        outwardNo: initialData.outwardNo,
        partyType: initialData.partyType || 'customer',
        customerId: String(initialData.customerId || ''),
        customerName: initialData.customerName || '',
        vendorId: String(initialData.vendorId || ''),
        vendorName: initialData.vendorName || '',
        processName: initialData.processName || '',
        invoiceReference: initialData.invoiceReference || '',
        challanNo: initialData.challanNo || '',
        vehicleNo: initialData.vehicleNo || '',
        driverName: initialData.driverName || '',
        notes: initialData.notes || '',
        company_id: initialData.company_id,
        inwardId: initialData.inwardId || '',
        inwardNo: initialData.inwardNo || '',
        date: initialData.date,
        status: initialData.status,
        items: initialData.items,
        amount: initialData.amount || 0,
      });
    }
  }, [initialData]);

  // Filter inwards for selected party
  const availableInwards = useMemo(() => {
    if (formData.partyType === 'customer') {
      return inwards.filter(i => String(i.customerId) === String(formData.customerId));
    } else {
      // For Vendor Outward, we might be sending products from ANY customer's inward
      return inwards; 
    }
  }, [inwards, formData.customerId, formData.vendorId, formData.partyType]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'partyType') {
       setFormData(prev => ({
         ...prev,
         partyType: value as 'customer' | 'vendor',
         customerId: '',
         customerName: '',
         vendorId: '',
         vendorName: '',
         inwardId: '',
         inwardNo: ''
       }));
    } else if (name === 'customerId') {
      const customer = customers.find(c => String(c.id) === String(value));
      setFormData(prev => ({ 
        ...prev, 
        customerId: value, 
        customerName: customer?.name || '',
        inwardId: '', // Reset inward when customer changes
        inwardNo: ''
      }));
    } else if (name === 'vendorId') {
      const vendor = vendors.find(v => String(v.id) === String(value));
      setFormData(prev => ({ 
        ...prev, 
        vendorId: value, 
        vendorName: vendor?.name || '',
        inwardId: '', // Reset inward when vendor changes
        inwardNo: ''
      }));
    } else if (name === 'inwardId') {
      const selectedInward = inwards.find(i => String(i.id) === String(value));
      if (selectedInward) {
        setFormData(prev => ({
          ...prev,
          inwardId: value,
          inwardNo: selectedInward.inwardNo,
          items: selectedInward.items.filter((i: any) => (i.remainingQty || 0) > 0).map((i: any) => ({
            description: i.description || i.item_name,
            quantity: i.remainingQty || 0,
            unit: i.unit || 'pcs'
          }))
        }));
      } else {
        setFormData(prev => ({ ...prev, inwardId: '', inwardNo: '' }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    let val = value;
    if (field === 'quantity') {
      val = value === '' ? 0 : parseFloat(value);
      if (isNaN(val)) val = 0;
    }
    (newItems[index] as any)[field] = val;
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 0, unit: 'pcs' }]
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const finalData = {
        ...formData,
        outward_no: formData.outwardNo,
        party_type: formData.partyType,
        customer_id: formData.customerId,
        vendor_id: formData.vendorId,
        inward_id: formData.inwardId,
        inward_no: formData.inwardNo,
        invoice_reference: formData.invoiceReference,
        challan_no: formData.challanNo,
        vehicle_no: formData.vehicleNo,
        driver_name: formData.driverName,
        notes: formData.notes,
        process_name: formData.processName
      };

      if (mode === 'create') {
        await (dispatch as any)(createOutward(finalData)).unwrap();
        setModal({
          isOpen: true,
          type: 'success',
          title: 'Success!',
          message: "Dispatch recorded successfully."
        });
      } else {
        await (dispatch as any)(updateOutward({ ...initialData!, ...finalData })).unwrap();
        setModal({
          isOpen: true,
          type: 'success',
          title: 'Success!',
          message: "Dispatch updated successfully."
        });
      }
    } catch (error) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to save outward entry'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
      <div className="card-header bg-white py-3 border-0">
         <h5 className="fw-bold mb-0 text-primary">Outward Detail / Dispatch Challan</h5>
      </div>
      <div className="card-body p-4 bg-light">
        <form onSubmit={handleSubmit}>
            <div className="bg-white p-4 rounded-4 shadow-sm mb-4">
              <div className="row g-4">
                 <div className="col-md-6 border-end">
                    <div className="row mb-3 align-items-center">
                       <label className="col-4 text-muted small fw-bold">CHALLAN NO</label>
                       <div className="col-8">
                           <input type="text" className="form-control fw-bold px-3 py-2" name="outwardNo" value={formData.outwardNo} onChange={handleChange} required disabled={mode === 'view'} />
                       </div>
                    </div>
                    
                    <div className="row mb-3 align-items-center">
                       <label className="col-4 text-muted small fw-bold">PARTY TYPE</label>
                       <div className="col-8 d-flex gap-3">
                          <label className="d-flex align-items-center gap-2 cursor-pointer mb-0">
                             <input type="radio" name="partyType" value="customer" checked={formData.partyType === 'customer'} onChange={handleChange} disabled={mode === 'view'} />
                             <span className="small fw-bold">Customer</span>
                          </label>
                          <label className="d-flex align-items-center gap-2 cursor-pointer mb-0">
                             <input type="radio" name="partyType" value="vendor" checked={formData.partyType === 'vendor'} onChange={handleChange} disabled={mode === 'view'} />
                             <span className="small fw-bold">Vendor</span>
                          </label>
                       </div>
                    </div>

                    {formData.partyType === 'customer' ? (
                      <div className="row mb-3 align-items-center">
                         <label className="col-4 text-muted small fw-bold">CUSTOMER</label>
                         <div className="col-8">
                             <select className="form-select px-3 py-2 fw-bold" name="customerId" value={formData.customerId} onChange={handleChange} required={formData.partyType === 'customer'} disabled={mode === 'view'}>
                               <option value="">Select Customer</option>
                               {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                         </div>
                      </div>
                    ) : (
                      <>
                        <div className="row mb-3 align-items-center">
                           <label className="col-4 text-muted small fw-bold">VENDOR</label>
                           <div className="col-8">
                               <select className="form-select px-3 py-2 fw-bold" name="vendorId" value={formData.vendorId} onChange={handleChange} required={formData.partyType === 'vendor'} disabled={mode === 'view'}>
                                 <option value="">Select Vendor</option>
                                 {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                              </select>
                           </div>
                        </div>
                        <div className="row mb-3 align-items-center">
                           <label className="col-4 text-muted small fw-bold text-info">ASSIGN PROCESS</label>
                           <div className="col-8">
                               <select className="form-select border-info-subtle bg-info-light rounded-pill px-3 py-2 fw-bold" name="processName" value={formData.processName} onChange={handleChange} required={formData.partyType === 'vendor'} disabled={mode === 'view'}>
                                 <option value="">Select Process (for Vendor)</option>
                                 {processes.map(p => <option key={p.id} value={p.processName}>{p.processName}</option>)}
                              </select>
                           </div>
                        </div>
                      </>
                    )}

                    {/* NEW SMART INWARD SELECTOR */}
                    <div className="row mb-3 align-items-center">
                       <label className="col-4 text-muted small fw-bold text-warning">INWARD REF</label>
                       <div className="col-8">
                           <select className="form-select border-warning-subtle bg-warning-light rounded-pill px-3 py-2 fw-bold" name="inwardId" value={formData.inwardId} onChange={handleChange} disabled={mode === 'view' || (formData.partyType === 'customer' && !formData.customerId) || (formData.partyType === 'vendor' && !formData.vendorId)}>
                             <option value="">Select Inward Batch (Optional)</option>
                             {availableInwards.filter(i => (i.totalRemaining !== undefined ? i.totalRemaining > 0 : true)).map(i => (
                                <option key={i.id} value={i.id}>{i.inwardNo} - Bal: {i.totalRemaining ?? 'New'} ({i.date ? new Date(i.date).toLocaleDateString() : 'N/A'})</option>
                             ))}
                          </select>
                       </div>
                    </div>
                 </div>

                 <div className="col-md-6 px-lg-5">
                    <div className="row mb-3 align-items-center">
                       <label className="col-4 text-muted small fw-bold">DISPATCH DATE</label>
                       <div className="col-8">
                           <input type="date" className="form-control px-3 py-2" name="date" value={formData.date} onChange={handleChange} required disabled={mode === 'view'} />
                       </div>
                    </div>
                    <div className="row mb-3 align-items-center">
                       <label className="col-4 text-muted small fw-bold">VEHICLE NO</label>
                       <div className="col-8">
                           <input type="text" className="form-control px-3 py-2" name="vehicleNo" value={formData.vehicleNo} onChange={handleChange} placeholder="TN-01-AB-1234" required disabled={mode === 'view'} />
                       </div>
                    </div>
                    <div className="row mb-3 align-items-center">
                       <label className="col-4 text-muted small fw-bold">DRIVER NAME</label>
                       <div className="col-8">
                           <input type="text" className="form-control border-0 bg-light rounded-pill px-3 py-2" name="driverName" value={formData.driverName || ''} onChange={handleChange} placeholder="Optional" disabled={mode === 'view'} />
                       </div>
                    </div>
                    <div className="row mb-3 align-items-center">
                       <label className="col-4 text-muted small fw-bold">DOC REF NO</label>
                       <div className="col-8">
                           <input type="text" className="form-control px-3 py-2" name="challanNo" value={formData.challanNo} onChange={handleChange} placeholder="Ext Challan / PO" disabled={mode === 'view'} />
                       </div>
                    </div>
                    {formData.partyType === 'vendor' && (
                      <div className="row mb-3 align-items-center">
                        <label className="col-4 text-muted small fw-bold text-danger">JOB VALUE (INR)</label>
                        <div className="col-8">
                            <input type="number" className="form-control border-danger-subtle bg-danger-light rounded-pill px-3 py-2 fw-bold text-danger" name="amount" value={(formData as any).amount || ''} onChange={handleChange} placeholder="Value for Ledger" disabled={mode === 'view'} />
                        </div>
                      </div>
                    )}
                    <div className="row mb-3 align-items-center">
                       <label className="col-4 text-muted small fw-bold">NOTES</label>
                       <div className="col-8">
                           <textarea className="form-control px-3 py-2" name="notes" rows={2} value={formData.notes || ''} onChange={handleChange} placeholder="Special instructions..." disabled={mode === 'view'}></textarea>
                       </div>
                    </div>
                 </div>
              </div>
          </div>


          <div className="bg-white p-4 rounded-4 shadow-sm mb-4">
            <h6 className="fw-bold mb-4 d-flex align-items-center"><i className="bi bi-box-seam me-2 text-primary"></i> DISPATCH ITEMS</h6>
            <div className="table-responsive">
               <table className="table table-borderless align-middle">
                  <thead>
                     <tr className="small text-muted fw-bold border-bottom">
                        <th className="pb-3 px-3">DESCRIPTION / PART NO</th>
                        <th className="pb-3 text-center" style={{ width: '150px' }}>QUANTITY</th>
                        <th className="pb-3 text-center" style={{ width: '150px' }}>UNIT</th>
                        {mode !== 'view' && <th className="pb-3 text-end" style={{ width: '50px' }}></th>}
                     </tr>
                  </thead>
                  <tbody>
                     {formData.items.map((item, index) => (
                        <tr key={index} className="border-bottom-subtle">
                           <td className="py-3 px-3">
                              <input type="text" className="form-control px-3 py-2" value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} required disabled={mode === 'view'} placeholder="Item name or part number" />
                           </td>
                           <td className="py-3 px-3 text-center">
                              <input type="number" className="form-control text-center px-3 py-2 fw-bold text-primary" value={item.quantity || ''} onChange={e => handleItemChange(index, 'quantity', e.target.value)} required disabled={mode === 'view'} />
                           </td>
                           <td className="py-3 px-3 text-center">
                              <select className="form-select px-3 py-2 text-center" value={item.unit} onChange={e => handleItemChange(index, 'unit', e.target.value)} disabled={mode === 'view'}>
                                 <option value="pcs">Pcs</option>
                                 <option value="kg">Kg</option>
                                 <option value="mtr">Mtrs</option>
                                 <option value="set">Set</option>
                              </select>
                           </td>
                           {mode !== 'view' && (
                              <td className="py-3 text-end">
                                 <button type="button" className="btn btn-link text-danger p-0" onClick={() => removeItem(index)} disabled={formData.items.length === 1}>
                                    <i className="bi bi-x-circle-fill fs-5"></i>
                                 </button>
                              </td>
                           )}
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
            {mode !== 'view' && (
              <button type="button" className="btn btn-sm btn-outline-primary rounded-pill mt-3 fw-bold shadow-none" onClick={addItem}>
                <i className="bi bi-plus-lg me-1"></i> Add Manual Item
              </button>
            )}
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4">
            {mode !== 'view' ? (
              <>
                <button type="button" className="btn btn-light px-5 py-2 rounded-pill fw-bold border" onClick={() => router.push('/outward')}>CLEAR</button>
                <button type="submit" className="btn btn-primary px-5 py-2 rounded-pill fw-bold shadow-sm" disabled={saving}>
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      SUBMITTING...
                    </>
                  ) : (
                    mode === 'create' ? 'SUBMIT' : 'UPDATE'
                  )}
                </button>
              </>
            ) : (
              <button type="button" className="btn btn-secondary px-5 py-2 rounded-pill fw-bold shadow-sm" onClick={() => router.push('/outward')}>BACK TO LIST</button>
            )}
          </div>
        </form>
      </div>
      <style jsx>{`
         .bg-warning-light { background-color: #fff9f0; }
         .bg-info-light { background-color: #f0f7ff; }
         .bg-danger-light { background-color: #fff5f5; }
         .border-bottom-subtle { border-bottom: 1px dashed #dee2e6; }
         .cursor-pointer { cursor: pointer; }
         .fw-900 { font-weight: 900; }
         .fw-800 { font-weight: 800; }
         .x-small { font-size: 0.70rem; }
      `}</style>

      {modal.isOpen && (
        <FullPageStatus
          type={modal.type}
          title={modal.title}
          message={modal.message}
          onClose={() => {
            setModal(prev => ({ ...prev, isOpen: false }));
            if (modal.type === 'success') router.push('/outward');
          }}
        />
      )}
    </div>
  );
};

export default OutwardForm;
