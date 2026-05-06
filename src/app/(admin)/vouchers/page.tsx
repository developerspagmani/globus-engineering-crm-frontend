'use client';

import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Link from 'next/link';
import { RootState } from '@/redux/store';
import { setVoucherFilters, setVoucherPage, fetchVouchers, deleteVoucher } from '@/redux/features/voucherSlice';
import Breadcrumb from '@/components/Breadcrumb';
import { checkActionPermission } from '@/config/permissions';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Loader from '@/components/Loader';
import ConfirmationModal from '@/components/ConfirmationModal';
import ExportExcel from '@/components/shared/ExportExcel';
import PaginationComponent from '@/components/shared/Pagination';


const VoucherPage = () => {
  const dispatch = useDispatch();
  const { user, company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items, filters, pagination, loading } = useSelector((state: RootState) => state.voucher);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });


  React.useEffect(() => {
    if (activeCompany?.id) {
      (dispatch as any)(fetchVouchers({
        company_id: activeCompany.id,
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        search: filters.search
      }));
    }
  }, [dispatch, activeCompany?.id, pagination.currentPage, pagination.itemsPerPage, filters.search]);

  const totalPages = pagination.totalPages;
  const paginatedItems = items;

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

  const handlePrintVoucherRecord = (voucher: any) => {
    window.open(`/logistics-print?type=voucher&id=${voucher.id}&print=true`, '_blank');
  };

  const handleExportPDFVoucherRecord = (voucher: any) => {
    window.open(`/logistics-print?type=voucher&id=${voucher.id}`, '_blank');
  };

  const handleDeleteParams = (id: string) => {
    setDeleteModal({ isOpen: true, id });
  };

  const confirmDelete = () => {
    if (deleteModal.id) {
      (dispatch as any)(deleteVoucher(deleteModal.id));
    }
  };

  return (
    <div className="container-fluid py-4 min-vh-100 animate-fade-in px-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <Breadcrumb 
            items={[
              { label: 'Voucher System', active: true }
            ]} 
          />
          <h2 className="fw-900 tracking-tight text-dark mb-1 mt-2">Voucher Management</h2>
          <p className="text-muted small mb-0">Record and track financial transactions for industrial accounts.</p>
        </div>
          <div className="d-flex align-items-center gap-3">
            <ExportExcel 
              data={items} 
              fileName="Voucher_Records" 
              headers={{ voucherNo: 'Voucher No', type: 'Type', partyName: 'Party', amount: 'Amount', date: 'Date', status: 'Status' }}
              buttonText="Export List"
            />
          {checkActionPermission(user, 'mod_voucher', 'create') && (
            <Link href="/vouchers/new" className="btn btn-primary btn-page-action px-4">
              <i className="bi bi-plus-lg"></i>
              <span>Add Voucher</span>
            </Link>
          )}
        </div>
      </div>

      {/* Filters Card */}      
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
                  placeholder="Search by voucher no, party..." 
                  value={filters.search}
                  onChange={(e) => dispatch(setVoucherFilters({ search: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="filter-item-select">
              <select 
                className="form-select search-bar" 
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

            <div className="date-filter-group">
              <input 
                type="date" 
                className="text-muted" 
                value={filters.fromDate}
                onChange={(e) => dispatch(setVoucherFilters({ fromDate: e.target.value }))}
              />
              <span className="text-muted small fw-bold mx-1">TO</span>
              <input 
                type="date" 
                className="text-muted" 
                value={filters.toDate}
                onChange={(e) => dispatch(setVoucherFilters({ toDate: e.target.value }))}
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
                  <th className="py-3 border-0 small fw-bold text-muted">Voucher Info</th>
                  <th className="py-3 border-0 small fw-bold text-muted">Date</th>
                  <th className="py-3 border-0 small fw-bold text-muted">Party / Account</th>
                  <th className="py-3 border-0 small fw-bold text-muted text-end">Amount</th>
                  <th className="py-3 border-0 small fw-bold text-muted">Mode</th>
                  <th className="py-3 border-0 small fw-bold text-muted text-center">Status</th>
                  <th className="py-3 border-0 small fw-bold text-muted text-center px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8}>
                      <Loader text="Fetching Voucher Records..." />
                    </td>
                  </tr>
                ) : (
                  <>
                    {paginatedItems.map((voucher, index) => (
                      <tr key={voucher.id}>
                        <td className="px-4 text-nowrap text-muted small">{(pagination.currentPage - 1) * pagination.itemsPerPage + index + 1}</td>
                        <td className="text-nowrap fw-bold text-dark">
                          {voucher.voucherNo}
                          <div className={`x-small text-capitalize fw-normal ${getTypeColor(voucher.type)}`}>
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
                        <td className="text-nowrap text-muted small text-capitalize fw-bold">{voucher.paymentMode}</td>
                        <td className="text-center">
                          <span className="badge bg-light text-dark border-0 shadow-sm x-small fw-bold text-capitalize">
                            {voucher.status}
                          </span>
                        </td>
                        <td className="text-center px-4 text-nowrap">
                          <div className="d-flex justify-content-center gap-1">
                            {checkActionPermission(user, 'mod_voucher', 'edit') && (
                              <>
                                <Link href={`/vouchers/${voucher.id}/edit`} className="btn-action-view" title="View Detail">
                                  <i className="bi bi-eye-fill"></i>
                                </Link>
                                <Link href={`/vouchers/${voucher.id}/edit?edit=true`} className="btn-action-edit" title="Edit Voucher">
                                  <i className="bi bi-pencil-fill"></i>
                                </Link>
                              </>
                            )}
                            
                            <div className="dropdown">
                              <button 
                                className="btn btn-sm btn-outline-secondary border-0 text-muted p-0 ms-1 d-flex align-items-center justify-content-center" 
                                type="button" 
                                id={`actions-${voucher.id}`} 
                                data-bs-toggle="dropdown" 
                                aria-expanded="false"
                                style={{ width: '32px', height: '32px', borderRadius: '8px' }}
                              >
                                <i className="bi bi-three-dots-vertical fs-5"></i>
                              </button>
                              <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3 py-2" aria-labelledby={`actions-${voucher.id}`}>
                                <li>
                                  <button className="dropdown-item d-flex align-items-center gap-2 py-2" type="button" onClick={() => handlePrintVoucherRecord(voucher)}>
                                    <i className="bi bi-printer text-primary"></i>
                                    <span className="small fw-semibold">Quick Print</span>
                                  </button>
                                </li>
                                <li>
                                  <button className="dropdown-item d-flex align-items-center gap-2 py-2" type="button" onClick={() => handleExportPDFVoucherRecord(voucher)}>
                                    <i className="bi bi-file-earmark-pdf text-danger"></i>
                                    <span className="small fw-semibold">Export PDF</span>
                                  </button>
                                </li>
                                {checkActionPermission(user, 'mod_voucher', 'delete') && (
                                  <>
                                    <li><hr className="dropdown-divider opacity-50" /></li>
                                    <li>
                                      <button 
                                        className="dropdown-item d-flex align-items-center gap-2 py-2 text-danger" 
                                        type="button"
                                        onClick={() => handleDeleteParams(voucher.id)}
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
                    {paginatedItems.length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-center py-5 text-muted">
                          No vouchers found matching your filters.
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
                onPageChange={(page) => dispatch(setVoucherPage(page))} 
              />

            </div>
          )}
        </div>
      </div>

      <ConfirmationModal 
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Delete Voucher Transaction"
        message="Are you sure you want to remove this financial record? This may impact your ledger balances. This action is irreversible."
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

export default VoucherPage;
