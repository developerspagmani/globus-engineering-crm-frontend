'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '@/redux/store';
import { fetchCustomers } from '@/redux/features/customerSlice';
import { fetchVendors } from '@/redux/features/vendorSlice';
import { createChallan, updateChallan } from '@/redux/features/challanSlice';
import { fetchItems } from '@/redux/features/masterSlice';
import { Challan } from '@/types/modules';
import FullPageStatus from '@/components/FullPageStatus';
import SearchableSelect from '@/components/shared/SearchableSelect';


interface ChallanFormProps {
  initialData?: Challan;
  mode: 'create' | 'edit' | 'view';
}

const ChallanForm: React.FC<ChallanFormProps> = ({ initialData, mode }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items: customers } = useSelector((state: RootState) => state.customers);
  const { items: vendors } = useSelector((state: RootState) => state.vendors);
  const { items: masterItems } = useSelector((state: RootState) => state.master);

  // Use String comparison to handle both numeric and string IDs correctly
  const companyCustomers = customers.filter(c => !activeCompany || String(c.company_id || (c as any).companyId) === String(activeCompany.id));
  const companyVendors = vendors.filter(v => !activeCompany || String(v.company_id || (v as any).companyId) === String(activeCompany.id));

  // Ensure data is fetched if not present
  useEffect(() => {
    if (activeCompany?.id) {
       if (customers.length === 0) dispatch(fetchCustomers({ company_id: activeCompany.id }) as any);
       if (vendors.length === 0) dispatch(fetchVendors({ company_id: activeCompany.id }) as any);
       if (masterItems.length === 0) (dispatch as any)(fetchItems({ company_id: activeCompany.id, limit: 1000 }));
    }
  }, [activeCompany?.id, dispatch, customers.length, vendors.length, masterItems.length]);

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

  // Handle Automatic Pre-fill and Auto-Submit from Inward
  const autoSubmitRef = useRef(false);

  useEffect(() => {
    if (mode === 'create' && !initialData && !autoSubmitRef.current) {
      const savedData = localStorage.getItem('inward_auto_challan');
      if (savedData) {
        try {
          const inward = JSON.parse(savedData);
          const autoData = {
            ...formData,
            partyId: inward.partyId || '',
            partyName: inward.partyName || '',
            partyType: inward.partyType || 'customer',
            items: inward.items.map((it: any) => ({
              description: it.description || it.item_name || '',
              quantity: it.quantity || 1,
              unit: it.unit || 'pcs',
              hsnCode: ''
            })),
            vehicleNo: inward.vehicleNo || '',
            notes: `Generated automatically from Inward #${inward.inwardNo}`
          };
          
          setFormData(autoData);
          autoSubmitRef.current = true;
          
          // Clear storage immediately
          localStorage.removeItem('inward_auto_challan');

          // Trigger submission automatically
          const performAutoSubmit = async () => {
             setIsSubmitting(true);
             try {
                const uniqueId = `dc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                await dispatch(createChallan({ ...autoData, id: uniqueId, company_id: activeCompany?.id || '' } as any) as any).unwrap();
                setModal({
                   isOpen: true,
                   type: 'success',
                   title: 'Challan Generated!',
                   message: `Challan #${autoData.challanNo} has been generated automatically from Inward #${inward.inwardNo}.`
                });
             } catch (err: any) {
                setModal({
                   isOpen: true,
                   type: 'error',
                   title: 'Auto-Generation Failed',
                   message: err || 'Could not generate challan automatically. Please fill manually.'
                });
             } finally {
                setIsSubmitting(false);
             }
          };

          // Delay slightly to ensure Redux/State is ready
          setTimeout(performAutoSubmit, 500);

        } catch (e) {
          console.error("Failed to parse auto-challan data", e);
        }
      }
    }
  }, [mode, initialData, activeCompany?.id, dispatch]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        challanNo: initialData.challanNo || '',
        partyId: initialData.partyId || '',
        partyName: initialData.partyName || '',
        partyType: initialData.partyType || 'customer',
        company_id: initialData.company_id || activeCompany?.id || '',
        date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        type: initialData.type || 'delivery',
        status: initialData.status || 'draft',
        items: initialData.items && initialData.items.length > 0 ? initialData.items : [{ description: '', quantity: 1, unit: 'pcs', hsnCode: '' }],
        vehicleNo: initialData.vehicleNo || '',
        driverName: initialData.driverName || '',
        notes: initialData.notes || '',
      });
    }
  }, [initialData, activeCompany?.id]);

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

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (mode === 'create') {
        const uniqueId = `dc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const result = await dispatch(createChallan({ ...formData, id: uniqueId, company_id: activeCompany?.id || '' } as any) as any).unwrap();
        if (result) {
          setModal({
            isOpen: true,
            type: 'success',
            title: 'Challan Created!',
            message: `Delivery challan ${formData.challanNo} has been successfully generated.`
          });
        }
      } else {
        await dispatch(updateChallan({ ...initialData!, ...formData, company_id: activeCompany?.id || initialData?.company_id || '' }) as any).unwrap();
        setModal({
          isOpen: true,
          type: 'success',
          title: 'Update Successful',
          message: 'The challan details have been updated.'
        });
      }
    } catch (err: any) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error Saving Challan',
        message: err || 'Something went wrong while saving the challan.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card shadow-sm border-0 animate-fade-in">
      <div className="card-body p-4 p-md-5">
        <form onSubmit={handleSubmit}>
          {/* Header Info */}
          <div className="row g-4 mb-5">
            <div className="col-md-3">
              <label className="form-label small fw-800 text-uppercase tracking-wider">Challan # <span className="text-danger">*</span></label>
              <input 
                type="text" 
                className="form-control" 
                name="challanNo" 
                value={formData.challanNo} 
                onChange={handleInputChange} 
                required 
                disabled={mode === 'view'}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label small fw-800 text-uppercase tracking-wider">Party Type <span className="text-danger">*</span></label>
              <select 
                className="form-select" 
                name="partyType" 
                value={formData.partyType} 
                onChange={(e) => setFormData(prev => ({ ...prev, partyType: e.target.value as any, partyId: '', partyName: '' }))}
                disabled={mode === 'view'}
              >
                <option value="customer">Customer (Dispatch)</option>
                <option value="vendor">Vendor (Returnable/Job Work)</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-800 text-uppercase tracking-wider">Party / Company <span className="text-danger">*</span></label>
              <SearchableSelect
                options={(formData.partyType === 'customer' ? companyCustomers : companyVendors).map(p => ({ 
                  value: p.id, 
                  label: p.company || p.name 
                }))}
                value={formData.partyId}
                onChange={(val) => handleInputChange({ target: { name: 'partyId', value: val } } as any)}
                placeholder={`Select ${formData.partyType === 'customer' ? 'Customer' : 'Vendor'}`}
                disabled={mode === 'view'}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label small fw-800 text-uppercase tracking-wider">Date <span className="text-danger">*</span></label>
              <input 
                type="date" 
                className="form-control" 
                name="date" 
                value={formData.date} 
                onChange={handleInputChange} 
                required 
                disabled={mode === 'view'}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label small fw-800 text-uppercase tracking-wider">Challan Type</label>
              <select 
                className="form-select" 
                name="type" 
                value={formData.type} 
                onChange={handleInputChange}
                disabled={mode === 'view'}
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
                disabled={mode === 'view'}
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
                    <th className="px-3">Description</th>
                    <th className="text-center" style={{ width: '120px' }}>Quantity</th>
                    <th className="text-center" style={{ width: '100px' }}>Unit</th>
                    <th className="text-center" style={{ width: '150px' }}>HSN Code</th>
                    <th style={{ width: '50px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2">
                        <SearchableSelect
                          options={masterItems.map(mi => ({ value: mi.itemName, label: `${mi.itemName} (${mi.itemCode})` }))}
                          value={item.description || ''}
                          onChange={(val) => handleItemChange(index, 'description', val)}
                          placeholder="Select Item"
                          disabled={mode === 'view'}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input 
                          type="number" 
                          className="form-control text-center" 
                          value={item.quantity} 
                          onWheel={(e) => (e.target as HTMLInputElement).blur()}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          required 
                          disabled={mode === 'view'}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input 
                          type="text" 
                          className="form-control text-center" 
                          value={item.unit || ''} 
                          onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                          required 
                          disabled={mode === 'view'}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input 
                          type="text" 
                          className="form-control text-center" 
                          value={item.hsnCode || ''} 
                          onChange={(e) => handleItemChange(index, 'hsnCode', e.target.value)}
                          disabled={mode === 'view'}
                        />
                      </td>
                      <td className="text-center py-2">
                        <button 
                          type="button" 
                          className="btn btn-link text-danger p-0" 
                          onClick={() => removeItem(index)}
                          disabled={formData.items.length === 1}
                        >
                          <i className="bi bi-trash fs-5"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {mode !== 'view' && (
              <button type="button" className="btn btn-outline-accent btn-sm fw-700" onClick={addItem}>
                <i className="bi bi-plus-lg me-2"></i>Add Line Item
              </button>
            )}
          </div>

          {/* Transport Info */}
          <div className="row g-4 mb-5 p-3 rounded-4 bg-light bg-opacity-50 border border-white">
            <div className="col-12">
               <span className="x-small fw-800 text-uppercase tracking-widest text-muted d-block mb-3">Transport & Logistics</span>
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-700">Vehicle Number <span className="text-danger">*</span></label>
              <input 
                type="text" 
                className="form-control" 
                name="vehicleNo" 
                placeholder="MH-12-XX-0000"
                value={formData.vehicleNo} 
                onChange={handleInputChange} 
                required
                disabled={mode === 'view'}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-700">Driver Name <span className="text-danger">*</span></label>
              <input 
                type="text" 
                className="form-control" 
                name="driverName" 
                value={formData.driverName} 
                onChange={handleInputChange} 
                required
                disabled={mode === 'view'}
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
                 disabled={mode === 'view'}
               ></textarea>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4">
            {mode !== 'view' ? (
              <>
                <button type="button" className="btn btn-light px-5 py-2 rounded-pill fw-bold border" onClick={() => router.push('/challan')}>CLEAR</button>
                <button type="submit" className="btn btn-primary px-5 py-2 rounded-pill fw-bold shadow-sm" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      SUBMITTING...
                    </>
                  ) : (
                    mode === 'create' ? 'SUBMIT' : 'SAVE CHANGES'
                  )}
                </button>
              </>
            ) : (
              <button type="button" className="btn btn-secondary px-5 py-2 rounded-pill fw-bold shadow-sm" onClick={() => router.push('/challan')}>BACK TO LIST</button>
            )}
          </div>
        </form>
      </div>

      <style jsx>{`
        .form-control, .form-select {
          height: 40px !important;
          min-height: 40px !important;
          display: flex !important;
          align-items: center !important;
          padding-top: 0 !important;
          padding-bottom: 0 !important;
        }
        .table thead th {
          background-color: #f8fafc !important;
          color: #475569 !important;
          font-size: 0.7rem !important;
          font-weight: 800 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          padding-top: 12px !important;
          padding-bottom: 12px !important;
          border-top: none !important;
        }
        .table tbody td {
          vertical-align: middle !important;
        }
      `}</style>

      {modal.isOpen && (
        <FullPageStatus
          type={modal.type}
          title={modal.title}
          message={modal.message}
          onClose={() => {
            setModal(prev => ({ ...prev, isOpen: false }));
            if (modal.type === 'success') router.push('/challan');
          }}
        />
      )}

    </div>
  );
};

export default ChallanForm;

