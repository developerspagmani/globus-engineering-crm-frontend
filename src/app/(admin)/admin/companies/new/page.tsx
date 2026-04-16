'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import CompanyForm from '@/modules/admin/companies/components/CompanyForm';
import Link from 'next/link';

export default function NewCompanyPage() {
  const [mounted, setMounted] = React.useState(false);
  const { user } = useSelector((state: RootState) => state.auth);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (user?.role !== 'super_admin') {
    return (
      <div className="container-fluid py-5 text-center">
        <div className="alert alert-danger shadow-sm rounded-4 p-4 border-0 animate-shake d-inline-block text-start" style={{ maxWidth: '600px' }}>
            <div className="d-flex align-items-center">
                <div className="bg-danger bg-opacity-10 p-3 rounded-circle me-4">
                    <i className="bi bi-shield-lock-fill text-danger fs-3"></i>
                </div>
                <div>
                    <h5 className="fw-bold text-danger mb-1">Access Resticted</h5>
                    <p className="mb-0 text-muted small">Only Super Admin identities are authorized to onboard new tenants. If you believe this is an error, contact your administrator.</p>
                </div>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-5 d-flex align-items-center pb-2 border-bottom">
        <Link href="/admin/companies" className="btn btn-outline-secondary border-0 p-0 me-3" title="Back to Companies">
          <i className="bi bi-arrow-left fs-3 text-muted"></i>
        </Link>
        <div>
          
          <h2 className="fw-900 text-dark tracking-tight">Tenant Onboarding</h2>
          <p className="text-muted small">Configure a new workspace identity and resource allocation.</p>
        </div>
      </div>

      <CompanyForm mode="create" />
    </div>
  );
}


