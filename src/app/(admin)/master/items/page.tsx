'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { fetchItems, createItemThunk, updateItemThunk, deleteItemThunk } from '@/redux/features/masterSlice';
import Breadcrumb from '@/components/Breadcrumb';
import ModuleGuard from '@/components/ModuleGuard';
import Loader from '@/components/Loader';

export default function ItemDetailsPage() {
  const dispatch = useDispatch();
  const { items, loading } = useSelector((state: RootState) => state.master);
  const { company } = useSelector((state: RootState) => state.auth);

  const [view, setView] = useState<'add' | 'list'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ itemCode: '', itemName: '' });

  useEffect(() => {
    (dispatch as any)(fetchItems(company?.id));
  }, [dispatch, company?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (company?.id) {
      if (editingId) {
        await (dispatch as any)(updateItemThunk({ id: editingId, ...formData }));
        setEditingId(null);
      } else {
        await (dispatch as any)(createItemThunk({ ...formData, company_id: company.id }));
      }
      setFormData({ itemCode: '', itemName: '' });
      setView('list');
    } else {
      alert("Please select a company from the top navigation first.");
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({ itemCode: item.itemCode, itemName: item.itemName });
    setView('add');
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      (dispatch as any)(deleteItemThunk(id));
    }
  };

  const filteredItems = items.filter(item =>
    item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.itemCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ModuleGuard moduleId="mod_items">
      <div className="bg-white min-vh-100">
        {/* Header Section */}
        <div className="px-4 py-3 border-bottom d-flex align-items-center">
          {view === 'add' && (
            <button 
              type="button" 
              className="back-btn-standard" 
              onClick={() => setView('list')} 
              title="Back to List"
            >
              <i className="bi bi-arrow-left-circle fs-3 "></i>
            </button>
          )}
          <h4 className="mb-0 text-dark" style={{ fontSize: '1.5rem' }}>{view === 'add' ? (editingId ? 'Edit Item' : 'Add New Item') : 'Item Details'}</h4>
          <div className="ms-auto d-flex gap-2">
            <button
              onClick={() => { setView('add'); setEditingId(null); setFormData({ itemCode: '', itemName: '' }); }}
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
              <div className="mb">
                {/* <h5 className="fw-bold text-primary">{editingId ? 'Edit Item' : 'Add New Item'}</h5> */}
              </div>
              <form onSubmit={handleSubmit}>
                {/* Item Code Field */}
                <div className="row mb-5 align-items-center">
                  <div className="col-md-3">
                    <label className="text-dark fw-normal" style={{ fontSize: '1.1rem' }}>Item Code</label>
                  </div>
                  <div className="col-md-9">
                    <input
                      type="text"
                      required
                      placeholder="Item Code"
                      className="form-control border-0 border-bottom rounded-0 px-0 shadow-none"
                      style={{ borderBottomColor: '#ddd !important', fontSize: '1.1rem' }}
                      value={formData.itemCode}
                      onChange={(e) => setFormData({ ...formData, itemCode: e.target.value })}
                    />
                  </div>
                </div>

                {/* Item Name Field */}
                <div className="row mb-5 align-items-center">
                  <div className="col-md-3">
                    <label className="text-dark fw-normal" style={{ fontSize: '1.1rem' }}>Item Name</label>
                  </div>
                  <div className="col-md-9">
                    <input
                      type="text"
                      required
                      placeholder="Item Name"
                      className="form-control border-0 border-bottom rounded-0 px-0 shadow-none"
                      style={{ borderBottomColor: '#ddd !important', fontSize: '1.1rem' }}
                      value={formData.itemName}
                      onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
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
                    onClick={() => { setFormData({ itemCode: '', itemName: '' }); setEditingId(null); }}
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
                    <i className="bi bi-search "></i>
                  </span>
                  <input
                    type="text"
                    placeholder="Search items..."
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
                      <th className="px-4 py-2 text-uppercase small fw-bold">Item Code</th>
                      <th className="px-4 py-2 text-uppercase small fw-bold">Item Name</th>
                      <th className="px-4 py-2 text-uppercase small fw-bold text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={4}>
                          <Loader text="Fetching Items..." />
                        </td>
                      </tr>
                    ) : filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-5 text-muted">No items found</td>
                      </tr>
                    ) : (
                      filteredItems.map((item, index) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 text-muted">{index + 1}</td>
                          <td className="px-4 py-3 font-monospace">{item.itemCode}</td>
                          <td className="px-4 py-3">{item.itemName}</td>
                          <td className="px-4 py-3 text-end">
                            <div className="d-flex justify-content-end gap-2">
                              <button onClick={() => handleEdit(item)} className="btn-action-edit" title="Edit">
                                <i className="bi bi-pencil-fill"></i>
                              </button>
                              <button onClick={() => handleDelete(item.id)} className="btn-action-delete" title="Delete">
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

