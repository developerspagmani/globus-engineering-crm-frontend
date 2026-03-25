'use client';

import React from 'react';
import CustomerForm from '@/modules/customer/components/CustomerForm';
import ModuleGuard from '@/components/ModuleGuard';
import Link from 'next/link';

export default function NewCustomerPage() {
  return (
    <ModuleGuard moduleId="mod_customer">
      <div className="container-fluid py-4">
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link href="/customers" className="text-decoration-none">Customers</Link></li>
            <li className="breadcrumb-item active" aria-current="page">New Customer</li>
          </ol>
        </nav>

        <div className="mb-4">
          <h2 className="fw-bold mb-1">Add New Customer</h2>
          <p className="text-muted small mb-0">Register a new client or sales lead to the system.</p>
        </div>

        <CustomerForm mode="create" />
      </div>
    </ModuleGuard>
  );
}
