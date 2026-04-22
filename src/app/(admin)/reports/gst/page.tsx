'use client';

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { fetchInvoices } from '@/redux/features/invoiceSlice';
import { fetchCustomers } from '@/redux/features/customerSlice';
import Link from 'next/link';
import Loader from '@/components/Loader';
import ReportActions from '@/components/ReportActions';
import Breadcrumb from '@/components/Breadcrumb';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const GstReportPage = () => {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const dispatch = useDispatch();
  const { company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items: invoices, loading: invLoading } = useSelector((state: RootState) => state.invoices);
  const { items: customers, loading: custLoading } = useSelector((state: RootState) => state.customers);

  useEffect(() => { 
    setMounted(true); 
    if (activeCompany?.id) {
      (dispatch as any)(fetchInvoices(activeCompany.id)); 
      (dispatch as any)(fetchCustomers(activeCompany.id)); 
    }
  }, [dispatch, activeCompany?.id]);

  if (!mounted) return null;

  const filteredItems = (invoices || []).filter(inv => {
    // Exclude 'Without Process' records from GST report as they are non-taxable
    const invType = String(inv.type || '').toUpperCase();
    if (invType === 'WOP' || invType === 'WITHOUT PROCESS') return false;

    const matchesSearch = (inv.customerName?.toLowerCase() || '').includes(search.toLowerCase()) || 
                         (inv.invoiceNumber?.toLowerCase() || '').includes(search.toLowerCase());
    
    // Date range filtering
    let matchesDate = true;
    if (fromDate && inv.date && new Date(inv.date) < new Date(fromDate)) matchesDate = false;
    if (toDate && inv.date && new Date(inv.date) > new Date(toDate)) matchesDate = false;

    return matchesSearch && matchesDate;
  });

  const totals = filteredItems.reduce((acc, inv) => {
    const taxable = inv.subTotal || (inv.grandTotal - (inv.taxTotal || 0));
    return {
      taxable: acc.taxable + taxable,
      tax: acc.tax + (inv.taxTotal || 0),
      grand: acc.grand + inv.grandTotal,
      count: acc.count + 1
    };
  }, { taxable: 0, tax: 0, grand: 0, count: 0 });

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
          <ReportActions setFromDate={setFromDate} setToDate={setToDate} title="GST Analysis Report" />
          <button className="btn btn-white shadow-sm border border-light px-3 d-flex align-items-center gap-2" style={{ height: '36px', borderRadius: '18px' }} onClick={() => { (dispatch as any)(fetchInvoices(activeCompany?.id)); (dispatch as any)(fetchCustomers(activeCompany?.id)); }}>
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
          { label: 'Taxable Amount', val: `₹${totals.taxable.toLocaleString()}`, icon: 'cash-stack', color: 'info' },
          { label: 'Tax Collected', val: `₹${totals.tax.toLocaleString()}`, icon: 'percent', color: 'warning' },
          { label: 'Grand Revenue', val: `₹${totals.grand.toLocaleString()}`, icon: 'wallet2', color: 'success' }
        ].map((item, i) => (
          <div key={i} className="col-md-3">
            <div className="card shadow-sm border-0 rounded-4 bg-white p-3 h-100 animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="d-flex align-items-center gap-3">
                <div className={`rounded-circle bg-${item.color} bg-opacity-10 p-2 d-flex align-items-center justify-content-center`} style={{ width: '42px', height: '42px' }}>
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
            <div className="table-responsive" style={{ minHeight: '400px', paddingBottom: '80px' }}>
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light">
                  <tr className="text-capitalize small fw-bold text-muted">
                    <th className="px-4 py-3 border-0">Sno</th>
                    <th className="py-3 border-0">Date</th>
                    <th className="py-3 border-0">Invoice No</th>
                    <th className="py-3 border-0">Customer Name</th>
                    <th className="py-3 border-0">GSTIN</th>
                    <th className="py-3 border-0 text-end">Amount</th>
                    <th className="py-3 border-0 text-center">Taxes</th>
                    <th className="py-3 border-0 text-center" style={{ width: '120px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((inv, idx) => {
                    const customer = customers.find(c => c.id === inv.customerId);
                    return (
                      <tr key={inv.id} className="border-bottom border-light">
                        <td className="px-4 small text-muted font-monospace">{idx + 1}</td>
                        <td className="small text-muted">{inv.date}</td>
                        <td className="text-dark fw-bold">{inv.invoiceNumber}</td>
                        <td className="fw-800 text-dark small text-capitalize">{inv.customerName}</td>
                        <td className="small text-muted font-monospace">{customer?.gst || '-'}</td>
                        <td className="text-end fw-900 font-monospace px-2">₹{inv.grandTotal.toLocaleString()}</td>
                        <td className="text-center small text-muted font-monospace">₹{inv.taxTotal?.toLocaleString() || '-'}</td>
                        <td className="text-center">
                          <div className="d-flex justify-content-center gap-1">
                            <Link href={`/invoices/${inv.id}?readonly=true`} className="btn-action-view">
                              <i className="bi bi-eye-fill"></i>
                            </Link>
                            <div className="dropdown">
                              <button className="btn btn-sm btn-outline-secondary border-0 p-0" data-bs-toggle="dropdown" style={{ width: '32px', height: '32px' }}>
                                <i className="bi bi-three-dots-vertical fs-5"></i>
                              </button>
                              <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 py-2">
                                <li><button className="dropdown-item d-flex align-items-center gap-2 py-2 small" onClick={() => handlePrint(inv)}><i className="bi bi-printer text-primary"></i> Quick Print</button></li>
                                <li><button className="dropdown-item d-flex align-items-center gap-2 py-2 small" onClick={() => handleExport(inv)}><i className="bi bi-file-earmark-pdf text-danger"></i> Export PDF</button></li>
                              </ul>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-light-soft fw-900 border-top border-dark">
                    <td colSpan={5} className="text-center py-3">Audit Summary (Grand Totals)</td>
                    <td className="text-end py-3 px-2">₹{totals.grand.toLocaleString()}</td>
                    <td className="text-center py-3">₹{totals.tax.toLocaleString()}</td>
                    <td></td>
                  </tr>
                  <tr className="bg-white small text-muted text-uppercase">
                    <td colSpan={5} className="text-center py-1">Cumulative Taxable Value</td>
                    <td colSpan={2} className="text-center py-1 fw-bold text-info border-start border-end">₹{totals.taxable.toLocaleString()}</td>
                    <td></td>
                  </tr>
                  {filteredItems.length === 0 && (
                    <tr><td colSpan={8} className="text-center py-5 text-muted small">No records found matching filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <style jsx>{` .fw-900 { font-weight: 900; } .bg-light-soft { background-color: #f7f9fc; } .table-responsive { padding-bottom: 80px; } `}</style>
    </div>
  );
};

export default GstReportPage;
