'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { fetchInvoices } from '@/redux/features/invoiceSlice';
import Loader from '@/components/Loader';
import ReportActions from '@/components/ReportActions';

const InvoiceReportPage = () => {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const dispatch = useDispatch();
  const { company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items: invoices, loading } = useSelector((state: RootState) => state.invoices);

  useEffect(() => {
    setMounted(true);
    if (activeCompany?.id) {
       (dispatch as any)(fetchInvoices(activeCompany.id));
    }
  }, [dispatch, activeCompany?.id]);

  if (!mounted) return null;

  const filteredInvoices = invoices.filter(inv => {
     const searchTerm = search.toLowerCase();
     return (
       (inv.customerName?.toLowerCase() ?? '').includes(searchTerm) || 
       (inv.invoiceNumber?.toLowerCase() ?? '').includes(searchTerm)
     );
  });

  return (
    <div className="container-fluid py-4 animate-fade-in">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1 text-dark">Invoice Report</h2>
          <p className="text-muted small mb-0">Detailed analysis of outbound billing and tax statements.</p>
        </div>
        <button 
          className="btn btn-white shadow-sm border px-3 d-flex align-items-center gap-2"
          onClick={() => (dispatch as any)(fetchInvoices(activeCompany?.id))}
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
                  placeholder="Search by invoice number or customer name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
               <div className="input-group">
                 <span className="input-group-text bg-white small fw-bold text-muted">Period</span>
                 <select className="form-select form-select-sm">
                   <option>This Month</option>
                   <option>Last Month</option>
                   <option>FY 2023-24</option>
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
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="px-4 py-3 border-0 small fw-bold text-muted">Sno</th>
                  <th className="py-3 border-0 small fw-bold text-muted">Date</th>
                  <th className="py-3 border-0 small fw-bold text-muted">Invoice No</th>
                  <th className="py-3 border-0 small fw-bold text-muted">Customer</th>
                  <th className="py-3 border-0 small fw-bold text-muted text-end">Base Amount</th>
                  <th className="py-3 border-0 small fw-bold text-muted text-end">Tax Amount</th>
                  <th className="py-3 border-0 small fw-bold text-muted text-end px-4">Grand Total</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7}>
                      <Loader text="Fetching Invoice Report..." />
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv, index) => (
                    <tr key={inv.id}>
                      <td className="px-4 small text-muted font-monospace">{index + 1}</td>
                      <td className="small text-muted">{inv.date}</td>
                      <td className="text-dark">{inv.invoiceNumber}</td>
                      <td className="fw-bold text-dark">{inv.customerName}</td>
                      <td className="text-end small">₹{inv.subTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="text-end small text-muted">₹{inv.taxTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="text-end fw-bold text-dark px-4">₹{inv.grandTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))
                )}
                {!loading && filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-5">
                      <i className="bi bi-receipt text-muted opacity-25 display-4 d-block mb-3"></i>
                      <span className="text-muted small">No invoices found matching your search.</span>
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

export default InvoiceReportPage;
