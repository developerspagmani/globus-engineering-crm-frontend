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

const VoucherPage = () => {
  const dispatch = useDispatch();
  const { user, company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items, filters, pagination, loading } = useSelector((state: RootState) => state.voucher);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });


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
    
    // Date range filtering
    if (filters.fromDate && item.date && new Date(item.date) < new Date(filters.fromDate)) return false;
    if (filters.toDate && item.date && new Date(item.date) > new Date(filters.toDate)) return false;

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

  const handlePrintVoucherRecord = (voucher: any) => {
    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return;
    printWindow.document.write('<html><head><title>Voucher Summary</title>');
    printWindow.document.write('<style>body { font-family: sans-serif; padding: 40px; color: #333; } .header { border-bottom: 2px solid #ea580c; padding-bottom: 20px; margin-bottom: 30px; } .label { font-weight: bold; color: #666; font-size: 0.8rem; text-transform: uppercase; margin-bottom: 4px; } .value { font-size: 1.1rem; margin-bottom: 20px; font-weight: 500; } .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write('<div class="header"><h1 style="margin: 0; color: #ea580c;">Globus Engineering CRM</h1><p style="margin: 5px 0 0; color: #666;">Voucher Summary Record</p></div>');
    printWindow.document.write('<div class="grid">');
    printWindow.document.write(`<div><div class="label">Voucher No</div><div class="value">${voucher.voucherNo}</div></div>`);
    printWindow.document.write(`<div><div class="label">Date</div><div class="value">${new Date(voucher.date).toLocaleDateString()}</div></div>`);
    printWindow.document.write(`<div><div class="label">Account / Party</div><div class="value">${voucher.partyName}</div></div>`);
    printWindow.document.write(`<div><div class="label">Amount</div><div class="value">₹${voucher.amount.toLocaleString()}</div></div>`);
    printWindow.document.write(`<div><div class="label">Payment Mode</div><div class="value">${voucher.paymentMode.toUpperCase()}</div></div>`);
    printWindow.document.write(`<div><div class="label">Status</div><div class="value">${voucher.status.toUpperCase()}</div></div>`);
    printWindow.document.write('</div>');
    printWindow.document.write('<div style="margin-top: 50px; text-align: center; font-size: 0.8rem; color: #999; border-top: 1px solid #eee; padding-top: 20px;">System Voucher Record on ' + new Date().toLocaleString() + '</div>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  const handleExportPDFVoucherRecord = (voucher: any) => {
    const doc = new jsPDF();
    doc.setFillColor(37, 99, 235); doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.text("GLOBUS ENGINEERING", 14, 25);
    doc.setFontSize(10); doc.text("VOUCHER SUMMARY RECORD", 14, 32);
    doc.setTextColor(33, 33, 33); doc.setFontSize(12); doc.text("TRANSACTION DETAILS", 14, 55);
    autoTable(doc, {
      startY: 60,
      body: [
        ['Voucher Number', voucher.voucherNo], ['Date', new Date(voucher.date).toLocaleDateString()],
        ['Party Name', voucher.partyName], ['Amount', `INR ${voucher.amount.toLocaleString()}`],
        ['Payment Mode', voucher.paymentMode.toUpperCase()], ['Status', voucher.status.toUpperCase()]
      ],
      theme: 'grid', styles: { cellPadding: 8, fontSize: 10 },
      columnStyles: { 0: { fontStyle: 'bold', fillColor: [245, 245, 245], cellWidth: 50 } },
    });
    doc.save(`voucher_${voucher.voucherNo}.pdf`);
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
          <div className="d-flex align-items-center gap-2">
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
              <span className="text-muted small fw-bold mx-1">To</span>
              <input 
                type="date" 
                className="text-muted" 
                value={filters.toDate}
                onChange={(e) => dispatch(setVoucherFilters({ toDate: e.target.value }))}
              />
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
