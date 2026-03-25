'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { useParams } from 'next/navigation';
import VendorForm from '@/modules/vendor/components/VendorForm';
import ModuleGuard from '@/components/ModuleGuard';
import Link from 'next/link';

export default function EditVendorPage() {
  const params = useParams();
  const id = params.id as string;
  
  const vendor = useSelector((state: RootState) => 
    state.vendors.items.find(v => v.id === id)
  );

  return (
    <ModuleGuard moduleId="mod_supplier">
      <div className="container-fluid py-4">
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link href="/vendors" className="text-decoration-none">Vendors</Link></li>
            <li className="breadcrumb-item active" aria-current="page">Edit Vendor</li>
          </ol>
        </nav>

        {!vendor ? (
          <div className="alert alert-warning">
            Vendor with ID: {id} not found.
          </div>
        ) : (
          <>
            <div className="mb-4">
              <h2 className="fw-bold mb-1">Edit: {vendor.name}</h2>
              <p className="text-muted small mb-0">Update information for {vendor.company}.</p>
            </div>
            <VendorForm mode="edit" initialData={vendor} />
          </>
        )}
      </div>
    </ModuleGuard>
  );
}
