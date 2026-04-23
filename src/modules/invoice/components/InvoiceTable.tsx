'use client';

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { deleteInvoice, setInvoicePage, fetchNextNumbers, fetchInvoices } from '@/redux/features/invoiceSlice';
import { deleteInward, fetchInwards } from '@/redux/features/inwardSlice';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { checkActionPermission } from '@/config/permissions';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Loader from '@/components/Loader';
import ConfirmationModal from '@/components/ConfirmationModal';
import ExportExcel from '@/components/shared/ExportExcel';

const InvoiceTable: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { user, company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items: invoices, filters, pagination, loading: invoiceLoading } = useSelector((state: RootState) => state.invoices);
  const { items: inwards, loading: inwardLoading } = useSelector((state: RootState) => state.inward);
  const initialTab = searchParams.get('tab') as any || 'INVOICELIST';
  const [activeTab, setActiveTab] = useState<'ADD_INVOICE' | 'INVOICELIST' | 'WOP_LIST' | 'BOTH_LIST'>(initialTab);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null; type: 'invoice' | 'inward' | null }>({ isOpen: false, id: null, type: null });

  const handleTabChange = (tab: any) => { setActiveTab(tab); const params = new URLSearchParams(searchParams.toString()); params.set('tab', tab); router.push(`${pathname}?${params.toString()}`); };

  const handlePrintRecord = (item: any) => {
    const isInvoice = !!item.invoiceNumber;
    if (isInvoice) {
      window.open(`/invoices/${item.id}?print=true`, '_blank');
      return;
    }

    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return;
    printWindow.document.write('<html><head><title>Record</title><style>body { font-family: sans-serif; padding: 40px; color: #333; } .header { border-bottom: 2px solid #ea580c; padding-bottom: 20px; margin-bottom: 30px; } .label { font-weight: bold; color: #666; font-size: 0.8rem; text-transform: uppercase; margin-bottom: 4px; } .value { font-size: 1.1rem; margin-bottom: 20px; font-weight: 500; } .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }</style></head><body>');
    printWindow.document.write(`<div class="header"><h1>Globus Engineering</h1><p>Record</p></div>`);
    printWindow.document.write('<div class="grid">');
    printWindow.document.write(`<div><div class="label">Customer</div><div class="value">${item.customerName}</div></div>`);
    printWindow.document.write(`<div><div class="label">DC No</div><div class="value">${item.dcNo || item.challanNo}</div></div>`);
    printWindow.document.write(`<div><div class="label">Date</div><div class="value">${item.date}</div></div>`);
    printWindow.document.write(`<div><div class="label">PO Ref</div><div class="value">${item.poReference || '-'}</div></div>`);
    printWindow.document.write('</div>');
    printWindow.document.close(); printWindow.print();
  };

  const handleExportPDFRecord = (item: any) => {
    const isInvoice = !!item.invoiceNumber;
    if (isInvoice) {
      window.open(`/invoices/${item.id}?exportPDF=true`, '_blank');
      return;
    }

    const doc = new jsPDF();
    doc.setFillColor(37, 99, 235); doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.text("GLOBUS ENGINEERING", 14, 25);
    
    const body = [
      ['Customer', item.customerName],
      ['DC Number', item.dcNo || item.challanNo],
      ['Date', item.date],
      ['PO Reference', item.poReference || '-']
    ];

    autoTable(doc, { startY: 55, body, theme: 'grid', styles: { cellPadding: 8, fontSize: 10 }, columnStyles: { 0: { fontStyle: 'bold', fillColor: [245, 245, 245], cellWidth: 50 } } });
    doc.save(`record_${item.id}.pdf`);
  };

  const handleDeleteParams = (id: string, type: 'invoice' | 'inward') => { setDeleteModal({ isOpen: true, id, type }); };
  const confirmDelete = () => { if (deleteModal.id && deleteModal.type) { if (deleteModal.type === 'invoice') dispatch(deleteInvoice(deleteModal.id) as any); else dispatch(deleteInward(deleteModal.id) as any); } };

  React.useEffect(() => { if (activeCompany?.id) { (dispatch as any)(fetchInwards(activeCompany.id)); (dispatch as any)(fetchInvoices(activeCompany.id)); (dispatch as any)(fetchNextNumbers(activeCompany.id)); } }, [dispatch, activeCompany?.id]);

  const filteredInvoices = invoices.filter(item => {
    if (user?.role !== 'super_admin' && activeCompany && (item.company_id || (item as any).companyId) !== activeCompany.id) return false;
    const itemType = String(item.type || 'INVOICE').toUpperCase();
    if (activeTab === 'INVOICELIST' && (itemType !== 'INVOICE' && itemType !== 'WITH PROCESS')) return false;
    if (activeTab === 'WOP_LIST' && (itemType !== 'WOP' && itemType !== 'WITHOUT PROCESS')) return false;
    if (activeTab === 'BOTH_LIST' && itemType !== 'BOTH') return false;
    const invNo = String(item.invoiceNumber || '').toLowerCase();
    const custName = String(item.customerName || '').toLowerCase();
    const search = String(filters.search || '').toLowerCase();
    const matchesSearch = invNo.includes(search) || custName.includes(search);
    const matchesStatus = (filters.status === 'all' || item.status === filters.status);
    
    // Date range filtering
    let matchesDate = true;
    if (filters.fromDate && item.date && new Date(item.date) < new Date(filters.fromDate)) matchesDate = false;
    if (filters.toDate && item.date && new Date(item.date) > new Date(filters.toDate)) matchesDate = false;

    return matchesSearch && matchesStatus && matchesDate;
  });

  const filteredInwards = inwards.filter(item => (user?.role === 'super_admin' || !activeCompany || (item.company_id || (item as any).companyId) === activeCompany.id) && item.status === 'pending');
  const displayItems: any[] = activeTab === 'ADD_INVOICE' ? filteredInwards : filteredInvoices;
  const totalPages = Math.ceil(displayItems.length / pagination.itemsPerPage);
  const paginatedItems = displayItems.slice((pagination.currentPage - 1) * pagination.itemsPerPage, pagination.currentPage * pagination.itemsPerPage);

  const invoiceHeaders = {
    invoiceNumber: "Invoice Number",
    customerName: "Customer Name",
    date: "Date",
    grandTotal: "Grand Total",
    status: "Status",
    poNo: "PO Number",
    dcNo: "DC Number"
  };

  const renderTabs = () => (
    <div className="d-flex text-uppercase py-2 mb-0 px-3 bg-white border-bottom align-items-center">
      <div className="d-flex gap-2">
        {['ADD_INVOICE', 'INVOICELIST', 'WOP_LIST', 'BOTH_LIST'].map(tab => (
          <button 
            key={tab} 
            className={`btn shadow-none border-0 rounded-3 py-2 px-3 fw-bold small transition-all ${activeTab === tab ? 'bg-danger-subtle text-danger border border-danger-subtle' : 'text-muted'}`} 
            onClick={() => handleTabChange(tab)}
          >
            {tab === 'ADD_INVOICE' ? 'Invoice Selection' : tab === 'INVOICELIST' ? 'WP List' : tab === 'WOP_LIST' ? 'WOP List' : 'Both List'}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="card shadow-sm border-0 bg-white rounded-4 overflow-hidden">
      {renderTabs()}
      <div className="table-responsive" style={{ minHeight: '400px', paddingBottom: '80px' }}>
        <table className="table align-middle mb-0 table-hover bg-white mb-0">
          <thead className="bg-light text-muted small">
            <tr className="border-bottom">
              <th className="fw-semibold px-4 py-3">Sno</th>
              <th className="fw-semibold px-4 py-3">{activeTab === 'ADD_INVOICE' ? 'Customer' : 'Customer Name'}</th>
              <th className="fw-semibold px-4 py-3">{activeTab === 'ADD_INVOICE' ? 'Dc No' : 'Invoice No'}</th>
              <th className="fw-semibold px-4 py-3">{activeTab === 'ADD_INVOICE' ? 'Inward Date' : 'Invoice Date'}</th>
              <th className="fw-semibold px-4 py-3">{activeTab === 'ADD_INVOICE' ? 'PO Ref' : 'Grand Total'}</th>
              <th className="text-center fw-semibold px-4 py-3 pe-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {(activeTab === 'ADD_INVOICE' ? inwardLoading : invoiceLoading) ? <tr><td colSpan={6}><Loader text="Loading..." /></td></tr> : (
              paginatedItems.map((item, index) => (
                <tr key={`${activeTab}-${item.id}`} className="border-bottom text-uppercase">
                  <td className="px-4 text-muted small">{(pagination.currentPage - 1) * pagination.itemsPerPage + index + 1}</td>
                  <td><div className="fw-bold text-dark small">{activeTab === 'ADD_INVOICE' ? (item.customerName || item.vendorName) : item.customerName}</div></td>
                  <td className="text-muted small">{activeTab === 'ADD_INVOICE' ? (item.dcNo || item.challanNo || '-') : item.invoiceNumber}</td>
                  <td className="text-muted small">{item.date}</td>
                  <td className={activeTab === 'ADD_INVOICE' ? "text-muted small" : "text-dark fw-bold small"}>{activeTab === 'ADD_INVOICE' ? (item.poReference || '-') : `₹${item.grandTotal.toLocaleString()}`}</td>
                  <td className="text-center pe-4">
                    <div className="d-flex justify-content-center gap-1 align-items-center">
                      <Link 
                        href={activeTab === 'ADD_INVOICE' ? `/invoices/new?inwardId=${item.id}` : `/invoices/${item.id}`} 
                        className="btn-action-view"
                        title={activeTab === 'ADD_INVOICE' ? "Create Invoice" : "View Invoice"}
                      >
                        <i className={activeTab === 'ADD_INVOICE' ? "bi bi-plus-lg" : "bi bi-eye-fill"}></i>
                      </Link>

                      {activeTab !== 'ADD_INVOICE' && checkActionPermission(user, 'mod_invoice', 'edit') && (
                        <Link 
                          href={`/invoices/${item.id}/edit`} 
                          className="btn-action-edit mx-1"
                          title="Edit Invoice"
                        >
                          <i className="bi bi-pencil-fill"></i>
                        </Link>
                      )}

                      <div className="dropdown">
                        <button 
                          className="btn btn-sm btn-outline-secondary border-0 text-muted p-0" 
                          data-bs-toggle="dropdown" 
                          style={{ width: '32px', height: '32px' }}
                        >
                          <i className="bi bi-three-dots-vertical fs-5"></i>
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 py-2">
                           <li><button className="dropdown-item d-flex align-items-center gap-2 py-2 small" onClick={() => handlePrintRecord(item)}><i className="bi bi-printer text-primary"></i> Quick Print</button></li>
                           {checkActionPermission(user, 'mod_invoice', 'delete') && (
                             <>
                               <li><hr className="dropdown-divider opacity-50" /></li>
                               <li><button className="dropdown-item d-flex align-items-center gap-2 py-2 text-danger fw-bold small" onClick={() => handleDeleteParams(item.id, activeTab === 'ADD_INVOICE' ? 'inward' : 'invoice')}><i className="bi bi-trash3"></i> Remove Record</button></li>
                             </>
                           )}
                        </ul>
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
            {paginatedItems.length === 0 && <tr><td colSpan={6} className="text-center py-5 text-muted small">No records found.</td></tr>}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="p-3 border-top bg-light d-flex justify-content-between align-items-center px-4 small text-muted">
          <span>Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} to {Math.min(pagination.currentPage * pagination.itemsPerPage, displayItems.length)} of {displayItems.length}</span>
          <nav><ul className="pagination pagination-sm mb-0">
            <li className={`page-item ${pagination.currentPage === 1 ? 'disabled' : ''}`}><button className="page-link" onClick={() => dispatch(setInvoicePage(pagination.currentPage - 1))}><i className="bi bi-chevron-left"></i></button></li>
            {[...Array(totalPages)].map((_, i) => (<li key={i} className={`page-item ${pagination.currentPage === i + 1 ? 'active' : ''}`}><button className="page-link" onClick={() => dispatch(setInvoicePage(i + 1))}>{i + 1}</button></li>))}
            <li className={`page-item ${pagination.currentPage === totalPages ? 'disabled' : ''}`}><button className="page-link" onClick={() => dispatch(setInvoicePage(pagination.currentPage + 1))}><i className="bi bi-chevron-right"></i></button></li>
          </ul></nav>
        </div>
      )}
      <ConfirmationModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, id: null, type: null })} onConfirm={confirmDelete} title={deleteModal.type === 'invoice' ? "Remove Invoice Record" : "Remove Inward Selection"} message="Are you sure you want to delete this record? This action is permanent and cannot be undone." />
    </div>
  );
};

export default InvoiceTable;
