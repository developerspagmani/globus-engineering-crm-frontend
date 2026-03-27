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
import StatusModal from '@/components/StatusModal';

interface InwardFormProps {
  initialData?: InwardEntry;
  mode: 'create' | 'edit';
}

const InwardForm: React.FC<InwardFormProps> = ({ initialData, mode }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { items: customers, loading: customersLoading } = useSelector((state: RootState) => state.customers);
  const { user, company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items: masterItems, processes: masterProcesses } = useSelector((state: RootState) => state.master);

  const [formData, setFormData] = useState<Omit<InwardEntry, 'id' | 'createdAt'>>({
    inwardNo: `INW-${Math.floor(1000 + Math.random() * 9000)}`,
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
    vehicleNo: '',
    company_id: activeCompany?.id || '',
    date: new Date().toISOString().split('T')[0],
    status: 'pending',
    items: [{ description: '', process: '', quantity: 1, unit: 'pcs' }],
  });

  const [modal, setModal] = useState<{ isOpen: boolean; type: 'success' | 'error'; title: string; message: string; confirmLabel?: string }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    confirmLabel: 'Understand'
  });

  useEffect(() => {
    if (activeCompany?.id) {
      (dispatch as any)(fetchItems(activeCompany.id));
      (dispatch as any)(fetchProcesses(activeCompany.id));
      (dispatch as any)(fetchCustomers(activeCompany.id));
      // Also sync formData company context
      setFormData(prev => ({ ...prev, company_id: activeCompany.id }));
    } else {
      // Also allow fetching all if no company context yet (e.g. initial super admin load)
      (dispatch as any)(fetchCustomers());
    }
  }, [dispatch, activeCompany?.id]);

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
    (newItems[index] as any)[field] = value;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 Final Inward Data to submit:', formData);
    try {
      const finalData = { ...formData };
      if (!finalData.company_id && user?.company_id) {
        finalData.company_id = user.company_id;
      }

      console.log('📡 Sending to API:', finalData);

      if (mode === 'create') {
        const result = await (dispatch as any)(createInward(finalData)).unwrap();
        console.log('✅ API result:', result);

        // Auto-post to ledger 
        if (finalData.customerId) {
          (dispatch as any)(addLedgerEntry({
            partyId: finalData.customerId,
            partyName: finalData.customerName || '',
            partyType: 'customer',
            company_id: finalData.company_id,
            date: finalData.date,
            type: 'credit',
            amount: 0,
            description: `Material Receipt: ${finalData.inwardNo}`,
            referenceId: finalData.inwardNo
          } as any));
        }

        setModal({
          isOpen: true,
          type: 'success',
          title: 'Success!',
          message: 'Inward entry has been created successfully.',
          confirmLabel: 'OK'
        });
      } else {
        await (dispatch as any)(updateInward({ ...initialData!, ...finalData })).unwrap();
        setModal({
          isOpen: true,
          type: 'success',
          title: 'Updated!',
          message: 'Inward entry has been updated successfully.'
        });
      }
    } catch (err: any) {
      console.error('❌ Failed to save inward:', err);
      // Detailed error log
      if (err.response) {
        console.error('Data:', err.response.data);
        console.error('Status:', err.response.status);
      }
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: err.message || 'Failed to save inward entry. Please try again.'
      });
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
    <div className="card border-0 shadow-sm bg-white pb-5">
      <div className="card-body p-4 p-md-5">
        <form onSubmit={handleSubmit}>

          <div className="d-flex justify-content-between align-items-center mb-5 pb-3">
            <div></div> {/* placeholder for flex */}
            <h4 className="m-0 text-dark fw-normal" style={{ marginLeft: '120px' }}>Globus Engineering Tools</h4>
            {mode === 'create' && (
              <button type="button" onClick={fillMockData} className="btn btn-sm btn-outline-warning d-flex align-items-center gap-2 rounded-pill px-3">
                <i className="bi bi-magic"></i> Auto-Fill Test Data
              </button>
            )}
          </div>

          <div className="row g-4 mb-5 align-items-center">
            <div className="col-md-6 d-flex">
              <label className="form-label mb-0 align-self-center text-muted col-3">Customer</label>
              <select className="form-select border-0 border-bottom rounded-0 px-2 shadow-none" name="customerId" value={formData.customerId} onChange={handleChange} required>
                <option value="">{customersLoading ? 'Loading Customers...' : ''}</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.company || c.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-6 d-flex">
              <label className="form-label mb-0 align-self-center text-muted col-3">Date</label>
              <input type="date" className="form-control border-0 border-bottom rounded-0 px-2 shadow-none" name="date" value={formData.date} onChange={handleChange} required />
            </div>

            <div className="col-md-6 d-flex">
              <label className="form-label mb-0 align-self-center text-muted col-3">Po No</label>
              <input type="text" className="form-control border-0 border-bottom rounded-0 px-2 shadow-none" name="poReference" value={formData.poReference} onChange={handleChange} placeholder="Po No" />
            </div>
            <div className="col-md-6 d-flex">
              <label className="form-label mb-0 align-self-center text-muted col-3">Po Date</label>
              <input type="date" className="form-control border-0 border-bottom rounded-0 px-2 shadow-none" name="poDate" value={formData.poDate} onChange={handleChange} />
            </div>

            <div className="col-md-6 d-flex">
              <label className="form-label mb-0 align-self-center text-muted col-3">Dc No</label>
              <input type="text" className="form-control border-0 border-bottom rounded-0 px-2 shadow-none" name="dcNo" value={formData.dcNo} onChange={handleChange} placeholder="Dc No" />
            </div>
            <div className="col-md-6 d-flex">
              <label className="form-label mb-0 align-self-center text-muted col-3">Dc Date</label>
              <input type="date" className="form-control border-0 border-bottom rounded-0 px-2 shadow-none" name="dcDate" value={formData.dcDate} onChange={handleChange} />
            </div>
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
                  <select className="form-select border-0 border-bottom rounded-0 px-2 shadow-none text-muted" value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} required>
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
                  <select className="form-select border-0 border-bottom rounded-0 px-2 shadow-none text-muted" value={item.process} onChange={e => handleItemChange(index, 'process', e.target.value)} required>
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
                  <input type="number" className="form-control border-0 border-bottom rounded-0 px-2 shadow-none" value={item.quantity || ''} onChange={e => handleItemChange(index, 'quantity', parseFloat(e.target.value))} required />
                </div>
                <div className="col-md-1 text-center">
                  <button type="button" className="btn btn-link text-danger p-0 border-0 fs-5 text-decoration-none shadow-none" onClick={() => removeItem(index)} disabled={formData.items.length === 1}>
                    <i className="bi bi-x"></i>
                  </button>
                </div>
              </div>
            ))}

            <div className="text-end mt-4">
              <button type="button" className="btn btn-link text-success text-decoration-none fw-semibold p-0 shadow-none" onClick={addItem}>
                <i className="bi bi-plus fs-5 align-middle"></i> Add New Row
              </button>
            </div>
          </div>

          <div className="mt-5 text-center d-flex justify-content-center gap-3">
            <button type="submit" className="btn btn-success px-4 rounded-1" style={{ minWidth: '100px' }}>{mode === 'create' ? 'ADD' : 'SAVE'}</button>
            <button type="button" className="btn btn-danger px-4 rounded-1" style={{ minWidth: '100px' }} onClick={() => mode === 'create' ? setFormData({ ...formData, poReference: '', dcNo: '', poDate: '', dcDate: '', items: [{ description: '', process: '', quantity: 1, unit: 'pcs' }] } as any) : router.push('/inward')}>RESET</button>
          </div>
        </form>
      </div>

      <StatusModal
        isOpen={modal.isOpen}
        onClose={() => {
          setModal(prev => ({ ...prev, isOpen: false }));
          if (modal.type === 'success') router.push('/inward');
        }}
        type={modal.type}
        title={modal.title}
        message={modal.message}
      />
    </div>
  );
};

export default InwardForm;
