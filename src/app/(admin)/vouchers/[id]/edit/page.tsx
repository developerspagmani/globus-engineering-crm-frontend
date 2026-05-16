'use client';

import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { AppDispatch, RootState } from '@/redux/store';
import VoucherForm from '@/modules/voucher/components/VoucherForm';
import Link from 'next/link';
import BackButton from '@/components/BackButton';
import { fetchVouchers } from '@/redux/features/voucherSlice';
import Loader from '@/components/Loader';
import PageModeIndicator from '@/components/PageModeIndicator';

const EditVoucherPage = () => {
  const [mounted, setMounted] = useState(false);
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isEdit, setIsEdit] = useState(searchParams.get('edit') === 'true');
  const isReadOnly = searchParams.get('readonly') === 'true';

  const dispatch = useDispatch<AppDispatch>();
  const { company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items, loading } = useSelector((state: RootState) => state.voucher);
  const voucher = items.find(item => item.id === id);

  useEffect(() => {
    setMounted(true);
    if (items.length === 0 && activeCompany?.id && id) {
      dispatch(fetchVouchers({
        company_id: activeCompany.id,
        id: id as string
      }));
    }
  }, [dispatch, items.length, activeCompany?.id, id]);

  if (!mounted || loading || (items.length === 0 && !voucher)) {
    return (
      <div className="content-area d-flex align-items-center justify-content-center min-vh-100">
        <Loader text="Loading voucher details..." />
      </div>
    );
  }

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
        <BackButton />
        <div>
          <h2 className="fw-bold mb-0 text-dark">{isEdit ? 'Edit' : 'View'} Voucher: {voucher.voucherNo}</h2>
          <p className="text-muted small mb-0">{isEdit ? 'Update transaction details and narration.' : 'Review transaction details and narration.'}</p>
        </div>
        
        <div className="flex-grow-1"></div>

        {!isEdit && !isReadOnly && (
          <div className="ms-auto d-flex gap-2">
            <Link
              href={`/logistics-print?type=voucher&id=${voucher.id}&print=true`}
              className="btn btn-outline-dark d-flex align-items-center gap-2 px-4"
            >
              <i className="bi bi-printer"></i>
              <span>Print Voucher</span>
            </Link>
          </div>
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
