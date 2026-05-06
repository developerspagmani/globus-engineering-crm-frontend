'use client';

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { fetchInvoices, setInvoicePage } from '@/redux/features/invoiceSlice';
import { fetchCustomers } from '@/redux/features/customerSlice';
import Link from 'next/link';
import Loader from '@/components/Loader';
import ReportActions from '@/components/ReportActions';
import Breadcrumb from '@/components/Breadcrumb';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import PaginationComponent from '@/components/shared/Pagination';
import api from '@/lib/axios';

const GstReportPage = () => {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const dispatch = useDispatch();
  const { company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items: invoices, pagination, loading: invLoading, aggregates } = useSelector((state: RootState) => state.invoices);
  const { items: customers, loading: custLoading } = useSelector((state: RootState) => state.customers);

  useEffect(() => { 
    setMounted(true); 
    if (activeCompany?.id) {
      (dispatch as any)(fetchInvoices({
        company_id: activeCompany.id,
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        search: search,
        status: statusFilter,
        fromDate: fromDate,
        toDate: toDate,
        type: 'INVOICE,BOTH' // Only taxable invoices for GST
      })); 
      (dispatch as any)(fetchCustomers({ company_id: activeCompany.id })); 
    }
  }, [dispatch, activeCompany?.id, pagination.currentPage, pagination.itemsPerPage, search, statusFilter, fromDate, toDate]);

  const handleFetchAllForExport = async () => {
    if (!activeCompany?.id) return { headers: [], data: [] };
    
    let url = `/invoices?page=1&limit=10000&company_id=${activeCompany.id}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (statusFilter && statusFilter !== 'all') url += `&status=${statusFilter}`;
    if (fromDate) url += `&fromDate=${fromDate}`;
    if (toDate) url += `&toDate=${toDate}`;
    
    const response = await api.get(url);
    const allInvoices = response.data.items;
    
    const data = allInvoices.map((inv: any, idx: number) => {
      const taxable = parseFloat(inv.total || '0');
      return [
        (idx + 1).toString(),
        inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString() : 'N/A',
        inv.customer_name || 'N/A',
        inv.gstin || '-',
        inv.dc_no || '-',
        inv.invoice_no?.toString() || 'N/A',
        taxable.toLocaleString(),
        parseFloat(inv.gst1 || '0').toLocaleString(),
        parseFloat(inv.gst2 || '0').toLocaleString(),
        parseFloat(inv.igst || '0').toLocaleString()
      ];
    });

    
    return {
      headers: ['SNO', 'DATE', 'CUSTOMER', 'GSTIN', 'DC NO', 'INVOICE NO', 'AMOUNT', 'CGST', 'SGST', 'IGST'],
      data
    };
  };

  if (!mounted) return null;

  const totalPages = pagination.totalPages;
  const paginatedItems = (invoices || []);

  // All monetary totals come from backend aggregates (all pages, all matching records)
  const totals = {
    count:   pagination.totalItems || 0,
    taxable: aggregates?.totalTaxable || 0,
    tax:     aggregates?.totalTax     || 0,
    grand:   aggregates?.totalGrand   || 0
  };

  const handlePrint = (item: any) => {
    const p = window.open('', '', 'height=600,width=800'); if (!p) return;
    const taxable = item.subTotal || (item.grandTotal - (item.taxTotal || 0));
    p.document.write('<html><head><title>Audit Record - Globus</title>');
    p.document.write('<style>body{font-family: Arial; padding: 20px;} table{width:100%; border-collapse:collapse; margin-top:20px;} th,td{border:1px solid #ddd; padding:12px; text-align:left;} th{background:#f8f9fa;}</style></head><body>');
    p.document.write(`<h2>GLOBUS ENGINEERING - Audit Record</h2>`);
    p.document.write(`<p><b>Invoice No:</b> ${item.invoiceNumber} | <b>Date:</b> ${item.date}</p>`);
    p.document.write(`<table><tr><th>Audit Detail</th><th>Value</th></tr>`);
    p.document.write(`<tr><td>Customer Name</td><td>${item.customerName}</td></tr>`);
    p.document.write(`<tr><td>Taxable Amount</td><td>₹${taxable.toLocaleString()}</td></tr>`);
    p.document.write(`<tr><td>GST Amount</td><td>₹${(item.taxTotal || 0).toLocaleString()}</td></tr>`);
    p.document.write(`<tr><td>Grand Total</td><td>₹${item.grandTotal.toLocaleString()}</td></tr>`);
    p.document.write(`</table></body></html>`);
    p.document.close(); p.print();
  };

  const handleExport = (item: any) => {
    const doc = new jsPDF();
    const taxable = item.subTotal || (item.grandTotal - (item.taxTotal || 0));
    doc.setFontSize(18);
    doc.text("GLOBUS ENGINEERING - AUDIT RECORD", 14, 20);
    doc.setFontSize(10);
    doc.text(`Invoice Number: ${item.invoiceNumber}`, 14, 30);
    doc.text(`Date: ${item.date}`, 14, 35);
    autoTable(doc, { 
      startY: 45, 
      head: [['Audit Category', 'Value']],
      body: [
        ['Customer Name', item.customerName], 
        ['GSTIN', item.gstin || '-'],
        ['Taxable Amount', `INR ${taxable.toLocaleString()}`], 
        ['GST Amount', `INR ${(item.taxTotal || 0).toLocaleString()}`], 
        ['Grand Total', `INR ${item.grandTotal.toLocaleString()}`]
      ] 
    });
    doc.save(`audit_${item.invoiceNumber}.pdf`);
  };

  return (
    <div className="container-fluid py-4 bg-light min-vh-100 animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4 px-2 flex-wrap gap-2">
        <div><Breadcrumb items={[{ label: 'Reports', active: false }, { label: 'GST Report', active: true }]} /><h2 className="fw-900 mt-2">GST Report</h2><p className="text-muted small mb-0">Tax liability analysis and CGST/SGST/IGST breakdown statements.</p></div>
        <div className="d-flex flex-wrap align-items-center gap-2">
          <ReportActions setFromDate={setFromDate} setToDate={setToDate} title="GST Analysis Report" orientation="landscape" onFetchAll={handleFetchAllForExport} />
          <button className="btn btn-white shadow-sm border border-light px-3 d-flex align-items-center gap-2" style={{ height: '36px', borderRadius: '18px' }} onClick={() => { (dispatch as any)(fetchInvoices({ company_id: activeCompany?.id })); (dispatch as any)(fetchCustomers({ company_id: activeCompany?.id })); }}>
            <i className="bi bi-arrow-repeat text-primary fw-bold"></i>
            <span className="small fw-800 text-muted">Refresh</span>
          </button>
        </div>
      </div>

      <div className="card shadow-sm border-0 mb-4 rounded-4 overflow-hidden">
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
                  placeholder="Search customer or invoice..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                />
              </div>
            </div>
            
            <div className="filter-item-select">
                <select 
                  className="form-select search-bar"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  style={{ width: '180px' }}
                >
                  <option value="all">All Invoices</option>
                  <option value="pending">Pending Invoices</option>
                  <option value="paid">Paid Invoices</option>
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

      {/* Audit Summary Section - Taxable, Tax, Grand Total, Count */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total Invoices', val: totals.count, icon: 'receipt', color: 'primary' },
          { label: 'Total Amount', val: `₹${totals.taxable.toLocaleString()}`, icon: 'cash-stack', color: 'info' },
          { label: 'Tax Collected', val: `₹${totals.tax.toLocaleString()}`, icon: 'percent', color: 'warning' },
          { label: 'Grand Revenue', val: `₹${totals.grand.toLocaleString()}`, icon: 'wallet2', color: 'success' }
        ].map((item, i) => (
          <div key={i} className="col-md-3">
            <div className="card shadow-sm border-0 rounded-4 bg-white p-3 h-100 animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="d-flex align-items-center gap-3">
                <div className={`rounded-circle bg-opacity-10 p-2 d-flex align-items-center justify-content-center`} style={{ width: '42px', height: '42px' }}>
                  <i className={`bi bi-${item.icon} text-${item.color} fs-5`}></i>
                </div>
                <div>
                  <p className="text-muted small mb-0 fw-bold text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>{item.label}</p>
                  <h4 className="fw-900 mb-0">{item.val}</h4>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
        <div className="card-body p-0">
          {(invLoading || custLoading) ? (
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
                    <th className="py-3 border-0">Received Date</th>
                    <th className="py-3 border-0">Customer</th>
                    <th className="py-3 border-0">GST TIN</th>
                    <th className="py-3 border-0 text-center">Dc No</th>
                    <th className="py-3 border-0 text-center">Invoice No</th>
                    <th className="py-3 border-0 text-end">Amount</th>
                    <th className="py-3 border-0 text-end">CGST</th>
                    <th className="py-3 border-0 text-end">SGST</th>
                    <th className="py-3 border-0 text-end">IGST</th>
                    <th className="py-3 border-0 text-center px-4" style={{ width: '80px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((inv, idx) => {
                    const taxable = inv.subTotal || (inv.grandTotal - (inv.taxTotal || 0));
                    return (
                      <tr key={inv.id} className="border-bottom border-light">
                        <td className="px-4 small text-muted ">
                          {(pagination.currentPage - 1) * pagination.itemsPerPage + idx + 1}
                        </td>
                        <td className="small text-muted">{inv.date ? new Date(inv.date).toLocaleDateString() : '-'}</td>
                        <td className="fw-800 text-dark small text-capitalize">{inv.customerName}</td>
                        <td className="small text-muted">{inv.gstin || '-'}</td>
                        <td className="text-center small text-muted">{inv.dcNo || '-'}</td>
                        <td className="text-center text-dark fw-bold">{inv.invoiceNumber}</td>
                        <td className="text-end fw-bold small">₹{taxable.toLocaleString()}</td>
                        <td className="text-end text-muted small">₹{parseFloat(inv.gst1 || '0').toLocaleString()}</td>
                        <td className="text-end text-muted small">₹{parseFloat(inv.gst2 || '0').toLocaleString()}</td>
                        <td className="text-end text-muted small">₹{parseFloat(inv.igst || '0').toLocaleString()}</td>
                        <td className="text-center">
                          <Link href={`/invoices/${inv.id}?readonly=true`} className="btn-action-view">
                            <i className="bi bi-eye-fill"></i>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                  {invoices.length === 0 && (
                    <tr><td colSpan={11} className="text-center py-5 text-muted small">No records found matching filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="p-3 border-top bg-light d-flex justify-content-between align-items-center px-4">
                <span className="text-muted small">Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} to {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems} entries</span>
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

export default GstReportPage;
