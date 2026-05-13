'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '@/redux/store';
import { createInward, updateInward } from '@/redux/features/inwardSlice';
import { addLedgerEntry } from '@/redux/features/ledgerSlice';
import { fetchItems, fetchProcesses } from '@/redux/features/masterSlice';
import { fetchCustomers } from '@/redux/features/customerSlice';
import { InwardEntry, OutwardEntry } from '@/types/modules';
import FullPageStatus from '@/components/FullPageStatus';
import SearchableSelect from '@/components/shared/SearchableSelect';
import { fetchVendors } from '@/redux/features/vendorSlice';
import { fetchOutwards } from '@/redux/features/outwardSlice';



interface InwardFormProps {
  initialData?: InwardEntry;
  mode: 'create' | 'edit' | 'view';
}

const InwardForm: React.FC<InwardFormProps> = ({ initialData, mode }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { items: customers, loading: customersLoading } = useSelector((state: RootState) => state.customers);
  const { items: vendors } = useSelector((state: RootState) => state.vendors);
  const { items: outwards } = useSelector((state: RootState) => state.outward);
  const { user, company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items: masterItems, processes: masterProcesses } = useSelector((state: RootState) => state.master);
  const { token: authToken } = useSelector((state: RootState) => state.auth);

  const [pendingOutwards, setPendingOutwards] = useState<any[]>([]);
  const [outwardLoading, setOutwardLoading] = useState(false);

  const [formData, setFormData] = useState<Omit<InwardEntry, 'id' | 'createdAt'> & { partyType: 'customer' | 'vendor', outwardId?: string, outwardNo?: string }>({
    inwardNo: '',
    partyType: initialData?.customerId ? 'customer' : (initialData?.vendorId ? 'vendor' : 'customer'),
    customerId: '',
    customerName: '',
    address: '',
    vendorId: '',
    vendorName: '',
    outwardId: '',
    outwardNo: '',
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

  const [modal, setModal] = useState<{ 
    isOpen: boolean; 
    type: 'success' | 'error'; 
    title: string; 
    message: string; 
    confirmLabel?: string;
    secondaryLabel?: string;
    onSecondary?: () => void;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    confirmLabel: 'OK',
    secondaryLabel: '',
    onSecondary: undefined
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
      (dispatch as any)(fetchItems({ company_id: activeCompany.id, limit: 1000 }));
      (dispatch as any)(fetchProcesses({ company_id: activeCompany.id, limit: 1000 }));
      (dispatch as any)(fetchCustomers({ company_id: activeCompany.id, limit: 1000 }));
      (dispatch as any)(fetchVendors({ company_id: activeCompany.id, limit: 1000 }));
      (dispatch as any)(fetchOutwards({ company_id: activeCompany.id, limit: 1000 }));
    } else {
      (dispatch as any)(fetchCustomers({}));
      (dispatch as any)(fetchVendors({}));
    }
  }, [dispatch, activeCompany?.id, mode]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        inwardNo: initialData.inwardNo,
        partyType: initialData.customerId ? 'customer' : (initialData.vendorId ? 'vendor' : 'customer'),
        customerId: String(initialData.customerId || ''),
        customerName: initialData.customerName || '',
        vendorId: initialData.vendorId || '',
        vendorName: initialData.vendorName || '',
        outwardId: (initialData as any).outwardId || '',
        outwardNo: (initialData as any).outwardNo || '',
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
    if (name === 'partyType') {
      setFormData(prev => ({
        ...prev,
        partyType: value as 'customer' | 'vendor',
        customerId: '',
        customerName: '',
        vendorId: '',
        vendorName: '',
        outwardId: '',
        outwardNo: '',
        items: [{ description: '', process: '', quantity: 1, unit: 'pcs' }]
      }));
    } else if (name === 'customerId') {
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
    } else if (name === 'vendorId') {
      const vendor = vendors.find(v => v.id === value);
      setFormData(prev => ({
        ...prev,
        vendorId: value,
        vendorName: vendor?.name || '',
        outwardId: '',
        outwardNo: '',
        items: [{ description: '', process: '', quantity: 1, unit: 'pcs' }]
      }));
      fetchPendingForVendor(value);
    } else if (name === 'outwardId') {
      const outward = pendingOutwards.find(o => o.id === value);
      if (outward) {
        setFormData(prev => ({
          ...prev,
          outwardId: value,
          outwardNo: outward.outwardNo,
          items: outward.items.map((it: any) => ({
             description: it.description || it.item_name || '',
             process: it.process || (outward as any).processName || '',
             quantity: it.remainingQty || it.quantity || 0,
             unit: it.unit || 'pcs'
          }))
        }));
      } else {
        setFormData(prev => ({ ...prev, outwardId: '', outwardNo: '' }));
      }
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
          message: "Inward entry created successfully.",
          confirmLabel: 'OK'
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

  const fetchPendingForVendor = async (vId: string) => {
    if (!vId) {
      setPendingOutwards([]);
      return;
    }
    setOutwardLoading(true);
    const activeToken = authToken || localStorage.getItem('token');
    if (activeToken) {
      try {
        const res = await fetch(`/api/outward/pending/${vId}`, {
          headers: {
            'Authorization': `Bearer ${activeToken.replace(/^"|"$/g, '')}`
          }
        });
        const data = await res.json();
        setPendingOutwards(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch pending outwards:', err);
      } finally {
        setOutwardLoading(false);
      }
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
  
            <div className="d-flex justify-content-between align-items-center mb-5 pb-3 border-bottom">
               <h4 className="m-0 text-dark fw-bold">
                 {formData.partyType === 'vendor' ? 'Job Work Return (from Vendor)' : 'Inward Entry'}
               </h4>
               {formData.partyType === 'vendor' && <span className="badge bg-warning text-dark rounded-pill px-3 py-2">STEP 3: RECEIVE BACK FROM VENDOR</span>}
               {formData.partyType === 'customer' && <span className="badge bg-primary rounded-pill px-3 py-2">STEP 1: CUSTOMER INWARD</span>}
            </div>
  
            <div className="row g-4 mb-5 align-items-center">
              <div className="col-md-6 d-flex">
                <label className="form-label mb-0 align-self-center text-muted col-3">Party Type <span className="text-danger">*</span></label>
                <div className="flex-grow-1 d-flex gap-4">
                  <div className="form-check">
                    <input className="form-check-input" type="radio" name="partyType" id="partyCustomer" value="customer" checked={formData.partyType === 'customer'} onChange={handleChange} disabled={mode === 'view'} />
                    <label className="form-check-label small fw-bold text-muted" htmlFor="partyCustomer">CUSTOMER</label>
                  </div>
                  <div className="form-check">
                    <input className="form-check-input" type="radio" name="partyType" id="partyVendor" value="vendor" checked={formData.partyType === 'vendor'} onChange={handleChange} disabled={mode === 'view'} />
                    <label className="form-check-label small fw-bold text-muted" htmlFor="partyVendor">VENDOR (JOB WORK)</label>
                  </div>
                </div>
              </div>
              <div className="col-md-6 d-flex">
                <label className="form-label mb-0 align-self-center text-muted col-3">Date <span className="text-danger">*</span></label>

                <input type="date" className="form-control border-bottom rounded-0 px-2 shadow-none" name="date" value={formData.date} onChange={handleChange} required disabled={mode === 'view'} />
              </div>

              {formData.partyType === 'customer' ? (
                <div className="col-md-6 d-flex">
                  <label className="form-label mb-0 align-self-center text-muted col-3">Customer <span className="text-danger">*</span></label>

                  <SearchableSelect
                    className="flex-grow-1"
                    options={customers.map(c => ({ value: c.id, label: c.company || c.name }))}
                    value={formData.customerId || ''}
                    onChange={(val) => handleChange({ target: { name: 'customerId', value: val } } as any)}
                    placeholder={customersLoading ? 'Loading Customers...' : 'Choose Customer'}
                    disabled={mode === 'view'}
                  />
                </div>
              ) : (
                <div className="col-md-6 d-flex">
                  <label className="form-label mb-0 align-self-center text-muted col-3">Vendor <span className="text-danger">*</span></label>

                  <SearchableSelect
                    className="flex-grow-1"
                    options={vendors.map(v => ({ value: v.id, label: v.name }))}
                    value={formData.vendorId || ''}
                    onChange={(val) => handleChange({ target: { name: 'vendorId', value: val } } as any)}
                    placeholder="Choose Vendor"
                    disabled={mode === 'view'}
                  />
                </div>
              )}
  
              <div className="col-md-6 d-flex">
                <label className="form-label mb-0 align-self-center text-muted col-3">Po No</label>
                <input type="text" className="form-control border-bottom rounded-0 px-2 shadow-none" name="poReference" value={formData.poReference} onChange={handleChange} placeholder="Po No" disabled={mode === 'view'} />
              </div>

              <div className="col-md-6 d-flex">
                <label className="form-label mb-0 align-self-center text-muted col-3">Po Date</label>
                <input type="date" className="form-control border-bottom rounded-0 px-2 shadow-none" name="poDate" value={formData.poDate} onChange={handleChange} disabled={mode === 'view'} />
              </div>
  
              <div className="col-md-6 d-flex">
                <label className="form-label mb-0 align-self-center text-muted col-3">Dc No</label>
                <input type="text" className="form-control border-bottom rounded-0 px-2 shadow-none" name="dcNo" value={formData.dcNo} onChange={handleChange} placeholder="Dc No" disabled={mode === 'view'} />
              </div>

              <div className="col-md-6 d-flex">
                <label className="form-label mb-0 align-self-center text-muted col-3">Dc Date</label>
                <input type="date" className="form-control border-bottom rounded-0 px-2 shadow-none" name="dcDate" value={formData.dcDate} onChange={handleChange} disabled={mode === 'view'} />
              </div>
              <div className="col-md-6 d-flex">
                <label className="form-label mb-0 align-self-center text-muted col-3">Due Date</label>

                <input type="date" className="form-control border-bottom rounded-0 px-2 shadow-none" name="dueDate" value={formData.dueDate} onChange={handleChange} disabled={mode === 'view'} />
              </div>
              <div className="col-md-6 d-flex">
                <label className="form-label mb-0 align-self-center text-muted col-3">Vehicle No</label>
                <input type="text" className="form-control border-bottom rounded-0 px-2 shadow-none" name="vehicleNo" value={formData.vehicleNo} onChange={handleChange} placeholder="Vehicle No" disabled={mode === 'view'} />
              </div>

              {formData.partyType === 'vendor' && (
                <div className="col-md-6 d-flex">
                  <label className="form-label mb-0 align-self-center text-danger fw-bold col-3">OUTWARD REF *</label>
                  <SearchableSelect
                    className="flex-grow-1"
                    options={pendingOutwards
                      .map(o => ({ 
                        value: o.id, 
                        label: `${o.outwardNo} (${o.date ? new Date(o.date).toLocaleDateString() : 'N/A'}) - ${o.totalRemaining || 0} Units Pending` 
                      }))
                    }
                    value={formData.outwardId || ''}
                    onChange={(val) => handleChange({ target: { name: 'outwardId', value: val } } as any)}
                    placeholder={outwardLoading ? 'Loading Pending Dispatches...' : (pendingOutwards.length === 0 ? 'No Pending Dispatches' : 'Select Vendor Challan Reference…')}
                    required={true}
                    disabled={mode === 'view' || !formData.vendorId || pendingOutwards.length === 0}
                  />
                  {outwardLoading && <div className="spinner-border spinner-border-sm text-primary ms-2 align-self-center" role="status"></div>}
                </div>
              )}
            </div>
  
            <div className="mt-5 border-top pt-4 border-bottom pb-4 mb-4">
              <div className="row g-2 mb-3 fw-bold text-muted small">
                <div className="col-md-5">Item</div>
                <div className="col-md-4">Process</div>
                <div className="col-md-2">Qty</div>

                <div className="col-md-1 text-center">Action</div>
              </div>
  
              {formData.items.map((item, index) => (
                <div className="row g-2 mb-3 align-items-center" key={index}>
                  <div className="col-md-5">
                    <SearchableSelect
                      options={[
                        ...masterItems.map(mi => ({ value: mi.itemName, label: `${mi.itemName} (${mi.itemCode})` })),
                        ...(item.description && !masterItems.some(mi => mi.itemName === item.description) 
                          ? [{ value: item.description, label: `${item.description} (Legacy)` }] 
                          : [])
                      ]}
                      value={item.description || ''}
                      onChange={(val) => handleItemChange(index, 'description', val)}
                      placeholder="Select Item"
                      disabled={mode === 'view'}
                    />
                  </div>
                  <div className="col-md-4">
                    <SearchableSelect
                      options={[
                        ...masterProcesses.map(mp => ({ value: mp.processName, label: mp.processName })),
                        ...(item.process && !masterProcesses.some(mp => mp.processName === item.process) 
                          ? [{ value: item.process, label: `${item.process} (Legacy)` }] 
                          : [])
                      ]}
                      value={item.process || ''}
                      onChange={(val) => handleItemChange(index, 'process', val)}
                      placeholder="Select Process"
                      disabled={mode === 'view'}
                    />
                  </div>
                  <div className="col-md-2">
                    <input type="number" className="form-control border-bottom rounded-0 px-2 shadow-none" value={item.quantity} onWheel={(e) => (e.target as HTMLInputElement).blur()} onChange={e => handleItemChange(index, 'quantity', e.target.value)} required disabled={mode === 'view'} />
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
            buttonLabel={modal.confirmLabel}
            secondaryButtonLabel={modal.secondaryLabel}
            onSecondaryAction={modal.onSecondary}
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
