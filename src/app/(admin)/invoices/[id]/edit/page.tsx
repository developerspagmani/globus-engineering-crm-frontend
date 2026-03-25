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
            <li className="breadcrumb-item"><Link href="/invoices" className="text-decoration-none">Invoices</Link></li>
            <li className="breadcrumb-item active">Edit {invoice?.invoiceNumber}</li>
          </ol>
        </nav>

        {!invoice ? (
          <div className="alert alert-warning">
            Invoice with ID: {id} not found.
          </div>
        ) : (
          <>
            <div className="mb-4 border-bottom pb-4">
              <h2 className="fw-bold mb-1">Edit Invoice: {invoice.invoiceNumber}</h2>
              <p className="text-muted small mb-0">Modify billing details for {invoice.customerName}.</p>
            </div>
            <InvoiceForm mode="edit" initialData={invoice} />
          </>
        )}
      </div>
    </ModuleGuard>
  );
}
