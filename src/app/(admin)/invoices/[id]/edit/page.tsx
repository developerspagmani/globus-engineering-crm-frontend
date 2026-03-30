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
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link href="/invoices" className="text-decoration-none text-muted small">Invoices</Link></li>
            <li className="breadcrumb-item active text-muted small">Edit Invoice</li>
          </ol>
        </nav>

        {!invoice ? (
          <div className="alert alert-warning">
            Invoice with ID: {id} not found.
          </div>
        ) : (
          <>
            <div className=" d-flex align-items-center">

            </div>
            <React.Suspense fallback={<div>Loading form...</div>}>
              <InvoiceForm mode="edit" initialData={invoice} />
            </React.Suspense>
          </>
        )}
      </div>
    </ModuleGuard>
  );
}
