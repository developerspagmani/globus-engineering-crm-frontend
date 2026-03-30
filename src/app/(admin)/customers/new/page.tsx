'use client';

import React from 'react';
import CustomerForm from '@/modules/customer/components/CustomerForm';
import ModuleGuard from '@/components/ModuleGuard';
import Link from 'next/link';

export default function NewCustomerPage() {
  return (
    <ModuleGuard moduleId="mod_customer">
      <div className="container-fluid py-4">
        <div className="d-flex align-items-center mb-5 pb-2">
          <Link href="/customers" className="btn btn-outline-secondary border-0 p-0 me-3" title="Back to Customers">
            <i className="bi bi-arrow-left-circle fs-3 text-muted"></i>
          </Link>
          <div>
            <h2 className="fw-bold mb-0">Add New Customer</h2>
            <p className="text-muted small mb-0">Register a new client or sales lead to the system.</p>
          </div>
        </div>

        <CustomerForm mode="create" />
      </div>
    </ModuleGuard>
  );
}
