'use client';

import React from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import VoucherForm from '@/modules/voucher/components/VoucherForm';
import ModuleGuard from '@/components/ModuleGuard';
import Loader from '@/components/Loader';
import { fetchVouchers } from '@/redux/features/voucherSlice';
import Link from 'next/link';

const VoucherDetailPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const isEdit = searchParams.get('edit') === 'true';
  const { company: activeCompany } = useSelector((state: RootState) => state.auth);
  const [mounted, setMounted] = React.useState(false);

  const { items, loading } = useSelector((state: RootState) => state.voucher);
  const voucher = items.find(item => String(item.id) === String(id));

  React.useEffect(() => {
    setMounted(true);
    if (items.length === 0 && activeCompany?.id) {
      dispatch(fetchVouchers({ 
        company_id: activeCompany.id,
        id: id as string 
      }) as any);
    }
  }, [dispatch, activeCompany?.id, items.length, id]);

  if (!mounted || loading || (items.length === 0 && !voucher)) {
    return (
      <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center">
        <Loader text="Loading voucher details..." />
      </div>
    );
  }

  if (!voucher) {
    return (
      <div className="container-fluid py-5 text-center">
        <h4 className="fw-800 text-dark">Voucher Not Found</h4>
        <p className="text-muted">The voucher you are looking for does not exist.</p>
        <button className="btn btn-primary rounded-pill px-4 mt-3" onClick={() => router.push('/vouchers')}>
          Back to Vouchers
        </button>
      </div>
    );
  }

  return (
    <ModuleGuard moduleId="mod_voucher">
      <div className="container-fluid py-4 min-vh-100 bg-light-subtle px-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold mb-0 text-dark">{isEdit ? 'Edit' : 'View'} Voucher: {voucher.voucherNo}</h2>
            <p className="text-muted small mb-0">Manage and preview payment voucher details.</p>
          </div>
          <div className="d-flex gap-2">
            <Link 
              href={`/logistics-print?type=voucher&id=${voucher.id}&print=true`}
              target="_blank"
              className="btn btn-outline-dark rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-2"
            >
              <i className="bi bi-printer"></i>
              <span>Print Voucher</span>
            </Link>
            {!isEdit && (
              <button 
                onClick={() => router.push(`/vouchers/${id}?edit=true`)}
                className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-2"
              >
                <i className="bi bi-pencil"></i>
                <span>Edit Voucher</span>
              </button>
            )}
          </div>
        </div>

        <div className="animate-fade-in">
          <VoucherForm mode={isEdit ? 'edit' : 'view'} initialData={voucher} />
        </div>
      </div>
    </ModuleGuard>
  );
};

export default VoucherDetailPage;
