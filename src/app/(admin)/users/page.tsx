'use client';

import React from 'react';
import Link from 'next/link';
import CompanyUserFilter from '@/modules/company-user/components/CompanyUserFilter';
import CompanyUserTable from '@/modules/company-user/components/CompanyUserTable';
import Breadcrumb from '@/components/Breadcrumb';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

export default function CompanyUserListPage() {
  const [mounted, setMounted] = React.useState(false);
  const { user } = useSelector((state: RootState) => state.auth);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Only company admins or super admins should manage users
  const canManage = user?.role === 'company_admin' || user?.role === 'super_admin';

  if (!canManage) {
    return (
      <div className="container-fluid py-5 text-center">
        <h4 className="text-muted">You do not have permission to manage company users.</h4>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4 text-white">
        <div>
          <Breadcrumb items={[{ label: 'User Management', active: true }]} />
          <h2 className="fw-900 tracking-tight text-dark mb-1 mt-2">Company Workforce</h2>
          <p className="text-muted small mb-0">Manage roles, module access, and granular CRUD permissions for your team.</p>
        </div>
        <Link href="/users/new" className="btn btn-primary d-flex align-items-center gap-2 py-2 px-4 shadow-accent rounded-pill fw-bold">
          <i className="bi bi-person-plus-fill fs-5"></i>
          <span>Invite User</span>
        </Link>
      </div>

      <CompanyUserFilter />
      <CompanyUserTable />
    </div>
  );
}
