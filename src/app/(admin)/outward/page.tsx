'use client';

import React from 'react';
import Link from 'next/link';
import ModuleGuard from '@/components/ModuleGuard';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { deleteOutward, setOutwardFilters, setOutwardPage, fetchOutwards } from '@/redux/features/outwardSlice';
import { checkActionPermission } from '@/config/permissions';

export default function OutwardListPage() {
  const [mounted, setMounted] = React.useState(false);
  const dispatch = useDispatch();
  const { user, company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items, filters, pagination } = useSelector((state: RootState) => state.outward);

  React.useEffect(() => {
    setMounted(true);
    (dispatch as any)(fetchOutwards());
  }, [dispatch]);

  if (!mounted) return null;

  const filteredItems = items.filter(item => {
    // Company context filtering
    if (activeCompany && item.company_id !== activeCompany.id) return false;

    const matchesSearch = item.outwardNo.toLowerCase().includes(filters.search.toLowerCase()) || 
                         item.customerName.toLowerCase().includes(filters.search.toLowerCase());
    const matchesStatus = filters.status === 'all' || item.status === filters.status;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredItems.length / pagination.itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (pagination.currentPage - 1) * pagination.itemsPerPage,
    pagination.currentPage * pagination.itemsPerPage
  );

  return (
    <ModuleGuard moduleId="mod_outward">
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold mb-1">Outward Entries</h2>
            <p className="text-muted small mb-0">Manage outgoing finished goods and customer dispatches.</p>
          </div>
          {checkActionPermission(user, 'mod_outward', 'create') && (
            <Link href="/outward/new" className="btn btn-primary d-flex align-items-center gap-2">
              <i className="bi bi-box-arrow-up-right"></i>
              <span>New Outward Entry</span>
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
                  placeholder="Search by outward no, customer..."
                  value={filters.search}
                  onChange={(e) => dispatch(setOutwardFilters({ search: e.target.value }))}
                />
              </div>
              <div className="col-md-4">
                <select
                  className="form-select"
                  value={filters.status}
                  onChange={(e) => dispatch(setOutwardFilters({ status: e.target.value as any }))}
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

        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="px-4">Outward No</th>
                  <th>Customer</th>
                  <th>Invoice Ref</th>
                  <th>Vehicle No</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th className="text-end px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 fw-bold">{item.outwardNo}</td>
                    <td>{item.customerName}</td>
                    <td><code className="bg-light px-2 rounded text-dark">{item.invoiceReference}</code></td>
                    <td>{item.vehicleNo}</td>
                    <td>{item.date}</td>
                    <td>
                      <span className={`badge bg-${item.status === 'completed' ? 'success' : item.status === 'pending' ? 'warning' : 'danger'} bg-opacity-10 text-${item.status === 'completed' ? 'success' : item.status === 'pending' ? 'warning' : 'danger'} rounded-pill`}>
                        {item.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-end px-4">
                      <div className="d-flex justify-content-end gap-2">
                        {checkActionPermission(user, 'mod_outward', 'edit') && (
                          <Link href={`/outward/${item.id}/edit`} className="btn btn-sm btn-outline-primary border-0">
                            <i className="bi bi-pencil"></i>
                          </Link>
                        )}
                        {checkActionPermission(user, 'mod_outward', 'delete') && (
                          <button className="btn btn-sm btn-outline-danger border-0" onClick={() => { if(confirm('Delete?')) (dispatch as any)(deleteOutward(item.id)) }}>
                            <i className="bi bi-trash"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-5 text-muted">
                      No outward records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="card-footer bg-white p-3 d-flex justify-content-between border-0">
              <span className="text-muted small">Showing {paginatedItems.length} entries</span>
              <nav>
                <ul className="pagination pagination-sm mb-0">
                  {[...Array(totalPages)].map((_, i) => (
                    <li key={i} className={`page-item ${pagination.currentPage === i + 1 ? 'active' : ''}`}>
                      <button className="page-link" onClick={() => (dispatch as any)(setOutwardPage(i + 1))}>{i + 1}</button>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>
    </ModuleGuard>
  );
}
