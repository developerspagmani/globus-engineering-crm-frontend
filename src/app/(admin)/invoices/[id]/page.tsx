'use client';

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { useParams } from 'next/navigation';
import { fetchInvoices } from '@/redux/features/invoiceSlice';
import InvoicePreview from '@/modules/invoice/components/InvoicePreview';
import ModuleGuard from '@/components/ModuleGuard';
import Link from 'next/link';

export default function InvoiceDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const dispatch = useDispatch();

  const { items: invoices, loading: invoiceLoading } = useSelector((state: RootState) => state.invoices);
  const { company } = useSelector((state: RootState) => state.auth);

  const invoice = invoices.find(inv => inv.id === id);

  React.useEffect(() => {
    if (!invoice && !invoiceLoading && company?.id) {
      dispatch(fetchInvoices({ company_id: company.id }) as any);
    }
  }, [invoice, invoiceLoading, company?.id, dispatch]);

  if (invoiceLoading && !invoice) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-secondary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading invoice details...</p>
      </div>
    );
  }

  return (
    <ModuleGuard moduleId="mod_invoice">
      <div className="container py-4">


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
