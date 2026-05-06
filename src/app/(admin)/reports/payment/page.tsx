'use client';

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { fetchVouchers, setVoucherPage } from '@/redux/features/voucherSlice';
import { fetchPendingPayments, setPendingPaymentPage } from '@/redux/features/pendingPaymentSlice';
import { fetchCustomers } from '@/redux/features/customerSlice';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Loader from '@/components/Loader';
import ReportActions from '@/components/ReportActions';
import Breadcrumb from '@/components/Breadcrumb';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import PaginationComponent from '@/components/shared/Pagination';
import api from '@/lib/axios';



const PaymentReportPage = () => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'PAYMENT' | 'PENDING'>('PAYMENT');
  const [ageingFilter, setAgeingFilter] = useState<'all' | '0-30' | '31-60' | '61-90' | '90+'>('all');
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const dispatch = useDispatch();
  const { company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items: vouchers, pagination: vPagination, loading: vLoading, aggregates: vAggregates } = useSelector((state: RootState) => state.voucher);
  const { items: pending, pagination: pPagination, loading: pLoading, aggregates: pAggregates } = useSelector((state: RootState) => state.pendingPayments);
  const { items: customers } = useSelector((state: RootState) => state.customers);
  const { settings: invSettings } = useSelector((state: RootState) => state.invoices);

  useEffect(() => {
    setMounted(true);
    if (activeCompany?.id) { 
      // Fetch both for accurate aggregate calculations across tabs
      (dispatch as any)(fetchVouchers({
        company_id: activeCompany.id,
        page: vPagination.currentPage,
        limit: vPagination.itemsPerPage,
        search: searchTerm,
        fromDate: fromDate,
        toDate: toDate,
        partyId: selectedCustomerId
      }));
      (dispatch as any)(fetchPendingPayments({
        company_id: activeCompany.id,
        page: pPagination.currentPage,
        limit: pPagination.itemsPerPage,
        search: searchTerm,
        fromDate: fromDate,
        toDate: toDate
      }));
      (dispatch as any)(fetchCustomers({ company_id: activeCompany.id, limit: 1000 }));
    }
  }, [dispatch, activeCompany?.id, vPagination.currentPage, pPagination.currentPage, searchTerm, fromDate, toDate, selectedCustomerId]);

  const handleFetchAllForExport = async () => {
    if (!activeCompany?.id) return { headers: [], data: [] };
    
    if (activeTab === 'PAYMENT') {
      let url = `/vouchers?page=1&limit=10000&company_id=${activeCompany.id}`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
      if (fromDate) url += `&fromDate=${fromDate}`;
      if (toDate) url += `&toDate=${toDate}`;
      if (selectedCustomerId) url += `&partyId=${selectedCustomerId}`;
      
      const response = await api.get(url);
      const allVouchers = response.data.items;
      
      const data = allVouchers.map((v: any, idx: number) => [
        (idx + 1).toString(),
        v.date ? new Date(v.date).toISOString().split('T')[0] : 'N/A',
        v.voucher_no || 'N/A',
        v.party_name || 'N/A',
        v.payment_mode || 'N/A',
        parseFloat(v.amount || '0').toLocaleString()
      ]);

      const totalAmount = allVouchers.reduce((sum: number, v: any) => sum + parseFloat(v.amount || '0'), 0);
      data.push(['', '', '', 'GRAND TOTAL', '', totalAmount.toLocaleString()]);

      return {
        headers: ['SNO', 'DATE', 'REF NO', 'CUSTOMER NAME', 'MODE', 'PAID AMOUNT'],
        data
      };
    } else {
      let url = `/invoices?page=1&limit=10000&status=pending&type=INVOICE,BOTH&company_id=${activeCompany.id}`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
      if (fromDate) url += `&fromDate=${fromDate}`;
      if (toDate) url += `&toDate=${toDate}`;
      
      const response = await api.get(url);
      const allPending = response.data.items;
      
      const data = allPending.map((inv: any, idx: number) => {
        const grand = parseFloat(inv.grand_total || '0');
        const paid = parseFloat(inv.paid_amount || '0');
        const dateStr = inv.invoice_date || inv.date;
        return [
          (idx + 1).toString(),
          dateStr ? new Date(dateStr).toISOString().split('T')[0] : 'N/A',
          inv.invoice_no?.toString() || 'N/A',
          inv.customer_name || 'N/A',
          `${calculateDays(dateStr)} Days`,
          (grand - paid).toLocaleString()
        ];
      });

      const totalPending = allPending.reduce((sum: number, inv: any) => {
        const grand = parseFloat(inv.grand_total || '0');
        const paid = parseFloat(inv.paid_amount || '0');
        return sum + (grand - paid);
      }, 0);

      data.push(['', '', '', 'GRAND TOTAL', '', totalPending.toLocaleString()]);

      return {
        headers: ['SNO', 'DATE', 'INVOICE NO', 'CUSTOMER NAME', 'AGEING', 'PENDING AMOUNT'],
        data
      };
    }
  };

  if (!mounted) return null;

  const calculateDays = (dateStr: string) => {
    if (!dateStr) return 0;
    const invDate = new Date(dateStr); const today = new Date();
    return Math.ceil(Math.abs(today.getTime() - invDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  const matchesDate = (dateStr: string) => {
    if (!dateStr) return true;
    const date = new Date(dateStr);
    if (fromDate && date < new Date(fromDate)) return false;
    if (toDate && date > new Date(toDate)) return false;
    return true;
  };

  const activeData = activeTab === 'PAYMENT' ? vouchers : pending;
  const activePagination = activeTab === 'PAYMENT' ? vPagination : pPagination;
  const totalPages = activePagination.totalPages;
  const paginatedItems = activeData;

  const totals = {
    paymentCount:     vPagination.totalItems || vouchers.length,
    totalCollected:   vAggregates?.totalCollected || 0,
    pendingCount:     pPagination.totalItems || pending.length,
    totalOutstanding: pAggregates?.totalOutstanding || 0,
    criticalOverdue:  pAggregates?.criticalOverdue || 0
  };

  const handlePrintRecord = (item: any, type: 'PAYMENT' | 'PENDING') => {
    if (type === 'PENDING') {
      router.push(`/invoices/${item.id}?print=true`);
      return;
    }
    window.open(`/logistics-print?type=voucher&id=${item.id}&print=true`, '_blank');
  };

  const handleExportPDFRecord = (item: any, type: 'PAYMENT' | 'PENDING') => {
    if (type === 'PENDING') {
      window.open(`/invoices/${item.id}`, '_blank');
      return;
    }
    window.open(`/logistics-print?type=voucher&id=${item.id}`, '_blank');
  };

  return (
    <div className="container-fluid py-4 bg-light min-vh-100 animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4 px-2 flex-wrap gap-2">
        <div><Breadcrumb items={[{ label: 'Reports', active: false }, { label: 'Payment Report', active: true }]} /><h2 className="fw-900 mt-2">Payment Report</h2><p className="text-muted small mb-0">Track collection history and monitor outstanding dues.</p></div>
        <div className="d-flex flex-wrap align-items-center gap-3">
          <ReportActions setFromDate={setFromDate} setToDate={setToDate} title={activeTab === 'PAYMENT' ? "Collection History" : "Outstanding Dues"} onFetchAll={handleFetchAllForExport} />
          <button className="btn btn-white shadow-sm border border-light px-3 d-flex align-items-center gap-2" style={{ height: '36px', borderRadius: '18px' }} onClick={() => { (dispatch as any)(fetchVouchers({ company_id: activeCompany?.id })); (dispatch as any)(fetchPendingPayments({ company_id: activeCompany?.id })); }}><i className="bi bi-arrow-repeat fw-bold" style={{ color: 'var(--accent-color)' }}></i>
            <span className="small fw-800 text-muted">Refresh</span>
          </button>
        </div>
      </div>

      {/* Audit Summary Cards */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Payments Received', val: totals.paymentCount, icon: 'shield-check', color: 'primary' },
          { label: 'Total Collected', val: `₹${totals.totalCollected.toLocaleString()}`, icon: 'bank', color: 'success' },
          { label: 'Total Outstanding', val: `₹${totals.totalOutstanding.toLocaleString()}`, icon: 'exclamation-diamond', color: 'danger' },
          { label: 'Critical (>90D)', val: totals.criticalOverdue, icon: 'alarm', color: 'warning' }
        ].map((item, i) => (
          <div key={i} className="col-md-3">
            <div className="card shadow-sm border-0 rounded-4 bg-white p-3 h-100 animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="d-flex align-items-center gap-3">
                <div className={`rounded-circle bg-opacity-10 p-2 d-flex align-items-center justify-content-center`} style={{ width: '42px', height: '42px' }}>
                  <i className={`bi bi-${item.icon} text-${item.color} fs-5`}></i>
                </div>
                 <div>
                   <p className="text-muted tiny mb-0 fw-bold text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>{item.label}</p>
                   <h4 className="fw-900 mb-0">{item.val}</h4>
                 </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="d-flex gap-2 mb-3">
        <button className={`btn px-4 py-2 fw-bold small rounded-pill ${activeTab === 'PAYMENT' ? 'btn-primary shadow-sm' : 'bg-white text-muted border'}`} onClick={() => setActiveTab('PAYMENT')}>Payment History</button>
        <button className={`btn px-4 py-2 fw-bold small rounded-pill ${activeTab === 'PENDING' ? 'btn-primary shadow-sm' : 'bg-white text-muted border'}`} onClick={() => setActiveTab('PENDING')}>Pending Payments (Ageing)</button>
      </div>

      <div className="card shadow-sm border-0 mb-4 rounded-4 overflow-hidden">
        <div className="card-body p-3">
          <div className="filter-bar-row">
            <div className="filter-item-search" style={{ maxWidth: '260px' }}>
              <div className="search-group" style={{width:"260px"}}>
                <span className="input-group-text">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control search-bar"
                  placeholder="Search customer name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="filter-item-select" style={{ minWidth: '220px' }}>
              <select 
                className="form-select search-bar"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                style={{width:"340px"}}
              >
                <option value=""> All Customers </option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.company || c.name}</option>
                ))}
              </select>
            </div>
            
            <div className="date-filter-group ms-auto">
              <input type="date" className="text-muted" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              <span className="text-muted small fw-bold mx-1">TO</span>
              <input type="date" className="text-muted" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
        <div className="card-body p-0">
          {(vLoading || pLoading) ? (
            <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '400px' }}>
              <Loader text="Compiling Records..." />
            </div>
          ) : (
            <>
            <div className="table-responsive" style={{ minHeight: '400px', paddingBottom: '80px' }}>
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light">
                  <tr className="text-capitalize small fw-bold text-muted">
                    <th className="px-4 py-3 border-0">Sno</th>
                    <th className="py-3 border-0">Date</th>
                    <th className="py-3 border-0 text-center">{activeTab === 'PAYMENT' ? 'Ref No' : 'Invoice No'}</th>
                    <th className="py-3 border-0">Customer Name</th>
                    <th className="py-3 border-0 text-center">{activeTab === 'PAYMENT' ? 'Mode' : 'Ageing'}</th>
                    <th className="py-3 border-0 text-end px-4">{activeTab === 'PAYMENT' ? 'Paid Amount' : 'Pending Amount'}</th>
                    <th className="py-3 border-0 text-center" style={{ width: '120px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((item: any, idx) => (
                    <tr key={item.id} className="border-bottom border-light">
                      <td className="px-4 small text-muted ">
                        {(activePagination.currentPage - 1) * activePagination.itemsPerPage + idx + 1}
                      </td>
                      <td className="small text-muted">{item.date}</td>
                      <td className="text-center small fw-bold text-dark ">{activeTab === 'PAYMENT' ? item.voucherNo : item.invoiceNumber}</td>
                      <td className="fw-800 text-dark small text-capitalize">{activeTab === 'PAYMENT' ? item.partyName : item.customerName}</td>
                      <td className="text-center">{activeTab === 'PAYMENT' ? <span className="badge bg-light text-dark shadow-sm border-0 px-3">{item.paymentMode}</span> : <span className={`badge rounded-pill fw-bold px-3 ${calculateDays(item.date) > 60 ? 'bg-danger' : calculateDays(item.date) > 30 ? 'bg-warning text-dark' : 'bg-success'}`}>{calculateDays(item.date)} Days</span>}</td>
                      <td className={`text-end fw-900 px-4  ${activeTab === 'PAYMENT' ? 'text-success' : 'text-danger'}`}>₹{(activeTab === 'PAYMENT' ? item.amount : (item.grandTotal - (item.paidAmount || 0))).toLocaleString()}</td>
                      <td className="text-center">
                        <div className="d-flex justify-content-center gap-1">
                          <Link href={activeTab === 'PAYMENT' ? `/vouchers/${item.id}/edit?readonly=true` : `/invoices/${item.id}?readonly=true`} className="btn-action-view">
                            <i className="bi bi-eye-fill"></i>
                          </Link>
                          <div className="dropdown">
                            <button className="btn btn-sm btn-outline-secondary border-0 p-0" data-bs-toggle="dropdown" style={{ width: '32px', height: '32px' }}>
                              <i className="bi bi-three-dots-vertical fs-5"></i>
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 py-2">
                              <li><button className="dropdown-item d-flex align-items-center gap-2 py-2 small" onClick={() => handlePrintRecord(item, activeTab)}><i className="bi bi-printer text-primary"></i> Quick Print</button></li>
                              <li><button className="dropdown-item d-flex align-items-center gap-2 py-2 small" onClick={() => handleExportPDFRecord(item, activeTab)}><i className="bi bi-file-earmark-pdf text-danger"></i> Export PDF</button></li>
                            </ul>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-light-soft fw-900 border-top border-dark">
                    <td colSpan={5} className="text-center py-3 uppercase" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>Audit Summary (Current View Balance)</td>
                    <td className={`text-end py-3 px-4 ${activeTab === 'PAYMENT' ? 'text-success' : 'text-danger'}`}>₹{(activeTab === 'PAYMENT' ? totals.totalCollected : totals.totalOutstanding).toLocaleString()}</td>
                    <td></td>
                  </tr>
                  {activeData.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-5 text-muted small">No payment records found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="p-3 border-top bg-light d-flex justify-content-between align-items-center px-4">
                <span className="text-muted small">Showing {(activePagination.currentPage - 1) * activePagination.itemsPerPage + 1} to {Math.min(activePagination.currentPage * activePagination.itemsPerPage, activePagination.totalItems)} of {activePagination.totalItems} entries</span>
                <PaginationComponent 
                  currentPage={activePagination.currentPage} 
                  totalPages={totalPages} 
                  onPageChange={(page) => dispatch((activeTab === 'PAYMENT' ? setVoucherPage : setPendingPaymentPage)(page))} 
                />

              </div>
            )}
            </>
          )}
        </div>
      </div>
      <style jsx>{` .fw-900 { font-weight: 900; } .bg-light-soft { background-color: #f7f9fc; } .table-responsive { padding-bottom: 80px; } `}</style>
    </div>
  );
};

export default PaymentReportPage;
