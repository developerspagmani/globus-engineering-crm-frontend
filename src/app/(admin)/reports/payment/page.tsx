'use client';

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { fetchVouchers } from '@/redux/features/voucherSlice';
import { fetchPendingPayments } from '@/redux/features/pendingPaymentSlice';
import Loader from '@/components/Loader';

import ReportActions from '@/components/ReportActions';

const PaymentReportPage = () => {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'PAYMENT' | 'PENDING'>('PAYMENT');
  const [ageingFilter, setAgeingFilter] = useState<'all' | '0-30' | '31-60' | '61-90' | '90+'>('all');
  const [searchTerm, setSearchTerm] = useState("");
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
    const invDate = new Date(dateStr);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - invDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const paymentData = vouchers.filter(v =>
    v.type === 'receipt' &&
    (v.partyName?.toLowerCase() ?? '').includes(searchTerm.toLowerCase())
  );

  const filteredPending = pending.filter(inv => {
    const days = calculateDays(inv.date);
    const matchSearch = (inv.customerName?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) || 
                       (inv.invoiceNumber?.toLowerCase() ?? '').includes(searchTerm.toLowerCase());
    
    if (!matchSearch) return false;
    if (ageingFilter === '0-30') return days <= 30;
    if (ageingFilter === '31-60') return days > 30 && days <= 60;
    if (ageingFilter === '61-90') return days > 60 && days <= 90;
    if (ageingFilter === '90+') return days > 90;
    return true;
  });

  return (
    <div className="container-fluid py-4 animate-fade-in">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1 text-dark">Payment Report</h2>
          <p className="text-muted small mb-0">Track payment history and monitor outstanding dues with ageing analysis.</p>
        </div>
        <button 
          className="btn btn-white shadow-sm border px-3 d-flex align-items-center gap-2"
          onClick={() => {
            (dispatch as any)(fetchVouchers(activeCompany?.id));
            (dispatch as any)(fetchPendingPayments(activeCompany?.id));
          }}
        >
          <i className="bi bi-arrow-repeat text-primary"></i>
          <span className="small fw-bold text-muted">Refresh</span>
        </button>
      </div>

      {/* Tabs Selection */}
      <div className="nav nav-pills mb-4 gap-2">
        <button 
          className={`nav-link px-4 py-2 fw-bold small rounded-pill border-0 ${activeTab === 'PAYMENT' ? 'bg-primary text-white shadow-sm' : 'bg-white text-muted border shadow-xs'}`}
          onClick={() => setActiveTab('PAYMENT')}
        >
          Payment History
        </button>
        <button 
          className={`nav-link px-4 py-2 fw-bold small rounded-pill border-0 ${activeTab === 'PENDING' ? 'bg-primary text-white shadow-sm' : 'bg-white text-muted border shadow-xs'}`}
          onClick={() => setActiveTab('PENDING')}
        >
          Pending Payments (Ageing)
        </button>
      </div>

      {/* Filter Section */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className={`col-md-${activeTab === 'PENDING' ? '6' : '9'}`}>
              <div className="position-relative">
                <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                <input
                  type="text"
                  className="form-control ps-5"
                  placeholder="Search by customer name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            {activeTab === 'PENDING' && (
              <div className="col-md-3">
                 <div className="input-group">
                   <span className="input-group-text bg-white small fw-bold text-muted">Ageing</span>
                   <select className="form-select form-select-sm" value={ageingFilter} onChange={(e) => setAgeingFilter(e.target.value as any)}>
                     <option value="all">All Days</option>
                     <option value="0-30">0-30 Days</option>
                     <option value="31-60">31-60 Days</option>
                     <option value="61-90">61-90 Days</option>
                     <option value="90+">90+ Days</option>
                   </select>
                 </div>
              </div>
            )}
            <div className="col-md-3">
               <div className="input-group">
                 <span className="input-group-text bg-white small fw-bold text-muted">Period</span>
                 <select className="form-select form-select-sm">
                   <option>This Quarter</option>
                   <option>Financial Year</option>
                 </select>
               </div>
            </div>
          </div>
          <div className="d-flex justify-content-end mt-3 border-top pt-3">
            <ReportActions />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            {vLoading || pLoading ? (
               <div className="py-2">
                 <Loader text="Fetching Payment Records..." />
               </div>
            ) : activeTab === 'PAYMENT' ? (
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="px-4 py-3 border-0 small fw-bold text-muted">Sno</th>
                    <th className="py-3 border-0 small fw-bold text-muted">Date</th>
                    <th className="py-3 border-0 small fw-bold text-muted text-center">Reference No</th>
                    <th className="py-3 border-0 small fw-bold text-muted">Customer Name</th>
                    <th className="py-3 border-0 small fw-bold text-muted text-center">Mode</th>
                    <th className="py-3 border-0 small fw-bold text-muted text-end px-4">Paid Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentData.map((v, index) => (
                    <tr key={v.id}>
                      <td className="px-4 small text-muted font-monospace">{index + 1}</td>
                      <td className="small text-muted">{v.date}</td>
                      <td className="text-center small fw-bold text-dark font-monospace">{v.voucherNo}</td>
                      <td className="fw-bold text-dark small text-uppercase">{v.partyName}</td>
                      <td className="text-center">
                        <span className="badge bg-light text-dark border-0 fw-600 px-3 py-1 rounded-pill small">
                          {v.paymentMode}
                        </span>
                      </td>
                      <td className="text-end fw-bold text-success px-4">
                        ₹{v.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                  {paymentData.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-5 text-muted small">No payment history found.</td></tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="px-4 py-3 border-0 small fw-bold text-muted">Sno</th>
                    <th className="py-3 border-0 small fw-bold text-muted">Invoice Date</th>
                    <th className="py-3 border-0 small fw-bold text-muted">Invoice No</th>
                    <th className="py-3 border-0 small fw-bold text-muted text-center">Ageing</th>
                    <th className="py-3 border-0 small fw-bold text-muted">Customer Name</th>
                    <th className="py-3 border-0 small fw-bold text-muted text-end px-4">Pending Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPending.map((inv, index) => {
                    const days = calculateDays(inv.date);
                    return (
                      <tr key={inv.id}>
                        <td className="px-4 small text-muted font-monospace">{index + 1}</td>
                        <td className="small text-muted">{inv.date}</td>
                        <td className="small fw-bold text-dark">{inv.invoiceNumber}</td>
                        <td className="text-center">
                          <span className={`badge rounded-pill fw-normal px-3 ${days > 60 ? 'bg-danger-subtle text-danger' : days > 30 ? 'bg-warning-subtle text-warning' : 'bg-success-subtle text-success'}`}>
                            {days} Days
                          </span>
                        </td>
                        <td className="text-uppercase small fw-bold text-dark">{inv.customerName}</td>
                        <td className="text-end fw-bold text-danger px-4">
                          ₹{(inv.grandTotal - (inv.paidAmount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                {filteredPending.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-5 text-muted small">No pending payments matching the selected ageing range.</td></tr>
                )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .bg-danger-subtle { background-color: #fceaea !important; }
        .bg-warning-subtle { background-color: #fdf6e2 !important; }
        .bg-success-subtle { background-color: #eaf7ed !important; }
        .shadow-xs { box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
      `}</style>
    </div>
  );
};

export default PaymentReportPage;
