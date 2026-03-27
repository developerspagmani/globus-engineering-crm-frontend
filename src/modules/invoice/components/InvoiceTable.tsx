'use client';

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { deleteInvoice, setInvoicePage, fetchNextNumbers } from '@/redux/features/invoiceSlice';
import { deleteInward, fetchInwards } from '@/redux/features/inwardSlice';
import Link from 'next/link';
import { checkActionPermission } from '@/config/permissions';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const InvoiceTable: React.FC = () => {
  const dispatch = useDispatch();
  const { user, company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items: invoices, filters, pagination } = useSelector((state: RootState) => state.invoices);
  const { items: inwards, loading: inwardLoading } = useSelector((state: RootState) => state.inward);
  
  const [activeTab, setActiveTab] = useState<'ADD_INVOICE' | 'INVOICELIST' | 'WOP_LIST' | 'BOTH_LIST'>('INVOICELIST');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [localFilter, setLocalFilter] = useState('');

  // --- ACTIONS ---
  const handlePrint = () => {
    const table = document.querySelector('table');
    if (!table) return;

    // Clone table and remove action column
    const printTable = table.cloneNode(true) as HTMLTableElement;
    const headerRow = printTable.querySelector('thead tr');
    if (headerRow) {
      const lastTh = headerRow.querySelector('th:last-child');
      if (lastTh) lastTh.remove();
    }
    const bodyRows = printTable.querySelectorAll('tbody tr');
    bodyRows.forEach(row => {
      const lastTd = row.querySelector('td:last-child');
      if (lastTd) lastTd.remove();
    });

    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return;

    printWindow.document.write('<html><head><title>Print Records</title>');
    printWindow.document.write('<style>table {width:100%; border-collapse: collapse; font-family: Arial;} th, td {border: 1px solid #ddd; padding: 10px; text-align: left;} th {background-color: #f2f2f2;} .text-uppercase {text-transform: uppercase;}</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write('<h2 style="text-align: center;">Globus Engineering CRM - Record Export</h2>');
    printWindow.document.write(printTable.outerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  const handleCopyTable = () => {
    const table = document.querySelector('table');
    if (!table) return;
    
    let text = "";
    const rows = table.querySelectorAll('tr');
    rows.forEach(row => {
      const cols = Array.from(row.querySelectorAll('th, td'));
      // Exclude the last column (Action)
      const rowData = cols.slice(0, -1).map(col => (col as HTMLElement).innerText.trim()).join("\t");
      text += rowData + "\n";
    });

    navigator.clipboard.writeText(text).then(() => {
      alert("Table data copied to clipboard!");
    });
  };

  const handleExportExcel = () => {
    const rows = document.querySelectorAll('table tr');
    let csvContent = "data:text/csv;charset=utf-8,";
    
    rows.forEach(row => {
      const cols = Array.from(row.querySelectorAll('th, td'));
      // Exclude the last column (Action)
      const rowData = cols.slice(0, -1)
        .map(col => `"${(col as HTMLElement).innerText.replace(/"/g, '""').trim()}"`)
        .join(",");
      csvContent += rowData + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `invoices_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const table = document.querySelector('table');
    if (!table) return;

    const headers = Array.from(table.querySelectorAll('thead th')).slice(0, -1).map(h => (h as HTMLElement).innerText.trim());
    const data = Array.from(table.querySelectorAll('tbody tr')).map(row => {
      return Array.from(row.querySelectorAll('td')).slice(0, -1).map(td => (td as HTMLElement).innerText.trim());
    });

    doc.text("Globus Engineering CRM - Invoice Records", 14, 15);
    autoTable(doc, {
      head: [headers],
      body: data,
      startY: 20,
      theme: 'striped',
      headStyles: { fillColor: [0, 188, 212] }, // Match Cyan
    });

    doc.save(`invoices_export_${new Date().toISOString().split('T')[0]}.pdf`);
  };


  // Automatically fetch inwards if not already loaded when viewing Add Invoice tab
  React.useEffect(() => {
    if (activeCompany?.id) {
      (dispatch as any)(fetchInwards(activeCompany.id));
      (dispatch as any)(fetchNextNumbers(activeCompany.id));
    }
  }, [dispatch, activeCompany?.id]);

  // Filter invoices for regular invoice list and WOP list
  const filteredInvoices = invoices.filter(item => {
    // Super Admin Bypass: If no activeCompany is selected and role is super_admin, show all
    if (user?.role !== 'super_admin' && activeCompany && item.company_id !== activeCompany.id) return false;
    if (user?.role === 'super_admin' && activeCompany && item.company_id !== activeCompany.id) return false;
    
    // Tab specific type filtering (Case-Insensitive)
    const itemType = String(item.type || 'INVOICE').toUpperCase();
    
    if (activeTab === 'INVOICELIST' && (itemType !== 'INVOICE' && itemType !== 'BOTH' && itemType !== 'WITH PROCESS')) return false;
    if (activeTab === 'WOP_LIST' && (itemType !== 'WOP' && itemType !== 'BOTH' && itemType !== 'WITHOUT PROCESS')) return false;
    // BOTH_LIST shows everything (no filtering)

    const invNo = String(item.invoiceNumber || '').toLowerCase();
    const custName = String(item.customerName || '').toLowerCase();
    const search = String(filters.search || '').toLowerCase();
    
    const matchesSearch = invNo.includes(search) || custName.includes(search);
    const matchesStatus = filters.status === 'all' || item.status === filters.status;
    return matchesSearch && matchesStatus;
  });

  // Filter inwards for ADD INVOICE tab
  const filteredInwards = inwards.filter(item => {
    if (user?.role !== 'super_admin' && activeCompany && item.company_id !== activeCompany.id) return false;
    if (user?.role === 'super_admin' && activeCompany && item.company_id !== activeCompany.id) return false;
    // Only show entries that are strictly 'pending'
    return item.status === 'pending';
  });

  const displayItems: any[] = activeTab === 'ADD_INVOICE' ? filteredInwards : filteredInvoices;
  const totalPages = Math.ceil(displayItems.length / pagination.itemsPerPage);
  const paginatedItems = displayItems.slice(
    (pagination.currentPage - 1) * pagination.itemsPerPage,
    pagination.currentPage * pagination.itemsPerPage
  );

  const renderTabs = () => (
    <div className="d-flex text-uppercase pt-3 mb-0 px-3 bg-white border-bottom">
      <button 
        className={`btn shadow-none border-0 rounded-0 pb-3 px-3 fw-bold small ${activeTab === 'ADD_INVOICE' ? 'border-bottom border-danger text-danger' : 'text-muted'}`}
        style={activeTab === 'ADD_INVOICE' ? { borderBottomWidth: '2px !important' } : {}}
        onClick={() => setActiveTab('ADD_INVOICE')}
      >
        INVOICE SELECTION
      </button>
      <button 
        className={`btn shadow-none border-0 rounded-0 pb-3 px-3 fw-bold small ${activeTab === 'INVOICELIST' ? 'border-bottom border-danger text-danger' : 'text-muted'}`}
        style={activeTab === 'INVOICELIST' ? { borderBottomWidth: '2px !important' } : {}}
        onClick={() => setActiveTab('INVOICELIST')}
      >
        WP LIST
      </button>
      <button 
        className={`btn shadow-none border-0 rounded-0 pb-3 px-3 fw-bold small ${activeTab === 'WOP_LIST' ? 'border-bottom border-danger text-danger' : 'text-muted'}`}
        style={activeTab === 'WOP_LIST' ? { borderBottomWidth: '2px !important' } : {}}
        onClick={() => setActiveTab('WOP_LIST')}
      >
        WOP LIST
      </button>
      <button 
        className={`btn shadow-none border-0 rounded-0 pb-3 px-3 fw-bold small ${activeTab === 'BOTH_LIST' ? 'border-bottom border-danger text-danger' : 'text-muted'}`}
        style={activeTab === 'BOTH_LIST' ? { borderBottomWidth: '2px !important' } : {}}
        onClick={() => setActiveTab('BOTH_LIST')}
      >
        BOTH LIST
      </button>
    </div>
  );

  const renderToolbar = () => (
    <div className="d-flex justify-content-between px-4 align-items-center py-3 bg-white border-bottom flex-wrap gap-3">
       <div className="d-flex align-items-center gap-2">
          <span className="small text-muted fw-semibold">Filter:</span>
          <input type="text" className="form-control form-control-sm border-0 border-bottom rounded-0 shadow-none" placeholder="Type to filter..." style={{ width: '150px' }} />
          <span className="ms-3 small text-muted fw-semibold">Show:</span>
          <select className="form-select form-select-sm border-0 border-bottom rounded-0 shadow-none w-auto pe-4">
             <option>10</option>
             <option>25</option>
             <option>50</option>
          </select>
       </div>
       <div className="d-flex gap-1 flex-wrap hide-print">
          <button onClick={handlePrint} className="btn btn-info text-white btn-sm fw-bold px-3 py-2 rounded-0 shadow-sm" style={{ backgroundColor: '#3B82F6', borderColor: '#3B82F6' }}><i className="bi bi-printer fw-bold"></i> PRINT</button>
          <button onClick={handleExportExcel} className="btn btn-sm fw-bold px-3 py-2 rounded-0 text-white shadow-sm" style={{ backgroundColor: '#da3e00', borderColor: '#da3e00' }}><i className="bi bi-file-earmark-spreadsheet fw-bold"></i> EXCEL</button>
          <button onClick={handleCopyTable} className="btn btn-success btn-sm fw-bold px-3 py-2 rounded-0 shadow-sm"><i className="bi bi-files fw-bold"></i> COPY</button>
          <button onClick={handleExportPDF} className="btn btn-warning text-white btn-sm fw-bold px-3 py-2 rounded-0 shadow-sm" style={{ backgroundColor: '#ff9800', borderColor: '#ff9800' }}><i className="bi bi-file-earmark-pdf fw-bold"></i> PDF</button>
       </div>
    </div>
  );

  const renderAddInvoiceTable = () => (
    <table className="table align-middle mb-0 table-hover bg-white mb-0">
      <thead className="table-light text-muted small">
        <tr className="border-bottom">
          <th className="fw-semibold px-4 py-3">Sno <i className="bi bi-chevron-expand ms-1 opacity-50"></i></th>
          <th className="fw-semibold">Customer <i className="bi bi-chevron-expand ms-1 opacity-50"></i></th>
          <th className="fw-semibold">Po No <i className="bi bi-chevron-expand ms-1 opacity-50"></i></th>
          <th className="fw-semibold">Dc No <i className="bi bi-chevron-expand ms-1 opacity-50"></i></th>
          <th className="fw-semibold">Inward Date <i className="bi bi-chevron-expand ms-1 opacity-50"></i></th>
          <th className="text-center fw-semibold pe-4">Action <i className="bi bi-chevron-expand ms-1 opacity-50"></i></th>
        </tr>
      </thead>
      <tbody>
        {paginatedItems.map((inward, index) => (
          <tr key={inward.id} className="border-bottom">
            <td className="px-4 text-muted">{index + 1}</td>
            <td>
               <div className="fw-bold text-dark small text-uppercase">{inward.customerName || inward.vendorName}</div>
               <div className="small text-muted text-uppercase mt-1" style={{ fontSize: '0.75rem' }}>{inward.address || 'COMPANY ADDRESS'}</div>
            </td>
            <td className="text-muted small">{inward.poReference || '-'}</td>
            <td className="text-muted small">{inward.dcNo || inward.challanNo || '-'}</td>
            <td className="text-muted small">{inward.date}</td>
            <td className="text-center pe-4">
              <div className="d-flex justify-content-center gap-2">
                <Link href={`/invoices/new?inwardId=${inward.id}`} className="btn-action-edit" style={{ backgroundColor: '#ff4081 !important' }} title="View/Create Invoice">
                  <i className="bi bi-eye-fill"></i>
                </Link>
                {checkActionPermission(user, 'mod_invoice', 'delete') && (
                  <button 
                    className="btn-action-delete" 
                    title="Delete Inward"
                    onClick={() => { if(window.confirm('Are you sure you want to delete this inward entry?')) dispatch(deleteInward(inward.id) as any) }}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                )}
              </div>
            </td>
          </tr>
        ))}
        {paginatedItems.length === 0 && <tr><td colSpan={6} className="text-center py-4 text-muted">No pending inwards available.</td></tr>}
      </tbody>
    </table>
  );

  const renderInvoiceTable = () => (
    <table className="table align-middle mb-0 table-hover bg-white mb-0">
      <thead className="table-light text-muted small">
        <tr className="border-bottom">
          <th className="fw-semibold px-4 py-3">Sno <i className="bi bi-chevron-expand ms-1 opacity-50"></i></th>
          <th className="fw-semibold">Customer <i className="bi bi-chevron-expand ms-1 opacity-50"></i></th>
          <th className="fw-semibold">Invoice No <i className="bi bi-chevron-expand ms-1 opacity-50"></i></th>
          <th className="fw-semibold">Invoice Date <i className="bi bi-chevron-expand ms-1 opacity-50"></i></th>
          <th className="fw-semibold">Grand Total <i className="bi bi-chevron-expand ms-1 opacity-50"></i></th>
          <th className="text-center fw-semibold pe-4">Action <i className="bi bi-chevron-expand ms-1 opacity-50"></i></th>
        </tr>
      </thead>
      <tbody>
        {paginatedItems.map((invoice, index) => (
          <tr key={invoice.id} className="border-bottom">
            <td className="px-4 text-muted">{index + 1}</td>
            <td>
               <div className="text-dark small text-uppercase py-2">{invoice.customerName}</div>
            </td>
            <td className="text-muted small">{invoice.invoiceNumber}</td>
            <td className="text-muted small">{invoice.date}</td>
            <td className="text-muted small">{invoice.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            <td className="text-center pe-4">
              <div className="d-flex justify-content-center gap-2">
                 <Link href={`/invoices/${invoice.id}/edit`} className="btn-action-edit" title="Edit">
                   <i className="bi bi-pencil-fill"></i>
                 </Link>
                 <button className="btn-action-delete" onClick={() => { if(confirm('Delete?')) dispatch(deleteInvoice(invoice.id) as any) }}>
                   <i className="bi bi-x-lg"></i>
                 </button>
              </div>
            </td>
          </tr>
        ))}
        {paginatedItems.length === 0 && <tr><td colSpan={6} className="text-center py-4 text-muted">No invoices found.</td></tr>}
      </tbody>
    </table>
  );

  const renderWopTable = () => (
    <table className="table align-middle mb-0 table-hover bg-white mb-0">
      <thead className="table-light text-muted small">
        <tr className="border-bottom">
          <th className="fw-semibold px-4 py-3">Sno <i className="bi bi-chevron-expand ms-1 opacity-50"></i></th>
          <th className="fw-semibold">Customer <i className="bi bi-chevron-expand ms-1 opacity-50"></i></th>
          <th className="fw-semibold">Dc No <i className="bi bi-chevron-expand ms-1 opacity-50"></i></th>
          <th className="fw-semibold">Dc Date <i className="bi bi-chevron-expand ms-1 opacity-50"></i></th>
          <th className="fw-semibold">Grand Total <i className="bi bi-chevron-expand ms-1 opacity-50"></i></th>
          <th className="text-center fw-semibold pe-4">Action <i className="bi bi-chevron-expand ms-1 opacity-50"></i></th>
        </tr>
      </thead>
      <tbody>
        {paginatedItems.map((invoice, index) => (
          <tr key={invoice.id} className="border-bottom">
            <td className="px-4 text-muted">{index + 1}</td>
            <td>
               <div className="text-dark small text-uppercase py-2">{invoice.customerName}</div>
            </td>
            <td className="text-muted small">{invoice.invoiceNumber.replace('INV-', '')}</td>
            <td className="text-muted small">{invoice.date}</td>
            <td className="text-muted small">{invoice.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            <td className="text-center pe-4">
                <div className="d-flex justify-content-center gap-2">
                    {checkActionPermission(user, 'mod_invoice', 'edit') && (
                        <Link href={`/invoices/${invoice.id}/edit`} className="btn-action-edit" title="Edit">
                            <i className="bi bi-pencil-fill"></i>
                        </Link>
                    )}
                    {checkActionPermission(user, 'mod_invoice', 'delete') && (
                        <button 
                            className="btn-action-delete" 
                            title="Delete"
                            onClick={() => { if(confirm('Delete?')) dispatch(deleteInvoice(invoice.id) as any) }}
                        >
                            <i className="bi bi-x-lg"></i>
                        </button>
                    )}
                </div>
            </td>
          </tr>
        ))}
        {paginatedItems.length === 0 && <tr><td colSpan={6} className="text-center py-4 text-muted">No WOP entries found.</td></tr>}
      </tbody>
    </table>
  );

  return (
    <div className="card shadow-sm border-0 bg-white overflow-hidden rounded-0">
      {renderTabs()}
      {renderToolbar()}
      <div className="table-responsive">
        {activeTab === 'ADD_INVOICE' && renderAddInvoiceTable()}
        {activeTab === 'INVOICELIST' && renderInvoiceTable()}
        {(activeTab === 'WOP_LIST' || activeTab === 'BOTH_LIST') && renderWopTable()}
      </div>
      {totalPages > 1 && (
        <div className="p-3 border-top bg-white d-flex justify-content-between align-items-center">
          <span className="text-muted small">Showing {paginatedItems.length} of {displayItems.length} entries</span>
          <nav>
            <ul className="pagination pagination-sm mb-0">
              {[...Array(totalPages)].map((_, i) => (
                <li key={i} className={`page-item ${pagination.currentPage === i + 1 ? 'active' : ''}`}>
                  <button className="page-link" onClick={() => dispatch(setInvoicePage(i + 1))}>{i + 1}</button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
      <style jsx>{`
        .table th { border-bottom: 2px solid #eee !important; font-size: 0.8rem; }
        .table td { border-bottom: 1px solid #f5f5f5; }
        .btn:hover { opacity: 0.9; }
        .border-danger { border-color: #ff4081 !important; color: #ff4081 !important; }
        .text-danger { color: #ff4081 !important; }
        
        @media print {
          :global(body *) { visibility: hidden; }
          .table-responsive, .table-responsive * { visibility: visible; }
          .table-responsive { position: absolute; left: 0; top: 0; width: 100%; }
          .table th:last-child, .table td:last-child { display: none !important; }
          .table { border: 1px solid #dee2e6 !important; width: 100% !important; }
          .hide-print { display: none !important; }
          :global(.sidebar), :global(.header), :global(.breadcrumb), .card-header, .pagination, .border-bottom { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default InvoiceTable;
