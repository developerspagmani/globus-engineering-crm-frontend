'use client';

import React from 'react';
import VoucherForm from '@/modules/voucher/components/VoucherForm';
import Breadcrumb from '@/components/Breadcrumb';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import Link from 'next/link';

const NewVoucherPageContent = () => {
  const searchParams = useSearchParams();
  const customerId = searchParams.get('customerId');
  const invoiceId = searchParams.get('invoiceId');
  
  const { items: invoices } = useSelector((state: RootState) => state.invoices);
  const targetInvoice = invoices.find(inv => inv.id === invoiceId);

  const initialData = targetInvoice ? {
    partyId: targetInvoice.customerId,
    partyName: targetInvoice.customerName,
    partyType: 'customer' as const,
    amount: targetInvoice.grandTotal - (targetInvoice.paidAmount || 0),
    description: `Payment for Invoice #${targetInvoice.invoiceNumber}`,
    type: 'receipt' as const,
    date: new Date().toISOString().split('T')[0],
    voucherNo: `VCH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    paymentMode: 'bank' as const,
    status: 'draft' as const,
    company_id: targetInvoice.company_id,
    referenceNo: String(targetInvoice.id)
  } : undefined;

  const router = useRouter();

  return (
    <div className="content-area animate-fade-in">
      <div className="d-flex align-items-center mb-5 pb-2 border-bottom">
        <button 
          onClick={() => router.back()} 
          className="btn btn-outline-secondary border-0 p-0 me-3" 
          title="Back to Previous Page"
        >
          <i className="bi bi-arrow-left-circle fs-3 text-muted"></i>
        </button>
        <div>
          <h2 className="fw-bold mb-0 text-dark">Create New Voucher</h2>
          <p className="text-muted small mb-0">Record a new payment, receipt, or journal entry.</p>
        </div>
      </div>

      <div className="row justify-content-center">
        <div className="col-xl-10">
          <VoucherForm mode="create" initialData={initialData as any} />
        </div>
      </div>
    </div>
  );
};

const NewVoucherPage = () => {
  return (
    <React.Suspense fallback={<div className="p-5 text-center">Initializing interface...</div>}>
      <NewVoucherPageContent />
    </React.Suspense>
  );
};

export default NewVoucherPage;
