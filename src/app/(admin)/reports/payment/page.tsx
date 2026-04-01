'use client';

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { fetchVouchers } from '@/redux/features/voucherSlice';
import { fetchPendingPayments } from '@/redux/features/pendingPaymentSlice';
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
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const dispatch = useDispatch();
  const { company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items: vouchers, loading: vLoading } = useSelector((state: RootState) => state.voucher);
  const { items: pending, loading: pLoading } = useSelector((state: RootState) => state.pendingPayments);

  useEffect(() => {
    setMounted(true);
    if (activeCompany?.id) { 
      (dispatch as any)(fetchVouchers(activeCompany.id)); 
      (dispatch as any)(fetchPendingPayments(activeCompany.id)); 
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

  const paymentData = vouchers.filter(v => v.type === 'receipt' && (v.partyName?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) && matchesDate(v.date));
  const filteredPending = pending.filter(inv => {
    const days = calculateDays(inv.date);
    const matchSearch = (inv.customerName?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) || (inv.invoiceNumber?.toLowerCase() ?? '').includes(searchTerm.toLowerCase());
    if (!matchSearch) return false;
    if (!matchesDate(inv.date)) return false;
    if (ageingFilter === '0-30') return days <= 30;
    if (ageingFilter === '31-60') return days > 30 && days <= 60;
    if (ageingFilter === '61-90') return days > 60 && days <= 90;
    if (ageingFilter === '90+') return days > 90;
    return true;
  });

  const handlePrintRecord = (item: any, type: 'PAYMENT' | 'PENDING') => {
    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return;
    printWindow.document.write('<html><head><title>Payment Detail</title><style>body { font-family: sans-serif; padding: 40px; color: #333; } .header { border-bottom: 2px solid #2563eb; padding-bottom: 20px; }</style></head><body>');
    printWindow.document.write('<h1>Globus Engineering</h1><p>Payment/Ageing Statement</p>');
    printWindow.document.write(`<p><b>Customer:</b> ${type === 'PAYMENT' ? item.partyName : item.customerName}</p>`);
    printWindow.document.write(`<p><b>Amount:</b> ₹${type === 'PAYMENT' ? item.amount.toLocaleString() : (item.grandTotal - (item.paidAmount || 0)).toLocaleString()}</p>`);
    printWindow.document.write(`<p><b>Date:</b> ${item.date}</p>`);
    printWindow.document.close(); printWindow.print();
  };

  const handleExportPDFRecord = (item: any, type: 'PAYMENT' | 'PENDING') => {
    const doc = new jsPDF(); doc.text("GLOBUS ENGINEERING", 14, 20);
    autoTable(doc, { startY: 30, body: [['Customer', type === 'PAYMENT' ? item.partyName : item.customerName], ['Amount', type === 'PAYMENT' ? `INR ${item.amount.toLocaleString()}` : `INR ${(item.grandTotal - (item.paidAmount || 0)).toLocaleString()}`], ['Date', item.date], ['Type', type]] });
    doc.save(`payment_${item.id}.pdf`);
  };

  return (
    <div className="container-fluid py-4 bg-light min-vh-100 animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4 px-2">
        <div><Breadcrumb items={[{ label: 'Reports', active: false }, { label: 'Payment Report', active: true }]} /><h2 className="fw-900 mt-2">Payment Report</h2><p className="text-muted small">Track collection history and monitor outstanding dues.</p></div>
        <button className="btn btn-white shadow-sm border border-light px-3 d-flex align-items-center gap-2" onClick={() => { (dispatch as any)(fetchVouchers(activeCompany?.id)); (dispatch as any)(fetchPendingPayments(activeCompany?.id)); }}><i className="bi bi-arrow-repeat text-primary fw-bold"></i>
          <span className="small fw-800 text-muted">Refresh</span>
</button>
      </div>

      <div className="d-flex gap-2 mb-4">
        <button className={`btn px-4 py-2 fw-bold small rounded-pill ${activeTab === 'PAYMENT' ? 'btn-primary shadow-sm' : 'bg-white text-muted border'}`} onClick={() => setActiveTab('PAYMENT')}>PAYMENT HISTORY</button>
        <button className={`btn px-4 py-2 fw-bold small rounded-pill ${activeTab === 'PENDING' ? 'btn-primary shadow-sm' : 'bg-white text-muted border'}`} onClick={() => setActiveTab('PENDING')}>PENDING PAYMENTS (AGEING)</button>
      </div>

      <div className="card shadow-sm border-0 mb-4 rounded-4 overflow-hidden">
        <div className="card-body p-3">
          <div className="row g-3 align-items-center">
            <div className={`col-md-${activeTab === 'PENDING' ? '3' : '4'}`}>
              <div className="position-relative">
                <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                <input 
                  type="text" 
                  className="form-control border-0 bg-light-soft ps-5" 
                  placeholder="Search customer name..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  style={{ height: '42px', borderRadius: '10px' }} 
                />
              </div>
            </div>
            {/* Rest of filters... */}
            <div className="col-auto ms-auto d-flex align-items-center gap-1">
              <div className="d-flex align-items-center  bg-light-soft px-3" style={{ height: '42px', borderRadius: '10px' }}>
                <input type="date" className="form-control border-0 bg-transparent p-0" style={{ width: '130px', fontSize: '0.9rem' }} value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                </div>
                <span className="text-muted small fw-bold mx-1">TO</span>
              <div className="d-flex align-items-center  bg-light-soft px-3" style={{ height: '42px', borderRadius: '10px' }}>
                <input type="date" className="form-control border-0 bg-transparent p-0" style={{ width: '130px', fontSize: '0.9rem' }} value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </div>
              {activeTab === 'PENDING' && <select className="form-select border-0 bg-light-soft px-3" value={ageingFilter} onChange={(e) => setAgeingFilter(e.target.value as any)} style={{ height: '42px', borderRadius: '10px', width: '150px' }}><option value="all">Every Bucket</option><option value="0-30">0-30 Days</option><option value="31-60">31-60 Days</option><option value="61-90">61-90 Days</option><option value="90+">90+ Days</option></select>}
              <ReportActions />
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
                  <tr className="text-uppercase small fw-bold text-muted">
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
                      <td className="fw-800 text-dark small text-uppercase">{activeTab === 'PAYMENT' ? item.partyName : item.customerName}</td>
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
