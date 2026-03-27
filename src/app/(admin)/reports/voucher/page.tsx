'use client';

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { fetchVouchers } from '@/redux/features/voucherSlice';

const VoucherReportPage = () => {
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dispatch = useDispatch();
  const { company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items, loading } = useSelector((state: RootState) => state.voucher);

  useEffect(() => {
    setMounted(true);
    if (activeCompany?.id) {
      (dispatch as any)(fetchVouchers(activeCompany.id));
    }
  }, [dispatch, activeCompany?.id]);

  if (!mounted) return null;

  const filteredItems = items.filter(voucher => {
    const search = searchTerm.toLowerCase();
    return (
      (voucher.partyName?.toLowerCase() ?? '').includes(search) ||
      (voucher.voucherNo?.toLowerCase() ?? '').includes(search) ||
      (voucher.chequeNo?.toLowerCase() ?? '').includes(search) ||
      (voucher.referenceNo?.toLowerCase() ?? '').includes(search)
    );
  });

  return (
    <div className="container-fluid py-4 animate-fade-in">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1 text-dark">Voucher Report</h2>
          <p className="text-muted small mb-0">Record of all financial receipts and payments.</p>
        </div>
        <button 
          className="btn btn-white shadow-sm border px-3 d-flex align-items-center gap-2"
          onClick={() => (dispatch as any)(fetchVouchers(activeCompany?.id))}
        >
          <i className="bi bi-arrow-repeat text-primary"></i>
          <span className="small fw-bold text-muted">Refresh</span>
        </button>
      </div>

      {/* Filter Section */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-9">
              <div className="position-relative">
                <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                <input
                  type="text"
                  className="form-control ps-5"
                  placeholder="Search by customer name, voucher no or reference..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
               <div className="input-group">
                 <span className="input-group-text bg-white small fw-bold text-muted">Type</span>
                 <select className="form-select form-select-sm">
                   <option>All Types</option>
                   <option>Receipt</option>
                   <option>Payment</option>
                 </select>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="px-4 py-3 border-0 small fw-bold text-muted">Sno</th>
                  <th className="py-3 border-0 small fw-bold text-muted">Customer</th>
                  <th className="py-3 border-0 small fw-bold text-muted text-center">Voucher No</th>
                  <th className="py-3 border-0 small fw-bold text-muted text-center">Date</th>
                  <th className="py-3 border-0 small fw-bold text-muted text-center">Mode</th>
                  <th className="py-3 border-0 small fw-bold text-muted text-end px-4">Amount</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5">
                      <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                      <span className="text-muted small">Loading vouchers...</span>
                    </td>
                  </tr>
                ) : filteredItems.map((voucher, index) => (
                  <tr key={voucher.id}>
                    <td className="px-4 small text-muted font-monospace">{index + 1}</td>
                    <td>
                      <div className="fw-bold text-dark small text-uppercase mb-0">{voucher.partyName}</div>
                      <div className="text-muted x-small">
                        {voucher.type === 'receipt' ? 
                          <span className="text-success"><i className="bi bi-arrow-down-left me-1"></i>Receipt</span> : 
                          <span className="text-danger"><i className="bi bi-arrow-up-right me-1"></i>Payment</span>
                        }
                      </div>
                    </td>
                    <td className="text-center small fw-bold text-dark font-monospace">{voucher.voucherNo}</td>
                    <td className="text-center small text-muted">{voucher.date}</td>
                    <td className="text-center">
                      <div className="d-flex flex-column align-items-center">
                        <span className="badge bg-light text-dark border-0 fw-600 px-3 py-1 rounded-pill small mb-1">
                          {voucher.paymentMode}
                        </span>
                        <span className="x-small text-muted">{voucher.chequeNo || voucher.referenceNo || '-'}</span>
                      </div>
                    </td>
                    <td className="text-end fw-bold text-dark px-4 fs-6">
                      ₹{voucher.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                {!loading && filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-5">
                      <i className="bi bi-journal-x text-muted opacity-25 display-4 d-block mb-3"></i>
                      <span className="text-muted small">No vouchers found matching your filters.</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoucherReportPage;
