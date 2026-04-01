'use client';

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { RootState } from '@/redux/store';
import VoucherForm from '@/modules/voucher/components/VoucherForm';
import Link from 'next/link';

const EditVoucherPage = () => {
  const [mounted, setMounted] = useState(false);
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isEdit, setIsEdit] = useState(false);
  const isReadOnly = searchParams.get('readonly') === 'true';

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
          <h2 className="fw-bold mb-0 text-dark">{isEdit ? 'Edit' : 'View'} Voucher: {voucher.voucherNo}</h2>
          <p className="text-muted small mb-0">{isEdit ? 'Update transaction details and narration.' : 'Review transaction details and narration.'}</p>
        </div>
        {!isEdit && !isReadOnly && (
          <button 
            className="btn btn-primary ms-auto d-flex align-items-center gap-2 px-4 shadow-accent"
            onClick={() => setIsEdit(true)}
          >
            <i className="bi bi-pencil-square"></i>
            <span>Edit Voucher</span>
          </button>
        )}
      </div>

      <div className="row justify-content-center">
        <div className="col-xl-12">
          <VoucherForm mode={isEdit ? 'edit' : 'view'} initialData={voucher} />
        </div>
      </div>
    </div>
  );
};

export default EditVoucherPage;
