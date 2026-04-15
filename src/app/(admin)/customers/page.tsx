'use client';

import React from 'react';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';
import CustomerFilter from '@/modules/customer/components/CustomerFilter';
import CustomerTable from '@/modules/customer/components/CustomerTable';
import ModuleGuard from '@/components/ModuleGuard';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { checkActionPermission } from '@/config/permissions';

import ExportExcel from '@/components/shared/ExportExcel';

export default function CustomerListPage() {
  const [mounted, setMounted] = React.useState(false);
  const { user } = useSelector((state: RootState) => state.auth);
  const { items: customers } = useSelector((state: RootState) => state.customers);

  React.useEffect(() => {
    setMounted(true);
  }, []);

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
          <div className="d-flex align-items-center gap-2">
            <ExportExcel
              data={customers}
              fileName="Customer_List"
              headers={{ name: 'Customer Name', company: 'Company', email: 'Email', phone: 'Phone', industry: 'Industry', status: 'Status' }}
              buttonText="Export List"
            />
            <button className="btn btn-outline-dark btn-page-action" onClick={() => window.print()}>
              <i className="bi bi-printer-fill"></i>
              <span>Print List</span>
            </button>
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
