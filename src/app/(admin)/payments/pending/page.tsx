'use client';

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Link from 'next/link';
import { RootState } from '@/redux/store';
import { fetchInvoices, setInvoicePage } from '@/redux/features/invoiceSlice';

import { fetchCustomers } from '@/redux/features/customerSlice';
import { fetchInwards } from '@/redux/features/inwardSlice';
import ModuleGuard from '@/components/ModuleGuard';
import { useRouter } from 'next/navigation';
import Loader from '@/components/Loader';

import ExportExcel from '@/components/shared/ExportExcel';
import PartyTypeToggle from '@/components/shared/PartyTypeToggle';
import IndustrialDocument from '@/components/shared/IndustrialDocument';
import Breadcrumb from '@/components/Breadcrumb';
import PaginationComponent from '@/components/shared/Pagination';


const PendingPaymentPage = () => {
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [partyType, setPartyType] = useState<'all' | 'customer' | 'vendor'>('customer');
  const [printGroup, setPrintGroup] = useState<any>(null);
  const router = useRouter();
  const dispatch = useDispatch();
  const { company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items, pagination, loading } = useSelector((state: RootState) => state.invoices);
  const { items: customers } = useSelector((state: RootState) => state.customers);
  const { items: inwards } = useSelector((state: RootState) => state.inward);

  useEffect(() => {
    setMounted(true);
    if (activeCompany?.id) {
      (dispatch as any)(fetchInvoices({ company_id: activeCompany.id, limit: 1000, status: 'pending', partyType }));
      (dispatch as any)(fetchCustomers({ company_id: activeCompany.id, limit: 1000 }));
      (dispatch as any)(fetchInwards({ company_id: activeCompany.id, limit: 1000 }));
    }
  }, [dispatch, activeCompany?.id, partyType]);

  if (!mounted) return null;

  // Filter for pending/billed but not paid invoices
  const pendingInvoices = items.filter(inv => {
    const balance = (inv.grandTotal || 0) - (inv.paidAmount || 0);
    const isPending = inv.status?.toLowerCase() !== 'paid' &&
      inv.status?.toLowerCase() !== 'cancelled' &&
      (balance > 0 || inv.status?.toLowerCase() === 'billed');
    const isWOP = inv.billType === 'Without Process' || inv.billType === 'without_process' || inv.bill_type === 'Without Process' || inv.bill_type === 'without_process';
    
    if (!isPending || isWOP) return false;

    const matchesSearch =
      (inv.customerName?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
      (inv.invoiceNumber?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
      (inv.poNo?.toLowerCase() ?? '').includes(searchTerm.toLowerCase());
    const matchesCustomer = !selectedCustomerId || String(inv.customerId) === String(selectedCustomerId);

    return matchesSearch && matchesCustomer;
  });

  const groupedInvoices = pendingInvoices.reduce((acc, inv) => {
    const key = inv.customerId || 'unknown';
    if (!acc[key]) {
      acc[key] = {
        customerId: key,
        customerName: inv.customerName || 'Unknown Customer',
        invoices: [],
        totalPending: 0,
        firstInvoice: inv
      };
    }
    acc[key].invoices.push(inv);
    acc[key].totalPending += (inv.grandTotal || 0) - (inv.paidAmount || 0);
    return acc;
  }, {} as Record<string, { customerId: string, customerName: string, invoices: any[], totalPending: number, firstInvoice: any }>);

  const customerGroups = Object.values(groupedInvoices);

  const totalPages = Math.ceil(customerGroups.length / pagination.itemsPerPage);
  const paginatedGroups = customerGroups.slice(
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

  const handlePrintPending = (group: any) => {
    setPrintGroup(group);
    setTimeout(() => window.print(), 300);
  };

  // Build the correct voucher creation URL — vendor invoices need partyType=vendor
  const getVoucherUrl = (inv: any) => {
    const inward = inwards.find(iw => String(iw.id) === String(inv.inwardId));
    const vendorId = (inward as any)?.vendorId || (inward as any)?.vendor_id;
    if (vendorId) {
      return `/vouchers/new?partyType=vendor&vendorId=${vendorId}&invoiceId=${inv.id}&redirect=/payments/pending`;
    }
    return `/vouchers/new?partyType=customer&customerId=${inv.customerId}&invoiceId=${inv.id}&redirect=/payments/pending`;
  };

  return (
    <ModuleGuard moduleId="mod_invoice">
      <div className="container-fluid py-4 min-vh-100 animate-fade-in px-4 no-print">
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
            <div className="filter-bar-row d-flex flex-wrap gap-2 align-items-center">
              <div className="filter-item-select" style={{ minWidth: '150px' }}>
                <PartyTypeToggle
                  partyType={partyType}
                  setPartyType={setPartyType as any}
                />
              </div>

              <div className="filter-item-search flex-grow-1">
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
                      <th className="fw-bold x-small text-muted text-uppercase tracking-wider py-3 text-end px-3">Pending Amount</th>
                      <th className="fw-bold x-small text-muted text-uppercase tracking-wider py-3 text-danger text-center">Over Due</th>
                      <th className="fw-bold x-small text-muted text-uppercase tracking-wider py-3 text-center px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="border-top-0">
                    {paginatedGroups.map((group, index) => {
                      const maxOverdueDays = Math.max(0, ...group.invoices.map(inv => calculateOverdueDays(inv.dueDate)));
                      
                      const latestInvoice = group.invoices.reduce((latest, current) => {
                        const latestDate = latest.date ? new Date(latest.date).getTime() : 0;
                        const currentDate = current.date ? new Date(current.date).getTime() : 0;
                        return currentDate > latestDate ? current : latest;
                      }, group.invoices[0]);

                      return (
                        <tr
                          key={group.customerId}
                          className="border-bottom border-light"
                          style={{ cursor: 'pointer' }}
                          onClick={() => router.push(getVoucherUrl(group.firstInvoice))}
                        >
                          <td className="text-muted small px-4">
                            {(pagination.currentPage - 1) * pagination.itemsPerPage + index + 1}
                          </td>
                          <td className="text-dark fw-bold text-uppercase" style={{ fontSize: '0.85rem' }}>
                            <div className="d-flex flex-column align-items-start gap-1">
                              <span style={{ lineHeight: '1.4' }}>{group.customerName}</span>
                              {group.invoices.length > 1 && (
                                <span className="badge bg-secondary rounded-pill" style={{ fontSize: '0.7rem' }}>{group.invoices.length} Invoices</span>
                              )}
                            </div>
                          </td>
                          <td className="text-muted small">{latestInvoice.poNo || '-'}</td>
                          <td className="text-muted small">{latestInvoice.dcNo || '-'}</td>
                          <td className="text-dark fw-bold small">
                            <Link
                              href={`/invoices/${latestInvoice.id}`}
                              className="text-primary fw-bold text-decoration-none hover-underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {latestInvoice.invoiceNumber}
                            </Link>
                          </td>
                          <td className="text-muted small">{latestInvoice.date ? new Date(latestInvoice.date).toLocaleDateString() : 'N/A'}</td>
                          <td className="text-dark fw-bold small text-end px-3">₹ {group.totalPending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="text-center">
                            {maxOverdueDays > 0 ? (
                              <span className="badge rounded-pill bg-danger-subtle text-danger px-3">{maxOverdueDays} Days</span>
                            ) : (
                              <span className="badge rounded-pill bg-success-subtle text-success px-3">On Time</span>
                            )}
                          </td>
                          <td className="text-center px-4 text-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="d-flex justify-content-center gap-2">
                              <button
                                className="btn border-0 d-flex align-items-center justify-content-center p-0 shadow-sm"
                                title="Create Payment Voucher"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(getVoucherUrl(group.firstInvoice));
                                }}
                                style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#0ea5e9', color: '#fff' }}
                              >
                                <i className="bi bi-pencil-fill fs-6"></i>
                              </button>

                              <button
                                className="btn border-0 d-flex align-items-center justify-content-center p-0 shadow-sm"
                                title="Print Statement"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePrintPending(group);
                                }}
                                style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#10b981', color: '#fff' }}
                              >
                                <i className="bi bi-printer-fill fs-6"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {customerGroups.length === 0 && (
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
                <span className="text-muted small">Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} to {Math.min(pagination.currentPage * pagination.itemsPerPage, customerGroups.length)} of {customerGroups.length} entries</span>
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

      {/* Print Statement Area */}
      {printGroup && (
        <div className="print-area d-none">
          <IndustrialDocument
            type="statement"
            company={activeCompany}
            data={{
              partyName: printGroup.customerName,
              partyType: partyType === 'vendor' ? 'vendor' : 'customer',
              customerId: printGroup.customerId,
              vendorId: printGroup.customerId,
              date: new Date().toISOString(),
              totalPending: printGroup.totalPending,
              items: printGroup.invoices,
            }}
          />
        </div>
      )}

      <style jsx>{`
        .fw-900 { font-weight: 900; }
        .tracking-tight { letter-spacing: -0.025em; }
        .x-small { font-size: 0.75rem !important; }
        .table-responsive {
          min-height: 400px;
          padding-bottom: 80px;
        }
        
        @media print {
          .no-print { display: none !important; }
          .print-area { display: block !important; }
          .d-none { display: block !important; }
          body, html { 
            background: white !important; 
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </ModuleGuard>
  );
};

export default PendingPaymentPage;
