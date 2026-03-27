'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { fetchPriceFixings, createPriceFixingThunk, updatePriceFixingThunk, deletePriceFixingThunk, fetchItems, fetchProcesses } from '@/redux/features/masterSlice';
import { fetchCustomers } from '@/redux/features/customerSlice';
import Breadcrumb from '@/components/Breadcrumb';
import ModuleGuard from '@/components/ModuleGuard';

export default function PriceFixingPage() {
  const dispatch = useDispatch();
  const { priceFixings, items, processes, loading } = useSelector((state: RootState) => state.master);
  const { items: customers } = useSelector((state: RootState) => state.customers);
  const { company } = useSelector((state: RootState) => state.auth);
  
  const [view, setView] = useState<'add' | 'list'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ 
    customerId: '', 
    itemId: '', 
    processId: '', 
    price: '' 
  });

  useEffect(() => {
    (dispatch as any)(fetchPriceFixings(company?.id));
    (dispatch as any)(fetchItems(company?.id));
    (dispatch as any)(fetchProcesses(company?.id));
    (dispatch as any)(fetchCustomers());
  }, [dispatch, company?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (company?.id) {
      const customer = customers.find(c => String(c.id) === formData.customerId);
      const item = items.find(i => String(i.id) === formData.itemId);
      const process = processes.find(p => String(p.id) === formData.processId);

      const payload = { 
        ...formData, 
        customerName: customer?.name || '',
        itemName: item?.itemName || '',
        processName: process?.processName || '',
        company_id: company.id 
      };

      if (editingId) {
        await (dispatch as any)(updatePriceFixingThunk({ id: editingId, ...payload }));
        setEditingId(null);
      } else {
        await (dispatch as any)(createPriceFixingThunk(payload));
      }
      setFormData({ customerId: '', itemId: '', processId: '', price: '' });
      setView('list');
    } else {
      alert("Please select a company from the top navigation first.");
    }
  };

  const handleEdit = (pf: any) => {
    setEditingId(pf.id);
    setFormData({ 
      customerId: String(pf.customerId), 
      itemId: String(pf.itemId), 
      processId: String(pf.processId), 
      price: String(pf.price) 
    });
    setView('add');
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this price fixing entry?')) {
      (dispatch as any)(deletePriceFixingThunk(id));
    }
  };

  const filteredPriceFixings = priceFixings.filter(pf => 
    pf.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pf.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pf.processName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ModuleGuard moduleId="mod_price_fixing">
      <div className="bg-white min-vh-100">
        {/* Header Section */}
        <div className="px-4 py-3 border-bottom d-flex justify-content-between align-items-center">
          <h4 className="mb-0 text-dark" style={{ fontSize: '1.5rem' }}>Price Fixing Details</h4>
          <div className="d-flex gap-2">
            <button
              onClick={() => { setView('add'); setEditingId(null); setFormData({ customerId: '', itemId: '', processId: '', price: '' }); }}
              className={`btn d-flex align-items-center gap-1 text-white px-3 py-2 fw-bold rounded-1 transition-all ${view === 'add' && !editingId ? 'opacity-100 shadow-sm' : 'opacity-80'}`}
              style={{ backgroundColor: '#da3e00', border: 'none', fontSize: '0.85rem' }}
            >
              <i className="bi bi-plus" style={{ fontSize: '1.2rem' }}></i>
              <span>ADD</span>
            </button>
            <button
              onClick={() => setView('list')}
              className={`btn d-flex align-items-center gap-1 text-white px-3 py-2 fw-bold rounded-1 transition-all ${view === 'list' ? 'opacity-100 shadow-sm' : 'opacity-80'}`}
              style={{ backgroundColor: '#475569', border: 'none', fontSize: '0.85rem' }}
            >
              <i className="bi bi-arrow-repeat" style={{ fontSize: '1.1rem' }}></i>
              <span>LIST</span>
            </button>
          </div>
        </div>

        <div className="p-5">
          {view === 'add' ? (
            <div className="mx-auto" style={{ maxWidth: '900px', marginTop: '40px' }}>
              <div className="mb-4">
                <h5 className="fw-bold text-primary">{editingId ? 'Edit Price Fixing' : 'Add New Price Fixing'}</h5>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="row mb-5 align-items-center">
                  <div className="col-md-3">
                    <label className="text-dark fw-normal" style={{ fontSize: '1.1rem' }}>Customer</label>
                  </div>
                  <div className="col-md-9">
                    <select
                      required
                      className="form-select border-0 border-bottom rounded-0 px-0 shadow-none bg-transparent"
                      style={{ borderBottomColor: '#ddd !important', fontSize: '1.1rem', color: '#888' }}
                      value={formData.customerId}
                      onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                    >
                      <option value="">Select Customer</option>
                      {customers.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="row mb-5 align-items-center">
                  <div className="col-md-3">
                    <label className="text-dark fw-normal" style={{ fontSize: '1.1rem' }}>Item</label>
                  </div>
                  <div className="col-md-9">
                    <select
                      required
                      className="form-select border-0 border-bottom rounded-0 px-0 shadow-none bg-transparent"
                      style={{ borderBottomColor: '#ddd !important', fontSize: '1.1rem', color: '#888' }}
                      value={formData.itemId}
                      onChange={(e) => setFormData({ ...formData, itemId: e.target.value })}
                    >
                      <option value="">Select Item</option>
                      {items.map(i => <option key={i.id} value={String(i.id)}>{i.itemName}</option>)}
                    </select>
                  </div>
                </div>

                <div className="row mb-5 align-items-center">
                  <div className="col-md-3">
                    <label className="text-dark fw-normal" style={{ fontSize: '1.1rem' }}>Process</label>
                  </div>
                  <div className="col-md-9">
                    <select
                      required
                      className="form-select border-0 border-bottom rounded-0 px-0 shadow-none bg-transparent"
                      style={{ borderBottomColor: '#ddd !important', fontSize: '1.1rem', color: '#888' }}
                      value={formData.processId}
                      onChange={(e) => setFormData({ ...formData, processId: e.target.value })}
                    >
                      <option value="">Select Process</option>
                      {processes.map(p => <option key={p.id} value={String(p.id)}>{p.processName}</option>)}
                    </select>
                  </div>
                </div>

                <div className="row mb-5 align-items-center">
                  <div className="col-md-3">
                    <label className="text-dark fw-normal" style={{ fontSize: '1.1rem' }}>Price</label>
                  </div>
                  <div className="col-md-9">
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="Price"
                      className="form-control border-0 border-bottom rounded-0 px-0 shadow-none"
                      style={{ borderBottomColor: '#ddd !important', fontSize: '1.1rem', color: '#888' }}
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-center gap-3 mt-5">
                  <button
                    type="submit"
                    className="btn px-4 py-2 text-white fw-bold rounded-1"
                    style={{ backgroundColor: '#da3e00', border: 'none', minWidth: '100px' }}
                  >
                    {editingId ? 'UPDATE' : 'ADD'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setFormData({ customerId: '', itemId: '', processId: '', price: '' }); setEditingId(null); }}
                    className="btn px-4 py-2 text-white fw-bold rounded-1"
                    style={{ backgroundColor: '#475569', border: 'none', minWidth: '100px' }}
                  >
                    {editingId ? 'CANCEL' : 'RESET'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="animate-fade-in">
              <div className="d-flex justify-content-end mb-4">
                <div className="input-group" style={{ maxWidth: '300px' }}>
                  <span className="input-group-text bg-white border-end-0">
                    <i className="bi bi-search text-muted"></i>
                  </span>
                  <input
                    type="text"
                    placeholder="Search pricing..."
                    className="form-control border-start-0 shadow-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="table-responsive rounded-2 border mx-auto p-1" style={{ maxWidth: '900px' }}>
                <table className="table table-hover align-middle mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="px-4 py-2 text-uppercase small fw-bold" style={{ width: '60px' }}>Sno</th>
                      <th className="px-4 py-2 text-uppercase small fw-bold">Customer</th>
                      <th className="px-4 py-2 text-uppercase small fw-bold">Item</th>
                      <th className="px-4 py-2 text-uppercase small fw-bold">Process</th>
                      <th className="px-4 py-2 text-uppercase small fw-bold text-end">Price</th>
                      <th className="px-4 py-2 text-uppercase small fw-bold text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="text-center py-5">
                          <div className="spinner-border spinner-border-sm text-primary"></div>
                        </td>
                      </tr>
                    ) : filteredPriceFixings.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-5 text-muted">No pricing records found</td>
                      </tr>
                    ) : (
                      filteredPriceFixings.map((pf, index) => (
                        <tr key={pf.id}>
                          <td className="px-4 py-3 text-muted">{index + 1}</td>
                          <td className="px-4 py-3 fw-bold">{pf.customerName}</td>
                          <td className="px-4 py-3">{pf.itemName}</td>
                          <td className="px-4 py-3 text-muted italic">{pf.processName}</td>
                          <td className="px-4 py-3 text-end fw-bold text-success">₹ {Number(pf.price).toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3 text-end">
                            <div className="d-flex justify-content-end gap-2">
                              <button onClick={() => handleEdit(pf)} className="btn-action-edit" title="Edit">
                                <i className="bi bi-pencil-fill"></i>
                              </button>
                              <button onClick={() => handleDelete(pf.id)} className="btn-action-delete" title="Delete">
                                <i className="bi bi-x-lg"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .transition-all { transition: all 0.2s ease; }
        .form-control:focus {
           border-bottom-color: #9C27B0 !important;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in { animation: fadeIn 0.4s ease; }
      `}</style>
    </ModuleGuard>
  );
}
