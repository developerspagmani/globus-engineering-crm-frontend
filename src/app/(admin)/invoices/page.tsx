'use client';

import React from 'react';
import Link from 'next/link';
import InvoiceFilter from '@/modules/invoice/components/InvoiceFilter';
import InvoiceTable from '@/modules/invoice/components/InvoiceTable';
import ModuleGuard from '@/components/ModuleGuard';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { checkActionPermission } from '@/config/permissions';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { setInvoiceFilters, setInvoicePage, setInvoiceSorting, resetInvoiceState } from '@/redux/features/invoiceSlice';
import ExportExcel from '@/components/shared/ExportExcel';

import Breadcrumb from '@/components/Breadcrumb';

export default function InvoiceHistoryPage() {
  const [mounted, setMounted] = React.useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const { user, company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items, aggregates, pagination, filters, sorting: invoiceSorting } = useSelector((state: RootState) => state.invoices);
  const isInitializedRef = React.useRef(false);

  // 1. Initial Load: Read all query parameters from URL and populate Redux state
  React.useEffect(() => {
    setMounted(true);
    
    const qSearch = searchParams.get('search');
    const qStatus = searchParams.get('status');
    const qPartyType = searchParams.get('partyType');
    const qFromDate = searchParams.get('fromDate');
    const qToDate = searchParams.get('toDate');
    const qProcess = searchParams.get('process');
    const qPage = searchParams.get('page');
    const qSortBy = searchParams.get('sortBy');
    const qSortOrder = searchParams.get('sortOrder') as 'asc' | 'desc';

    const initialFilters: any = {};
    if (qSearch !== null && qSearch !== '') initialFilters.search = qSearch;
    if (qStatus !== null && qStatus !== '') initialFilters.status = qStatus;
    if (qPartyType !== null && qPartyType !== '') initialFilters.partyType = qPartyType;
    if (qFromDate !== null && qFromDate !== '') initialFilters.fromDate = qFromDate;
    if (qToDate !== null && qToDate !== '') initialFilters.toDate = qToDate;
    if (qProcess !== null && qProcess !== '') initialFilters.process = qProcess;

    if (Object.keys(initialFilters).length > 0) {
      dispatch(setInvoiceFilters(initialFilters));
    }

    if (qPage && !isNaN(parseInt(qPage)) && parseInt(qPage) > 1) {
      dispatch(setInvoicePage(parseInt(qPage)));
    }

    if (qSortBy) {
      dispatch(setInvoiceSorting({ 
        sortBy: qSortBy, 
        sortOrder: qSortOrder === 'asc' ? 'asc' : 'desc' 
      }));
    }

    isInitializedRef.current = true;

    return () => {
      dispatch(resetInvoiceState());
    };
  }, [dispatch]);

  // 2. State to URL Sync: Whenever filters, page, sorting, or tab change, update the URL
  React.useEffect(() => {
    if (!isInitializedRef.current || !mounted) return;

    const handler = setTimeout(() => {
      const params = new URLSearchParams();

      // Preserve active tab if set
      const currentTab = searchParams.get('tab');
      if (currentTab) {
        params.set('tab', currentTab);
      }

      // Sync active filters
      if (filters.search && filters.search.trim()) {
        params.set('search', filters.search.trim());
      }
      if (filters.status && filters.status !== 'all') {
        params.set('status', filters.status);
      }
      if (filters.partyType && filters.partyType !== 'all') {
        params.set('partyType', filters.partyType);
      }
      if (filters.fromDate) {
        params.set('fromDate', filters.fromDate);
      }
      if (filters.toDate) {
        params.set('toDate', filters.toDate);
      }
      if (filters.process && filters.process !== 'all') {
        params.set('process', filters.process);
      }

      // Sync pagination
      if (pagination.currentPage > 1) {
        params.set('page', String(pagination.currentPage));
      }

      // Sync sorting
      if (invoiceSorting?.sortBy && invoiceSorting.sortBy !== 'id') {
        params.set('sortBy', invoiceSorting.sortBy);
      }
      if (invoiceSorting?.sortOrder && invoiceSorting.sortOrder !== 'desc') {
        params.set('sortOrder', invoiceSorting.sortOrder);
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
    filters.status,
    filters.partyType,
    filters.fromDate,
    filters.toDate,
    filters.process,
    pagination.currentPage,
    invoiceSorting?.sortBy,
    invoiceSorting?.sortOrder,
    searchParams,
    pathname,
    router,
    mounted
  ]);

  if (!mounted) return null;

  // Use backend-driven pagination total (correctly filtered by InvoiceTable)
  const filteredInvoices = items;

  // Analytics logic - Use backend aggregates for global totals
  const totalBilled = aggregates?.totalGrand || 0;
  const totalPaid = aggregates?.totalPaid || 0;
  const totalUnpaid = aggregates?.totalOutstanding || 0;

  return (
    <ModuleGuard moduleId="mod_invoice">
      <div className="container-fluid py-4 animate-fade-in px-4">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <Breadcrumb items={[{ label: 'Billing Hub', active: true }]} />
            <h2 className="fw-900 tracking-tight text-dark mb-1 mt-2">Invoices</h2>
            <p className="text-muted small mb-0">Generate and manage industrial billing records • {pagination.totalItems > 0 ? pagination.totalItems : filteredInvoices.length} total</p>
          </div>
          <div className="d-flex align-items-center gap-3">
            <ExportExcel 
              data={filteredInvoices} 
              fetchData={async () => {
                const api = (await import('@/lib/axios')).default;
                const { mapInvoice } = await import('@/redux/features/invoiceSlice');
                const params = new URLSearchParams({
                  company_id: activeCompany?.id || '',
                  limit: '5000',
                  search: filters.search || '',
                  status: filters.status || 'all',
                  fromDate: filters.fromDate || '',
                  toDate: filters.toDate || '',
                  partyType: filters.partyType || 'all',
                  process: filters.process || 'all'
                });
                const response = await api.get(`/invoices?${params.toString()}`);
                return response.data.items.map((raw: any) => {
                  const inv = mapInvoice(raw);
                  const qty = inv.items.reduce((acc, it) => acc + (it.quantity || 0) + (it.wopQty || 0), 0);
                  const sac = (inv.items[0] as any)?.hsnCode || '';
                  const expectedGrand = inv.subTotal + inv.taxTotal;
                  const roundOff = inv.grandTotal - expectedGrand;
                  return {
                    ...inv,
                    qty,
                    sac,
                    roundOff: Math.abs(roundOff) > 0.01 ? roundOff.toFixed(2) : 0
                  };
                });
              }}
              fileName="Invoice_History" 
              headers={{
                date: 'Date',
                customerName: 'Company Name',
                gstin: 'GST TIN',
                dcNo: 'D.C No',
                invoiceNumber: 'Invoice No',
                sac: 'SAC',
                qty: 'Qty',
                subTotal: 'Taxable Amount',
                gst1: 'CGST',
                gst2: 'SGST',
                igst: 'IGST',
                roundOff: 'Round off',
                grandTotal: 'Grand Total',
                status: 'Status'
              }}
              buttonText="Export List"
            />
            {checkActionPermission(user, 'mod_invoice', 'create') && (
              <Link
                href="/invoices/new"
                className="btn btn-primary btn-page-action px-4"
              >
                <i className="bi bi-file-earmark-plus"></i>
                <span>Add Invoice</span>
              </Link>
            )}
          </div>
        </div>

        {/* Revenue Analytics Cards */}
        <div className="row g-4 mb-4">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body p-4">
                <div className="x-small text-capitalize tracking-widest text-muted fw-bold mb-2">Total Billed</div>
                <div className="h2 fw-bold mb-0">₹{totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body p-4">
                <div className="x-small text-capitalize tracking-widest text-success fw-bold mb-2">Total Paid</div>
                <div className="h2 fw-bold mb-0  text-success">₹{totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-4 h-100 border-start border-4 border-warning">
              <div className="card-body p-4">
                <div className="x-small text-capitalize tracking-widest text-warning fw-bold mb-2">Outstanding Balance</div>
                <div className="h2 fw-bold mb-0  text-warning">₹{totalUnpaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              </div>
            </div>
          </div>
        </div>

        <InvoiceFilter />
        <InvoiceTable />
      </div>
    </ModuleGuard>
  );
}
