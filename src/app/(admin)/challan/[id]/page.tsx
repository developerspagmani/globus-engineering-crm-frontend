'use client';

import React from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import ChallanForm from '@/modules/challan/components/ChallanForm';
import ModuleGuard from '@/components/ModuleGuard';
import Loader from '@/components/Loader';
import { fetchChallans } from '@/redux/features/challanSlice';
import Link from 'next/link';
import PageModeIndicator from '@/components/PageModeIndicator';
import { checkActionPermission } from '@/config/permissions';

export default function ChallanDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const isEdit = searchParams.get('edit') === 'true';
  const { user, company: activeCompany } = useSelector((state: RootState) => state.auth);
  const [mounted, setMounted] = React.useState(false);

  const { items, loading } = useSelector((state: RootState) => state.challan);
  const challan = items.find(item => String(item.id) === String(id));

  React.useEffect(() => {
    setMounted(true);
    if (items.length === 0 && activeCompany?.id) {
      dispatch(fetchChallans({ 
        company_id: activeCompany.id,
        id: id as string 
      }) as any);
    }
  }, [dispatch, activeCompany?.id, items.length, id]);

  if (!mounted || loading || (items.length === 0 && !challan)) {
    return (
      <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center">
        <Loader text="Loading challan details..." />
      </div>
    );
  }

  if (!challan) {
    return (
      <div className="container-fluid py-5 text-center">
        <h4 className="fw-800 text-dark">Challan Not Found</h4>
        <p className="text-muted">The challan record you are looking for does not exist.</p>
        <button className="btn btn-primary rounded-pill px-4 mt-3" onClick={() => router.push('/challan')}>
          Back to Challans
        </button>
      </div>
    );
  }

  return (
    <ModuleGuard moduleId="mod_challan">
      <div className="container-fluid py-4 min-vh-100 bg-light-subtle px-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold mb-0 text-dark">{isEdit ? 'Edit' : 'View'} Challan: {challan.challanNo}</h2>
            <p className="text-muted small mb-0">Track and manage material movement details.</p>
          </div>
          
          <div className="flex-grow-1"></div>
          <div className="d-flex gap-2">
            <Link 
              href={`/logistics-print?type=challan&id=${challan.id}&print=true`}
              target="_blank"
              className="btn btn-outline-dark rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-2"
            >
              <i className="bi bi-printer"></i>
              <span>Print Challan</span>
            </Link>
            {!isEdit && checkActionPermission(user, 'mod_challan', 'edit') && (
              <button 
                onClick={() => router.push(`/challan/${id}?edit=true`)}
                className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-2"
              >
                <i className="bi bi-pencil-square"></i>
                <span>Edit Challan</span>
              </button>
            )}
          </div>
        </div>

        <div className="animate-fade-in">
          <ChallanForm mode={isEdit ? 'edit' : 'view'} initialData={challan} />
        </div>
      </div>
    </ModuleGuard>
  );
}
