'use client';

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { fetchInwards } from '@/redux/features/inwardSlice';

const InwardReportPage = () => {
  const [mounted, setMounted] = useState(false);
  const dispatch = useDispatch();
  const { company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items, loading } = useSelector((state: RootState) => state.inward);

  useEffect(() => {
    setMounted(true);
    (dispatch as any)(fetchInwards(activeCompany?.id));
  }, [dispatch, activeCompany]);

  if (!mounted) return null;

  return (
    <div className="card shadow-sm border-0 bg-white overflow-hidden rounded-0 mb-5 animate-fade-in">
      <div className="card-header bg-white border-bottom-0 pb-2 px-4 d-flex align-items-center gap-2 mt-2">
         <i className="bi bi-house-door-fill text-dark small"></i>
         <span className="text-muted small">Home / Dashboard / Inward Report</span>
      </div>

      <div className="px-4 py-3 d-flex justify-content-between align-items-center">
        <h4 className="fw-normal text-dark mb-0 fs-3">Inward Report</h4>
        <button className="btn btn-link text-muted p-0 shadow-none" onClick={() => (dispatch as any)(fetchInwards(activeCompany?.id))}><i className="bi bi-arrow-repeat fs-5"></i></button>
      </div>

      <div className="px-4 py-3 bg-white mt-2 d-flex align-items-center gap-3">
        <span className="small text-muted fw-bold">Select Date</span>
        <div className="border border-light rounded px-3 py-2 d-flex align-items-center gap-2" style={{ backgroundColor: '#fdfdfd' }}>
           <i className="bi bi-calendar3 text-muted"></i>
           <span className="small text-dark">01/01/2023 - 01/31/2023</span>
        </div>
        <button className="btn btn-success fw-bold px-4 shadow-sm border-0 text-white ms-4" style={{ backgroundColor: '#28a745' }}>
          GO
        </button>
      </div>

      <div className="d-flex justify-content-between px-4 align-items-center py-3 bg-white flex-wrap gap-3 mt-4 border-top">
         <div className="d-flex align-items-center gap-2">
            <span className="small text-muted fw-semibold flex-shrink-0">Filter:</span>
            <input type="text" className="form-control form-control-sm border-0 border-bottom rounded-0 shadow-none px-0" style={{ width: '200px' }} placeholder="Customer name..." />
         </div>
         <div className="d-flex gap-1 flex-wrap">
            <button className="btn btn-info text-white btn-sm fw-bold px-3 py-2 rounded-0 shadow-sm border-0" style={{ backgroundColor: '#00bcd4', fontSize: '11px' }}>PRINT</button>
            <button className="btn btn-sm fw-bold px-3 py-2 rounded-0 text-white shadow-sm border-0" style={{ backgroundColor: '#9c27b0', fontSize: '11px' }}>EXCEL</button>
         </div>
      </div>

      <div className="table-responsive px-4 pb-4">
        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
        ) : (
          <table className="table align-middle mb-0 table-hover bg-white w-100">
            <thead className="text-dark border-bottom border-top border-light">
              <tr>
                <th className="fw-semibold py-3 border-0 bg-white" style={{ fontSize: '13px' }}>Sno</th>
                <th className="fw-semibold border-0 bg-white" style={{ fontSize: '13px' }}>Customer</th>
                <th className="fw-semibold border-0 bg-white text-center" style={{ fontSize: '13px' }}>Inward Date</th>
                <th className="fw-semibold border-0 bg-white text-center" style={{ fontSize: '13px' }}>Po No</th>
                <th className="fw-semibold border-0 bg-white text-center" style={{ fontSize: '13px' }}>Po Date</th>
                <th className="fw-semibold border-0 bg-white text-center" style={{ fontSize: '13px' }}>Dc No</th>
                <th className="fw-semibold border-0 bg-white text-center" style={{ fontSize: '13px' }}>DC Date</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id} className="border-bottom border-light">
                  <td className="text-dark small">{index + 1}</td>
                  <td className="text-dark text-uppercase small">{item.customerName || item.vendorName}</td>
                  <td className="text-dark small text-center">{item.date ? new Date(item.date).toLocaleDateString() : '-'}</td>
                  <td className="text-dark small text-center fw-bold">{item.poReference || (item as any).poNo || '-'}</td>
                  <td className="text-dark small text-center">{(item as any).poDate ? new Date((item as any).poDate).toLocaleDateString() : '-'}</td>
                  <td className="text-dark small text-center fw-bold">{(item as any).dcNo || '-'}</td>
                  <td className="text-dark small text-center">{(item as any).dcDate ? new Date((item as any).dcDate).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-5 text-muted bg-white">
                     <h6 className="fw-normal">No Inward entries found</h6>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default InwardReportPage;
