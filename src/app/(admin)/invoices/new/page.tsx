'use client';

import React from 'react';
import InvoiceForm from '@/modules/invoice/components/InvoiceForm';
import ModuleGuard from '@/components/ModuleGuard';
import Link from 'next/link';

export default function CreateInvoicePage() {
  return (
    <ModuleGuard moduleId="mod_invoice">
      <div className="container-fluid py-4">
        <div className="d-flex align-items-center mb-5 pb-2 border-bottom">
          <Link href="/invoices" className="back-btn-standard" title="Back to Invoices">
            <i className="bi bi-arrow-left fs-4"></i>
          </Link>
          <div>
            <h2 className="fw-bold mb-0 text-dark">Generate GST Invoice</h2>
            <p className="text-muted small mb-0">Create a professional tax invoice for dispatched goods.</p>
          </div>
        </div>

        

        <React.Suspense fallback={<div>Loading form...</div>}>
          <InvoiceForm mode="create" />
        </React.Suspense>
      </div>
    </ModuleGuard>
  );
}
