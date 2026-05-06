'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { fetchInwards, setInwardPage } from '@/redux/features/inwardSlice';
import Link from 'next/link';
import Loader from '@/components/Loader';
import ReportActions from '@/components/ReportActions';
import Breadcrumb from '@/components/Breadcrumb';
import PaginationComponent from '@/components/shared/Pagination';
import api from '@/lib/axios';



const InwardReportPage = () => {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const dispatch = useDispatch();
  const { company: activeCompany } = useSelector((state: RootState) => state.auth);
  // statusCounts comes from backend — accurate across ALL pages, not just current page
  const { items, pagination, loading, statusCounts } = useSelector((state: RootState) => state.inward);

  useEffect(() => {
    setMounted(true);
    if (activeCompany?.id) {
      (dispatch as any)(fetchInwards({
        company_id: activeCompany.id,
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        search,
        fromDate,
        toDate
      }));
    }
  }, [dispatch, activeCompany?.id, pagination.currentPage, pagination.itemsPerPage, search, fromDate, toDate]);

  const handleFetchAllForExport = async () => {
    if (!activeCompany?.id) return { headers: [], data: [] };
    
    let url = `/inward?page=1&limit=10000&company_id=${activeCompany.id}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (fromDate) url += `&fromDate=${fromDate}`;
    if (toDate) url += `&toDate=${toDate}`;
    
    const response = await api.get(url);
    const allItems = response.data.items;
    
    const data = allItems.map((item: any, idx: number) => [
      (idx + 1).toString(),
      item.date ? new Date(item.date).toISOString().split('T')[0] : 'N/A',
      item.dc_no || item.challan_no || '-',
      item.customer_name || item.vendor_name || 'N/A',
      item.address || '-',
      item.status || 'pending'
    ]);

    data.push(['', '', '', 'TOTAL RECEIPTS', '', allItems.length.toString()]);

    return {
      headers: ['SNO', 'DATE', 'DC NO', 'CUSTOMER NAME', 'ADDRESS', 'STATUS'],
      data
    };
  };

  if (!mounted) return null;

  const totalPages = pagination.totalPages;
  const paginatedItems = items;

  // All counts come from backend aggregation — accurate across all pages
  const totals = {
    count:     pagination.totalItems || 0,
    completed: statusCounts.completed,
    pending:   statusCounts.pending,
    parties:   statusCounts.activeParties
  };

  // Use IndustrialDocument format — same as inward detail page
  const handlePrintRecord = (item: any) => {
    window.open(`/logistics-print?type=inward&id=${item.id}&print=true`, '_blank');
  };

  const handleExportPDFRecord = (item: any) => {
    window.open(`/logistics-print?type=inward&id=${item.id}`, '_blank');
  };

  return (
    <div className="container-fluid py-4 animate-fade-in bg-light min-vh-100">
      <div className="d-flex justify-content-between align-items-center mb-4 px-2 flex-wrap gap-2">
        <div>
          <Breadcrumb items={[{ label: 'Intelligence Reports', active: false }, { label: 'Inward Report', active: true }]} />
          <h2 className="fw-900 mb-1 text-dark tracking-tight mt-2">Inward Report</h2>
          <p className="text-muted small mb-0 font-weight-500">History of all incoming material receipts and industrial logistics entries.</p>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-2">
          <ReportActions setFromDate={setFromDate} setToDate={setToDate} title="Inward History Report" onFetchAll={handleFetchAllForExport} />
          <button
            className="btn btn-white shadow-sm border border-light px-3 d-flex align-items-center gap-2"
            style={{ height: '36px', borderRadius: '18px' }}
            onClick={() => (dispatch as any)(fetchInwards({ company_id: activeCompany?.id }))}
          >
            <i className="bi bi-arrow-repeat text-primary fw-bold"></i>
            <span className="small fw-800 text-muted">Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Card */}
      <div className="card border-0 shadow-sm mb-4 overflow-hidden rounded-4">
        <div className="card-body p-3">
          <div className="filter-bar-row">
            <div className="filter-item-search">
              <div className="search-group">
                <span className="input-group-text"><i className="bi bi-search"></i></span>
                <input
                  type="text"
                  className="form-control search-bar"
                  placeholder="Search customer or DC..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="date-filter-group">
              <input type="date" className="text-muted" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              <span className="text-muted small fw-bold mx-1">TO</span>
              <input type="date" className="text-muted" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards — all counts from backend (all pages) */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total Receipts',  val: totals.count,     icon: 'box-seam',      color: 'primary' },
          { label: 'Completed',       val: totals.completed, icon: 'check-circle',  color: 'success' },
          { label: 'Pending Entries', val: totals.pending,   icon: 'clock-history', color: 'warning' },
          { label: 'Active Parties',  val: totals.parties,   icon: 'people',        color: 'info' }
        ].map((item, i) => (
          <div key={i} className="col-md-3">
            <div className="card shadow-sm border-0 rounded-4 bg-white p-3 h-100 animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="d-flex align-items-center gap-3">
                <div className="rounded-circle bg-opacity-10 p-2 d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}>
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

      <div className="card border-0 shadow-sm overflow-hidden rounded-4">
        <div className="card-body p-0">
          {loading ? (
            <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '400px' }}>
              <Loader text="Compiling Data..." />
            </div>
          ) : (
            <>
            <div className="table-responsive" style={{ minHeight: '400px', paddingBottom: '80px' }}>
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light">
                  <tr className="text-capitalize small fw-bold text-muted">
                    <th className="px-4 py-3 border-0">Sno</th>
                    <th className="py-3 border-0">Date</th>
                    <th className="py-3 border-0">Dc No</th>
                    <th className="py-3 border-0">Customer Name</th>
                    <th className="py-3 border-0">Address</th>
                    <th className="py-3 border-0">Status</th>
                    <th className="py-3 border-0 text-center px-4" style={{ width: '120px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((item, index) => (
                    <tr key={item.id} className="border-bottom border-light">
                      <td className="px-4 small text-muted">
                        {(pagination.currentPage - 1) * pagination.itemsPerPage + index + 1}
                      </td>
                      <td className="small text-muted">{item.date}</td>
                      <td className="text-dark fw-bold">{item.dcNo || item.challanNo || '-'}</td>
                      <td className="text-dark fw-800 text-capitalize" style={{ fontSize: '0.85rem' }}>{item.customerName || item.vendorName}</td>
                      <td className="text-muted small text-truncate" style={{ maxWidth: '200px' }}>{item.address || '-'}</td>
                      <td>
                        <span className={`badge rounded-pill px-3 py-1 small text-capitalize ${item.status === 'completed' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'}`}>
                          {item.status || 'pending'}
                        </span>
                      </td>
                      <td className="text-center px-4">
                        <div className="d-flex justify-content-center align-items-center gap-1">
                          <Link href={`/inward/${item.id}/edit?readonly=true`} className="btn-action-view" title="View Detail">
                            <i className="bi bi-eye-fill"></i>
                          </Link>
                          <div className="dropdown">
                            <button
                              className="btn btn-sm btn-outline-secondary border-0 text-muted p-0 ms-1 d-flex align-items-center justify-content-center"
                              type="button"
                              data-bs-toggle="dropdown"
                              style={{ width: '32px', height: '32px' }}
                            >
                              <i className="bi bi-three-dots-vertical fs-5"></i>
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3 py-2">
                              <li>
                                <button className="dropdown-item d-flex align-items-center gap-2 py-2 small" onClick={() => handlePrintRecord(item)}>
                                  <i className="bi bi-printer text-primary"></i> Quick Print
                                </button>
                              </li>
                              <li>
                                <button className="dropdown-item d-flex align-items-center gap-2 py-2 small" onClick={() => handleExportPDFRecord(item)}>
                                  <i className="bi bi-file-earmark-pdf text-danger"></i> Export PDF
                                </button>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-light-soft fw-900 border-top border-dark">
                    <td colSpan={5} className="text-center py-3">Audit Summary (All Records)</td>
                    <td colSpan={2} className="text-center py-3">{pagination.totalItems || items.length} Inwards Total</td>
                  </tr>
                  {items.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-5 text-muted small">No inward records found matching filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="p-3 border-top bg-light d-flex justify-content-between align-items-center px-4">
                <span className="text-muted small">
                  Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} to {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems} entries
                </span>
                <PaginationComponent
                  currentPage={pagination.currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => dispatch(setInwardPage(page))}
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

export default InwardReportPage;
