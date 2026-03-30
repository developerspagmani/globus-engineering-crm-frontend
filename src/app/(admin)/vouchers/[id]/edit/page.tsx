'use client';

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useRouter } from 'next/navigation';
import { RootState } from '@/redux/store';
import VoucherForm from '@/modules/voucher/components/VoucherForm';
import Breadcrumb from '@/components/Breadcrumb';
import Link from 'next/link';

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
      <div className="d-flex align-items-center mb-5 pb-2 border-bottom">
        <Link href="/vouchers" className="btn btn-outline-secondary border-0 p-0 me-3" title="Back to Voucher List">
          <i className="bi bi-arrow-left-circle fs-3 text-muted"></i>
        </Link>
        <div>
          <h2 className="fw-bold mb-0 text-dark">Edit Voucher: {voucher.voucherNo}</h2>
          <p className="text-muted small mb-0">Update transaction details and narration.</p>
        </div>
      </div>

      <div className="row justify-content-center">
        <div className="col-xl-12">
          <VoucherForm mode="edit" initialData={voucher} />
        </div>
      </div>
    </div>
  );
};

export default EditVoucherPage;
