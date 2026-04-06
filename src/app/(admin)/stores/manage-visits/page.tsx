'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { fetchStores, deleteVisit } from '@/redux/features/storeSlice';
import StoreVisitForm from '@/modules/stores/components/StoreVisitForm';
import { useRouter } from 'next/navigation';
import { Store, StoreVisit } from '@/types/modules';
import api from '@/lib/axios';
import ConfirmationModal from '@/components/ConfirmationModal';
import ModuleGuard from '@/components/ModuleGuard';
import { checkActionPermission } from '@/config/permissions';

export default function ManageVisitsPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { items: stores } = useSelector((state: RootState) => state.stores);
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [visits, setVisits] = useState<StoreVisit[]>([]);
  const [editingVisit, setEditingVisit] = useState<StoreVisit | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);
  const [loadingVisits, setLoadingVisits] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchVisits = async (storeId: string) => {
    setLoadingVisits(true);
    try {
      const response = await api.get(`/stores/${storeId}/visits`);
      setVisits(response.data);
    } catch (err) {
      console.error('Failed to load visits', err);
    } finally {
      setLoadingVisits(false);
    }
  };

  useEffect(() => {
    (dispatch as any)(fetchStores());
  }, [dispatch]);

  // Load visits when store selection changes
  useEffect(() => {
    if (!selectedStoreId) {
      setVisits([]);
      setSelectedStore(null);
      setEditingVisit(undefined);
      setShowForm(false);
      return;
    }
    
    const store = stores.find(s => s.id === selectedStoreId);
    setSelectedStore(store || null);
    fetchVisits(selectedStoreId);
  }, [selectedStoreId, stores]);

  const handleDeleteVisit = async (id: string) => {
    setItemToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await (dispatch as any)(deleteVisit(itemToDelete)).unwrap();
      setVisits(prev => prev.filter(v => v.id !== itemToDelete));
    } catch (err) {
      alert('Failed to delete: ' + err);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? 'DATE NOT SET' : d.toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  return (
    <ModuleGuard moduleId="mod_lead">
      <div className="bg-white min-vh-100 p-4 animate-fade-in shadow-sm">
        <div className="container-fluid">
          {/* Elite Header Row */}
          <div className="card shadow-sm border-0 rounded-4 p-3 mb-4 bg-white">
            <div className="row align-items-center g-3">
              <div className="col-auto">
                 <button 
                    className="btn btn-light rounded-circle shadow-sm" 
                    style={{ width: '40px', height: '40px' }}
                    onClick={() => router.push('/stores')}
                  >
                  <i className="bi bi-arrow-left"></i>
                </button>
              </div>
              <div className="col-md-4">
                  <h5 className="fw-800 mb-0 tracking-tight text-dark uppercase letter-spacing-1">Field Visit</h5>
              </div>
              <div className="col-md-6 text-end ms-auto d-flex align-items-center justify-content-end gap-3">
                 <label className="xx-small fw-800 text-muted uppercase tracking-widest mb-0" style={{whiteSpace:"nowrap"}}>Select Store :</label>
                 <select 
                    className="form-select border-0 bg-light py-2 fw-800 text-dark shadow-none uppercase" 
                    style={{ fontSize: '0.85rem', maxWidth: '350px' }}
                    value={selectedStoreId}
                    onChange={(e) => setSelectedStoreId(e.target.value)}
                  >
                    <option value="">-- SELECT RETAIL SHOP --</option>
                    {stores.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()} - {s.area || 'GENERAL'}</option>)}
                  </select>
              </div>
            </div>
          </div>

          <div className="row justify-content-center">
            <div className="col-lg-12">
              {selectedStore && showForm ? (
                /* Form View */
                <StoreVisitForm 
                  store={selectedStore} 
                  initialData={editingVisit}
                  onSuccess={() => { 
                    fetchVisits(selectedStoreId);
                    setShowForm(false);
                    setEditingVisit(undefined); 
                  }} 
                  onCancel={() => {
                    setShowForm(false);
                    setEditingVisit(undefined);
                  }} 
                />
              ) : selectedStore ? (
                /* History Table View */
                <div className="card border-0 shadow-md rounded-4 overflow-hidden">
                  <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center px-4">
                    <div className="d-flex align-items-center gap-3">
                      <h6 className="fw-800 text-dark mb-0 uppercase tracking-tight">Previous Visit Logs</h6>
                      <span className="badge bg-light text-muted uppercase fw-800 tracking-wider" style={{ fontSize: '0.65rem', paddingTop: '0.4rem' }}>
                        {visits.length} ENTRIES
                      </span>
                    </div>
                    {checkActionPermission(user, 'mod_lead', 'create') && (
                      <button 
                        className="btn btn-primary px-4 py-2 rounded-pill shadow-accent fw-800 tracking-wider small"
                        onClick={() => { setShowForm(true); setEditingVisit(undefined); }}
                      >
                        <i className="bi bi-plus-lg me-1"></i> LOG TODAY'S VISIT
                      </button>
                    )}
                  </div>
                  <div className="card-body p-0">
                    {loadingVisits ? (
                      <div className="text-center p-5"><div className="spinner-border text-primary shadow-sm"></div></div>
                    ) : visits.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                          <thead className="bg-light">
                            <tr>
                              <th className="ps-4 xx-small fw-800 text-muted uppercase tracking-widest">Visit Date</th>
                              <th className="xx-small fw-800 text-muted uppercase tracking-widest">Interest</th>
                              <th className="xx-small fw-800 text-muted uppercase tracking-widest">Discussion Notes</th>
                              <th className="xx-small fw-800 text-muted uppercase tracking-widest">Follow-up</th>
                              <th className="text-end pe-4 xx-small fw-800 text-muted uppercase tracking-widest">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {visits.map(v => (
                              <tr key={v.id}>
                                <td className="ps-4 text-nowrap">
                                  <span className="small fw-800 text-dark">{formatDate(v.visitDate)}</span>
                                </td>
                                <td>
                                  <span className="badge bg-primary bg-opacity-10 text-primary small px-3 py-2 rounded-pill fw-800 uppercase" style={{ fontSize: '0.6rem' }}>
                                    {v.productInterest || 'N/A'}
                                  </span>
                                </td>
                                <td>
                                  <p className="small text-muted mb-0 fw-600" style={{ maxWidth: '400px' }}>{v.notes}</p>
                                </td>
                                <td className="text-nowrap">
                                  <span className="small fw-800 text-warning">{formatDate(v.nextVisitDate || '')}</span>
                                </td>
                                <td className="text-end pe-4">
                                  <div className="d-flex justify-content-end gap-2">
                                    {checkActionPermission(user, 'mod_lead', 'edit') && (
                                      <button 
                                        className="btn-action-view" 
                                        title="Edit Visit"
                                        onClick={() => { setEditingVisit(v); setShowForm(true); }}
                                      >
                                        <i className="bi bi-pencil"></i>
                                      </button>
                                    )}
                                    {checkActionPermission(user, 'mod_lead', 'delete') && (
                                      <button 
                                        className="btn-action-delete" 
                                        title="Delete Visit"
                                        onClick={() => handleDeleteVisit(v.id)}
                                      >
                                        <i className="bi bi-trash3"></i>
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center p-5 text-muted">
                        <i className="bi bi-clipboard-x display-4 opacity-25 mb-3 d-block"></i>
                        <h6 className="fw-800 opacity-50 uppercase tracking-widest">No visit history found</h6>
                        <p className="small fw-600 text-muted mb-4 opacity-50">Log your first field visit for this shop.</p>
                        {checkActionPermission(user, 'mod_lead', 'create') && (
                          <button className="btn btn-primary px-4 py-2 rounded-pill shadow-accent fw-800 tracking-wider" onClick={() => setShowForm(true)}>REGISTER NEW VISIT</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center p-5 mt-5">
                  <i className="bi bi-shop-window display-1 text-muted opacity-10 mb-4 d-block"></i>
                  <h5 className="fw-800 text-muted uppercase tracking-widest opacity-25">Select a Retail Shop to begin</h5>
                </div>
              )}
            </div>
          </div>
        </div>
        <ConfirmationModal 
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          title="Delete Visit Log"
          message="Are you sure you want to delete this visit report? This action cannot be undone."
          confirmLabel="Delete"
          type="danger"
        />
      </div>
    </ModuleGuard>
  );
}
