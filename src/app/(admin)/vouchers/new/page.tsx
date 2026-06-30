'use client';

import React from 'react';
import VoucherForm from '@/modules/voucher/components/VoucherForm';
import Breadcrumb from '@/components/Breadcrumb';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import Link from 'next/link';
import BackButton from '@/components/BackButton';

const NewVoucherPageContent = () => {
  const searchParams = useSearchParams();
  const customerId = searchParams.get('customerId');
  const invoiceId = searchParams.get('invoiceId');
  
  const vendorId = searchParams.get('vendorId');
  const partyTypeFromUrl = searchParams.get('partyType'); // 'vendor' or 'customer'
  const isVendorPayment = partyTypeFromUrl === 'vendor' && !!vendorId;

  const { items: invoices } = useSelector((state: RootState) => state.invoices);
  const { items: vendors } = useSelector((state: RootState) => state.vendors);

  const targetInvoice = invoices.find(inv => String(inv.id) === String(invoiceId));
  const targetVendor = isVendorPayment ? vendors.find((v: any) => String(v.id) === String(vendorId)) : null;

  const initialData = (targetInvoice || isVendorPayment) ? {
    partyId: isVendorPayment ? (vendorId || '') : (targetInvoice?.customerId || customerId || ''),
    partyName: isVendorPayment
      ? ((targetVendor as any)?.name || (targetVendor as any)?.company || '')
      : (targetInvoice?.customerName || ''),
    partyType: (isVendorPayment ? 'vendor' : 'customer') as 'vendor' | 'customer',
    amount: targetInvoice ? (targetInvoice.grandTotal - (targetInvoice.paidAmount || 0)) : 0,
    description: targetInvoice ? `Payment for Invoice #${targetInvoice.invoiceNumber}` : '',
    type: (isVendorPayment ? 'payment' : 'receipt') as 'payment' | 'receipt',
    date: new Date().toISOString().split('T')[0],
    voucherNo: '',
    paymentMode: 'bank' as const,
    status: 'draft' as const,
    company_id: targetInvoice?.company_id || '',
    referenceNo: targetInvoice ? String(targetInvoice.id) : ''
  } : undefined;

  const router = useRouter();

  return (
    <div className="content-area animate-fade-in">
      <div className="d-flex align-items-center mb-5 pb-2 border-bottom">
        <BackButton />
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
