'use client';

import React from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import InwardForm from '@/modules/inward/components/InwardForm';
import ModuleGuard from '@/components/ModuleGuard';
import Loader from '@/components/Loader';
import { fetchInwards } from '@/redux/features/inwardSlice';
import Link from 'next/link';
import PageModeIndicator from '@/components/PageModeIndicator';

export default function InwardDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const isEdit = searchParams.get('edit') === 'true';
  const { company: activeCompany } = useSelector((state: RootState) => state.auth);
  const [mounted, setMounted] = React.useState(false);

  const { items, loading } = useSelector((state: RootState) => state.inward);
  const inward = items.find(item => String(item.id) === String(id));

  React.useEffect(() => {
    setMounted(true);
    if (items.length === 0 && activeCompany?.id) {
      dispatch(fetchInwards({ 
        company_id: activeCompany.id,
        id: id as string 
      }) as any);
    }
  }, [dispatch, activeCompany?.id, items.length, id]);

  if (!mounted || loading || (items.length === 0 && !inward)) {
    return (
      <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center">
        <Loader text="Loading inward details..." />
      </div>
    );
  }

  if (!inward) {
    return (
      <div className="container-fluid py-5 text-center">
        <h4 className="fw-800 text-dark">Inward Not Found</h4>
        <p className="text-muted">The inward record you are looking for does not exist.</p>
        <button className="btn btn-primary rounded-pill px-4 mt-3" onClick={() => router.push('/inward')}>
          Back to Inwards
        </button>
      </div>
    );
  }

  return (
    <ModuleGuard moduleId="mod_inward">
      <div className="container-fluid py-4 min-vh-100 bg-light-subtle px-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold mb-0 text-dark">{isEdit ? 'Edit' : 'View'} Inward: {inward.inwardNo}</h2>
            <p className="text-muted small mb-0">Review material receipts and inward logistics.</p>
          </div>
          
          <div className="flex-grow-1"></div>
          <div className="d-flex gap-2">
            <Link 
              href={`/logistics-print?type=inward&id=${inward.id}&print=true`}
              target="_blank"
              className="btn btn-outline-dark rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-2"
            >
              <i className="bi bi-printer"></i>
              <span>Print Inward</span>
            </Link>
          </div>
        </div>

        <div className="animate-fade-in">
          <InwardForm mode={isEdit ? 'edit' : 'view'} initialData={inward} />
        </div>
      </div>
    </ModuleGuard>
  );
}
