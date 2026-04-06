'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import StoreVisitForm from '@/modules/stores/components/StoreVisitForm';
import ModuleGuard from '@/components/ModuleGuard';
import api from '@/lib/axios';
import { Store } from '@/types/modules';

export default function RecordVisitPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const response = await api.get(`/stores/${id}`);
        setStore(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load store');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchStore();
  }, [id]);

  return (
    <ModuleGuard moduleId="mod_lead">
      <div className="bg-white min-vh-100 p-4 animate-fade-in shadow-sm">
        <div className="container-fluid">
          <div className="mb-4 d-flex align-items-center gap-3">
            <button 
              className="btn btn-outline-secondary btn-sm rounded-circle d-flex align-items-center justify-content-center" 
              style={{ width: '32px', height: '32px' }}
              onClick={() => router.push('/stores')}
            >
              <i className="bi bi-arrow-left"></i>
            </button>
            <div>
              <h4 className="fw-800 mb-0 tracking-tight">RECORD FIELD VISIT</h4>
              <p className="text-muted small fw-600 mb-0">Daily activity log for your assigned retail shops.</p>
            </div>
          </div>
          
          {loading ? (
            <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
          ) : error ? (
            <div className="alert alert-danger rounded-4 border-0 shadow-sm">{error}</div>
          ) : store ? (
            <div className="row">
              <div className="col-lg-8">
                 <StoreVisitForm 
                  store={store} 
                  onSuccess={() => router.push('/stores')} 
                  onCancel={() => router.push('/stores')} 
                />
              </div>
              <div className="col-lg-4">
                 <div className="card border-0 shadow-md rounded-4 overflow-hidden mb-4">
                   <div className="card-header bg-primary py-3">
                      <h6 className="text-white fw-800 mb-0 small uppercase">SHOP PROFILE</h6>
                   </div>
                   <div className="card-body p-4">
                      <div className="mb-3">
                        <label className="xx-small fw-800 text-muted uppercase tracking-widest mb-1 d-block">Store Name</label>
                        <p className="fw-800 text-dark mb-0">{store.name.toUpperCase()}</p>
                      </div>
                      <div className="mb-3">
                        <label className="xx-small fw-800 text-muted uppercase tracking-widest mb-1 d-block">Owner Name</label>
                        <p className="fw-700 text-muted mb-0">{store.ownerName?.toUpperCase() || 'N/A'}</p>
                      </div>
                      <div className="mb-0">
                        <label className="xx-small fw-800 text-muted uppercase tracking-widest mb-1 d-block">assigned cluster</label>
                        <span className="badge bg-light text-primary px-3 py-2 rounded-pill fw-800 tracking-wider" style={{ fontSize: '0.65rem' }}>
                          {store.area?.toUpperCase() || 'GENERAL'}
                        </span>
                      </div>
                   </div>
                 </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </ModuleGuard>
  );
}
