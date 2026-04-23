'use client';

import React from 'react';
import Link from 'next/link';
import CompanyUserFilter from '@/modules/company-user/components/CompanyUserFilter';
import CompanyUserTable from '@/modules/company-user/components/CompanyUserTable';
import Breadcrumb from '@/components/Breadcrumb';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

import { checkActionPermission } from '@/config/permissions';
import ModuleGuard from '@/components/ModuleGuard';

import ExportExcel from '@/components/shared/ExportExcel';

export default function CompanyUserListPage() {
  const [mounted, setMounted] = React.useState(false);
  const { user } = useSelector((state: RootState) => state.auth);
  const { items: companyUsers } = useSelector((state: RootState) => state.companyUsers);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <ModuleGuard moduleId="mod_user_management">
      <div className="container-fluid py-4 min-vh-100 animate-fade-in px-4">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <Breadcrumb items={[{ label: 'User Management', active: true }]} />
            <h2 className="fw-900 tracking-tight text-dark mb-1 mt-2">Company Workforce</h2>
            <p className="text-muted small mb-0">Manage roles, module access, and granular CRUD permissions for your team.</p>
          </div>
          <div className="d-flex align-items-center gap-3">
            <ExportExcel
              data={companyUsers}
              fileName="Workforce_List"
              headers={{ name: 'Name', email: 'Email', role: 'Role', phone: 'Phone' }}
              buttonText="Export List"
            />
            {checkActionPermission(user, 'mod_user_management', 'create') && (
              <Link
                href="/users/new"
                className="btn btn-primary btn-page-action px-4"
              >
                <i className="bi bi-person-plus-fill"></i>
                <span>Add User</span>
              </Link>
            )}
          </div>
        </div>

        <CompanyUserFilter />
        <CompanyUserTable />
      </div>
    </ModuleGuard>
  );
}
