'use client';

import React from 'react';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';
import ExportExcel from '@/components/shared/ExportExcel';
import VendorFilter from '@/modules/vendor/components/VendorFilter';
import VendorTable from '@/modules/vendor/components/VendorTable';
import ModuleGuard from '@/components/ModuleGuard';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { checkActionPermission } from '@/config/permissions';
import { fetchVendors } from '@/redux/features/vendorSlice';

export default function VendorListPage() {
  const [mounted, setMounted] = React.useState(false);
  const dispatch = useDispatch();
  const { user, company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items, filters, sorting } = useSelector((state: RootState) => state.vendors);

  const fetchExportData = async () => {
    if (!activeCompany?.id) return [];
    try {
      const result = await (dispatch as any)(fetchVendors({
        company_id: activeCompany.id,
        limit: 1000000,
        page: 1,
        search: filters.search,
        status: filters.status,
        category: filters.category,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        sortBy: sorting.sortBy,
        sortOrder: sorting.sortOrder
      })).unwrap();
      return result.items || [];
    } catch (err) {
      console.error('Error fetching export data:', err);
      return [];
    }
  };

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <ModuleGuard moduleId="mod_vendor">
      <div className="container-fluid py-4 min-vh-100 animate-fade-in px-4">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <Breadcrumb items={[{ label: 'Supplier Hub', active: true }]} />
            <h2 className="fw-900 tracking-tight text-dark mb-1 mt-2">Vendor Management</h2>
            <p className="text-muted small mb-0">Manage industrial vendors and manufacturing partners.</p>
          </div>
          <div className="d-flex align-items-center gap-3">
            <ExportExcel 
              data={items} 
              fetchData={fetchExportData}
              fileName="Vendor_List" 
              headers={{ name: 'Vendor Name', phone: 'Phone', email: 'Email', gst: 'GSTN', city: 'City', status: 'Status' }}
              buttonText="Export List"
            />
            {checkActionPermission(user, 'mod_vendor', 'create') && (
              <Link
                href="/vendors/new"
                className="btn btn-primary btn-page-action px-4"
              >
                <i className="bi bi-plus-circle-fill"></i>
                <span>Add Vendor</span>
              </Link>
            )}
          </div>
        </div>

        <VendorFilter />
        <VendorTable />
      </div>
    </ModuleGuard>
  );
}
