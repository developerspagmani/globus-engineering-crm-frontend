'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { useParams } from 'next/navigation';
import InvoicePreview from '@/modules/invoice/components/InvoicePreview';
import ModuleGuard from '@/components/ModuleGuard';
import Link from 'next/link';

export default function InvoiceDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const invoice = useSelector((state: RootState) =>
    state.invoices.items.find(inv => inv.id === id)
  );

  const { company } = useSelector((state: RootState) => state.auth);

  return (
    <ModuleGuard moduleId="mod_invoice">
      <div className="container py-4">
        <nav aria-label="breadcrumb" className="mb-4 no-print">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link href="/invoices" className="text-decoration-none">Invoices</Link></li>
            <li className="breadcrumb-item active">{invoice?.invoiceNumber || 'Detail'}</li>
          </ol>
        </nav>

        {!invoice ? (
          <div className="alert alert-warning">
            Invoice with ID: {id} not found.
          </div>
        ) : (
          <InvoicePreview invoice={invoice} company={company} />
        )}
      </div>
    </ModuleGuard>
  );
}
