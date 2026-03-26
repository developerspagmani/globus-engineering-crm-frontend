'use client';

import React from 'react';
import Link from 'next/link';
import ModuleGuard from '@/components/ModuleGuard';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { deleteInward, setInwardFilters, setInwardPage, fetchInwards } from '@/redux/features/inwardSlice';
import { checkActionPermission } from '@/config/permissions';

export default function InwardListPage() {
  const [mounted, setMounted] = React.useState(false);
  const dispatch = useDispatch();
  const { user, company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items, filters, pagination } = useSelector((state: RootState) => state.inward);

  React.useEffect(() => {
    setMounted(true);
    (dispatch as any)(fetchInwards(activeCompany?.id));
  }, [dispatch, activeCompany?.id]);

  if (!mounted) return null;

  const filteredItems = items.filter(item => {
    // DEBUG: console.log(`🔍 Checking ${item.inwardNo}: [${item.company_id}] vs active [${activeCompany?.id}]`);
    
    // If a specific company is selected, filter by it. 
    // Super admins can still see items that have NO company if they select "Select Company"
    if (activeCompany && item.company_id !== String(activeCompany.id)) {
        return false;
    }

    const searchTerm = (filters.search || '').toLowerCase();
    const matchesSearch = 
      (item.inwardNo?.toLowerCase() ?? '').includes(searchTerm) ||
      (item.customerName?.toLowerCase() ?? '').includes(searchTerm);
    const matchesStatus = filters.status === 'all' || item.status === filters.status;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredItems.length / pagination.itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (pagination.currentPage - 1) * pagination.itemsPerPage,
    pagination.currentPage * pagination.itemsPerPage
  );

  return (
    <ModuleGuard moduleId="mod_inward">
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold mb-1">Inward Entries</h2>
            <p className="text-muted small mb-0">Manage incoming materials and vendor gate receipts.</p>
          </div>
          {checkActionPermission(user, 'mod_inward', 'create') && (
            <Link href="/inward/new" className="btn btn-primary d-flex align-items-center gap-2">
              <i className="bi bi-box-arrow-in-right"></i>
              <span>New Inward Entry</span>
            </Link>
          )}
        </div>

        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-8">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by inward no, vendor..."
                  value={filters.search}
                  onChange={(e) => dispatch(setInwardFilters({ search: e.target.value }))}
                />
              </div>
              <div className="col-md-4">
                <select
                  className="form-select"
                  value={filters.status}
                  onChange={(e) => dispatch(setInwardFilters({ status: e.target.value as any }))}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="card border-0 shadow-sm rounded-0">
          <div className="table-responsive">
            <table className="table table-bordered align-middle mb-0 small">
              <thead className="bg-light text-uppercase x-small fw-bold text-muted">
                <tr>
                  <th className="px-3 py-3 text-center" style={{ width: '60px' }}>Sno</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 text-center" style={{ width: '150px' }}>Po No</th>
                  <th className="py-3 text-center" style={{ width: '150px' }}>Dc No</th>
                  <th className="py-3 text-center" style={{ width: '120px' }}>Inward Date</th>
                  <th className="text-center py-3 px-3" style={{ width: '120px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((item, index) => (
                  <tr key={item.id} className="hover-bg-light">
                    <td className="px-3 text-center text-muted">
                      {(pagination.currentPage - 1) * pagination.itemsPerPage + index + 1}
                    </td>
                    <td className="px-3 py-3">
                      <div className="fw-bold text-dark text-uppercase">{item.customerName}</div>
                      <div className="text-muted x-small mt-1" style={{ maxWidth: '400px', lineHeight: '1.2' }}>
                        {item.address || 'Address not specified'}
                      </div>
                    </td>
                    <td className="text-center text-muted">{item.poReference || '-'}</td>
                    <td className="text-center text-muted">{item.dcNo || '-'}</td>
                    <td className="text-center text-muted">{item.date}</td>
                    <td className="px-3 text-center">
                      <div className="d-flex flex-column align-items-center gap-2">
                        {checkActionPermission(user, 'mod_inward', 'edit') && (
                          <Link 
                            href={`/inward/${item.id}/edit`} 
                            className="btn btn-success p-0 d-flex align-items-center justify-content-center rounded-1" 
                            style={{ width: '38px', height: '35px' }}
                          >
                            <i className="bi bi-pencil-fill text-white small"></i>
                          </Link>
                        )}
                        {checkActionPermission(user, 'mod_inward', 'delete') && (
                          <button 
                            className="btn btn-danger p-0 d-flex align-items-center justify-content-center rounded-1" 
                            style={{ width: '38px', height: '35px' }}
                            onClick={() => { if (confirm('Delete?')) (dispatch as any)(deleteInward(item.id)) }}
                          >
                            <i className="bi bi-x-lg text-white small"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-5 text-muted">
                      No inward records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="card-footer bg-white p-3 d-flex justify-content-between border-top align-items-center">
              <span className="text-muted small">Showing {paginatedItems.length} entries</span>
              <nav>
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${pagination.currentPage === 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => dispatch(setInwardPage(pagination.currentPage - 1))}>
                      <i className="bi bi-chevron-left"></i>
                    </button>
                  </li>
                  {[...Array(totalPages)].map((_, i) => (
                    <li key={i} className={`page-item ${pagination.currentPage === i + 1 ? 'active' : ''}`}>
                      <button className="page-link px-3" onClick={() => dispatch(setInwardPage(i + 1))}>{i + 1}</button>
                    </li>
                  ))}
                  <li className={`page-item ${pagination.currentPage === totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => dispatch(setInwardPage(pagination.currentPage + 1))}>
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>
    </ModuleGuard>
  );
}
