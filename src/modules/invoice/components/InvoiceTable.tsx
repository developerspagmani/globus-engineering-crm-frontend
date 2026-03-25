'use client';

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { deleteInvoice, setInvoicePage } from '@/redux/features/invoiceSlice';
import { deleteInward, fetchInwards } from '@/redux/features/inwardSlice';
import Link from 'next/link';
import { checkActionPermission } from '@/config/permissions';

const InvoiceTable: React.FC = () => {
  const dispatch = useDispatch();
  const { user, company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items: invoices, filters, pagination } = useSelector((state: RootState) => state.invoices);
  const { items: inwards, loading: inwardLoading } = useSelector((state: RootState) => state.inward);
  
  const [activeTab, setActiveTab] = useState<'ADD_INVOICE' | 'INVOICELIST' | 'WOP_LIST' | 'BOTH_LIST'>('INVOICELIST');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Automatically fetch inwards if not already loaded when viewing Add Invoice tab
  React.useEffect(() => {
    if (activeCompany?.id) {
      (dispatch as any)(fetchInwards(activeCompany.id));
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
        ADD INVOICE
      </button>
      <button 
        className={`btn shadow-none border-0 rounded-0 pb-3 px-3 fw-bold small ${activeTab === 'INVOICELIST' ? 'border-bottom border-danger text-danger' : 'text-muted'}`}
        style={activeTab === 'INVOICELIST' ? { borderBottomWidth: '2px !important' } : {}}
        onClick={() => setActiveTab('INVOICELIST')}
      >
        INVOICELIST
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
       <div className="d-flex gap-1 flex-wrap">
          <button className="btn btn-info text-white btn-sm fw-bold px-3 py-2 rounded-0 shadow-sm" style={{ backgroundColor: '#00bcd4', borderColor: '#00bcd4' }}><i className="bi bi-printer fw-bold"></i> PRINT</button>
          <button className="btn btn-sm fw-bold px-3 py-2 rounded-0 text-white shadow-sm" style={{ backgroundColor: '#9c27b0', borderColor: '#9c27b0' }}><i className="bi bi-file-earmark-spreadsheet fw-bold"></i> EXCEL</button>
          <button className="btn btn-success btn-sm fw-bold px-3 py-2 rounded-0 shadow-sm"><i className="bi bi-files fw-bold"></i> COPY</button>
          <button className="btn btn-warning text-white btn-sm fw-bold px-3 py-2 rounded-0 shadow-sm" style={{ backgroundColor: '#ff9800', borderColor: '#ff9800' }}><i className="bi bi-file-earmark-pdf fw-bold"></i> PDF</button>
          <button className="btn btn-light btn-sm fw-bold px-3 py-2 rounded-0 shadow-sm border"><i className="bi bi-layout-three-columns fw-bold"></i> <i className="bi bi-chevron-down ms-1"></i></button>
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
                <Link href={`/invoices/new?inwardId=${inward.id}`} className="btn btn-sm text-white rounded-circle shadow-sm d-flex align-items-center justify-content-center" style={{ backgroundColor: '#ff4081', width: '32px', height: '32px' }} title="View/Create Invoice">
                  <i className="bi bi-eye fw-bold"></i>
                </Link>
                {checkActionPermission(user, 'mod_invoice', 'delete') && (
                  <button 
                    className="btn btn-sm text-white rounded-circle shadow-sm d-flex align-items-center justify-content-center" 
                    style={{ backgroundColor: '#f44336', width: '32px', height: '32px' }} 
                    title="Delete Inward"
                    onClick={() => { if(window.confirm('Are you sure you want to delete this inward entry?')) dispatch(deleteInward(inward.id) as any) }}
                  >
                    <i className="bi bi-x-circle fw-bold"></i>
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
                 <button className="btn btn-sm text-white rounded-circle shadow-sm" style={{ backgroundColor: '#3f51b5', width: '32px', height: '32px', lineHeight: '18px' }}><i className="bi bi-printer fw-bold" style={{ fontSize: '0.8rem' }}></i></button>
                 <Link href={`/invoices/${invoice.id}/edit`} className="btn btn-sm text-white rounded-circle shadow-sm" style={{ backgroundColor: '#4caf50', width: '32px', height: '32px', lineHeight: '18px' }}><i className="bi bi-pencil fw-bold" style={{ fontSize: '0.8rem' }}></i></Link>
                 <button className="btn btn-sm text-white rounded-circle shadow-sm" style={{ backgroundColor: '#f44336', width: '32px', height: '32px', lineHeight: '18px' }} onClick={() => { if(confirm('Delete?')) dispatch(deleteInvoice(invoice.id) as any) }}><i className="bi bi-x-lg fw-bold" style={{ fontSize: '0.8rem' }}></i></button>
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
                 <button className="btn btn-sm text-white rounded-circle shadow-sm" style={{ backgroundColor: '#03a9f4', width: '32px', height: '32px', lineHeight: '18px' }}><i className="bi bi-printer fw-bold" style={{ fontSize: '0.8rem' }}></i></button>
                 <Link href={`/invoices/${invoice.id}/edit`} className="btn btn-sm text-white rounded-circle shadow-sm" style={{ backgroundColor: '#4caf50', width: '32px', height: '32px', lineHeight: '18px' }}><i className="bi bi-pencil fw-bold" style={{ fontSize: '0.8rem' }}></i></Link>
                 <button className="btn btn-sm text-white rounded-circle shadow-sm" style={{ backgroundColor: '#f44336', width: '32px', height: '32px', lineHeight: '18px' }} onClick={() => { if(confirm('Delete?')) dispatch(deleteInvoice(invoice.id) as any) }}><i className="bi bi-x-lg fw-bold" style={{ fontSize: '0.8rem' }}></i></button>
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
      `}</style>
    </div>
  );
};

export default InvoiceTable;
