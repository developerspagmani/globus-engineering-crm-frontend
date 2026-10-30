'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { fetchOutwards, deleteOutward, setOutwardFilters, setOutwardPage, setOutwardSorting, resetOutwardState } from '@/redux/features/outwardSlice';
import { fetchCustomers } from '@/redux/features/customerSlice';
import { fetchVendors } from '@/redux/features/vendorSlice';
import SearchableSelect from '@/components/shared/SearchableSelect';
import Breadcrumb from '@/components/Breadcrumb';
import ModuleGuard from '@/components/ModuleGuard';
import Loader from '@/components/Loader';
import ConfirmationModal from '@/components/ConfirmationModal';
import { checkActionPermission } from '@/config/permissions';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import ExportExcel from '@/components/shared/ExportExcel';
import PaginationComponent from '@/components/shared/Pagination';
import SortableHeader from '@/components/shared/SortableHeader';
import IndustrialDocument from '@/components/shared/IndustrialDocument';
import VendorChallanFormatA from '@/components/shared/VendorChallanFormatA';
import html2canvas from 'html2canvas';


export default function OutwardListPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const partyTypeFilter = searchParams.get('type') as 'customer' | 'vendor' | null;
  const { items: outwards, filters, pagination, sorting, loading } = useSelector((state: RootState) => state.outward);
  const { items: customers } = useSelector((state: RootState) => state.customers);
  const { items: vendors } = useSelector((state: RootState) => state.vendors);
  const { company, user } = useSelector((state: RootState) => state.auth);

  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
  const [mounted, setMounted] = useState(false);
  const isInitializedRef = useRef(false);

  // Fetch customers & vendors if not yet in state
  useEffect(() => {
    if (company?.id) {
      if (customers.length === 0) {
        (dispatch as any)(fetchCustomers({ company_id: company.id, limit: 1000 }));
      }
      if (vendors.length === 0) {
        (dispatch as any)(fetchVendors({ company_id: company.id, limit: 1000 }));
      }
    }
  }, [dispatch, company?.id, customers.length, vendors.length]);

  const effectivePartyType = partyTypeFilter || (filters.partyType !== 'all' ? filters.partyType : null) || 'customer';
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

    const qType = searchParams.get('type') as 'customer' | 'vendor' | null;
    const qSearch = searchParams.get('search');
    const qCustomerId = searchParams.get('customerId') || searchParams.get('customer_id');
    const qStatus = searchParams.get('status');
    const qFromDate = searchParams.get('fromDate');
    const qToDate = searchParams.get('toDate');
    const qPage = searchParams.get('page');
    const qSortBy = searchParams.get('sortBy');
    const qSortOrder = searchParams.get('sortOrder') as 'asc' | 'desc';

    const initialFilters: any = {};
    if (qType) initialFilters.partyType = qType;
    if (qSearch !== null && qSearch !== '') initialFilters.search = qSearch;
    if (qCustomerId !== null && qCustomerId !== '' && qCustomerId !== 'all') initialFilters.customerId = qCustomerId;
    if (qStatus !== null && qStatus !== '') initialFilters.status = qStatus;
    if (qFromDate !== null && qFromDate !== '') initialFilters.fromDate = qFromDate;
    if (qToDate !== null && qToDate !== '') initialFilters.toDate = qToDate;

    if (Object.keys(initialFilters).length > 0) {
      dispatch(setOutwardFilters(initialFilters));
    }

    if (qPage && !isNaN(parseInt(qPage)) && parseInt(qPage) > 1) {
      dispatch(setOutwardPage(parseInt(qPage)));
    }

    if (qSortBy) {
      dispatch(setOutwardSorting({
        sortBy: qSortBy,
        sortOrder: qSortOrder === 'asc' ? 'asc' : 'desc'
      }));
    }

    isInitializedRef.current = true;

    return () => {
      dispatch(resetOutwardState());
    };
  }, [dispatch]);

  // 2. State to URL Sync: Whenever filters, page, or sorting change, update the URL
  useEffect(() => {
    if (!isInitializedRef.current || !mounted) return;

    const handler = setTimeout(() => {
      const params = new URLSearchParams();

      const currentType = searchParams.get('type') || (filters.partyType !== 'all' ? filters.partyType : null);
      if (currentType) {
        params.set('type', currentType);
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
      if (filters.fromDate) {
        params.set('fromDate', filters.fromDate);
      }
      if (filters.toDate) {
        params.set('toDate', filters.toDate);
      }

      if (pagination.currentPage > 1) {
        params.set('page', String(pagination.currentPage));
      }

      if (sorting?.sortBy && sorting.sortBy !== 'outward_no' && sorting.sortBy !== 'id') {
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
    (dispatch as any)(fetchOutwards({
      company_id: company?.id,
      page: pagination.currentPage,
      limit: pagination.itemsPerPage,
      search: filters.search,
      partyType: partyTypeFilter || (filters.partyType !== 'all' ? filters.partyType : undefined),
      customerId: filters.customerId !== 'all' ? filters.customerId : undefined,
      status: filters.status !== 'all' ? filters.status : undefined,
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      sortBy: sorting.sortBy,
      sortOrder: sorting.sortOrder
    }));
  }, [
    dispatch,
    company?.id,
    pagination.currentPage,
    pagination.itemsPerPage,
    filters.search,
    filters.customerId,
    partyTypeFilter,
    filters.partyType,
    filters.status,
    filters.fromDate,
    filters.toDate,
    sorting.sortBy,
    sorting.sortOrder
  ]);

  const totalPages = pagination.totalPages;
  const paginatedOutwards = outwards;

  const handleDeleteParams = (id: string) => { setDeleteModal({ isOpen: true, id }); };
  const confirmDelete = () => { if (deleteModal.id) (dispatch as any)(deleteOutward(deleteModal.id)); };

  const handleSort = (field: string) => {
    const newOrder = sorting.sortBy === field && sorting.sortOrder === 'asc' ? 'desc' : 'asc';
    dispatch(setOutwardSorting({ sortBy: field, sortOrder: newOrder }));
  };

  const [downloadingItem, setDownloadingItem] = useState<any>(null);
  const downloadRef = React.useRef<HTMLDivElement>(null);

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
          pdf.save(`OUTWARD_${downloadingItem.outwardNo || downloadingItem.id}.pdf`);
          setDownloadingItem(null);
        }
      };
      captureAndDownload();
    }
  }, [downloadingItem]);

  const handlePrintOutward = (item: any) => {
    router.push(`/logistics-print?type=outward&id=${item.id}&print=true`);
  };

  const handleExportPDFOutward = (item: any) => {
    let enriched = { ...item };
    const pType = item.partyType || (item.vendorId ? 'vendor' : 'customer');
    if (pType === 'vendor') {
      const vend = vendors.find((v: any) => String(v.id) === String(item.vendorId) || (v.name || v.company) === item.vendorName);
      if (vend) {
        enriched.address = enriched.address || [vend.street1, vend.street2, vend.area, vend.city, vend.state, vend.pinCode].filter(Boolean).join(', ');
        enriched.gstin = enriched.gstin || vend.gst || (vend as any).gstin || '';
        enriched.phone = enriched.phone || vend.phone || '';
      }
    } else {
      const cust = customers.find((c: any) => String(c.id) === String(item.customerId) || (c.name || c.company) === item.customerName);
      if (cust) {
        enriched.address = enriched.address || [cust.street1, cust.street2, cust.area, cust.city, cust.state, cust.pinCode || (cust as any).pin_code].filter(Boolean).join(', ');
        enriched.gstin = enriched.gstin || cust.gst || '';
        enriched.phone = enriched.phone || cust.phone || '';
      }
    }
    enriched.vehicleNo = item.vehicleNo || item.vehicle_no || item.vehicle || '';
    enriched.notes = item.notes || item.specialInstructions || '';
    enriched.customerNotes = item.customerNotes || item.customer_notes || '';
    setDownloadingItem(enriched);
  };

  return (
    <ModuleGuard moduleId="mod_outward">
      <div className="container-fluid py-4 min-vh-100 animate-fade-in px-4">
        {/* Header Section */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <Breadcrumb items={[{ label: 'Outward Logistics', active: true }]} />
            <h2 className="fw-900 tracking-tight text-dark mb-1 mt-2">
              {partyTypeFilter === 'customer' ? 'Customer Outwards' : partyTypeFilter === 'vendor' ? 'Vendor Outwards' : 'Outward Entries'}
            </h2>
            <p className="text-muted small mb-0">Manage outgoing finished goods and customer/vendor dispatches.</p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <ExportExcel
              data={outwards}
              fileName="Outward_Records"
              headers={{ outwardNo: 'Outward No', partyType: 'Type', customerName: 'Customer', vendorName: 'Vendor', invoiceReference: 'Invoice Ref', date: 'Date' }}
              buttonText="Export List"
            />
            {mounted && checkActionPermission(user, 'mod_outward', 'create') && (
              <Link href={`/outward/new${partyTypeFilter ? `?type=${partyTypeFilter}` : ''}`} className="btn btn-primary btn-page-action px-4">
                <i className="bi bi-box-arrow-right"></i>
                <span>Add Outward</span>
              </Link>
            )}
          </div>
        </div>

        {/* Filter Section - Aligned in one row */}
        <div className="card filter-card" style={{ overflow: 'visible', position: 'relative', zIndex: 100 }}>
          <div className="card-body p-3" style={{ overflow: 'visible' }}>
            <div className="filter-bar-row d-flex flex-wrap gap-2 align-items-center">
              {/* Separate Customer Dropdown List with Search Input */}
              <div className="filter-item-select flex-grow-1 outward-customer-filter" style={{ minWidth: '260px' }}>
                <SearchableSelect
                  options={partyOptions}
                  value={filters.customerId || 'all'}
                  onChange={(val) => dispatch(setOutwardFilters({ customerId: String(val) }))}
                  placeholder={isVendor ? 'Select Vendor' : 'Select Customer'}
                  className="w-100"
                />
              </div>

              {/* General Search Input */}
              <div className="filter-item-search">
                <div className="search-group">
                  <span className="input-group-text">
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    type="text"
                    placeholder="Search by outward no, invoice ref..."
                    className="form-control search-bar"
                    value={filters.search}
                    onChange={(e) => dispatch(setOutwardFilters({ search: e.target.value }))}
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="filter-item-select" style={{ minWidth: '150px' }}>
                <select
                  className="form-select search-bar"
                  value={filters.status}
                  onChange={(e) => dispatch(setOutwardFilters({ status: e.target.value as any }))}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Date Filter Group */}
              <div className="date-filter-group">
                <input
                  type="date"
                  className="text-muted"
                  value={filters.fromDate}
                  onChange={(e) => dispatch(setOutwardFilters({ fromDate: e.target.value }))}
                />
                <span className="text-muted small fw-bold mx-1">TO</span>
                <input
                  type="date"
                  className="text-muted"
                  value={filters.toDate}
                  onChange={(e) => dispatch(setOutwardFilters({ toDate: e.target.value }))}
                />
              </div>

              {/* Clear Filter Button */}
              {((filters.customerId && filters.customerId !== 'all') || filters.search || (filters.status && filters.status !== 'all') || filters.fromDate || filters.toDate) && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1 shadow-none"
                  style={{ height: '38px', borderRadius: '8px', fontSize: '0.78rem' }}
                  onClick={() => dispatch(setOutwardFilters({ search: '', status: 'all', fromDate: '', toDate: '', customerId: 'all' }))}
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
          <div className="table-responsive" style={{ minHeight: '400px', paddingBottom: '80px' }}>
            {loading ? <Loader text="Loading Records..." /> : (
              <table className="table align-middle mb-0 table-hover">
                <thead className="bg-light">
                  <tr className="text-capitalize small fw-bold text-muted">
                    <th className="px-4 py-4 border-0">SNO</th>
                    <SortableHeader field="outward_no" label="OUTWARD NO" currentSortBy={sorting.sortBy} currentSortOrder={sorting.sortOrder} onSort={handleSort} className="py-4" />
                    <SortableHeader field="customer_name" label="PARTY (CUSTOMER/VENDOR)" currentSortBy={sorting.sortBy} currentSortOrder={sorting.sortOrder} onSort={handleSort} className="py-4" />
                    <SortableHeader field="party_type" label="TYPE" currentSortBy={sorting.sortBy} currentSortOrder={sorting.sortOrder} onSort={handleSort} className="py-4" />
                    <SortableHeader field="invoice_reference" label="INVOICE REF" currentSortBy={sorting.sortBy} currentSortOrder={sorting.sortOrder} onSort={handleSort} className="py-4" />
                    <SortableHeader field="vehicle_no" label="VEHICLE NO" currentSortBy={sorting.sortBy} currentSortOrder={sorting.sortOrder} onSort={handleSort} className="py-4" />
                    <SortableHeader field="date" label="DATE" currentSortBy={sorting.sortBy} currentSortOrder={sorting.sortOrder} onSort={handleSort} className="py-4" />
                    <SortableHeader field="status" label="STATUS" currentSortBy={sorting.sortBy} currentSortOrder={sorting.sortOrder} onSort={handleSort} className="py-4" />
                    <th className="py-4 border-0 text-center px-4" style={{ width: '130px' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOutwards.map((item, index) => (
                    <tr key={item.id} className="border-bottom border-light">
                      <td className="px-4 text-muted fw-bold">{(pagination.currentPage - 1) * pagination.itemsPerPage + index + 1}</td>
                       <td className="fw-900 fs-6"><Link href={`/outward/${item.id}`} className="text-primary fw-bold text-decoration-none hover-underline" style={{ cursor: 'pointer' }}>{item.outwardNo || 'N/A'}</Link></td>
                      <td>
                        <div className="fw-900 text-dark fs-6 mb-0">{item.customerName || item.vendorName}</div>
                        <div className="x-small text-muted text-capitalize">{item.processName || (item.items?.[0]?.description) || '-'}</div>
                      </td>
                      <td>
                        <span className={`badge rounded-pill px-2 py-1 small fw-bold ${item.partyType === 'vendor' ? 'bg-info-subtle text-info' : 'bg-primary-subtle text-primary'}`}>
                          {(item.partyType || 'customer').toUpperCase()}
                        </span>
                      </td>
                      <td><span className="badge bg-light text-dark border-0 shadow-inner px-2 py-1 fw-bold" style={{ borderRadius: '6px' }}>{item.invoiceReference || '-'}</span></td>
                      <td className="text-muted small fw-bold text-capitalize">{item.vehicleNo || '-'}</td>
                      <td className="text-nowrap text-muted small fw-bold">{item.date ? new Date(item.date).toLocaleDateString('en-GB').replace(/\//g, '-') : '-'}</td>
                      <td>
                        <span className={`badge rounded-pill px-3 py-1 small fw-bold ${item.status === 'completed' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'}`}>
                          {(item.status || 'pending').toUpperCase()}
                        </span>
                      </td>
                      <td className="text-center px-4">
                        <div className="d-flex justify-content-center align-items-center gap-1">
                          <Link href={`/outward/${item.id}`} className="btn-action-view" title="View Detail"><i className="bi bi-eye-fill"></i></Link>
                          {mounted && checkActionPermission(user, 'mod_outward', 'edit') && (
                            <Link href={`/outward/${item.id}?edit=true`} className="btn-action-edit" title="Edit Outward"><i className="bi bi-pencil-fill"></i></Link>
                          )}
                          <div className="dropdown">
                            <button className="btn btn-sm btn-outline-secondary border-0 text-muted p-0 ms-1 d-flex align-items-center justify-content-center" data-bs-toggle="dropdown" style={{ width: '32px', height: '32px', borderRadius: '8px' }}>
                              <i className="bi bi-three-dots-vertical fs-5"></i>
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end shadow border-0 rounded-3 py-2">
                              <li><button className="dropdown-item d-flex align-items-center gap-2 py-2 small fw-bold" onClick={() => handlePrintOutward(item)}><i className="bi bi-printer text-primary"></i> Quick Print</button></li>
                              <li><button className="dropdown-item d-flex align-items-center gap-2 py-2 small fw-bold" onClick={() => handleExportPDFOutward(item)}><i className="bi bi-file-earmark-pdf text-danger"></i> Export PDF</button></li>
                              {mounted && checkActionPermission(user, 'mod_outward', 'delete') && (
                                <>
                                  <li><hr className="dropdown-divider opacity-50" /></li>
                                  <li><button className="dropdown-item d-flex align-items-center gap-2 py-2 text-danger small fw-bold" onClick={() => handleDeleteParams(item.id)}><i className="bi bi-trash3"></i> Remove Record</button></li>
                                </>
                              )}
                            </ul>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {outwards.length === 0 && (
                    <tr><td colSpan={9} className="text-center py-5 text-muted small">No outward entries found.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
          {totalPages > 1 && (
            <div className="p-3 border-top bg-light d-flex justify-content-between align-items-center px-4">
              <span className="text-muted small">Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} to {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems} entries</span>
              <PaginationComponent
                currentPage={pagination.currentPage}
                totalPages={totalPages}
                onPageChange={(page) => dispatch(setOutwardPage(page))}
              />
            </div>
          )}
        </div>
      </div>
      <ConfirmationModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, id: null })} onConfirm={confirmDelete} title="Remove Outward Record" message="Are you sure you want to delete this record? This action is permanent and cannot be undone." />
      <style jsx>{`
        .fw-900 { font-weight: 900; }
        .bg-light-soft { background-color: #f7f9fc; }
        .table-responsive { min-height: 400px; padding-bottom: 80px; }
      `}</style>

      {/* Hidden Download Generator */}
      {downloadingItem && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <div ref={downloadRef}>
            <VendorChallanFormatA
              data={downloadingItem}
              company={company}
              settings={company?.invoiceSettings}
            />
          </div>
        </div>
      )}
    </ModuleGuard>
  );
}
