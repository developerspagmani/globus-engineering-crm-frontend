'use client';

import React from 'react';
import Link from 'next/link';
import VendorFilter from '@/modules/vendor/components/VendorFilter';
import VendorTable from '@/modules/vendor/components/VendorTable';
import ModuleGuard from '@/components/ModuleGuard';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { checkActionPermission } from '@/config/permissions';

export default function VendorListPage() {
  const [mounted, setMounted] = React.useState(false);
  const { user } = useSelector((state: RootState) => state.auth);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <ModuleGuard moduleId="mod_vendor">
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold mb-1">Supplier Hub</h2>
            <p className="text-muted small mb-0">Manage industrial vendors and manufacturing partners.</p>
          </div>
          {(checkActionPermission(user, 'mod_vendor', 'create') || user?.role === 'company_admin') && (
            <Link href="/vendors/new" className="btn btn-primary d-flex align-items-center gap-2">
              <i className="bi bi-plus-circle-fill"></i>
              <span>Add New Vendor</span>
            </Link>
          )}
        </div>

        <VendorFilter />
        <VendorTable />
      </div>
    </ModuleGuard>
  );
}
