'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { useParams } from 'next/navigation';
import VendorForm from '@/modules/vendor/components/VendorForm';
import ModuleGuard from '@/components/ModuleGuard';
import Link from 'next/link';
import { checkActionPermission } from '@/config/permissions';

export default function EditVendorPage() {
  const params = useParams();
  const id = params.id as string;
  const [isEdit, setIsEdit] = React.useState(false);
  const { user } = useSelector((state: RootState) => state.auth);
  
  const vendor = useSelector((state: RootState) => 
    state.vendors.items.find(v => v.id === id)
  );

  return (
    <ModuleGuard moduleId="mod_vendor">
      <div className="container-fluid py-4">
        <nav aria-label="breadcrumb" className="mb-4 text-muted small">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link href="/vendors" className="text-decoration-none text-muted">Vendors</Link></li>
            <li className="breadcrumb-item active" aria-current="page">{isEdit ? 'Modify Profile' : 'View Profile'}</li>
          </ol>
        </nav>

        {!vendor ? (
          <div className="alert alert-warning">
            Vendor with ID: {id} not found.
          </div>
        ) : (
          <>
            <div className="mb-4 d-flex align-items-center border-bottom pb-3">
              <Link href="/vendors" className="btn btn-outline-secondary border-0 p-0 me-3" title="Back to Vendors">
                <i className="bi bi-arrow-left-circle fs-3 text-muted"></i>
              </Link>
              <div>
                <h2 className="fw-bold mb-1">{isEdit ? 'Edit Vendor' : 'Vendor Profile'}</h2>
                <p className="text-muted small mb-0">{isEdit ? `Update information for ${vendor.name}.` : `Review organizational details for ${vendor.name}.`}</p>
              </div>
              {!isEdit && checkActionPermission(user, 'mod_vendor', 'edit') && (
                <button 
                  className="btn btn-primary ms-auto d-flex align-items-center gap-2 px-4 shadow-accent"
                  onClick={() => setIsEdit(true)}
                >
                  <i className="bi bi-pencil-square"></i>
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
            <VendorForm mode={isEdit ? 'edit' : 'view'} initialData={vendor} />
          </>
        )}
      </div>
    </ModuleGuard>
  );
}
