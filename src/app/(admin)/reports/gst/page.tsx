'use client';

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { fetchInvoices } from '@/redux/features/invoiceSlice';
import { fetchCustomers } from '@/redux/features/customerSlice';
import Loader from '@/components/Loader';
import ReportActions from '@/components/ReportActions';

const GstReportPage = () => {
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dispatch = useDispatch();
  const { company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items: invoices, loading: invLoading } = useSelector((state: RootState) => state.invoices);
  const { items: customers, loading: custLoading } = useSelector((state: RootState) => state.customers);

  useEffect(() => {
    setMounted(true);
    (dispatch as any)(fetchInvoices(activeCompany?.id));
    (dispatch as any)(fetchCustomers());
  }, [dispatch, activeCompany?.id]);

  if (!mounted) return null;

  const filteredItems = (invoices || []).filter(inv => {
    const search = searchTerm.toLowerCase();
    const matchSearch = inv.customerName?.toLowerCase().includes(search) || 
                       inv.invoiceNumber?.toLowerCase().includes(search) ||
                       inv.dcNo?.toLowerCase().includes(search);
    
    const isRightType = inv.type === 'INVOICE' || inv.type === 'BOTH' || (inv as any).type === 'invoice';
    return matchSearch && isRightType;
  });

  return (
    <div className="container-fluid py-4 animate-fade-in">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1 text-dark">GST Report</h2>
          <p className="text-muted small mb-0">Analysis of tax collection and liability for the selected period.</p>
        </div>
        <button 
          className="btn btn-white shadow-sm border px-3 d-flex align-items-center gap-2"
          onClick={() => {
            (dispatch as any)(fetchInvoices(activeCompany?.id));
            (dispatch as any)(fetchCustomers());
          }}
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
                  placeholder="Search by Customer name or DC number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
               <div className="input-group">
                 <span className="input-group-text bg-white small fw-bold text-muted">Date</span>
                 <input type="date" className="form-control form-control-sm" defaultValue="2024-03-01" />
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
                  <th className="px-4 py-3 border-0 small fw-bold text-muted text-center">Sno</th>
                  <th className="py-3 border-0 small fw-bold text-muted text-center">Date</th>
                  <th className="py-3 border-0 small fw-bold text-muted">Customer</th>
                  <th className="py-3 border-0 small fw-bold text-muted text-center">GSTIN</th>
                  <th className="py-3 border-0 small fw-bold text-muted text-center">Invoice No</th>
                  <th className="py-3 border-0 small fw-bold text-muted text-end">Amount</th>
                  <th className="py-3 border-0 small fw-bold text-muted text-center">CGST</th>
                  <th className="py-3 border-0 small fw-bold text-muted text-center">SGST</th>
                  <th className="py-3 border-0 small fw-bold text-muted text-center px-4">IGST</th>
                </tr>
              </thead>
              <tbody>
                {(invLoading || custLoading) ? (
                  <tr>
                    <td colSpan={9}>
                      <Loader text="Fetching GST Report..." />
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((inv, index) => {
                    const selectedCustomer = customers.find(c => c.id === inv.customerId);
                    const isLocal = !selectedCustomer || selectedCustomer.state?.toUpperCase() === 'TAMIL NADU' || selectedCustomer.stateCode === '33';
                    
                    const cgst = isLocal && (inv.taxTotal || 0) > 0 ? (inv.taxTotal / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-';
                    const sgst = isLocal && (inv.taxTotal || 0) > 0 ? (inv.taxTotal / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-';
                    const igst = !isLocal && (inv.taxTotal || 0) > 0 ? (inv.taxTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-';

                    return (
                      <tr key={inv.id}>
                        <td className="px-4 small text-muted font-monospace text-center">{index + 1}</td>
                        <td className="small text-center text-muted">{inv.date}</td>
                        <td>
                          <div className="fw-bold text-dark small text-uppercase mb-0">{inv.customerName}</div>
                          <div className="x-small text-muted">{inv.dcNo ? `DC: ${inv.dcNo}` : ''}</div>
                        </td>
                        <td className="text-center">
                          <span className="badge bg-light text-dark border-0 fw-600 px-3 py-1 rounded-pill small">
                            {selectedCustomer?.gst || '-'}
                          </span>
                        </td>
                        <td className="text-center small fw-bold text-dark font-monospace">{inv.invoiceNumber}</td>
                        <td className="text-end fw-bold text-dark">₹{inv.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="text-center small text-muted">{cgst}</td>
                        <td className="text-center small text-muted">{sgst}</td>
                        <td className="text-center small text-muted px-4">{igst}</td>
                      </tr>
                    );
                  })
                )}
                {!invLoading && filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-5">
                      <i className="bi bi-file-earmark-bar-graph text-muted opacity-25 display-4 d-block mb-3"></i>
                      <span className="text-muted small">No tax records found for the current selection.</span>
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

export default GstReportPage;
