'use client';

import React from 'react';
import VoucherForm from '@/modules/voucher/components/VoucherForm';
import Breadcrumb from '@/components/Breadcrumb';
import { useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

const NewVoucherPage = () => {
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
    referenceNo: `INV-${targetInvoice.invoiceNumber}`
  } : undefined;

  return (
    <div className="content-area animate-fade-in">
      <div className="mb-4">
        <Breadcrumb 
          items={[
            { label: 'Voucher System', href: '/vouchers' },
            { label: 'New Voucher', active: true }
          ]} 
        />
        <h3 className="fw-800 tracking-tight text-dark mb-0 mt-2">Create New Voucher</h3>
        <p className="text-muted small mb-0">Record a new payment, receipt, or journal entry.</p>
      </div>

      <div className="row justify-content-center">
        <div className="col-xl-10">
          <VoucherForm mode="create" initialData={initialData as any} />
        </div>
      </div>
    </div>
  );
};

export default NewVoucherPage;
