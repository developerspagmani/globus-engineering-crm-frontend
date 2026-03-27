'use client';

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { fetchInwards } from '@/redux/features/inwardSlice';

const InwardReportPage = () => {
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dispatch = useDispatch();
  const { company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items, loading } = useSelector((state: RootState) => state.inward);

  useEffect(() => {
    setMounted(true);
    (dispatch as any)(fetchInwards(activeCompany?.id));
  }, [dispatch, activeCompany?.id]);

  if (!mounted) return null;

  const filteredItems = items.filter(item => {
    const search = searchTerm.toLowerCase();
    return (
      (item.inwardNo?.toLowerCase() ?? '').includes(search) ||
      (item.customerName?.toLowerCase() ?? '').includes(search) ||
      (item.dcNo?.toLowerCase() ?? '').includes(search)
    );
  });

  return (
    <div className="container-fluid py-4 animate-fade-in">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1 text-dark">Inward Report</h2>
          <p className="text-muted small mb-0">Analysis of incoming materials and vendor gate receipts.</p>
        </div>
        <button 
          className="btn btn-white shadow-sm border px-3 d-flex align-items-center gap-2"
          onClick={() => (dispatch as any)(fetchInwards(activeCompany?.id))}
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
                  placeholder="Search by inward no, customer name or DC no..."
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
                  <th className="py-3 border-0 small fw-bold text-muted text-center">Inward Date</th>
                  <th className="py-3 border-0 small fw-bold text-muted text-center">Po No</th>
                  <th className="py-3 border-0 small fw-bold text-muted text-center">Dc No</th>
                  <th className="py-3 border-0 small fw-bold text-muted text-center px-4">DC Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5">
                      <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                      <span className="text-muted small">Loading report data...</span>
                    </td>
                  </tr>
                ) : filteredItems.map((item, index) => (
                  <tr key={item.id}>
                    <td className="px-4 small text-muted font-monospace">{index + 1}</td>
                    <td>
                      <div className="fw-bold text-dark mb-0">{item.customerName || item.vendorName || '-'}</div>
                      <div className="text-muted x-small font-monospace">{item.inwardNo}</div>
                    </td>
                    <td className="text-center small text-muted">
                        {item.date ? new Date(item.date).toLocaleDateString() : '-'}
                    </td>
                    <td className="text-center">
                      <span className="small text-dark fw-bold">
                        {item.poReference || (item as any).poNo || '-'}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className="badge bg-light text-dark border fw-normal">
                        {item.dcNo || '-'}
                      </span>
                    </td>
                    <td className="text-center small text-muted px-4">
                      {item.dcDate ? new Date(item.dcDate).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
                {!loading && filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-5">
                      <i className="bi bi-inboxes display-4 text-muted opacity-25 d-block mb-3"></i>
                      <span className="text-muted small">No records found for the selected criteria.</span>
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

export default InwardReportPage;
