'use client';

import React from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import OutwardForm from '@/modules/outward/components/OutwardForm';
import ModuleGuard from '@/components/ModuleGuard';
import Loader from '@/components/Loader';
import { fetchOutwards } from '@/redux/features/outwardSlice';
import Link from 'next/link';

export default function OutwardDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const isEdit = searchParams.get('edit') === 'true';
  const { company: activeCompany } = useSelector((state: RootState) => state.auth);
  const [mounted, setMounted] = React.useState(false);

  const { items, loading } = useSelector((state: RootState) => state.outward);
  const outward = items.find(item => String(item.id) === String(id));

  React.useEffect(() => {
    setMounted(true);
    if (items.length === 0 && activeCompany?.id) {
      dispatch(fetchOutwards({ 
        company_id: activeCompany.id,
        id: id as string 
      }) as any);
    }
  }, [dispatch, activeCompany?.id, items.length, id]);

  if (!mounted || loading || (items.length === 0 && !outward)) {
    return (
      <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center">
        <Loader text="Loading outward details..." />
      </div>
    );
  }

  if (!outward) {
    return (
      <div className="container-fluid py-5 text-center">
        <h4 className="fw-800 text-dark">Outward Not Found</h4>
        <p className="text-muted">The outward record you are looking for does not exist.</p>
        <button className="btn btn-primary rounded-pill px-4 mt-3" onClick={() => router.push('/outward')}>
          Back to Outwards
        </button>
      </div>
    );
  }

  return (
    <ModuleGuard moduleId="mod_outward">
      <div className="container-fluid py-4 min-vh-100 bg-light-subtle px-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold mb-0 text-dark">{isEdit ? 'Edit' : 'View'} Outward: {outward.outwardNo}</h2>
            <p className="text-muted small mb-0">Track material dispatches and outward logistics.</p>
          </div>
          <div className="d-flex gap-2">
            <Link 
              href={`/logistics-print?type=outward&id=${outward.id}&print=true`}
              target="_blank"
              className="btn btn-outline-dark rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-2"
            >
              <i className="bi bi-printer"></i>
              <span>Print Outward</span>
            </Link>
            {!isEdit && (
              <button 
                onClick={() => router.push(`/outward/${id}?edit=true`)}
                className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-2"
              >
                <i className="bi bi-pencil"></i>
                <span>Edit Outward</span>
              </button>
            )}
          </div>
        </div>

        <div className="animate-fade-in">
          <OutwardForm mode={isEdit ? 'edit' : 'view'} initialData={outward} />
        </div>
      </div>
    </ModuleGuard>
  );
}
