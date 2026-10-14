'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import ExportExcel from '@/components/shared/ExportExcel';
import PaginationComponent from '@/components/shared/Pagination';

import { RootState } from '@/redux/store';
import { setChallanFilters, setChallanPage, fetchChallans, deleteChallan, setChallanSorting } from '@/redux/features/challanSlice';
import { fetchCustomers } from '@/redux/features/customerSlice';
import { fetchVendors } from '@/redux/features/vendorSlice';
import SearchableSelect from '@/components/shared/SearchableSelect';
import Breadcrumb from '@/components/Breadcrumb';
import IndustrialDocument from '@/components/shared/IndustrialDocument';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { checkActionPermission } from '@/config/permissions';
import autoTable from 'jspdf-autotable';
import Loader from '@/components/Loader';
import ConfirmationModal from '@/components/ConfirmationModal';
import PartyTypeToggle from '@/components/shared/PartyTypeToggle';
import SortableHeader from '@/components/shared/SortableHeader';

const ChallanPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items, filters, pagination, loading, sorting } = useSelector((state: RootState) => state.challan);
  const { items: customers } = useSelector((state: RootState) => state.customers);
  const { items: vendors } = useSelector((state: RootState) => state.vendors);

  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
  const [mounted, setMounted] = useState(false);
  const isInitializedRef = useRef(false);

  // State and Hooks (Must be called before any early returns)
  const [downloadingItem, setDownloadingItem] = useState<any>(null);
  const downloadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (downloadingItem && downloadRef.current) {
      const captureAndDownload = async () => {
        await new Promise(resolve => setTimeout(resolve, 800));
        if (downloadRef.current) {
          const canvas = await html2canvas(downloadRef.current, { scale: 2, useCORS: true, logging: false });
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const imgProps = pdf.getImageProperties(imgData);
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save(`CHALLAN_${downloadingItem.challanNo || downloadingItem.id}.pdf`);
          setDownloadingItem(null);
        }
      };
      captureAndDownload();
    }
  }, [downloadingItem]);

  // Fetch customers & vendors if not yet in state
  useEffect(() => {
    if (activeCompany?.id) {
      if (customers.length === 0) {
        (dispatch as any)(fetchCustomers({ company_id: activeCompany.id, limit: 1000 }));
      }
      if (vendors.length === 0) {
        (dispatch as any)(fetchVendors({ company_id: activeCompany.id, limit: 1000 }));
      }
    }
  }, [dispatch, activeCompany?.id, customers.length, vendors.length]);

  const effectivePartyType = filters.partyType || 'customer';
  const isVendor = effectivePartyType === 'vendor';

  const partyOptions = useMemo(() => {
    if (effectivePartyType === 'vendor') {
      const sorted = [...vendors].sort((a, b) =>
        (a.name || a.company || '').localeCompare(b.name || b.company || '')
      );
      return [
        { value: 'all', label: 'All Vendors', displayLabel: 'All Vendors' },
        ...sorted.map(v => ({
          value: String(v.id),
          label: v.name || v.company || `Vendor #${v.id}`,
          displayLabel: v.name || v.company || `Vendor #${v.id}`
        }))
      ];
    } else if (effectivePartyType === 'customer') {
      const sorted = [...customers].sort((a, b) =>
        (a.company || a.name || '').localeCompare(b.company || b.name || '')
      );
      return [
        { value: 'all', label: 'All Customers', displayLabel: 'All Customers' },
        ...sorted.map(c => ({
          value: String(c.id),
          label: c.company || c.name || `Customer #${c.id}`,
          displayLabel: c.company || c.name || `Customer #${c.id}`
        }))
      ];
    } else {
      const sortedCustomers = [...customers].sort((a, b) =>
        (a.company || a.name || '').localeCompare(b.company || b.name || '')
      );
      const sortedVendors = [...vendors].sort((a, b) =>
        (a.name || a.company || '').localeCompare(b.name || b.company || '')
      );
      return [
        { value: 'all', label: 'All Parties', displayLabel: 'All Parties' },
        ...sortedCustomers.map(c => ({
          value: String(c.id),
          label: `${c.company || c.name} (Customer)`,
          displayLabel: c.company || c.name
        })),
        ...sortedVendors.map(v => ({
          value: String(v.id),
          label: `${v.name || v.company} (Vendor)`,
          displayLabel: v.name || v.company
        }))
      ];
    }
  }, [effectivePartyType, vendors, customers]);

  // 1. Initial Load: Read all query parameters from URL and populate Redux state
  useEffect(() => {
    setMounted(true);

    const qPartyType = searchParams.get('partyType') || searchParams.get('type');
    const qSearch = searchParams.get('search');
    const qCustomerId = searchParams.get('customerId') || searchParams.get('customer_id') || searchParams.get('partyId');
    const qStatus = searchParams.get('status');
    const qBillType = searchParams.get('bill_type');
    const qFromDate = searchParams.get('fromDate');
    const qToDate = searchParams.get('toDate');
    const qPage = searchParams.get('page');
    const qSortBy = searchParams.get('sortBy');
    const qSortOrder = searchParams.get('sortOrder') as 'asc' | 'desc';

    const initialFilters: any = {};
    if (qPartyType) initialFilters.partyType = qPartyType;
    if (qSearch !== null && qSearch !== '') initialFilters.search = qSearch;
    if (qCustomerId !== null && qCustomerId !== '' && qCustomerId !== 'all') initialFilters.customerId = qCustomerId;
    if (qStatus !== null && qStatus !== '') initialFilters.status = qStatus;
    if (qBillType !== null && qBillType !== '') initialFilters.bill_type = qBillType;
    if (qFromDate !== null && qFromDate !== '') initialFilters.fromDate = qFromDate;
    if (qToDate !== null && qToDate !== '') initialFilters.toDate = qToDate;

    if (Object.keys(initialFilters).length > 0) {
      dispatch(setChallanFilters(initialFilters));
    }

    if (qPage && !isNaN(parseInt(qPage)) && parseInt(qPage) > 1) {
      dispatch(setChallanPage(parseInt(qPage)));
    }

    if (qSortBy) {
      dispatch(setChallanSorting({
        sortBy: qSortBy,
        sortOrder: qSortOrder === 'asc' ? 'asc' : 'desc'
      }));
    }

    isInitializedRef.current = true;
  }, [dispatch]);

  // 2. State to URL Sync
  useEffect(() => {
    if (!isInitializedRef.current || !mounted) return;

    const handler = setTimeout(() => {
      const params = new URLSearchParams();

      if (filters.partyType && filters.partyType !== 'customer') {
        params.set('partyType', filters.partyType);
      }
      if (filters.search && filters.search.trim()) {
        params.set('search', filters.search.trim());
      }
      if (filters.customerId && filters.customerId !== 'all') {
        params.set('customerId', filters.customerId);
      }
      if (filters.status && filters.status !== 'all') {
        params.set('status', filters.status);
      }
      if (filters.bill_type && filters.bill_type !== 'all') {
        params.set('bill_type', filters.bill_type);
      }
      if (filters.fromDate) {
        params.set('fromDate', filters.fromDate);
      }
      if (filters.toDate) {
        params.set('toDate', filters.toDate);
      }

      if (pagination.currentPage > 1) {
        params.set('page', String(pagination.currentPage));
      }

      if (sorting?.sortBy && sorting.sortBy !== 'created_at' && sorting.sortBy !== 'id') {
        params.set('sortBy', sorting.sortBy);
      }
      if (sorting?.sortOrder && sorting.sortOrder !== 'desc') {
        params.set('sortOrder', sorting.sortOrder);
      }

      const currentQs = searchParams.toString();
      const newQs = params.toString();

      if (currentQs !== newQs) {
        router.replace(newQs ? `${pathname}?${newQs}` : pathname, { scroll: false });
      }
    }, 250);

    return () => clearTimeout(handler);
  }, [
    filters.search,
    filters.customerId,
    filters.status,
    filters.partyType,
    filters.bill_type,
    filters.fromDate,
    filters.toDate,
    pagination.currentPage,
    sorting?.sortBy,
    sorting?.sortOrder,
    searchParams,
    pathname,
    router,
    mounted
  ]);

  useEffect(() => {
    (dispatch as any)(fetchChallans({
      company_id: activeCompany?.id,
      page: pagination.currentPage,
      limit: pagination.itemsPerPage,
      search: filters.search,
      partyType: filters.partyType !== 'all' ? filters.partyType : undefined,
      customerId: filters.customerId !== 'all' ? filters.customerId : undefined,
      status: filters.status !== 'all' ? filters.status : undefined,
      bill_type: filters.bill_type !== 'all' ? filters.bill_type : undefined,
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      sortBy: sorting.sortBy,
      sortOrder: sorting.sortOrder
    }));
  }, [
    dispatch,
    activeCompany?.id,
    pagination.currentPage,
    pagination.itemsPerPage,
    filters.search,
    filters.partyType,
    filters.customerId,
    filters.status,
    filters.bill_type,
    filters.fromDate,
    filters.toDate,
    sorting.sortBy,
    sorting.sortOrder
  ]);

  if (!mounted) return <Loader text="Initializing..." />;

  const handleSort = (field: string) => {
    const newOrder = sorting.sortBy === field && sorting.sortOrder === 'asc' ? 'desc' : 'asc';
    dispatch(setChallanSorting({ sortBy: field, sortOrder: newOrder }));
  };

  // Filter logic
  const totalPages = pagination.totalPages;
  const paginatedItems = items;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'dispatched': return <span className="badge bg-primary-soft text-primary px-3 py-2 rounded-pill fw-700 x-small">DISPATCHED</span>;
      case 'received': return <span className="badge bg-success-soft text-success px-3 py-2 rounded-pill fw-700 x-small">RECEIVED</span>;
      case 'draft': return <span className="badge bg-secondary-soft text-muted px-3 py-2 rounded-pill fw-700 x-small">DRAFT</span>;
      case 'cancelled': return <span className="badge bg-danger-soft text-danger px-3 py-2 rounded-pill fw-700 x-small">CANCELLED</span>;
      default: return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'delivery': return <i className="bi bi-box-seam text-primary me-2"></i>;
      case 'returnable': return <i className="bi bi-arrow-left-right text-accent me-2"></i>;
      case 'job_work': return <i className="bi bi-tools text-dark me-2"></i>;
      default: return null;
    }
  };

  const handlePrintChallanRecord = (challan: any) => {
    router.push(`/logistics-print?type=challan&id=${challan.id}&print=true`);
  };

  const handleExportPDFChallanRecord = (challan: any) => {
    setDownloadingItem(challan);
  };

  const handleDeleteParams = (id: string) => {
    setDeleteModal({ isOpen: true, id });
  };

  const confirmDelete = () => {
    if (deleteModal.id) {
      (dispatch as any)(deleteChallan(deleteModal.id));
    }
  };

  return (
    <div className="container-fluid py-4 min-vh-100 animate-fade-in px-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <Breadcrumb
            items={[
              { label: 'Challan System', active: true }
            ]}
          />
          <h2 className="fw-900 tracking-tight text-dark mb-1 mt-2">Challan Management</h2>
          <p className="text-muted small mb-0">Track material movement and delivery challans across industrial sites.</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <ExportExcel
            data={items}
            fileName="Challan_Records"
            headers={{ challanNo: 'Challan No', date: 'Date', partyName: 'Party Name', type: 'Type', status: 'Status' }}
            buttonText="Export List"
          />
          {checkActionPermission(user, 'mod_challan', 'create') && (
            <Link href="/challan/new" className="btn btn-primary btn-page-action px-4">
              <i className="bi bi-plus-lg"></i>
              <span>Add Challan</span>
            </Link>
          )}
        </div>
      </div>

      <div className="card filter-card" style={{ overflow: 'visible', position: 'relative', zIndex: 100 }}>
        <div className="card-body p-3" style={{ overflow: 'visible' }}>
          <div className="filter-bar-row d-flex flex-wrap gap-2 align-items-center">
            {/* Party Type Toggle */}
            <div className="filter-item-select" style={{ minWidth: '150px' }}>
              <PartyTypeToggle
                partyType={(filters.partyType as any) || 'customer'}
                setPartyType={(val) => dispatch(setChallanFilters({ partyType: val, customerId: 'all' }))}
              />
            </div>
            
            {/* Separate Customer Dropdown List with Search Input */}
            <div className="filter-item-select flex-grow-1 challan-customer-filter" style={{ minWidth: '240px' }}>
              <SearchableSelect
                options={partyOptions}
                value={filters.customerId || 'all'}
                onChange={(val) => dispatch(setChallanFilters({ customerId: String(val) }))}
                placeholder={isVendor ? 'Select Vendor' : 'Select Customer'}
                className="w-100"
              />
            </div>

            {/* General Search Input */}
            <div className="filter-item-search" style={{ minWidth: '220px' }}>
              <div className="search-group">
                <span className="input-group-text">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control search-bar"
                  placeholder="Search by challan no, vehicle..."
                  value={filters.search}
                  onChange={(e) => dispatch(setChallanFilters({ search: e.target.value }))}
                />
              </div>
            </div>

            {/* Bill Type Filter */}
            <div className="filter-item-select" style={{ minWidth: '150px' }}>
              <select
                className="form-select search-bar"
                value={filters.bill_type || 'all'}
                onChange={(e) => dispatch(setChallanFilters({ bill_type: e.target.value }))}
              >
                <option value="all">All Bill Types</option>
                <option value="With Process">With Process (WP)</option>
                <option value="Without Process">Without Process (WOP)</option>
                <option value="Both">Both (WP + WOP)</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="filter-item-select" style={{ minWidth: '150px' }}>
              <select
                className="form-select search-bar"
                value={filters.status || 'all'}
                onChange={(e) => dispatch(setChallanFilters({ status: e.target.value as any }))}
              >
                <option value="all">All Status</option>
                <option value="dispatched">Dispatched</option>
                <option value="received">Received</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Date Filter Group */}
            <div className="date-filter-group">
              <input
                type="date"
                className="text-muted"
                value={filters.fromDate}
                onChange={(e) => dispatch(setChallanFilters({ fromDate: e.target.value }))}
              />
              <span className="text-muted small fw-bold mx-1">TO</span>
              <input
                type="date"
                className="text-muted"
                value={filters.toDate}
                onChange={(e) => dispatch(setChallanFilters({ toDate: e.target.value }))}
              />
            </div>

            {/* Clear Filter Button */}
            {((filters.customerId && filters.customerId !== 'all') || filters.search || (filters.status && filters.status !== 'all') || (filters.bill_type && filters.bill_type !== 'all') || filters.fromDate || filters.toDate) && (
              <button
                type="button"
                className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1 shadow-none"
                style={{ height: '38px', borderRadius: '8px', fontSize: '0.78rem' }}
                onClick={() => dispatch(setChallanFilters({ search: '', status: 'all', bill_type: 'all', fromDate: '', toDate: '', customerId: 'all' }))}
                title="Reset all filters"
              >
                <i className="bi bi-x-circle"></i>
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white" style={{ position: 'relative', zIndex: 1 }}>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr className="bg-light">
                  <th className="px-4 py-3 border-0 small fw-bold text-muted">Sno</th>
                  <SortableHeader field="challan_no" label="Challan No" currentSortBy={sorting.sortBy} currentSortOrder={sorting.sortOrder} onSort={handleSort} className="py-3 border-0 small fw-bold text-muted" />
                  <SortableHeader field="date" label="Date" currentSortBy={sorting.sortBy} currentSortOrder={sorting.sortOrder} onSort={handleSort} className="py-3 border-0 small fw-bold text-muted" />
                  <SortableHeader field="party_name" label="Party / Client" currentSortBy={sorting.sortBy} currentSortOrder={sorting.sortOrder} onSort={handleSort} className="py-3 border-0 small fw-bold text-muted" />
                  <th className="py-3 border-0 small fw-bold text-muted">Items</th>
                  <SortableHeader field="status" label="Status" currentSortBy={sorting.sortBy} currentSortOrder={sorting.sortOrder} onSort={handleSort} className="py-3 border-0 small fw-bold text-muted text-center" />
                  <th className="py-3 border-0 small fw-bold text-muted text-center px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7}>
                      <Loader text="Fetching Challan Records..." />
                    </td>
                  </tr>
                ) : (
                  <>
                    {paginatedItems.map((challan, index) => (
                      <tr key={challan.id} onClick={() => router.push(`/challan/${challan.id}`)} style={{ cursor: 'pointer' }} className="table-row-hover">
                        <td className="px-4 text-nowrap text-muted small">{(pagination.currentPage - 1) * pagination.itemsPerPage + index + 1}</td>
                        <td className="text-nowrap fw-bold text-dark">
                          <Link href={`/challan/${challan.id}`} className="text-dark fw-bold text-decoration-none hover-underline" onClick={(e) => e.stopPropagation()}>{challan.challanNo}</Link>
                          <div className="d-flex align-items-center gap-1">
                            <span className="text-muted x-small fw-normal text-capitalize">{challan.type.replace('_', ' ')}</span>
                            {challan.bill_type && (
                              <span className={`x-small fw-bold ${(challan.bill_type === 'Both' || (challan as any).billType === 'Both') ? 'text-primary' : ((challan.bill_type === 'Without Process' || (challan as any).billType === 'Without Process') ? 'text-accent' : 'text-success')}`} style={{ fontSize: '9px' }}>
                                • {(challan.bill_type === 'Both' || (challan as any).billType === 'Both') ? 'BOTH' : ((challan.bill_type === 'Without Process' || (challan as any).billType === 'Without Process') ? 'WOP' : 'WP')}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="text-nowrap text-muted small">{new Date(challan.date).toLocaleDateString()}</td>
                        <td className="text-nowrap text-muted small">
                          <div className="fw-bold text-dark">{challan.partyName}</div>
                          <div className="x-small text-capitalize">{challan.partyType}</div>
                        </td>
                        <td className="text-nowrap text-muted small">
                          {challan.items[0]?.description}
                          {challan.items.length > 1 && <span className="ms-1 text-primary x-small fw-bold">+{challan.items.length - 1} more</span>}
                        </td>
                        <td className="text-center">
                          <span className="badge bg-light text-dark border-0 shadow-sm x-small fw-bold text-capitalize">
                            {challan.status}
                          </span>
                        </td>
                        <td className="text-center px-4 text-nowrap">
                          <div className="d-flex justify-content-center gap-1">
                            <Link href={`/challan/${challan.id}`} className="btn-action-view" title="View Profile" onClick={(e) => e.stopPropagation()}>
                              <i className="bi bi-eye-fill"></i>
                            </Link>
                            {checkActionPermission(user, 'mod_challan', 'edit') && (
                              <Link href={`/challan/${challan.id}?edit=true`} className="btn-action-edit" title="Edit Record" onClick={(e) => e.stopPropagation()}>
                                <i className="bi bi-pencil-fill"></i>
                              </Link>
                            )}

                            <div className="dropdown">
                              <button
                                className="btn btn-sm btn-outline-secondary border-0 text-muted p-0 ms-1 d-flex align-items-center justify-content-center"
                                type="button"
                                id={`actions-${challan.id}`}
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                                onClick={(e) => e.stopPropagation()}
                                style={{ width: '32px', height: '32px', borderRadius: '8px' }}
                              >
                                <i className="bi bi-three-dots-vertical fs-5"></i>
                              </button>
                              <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3 py-2" aria-labelledby={`actions-${challan.id}`}>
                                <li>
                                  <button className="dropdown-item d-flex align-items-center gap-2 py-2" type="button" onClick={(e) => { e.stopPropagation(); handlePrintChallanRecord(challan); }}>
                                    <i className="bi bi-printer text-primary"></i>
                                    <span className="small fw-semibold">Quick Print</span>
                                  </button>
                                </li>
                                <li>
                                  <button className="dropdown-item d-flex align-items-center gap-2 py-2" type="button" onClick={(e) => { e.stopPropagation(); handleExportPDFChallanRecord(challan); }}>
                                    <i className="bi bi-file-earmark-pdf text-danger"></i>
                                    <span className="small fw-semibold">Export PDF</span>
                                  </button>
                                </li>
                                {checkActionPermission(user, 'mod_challan', 'delete') && (
                                  <>
                                    <li><hr className="dropdown-divider opacity-50" /></li>
                                    <li>
                                      <button
                                        className="dropdown-item d-flex align-items-center gap-2 py-2 text-danger"
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); handleDeleteParams(challan.id); }}
                                      >
                                        <i className="bi bi-trash3"></i>
                                        <span className="small fw-semibold">Remove Record</span>
                                      </button>
                                    </li>
                                  </>
                                )}
                              </ul>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {items.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-5 text-muted">
                          No challans found matching your filters.
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-4 py-3 border-top d-flex align-items-center justify-content-between">
              <div className="text-muted small">
                Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} to {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems} entries
              </div>
              <PaginationComponent
                currentPage={pagination.currentPage}
                totalPages={totalPages}
                onPageChange={(page) => dispatch(setChallanPage(page))}
              />

            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Delete Challan Record"
        message="Are you sure you want to remove this challan? This action may affect linked stock levels and movement history. This cannot be undone."
      />

      <style jsx>{`
        .table-responsive {
          min-height: 400px;
          padding-bottom: 80px;
        }
        @media print {
          :global(body *) { visibility: hidden; }
          .table-responsive, .table-responsive * { visibility: visible; }
          .table-responsive { position: absolute; left: 0; top: 0; width: 100%; }
          .table th:last-child, .table td:last-child { display: none !important; }
          .table { border: 1px solid #dee2e6 !important; width: 100% !important; }
          :global(.sidebar), :global(.header), :global(.breadcrumb), .card-header, .pagination, .border-bottom { display: none !important; }
        }
      `}</style>
      {/* Hidden Download Generator */}
      {downloadingItem && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <div ref={downloadRef}>
            <IndustrialDocument data={downloadingItem} type="challan" company={activeCompany!} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChallanPage;
