'use client';

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { fetchInvoices, setInvoicePage } from '@/redux/features/invoiceSlice';
import { fetchCustomers } from '@/redux/features/customerSlice';
import ModuleGuard from '@/components/ModuleGuard';
import { useRouter } from 'next/navigation';
import Loader from '@/components/Loader';

import ExportExcel from '@/components/shared/ExportExcel';
import Breadcrumb from '@/components/Breadcrumb';
import PaginationComponent from '@/components/shared/Pagination';


const PendingPaymentPage = () => {
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const router = useRouter();
  const dispatch = useDispatch();
  const { company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items, pagination, loading } = useSelector((state: RootState) => state.invoices);
  const { items: customers } = useSelector((state: RootState) => state.customers);

  useEffect(() => {
    setMounted(true);
    if (activeCompany?.id) {
      (dispatch as any)(fetchInvoices({ company_id: activeCompany.id, limit: 1000, status: 'pending' }));
      (dispatch as any)(fetchCustomers({ company_id: activeCompany.id, limit: 1000 }));
    }
  }, [dispatch, activeCompany?.id]);

  if (!mounted) return null;

  // Filter for pending/billed but not paid invoices
  const pendingInvoices = items.filter(inv => {
    const balance = (inv.grandTotal || 0) - (inv.paidAmount || 0);
    const isPending = inv.status?.toLowerCase() !== 'paid' &&
                      inv.status?.toLowerCase() !== 'cancelled' &&
                      balance > 0;
    if (!isPending) return false;

    const matchesSearch =
      (inv.customerName?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
      (inv.invoiceNumber?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
      (inv.poNo?.toLowerCase() ?? '').includes(searchTerm.toLowerCase());
    const matchesCustomer = !selectedCustomerId || String(inv.customerId) === String(selectedCustomerId);

    return matchesSearch && matchesCustomer;
  });

  const totalPages = Math.ceil(pendingInvoices.length / pagination.itemsPerPage);
  const paginatedItems = pendingInvoices.slice(
    (pagination.currentPage - 1) * pagination.itemsPerPage,
    pagination.currentPage * pagination.itemsPerPage
  );

  const calculateOverdueDays = (dueDate: string) => {
    if (!dueDate) return 0;
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Open the invoice's own print page — exactly the same format as invoice print
  const handlePrintPending = (inv: any) => {
    window.open(`/invoices/${inv.id}?print=true`, '_blank');
  };

  return (
    <ModuleGuard moduleId="mod_invoice">
      <div className="container-fluid py-4 min-vh-100 animate-fade-in px-4">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <Breadcrumb items={[{ label: 'Outstanding Collections', active: true }]} />
            <h2 className="fw-900 tracking-tight text-dark mb-1 mt-2">Pending Payments</h2>
            <p className="text-muted small mb-0">Track outstanding balances and overdue collections across all industrial accounts.</p>
          </div>
          <div className="d-flex align-items-center gap-3">
            <ExportExcel
              data={pendingInvoices}
              fileName="Pending_Payments_Report"
              headers={{ customerName: 'Customer', invoiceNumber: 'Invoice No', grandTotal: 'Total', paidAmount: 'Paid', status: 'Status' }}
              buttonText="Export List"
            />
            <button
              className="btn btn-primary btn-page-action px-4"
              onClick={() => (dispatch as any)(fetchInvoices({ company_id: activeCompany?.id }))}
            >
              <i className="bi bi-arrow-repeat"></i>
              <span>Refresh Data</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="card filter-card">
          <div className="card-body p-3">
            <div className="filter-bar-row">
              <div className="filter-item-search">
                <div className="search-group">
                  <span className="input-group-text">
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control search-bar"
                    placeholder="Search customer, invoice, or PO no..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="filter-item-select">
                <select
                  className="form-select search-bar"
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                >
                  <option value="">-- All Customers --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.company || c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-0 overflow-hidden mt-3">
          <div className="card-body p-0">
            <div className="table-responsive" style={{ minHeight: '400px', paddingBottom: '80px' }}>
              {loading ? (
                <div className="py-2">
                  <Loader text="Fetching Pending Payments..." />
                </div>
              ) : (
                <table className="table align-middle mb-0 table-hover">
                  <thead className="table-light">
                    <tr>
                      <th className="fw-bold x-small text-muted text-uppercase tracking-wider py-3 px-4">Sno</th>
                      <th className="fw-bold x-small text-muted text-uppercase tracking-wider py-3">Customer</th>
                      <th className="fw-bold x-small text-muted text-uppercase tracking-wider py-3">Po No</th>
                      <th className="fw-bold x-small text-muted text-uppercase tracking-wider py-3">Dc No</th>
                      <th className="fw-bold x-small text-muted text-uppercase tracking-wider py-3">Invoice No</th>
                      <th className="fw-bold x-small text-muted text-uppercase tracking-wider py-3">Invoice Date</th>
                      <th className="fw-bold x-small text-muted text-uppercase tracking-wider py-3">Pending Amount</th>
                      <th className="fw-bold x-small text-muted text-uppercase tracking-wider py-3 text-danger text-center">Over Due</th>
                      <th className="fw-bold x-small text-muted text-uppercase tracking-wider py-3 text-center px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="border-top-0">
                    {paginatedItems.map((inv, index) => {
                      const overdueDays = calculateOverdueDays(inv.dueDate);
                      return (
                        <tr key={inv.id} className="border-bottom border-light">
                          <td className="text-muted small px-4">
                            {(pagination.currentPage - 1) * pagination.itemsPerPage + index + 1}
                          </td>
                          <td className="text-dark fw-bold text-uppercase" style={{ fontSize: '0.85rem' }}>{inv.customerName}</td>
                          <td className="text-muted small">{inv.poNo || '-'}</td>
                          <td className="text-muted small">{inv.dcNo || '-'}</td>
                          <td className="text-primary fw-bold small">{inv.invoiceNumber}</td>
                          <td className="text-muted small">{inv.date ? new Date(inv.date).toLocaleDateString() : 'N/A'}</td>
                          <td className="text-dark fw-bold small">₹ {(inv.grandTotal - (inv.paidAmount || 0)).toLocaleString()}</td>
                          <td className="text-center">
                            {overdueDays > 0 ? (
                              <span className="badge rounded-pill bg-danger-subtle text-danger px-3">{overdueDays} Days</span>
                            ) : (
                              <span className="badge rounded-pill bg-success-subtle text-success px-3">On Time</span>
                            )}
                          </td>
                          <td className="text-center px-4 text-nowrap">
                            <div className="d-flex justify-content-center gap-1">
                              <button
                                className="btn-action-edit"
                                title="Add Payment"
                                onClick={() => router.push(`/vouchers/new?customerId=${inv.customerId}&invoiceId=${inv.id}&redirect=/payments/pending`)}
                              >
                                <i className="bi bi-wallet2 px-1"></i>
                              </button>

                              <div className="dropdown">
                                <button
                                  className="btn btn-sm btn-outline-secondary border-0 text-muted p-0 ms-1 d-flex align-items-center justify-content-center"
                                  type="button"
                                  id={`actions-${inv.id}`}
                                  data-bs-toggle="dropdown"
                                  aria-expanded="false"
                                  style={{ width: '32px', height: '32px', borderRadius: '8px' }}
                                >
                                  <i className="bi bi-three-dots-vertical fs-5"></i>
                                </button>
                                <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3 py-2" aria-labelledby={`actions-${inv.id}`}>
                                  <li>
                                    <button className="dropdown-item d-flex align-items-center gap-2 py-2" type="button" onClick={() => handlePrintPending(inv)}>
                                      <i className="bi bi-printer text-primary"></i>
                                      <span className="small fw-semibold">Quick Print</span>
                                    </button>
                                  </li>
                                </ul>
                              </div>
                            </div>
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
            {totalPages > 1 && (
              <div className="p-3 border-top bg-light d-flex justify-content-between align-items-center px-4">
                <span className="text-muted small">Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} to {Math.min(pagination.currentPage * pagination.itemsPerPage, pendingInvoices.length)} of {pendingInvoices.length} entries</span>
                <PaginationComponent
                  currentPage={pagination.currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => dispatch(setInvoicePage(page))}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .fw-900 { font-weight: 900; }
        .tracking-tight { letter-spacing: -0.025em; }
        .x-small { font-size: 0.75rem !important; }
        .table-responsive {
          min-height: 400px;
          padding-bottom: 80px;
        }
      `}</style>
    </ModuleGuard>
  );
};

export default PendingPaymentPage;
