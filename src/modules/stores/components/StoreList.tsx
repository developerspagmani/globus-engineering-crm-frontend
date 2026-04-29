'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { fetchStores, deleteStore, setStoreFilters, setStorePage } from '@/redux/features/storeSlice';
import { Store } from '@/types/modules';
import StoreVisitForm from './StoreVisitForm';
import { useRouter } from 'next/navigation';
import ConfirmationModal from '@/components/ConfirmationModal';
import PaginationComponent from '@/components/shared/Pagination';


import ExportExcel from '@/components/shared/ExportExcel';
import Breadcrumb from '@/components/Breadcrumb';

const StoreList: React.FC = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const { items: stores, loading, error, filters, pagination } = useSelector((state: RootState) => state.stores);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [showLogForm, setShowLogForm] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Helper to check granular permissions
  const hasPermission = (action: 'canRead' | 'canCreate' | 'canEdit' | 'canDelete') => {
    if (currentUser?.role === 'super_admin' || currentUser?.role === 'company_admin') return true;
    const perm = currentUser?.modulePermissions?.find(p => p.moduleId === 'mod_lead');
    return perm ? perm[action] : false;
  };

  const handleDelete = (id: string) => {
    setItemToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      (dispatch as any)(deleteStore(itemToDelete));
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

  const totalPages = Math.ceil(filteredStores.length / pagination.itemsPerPage);
  const paginatedItems = filteredStores.slice(
    (pagination.currentPage - 1) * pagination.itemsPerPage,
    pagination.currentPage * pagination.itemsPerPage
  );

  const areas = Array.from(new Set(stores.map(s => s.area).filter(Boolean)));

  if (!mounted || loading) return <div className="text-center p-5 mt-5"><div className="spinner-border text-secondary"></div></div>;

  return (
    <div className="container-fluid py-4 min-vh-100 animate-fade-in px-4">
      {/* Header Section Standardized */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <Breadcrumb items={[{ label: 'Retail & Field Hub', active: true }]} />
          <h2 className="fw-900 tracking-tight text-dark mb-1 mt-2">Field Store Management</h2>
          <p className="text-muted small mb-0">Manage your assigned retail shops and field activity logs across all clusters.</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          {hasPermission('canCreate') && (
            <button 
              className="btn btn-primary d-flex align-items-center gap-2 px-4 shadow-sm" 
              onClick={() => router.push('/stores/new')}
              style={{ height: '42px', borderRadius: '10px' }}
            >
              <i className="bi bi-shop-window"></i>
              <span className="fw-800 small text-capitalize">Add Store</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card filter-card">
        <div className="card-body">
          <div className="filter-bar-row">
            <div className="filter-item-search">
              <div className="search-group">
                <span className="input-group-text">
                  <i className="bi bi-search"></i>
                </span>
                <input 
                  type="text" 
                  className="form-control search-bar" 
                  placeholder="Search by shop name or owner..." 
                  value={filters.search}
                  onChange={(e) => dispatch(setStoreFilters({ search: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="filter-item-select">
              <select 
                className="form-select search-bar" 
                value={filters.area}
                onChange={(e) => dispatch(setStoreFilters({ area: e.target.value }))}
              >
                <option value="all">Areas</option>
                {areas.map(area => <option key={area} value={area || ''}>{area}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="table-responsive pb-5" style={{ minHeight: '350px' }}>
        <table className="table table-hover align-middle mb-0">
          <thead>
            <tr className="bg-light">
              <th className="ps-4 py-3 border-0 small fw-bold text-muted">Sno</th>
              <th className="py-3 border-0 small fw-bold text-muted">Shop Name</th>
              <th className="py-3 border-0 small fw-bold text-muted">Owner</th>
              <th className="py-3 border-0 small fw-bold text-muted">Phone</th>
              <th className="py-3 border-0 small fw-bold text-muted">Area / Cluster</th>
              <th className="py-3 border-0 small fw-bold text-muted">Last Visit</th>
              <th className="text-end pe-4 py-3 border-0 small fw-bold text-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((store, index) => (
              <tr key={store.id}>
                <td className="ps-4 text-muted small">{(pagination.currentPage - 1) * pagination.itemsPerPage + index + 1}</td>
                <td>
                  <div className="d-flex align-items-center">
                    <div className=" bg-opacity-10 text-primary rounded-3 d-flex align-items-center justify-content-center fw-800 me-3" style={{ width: '40px', height: '40px' }}>
                      {store.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h6 className="fw-800 mb-0 small text-dark text-capitalize">{store.name}</h6>
                    </div>
                  </div>
                </td>
                <td><span className="small fw-700 text-dark opacity-75 text-capitalize">{store.ownerName || 'N/A'}</span></td>
                <td><span className="small fw-700 text-muted">{store.phone}</span></td>
                <td>
                  <span className="badge bg-light text-primary px-3 py-2 rounded-pill fw-800 tracking-wider text-capitalize" style={{ fontSize: '0.65rem' }}>
                    {store.area || 'General'}
                  </span>
                </td>
                <td>
                  {store.latestVisit ? (
                    <div>
                      <p className="small fw-800 mb-0 text-dark">{new Date(store.latestVisit.visitDate).toLocaleDateString()}</p>
                      {/* <p className="xx-small text-muted mb-0 fw-700">{store.latestVisit.productInterest?.toUpperCase()}</p> */}
                    </div>
                  ) : (
                    <span className="xx-small fw-800 text-muted opacity-50 text-uppercase">No visits yet</span>
                  )}
                </td>
                <td className="text-end pe-4">
                  <div className="d-flex justify-content-end align-items-center gap-2">
                    {hasPermission('canRead') && (
                      <button 
                        className="btn btn-action-view" 
                        title="View Store Details"
                        onClick={() => router.push(`/stores/view/${store.id}`)}
                      >
                        <i className="bi bi-eye"></i>
                      </button>
                    )}
                    {hasPermission('canEdit') && (
                      <button 
                        className="btn btn-action-edit" 
                        title="Edit Store Profile"
                        onClick={() => router.push(`/stores/edit/${store.id}`)}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                    )}
                    <div className="dropdown">
                      <button className="btn btn-link text-muted p-0 px-2" data-bs-toggle="dropdown" aria-expanded="false">
                        <i className="bi bi-three-dots-vertical fs-5"></i>
                      </button>
                      <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0 rounded-4 p-2">
                        <li>
                          <button className="dropdown-item d-flex align-items-center gap-2 rounded-3 py-2 small fw-700 text-capitalize" onClick={() => router.push(`/stores/edit/${store.id}`)}>
                            <i className="bi bi-pencil-square text-primary"></i> Edit Profile
                          </button>
                        </li>
                        <li>
                          <button className="dropdown-item d-flex align-items-center gap-2 rounded-3 py-2 small fw-700 text-danger text-capitalize" onClick={() => handleDelete(store.id)}>
                            <i className="bi bi-trash3"></i> Delete Store
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

        {totalPages > 1 && (
          <div className="p-3 border-top bg-light d-flex justify-content-between align-items-center px-4">
            <span className="text-muted small">Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} to {Math.min(pagination.currentPage * pagination.itemsPerPage, filteredStores.length)} of {filteredStores.length} entries</span>
            <PaginationComponent 
              currentPage={pagination.currentPage} 
              totalPages={totalPages} 
              onPageChange={(page) => dispatch(setStorePage(page))} 
            />

          </div>
        )}

        {filteredStores.length === 0 && (
          <div className="text-center p-5 bg-white rounded-4 border m-4">
            <i className="bi bi-shop display-4 text-muted mb-3 d-block opacity-25"></i>
            <h5 className="text-muted fw-800 tracking-tight text-capitalize">No Stores Found</h5>
            <p className="small text-muted fw-600">Try adjusting your filters or search keywords.</p>
          </div>
        )}
      </div>
      <ConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Store Profile"
        message="Are you sure you want to delete this store? All associated visit history will also be permanently removed."
        confirmLabel="Delete Store"
        type="danger"
      />
    </div>
  );
};

export default StoreList;
