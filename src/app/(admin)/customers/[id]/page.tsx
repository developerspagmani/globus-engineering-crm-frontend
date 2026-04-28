'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import CustomerForm from '@/modules/customer/components/CustomerForm';
import ModuleGuard from '@/components/ModuleGuard';
import Link from 'next/link';
import { checkActionPermission } from '@/config/permissions';

export default function EditCustomerPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isEdit, setIsEdit] = React.useState(searchParams.get('edit') === 'true');

  const { user } = useSelector((state: RootState) => state.auth);
  const { items } = useSelector((state: RootState) => state.customers);
  const customer = items.find(c => String(c.id) === String(id));

  return (
    <ModuleGuard moduleId="mod_customer">
      <div className="container-fluid py-4">
        {!customer ? (
          <div className="text-center py-5">
            <div className="bg-light d-inline-block p-4 rounded-circle mb-4">
              <i className="bi bi-person-exclamation text-muted fs-1"></i>
            </div>
            <h4 className="fw-bold">Customer Not Found</h4>
            <p className="text-muted mb-4">The account profile you are looking for does not exist.</p>
            <Link href="/customers" className="btn btn-primary rounded-pill px-4">Return to Hub</Link>
          </div>
        ) : (
          <div className="animate-fade-in">
            <div className="d-flex align-items-center mb-4 border-bottom pb-3">
              <Link href="/customers" className="back-btn-standard" title="Back to Customers">
                <i className="bi bi-arrow-left fs-4"></i>
              </Link>
              <div>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb mb-1">
                    <li className="breadcrumb-item"><Link href="/customers" className="text-decoration-none text-muted small">Customer Hub</Link></li>
                    <li className="breadcrumb-item active fw-bold small text-primary">{isEdit ? 'Modify Profile' : 'View Profile'}</li>
                  </ol>
                </nav>
                <h2 className="fw-bold mb-0">{isEdit ? 'Edit Customer' : 'Customer Account'}</h2>
                <p className="text-muted small mb-0">{isEdit ? 'Update account details and contact information for this partner.' : 'Review organizational profile and contact synchronization details.'}</p>
              </div>
              {!isEdit && checkActionPermission(user, 'mod_customer', 'edit') && (
                <button 
                  className="btn btn-primary ms-auto d-flex align-items-center gap-2 px-4 shadow-accent fw-bold rounded-pill"
                  onClick={() => setIsEdit(true)}
                >
                  <i className="bi bi-person-gear"></i>
                  <span>Edit Customer</span>
                </button>
              )}
            </div>
            <CustomerForm mode={isEdit ? 'edit' : 'view'} initialData={customer} />
          </div>
        )}
      </div>
    </ModuleGuard>
  );
}
