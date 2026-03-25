'use client';

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { fetchInvoices } from '@/redux/features/invoiceSlice';
import ModuleGuard from '@/components/ModuleGuard';
import { useRouter } from 'next/navigation';

const PendingPaymentPage = () => {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();
  const { company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items, loading } = useSelector((state: RootState) => state.invoices);

  useEffect(() => {
    setMounted(true);
    (dispatch as any)(fetchInvoices(activeCompany?.id));
  }, [dispatch, activeCompany]);

  if (!mounted) return null;

  // Filter for pending/billed but not paid invoices
  const pendingInvoices = items.filter(inv =>
    inv.status?.toLowerCase() !== 'paid' &&
    inv.status?.toLowerCase() !== 'cancelled'
  );

  const calculateOverdueDays = (dueDate: string) => {
    if (!dueDate) return 0;
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <ModuleGuard moduleId="mod_invoice">
      <div className="container-fluid py-4 animate-fade-in">
        <div className="card shadow-sm border-0 bg-white overflow-hidden rounded-4 mb-5">
          <div className="card-header bg-white border-bottom-0 pb-2 px-4 d-flex align-items-center gap-2 mt-2">
            <i className="bi bi-house-door-fill text-dark small"></i>
            <span className="text-muted small">Home / Dashboard / Pending Payment</span>
          </div>

          <div className="px-4 py-3 d-flex justify-content-between align-items-center">
            <div>
              <h4 className="fw-900 text-dark mb-1 fs-3">Pending Payments</h4>
              <p className="text-muted small mb-0 tracking-tight">Track outstanding balances and overdue collections • {pendingInvoices.length} entries</p>
            </div>
            <button className="btn btn-link text-muted p-0 shadow-none" onClick={() => (dispatch as any)(fetchInvoices(activeCompany?.id))}><i className="bi bi-arrow-repeat fs-5"></i></button>
          </div>

          <div className="table-responsive px-4 pb-4 mt-3">
            {loading ? (
              <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
            ) : (
              <table className="table align-middle mb-0 table-hover">
                <thead className="bg-light">
                  <tr>
                    <th className="fw-900 small py-3 text-uppercase tracking-wider">Sno</th>
                    <th className="fw-900 small py-3 text-uppercase tracking-wider">Customer</th>
                    <th className="fw-900 small py-3 text-uppercase tracking-wider">Po No</th>
                    <th className="fw-900 small py-3 text-uppercase tracking-wider">Dc No</th>
                    <th className="fw-900 small py-3 text-uppercase tracking-wider">Invoice No</th>
                    <th className="fw-900 small py-3 text-uppercase tracking-wider">Invoice Date</th>
                    <th className="fw-900 small py-3 text-uppercase tracking-wider">Pending Amount</th>
                    <th className="fw-900 small py-3 text-uppercase tracking-wider text-danger">Over Due</th>
                    <th className="fw-900 small py-3 text-uppercase tracking-wider text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="border-top-0">
                  {pendingInvoices.map((inv, index) => {
                    const overdueDays = calculateOverdueDays(inv.dueDate);
                    return (
                      <tr key={inv.id} className="border-bottom border-light">
                        <td className="text-dark small">{index + 1}</td>
                        <td className="text-dark fw-bold small text-uppercase">{inv.customerName}</td>
                        <td className="text-muted small">{inv.poNo || '-'}</td>
                        <td className="text-muted small">{inv.dcNo || '-'}</td>
                        <td className="text-dark fw-bold small">{inv.invoiceNumber}</td>
                        <td className="text-dark small">{new Date(inv.date).toLocaleDateString()}</td>
                        <td className="text-dark fw-bold small font-monospace">${(inv.grandTotal - (inv.paidAmount || 0)).toLocaleString()}</td>
                        <td className="text-center">
                          {overdueDays > 0 ? (
                            <span className="badge rounded-pill bg-danger-subtle text-danger px-3">{overdueDays} Days</span>
                          ) : (
                            <span className="badge rounded-pill bg-success-subtle text-success px-3">On Time</span>
                          )}
                        </td>
                        <td className="text-center">
                          <button
                            className="btn btn-sm btn-outline-primary rounded-circle p-2 shadow-none border-light-subtle"
                            title="Add Payment"
                            onClick={() => router.push(`/vouchers/new?customerId=${inv.customerId}&invoiceId=${inv.id}`)}
                          >
                            <i className="bi bi-wallet2 px-1"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {pendingInvoices.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center py-5 text-muted">
                        <h6 className="fw-normal">No pending payments found</h6>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </ModuleGuard>
  );
};

export default PendingPaymentPage;
