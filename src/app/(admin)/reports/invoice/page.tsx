'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { fetchInvoices } from '@/redux/features/invoiceSlice';

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
     const matchesSearch = inv.customerName.toLowerCase().includes(search.toLowerCase()) || 
                          inv.invoiceNumber.toLowerCase().includes(search.toLowerCase());
     return matchesSearch;
  });

  return (
    <div className="card shadow-sm border-0 bg-white overflow-hidden rounded-0 mb-5">
      <div className="card-header bg-white border-bottom-0 pb-2 px-4 d-flex align-items-center gap-2 mt-2">
         <i className="bi bi-house-door-fill text-dark small"></i>
         <span className="text-muted small">Home / Dashboard / Invoice Report</span>
      </div>

      <div className="px-4 py-3 d-flex justify-content-between align-items-center">
        <h4 className="fw-normal text-dark mb-0 fs-3">Invoice Report</h4>
        <button className="btn btn-link text-muted p-0 shadow-none" onClick={() => (dispatch as any)(fetchInvoices(activeCompany?.id))}><i className="bi bi-arrow-repeat fs-5"></i></button>
      </div>

      <div className="px-4 py-3 bg-white mt-2 d-flex align-items-center gap-3">
        <span className="small text-muted fw-bold">Select Date</span>
        <div className="border border-light rounded px-3 py-2 d-flex align-items-center gap-2" style={{ backgroundColor: '#fdfdfd' }}>
           <i className="bi bi-calendar3 text-muted"></i>
           <span className="small text-dark">{new Date().toLocaleDateString()} - {new Date().toLocaleDateString()}</span>
        </div>
        <button className="btn btn-success fw-bold px-4 shadow-sm border-0 text-white ms-4" style={{ backgroundColor: '#28a745' }}>
          GO
        </button>
      </div>

      <div className="d-flex justify-content-between px-4 align-items-center py-3 bg-white flex-wrap gap-3 mt-4 border-top">
         <div className="d-flex align-items-center gap-2">
            <span className="small text-muted fw-semibold flex-shrink-0">Filter:</span>
            <input 
               type="text" 
               className="form-control form-control-sm border-0 border-bottom rounded-0 shadow-none px-0" 
               style={{ width: '200px' }} 
               placeholder="Search by customer or invoice..."
               value={search}
               onChange={(e) => setSearch(e.target.value)}
            />
         </div>
         <div className="d-flex gap-1 flex-wrap">
            {/* <button className="btn btn-info text-white btn-sm fw-bold px-3 py-2 rounded-0 shadow-sm border-0" style={{ backgroundColor: '#3B82F6', fontSize: '11px' }}>PRINT</button>
            <button className="btn btn-sm fw-bold px-3 py-2 rounded-0 text-white shadow-sm border-0" style={{ backgroundColor: '#da3e00', fontSize: '11px' }}>EXCEL</button>
            <button className="btn btn-warning text-white btn-sm fw-bold px-3 py-2 rounded-0 shadow-sm border-0" style={{ backgroundColor: '#ff9800', fontSize: '11px' }}>PDF</button> */}
         </div>
      </div>

      <div className="table-responsive px-4 pb-4">
        <table className="table align-middle mb-0 table-hover bg-white w-100">
          <thead className="text-dark border-bottom border-top border-light">
            <tr>
              <th className="fw-semibold py-3 border-0 bg-white" style={{ fontSize: '13px' }}>Sno</th>
              <th className="fw-semibold border-0 bg-white" style={{ fontSize: '13px' }}>Date</th>
              <th className="fw-semibold border-0 bg-white" style={{ fontSize: '13px' }}>Invoice No</th>
              <th className="fw-semibold border-0 bg-white" style={{ fontSize: '13px' }}>Customer Name</th>
              <th className="fw-semibold border-0 bg-white" style={{ fontSize: '13px', textAlign: 'right' }}>Base Amount</th>
              <th className="fw-semibold border-0 bg-white" style={{ fontSize: '13px', textAlign: 'right' }}>Tax Amount</th>
              <th className="fw-semibold border-0 bg-white" style={{ fontSize: '13px', textAlign: 'right' }}>Grand Total</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
               <tr><td colSpan={7} className="text-center py-4">Loading Invoices...</td></tr>
            ) : filteredInvoices.map((inv, index) => (
              <tr key={inv.id} className="border-bottom-light">
                <td style={{ fontSize: '13px' }}>{index + 1}</td>
                <td style={{ fontSize: '13px' }}>{inv.date}</td>
                <td style={{ fontSize: '13px' }} className="fw-bold">{inv.invoiceNumber}</td>
                <td style={{ fontSize: '13px' }} className="text-uppercase">{inv.customerName}</td>
                <td style={{ fontSize: '13px', textAlign: 'right' }}>₹{inv.subTotal?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td style={{ fontSize: '13px', textAlign: 'right' }}>₹{inv.taxTotal?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td style={{ fontSize: '13px', textAlign: 'right' }} className="fw-bold">₹{inv.grandTotal?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
            {filteredInvoices.length === 0 && !loading && (
               <tr>
                 <td colSpan={7} className="text-center py-5 text-muted bg-white">
                    <h6 className="fw-normal">No Invoices found for current selection</h6>
                 </td>
               </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoiceReportPage;
