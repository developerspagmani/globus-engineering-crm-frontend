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
