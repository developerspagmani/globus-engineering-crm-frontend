'use client';

import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/redux/store';
import { useParams } from 'next/navigation';
import InvoiceForm from '@/modules/invoice/components/InvoiceForm';
import ModuleGuard from '@/components/ModuleGuard';
import Link from 'next/link';
import { fetchInvoices } from '@/redux/features/invoiceSlice';

export default function EditInvoicePage() {
  const params = useParams();
  const id = params?.id as string;
  const dispatch = useDispatch<AppDispatch>();

  const { items: invoices, loading: invoiceLoading } = useSelector((state: RootState) => state.invoices);
  const { company } = useSelector((state: RootState) => state.auth);

  const invoice = invoices.find(inv => String(inv.id) === String(id));

  useEffect(() => {
    if (!invoice && id) {
      dispatch(fetchInvoices({ company_id: company?.id, id }) as any);
    }
  }, [invoice, company?.id, id, dispatch]);

  if (invoiceLoading || (!invoice && invoices.length === 0)) {
    return (
      <ModuleGuard moduleId="mod_invoice">
        <div className="container py-5 text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted fw-semibold">Loading invoice details...</p>
        </div>
      </ModuleGuard>
    );
  }

  return (
    <ModuleGuard moduleId="mod_invoice">
      <div className="container py-4">
        {!invoice ? (
          <div className="alert alert-warning d-flex align-items-center justify-content-between">
            <div>
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              Invoice with ID: <strong>{id}</strong> not found.
            </div>
            <Link href="/invoices" className="btn btn-sm btn-outline-dark">
              Return to Invoices
            </Link>
          </div>
        ) : (
          <React.Suspense fallback={<div className="text-center py-4 text-muted">Loading form...</div>}>
            <InvoiceForm mode="edit" initialData={invoice} />
          </React.Suspense>
        )}
      </div>
    </ModuleGuard>
  );
}
