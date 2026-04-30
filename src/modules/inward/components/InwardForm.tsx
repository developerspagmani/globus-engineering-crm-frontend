'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '@/redux/store';
import { createInward, updateInward } from '@/redux/features/inwardSlice';
import { addLedgerEntry } from '@/redux/features/ledgerSlice';
import { fetchItems, fetchProcesses } from '@/redux/features/masterSlice';
import { fetchCustomers } from '@/redux/features/customerSlice';
import { InwardEntry } from '@/types/modules';
import FullPageStatus from '@/components/FullPageStatus';



interface InwardFormProps {
  initialData?: InwardEntry;
  mode: 'create' | 'edit' | 'view';
}

const InwardForm: React.FC<InwardFormProps> = ({ initialData, mode }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { items: customers, loading: customersLoading } = useSelector((state: RootState) => state.customers);
  const { user, company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items: masterItems, processes: masterProcesses } = useSelector((state: RootState) => state.master);

  const [formData, setFormData] = useState<Omit<InwardEntry, 'id' | 'createdAt'>>({
    inwardNo: '',
    customerId: '',
    customerName: '',
    address: '',
    vendorId: '',
    vendorName: '',
    poReference: '',
    poDate: '',
    challanNo: '',
    dcNo: '',
    dcDate: '',
    dueDate: '',
    vehicleNo: '',
    company_id: '',
    date: new Date().toISOString().split('T')[0],
    status: 'pending',
    items: [{ description: '', process: '', quantity: 1, unit: 'pcs' }],
  });

  const [modal, setModal] = useState<{ isOpen: boolean; type: 'success' | 'error'; title: string; message: string; confirmLabel?: string }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    confirmLabel: 'OK'
  });



  useEffect(() => {
    if (activeCompany?.id) {
      if (mode === 'create' && !formData.inwardNo) {
        setFormData(prev => ({ 
          ...prev, 
          company_id: activeCompany.id,
          inwardNo: `INW-${Math.floor(1000 + Math.random() * 9000)}`
        }));
      } else {
        setFormData(prev => ({ ...prev, company_id: activeCompany.id }));
      }
      (dispatch as any)(fetchItems(activeCompany.id));
      (dispatch as any)(fetchProcesses(activeCompany.id));
      (dispatch as any)(fetchCustomers(activeCompany.id));
    } else {
      (dispatch as any)(fetchCustomers());
    }
  }, [dispatch, activeCompany?.id, mode]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        inwardNo: initialData.inwardNo,
        customerId: String(initialData.customerId || ''),
        customerName: initialData.customerName || '',
        vendorId: initialData.vendorId || '',
        vendorName: initialData.vendorName || '',
        poReference: initialData.poReference || '',
        poDate: initialData.poDate || '',
        challanNo: initialData.challanNo || '',
        dcNo: initialData.dcNo || '',
        dcDate: initialData.dcDate || '',
        dueDate: initialData.dueDate || '',
        vehicleNo: initialData.vehicleNo || '',
        company_id: initialData.company_id || '',
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
      const addressParts = [
        customer?.street1,
        customer?.city,
        customer?.state
      ].filter(Boolean);

      setFormData(prev => ({
        ...prev,
        customerId: value,
        customerName: customer?.name || '',
        address: addressParts.join(', ') || ''
      }));
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
      items: [...prev.items, { description: '', process: '', quantity: 1, unit: 'pcs' }]
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
      const finalData = { ...formData };
      if (!finalData.company_id && user?.company_id) {
        finalData.company_id = user.company_id;
      }

      if (mode === 'create') {
        const result = await (dispatch as any)(createInward(finalData)).unwrap();
        setModal({
          isOpen: true,
          type: 'success',
          title: 'Success!',
          message: "Inward entry created successfully."
        });
      } else {
        await (dispatch as any)(updateInward({ ...initialData!, ...finalData })).unwrap();
        setModal({
          isOpen: true,
          type: 'success',
          title: 'Success!',
          message: "Inward entry updated successfully."
        });
      }

    } catch (err: any) {

      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: err.message || 'Failed to save inward entry. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillMockData = () => {
    setFormData(prev => ({
      ...prev,
      customerId: customers[0]?.id || '',
      customerName: customers[0]?.company || customers[0]?.name || '',
      poReference: '40125263002803',
      poDate: new Date().toISOString().split('T')[0],
      dcNo: '4126700808',
      dcDate: new Date().toISOString().split('T')[0],
      date: new Date().toISOString().split('T')[0],
      items: [{ description: 'Raw Material', process: 'Machining', quantity: 15, unit: 'pcs' }]
    }));
  };

   return (

    <>
      <div className="card border-0 shadow-sm bg-white pb-5">
        <div className="card-body p-4 p-md-5">
          <form onSubmit={handleSubmit}>
  
            {/* <div className="d-flex justify-content-between align-items-center mb-5 pb-3"> */}
              <div></div> {/* placeholder for flex */}
              {/* <h4 className="m-0 text-dark fw-normal" style={{ marginLeft: '120px' }}>Globus Engineering Tools</h4> */}
              
            {/* </div> */}
  
            <div className="row g-4 mb-5 align-items-center">
              <div className="col-md-6 d-flex">
                <label className="form-label mb-0 align-self-center text-muted col-3">Customer <span className="text-danger">*</span></label>

                <select className="form-select border-bottom rounded-0 px-2 shadow-none" name="customerId" value={formData.customerId} onChange={handleChange} required disabled={mode === 'view'}>
                  <option value="">{customersLoading ? 'Loading Customers...' : 'Choose Customer'}</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.company || c.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-6 d-flex">
                <label className="form-label mb-0 align-self-center text-muted col-3">Date <span className="text-danger">*</span></label>

                <input type="date" className="form-control border-bottom rounded-0 px-2 shadow-none" name="date" value={formData.date} onChange={handleChange} required disabled={mode === 'view'} />
              </div>
  
              <div className="col-md-6 d-flex">
                <label className="form-label mb-0 align-self-center text-muted col-3">Po No <span className="text-danger">*</span></label>
                <input type="text" className="form-control border-bottom rounded-0 px-2 shadow-none" name="poReference" value={formData.poReference} onChange={handleChange} placeholder="Po No" required disabled={mode === 'view'} />
              </div>

              <div className="col-md-6 d-flex">
                <label className="form-label mb-0 align-self-center text-muted col-3">Po Date <span className="text-danger">*</span></label>
                <input type="date" className="form-control border-bottom rounded-0 px-2 shadow-none" name="poDate" value={formData.poDate} onChange={handleChange} required disabled={mode === 'view'} />
              </div>
  
              <div className="col-md-6 d-flex">
                <label className="form-label mb-0 align-self-center text-muted col-3">Dc No <span className="text-danger">*</span></label>
                <input type="text" className="form-control border-bottom rounded-0 px-2 shadow-none" name="dcNo" value={formData.dcNo} onChange={handleChange} placeholder="Dc No" required disabled={mode === 'view'} />
              </div>

              <div className="col-md-6 d-flex">
                <label className="form-label mb-0 align-self-center text-muted col-3">Dc Date <span className="text-danger">*</span></label>
                <input type="date" className="form-control border-bottom rounded-0 px-2 shadow-none" name="dcDate" value={formData.dcDate} onChange={handleChange} required disabled={mode === 'view'} />
              </div>
              <div className="col-md-6 d-flex">
                <label className="form-label mb-0 align-self-center text-muted col-3">Due Date <span className="text-danger">*</span></label>

                <input type="date" className="form-control border-bottom rounded-0 px-2 shadow-none" name="dueDate" value={formData.dueDate} onChange={handleChange} disabled={mode === 'view'} required />
              </div>
              <div className="col-md-6 d-flex">
                <label className="form-label mb-0 align-self-center text-muted col-3">Vehicle No <span className="text-danger">*</span></label>
                <input type="text" className="form-control border-bottom rounded-0 px-2 shadow-none" name="vehicleNo" value={formData.vehicleNo} onChange={handleChange} placeholder="Vehicle No" required disabled={mode === 'view'} />
              </div>
            </div>
  
            <div className="mt-5 border-top pt-4 border-bottom pb-4 mb-4">
              <div className="row g-2 mb-3 fw-bold text-muted small">
                <div className="col-md-5">Item <span className="text-danger">*</span></div>
                <div className="col-md-4">Process <span className="text-danger">*</span></div>
                <div className="col-md-2">Qty <span className="text-danger">*</span></div>

                <div className="col-md-1 text-center">Action</div>
              </div>
  
              {formData.items.map((item, index) => (
                <div className="row g-2 mb-3 align-items-center" key={index}>
                  <div className="col-md-5">
                    <select className="form-select border-bottom rounded-0 px-2 shadow-none text-muted" value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} required disabled={mode === 'view'}>
                      <option value="">Select Item</option>
                      {masterItems.map(mi => (
                        <option key={mi.id} value={mi.itemName}>{mi.itemName} ({mi.itemCode})</option>
                      ))}
                      {item.description && !masterItems.some(mi => mi.itemName === item.description) && (
                        <option value={item.description}>{item.description} (Legacy)</option>
                      )}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <select className="form-select border-bottom rounded-0 px-2 shadow-none text-muted" value={item.process} onChange={e => handleItemChange(index, 'process', e.target.value)} required disabled={mode === 'view'}>
                      <option value="">Select Process</option>
                      {masterProcesses.map(mp => (
                        <option key={mp.id} value={mp.processName}>{mp.processName}</option>
                      ))}
                      {item.process && !masterProcesses.some(mp => mp.processName === item.process) && (
                        <option value={item.process}>{item.process} (Legacy)</option>
                      )}
                    </select>
                  </div>
                  <div className="col-md-2">
                    <input type="number" className="form-control border-bottom rounded-0 px-2 shadow-none" value={item.quantity || ''} onChange={e => handleItemChange(index, 'quantity', parseFloat(e.target.value))} required disabled={mode === 'view'} />
                  </div>
                  <div className="col-md-1 text-center">
                    {mode !== 'view' && (
                      <button type="button" className="btn btn-link text-danger p-0 border-0 fs-5 text-decoration-none shadow-none" onClick={() => removeItem(index)} disabled={formData.items.length === 1}>
                        <i className="bi bi-x"></i>
                      </button>
                    )}
                  </div>
                </div>
              ))}
  
              {mode !== 'view' && (
                <div className="text-end mt-4">
                  <button type="button" className="btn btn-link text-success text-decoration-none fw-semibold p-0 shadow-none" onClick={addItem}>
                    <i className="bi bi-plus fs-5 align-middle"></i> Add New Row
                  </button>
                </div>
              )}
            </div>
  
            <div className="mt-5 text-center d-flex justify-content-center gap-3">
              {mode !== 'view' && (
                <>
                  <button 
                  type="submit" 
                  className="btn btn-primary px-5 py-2 rounded-pill fw-bold shadow-sm d-flex align-items-center gap-2" 
                  disabled={isSubmitting}
                  style={{ backgroundColor: 'var(--accent-color)', border: 'none', minWidth: '150px' }}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      <span>SUBMITTING...</span>
                    </>
                  ) : (
                    mode === 'create' ? 'SUBMIT' : 'UPDATE'
                  )}
                </button>
                <button type="button" className="btn btn-light px-5 py-2 rounded-pill fw-bold border" onClick={() => mode === 'create' ? setFormData({ ...formData, poReference: '', dcNo: '', poDate: '', dcDate: '', items: [{ description: '', process: '', quantity: 1, unit: 'pcs' }] } as any) : router.push('/inward')}>CLEAR</button>
              </>
              )}
              {mode === 'view' && (
                <button type="button" className="btn btn-secondary px-4 rounded-1" onClick={() => router.push('/inward')}>BACK</button>
              )}
            </div>
          </form>
        </div>
  
        {modal.isOpen && (
          <FullPageStatus
            type={modal.type}
            title={modal.title}
            message={modal.message}
            onClose={() => {
              setModal(prev => ({ ...prev, isOpen: false }));
              if (modal.type === 'success') router.push('/inward');
            }}
          />
        )}

      </div>
      <style jsx>{`
          .form-label {
            font-size: 0.75rem;
            font-weight: 600;
            letter-spacing: 0.02em;
            text-transform: uppercase;
          }
          .form-control, .form-select {
            font-size: 0.85rem;
            height: 38px;
            padding-top: 0;
            padding-bottom: 0;
          }
          .card-body {
            padding-top: 2rem !important;
          }
      `}</style>
    </>
  );
};

export default InwardForm;
