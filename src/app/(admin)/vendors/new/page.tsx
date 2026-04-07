'use client';

import React from 'react';
import VendorForm from '@/modules/vendor/components/VendorForm';
import ModuleGuard from '@/components/ModuleGuard';
import Link from 'next/link';

export default function NewVendorPage() {
  return (
    <ModuleGuard moduleId="mod_vendor">
      <div className="container-fluid py-4">
        

        <div className="mb-4 d-flex align-items-center">
          <Link href="/vendors" className="back-btn-standard" title="Back to Vendors">
            <i className="bi bi-arrow-left-circle fs-3 "></i>
          </Link>
          <div>
            <h2 className="fw-bold mb-1">Add New Vendor</h2>
            <p className="text-muted small mb-0">Register a new manufacturing partner to the system.</p>
          </div>
        </div>

        <VendorForm mode="create" />
      </div>
    </ModuleGuard>
  );
}


