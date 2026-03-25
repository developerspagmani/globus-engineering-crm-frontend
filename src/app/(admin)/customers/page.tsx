'use client';

import React from 'react';
import Link from 'next/link';
import CustomerFilter from '@/modules/customer/components/CustomerFilter';
import CustomerTable from '@/modules/customer/components/CustomerTable';
import ModuleGuard from '@/components/ModuleGuard';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { checkActionPermission } from '@/config/permissions';

export default function CustomerListPage() {
  const [mounted, setMounted] = React.useState(false);
  const { user } = useSelector((state: RootState) => state.auth);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <ModuleGuard moduleId="mod_customer">
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold mb-1">Customer Hub</h2>
            <p className="text-muted small mb-0">Manage industrial clients and sales leads in one place.</p>
          </div>
          {(checkActionPermission(user, 'mod_customer', 'create') || user?.role === 'company_admin') && (
            <Link href="/customers/new" className="btn btn-primary d-flex align-items-center gap-2">
              <i className="bi bi-person-plus-fill"></i>
              <span>Add New Customer</span>
            </Link>
          )}
        </div>

        <CustomerFilter />
        <CustomerTable />
      </div>
    </ModuleGuard>
  );
}
