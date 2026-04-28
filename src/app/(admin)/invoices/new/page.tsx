'use client';

import React from 'react';
import InvoiceForm from '@/modules/invoice/components/InvoiceForm';
import ModuleGuard from '@/components/ModuleGuard';
import Link from 'next/link';

export default function CreateInvoicePage() {
  return (
    <ModuleGuard moduleId="mod_invoice">
      <div className="container-fluid py-4">


        

        <React.Suspense fallback={<div>Loading form...</div>}>
          <InvoiceForm mode="create" />
        </React.Suspense>
      </div>
    </ModuleGuard>
  );
}
