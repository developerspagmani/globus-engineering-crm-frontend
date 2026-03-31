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

  const handleCopyTable = () => {
    const table = document.querySelector('table');
    if (!table) return;
    let text = "";
    const rows = table.querySelectorAll('tr');
    rows.forEach(row => {
      const cols = Array.from(row.querySelectorAll('th, td'));
      const rowData = cols.slice(0, -1).map(col => (col as HTMLElement).innerText.trim()).join("\t");
      text += rowData + "\n";
    });
    navigator.clipboard.writeText(text).then(() => alert("Table data copied to clipboard!"));
  };

  const handleExportExcel = () => {
    const rows = document.querySelectorAll('table tr');
    let csvContent = "data:text/csv;charset=utf-8,";
    rows.forEach(row => {
      const cols = Array.from(row.querySelectorAll('th, td'));
      const rowData = cols.slice(0, -1).map(col => `"${(col as HTMLElement).innerText.replace(/"/g, '""').trim()}"`).join(",");
      csvContent += rowData + "\r\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `vouchers_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintVoucherRecord = (voucher: any) => {
    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return;
    printWindow.document.write('<html><head><title>Voucher Summary</title>');
    printWindow.document.write('<style>body { font-family: sans-serif; padding: 40px; color: #333; } .header { border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; } .label { font-weight: bold; color: #666; font-size: 0.8rem; text-transform: uppercase; margin-bottom: 4px; } .value { font-size: 1.1rem; margin-bottom: 20px; font-weight: 500; } .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write('<div class="header"><h1 style="margin: 0; color: #2563eb;">Globus Engineering CRM</h1><p style="margin: 5px 0 0; color: #666;">Voucher Summary Record</p></div>');
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
          <div className="d-flex flex-wrap align-items-center gap-2">
            <div className="flex-grow-1" style={{ minWidth: '300px' }}>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0 text-muted ps-3 py-2">
                  <i className="bi bi-search"></i>
                </span>
                <input 
                  type="text" 
                  className="form-control border-start-0 ps-0 py-2" 
                  placeholder="Search by voucher no, party..." 
                  value={filters.search}
                  onChange={(e) => dispatch(setVoucherFilters({ search: e.target.value }))}
                />
              </div>
            </div>
            
            <div style={{ width: '150px' }}>
              <select 
                className="form-select py-2" 
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

            <div className="ms-auto d-flex gap-2 align-items-center">
              <div className="btn-group p-1 bg-light rounded-3 shadow-none me-2 d-none d-sm-flex" style={{ height: '42px' }}>
                <button 
                  className={`btn btn-sm rounded-pill px-3 ${filters.status === 'all' ? 'bg-white shadow-sm fw-700' : 'text-muted border-0'}`}
                  onClick={() => dispatch(setVoucherFilters({ status: 'all' }))}
                >All</button>
                <button 
                  className={`btn btn-sm rounded-pill px-3 ${filters.status === 'posted' ? 'bg-white shadow-sm fw-700 text-success' : 'text-muted border-0'}`}
                  onClick={() => dispatch(setVoucherFilters({ status: 'posted' }))}
                >Posted</button>
              </div>
              <button onClick={handleExportExcel} className="btn shadow-sm text-white fw-bold d-flex align-items-center gap-2 px-3 border-0 transition-smooth" style={{ backgroundColor: '#da3e00', borderRadius: 'var(--radius-lg)', height: '42px', fontSize: '0.8rem' }}>
                <i className="bi bi-file-earmark-spreadsheet"></i> EXCEL
              </button>
              <button onClick={handleCopyTable} className="btn shadow-sm btn-success fw-bold d-flex align-items-center gap-2 px-3 border-0 transition-smooth" style={{ height: '42px', fontSize: '0.8rem', borderRadius: 'var(--radius-lg)' }}>
                <i className="bi bi-files"></i> COPY
              </button>
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
                          <div className="d-flex justify-content-center gap-1">
                            {checkActionPermission(user, 'mod_voucher', 'edit') && (
                              <Link href={`/vouchers/${voucher.id}/edit`} className="btn-action-view" title="View Profile">
                                <i className="bi bi-eye-fill"></i>
                              </Link>
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
