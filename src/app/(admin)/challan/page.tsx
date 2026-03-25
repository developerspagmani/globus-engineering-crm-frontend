'use client';

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Link from 'next/link';
import { RootState } from '@/redux/store';
import { setChallanFilters, setChallanPage, fetchChallans, deleteChallan } from '@/redux/features/challanSlice';
import Breadcrumb from '@/components/Breadcrumb';
import { checkActionPermission } from '@/config/permissions';

const ChallanPage = () => {
  const dispatch = useDispatch();
  const { user, company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items, filters, pagination, loading } = useSelector((state: RootState) => state.challan);

  React.useEffect(() => {
    (dispatch as any)(fetchChallans());
  }, [dispatch]);

  // Filter logic
  const filteredItems = items.filter(item => {
    // Company context filtering
    if (activeCompany && item.company_id !== activeCompany.id) return false;

    const matchesSearch =
      item.challanNo.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.partyName.toLowerCase().includes(filters.search.toLowerCase());
    const matchesType = filters.type === 'all' || item.type === filters.type;
    const matchesStatus = filters.status === 'all' || item.status === filters.status;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredItems.length / pagination.itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (pagination.currentPage - 1) * pagination.itemsPerPage,
    pagination.currentPage * pagination.itemsPerPage
  );

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

  return (
    <div className="content-area animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Breadcrumb
            items={[
              { label: 'Challan System', active: true }
            ]}
          />
          <h3 className="fw-800 tracking-tight text-dark mb-0 mt-2">Challan Management</h3>
          <p className="text-muted small mb-0">Track material movement and delivery challans</p>
        </div>
        {checkActionPermission(user, 'mod_challan', 'create') && (
          <Link href="/challan/new" className="btn btn-primary d-flex align-items-center gap-2 py-2 px-4 shadow-accent">
            <i className="bi bi-plus-lg fs-5"></i>
            <span>Create Challan</span>
          </Link>
        )}
      </div>

      {/* Filters Card */}
      <div className="card shadow-sm border-0 mb-4 overflow-hidden">
        <div className="card-body p-3">
          <div className="row g-3">
            <div className="col-md-12">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0 text-muted ps-3">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Search by challan # or party name..."
                  value={filters.search}
                  onChange={(e) => dispatch(setChallanFilters({ search: e.target.value }))}
                />
              </div>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={filters.type}
                onChange={(e) => dispatch(setChallanFilters({ type: e.target.value as any }))}
              >
                <option value="all">All Types</option>
                <option value="delivery">Delivery Challan</option>
                <option value="returnable">Returnable</option>
                <option value="job_work">Job Work</option>
              </select>
            </div>
            <div className="col-md-4">
              <div className="btn-group w-100 p-1 bg-light rounded-3">
                <button
                  className={`btn btn-sm rounded-2 flex-grow-1 ${filters.status === 'all' ? 'bg-white shadow-sm fw-700' : 'text-muted border-0'}`}
                  onClick={() => dispatch(setChallanFilters({ status: 'all' }))}
                >All</button>
                <button
                  className={`btn btn-sm rounded-2 flex-grow-1 ${filters.status === 'dispatched' ? 'bg-white shadow-sm fw-700 text-primary' : 'text-muted border-0'}`}
                  onClick={() => dispatch(setChallanFilters({ status: 'dispatched' }))}
                >Dispatched</button>
                <button
                  className={`btn btn-sm rounded-2 flex-grow-1 ${filters.status === 'draft' ? 'bg-white shadow-sm fw-700 text-muted' : 'text-muted border-0'}`}
                  onClick={() => dispatch(setChallanFilters({ status: 'draft' }))}
                >Draft</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* List Table */}
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>Challan Info</th>
              <th>Date</th>
              <th>Party / Client</th>
              <th>Items</th>
              <th>Status</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((challan) => (
              <tr key={challan.id}>
                <td>
                  <div className="fw-800 text-dark">{challan.challanNo}</div>
                  <div className="x-small text-muted text-uppercase tracking-widest fw-700">
                    {getTypeIcon(challan.type)}
                    {challan.type.replace('_', ' ')}
                  </div>
                </td>
                <td>
                  <div className="small fw-600">{new Date(challan.date).toLocaleDateString()}</div>
                </td>
                <td>
                  <div className="fw-700 text-dark small">{challan.partyName}</div>
                  <div className="x-small text-muted text-uppercase fw-600">{challan.partyType}</div>
                </td>
                <td>
                  <div className="small text-muted">
                    {challan.items[0]?.description}
                    {challan.items.length > 1 && <span className="ms-1 text-primary">+{challan.items.length - 1} more</span>}
                  </div>
                </td>
                <td>{getStatusBadge(challan.status)}</td>
                <td className="text-end">
                  <div className="d-flex justify-content-end gap-2">
                    {checkActionPermission(user, 'mod_challan', 'edit') && (
                      <Link href={`/challan/${challan.id}/edit`} className="btn btn-white btn-sm border shadow-sm rounded-pill px-3 fw-700">
                        Edit
                      </Link>
                    )}
                    <button className="btn btn-white btn-sm border shadow-sm rounded-circle p-0" style={{ width: '32px', height: '32px' }}>
                      <i className="bi bi-printer text-muted"></i>
                    </button>
                    {checkActionPermission(user, 'mod_challan', 'delete') && (
                      <button
                        className="btn btn-white btn-sm border shadow-sm rounded-circle p-0"
                        style={{ width: '32px', height: '32px' }}
                        onClick={() => { if (confirm('Delete this challan?')) (dispatch as any)(deleteChallan(challan.id)) }}
                      >
                        <i className="bi bi-trash text-danger"></i>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {paginatedItems.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-5">
                  <div className="text-muted opacity-50 mb-3"><i className="bi bi-file-earmark-x" style={{ fontSize: '3rem' }}></i></div>
                  <h6 className="fw-700 text-dark">No challans found</h6>
                  <p className="small text-muted mb-0">Try adjusting your filters or search query.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-5">
          <nav>
            <ul className="pagination pagination-sm gap-2">
              {[...Array(totalPages)].map((_, i) => (
                <li key={i} className={`page-item ${pagination.currentPage === i + 1 ? 'active' : ''}`}>
                  <button
                    className={`page-link rounded-circle d-flex align-items-center justify-content-center fw-800 ${pagination.currentPage === i + 1 ? 'bg-primary border-primary' : 'text-muted border-white shadow-sm'}`}
                    style={{ width: '36px', height: '36px' }}
                    onClick={() => dispatch(setChallanPage(i + 1))}
                  >
                    {i + 1}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}

      <style jsx>{`
        .bg-primary-soft { background-color: rgba(59, 130, 246, 0.1); }
        .bg-success-soft { background-color: rgba(16, 185, 129, 0.1); }
        .bg-secondary-soft { background-color: rgba(100, 116, 139, 0.1); }
        .bg-danger-soft { background-color: rgba(239, 68, 68, 0.1); }
        .text-accent { color: #da3e00; }
      `}</style>
    </div>
  );
};

export default ChallanPage;
