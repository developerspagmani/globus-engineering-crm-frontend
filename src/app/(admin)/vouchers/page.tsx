'use client';

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Link from 'next/link';
import { RootState } from '@/redux/store';
import { setVoucherFilters, setVoucherPage, fetchVouchers, deleteVoucher } from '@/redux/features/voucherSlice';
import Breadcrumb from '@/components/Breadcrumb';
import { checkActionPermission } from '@/config/permissions';

const VoucherPage = () => {
  const dispatch = useDispatch();
  const { user, company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items, filters, pagination } = useSelector((state: RootState) => state.voucher);

  React.useEffect(() => {
    if (activeCompany?.id) {
      (dispatch as any)(fetchVouchers(activeCompany.id));
    }
  }, [dispatch, activeCompany?.id]);

  // Filter logic
  const filteredItems = items.filter(item => {
    // Company context filtering
    if (user?.role !== 'super_admin' && activeCompany && item.company_id !== activeCompany.id) return false;

    const matchesSearch = 
      (item.voucherNo || '').toLowerCase().includes((filters.search || '').toLowerCase()) ||
      (item.partyName || '').toLowerCase().includes((filters.search || '').toLowerCase()) ||
      (item.description || '').toLowerCase().includes((filters.search || '').toLowerCase());
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
      case 'posted': return <span className="badge bg-success-soft text-success px-3 py-2 rounded-pill fw-700 x-small">POSTED</span>;
      case 'draft': return <span className="badge bg-secondary-soft text-muted px-3 py-2 rounded-pill fw-700 x-small">DRAFT</span>;
      case 'cancelled': return <span className="badge bg-danger-soft text-danger px-3 py-2 rounded-pill fw-700 x-small">CANCELLED</span>;
      default: return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'payment': return 'text-danger';
      case 'receipt': return 'text-success';
      case 'journal': return 'text-primary';
      case 'contra': return 'text-warning';
      default: return 'text-dark';
    }
  };

  return (
    <div className="content-area animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Breadcrumb 
            items={[
              { label: 'Voucher System', active: true }
            ]} 
          />
          <h3 className="fw-800 tracking-tight text-dark mb-0 mt-2">Voucher Management</h3>
          <p className="text-muted small mb-0">Record and track financial transactions</p>
        </div>
        {checkActionPermission(user, 'mod_voucher', 'create') && (
          <Link href="/vouchers/new" className="btn btn-primary d-flex align-items-center gap-2 py-2 px-4 shadow-accent">
            <i className="bi bi-plus-lg fs-5"></i>
            <span>New Voucher</span>
          </Link>
        )}
      </div>

      {/* Filters Card */}
      <div className="card shadow-sm border-0 mb-4 overflow-hidden">
        <div className="card-body p-3">
          <div className="row g-3">
            <div className="col-md-5">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0 text-muted ps-3">
                  <i className="bi bi-search"></i>
                </span>
                <input 
                  type="text" 
                  className="form-control border-start-0 ps-0" 
                  placeholder="Search by voucher #, party, description..." 
                  value={filters.search}
                  onChange={(e) => dispatch(setVoucherFilters({ search: e.target.value }))}
                />
              </div>
            </div>
            <div className="col-md-3">
              <select 
                className="form-select" 
                value={filters.type}
                onChange={(e) => dispatch(setVoucherFilters({ type: e.target.value as any }))}
              >
                <option value="all">All Types</option>
                <option value="payment">Payment</option>
                <option value="receipt">Receipt</option>
                <option value="journal">Journal</option>
                <option value="contra">Contra</option>
              </select>
            </div>
            <div className="col-md-4">
               <div className="btn-group w-100 p-1 bg-light rounded-3">
                <button 
                  className={`btn btn-sm rounded-2 flex-grow-1 ${filters.status === 'all' ? 'bg-white shadow-sm fw-700' : 'text-muted border-0'}`}
                  onClick={() => dispatch(setVoucherFilters({ status: 'all' }))}
                >All</button>
                <button 
                  className={`btn btn-sm rounded-2 flex-grow-1 ${filters.status === 'posted' ? 'bg-white shadow-sm fw-700 text-success' : 'text-muted border-0'}`}
                  onClick={() => dispatch(setVoucherFilters({ status: 'posted' }))}
                >Posted</button>
                <button 
                  className={`btn btn-sm rounded-2 flex-grow-1 ${filters.status === 'draft' ? 'bg-white shadow-sm fw-700 text-muted' : 'text-muted border-0'}`}
                  onClick={() => dispatch(setVoucherFilters({ status: 'draft' }))}
                >Draft</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th className="px-4 py-3 border-0">Sno</th>
                  <th className="py-3 border-0">Voucher Info</th>
                  <th className="py-3 border-0">Date</th>
                  <th className="py-3 border-0">Party / Account</th>
                  <th className="py-3 border-0 text-end">Amount</th>
                  <th className="py-3 border-0">Mode</th>
                  <th className="py-3 border-0 text-center">Status</th>
                  <th className="py-3 border-0 text-center px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((voucher, index) => (
                  <tr key={voucher.id}>
                    <td className="px-4 text-nowrap text-muted small">{(pagination.currentPage - 1) * pagination.itemsPerPage + index + 1}</td>
                    <td className="text-nowrap fw-bold text-dark">
                      {voucher.voucherNo}
                      <div className={`x-small text-uppercase fw-normal ${getTypeColor(voucher.type)}`}>
                        {voucher.type}
                      </div>
                    </td>
                    <td className="text-nowrap text-muted small">{new Date(voucher.date).toLocaleDateString()}</td>
                    <td className="text-nowrap text-muted small">
                      <div className="fw-bold text-dark">{voucher.partyName}</div>
                      <div className="x-small text-truncate" style={{ maxWidth: '150px' }}>{voucher.description}</div>
                    </td>
                    <td className="text-nowrap text-end fw-bold">
                      <span className={voucher.type === 'payment' ? 'text-danger' : 'text-success'}>
                        ₹{voucher.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="text-nowrap text-muted small text-uppercase fw-bold">{voucher.paymentMode}</td>
                    <td className="text-center">
                      <span className="badge bg-light text-dark border-0 shadow-sm x-small fw-bold">
                        {voucher.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-center px-4 text-nowrap">
                      <div className="d-flex justify-content-center gap-2">
                        {checkActionPermission(user, 'mod_voucher', 'edit') && (
                          <Link href={`/vouchers/${voucher.id}/edit`} className="btn-action-edit" title="Edit">
                            <i className="bi bi-pencil-fill"></i>
                          </Link>
                        )}
                        {checkActionPermission(user, 'mod_voucher', 'delete') && (
                          <button 
                            className="btn-action-delete"
                            onClick={() => { if(confirm('Delete this voucher?')) (dispatch as any)(deleteVoucher(voucher.id)) }}
                            title="Delete"
                          >
                            <i className="bi bi-x-lg"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedItems.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-5 text-muted">
                      No vouchers found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-4 py-3 border-top d-flex align-items-center justify-content-between">
              <div className="text-muted small">
                Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} to {Math.min(pagination.currentPage * pagination.itemsPerPage, filteredItems.length)} of {filteredItems.length} entries
              </div>
              <nav aria-label="Table navigation">
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${pagination.currentPage === 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => dispatch(setVoucherPage(pagination.currentPage - 1))}>
                      <i className="bi bi-chevron-left"></i>
                    </button>
                  </li>
                  {[...Array(totalPages)].map((_, i) => (
                    <li key={i} className={`page-item ${pagination.currentPage === i + 1 ? 'active' : ''}`}>
                      <button className="page-link" onClick={() => dispatch(setVoucherPage(i + 1))}>
                        {i + 1}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item ${pagination.currentPage === totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => dispatch(setVoucherPage(pagination.currentPage + 1))}>
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoucherPage;
