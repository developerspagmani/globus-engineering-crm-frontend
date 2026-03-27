'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '@/redux/store';
import { createOutward, updateOutward } from '@/redux/features/outwardSlice';
import { OutwardEntry } from '@/types/modules';

interface OutwardFormProps {
  initialData?: OutwardEntry;
  mode: 'create' | 'edit';
}

const OutwardForm: React.FC<OutwardFormProps> = ({ initialData, mode }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { items: customers } = useSelector((state: RootState) => state.customers);
  const { company: activeCompany } = useSelector((state: RootState) => state.auth);

  const [formData, setFormData] = useState<Omit<OutwardEntry, 'id' | 'createdAt'>>({
    outwardNo: `OUT-${Math.floor(1000 + Math.random() * 9000)}`,
    customerId: '',
    customerName: '',
    invoiceReference: '',
    challanNo: '',
    vehicleNo: '',
    company_id: activeCompany?.id || '',
    date: new Date().toISOString().split('T')[0],
    status: 'pending',
    items: [{ description: '', quantity: 0, unit: 'pcs' }],
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        outwardNo: initialData.outwardNo,
        customerId: initialData.customerId,
        customerName: initialData.customerName,
        invoiceReference: initialData.invoiceReference,
        challanNo: initialData.challanNo,
        vehicleNo: initialData.vehicleNo,
        company_id: initialData.company_id,
        date: initialData.date,
        status: initialData.status,
        items: initialData.items,
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'customerId') {
      const customer = customers.find(c => c.id === value);
      setFormData(prev => ({ ...prev, customerId: value, customerName: customer?.name || '' }));
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
        await (dispatch as any)(createOutward(formData)).unwrap();
      } else {
        await (dispatch as any)(updateOutward({ ...initialData!, ...formData })).unwrap();
      }
      router.push('/outward');
    } catch (error) {
      alert('Failed to save outward entry');
    }
  };

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body p-4">
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
             <div className="row g-4">
                <div className="col-md-6">
                   <div className="row mb-3 align-items-center">
                      <label className="col-sm-3 text-muted fw-bold">Outward No</label>
                      <div className="col-sm-9">
                         <input type="text" className="form-control border-0 border-bottom rounded-0 bg-transparent shadow-none fw-bold" name="outwardNo" value={formData.outwardNo} onChange={handleChange} required />
                      </div>
                   </div>
                   <div className="row mb-3 align-items-center">
                      <label className="col-sm-3 text-muted fw-bold">Customer</label>
                      <div className="col-sm-9">
                         <select className="form-select border-0 border-bottom rounded-0 bg-transparent shadow-none fw-bold" name="customerId" value={formData.customerId} onChange={handleChange} required>
                            <option value="">Select Customer</option>
                            {customers.map(c => (
                               <option key={c.id} value={c.id}>{c.company || c.name}</option>
                            ))}
                         </select>
                      </div>
                   </div>
                   <div className="row mb-3 align-items-center">
                      <label className="col-sm-3 text-muted fw-bold">Dispatch Challan</label>
                      <div className="col-sm-9">
                         <input type="text" className="form-control border-0 border-bottom rounded-0 bg-transparent shadow-none" name="challanNo" value={formData.challanNo} onChange={handleChange} required />
                      </div>
                   </div>
                </div>

                <div className="col-md-6">
                   <div className="row mb-3 align-items-center">
                      <label className="col-sm-3 text-muted fw-bold">Dispatch Date</label>
                      <div className="col-sm-9">
                         <input type="date" className="form-control border-0 border-bottom rounded-0 bg-transparent shadow-none" name="date" value={formData.date} onChange={handleChange} required />
                      </div>
                   </div>
                   <div className="row mb-3 align-items-center">
                      <label className="col-sm-3 text-muted fw-bold">Invoice Ref</label>
                      <div className="col-sm-9">
                         <input type="text" className="form-control border-0 border-bottom rounded-0 bg-transparent shadow-none" name="invoiceReference" value={formData.invoiceReference} onChange={handleChange} placeholder="Ex. INV-2024-001" required />
                      </div>
                   </div>
                   <div className="row mb-3 align-items-center">
                      <label className="col-sm-3 text-muted fw-bold">Vehicle No</label>
                      <div className="col-sm-9">
                         <input type="text" className="form-control border-0 border-bottom rounded-0 bg-transparent shadow-none" name="vehicleNo" value={formData.vehicleNo} onChange={handleChange} placeholder="Ex. GA-01-AB-1234" required />
                      </div>
                   </div>
                </div>
             </div>
          </div>

          <div className="mb-4">
            <h6 className="fw-bold mb-3 border-bottom pb-2">Goods Details</h6>
            {formData.items.map((item, index) => (
              <div className="row g-2 mb-2 align-items-end" key={index}>
                <div className="col-md-6">
                  <label className="small text-muted">Description</label>
                  <input type="text" className="form-control" value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} required />
                </div>
                <div className="col-md-2">
                  <label className="small text-muted">Quantity</label>
                  <input type="number" className="form-control" value={item.quantity || ''} onChange={e => handleItemChange(index, 'quantity', e.target.value)} required />
                </div>
                <div className="col-md-2">
                  <label className="small text-muted">Unit</label>
                  <select className="form-select" value={item.unit} onChange={e => handleItemChange(index, 'unit', e.target.value)}>
                    <option value="pcs">Pcs</option>
                    <option value="kg">Kg</option>
                    <option value="mtr">Meters</option>
                    <option value="set">Set</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <button type="button" className="btn btn-outline-danger w-100" onClick={() => removeItem(index)} disabled={formData.items.length === 1}>
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            ))}
            <button type="button" className="btn btn-sm btn-outline-primary mt-2" onClick={addItem}>
              <i className="bi bi-plus"></i> Add Goods
            </button>
          </div>

          <div className="mt-5 pt-4 border-top d-flex gap-2">
            <button type="submit" className="btn btn-primary px-4">{mode === 'create' ? 'Create' : 'Save'} Outward Entry</button>
            <button type="button" className="btn btn-outline-secondary px-4" onClick={() => router.push('/outward')}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OutwardForm;
