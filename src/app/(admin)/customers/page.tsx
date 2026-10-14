'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';
import CustomerFilter from '@/modules/customer/components/CustomerFilter';
import CustomerTable from '@/modules/customer/components/CustomerTable';
import ModuleGuard from '@/components/ModuleGuard';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { checkActionPermission } from '@/config/permissions';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { setFilters, setPage, setSorting, resetCustomerState } from '@/redux/features/customerSlice';
import ExportExcel from '@/components/shared/ExportExcel';

function CustomerListContent() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { items: customers, filters, pagination, sorting } = useSelector((state: RootState) => state.customers);
  const isInitializedRef = useRef(false);

  // 1. Initial Load: Read all query parameters from URL and populate Redux state
  useEffect(() => {
    setMounted(true);

    const qSearch = searchParams.get('search');
    const qCustomerId = searchParams.get('customerId') || searchParams.get('customer_id') || searchParams.get('id');
    const qStatus = searchParams.get('status');
    const qFromDate = searchParams.get('fromDate');
    const qToDate = searchParams.get('toDate');
    const qPage = searchParams.get('page');
    const qSortBy = searchParams.get('sortBy');
    const qSortOrder = searchParams.get('sortOrder') as 'asc' | 'desc';

    const initialFilters: any = {};
    if (qSearch !== null && qSearch !== '') initialFilters.search = qSearch;
    if (qCustomerId !== null && qCustomerId !== '' && qCustomerId !== 'all') initialFilters.customerId = qCustomerId;
    if (qStatus !== null && qStatus !== '') initialFilters.status = qStatus;
    if (qFromDate !== null && qFromDate !== '') initialFilters.fromDate = qFromDate;
    if (qToDate !== null && qToDate !== '') initialFilters.toDate = qToDate;

    if (Object.keys(initialFilters).length > 0) {
      dispatch(setFilters(initialFilters));
    }

    if (qPage && !isNaN(parseInt(qPage)) && parseInt(qPage) > 1) {
      dispatch(setPage(parseInt(qPage)));
    }

    if (qSortBy) {
      dispatch(setSorting({
        sortBy: qSortBy,
        sortOrder: qSortOrder === 'asc' ? 'asc' : 'desc'
      }));
    }

    isInitializedRef.current = true;

    return () => {
      dispatch(resetCustomerState());
    };
  }, [dispatch]);

  // 2. State to URL Sync: Whenever filters, page, or sorting change, update the URL
  useEffect(() => {
    if (!isInitializedRef.current || !mounted) return;

    const handler = setTimeout(() => {
      const params = new URLSearchParams();

      if (filters.customerId && filters.customerId !== 'all') {
        params.set('customerId', filters.customerId);
      }
      if (filters.search && filters.search.trim()) {
        params.set('search', filters.search.trim());
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
      if (sorting.sortBy && sorting.sortBy !== 'customer_name') {
        params.set('sortBy', sorting.sortBy);
        params.set('sortOrder', sorting.sortOrder);
      }

      const queryString = params.toString();
      const currentQuery = searchParams.toString();
      if (queryString !== currentQuery) {
        router.replace(`${pathname}${queryString ? `?${queryString}` : ''}`, { scroll: false });
      }
    }, 250);

    return () => clearTimeout(handler);
  }, [filters, pagination.currentPage, sorting, mounted, pathname, router, searchParams]);

  if (!mounted) return null;

  return (
    <ModuleGuard moduleId="mod_customer">
      <div className="container-fluid py-4 min-vh-100 animate-fade-in px-4">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <Breadcrumb items={[{ label: 'Customer Hub', active: true }]} />
            <h2 className="fw-900 tracking-tight text-dark mb-1 mt-2">Customer Management</h2>
            <p className="text-muted small mb-0">Manage industrial clients and sales leads in one place.</p>
          </div>
          <div className="d-flex align-items-center gap-3">
            <ExportExcel
              data={customers}
              fileName="Customer_List"
              headers={{ name: 'Customer Name', company: 'Company', email: 'Email', phone: 'Phone', industry: 'Industry', status: 'Status' }}
              buttonText="Export List"
            />
            {(checkActionPermission(user, 'mod_customer', 'create') || user?.role === 'company_admin') && (
              <Link
                href="/customers/new"
                className="btn btn-primary btn-page-action px-4"
              >
                <i className="bi bi-person-plus-fill"></i>
                <span>Add Customer</span>
              </Link>
            )}
          </div>
        </div>

        <CustomerFilter />
        <CustomerTable />
      </div>
    </ModuleGuard>
  );
}

export default function CustomerListPage() {
  return (
    <Suspense fallback={null}>
      <CustomerListContent />
    </Suspense>
  );
}
