'use client';

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { setVoucherFilters, fetchVouchers } from '@/redux/features/voucherSlice';

const VoucherReportPage = () => {
  const [mounted, setMounted] = useState(false);
  const dispatch = useDispatch();
  const { user, company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items, filters, loading } = useSelector((state: RootState) => state.voucher);

  useEffect(() => {
    setMounted(true);
    if (activeCompany?.id) {
      (dispatch as any)(fetchVouchers(activeCompany.id));
    }
  }, [dispatch, activeCompany?.id]);

  if (!mounted) return null;

  // Filter Logic
  const filteredItems = items.filter(voucher => {
    if (activeCompany && String(voucher.company_id || (voucher as any).companyId || '').toLowerCase() !== String(activeCompany.id).toLowerCase()) return false;
    const matchesCustomer = (voucher.partyName || '').toLowerCase().includes((filters.search || '').toLowerCase());
    return matchesCustomer;
  });

  return (
    <div className="card shadow-sm border-0 bg-white overflow-hidden rounded-0 mb-5 animate-fade-in">
      <div className="card-header bg-white border-bottom-0 pb-2 px-4 d-flex align-items-center gap-2 mt-2">
         <i className="bi bi-house-door-fill text-dark small"></i>
         <span className="text-muted small">Dashboard / Voucher List</span>
      </div>

      <div className="px-4 py-3 d-flex justify-content-between align-items-center">
        <h4 className="fw-normal text-dark mb-0 fs-3">Voucher List</h4>
        <div className="d-flex gap-2">
          <button className="btn btn-link text-muted p-0 shadow-none" onClick={() => (dispatch as any)(fetchVouchers(activeCompany?.id))}><i className="bi bi-arrow-repeat fs-5"></i></button>
        </div>
      </div>

      <div className="d-flex text-uppercase px-4 bg-white border-bottom mt-1 pt-2">
         <button 
           className="btn shadow-none border-0 rounded-0 pb-3 px-4 fw-bold small border-bottom border-danger text-danger"
           style={{ borderBottomWidth: '2px !important' }}
         >
           VOUCHER
         </button>
      </div>

      <div className="table-responsive px-4 pb-4 mt-4">
        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
        ) : (
          <table className="table align-middle mb-0 bg-white w-100 table-hover">
            <thead className="text-dark border-bottom border-top border-light">
              <tr>
                <th className="fw-semibold py-3 border-0 bg-white" style={{ fontSize: '13px' }}>Sno</th>
                <th className="fw-semibold border-0 bg-white" style={{ fontSize: '13px' }}>Customer</th>
                <th className="fw-semibold border-0 bg-white text-nowrap" style={{ fontSize: '13px' }}>Voucher No</th>
                <th className="fw-semibold border-0 bg-white text-nowrap" style={{ fontSize: '13px' }}>Date</th>
                <th className="fw-semibold border-0 bg-white text-nowrap" style={{ fontSize: '13px' }}>Type</th>
                <th className="fw-semibold border-0 bg-white text-nowrap" style={{ fontSize: '13px' }}>Cheque / Ref No</th>
                <th className="fw-semibold border-0 bg-white text-nowrap" style={{ fontSize: '13px' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((voucher, index) => (
                <tr key={voucher.id} className="border-bottom border-light">
                  <td className="text-dark" style={{ fontSize: '13px', paddingTop: '16px', paddingBottom: '16px' }}>{index + 1}</td>
                  <td style={{ paddingTop: '16px', paddingBottom: '16px' }}>
                     <div className="text-dark text-uppercase fw-bold" style={{ fontSize: '12px' }}>{voucher.partyName}</div>
                  </td>
                  <td className="text-dark" style={{ fontSize: '13px' }}>{voucher.voucherNo}</td>
                  <td className="text-dark text-nowrap" style={{ fontSize: '13px' }}>{voucher.date}</td>
                  <td className="text-dark text-uppercase" style={{ fontSize: '11px' }}>
                    <span className={`badge rounded-0 ${voucher.type === 'receipt' ? 'bg-success' : 'bg-primary'}`}>
                      {voucher.type}
                    </span>
                  </td>
                  <td className="text-dark text-nowrap fw-bold" style={{ fontSize: '13px' }}>
                    {voucher.chequeNo || voucher.referenceNo || '-'}
                  </td>
                  <td className="text-dark fw-bold" style={{ fontSize: '13px' }}>
                    ₹{voucher.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-5 text-muted bg-white">
                     <h6 className="fw-normal">No Voucher Data Available</h6>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <style jsx>{`
        .table th { border-bottom: 2px solid #eee !important; font-size: 0.8rem; }
        .table td { border-bottom: 1px solid #f9f9f9; }
      `}</style>
    </div>
  );
};

export default VoucherReportPage;
