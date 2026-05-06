'use client';

import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Link from 'next/link';
import ExportExcel from '@/components/shared/ExportExcel';
import PaginationComponent from '@/components/shared/Pagination';

import { RootState } from '@/redux/store';
import { setChallanFilters, setChallanPage, fetchChallans, deleteChallan } from '@/redux/features/challanSlice';
import Breadcrumb from '@/components/Breadcrumb';
import { checkActionPermission } from '@/config/permissions';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Loader from '@/components/Loader';
import ConfirmationModal from '@/components/ConfirmationModal';

const ChallanPage = () => {
  const dispatch = useDispatch();
  const { user, company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items, filters, pagination, loading } = useSelector((state: RootState) => state.challan);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
  const [mounted, setMounted] = React.useState(false);


  React.useEffect(() => {
    setMounted(true);
    (dispatch as any)(fetchChallans({
      company_id: activeCompany?.id,
      page: pagination.currentPage,
      limit: pagination.itemsPerPage,
      search: filters.search
    }));
  }, [dispatch, activeCompany?.id, pagination.currentPage, pagination.itemsPerPage, filters.search]);

  if (!mounted) return <Loader text="Initializing..." />;

  // Filter logic
  const totalPages = pagination.totalPages;
  const paginatedItems = items;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'dispatched': return <span className="badge bg-primary-soft text-primary px-3 py-2 rounded-pill fw-700 x-small">DISPATCHED</span>;
      case 'received': return <span className="badge bg-success-soft text-success px-3 py-2 rounded-pill fw-700 x-small">RECEIVED</span>;
      case 'draft': return <span className="badge bg-secondary-soft text-muted px-3 py-2 rounded-pill fw-700 x-small">DRAFT</span>;
      case 'cancelled': return <span className="badge bg-danger-soft text-danger px-3 py-2 rounded-pill fw-700 x-small">CANCELLED</span>;
      default: return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'delivery': return <i className="bi bi-box-seam text-primary me-2"></i>;
      case 'returnable': return <i className="bi bi-arrow-left-right text-accent me-2"></i>;
      case 'job_work': return <i className="bi bi-tools text-dark me-2"></i>;
      default: return null;
    }
  };

  const handlePrintChallanRecord = (challan: any) => {
    window.open(`/logistics-print?type=challan&id=${challan.id}&print=true`, '_blank');
  };

  const handleExportPDFChallanRecord = (challan: any) => {
    window.open(`/logistics-print?type=challan&id=${challan.id}`, '_blank');
  };

  const handleDeleteParams = (id: string) => {
    setDeleteModal({ isOpen: true, id });
  };

  const confirmDelete = () => {
    if (deleteModal.id) {
      (dispatch as any)(deleteChallan(deleteModal.id));
    }
  };

  return (
    <div className="container-fluid py-4 min-vh-100 animate-fade-in px-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <Breadcrumb
            items={[
              { label: 'Challan System', active: true }
            ]}
          />
          <h2 className="fw-900 tracking-tight text-dark mb-1 mt-2">Challan Management</h2>
          <p className="text-muted small mb-0">Track material movement and delivery challans across industrial sites.</p>
        </div>
          <div className="d-flex align-items-center gap-2">
            <ExportExcel 
              data={items} 
              fileName="Challan_Records" 
              headers={{ challanNo: 'Challan No', date: 'Date', partyName: 'Party Name', type: 'Type', status: 'Status' }}
              buttonText="Export List"
            />
          {checkActionPermission(user, 'mod_challan', 'create') && (
            <Link href="/challan/new" className="btn btn-primary btn-page-action px-4">
              <i className="bi bi-plus-lg"></i>
              <span>Add Challan</span>
            </Link>
          )}
        </div>
      </div>

        <div className="card filter-card">
          <div className="card-body p-3">
            <div className="filter-bar-row">
              <div className="filter-item-search">
                <div className="search-group">
                  <span className="input-group-text">
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control search-bar"
                    placeholder="Search by challan or party..."
                    value={filters.search}
                    onChange={(e) => dispatch(setChallanFilters({ search: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="filter-item-select">
                <select
                  className="form-select search-bar"
                  value={filters.type}
                  onChange={(e) => dispatch(setChallanFilters({ type: e.target.value as any }))}
                >
                  <option value="all">All Types</option>
                  <option value="delivery">Delivery</option>
                  <option value="returnable">Returnable</option>
                  <option value="job_work">Job Work</option>
                </select>
              </div>

              <div className="date-filter-group">
                <input 
                  type="date" 
                  className="text-muted" 
                  value={filters.fromDate}
                  onChange={(e) => dispatch(setChallanFilters({ fromDate: e.target.value }))}
                />
                <span className="text-muted small fw-bold mx-1">TO</span>
                <input 
                  type="date" 
                  className="text-muted" 
                  value={filters.toDate}
                  onChange={(e) => dispatch(setChallanFilters({ toDate: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr className="bg-light">
                  <th className="px-4 py-3 border-0 small fw-bold text-muted">Sno</th>
                  <th className="py-3 border-0 small fw-bold text-muted">Challan No</th>
                  <th className="py-3 border-0 small fw-bold text-muted">Date</th>
                  <th className="py-3 border-0 small fw-bold text-muted">Party / Client</th>
                  <th className="py-3 border-0 small fw-bold text-muted">Items</th>
                  <th className="py-3 border-0 small fw-bold text-muted text-center">Status</th>
                  <th className="py-3 border-0 small fw-bold text-muted text-center px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7}>
                      <Loader text="Fetching Challan Records..." />
                    </td>
                  </tr>
                ) : (
                  <>
                    {paginatedItems.map((challan, index) => (
                      <tr key={challan.id}>
                        <td className="px-4 text-nowrap text-muted small">{(pagination.currentPage - 1) * pagination.itemsPerPage + index + 1}</td>
                        <td className="text-nowrap fw-bold text-dark">
                          {challan.challanNo}
                          <div className="text-muted x-small fw-normal text-capitalize">{challan.type.replace('_', ' ')}</div>
                        </td>
                        <td className="text-nowrap text-muted small">{new Date(challan.date).toLocaleDateString()}</td>
                        <td className="text-nowrap text-muted small">
                          <div className="fw-bold text-dark">{challan.partyName}</div>
                          <div className="x-small text-capitalize">{challan.partyType}</div>
                        </td>
                        <td className="text-nowrap text-muted small">
                          {challan.items[0]?.description}
                          {challan.items.length > 1 && <span className="ms-1 text-primary x-small fw-bold">+{challan.items.length - 1} more</span>}
                        </td>
                        <td className="text-center">
                          <span className="badge bg-light text-dark border-0 shadow-sm x-small fw-bold text-capitalize">
                            {challan.status}
                          </span>
                        </td>
                        <td className="text-center px-4 text-nowrap">
                          <div className="d-flex justify-content-center gap-1">
                            <Link href={`/challan/${challan.id}/edit`} className="btn-action-view" title="View Profile">
                              <i className="bi bi-eye-fill"></i>
                            </Link>
                            {checkActionPermission(user, 'mod_challan', 'edit') && (
                              <Link href={`/challan/${challan.id}/edit?edit=true`} className="btn-action-edit" title="Edit Record">
                                <i className="bi bi-pencil-fill"></i>
                              </Link>
                            )}
                            
                            <div className="dropdown">
                              <button 
                                className="btn btn-sm btn-outline-secondary border-0 text-muted p-0 ms-1 d-flex align-items-center justify-content-center" 
                                type="button" 
                                id={`actions-${challan.id}`} 
                                data-bs-toggle="dropdown" 
                                aria-expanded="false"
                                style={{ width: '32px', height: '32px', borderRadius: '8px' }}
                              >
                                <i className="bi bi-three-dots-vertical fs-5"></i>
                              </button>
                              <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3 py-2" aria-labelledby={`actions-${challan.id}`}>
                                <li>
                                  <button className="dropdown-item d-flex align-items-center gap-2 py-2" type="button" onClick={() => handlePrintChallanRecord(challan)}>
                                    <i className="bi bi-printer text-primary"></i>
                                    <span className="small fw-semibold">Quick Print</span>
                                  </button>
                                </li>
                                <li>
                                  <button className="dropdown-item d-flex align-items-center gap-2 py-2" type="button" onClick={() => handleExportPDFChallanRecord(challan)}>
                                    <i className="bi bi-file-earmark-pdf text-danger"></i>
                                    <span className="small fw-semibold">Export PDF</span>
                                  </button>
                                </li>
                                {checkActionPermission(user, 'mod_challan', 'delete') && (
                                  <>
                                    <li><hr className="dropdown-divider opacity-50" /></li>
                                    <li>
                                      <button 
                                        className="dropdown-item d-flex align-items-center gap-2 py-2 text-danger" 
                                        type="button"
                                        onClick={() => handleDeleteParams(challan.id)}
                                      >
                                        <i className="bi bi-trash3"></i>
                                        <span className="small fw-semibold">Remove Record</span>
                                      </button>
                                    </li>
                                  </>
                                )}
                              </ul>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {items.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-5 text-muted">
                          No challans found matching your filters.
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="px-4 py-3 border-top d-flex align-items-center justify-content-between">
              <div className="text-muted small">
                Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} to {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems} entries
              </div>
              <PaginationComponent 
                currentPage={pagination.currentPage} 
                totalPages={totalPages} 
                onPageChange={(page) => dispatch(setChallanPage(page))} 
              />

            </div>
          )}
        </div>
      </div>

      <ConfirmationModal 
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Delete Challan Record"
        message="Are you sure you want to remove this challan? This action may affect linked stock levels and movement history. This cannot be undone."
      />

      <style jsx>{`
        .table-responsive {
          min-height: 400px;
          padding-bottom: 80px;
        }
        @media print {
          :global(body *) { visibility: hidden; }
          .table-responsive, .table-responsive * { visibility: visible; }
          .table-responsive { position: absolute; left: 0; top: 0; width: 100%; }
          .table th:last-child, .table td:last-child { display: none !important; }
          .table { border: 1px solid #dee2e6 !important; width: 100% !important; }
          :global(.sidebar), :global(.header), :global(.breadcrumb), .card-header, .pagination, .border-bottom { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default ChallanPage;
