'use client';

import React from 'react';
import InvoiceForm from '@/modules/invoice/components/InvoiceForm';
import ModuleGuard from '@/components/ModuleGuard';
import Link from 'next/link';

export default function CreateInvoicePage() {
  return (
    <ModuleGuard moduleId="mod_invoice">
      <div className="container-fluid py-4">
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link href="/invoices" className="text-decoration-none text-muted small">Invoices</Link></li>
            <li className="breadcrumb-item active text-muted small">New Invoice</li>
          </ol>
        </nav>

        

        <React.Suspense fallback={<div>Loading form...</div>}>
          <InvoiceForm mode="create" />
        </React.Suspense>
      </div>
    </ModuleGuard>
  );
}
