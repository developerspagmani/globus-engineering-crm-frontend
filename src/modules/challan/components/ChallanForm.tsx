'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '@/redux/store';
import { addChallan, updateChallan } from '@/redux/features/challanSlice';
import { Challan, Customer, Vendor } from '@/data/mockModules';
import StatusModal from '@/components/StatusModal';

interface ChallanFormProps {
  initialData?: Challan;
  mode: 'create' | 'edit';
}

const ChallanForm: React.FC<ChallanFormProps> = ({ initialData, mode }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { items: customers } = useSelector((state: RootState) => state.customers);
  const { items: vendors } = useSelector((state: RootState) => state.vendors);
  const { company: activeCompany } = useSelector((state: RootState) => state.auth);

  const [formData, setFormData] = useState<Omit<Challan, 'id' | 'createdAt'>>({
    challanNo: `DC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    partyId: '',
    partyName: '',
    partyType: 'customer',
    company_id: activeCompany?.id || '',
    date: new Date().toISOString().split('T')[0],
    type: 'delivery',
    status: 'draft',
    items: [{ description: '', quantity: 1, unit: 'pcs', hsnCode: '' }],
    vehicleNo: '',
    driverName: '',
    notes: '',
  });

  const [modal, setModal] = useState<{ isOpen: boolean; type: 'success' | 'error'; title: string; message: string }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        challanNo: initialData.challanNo,
        partyId: initialData.partyId,
        partyName: initialData.partyName,
        partyType: initialData.partyType,
        company_id: initialData.company_id,
        date: initialData.date,
        type: initialData.type,
        status: initialData.status,
        items: initialData.items,
        vehicleNo: initialData.vehicleNo || '',
        driverName: initialData.driverName || '',
        notes: initialData.notes || '',
      });
    }
  }, [initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'partyId') {
      const party = formData.partyType === 'customer' 
        ? customers.find(c => c.id === value) 
        : vendors.find(v => v.id === value);
      setFormData(prev => ({ ...prev, partyId: value, partyName: party?.company || party?.name || '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unit: 'pcs', hsnCode: '' }]
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === 'create') {
        dispatch(addChallan(formData));
        setModal({
          isOpen: true,
          type: 'success',
          title: 'Challan Created!',
          message: `Delivery challan ${formData.challanNo} has been successfully generated.`
        });
      } else {
        dispatch(updateChallan({ ...initialData!, ...formData }));
        setModal({
          isOpen: true,
          type: 'success',
          title: 'Update Successful',
          message: 'The challan details have been updated.'
        });
      }
    } catch (err) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Something went wrong while saving the challan.'
      });
    }
  };

  return (
    <div className="card shadow-sm border-0 animate-fade-in">
      <div className="card-body p-4 p-md-5">
        <form onSubmit={handleSubmit}>
          {/* Header Info */}
          <div className="row g-4 mb-5">
            <div className="col-md-3">
              <label className="form-label small fw-800 text-uppercase tracking-wider">Challan #</label>
              <input 
                type="text" 
                className="form-control" 
                name="challanNo" 
                value={formData.challanNo} 
                onChange={handleInputChange} 
                required 
              />
            </div>
            <div className="col-md-3">
              <label className="form-label small fw-800 text-uppercase tracking-wider">Party Type</label>
              <select 
                className="form-select" 
                name="partyType" 
                value={formData.partyType} 
                onChange={(e) => setFormData(prev => ({ ...prev, partyType: e.target.value as any, partyId: '', partyName: '' }))}
              >
                <option value="customer">Customer (Dispatch)</option>
                <option value="vendor">Vendor (Returnable/Job Work)</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-800 text-uppercase tracking-wider">Party / Company</label>
              <select 
                className="form-select" 
                name="partyId" 
                value={formData.partyId} 
                onChange={handleInputChange} 
                required
              >
                <option value="">Select {formData.partyType === 'customer' ? 'Customer' : 'Vendor'}</option>
                {formData.partyType === 'customer' 
                  ? customers.map(c => <option key={c.id} value={c.id}>{c.company} ({c.name})</option>)
                  : vendors.map(v => <option key={v.id} value={v.id}>{v.company} ({v.name})</option>)
                }
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label small fw-800 text-uppercase tracking-wider">Date</label>
              <input 
                type="date" 
                className="form-control" 
                name="date" 
                value={formData.date} 
                onChange={handleInputChange} 
                required 
              />
            </div>
            <div className="col-md-3">
              <label className="form-label small fw-800 text-uppercase tracking-wider">Challan Type</label>
              <select 
                className="form-select" 
                name="type" 
                value={formData.type} 
                onChange={handleInputChange}
              >
                <option value="delivery">Standard Delivery</option>
                <option value="returnable">Returnable</option>
                <option value="job_work">Job Work</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label small fw-800 text-uppercase tracking-wider">Status</label>
              <select 
                className="form-select" 
                name="status" 
                value={formData.status} 
                onChange={handleInputChange}
              >
                <option value="draft">Draft</option>
                <option value="dispatched">Dispatched</option>
                <option value="received">Received</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Items Section */}
          <div className="mb-4">
            <h6 className="fw-800 text-uppercase tracking-widest mb-3 text-accent x-small">Material List</h6>
            <div className="table-responsive">
              <table className="table table-bordered align-middle">
                <thead className="table-light mt-0">
                  <tr>
                    <th>Description</th>
                    <th style={{ width: '120px' }}>Quantity</th>
                    <th style={{ width: '100px' }}>Unit</th>
                    <th style={{ width: '150px' }}>HSN Code</th>
                    <th style={{ width: '50px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => (
                    <tr key={index}>
                      <td className="p-0 border-0">
                        <input 
                          type="text" 
                          className="form-control border-0 rounded-0" 
                          placeholder="Item details..."
                          value={item.description} 
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          required 
                        />
                      </td>
                      <td className="p-0 border-0">
                        <input 
                          type="number" 
                          className="form-control border-0 rounded-0" 
                          value={item.quantity} 
                          onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))}
                          required 
                        />
                      </td>
                      <td className="p-0 border-0">
                        <input 
                          type="text" 
                          className="form-control border-0 rounded-0" 
                          value={item.unit} 
                          onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                          required 
                        />
                      </td>
                      <td className="p-0 border-0">
                        <input 
                          type="text" 
                          className="form-control border-0 rounded-0" 
                          value={item.hsnCode} 
                          onChange={(e) => handleItemChange(index, 'hsnCode', e.target.value)}
                        />
                      </td>
                      <td className="text-center">
                        <button 
                          type="button" 
                          className="btn btn-link text-danger p-0" 
                          onClick={() => removeItem(index)}
                          disabled={formData.items.length === 1}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" className="btn btn-outline-accent btn-sm fw-700" onClick={addItem}>
              <i className="bi bi-plus-lg me-2"></i>Add Line Item
            </button>
          </div>

          {/* Transport Info */}
          <div className="row g-4 mb-5 p-3 rounded-4 bg-light bg-opacity-50 border border-white">
            <div className="col-12">
               <span className="x-small fw-800 text-uppercase tracking-widest text-muted d-block mb-3">Transport & Logistics</span>
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-700">Vehicle Number</label>
              <input 
                type="text" 
                className="form-control" 
                name="vehicleNo" 
                placeholder="MH-12-XX-0000"
                value={formData.vehicleNo} 
                onChange={handleInputChange} 
              />
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-700">Driver Name</label>
              <input 
                type="text" 
                className="form-control" 
                name="driverName" 
                value={formData.driverName} 
                onChange={handleInputChange} 
              />
            </div>
            <div className="col-md-4">
               <label className="form-label small fw-700">Special Notes</label>
               <textarea 
                 className="form-control" 
                 name="notes" 
                 rows={1}
                 value={formData.notes} 
                 onChange={handleInputChange}
               ></textarea>
            </div>
          </div>

          <div className="text-end pt-4 border-top">
            <button type="button" className="btn btn-link text-muted me-3 fw-700 text-decoration-none" onClick={() => router.push('/challan')}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary px-5">
              {mode === 'create' ? 'Generate Challan' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      <StatusModal 
        isOpen={modal.isOpen}
        onClose={() => {
          setModal(prev => ({ ...prev, isOpen: false }));
          if (modal.type === 'success') router.push('/challan');
        }}
        type={modal.type}
        title={modal.title}
        message={modal.message}
      />
    </div>
  );
};

export default ChallanForm;
