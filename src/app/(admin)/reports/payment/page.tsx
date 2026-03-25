'use client';

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { fetchVouchers } from '@/redux/features/voucherSlice';
import { fetchPendingPayments } from '@/redux/features/pendingPaymentSlice';

const PaymentReportPage = () => {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'PAYMENT' | 'PENDING'>('PAYMENT');
  const [ageingFilter, setAgeingFilter] = useState<'all' | '0-30' | '31-60' | '61-90' | '90+'>('all');
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

  // Receipts only for Payment tab
  const paymentData = vouchers.filter(v => 
    v.type === 'receipt' && 
    (!activeCompany || String(v.company_id || (v as any).companyId || '').toLowerCase() === String(activeCompany.id).toLowerCase())
  );

  const calculateDays = (dateStr: string) => {
    const invDate = new Date(dateStr);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - invDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const filteredPending = pending.filter(inv => {
    const days = calculateDays(inv.date);
    if (ageingFilter === '0-30') return days <= 30;
    if (ageingFilter === '31-60') return days > 30 && days <= 60;
    if (ageingFilter === '61-90') return days > 60 && days <= 90;
    if (ageingFilter === '90+') return days > 90;
    return true;
  });

  return (
    <div className="card shadow-sm border-0 bg-white overflow-hidden rounded-0 mb-5 animate-fade-in">
      <div className="card-header bg-white border-bottom-0 pb-2 px-4 d-flex align-items-center gap-2 mt-2">
         <i className="bi bi-house-door-fill text-dark small"></i>
         <span className="text-muted small">Home / Dashboard / Payment Report</span>
      </div>

      <div className="px-4 py-3 d-flex justify-content-between align-items-center">
        <h4 className="fw-normal text-dark mb-0 fs-3">Payment Report</h4>
        <button className="btn btn-link text-muted p-0 shadow-none" onClick={() => {
          (dispatch as any)(fetchVouchers(activeCompany?.id));
          (dispatch as any)(fetchPendingPayments(activeCompany?.id));
        }}><i className="bi bi-arrow-repeat fs-5"></i></button>
      </div>

      {/* Tabs */}
      <div className="d-flex text-uppercase px-4 bg-white border-bottom mt-1 pt-2">
         <button 
           className={`btn shadow-none border-0 rounded-0 pb-3 px-4 fw-bold small ${activeTab === 'PAYMENT' ? 'border-bottom border-danger text-danger' : 'text-muted'}`}
           onClick={() => setActiveTab('PAYMENT')}
         >
           PAYMENT HISTORY
         </button>
         <button 
           className={`btn shadow-none border-0 rounded-0 pb-3 px-4 fw-bold small ${activeTab === 'PENDING' ? 'border-bottom border-danger text-danger' : 'text-muted'}`}
           onClick={() => setActiveTab('PENDING')}
         >
           PENDING PAYMENTS (AGEING)
         </button>
      </div>

      {activeTab === 'PENDING' && (
        <div className="px-4 py-3 bg-light border-bottom d-flex gap-2">
           <span className="small fw-bold text-muted align-self-center me-2">AGEING:</span>
           {['all', '0-30', '31-60', '61-90', '90+'].map((range) => (
             <button 
               key={range}
               className={`btn btn-sm px-3 rounded-pill border ${ageingFilter === range ? 'btn-danger text-white' : 'btn-outline-secondary bg-white text-muted'}`}
               onClick={() => setAgeingFilter(range as any)}
             >
               {range.toUpperCase()} DAYS
             </button>
           ))}
        </div>
      )}

      <div className="table-responsive px-4 pb-4 mt-4">
        {(vLoading || pLoading) ? (
          <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
        ) : activeTab === 'PAYMENT' ? (
          <table className="table align-middle mb-0 table-hover bg-white w-100">
            <thead className="text-dark border-bottom border-top border-light">
              <tr>
                <th className="fw-semibold py-3 border-0 bg-white small">Sno</th>
                <th className="fw-semibold border-0 bg-white small">Date</th>
                <th className="fw-semibold border-0 bg-white small">Voucher No</th>
                <th className="fw-semibold border-0 bg-white small">Customer Name</th>
                <th className="fw-semibold border-0 bg-white small">Mode</th>
                <th className="fw-semibold border-0 bg-white small">Cheque/Ref</th>
                <th className="fw-semibold border-0 bg-white text-end small">Amount</th>
              </tr>
            </thead>
            <tbody>
              {paymentData.map((v, index) => (
                <tr key={v.id} className="border-bottom border-light">
                  <td className="small">{index + 1}</td>
                  <td className="small">{v.date}</td>
                  <td className="small fw-bold">{v.voucherNo}</td>
                  <td className="small text-uppercase">{v.partyName}</td>
                  <td className="small">
                    <span className="badge rounded-pill bg-light text-dark border">{v.paymentMode}</span>
                  </td>
                  <td className="small text-muted">{v.chequeNo || v.referenceNo || '-'}</td>
                  <td className="small fw-bold text-end text-success">₹{v.amount.toFixed(2)}</td>
                </tr>
              ))}
              {paymentData.length === 0 && (
                <tr><td colSpan={7} className="text-center py-5 text-muted">No payment records found</td></tr>
              )}
            </tbody>
          </table>
        ) : (
          <table className="table align-middle mb-0 table-hover bg-white w-100">
            <thead className="text-dark border-bottom border-top border-light">
              <tr>
                <th className="fw-semibold py-3 border-0 bg-white small">Sno</th>
                <th className="fw-semibold border-0 bg-white small">Inv Date</th>
                <th className="fw-semibold border-0 bg-white small">Invoice No</th>
                <th className="fw-semibold border-0 bg-white small text-center">Ageing (Days)</th>
                <th className="fw-semibold border-0 bg-white small">Customer Name</th>
                <th className="fw-semibold border-0 bg-white text-end small">Pending Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredPending.map((inv, index) => {
                const days = calculateDays(inv.date);
                return (
                  <tr key={inv.id} className="border-bottom border-light">
                    <td className="small">{index + 1}</td>
                    <td className="small">{inv.date}</td>
                    <td className="small fw-bold">{inv.invoiceNumber}</td>
                    <td className="small text-center">
                       <span className={`badge rounded-pill ${days > 60 ? 'bg-danger-subtle text-danger' : days > 30 ? 'bg-warning-subtle text-warning' : 'bg-success-subtle text-success'}`}>
                         {days} Days
                       </span>
                    </td>
                    <td className="small text-uppercase">{inv.customerName}</td>
                    <td className="small fw-bold text-end text-danger">₹{(inv.grandTotal - (inv.paidAmount || 0)).toFixed(2)}</td>
                  </tr>
                );
              })}
              {filteredPending.length === 0 && (
                <tr><td colSpan={6} className="text-center py-5 text-muted">No pending payments found in this range</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <style jsx>{`
        .table th { border-bottom: 2px solid #eee !important; font-size: 0.8rem; }
        .table td { border-bottom: 1px solid #f9f9f9; }
        .text-danger { color: #ff4081 !important; }
        .border-danger { border-color: #ff4081 !important; }
        .bg-danger-subtle { background-color: #ffeeee; }
        .bg-warning-subtle { background-color: #fff8e1; }
        .bg-success-subtle { background-color: #e8f5e9; }
      `}</style>
    </div>
  );
};

export default PaymentReportPage;
