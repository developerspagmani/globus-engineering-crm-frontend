'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { useParams } from 'next/navigation';
import InvoiceForm from '@/modules/invoice/components/InvoiceForm';
import ModuleGuard from '@/components/ModuleGuard';
import Link from 'next/link';

export default function EditInvoicePage() {
  const params = useParams();
  const id = params.id as string;

  const invoice = useSelector((state: RootState) =>
    state.invoices.items.find(inv => inv.id === id)
  );

  return (
    <ModuleGuard moduleId="mod_invoice">
      <div className="container py-4">
        <div className="d-flex align-items-center mb-5 pb-2 border-bottom">
          <Link href="/invoices" className="back-btn-standard" title="Back to Invoices">
            <i className="bi bi-arrow-left fs-4"></i>
          </Link>
          <div>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-1">
                <li className="breadcrumb-item"><Link href="/invoices" className="text-decoration-none text-muted small">Invoices</Link></li>
                <li className="breadcrumb-item active fw-bold small text-primary">Edit Invoice</li>
              </ol>
            </nav>
            <h2 className="fw-bold mb-0">Edit Invoice</h2>
            <p className="text-muted small mb-0">Modify billing details and line items for this transaction.</p>
          </div>
        </div>

        {!invoice ? (
          <div className="alert alert-warning">
            Invoice with ID: {id} not found.
          </div>
        ) : (
          <>

            <React.Suspense fallback={<div>Loading form...</div>}>
              <InvoiceForm mode="edit" initialData={invoice} />
            </React.Suspense>
          </>
        )}
      </div>
    </ModuleGuard>
  );
}
