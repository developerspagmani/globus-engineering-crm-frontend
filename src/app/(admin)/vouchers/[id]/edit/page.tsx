'use client';

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useRouter } from 'next/navigation';
import { RootState } from '@/redux/store';
import VoucherForm from '@/modules/voucher/components/VoucherForm';
import Breadcrumb from '@/components/Breadcrumb';

const EditVoucherPage = () => {
  const [mounted, setMounted] = useState(false);
  const { id } = useParams();
  const router = useRouter();

  const { items } = useSelector((state: RootState) => state.voucher);
  const voucher = items.find(item => item.id === id);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="content-area"></div>;

  if (!voucher) {
    return (
      <div className="content-area text-center py-5">
        <h4 className="fw-800 text-dark">Voucher Not Found</h4>
        <p className="text-muted">The voucher you are looking for does not exist.</p>
        <button className="btn btn-primary rounded-pill px-4 mt-3" onClick={() => router.push('/vouchers')}>
          Back to List
        </button>
      </div>
    );
  }

  return (
    <div className="content-area animate-fade-in">
      <div className="mb-4">
        <Breadcrumb
          items={[
            { label: 'Voucher System', href: '/vouchers' },
            { label: 'Edit Voucher', active: true }
          ]}
        />
        <h3 className="fw-800 tracking-tight text-dark mb-0 mt-2">Edit Voucher: {voucher.voucherNo}</h3>
        <p className="text-muted small mb-0">Update transaction details and narration.</p>
      </div>

      <div className="row justify-content-center">
        <div className="col-xl-12">
          <VoucherForm mode="edit" initialData={voucher} />
        </div>
      </div>
    </div>
  );
};

// Simple wrapper to fix hydration issues with nested forms
const SubAgentIdContextWrapper = ({ children, mounted }: { children: React.ReactNode, mounted: boolean }) => {
  if (!mounted) return null;
  return <>{children}</>;
};

export default EditVoucherPage;
