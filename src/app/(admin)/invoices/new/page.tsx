'use client';

import React from 'react';
import InvoiceForm from '@/modules/invoice/components/InvoiceForm';
import ModuleGuard from '@/components/ModuleGuard';
import Link from 'next/link';

export default function CreateInvoicePage() {
  return (
    <ModuleGuard moduleId="mod_invoice">
      <div className="container py-4">
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link href="/invoices" className="text-decoration-none">Invoices</Link></li>
            <li className="breadcrumb-item active">New Invoice</li>
          </ol>
        </nav>

        <div className="mb-4 border-bottom pb-4 d-flex justify-content-between align-items-end">
          <div>
            <h2 className="fw-bold mb-1">Create New Invoice</h2>
            <p className="text-muted small mb-0">Generate a new billing request for your industrial clients.</p>
          </div>
          <div className="text-muted small text-end">
            Module: <span className="text-primary fw-bold">Manufacturing Billing v1.0</span>
          </div>
        </div>

        <InvoiceForm mode="create" />
      </div>
    </ModuleGuard>
  );
}
