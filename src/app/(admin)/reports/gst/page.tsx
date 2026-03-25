'use client';

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { fetchInvoices } from '@/redux/features/invoiceSlice';
import { fetchCustomers } from '@/redux/features/customerSlice';

const GstReportPage = () => {
  const [mounted, setMounted] = useState(false);
  const dispatch = useDispatch();
  const { user, company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items: invoices, loading: invLoading } = useSelector((state: RootState) => state.invoices);
  const { items: customers, loading: custLoading } = useSelector((state: RootState) => state.customers);

  useEffect(() => {
    setMounted(true);
    (dispatch as any)(fetchInvoices(activeCompany?.id));
    (dispatch as any)(fetchCustomers());
  }, [dispatch, activeCompany]);

  if (!mounted) return null;

  // Only real invoices (Type: INVOICE or BOTH)
  const filteredItems = (invoices || []).filter(inv => {
    if (activeCompany && inv.company_id !== activeCompany.id) return false;
    return inv.type === 'INVOICE' || inv.type === 'BOTH';
  });

  return (
    <div className="card shadow-sm border-0 bg-white overflow-hidden rounded-0 mb-5 animate-fade-in">
      <div className="card-header bg-white border-bottom-0 pb-2 px-4 d-flex align-items-center gap-2 mt-2">
         <i className="bi bi-house-door-fill text-dark small"></i>
         <span className="text-muted small">Home / Dashboard / Gst Report</span>
      </div>

      <div className="px-4 py-3 d-flex justify-content-between align-items-center">
        <h4 className="fw-normal text-dark mb-0 fs-3">Gst Report</h4>
        <button className="btn btn-link text-muted p-0 shadow-none"><i className="bi bi-arrow-repeat fs-5"></i></button>
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

      <div className="table-responsive px-4 pb-4 mt-4">
        {(invLoading || custLoading) ? (
          <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
        ) : (
          <table className="table align-middle mb-0 table-hover bg-white w-100">
            <thead className="text-dark border-bottom border-top border-light">
              <tr>
                <th className="fw-semibold py-3 border-0 bg-white text-center" style={{ fontSize: '12px' }}>Sno</th>
                <th className="fw-semibold text-center border-0 bg-white text-center" style={{ fontSize: '12px' }}>Date</th>
                <th className="fw-semibold border-0 bg-white" style={{ fontSize: '12px' }}>Customer</th>
                <th className="fw-semibold text-center border-0 bg-white" style={{ fontSize: '12px' }}>GST TIN</th>
                <th className="fw-semibold text-center border-0 bg-white" style={{ fontSize: '12px' }}>Dc No</th>
                <th className="fw-semibold text-center border-0 bg-white text-center" style={{ fontSize: '12px' }}>Invoice No</th>
                <th className="fw-semibold text-center border-0 bg-white" style={{ fontSize: '12px' }}>Amount</th>
                <th className="fw-semibold text-center border-0 bg-white" style={{ fontSize: '12px' }}>CGST</th>
                <th className="fw-semibold text-center border-0 bg-white" style={{ fontSize: '12px' }}>SGST</th>
                <th className="fw-semibold text-center border-0 bg-white" style={{ fontSize: '12px' }}>IGST</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((inv, index) => {
                const selectedCustomer = customers.find(c => c.id === inv.customerId);
                const isLocal = !selectedCustomer || selectedCustomer.state?.toUpperCase() === 'TAMIL NADU' || selectedCustomer.stateCode === '33';
                
                const cgst = isLocal && inv.taxTotal > 0 ? (inv.taxTotal / 2).toFixed(2) : '0.00';
                const sgst = isLocal && inv.taxTotal > 0 ? (inv.taxTotal / 2).toFixed(2) : '0.00';
                const igst = !isLocal && inv.taxTotal > 0 ? inv.taxTotal.toFixed(2) : '0.00';

                return (
                  <tr key={inv.id} className="border-bottom border-light">
                    <td className="text-dark text-center" style={{ fontSize: '12px' }}>{index + 1}</td>
                    <td className="text-dark text-center" style={{ fontSize: '12px' }}>{inv.date}</td>
                    <td className="text-dark text-uppercase small" style={{ fontSize: '12px' }}>{inv.customerName}</td>
                    <td className="text-dark text-center" style={{ fontSize: '12px' }}>{selectedCustomer?.gst || '-'}</td>
                    <td className="text-dark text-center text-uppercase" style={{ fontSize: '12px' }}>{inv.dcNo || '-'}</td>
                    <td className="text-dark text-center" style={{ fontSize: '12px' }}>{inv.invoiceNumber}</td>
                    <td className="text-dark text-center fw-bold" style={{ fontSize: '12px' }}>₹{inv.grandTotal.toFixed(2)}</td>
                    <td className="text-dark text-center" style={{ fontSize: '12px' }}>{cgst}</td>
                    <td className="text-dark text-center" style={{ fontSize: '12px' }}>{sgst}</td>
                    <td className="text-dark text-center" style={{ fontSize: '12px' }}>{igst}</td>
                  </tr>
                );
              })}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-5 text-muted bg-white">
                     <h6 className="fw-normal">No Invoices Available for GST Report</h6>
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

export default GstReportPage;
