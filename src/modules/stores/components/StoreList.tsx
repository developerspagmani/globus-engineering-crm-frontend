'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { fetchStores, deleteStore, setStoreFilters } from '@/redux/features/storeSlice';
import { Store } from '@/types/modules';
import StoreVisitForm from './StoreVisitForm';
import { useRouter } from 'next/navigation';

const StoreList: React.FC = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const { items: stores, loading, error, filters } = useSelector((state: RootState) => state.stores);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [showLogForm, setShowLogForm] = useState(false);

  // Helper to check granular permissions
  const hasPermission = (action: 'canRead' | 'canCreate' | 'canEdit' | 'canDelete') => {
    if (currentUser?.role === 'super_admin' || currentUser?.role === 'company_admin') return true;
    const perm = currentUser?.modulePermissions?.find(p => p.moduleId === 'mod_lead');
    return perm ? perm[action] : false;
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this store and all its visit history?')) {
      (dispatch as any)(deleteStore(id));
    }
  };

  useEffect(() => {
    (dispatch as any)(fetchStores());
  }, [dispatch]);

  const filteredStores = stores.filter(store => {
    const matchesSearch = store.name.toLowerCase().includes(filters.search.toLowerCase()) || 
                         store.ownerName?.toLowerCase().includes(filters.search.toLowerCase());
    const matchesArea = filters.area === 'all' || store.area === filters.area;
    return matchesSearch && matchesArea;
  });

  const areas = Array.from(new Set(stores.map(s => s.area).filter(Boolean)));

  if (loading) return <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="container-fluid py-4">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-800 mb-1 text-dark tracking-tight">FIELD STORE MANAGEMENT</h4>
          <p className="text-muted small fw-600 mb-0">Manage your assigned retail shops and field activity logs.</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          {hasPermission('canCreate') && (
            <button 
              className="btn btn-outline-primary d-flex align-items-center gap-2 px-4 shadow-sm"
              onClick={() => router.push('/stores/manage-visits')}
            >
              <i className="bi bi-clipboard2-check fw-800"></i>
              <span className="fw-700">REGISTER TODAY'S VISIT</span>
            </button>
          )}
          {hasPermission('canCreate') && (
            <button 
              className="btn btn-primary d-flex align-items-center gap-2 px-4 shadow-accent" 
              onClick={() => router.push('/stores/new')}
            >
              <i className="bi bi-plus-lg fw-800"></i>
              <span className="fw-700">REGISTER NEW STORE</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card border-0 shadow-md mb-4 rounded-4 overflow-hidden">
        <div className="card-body p-3 bg-white">
          <div className="row g-3 align-items-center">
            <div className="col-md-6">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light border-0"><i className="bi bi-search text-muted"></i></span>
                <input 
                  type="text" 
                  className="form-control border-0 bg-light py-2" 
                  placeholder="SEARCH BY SHOP NAME OR OWNER..." 
                  value={filters.search}
                  onChange={(e) => dispatch(setStoreFilters({ search: e.target.value }))}
                />
              </div>
            </div>
            <div className="col-md-4">
              <select 
                className="form-select form-select-sm border-0 bg-light py-2 fw-700 text-muted" 
                value={filters.area}
                onChange={(e) => dispatch(setStoreFilters({ area: e.target.value }))}
              >
                <option value="all">ALL CLUSTERS / AREAS</option>
                {areas.map(area => <option key={area} value={area || ''}>{String(area).toUpperCase()}</option>)}
              </select>
            </div>
            <div className="col-md-2 text-end">
              <button className="btn btn-light btn-sm w-100 fw-800 text-muted border-0 py-2">
                <i className="bi bi-funnel me-2"></i> FILTERS
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="table-responsive pb-5" style={{ minHeight: '350px' }}>
        <table className="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th className="ps-4">SHOP NAME</th>
              <th>OWNER</th>
              <th>PHONE</th>
              <th>AREA / CLUSTER</th>
              <th>LAST VISIT</th>
              <th className="text-end pe-4">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredStores.map((store, index) => (
              <tr key={store.id}>
                <td className="ps-4">
                  <div className="d-flex align-items-center">
                    <div className="bg-primary bg-opacity-10 text-primary rounded-3 d-flex align-items-center justify-content-center fw-800 me-3" style={{ width: '40px', height: '40px' }}>
                      {store.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h6 className="fw-800 mb-0 small text-dark">{store.name.toUpperCase()}</h6>
                    </div>
                  </div>
                </td>
                <td><span className="small fw-700 text-dark opacity-75">{store.ownerName?.toUpperCase() || 'N/A'}</span></td>
                <td><span className="small fw-700 text-muted">{store.phone}</span></td>
                <td>
                  <span className="badge bg-light text-primary px-3 py-2 rounded-pill fw-800 tracking-wider" style={{ fontSize: '0.65rem' }}>
                    {store.area?.toUpperCase() || 'GENERAL'}
                  </span>
                </td>
                <td>
                  {store.latestVisit ? (
                    <div>
                      <p className="small fw-800 mb-0 text-dark">{new Date(store.latestVisit.visitDate).toLocaleDateString()}</p>
                      <p className="xx-small text-muted mb-0 fw-700">{store.latestVisit.productInterest?.toUpperCase()}</p>
                    </div>
                  ) : (
                    <span className="xx-small fw-800 text-muted opacity-50 text-uppercase">No visits yet</span>
                  )}
                </td>
                <td className="text-end pe-4">
                  <div className="d-flex justify-content-end align-items-center gap-2">
                    {hasPermission('canEdit') && (
                      <button 
                        className="btn btn-action-view" 
                        title="Record Today's Visit"
                        onClick={() => router.push(`/stores/visit/${store.id}`)}
                      >
                        <i className="bi bi-clipboard2-check"></i>
                      </button>
                    )}
                    <div className="dropdown">
                      <button className="btn btn-link text-muted p-0 px-2" data-bs-toggle="dropdown" aria-expanded="false">
                        <i className="bi bi-three-dots-vertical fs-5"></i>
                      </button>
                      <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0 rounded-4 p-2">
                        <li>
                          <button className="dropdown-item d-flex align-items-center gap-2 rounded-3 py-2 small fw-700" onClick={() => router.push(`/stores/edit/${store.id}`)}>
                            <i className="bi bi-pencil-square text-primary"></i> EDIT PROFILE
                          </button>
                        </li>
                        <li>
                          <button className="dropdown-item d-flex align-items-center gap-2 rounded-3 py-2 small fw-700 text-danger" onClick={() => handleDelete(store.id)}>
                            <i className="bi bi-trash3"></i> DELETE STORE
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredStores.length === 0 && (
          <div className="text-center p-5 bg-white rounded-4 border m-4">
            <i className="bi bi-shop display-4 text-muted mb-3 d-block opacity-25"></i>
            <h5 className="text-muted fw-800 tracking-tight">NO STORES FOUND</h5>
            <p className="small text-muted fw-600">Try adjusting your filters or search keywords.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreList;
