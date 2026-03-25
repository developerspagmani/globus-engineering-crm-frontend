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

      {/* List Table */}
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>Voucher Info</th>
              <th>Date</th>
              <th>Party / Account</th>
              <th className="text-end">Amount</th>
              <th>Mode</th>
              <th>Status</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((voucher) => (
              <tr key={voucher.id}>
                <td>
                  <div className="fw-800 text-dark">{voucher.voucherNo}</div>
                  <div className={`x-small text-uppercase tracking-widest fw-700 ${getTypeColor(voucher.type)}`}>
                    {voucher.type}
                  </div>
                </td>
                <td>
                  <div className="small fw-600">{new Date(voucher.date).toLocaleDateString()}</div>
                </td>
                <td>
                  <div className="fw-700 text-dark small">{voucher.partyName}</div>
                  <div className="x-small text-muted text-truncate" style={{ maxWidth: '200px' }}>{voucher.description}</div>
                </td>
                <td className="text-end">
                  <div className={`fw-800 ${voucher.type === 'payment' ? 'text-danger' : 'text-success'}`}>
                    ₹{voucher.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </td>
                <td>
                  <div className="x-small text-muted text-uppercase fw-700">{voucher.paymentMode}</div>
                </td>
                <td>{getStatusBadge(voucher.status)}</td>
                <td className="text-end">
                  <div className="d-flex justify-content-end gap-2">
                    {checkActionPermission(user, 'mod_voucher', 'edit') && (
                      <Link href={`/vouchers/${voucher.id}/edit`} className="btn btn-white btn-sm border shadow-sm rounded-pill px-3 fw-700">
                        Edit
                      </Link>
                    )}
                    <button className="btn btn-white btn-sm border shadow-sm rounded-circle p-0" style={{ width: '32px', height: '32px' }}>
                      <i className="bi bi-printer text-muted"></i>
                    </button>
                    {checkActionPermission(user, 'mod_voucher', 'delete') && (
                      <button 
                        className="btn btn-white btn-sm border shadow-sm rounded-circle p-0" 
                        style={{ width: '32px', height: '32px' }}
                        onClick={() => { if(confirm('Delete this voucher?')) (dispatch as any)(deleteVoucher(voucher.id)) }}
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
                <td colSpan={7} className="text-center py-5">
                  <div className="text-muted opacity-50 mb-3"><i className="bi bi-receipt-cutoff" style={{ fontSize: '3rem' }}></i></div>
                  <h6 className="fw-700 text-dark">No vouchers found</h6>
                  <p className="small text-muted mb-0">Record your first financial transaction today.</p>
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
                    onClick={() => dispatch(setVoucherPage(i + 1))}
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
        .bg-success-soft { background-color: rgba(16, 185, 129, 0.1); }
        .bg-secondary-soft { background-color: rgba(100, 116, 139, 0.1); }
        .bg-danger-soft { background-color: rgba(239, 68, 68, 0.1); }
      `}</style>
    </div>
  );
};

export default VoucherPage;
