'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { fetchInvoices, setInvoicePage } from '@/redux/features/invoiceSlice';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Loader from '@/components/Loader';
import ReportActions from '@/components/ReportActions';
import Breadcrumb from '@/components/Breadcrumb';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import PaginationComponent from '@/components/shared/Pagination';


const InvoiceReportPage = () => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid'>('pending');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const dispatch = useDispatch();
  const { company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items: invoices, pagination, loading } = useSelector((state: RootState) => state.invoices);

  useEffect(() => {
    setMounted(true);
    if (activeCompany?.id) {
      (dispatch as any)(fetchInvoices(activeCompany.id));
    }
  }, [dispatch, activeCompany?.id]);

  if (!mounted) return null;

  const filteredInvoices = invoices.filter(inv => {
    // Exclude 'Without Process' only records from the invoice report
    const invType = String(inv.type || '').toUpperCase();
    if (invType === 'WOP') return false;

    // Status filtering
    const balance = (inv.grandTotal || 0) - (inv.paidAmount || 0);
    if (statusFilter === 'pending' && balance <= 0) return false;
    if (statusFilter === 'paid' && balance > 0) return false;

    const searchTerm = search.toLowerCase();
    const matchesSearch = (
      (inv.customerName?.toLowerCase() ?? '').includes(searchTerm) ||
      (inv.invoiceNumber?.toLowerCase() ?? '').includes(searchTerm)
    );
    
    // Date range filtering
    let matchesDate = true;
    if (fromDate && inv.date && new Date(inv.date) < new Date(fromDate)) matchesDate = false;
    if (toDate && inv.date && new Date(inv.date) > new Date(toDate)) matchesDate = false;

    return matchesSearch && matchesDate;
  });

  const totalPages = Math.ceil(filteredInvoices.length / pagination.itemsPerPage);
  const paginatedItems = filteredInvoices.slice(
    (pagination.currentPage - 1) * pagination.itemsPerPage,
    pagination.currentPage * pagination.itemsPerPage
  );

  const totals = filteredInvoices.reduce((acc, inv) => {
    return {
      count: acc.count + 1,
      taxable: acc.taxable + (inv.subTotal || 0),
      tax: acc.tax + (inv.taxTotal || 0),
      grand: acc.grand + (inv.grandTotal || 0)
    };
  }, { count: 0, taxable: 0, tax: 0, grand: 0 });

  const handlePrintRecord = (inv: any) => {
    // Redirect to the professional industrial invoice preview with auto-print in same tab
    router.push(`/invoices/${inv.id}?print=true`);
  };

  const handleExportPDFRecord = (inv: any) => {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text("GLOBUS ENGINEERING - INVOICE AUDIT", 14, 20);
    autoTable(doc, {
      startY: 30,
      head: [['Category', 'Details']],
      body: [
        ['Customer', inv.customerName], ['Invoice No', inv.invoiceNumber],
        ['Date', inv.date], ['Taxable', `INR ${(inv.subTotal || 0).toLocaleString()}`],
        ['Taxes', `INR ${(inv.taxTotal || 0).toLocaleString()}`],
        ['Grand Total', `INR ${(inv.grandTotal || 0).toLocaleString()}`]
      ],
      theme: 'grid'
    });
    doc.save(`audit_invoice_${inv.invoiceNumber}.pdf`);
  };

  return (
    <div className="container-fluid py-4 animate-fade-in bg-light min-vh-100">
      <div className="d-flex justify-content-between align-items-center mb-4 px-2 flex-wrap gap-2">
        <div>
          <Breadcrumb items={[{ label: 'Intelligence Reports', active: false }, { label: 'Invoice Report', active: true }]} />
          <h2 className="fw-900 mb-1 text-dark tracking-tight mt-2">Invoice Report</h2>
          <p className="text-muted small mb-0 font-weight-500">Comprehensive summary of all generated invoices and billing statements.</p>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-2">
          <ReportActions setFromDate={setFromDate} setToDate={setToDate} title="Invoice Summary Report" />
          <button className="btn btn-white shadow-sm border border-light px-3 d-flex align-items-center gap-2" style={{ height: '36px', borderRadius: '18px' }} onClick={() => (dispatch as any)(fetchInvoices(activeCompany?.id))}>
            <i className="bi bi-arrow-repeat text-primary fw-bold"></i>
            <span className="small fw-800 text-muted">Refresh</span>
          </button>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-4 overflow-hidden rounded-4">
        <div className="card-body p-3">
          <div className="filter-bar-row">
            <div className="filter-item-search">
              <div className="search-group">
                <span className="input-group-text">
                  <i className="bi bi-search"></i>
                </span>
                <input type="text" className="form-control search-bar" placeholder="Search customer or invoice..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>

            <div className="filter-item-select">
              <select 
                className="form-select search-bar"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                style={{ width: '180px' }}
              >
                <option value="pending">Pending Invoices</option>
                <option value="paid">Paid Invoices</option>
                <option value="all">All Invoices</option>
              </select>
            </div>
            
            <div className="date-filter-group">
              <input type="date" className="text-muted" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              <span className="text-muted small fw-bold mx-1">TO</span>
              <input type="date" className="text-muted" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* Audit Summary Cards */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Invoice Count', val: totals.count, icon: 'receipt', color: 'primary' },
          { label: 'Total Taxable', val: `₹${totals.taxable.toLocaleString()}`, icon: 'cash-stack', color: 'info' },
          { label: 'Total Tax', val: `₹${totals.tax.toLocaleString()}`, icon: 'percent', color: 'warning' },
          { label: 'Total Sales', val: `₹${totals.grand.toLocaleString()}`, icon: 'wallet2', color: 'success' }
        ].map((item, i) => (
          <div key={i} className="col-md-3">
            <div className="card shadow-sm border-0 rounded-4 bg-white p-3 h-100 animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="d-flex align-items-center gap-3">
                <div className={`rounded-circle bg-opacity-10 p-2 d-flex align-items-center justify-content-center`} style={{ width: '42px', height: '42px' }}>
                  <i className={`bi bi-${item.icon} text-${item.color} fs-5`}></i>
                </div>
                <div>
                  <p className="text-muted tiny mb-0 fw-bold text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>{item.label}</p>
                  <h4 className="fw-900 mb-0">{item.val}</h4>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card border-0 shadow-sm overflow-hidden rounded-4">
        <div className="card-body p-0">
          {loading ? (
            <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '400px' }}>
              <Loader text="Compiling Data..." />
            </div>
          ) : (
            <>
            <div className="table-responsive" style={{ minHeight: '400px', paddingBottom: '80px' }}>
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light">
                  <tr className="text-capitalize small fw-bold text-muted">
                    <th className="px-4 py-3 border-0">Sno</th>
                    <th className="py-3 border-0">Date</th>
                    <th className="py-3 border-0">Invoice No</th>
                    <th className="py-3 border-0">Customer Name</th>
                    <th className="py-3 border-0 text-end">Subtotal</th>
                    <th className="py-3 border-0 text-end">Taxes</th>
                    <th className="py-3 border-0 text-end">Grand Total</th>
                    <th className="py-3 border-0 text-center px-4" style={{ width: '120px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((inv, index) => (
                    <tr key={inv.id} className="border-bottom border-light">
                      <td className="px-4 small text-muted">
                        {(pagination.currentPage - 1) * pagination.itemsPerPage + index + 1}
                      </td>
                      <td className="small text-muted">{inv.date}</td>
                      <td className="text-dark fw-bold">{inv.invoiceNumber}</td>
                      <td className="text-dark fw-800 text-capitalize" style={{ fontSize: '0.85rem' }}>{inv.customerName}</td>
                      <td className="text-end small">₹{inv.subTotal?.toLocaleString()}</td>
                      <td className="text-end small text-muted">₹{inv.taxTotal?.toLocaleString()}</td>
                      <td className="text-end fw-900 text-dark px-2">₹{inv.grandTotal?.toLocaleString()}</td>
                      <td className="text-center px-4">
                        <div className="d-flex justify-content-center align-items-center gap-1">
                          <Link href={`/invoices/${inv.id}?readonly=true`} className="btn-action-view" title="View Detail"><i className="bi bi-eye-fill"></i></Link>
                          <div className="dropdown">
                            <button className="btn btn-sm btn-outline-secondary border-0 text-muted p-0 ms-1 d-flex align-items-center justify-content-center" type="button" id={`actions-${inv.id}`} data-bs-toggle="dropdown" aria-expanded="false" style={{ width: '32px', height: '32px', borderRadius: '8px' }}>
                              <i className="bi bi-three-dots-vertical fs-5"></i>
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3 py-2" aria-labelledby={`actions-${inv.id}`}>
                               {(inv.type === 'BOTH' || inv.type === 'INVOICE') && (
                                 <li>
                                   <button className="dropdown-item d-flex align-items-center gap-2 py-2" type="button" onClick={() => router.push(`/invoices/${inv.id}?print=true&type=WP`)}>
                                     <i className="bi bi-printer text-primary"></i> <span className="small fw-semibold">WP Print</span>
                                   </button>
                                 </li>
                               )}
                               {(inv.type === 'BOTH' || inv.type === 'WOP') && (
                                 <li>
                                   <button className="dropdown-item d-flex align-items-center gap-2 py-2" type="button" onClick={() => router.push(`/invoices/${inv.id}?print=true&type=WOP`)}>
                                     <i className="bi bi-file-earmark-text text-danger"></i> <span className="small fw-semibold">WOP Print</span>
                                   </button>
                                 </li>
                               )}
                               <li><button className="dropdown-item d-flex align-items-center gap-2 py-2" type="button" onClick={() => handleExportPDFRecord(inv)}><i className="bi bi-file-earmark-pdf text-danger"></i> <span className="small fw-semibold">Export PDF</span></button></li>
                            </ul>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-light-soft fw-900 border-top border-dark">
                    <td colSpan={6} className="text-center py-3 px-4 uppercase" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>Audit Summary (Total Sales Revenue)</td>
                    <td className="text-end py-3 px-2">₹{totals.grand.toLocaleString()}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="p-3 border-top bg-light d-flex justify-content-between align-items-center px-4">
                <span className="text-muted small">Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} to {Math.min(pagination.currentPage * pagination.itemsPerPage, filteredInvoices.length)} of {filteredInvoices.length} entries</span>
                <PaginationComponent 
                  currentPage={pagination.currentPage} 
                  totalPages={totalPages} 
                  onPageChange={(page) => dispatch(setInvoicePage(page))} 
                />

              </div>
            )}
            </>
          )}
        </div>
      </div>
      <style jsx>{` .fw-900 { font-weight: 900; } .bg-light-soft { background-color: #f7f9fc; } .table-responsive { padding-bottom: 80px; } `}</style>
    </div>
  );
};

export default InvoiceReportPage;
