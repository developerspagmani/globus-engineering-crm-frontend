'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'next/navigation';
import { RootState } from '@/redux/store';
import CompanyForm from '@/modules/admin/companies/components/CompanyForm';
import Link from 'next/link';

export default function EditCompanyPage() {
  const [mounted, setMounted] = React.useState(false);
  const { id } = useParams();
  const { user } = useSelector((state: RootState) => state.auth);
  const company = useSelector((state: RootState) => 
    state.companies.items.find(c => c.id === id)
  );

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
                    <p className="mb-0 text-muted small">Only Super Admin identities are authorized to modify tenant configurations. If you believe this is an error, contact your administrator.</p>
                </div>
            </div>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-5">
        <div className="bg-light d-inline-block p-4 rounded-circle mb-4">
          <i className="bi bi-building-exclamation text-muted fs-1"></i>
        </div>
        <h4 className="fw-bold">Tenant Not Found</h4>
        <p className="text-muted mb-4">The company ID provided does not exist in the ecosystem records.</p>
        <Link href="/admin/companies" className="btn btn-primary rounded-pill px-4">Return to Ecosystem</Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-4 d-flex align-items-center">
        <Link href="/admin/companies" className="btn btn-outline-secondary border-0 p-0 me-3" title="Back to Companies">
          <i className="bi bi-arrow-left-circle fs-3 text-muted"></i>
        </Link>
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><Link href="/admin/companies" className="text-decoration-none text-muted">Ecosystem</Link></li>
              <li className="breadcrumb-item active fw-bold">Modify Allocation</li>
            </ol>
          </nav>
          <h2 className="fw-900 text-dark tracking-tight">Manage: {company.name}</h2>
          <p className="text-muted small">Update organizational profile and module provisioning for this tenant.</p>
        </div>
      </div>

      <CompanyForm mode="edit" initialData={company} />
    </div>
  );
}
