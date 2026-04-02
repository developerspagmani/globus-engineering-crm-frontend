'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '@/redux/store';
import { createOutward, updateOutward, fetchOutwards } from '@/redux/features/outwardSlice';
import { fetchCustomers } from '@/redux/features/customerSlice';
import { fetchInwards } from '@/redux/features/inwardSlice';
import { OutwardEntry } from '@/types/modules';

interface OutwardFormProps {
  initialData?: OutwardEntry;
  mode: 'create' | 'edit' | 'view';
}

const OutwardForm: React.FC<OutwardFormProps> = ({ initialData, mode }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { items: customers } = useSelector((state: RootState) => state.customers);
  const { items: inwards } = useSelector((state: RootState) => state.inward);
  const { company: activeCompany } = useSelector((state: RootState) => state.auth);

  const [formData, setFormData] = useState<Omit<OutwardEntry, 'id' | 'createdAt'>>({
    outwardNo: `CH-${Math.floor(1000 + Math.random() * 9000)}`,
    customerId: '',
    customerName: '',
    invoiceReference: '',
    challanNo: '',
    vehicleNo: '',
    company_id: activeCompany?.id || '',
    inwardId: '',
    inwardNo: '',
    date: new Date().toISOString().split('T')[0],
    status: 'pending',
    items: [{ description: '', quantity: 0, unit: 'pcs' }],
  });

  useEffect(() => {
    if (activeCompany?.id) {
      (dispatch as any)(fetchCustomers(activeCompany.id));
      (dispatch as any)(fetchInwards(activeCompany.id));
    }
  }, [dispatch, activeCompany?.id]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        outwardNo: initialData.outwardNo,
        customerId: String(initialData.customerId || ''),
        customerName: initialData.customerName,
        invoiceReference: initialData.invoiceReference || '',
        challanNo: initialData.challanNo || '',
        vehicleNo: initialData.vehicleNo || '',
        company_id: initialData.company_id,
        inwardId: initialData.inwardId || '',
        inwardNo: initialData.inwardNo || '',
        date: initialData.date,
        status: initialData.status,
        items: initialData.items,
      });
    }
  }, [initialData]);

  // Filter inwards for selected customer
  const customerInwards = useMemo(() => {
    return inwards.filter(i => String(i.customerId) === String(formData.customerId));
  }, [inwards, formData.customerId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'customerId') {
      const customer = customers.find(c => String(c.id) === String(value));
      setFormData(prev => ({ 
        ...prev, 
        customerId: value, 
        customerName: customer?.name || '',
        inwardId: '', // Reset inward when customer changes
        inwardNo: ''
      }));
    } else if (name === 'inwardId') {
      const selectedInward = inwards.find(i => String(i.id) === String(value));
      if (selectedInward) {
        setFormData(prev => ({
          ...prev,
          inwardId: value,
          inwardNo: selectedInward.inwardNo,
          items: selectedInward.items.map(i => ({
            description: i.description,
            quantity: i.quantity,
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
      if (mode === 'create') {
        const payload = {
          ...formData,
          inward_id: formData.inwardId,
          inward_no: formData.inwardNo,
          invoice_reference: formData.invoiceReference,
          challan_no: formData.challanNo,
          vehicle_no: formData.vehicleNo
        };
        await (dispatch as any)(createOutward(payload)).unwrap();
      } else {
        await (dispatch as any)(updateOutward({ ...initialData!, ...formData })).unwrap();
      }
      router.push('/outward');
    } catch (error) {
      alert('Failed to save outward entry');
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
                    <div className="row mb-3">
                       <label className="col-sm-4 text-muted small fw-bold">CHALLAN NO</label>
                       <div className="col-sm-8">
                           <input type="text" className="form-control fw-bold border-0 bg-light rounded-pill px-3 py-2" name="outwardNo" value={formData.outwardNo} onChange={handleChange} required disabled={mode === 'view'} />
                       </div>
                    </div>
                    <div className="row mb-3">
                       <label className="col-sm-4 text-muted small fw-bold">CUSTOMER</label>
                       <div className="col-sm-8">
                           <select className="form-select border-0 bg-light rounded-pill px-3 py-2 fw-bold" name="customerId" value={formData.customerId} onChange={handleChange} required disabled={mode === 'view'}>
                             <option value="">Select Customer</option>
                             {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                       </div>
                    </div>
                    {/* NEW SMART INWARD SELECTOR */}
                    <div className="row mb-3">
                       <label className="col-sm-4 text-muted small fw-bold text-warning">INWARD REF</label>
                       <div className="col-sm-8">
                           <select className="form-select border-warning-subtle bg-warning-light rounded-pill px-3 py-2 fw-bold" name="inwardId" value={formData.inwardId} onChange={handleChange} disabled={mode === 'view' || !formData.customerId}>
                             <option value="">Select Inward Batch (Optional)</option>
                             {customerInwards.map(i => (
                                <option key={i.id} value={i.id}>{i.inwardNo} - {i.date} ({i.items.length} items)</option>
                             ))}
                          </select>
                          <small className="text-muted mt-1 d-block ms-2">Linking a batch auto-fills item details.</small>
                       </div>
                    </div>
                 </div>

                 <div className="col-md-6 px-lg-5">
                    <div className="row mb-3">
                       <label className="col-sm-4 text-muted small fw-bold">DISPATCH DATE</label>
                       <div className="col-sm-8">
                           <input type="date" className="form-control border-0 bg-light rounded-pill px-3 py-2" name="date" value={formData.date} onChange={handleChange} required disabled={mode === 'view'} />
                       </div>
                    </div>
                    <div className="row mb-3">
                       <label className="col-sm-4 text-muted small fw-bold">VEHICLE NO</label>
                       <div className="col-sm-8">
                           <input type="text" className="form-control border-0 bg-light rounded-pill px-3 py-2" name="vehicleNo" value={formData.vehicleNo} onChange={handleChange} placeholder="TN-01-AB-1234" required disabled={mode === 'view'} />
                       </div>
                    </div>
                    <div className="row mb-3">
                       <label className="col-sm-4 text-muted small fw-bold">DOC REF NO</label>
                       <div className="col-sm-8">
                           <input type="text" className="form-control border-0 bg-light rounded-pill px-3 py-2" name="challanNo" value={formData.challanNo} onChange={handleChange} placeholder="Ext Challan / PO" disabled={mode === 'view'} />
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
                              <input type="text" className="form-control border-0 bg-light px-3 py-2" value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} required disabled={mode === 'view'} placeholder="Item name or part number" />
                           </td>
                           <td className="py-3 px-3 text-center">
                              <input type="number" className="form-control text-center border-0 bg-light px-3 py-2 fw-bold text-primary" value={item.quantity || ''} onChange={e => handleItemChange(index, 'quantity', e.target.value)} required disabled={mode === 'view'} />
                           </td>
                           <td className="py-3 px-3 text-center">
                              <select className="form-select border-0 bg-light px-3 py-2 text-center" value={item.unit} onChange={e => handleItemChange(index, 'unit', e.target.value)} disabled={mode === 'view'}>
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
                <button type="button" className="btn btn-light px-5 py-2 rounded-pill fw-bold border" onClick={() => router.push('/outward')}>CANCEL</button>
                <button type="submit" className="btn btn-primary px-5 py-2 rounded-pill fw-bold shadow-sm">{mode === 'create' ? 'DISPATCH AS CHALLAN' : 'SAVE UPDATES'}</button>
              </>
            ) : (
              <button type="button" className="btn btn-secondary px-5 py-2 rounded-pill fw-bold shadow-sm" onClick={() => router.push('/outward')}>BACK TO LIST</button>
            )}
          </div>
        </form>
      </div>
      <style jsx>{`
         .bg-warning-light { background-color: #fff9f0; }
         .border-bottom-subtle { border-bottom: 1px dashed #dee2e6; }
      `}</style>
    </div>
  );
};

export default OutwardForm;
