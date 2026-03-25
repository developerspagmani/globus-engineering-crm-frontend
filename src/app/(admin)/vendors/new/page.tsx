'use client';

import React from 'react';
import VendorForm from '@/modules/vendor/components/VendorForm';
import ModuleGuard from '@/components/ModuleGuard';
import Link from 'next/link';

export default function NewVendorPage() {
  return (
    <ModuleGuard moduleId="mod_supplier">
      <div className="container-fluid py-4">
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link href="/vendors" className="text-decoration-none">Vendors</Link></li>
            <li className="breadcrumb-item active" aria-current="page">New Vendor</li>
          </ol>
        </nav>

        <div className="mb-4">
          <h2 className="fw-bold mb-1">Add New Vendor</h2>
          <p className="text-muted small mb-0">Register a new manufacturing partner to the system.</p>
        </div>

        <VendorForm mode="create" />
      </div>
    </ModuleGuard>
  );
}
