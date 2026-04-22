'use client';

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { fetchVouchers } from '@/redux/features/voucherSlice';
import { fetchPendingPayments } from '@/redux/features/pendingPaymentSlice';
import { fetchCustomers } from '@/redux/features/customerSlice';
import Link from 'next/link';
import Loader from '@/components/Loader';
import ReportActions from '@/components/ReportActions';
import Breadcrumb from '@/components/Breadcrumb';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const PaymentReportPage = () => {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'PAYMENT' | 'PENDING'>('PAYMENT');
  const [ageingFilter, setAgeingFilter] = useState<'all' | '0-30' | '31-60' | '61-90' | '90+'>('all');
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const dispatch = useDispatch();
  const { company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items: vouchers, loading: vLoading } = useSelector((state: RootState) => state.voucher);
  const { items: pending, loading: pLoading } = useSelector((state: RootState) => state.pendingPayments);
  const { items: customers } = useSelector((state: RootState) => state.customers);
  const { settings: invSettings } = useSelector((state: RootState) => state.invoices);

  useEffect(() => {
    setMounted(true);
    if (activeCompany?.id) { 
      (dispatch as any)(fetchVouchers(activeCompany.id)); 
      (dispatch as any)(fetchPendingPayments(activeCompany.id)); 
      (dispatch as any)(fetchCustomers(activeCompany.id));
    }
  }, [dispatch, activeCompany?.id]);

  if (!mounted) return null;

  const calculateDays = (dateStr: string) => {
    const invDate = new Date(dateStr); const today = new Date();
    return Math.ceil(Math.abs(today.getTime() - invDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  const matchesDate = (dateStr: string) => {
    if (!dateStr) return true;
    const date = new Date(dateStr);
    if (fromDate && date < new Date(fromDate)) return false;
    if (toDate && date > new Date(toDate)) return false;
    return true;
  };

  const paymentData = vouchers.filter(v => {
    const matchesCustomer = !selectedCustomerId || String(v.partyId) === String(selectedCustomerId);
    return v.type === 'receipt' && matchesCustomer && (v.partyName?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) && matchesDate(v.date);
  });
  
  const filteredPending = pending.filter(inv => {
    const days = calculateDays(inv.date);
    const matchesCustomer = !selectedCustomerId || String(inv.customerId) === String(selectedCustomerId);
    const matchSearch = (inv.customerName?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) || (inv.invoiceNumber?.toLowerCase() ?? '').includes(searchTerm.toLowerCase());
    if (!matchesCustomer) return false;
    if (!matchSearch) return false;
    if (!matchesDate(inv.date)) return false;
    if (ageingFilter === '0-30') return days <= 30;
    if (ageingFilter === '31-60') return days > 30 && days <= 60;
    if (ageingFilter === '61-90') return days > 60 && days <= 90;
    if (ageingFilter === '90+') return days > 90;
    return true;
  });

  const totals = {
    paymentCount: paymentData.length,
    totalCollected: paymentData.reduce((sum, v) => sum + v.amount, 0),
    pendingCount: filteredPending.length,
    totalOutstanding: filteredPending.reduce((sum, inv) => sum + (inv.grandTotal - (inv.paidAmount || 0)), 0),
    criticalOverdue: filteredPending.filter(inv => calculateDays(inv.date) > 90).length
  };

  const handlePrintRecord = (item: any, type: 'PAYMENT' | 'PENDING') => {
    if (type === 'PENDING') {
      // Redirect to the professional invoice preview with auto-print
      window.open(`/invoices/${item.id}?print=true`, '_blank');
      return;
    }

    // For Receipts, generate a beautiful matching layout
    const p = window.open('', '', 'height=800,width=1000'); if (!p) return;
    const accentColor = invSettings?.accentColor || '#ea580c';
    
    p.document.write(`
      <html>
        <head>
          <title>Payment Receipt - ${item.voucherNo}</title>
          <style>
            @page { size: A4; margin: 10mm; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; }
            .header { border-bottom: 2px solid ${accentColor}; padding-bottom: 15px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
            .company-name { font-size: 24px; font-weight: 900; color: #000; }
            .receipt-label { background: ${accentColor}; color: white; padding: 5px 15px; border-radius: 4px; font-weight: bold; text-transform: uppercase; font-size: 14px; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .meta-item { font-size: 13px; }
            .meta-label { color: #666; font-weight: bold; text-transform: uppercase; font-size: 10px; display: block; margin-bottom: 2px; }
            .meta-value { font-weight: 800; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f8f9fa; border: 1px solid #dee2e6; padding: 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: #666; }
            td { border: 1px solid #dee2e6; padding: 15px; text-align: left; font-size: 14px; }
            .amount-box { margin-top: 40px; border: 2px solid ${accentColor}; padding: 20px; border-radius: 8px; display: inline-block; min-width: 250px; }
            .footer { margin-top: 60px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 15px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">${activeCompany?.name || 'GLOBUS ENGINEERING'}</div>
            <div class="receipt-label">Payment Receipt</div>
          </div>
          
          <div class="meta-grid">
            <div class="meta-item">
              <span class="meta-label">Customer Name</span>
              <span class="meta-value">${item.partyName}</span>
            </div>
            <div class="meta-item" style="text-align: right;">
              <span class="meta-label">Receipt Voucher No</span>
              <span class="meta-value">${item.voucherNo}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Transaction Date</span>
              <span class="meta-value">${item.date}</span>
            </div>
            <div class="meta-item" style="text-align: right;">
              <span class="meta-label">Payment Mode</span>
              <span class="meta-value">${item.paymentMode.toUpperCase()}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: right;">Amount Recieved</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="font-weight: 600;">Payment received against services/goods provided and documented in audit logs.</td>
                <td style="text-align: right; font-weight: 900; font-size: 18px;">₹${item.amount.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <div class="amount-box">
            <div class="meta-label">Total Amount Recieved</div>
            <div style="font-size: 24px; font-weight: 900; color: ${accentColor};">₹${item.amount.toLocaleString()}</div>
          </div>

          <div class="footer">
            This is a computer-generated payment receipt and does not require a physical signature.<br/>
            ${activeCompany?.name || 'Globus Engineering Main'}
          </div>
        </body>
      </html>
    `);
    p.document.close();
    setTimeout(() => { p.print(); }, 500);
  };

  const handleExportPDFRecord = (item: any, type: 'PAYMENT' | 'PENDING') => {
    const doc = new jsPDF();
    const amount = type === 'PAYMENT' ? item.amount : (item.grandTotal - (item.paidAmount || 0));
    doc.setFontSize(18); doc.text(`GLOBUS ENGINEERING - ${type} AUDIT`, 14, 20);
    autoTable(doc, {
      startY: 30,
      head: [['Category', 'Details']],
      body: [
        ['Customer', type === 'PAYMENT' ? item.partyName : item.customerName],
        ['Reference No', type === 'PAYMENT' ? item.voucherNo : item.invoiceNumber],
        ['Date', item.date],
        ['Statement Amount', `INR ${amount.toLocaleString()}`],
        ['Category', type]
      ],
      theme: 'grid'
    });
    doc.save(`audit_payment_${item.id}.pdf`);
  };

  return (
    <div className="container-fluid py-4 bg-light min-vh-100 animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4 px-2 flex-wrap gap-2">
        <div><Breadcrumb items={[{ label: 'Reports', active: false }, { label: 'Payment Report', active: true }]} /><h2 className="fw-900 mt-2">Payment Report</h2><p className="text-muted small mb-0">Track collection history and monitor outstanding dues.</p></div>
        <div className="d-flex flex-wrap align-items-center gap-2">
          <ReportActions setFromDate={setFromDate} setToDate={setToDate} title="Collection & Ageing Analysis" />
          <button className="btn btn-white shadow-sm border border-light px-3 d-flex align-items-center gap-2" style={{ height: '36px', borderRadius: '18px' }} onClick={() => { (dispatch as any)(fetchVouchers(activeCompany?.id)); (dispatch as any)(fetchPendingPayments(activeCompany?.id)); }}><i className="bi bi-arrow-repeat fw-bold" style={{ color: 'var(--accent-color)' }}></i>
            <span className="small fw-800 text-muted">Refresh</span>
          </button>
        </div>
      </div>

      {/* Audit Summary Cards */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Payments Recvd', val: totals.paymentCount, icon: 'shield-check', color: 'primary' },
          { label: 'Total Collected', val: `₹${totals.totalCollected.toLocaleString()}`, icon: 'bank', color: 'success' },
          { label: 'Total Outstanding', val: `₹${totals.totalOutstanding.toLocaleString()}`, icon: 'exclamation-diamond', color: 'danger' },
          { label: 'Critical (>90D)', val: totals.criticalOverdue, icon: 'alarm', color: 'warning' }
        ].map((item, i) => (
          <div key={i} className="col-md-3">
            <div className="card shadow-sm border-0 rounded-4 bg-white p-3 h-100 animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="d-flex align-items-center gap-3">
                <div className={`rounded-circle bg-${item.color} bg-opacity-10 p-2 d-flex align-items-center justify-content-center`} style={{ width: '42px', height: '42px' }}>
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

      <div className="d-flex gap-2 mb-3">
        <button className={`btn px-4 py-2 fw-bold small rounded-pill ${activeTab === 'PAYMENT' ? 'btn-primary shadow-sm' : 'bg-white text-muted border'}`} onClick={() => setActiveTab('PAYMENT')}>Payment History</button>
        <button className={`btn px-4 py-2 fw-bold small rounded-pill ${activeTab === 'PENDING' ? 'btn-primary shadow-sm' : 'bg-white text-muted border'}`} onClick={() => setActiveTab('PENDING')}>Pending Payments (Ageing)</button>
      </div>

      <div className="card shadow-sm border-0 mb-4 rounded-4 overflow-hidden">
        <div className="card-body p-3">
          <div className="filter-bar-row">
            <div className="filter-item-search" style={{ maxWidth: '260px' }}>
              <div className="search-group" style={{width:"260px"}}>
                <span className="input-group-text">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control search-bar"
                  placeholder="Search customer name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="filter-item-select" style={{ minWidth: '220px' }}>
              <select 
                className="form-select search-bar"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                style={{width:"340px"}}
              >
                <option value="">-- All Customers --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.company || c.name}</option>
                ))}
              </select>
            </div>
            
            <div className="date-filter-group ms-auto">
              <input type="date" className="text-muted" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              <span className="text-muted small fw-bold mx-1">TO</span>
              <input type="date" className="text-muted" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
        <div className="card-body p-0">
          {(vLoading || pLoading) ? (
            <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '400px' }}>
              <Loader text="Compiling Records..." />
            </div>
          ) : (
            <div className="table-responsive" style={{ minHeight: '400px', paddingBottom: '80px' }}>
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light">
                  <tr className="text-capitalize small fw-bold text-muted">
                    <th className="px-4 py-3 border-0">Sno</th>
                    <th className="py-3 border-0">Date</th>
                    <th className="py-3 border-0 text-center">{activeTab === 'PAYMENT' ? 'Ref No' : 'Invoice No'}</th>
                    <th className="py-3 border-0">Customer Name</th>
                    <th className="py-3 border-0 text-center">{activeTab === 'PAYMENT' ? 'Mode' : 'Ageing'}</th>
                    <th className="py-3 border-0 text-end px-4">{activeTab === 'PAYMENT' ? 'Paid Amount' : 'Pending Amount'}</th>
                    <th className="py-3 border-0 text-center" style={{ width: '120px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeTab === 'PAYMENT' ? paymentData : filteredPending).map((item: any, idx) => (
                    <tr key={item.id} className="border-bottom border-light">
                      <td className="px-4 small text-muted font-monospace">{idx + 1}</td>
                      <td className="small text-muted">{item.date}</td>
                      <td className="text-center small fw-bold text-dark font-monospace">{activeTab === 'PAYMENT' ? item.voucherNo : item.invoiceNumber}</td>
                      <td className="fw-800 text-dark small text-capitalize">{activeTab === 'PAYMENT' ? item.partyName : item.customerName}</td>
                      <td className="text-center">{activeTab === 'PAYMENT' ? <span className="badge bg-light text-dark shadow-sm border-0 px-3">{item.paymentMode}</span> : <span className={`badge rounded-pill fw-bold px-3 ${calculateDays(item.date) > 60 ? 'bg-danger' : calculateDays(item.date) > 30 ? 'bg-warning text-dark' : 'bg-success'}`}>{calculateDays(item.date)} Days</span>}</td>
                      <td className={`text-end fw-900 px-4 font-monospace ${activeTab === 'PAYMENT' ? 'text-success' : 'text-danger'}`}>₹{(activeTab === 'PAYMENT' ? item.amount : (item.grandTotal - (item.paidAmount || 0))).toLocaleString()}</td>
                      <td className="text-center">
                        <div className="d-flex justify-content-center gap-1">
                          <Link href={activeTab === 'PAYMENT' ? `/vouchers/${item.id}/edit?readonly=true` : `/invoices/${item.id}?readonly=true`} className="btn-action-view">
                            <i className="bi bi-eye-fill"></i>
                          </Link>
                          <div className="dropdown">
                            <button className="btn btn-sm btn-outline-secondary border-0 p-0" data-bs-toggle="dropdown" style={{ width: '32px', height: '32px' }}>
                              <i className="bi bi-three-dots-vertical fs-5"></i>
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 py-2">
                              <li><button className="dropdown-item d-flex align-items-center gap-2 py-2 small" onClick={() => handlePrintRecord(item, activeTab)}><i className="bi bi-printer text-primary"></i> Quick Print</button></li>
                              <li><button className="dropdown-item d-flex align-items-center gap-2 py-2 small" onClick={() => handleExportPDFRecord(item, activeTab)}><i className="bi bi-file-earmark-pdf text-danger"></i> Export PDF</button></li>
                            </ul>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-light-soft fw-900 border-top border-dark">
                    <td colSpan={5} className="text-center py-3 uppercase" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>Audit Summary (Current View Balance)</td>
                    <td className={`text-end py-3 px-4 ${activeTab === 'PAYMENT' ? 'text-success' : 'text-danger'}`}>₹{(activeTab === 'PAYMENT' ? totals.totalCollected : totals.totalOutstanding).toLocaleString()}</td>
                    <td></td>
                  </tr>
                  {(activeTab === 'PAYMENT' ? paymentData : filteredPending).length === 0 && (
                    <tr><td colSpan={7} className="text-center py-5 text-muted small">No payment records found.</td></tr>
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

export default PaymentReportPage;
