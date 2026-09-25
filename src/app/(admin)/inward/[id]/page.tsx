'use client';

import React from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import InwardForm from '@/modules/inward/components/InwardForm';
import ModuleGuard from '@/components/ModuleGuard';
import Loader from '@/components/Loader';
import { fetchInwards, fetchInwardById, cancelInward } from '@/redux/features/inwardSlice';
import ConfirmationModal from '@/components/ConfirmationModal';
import Link from 'next/link';
import PageModeIndicator from '@/components/PageModeIndicator';
import { checkActionPermission } from '@/config/permissions';

export default function InwardDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const isEdit = searchParams.get('edit') === 'true';
  const { user, company: activeCompany } = useSelector((state: RootState) => state.auth);
  const [mounted, setMounted] = React.useState(false);

  const { items, loading } = useSelector((state: RootState) => state.inward);
  const inward = items.find(item => String(item.id) === String(id));
  const [cancelling, setCancelling] = React.useState(false);
  const [showCancelModal, setShowCancelModal] = React.useState(false);

  const handleCancelConfirm = async () => {
    setCancelling(true);
    try {
      await dispatch(cancelInward(String(id)) as any).unwrap();
      window.alert('Inward cancelled and return challan generated successfully');
    } catch (err: any) {
      window.alert(err || 'Failed to cancel inward');
    } finally {
      setCancelling(false);
    }
  };

  React.useEffect(() => {
    setMounted(true);
    if (!inward && id) {
      dispatch(fetchInwardById(String(id)) as any);
    }
  }, [dispatch, inward, id]);

  if (!mounted || loading || (!inward && items.length === 0)) {
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
              <span>Print {inward.status === 'cancelled' ? 'Return Challan' : 'Inward'}</span>
            </Link>
            {!isEdit && inward.status === 'pending' && checkActionPermission(user, 'mod_inward', 'edit') && (
              <button 
                onClick={() => setShowCancelModal(true)}
                disabled={cancelling}
                className="btn btn-danger rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-2"
              >
                <i className="bi bi-x-circle"></i>
                <span>{cancelling ? 'Cancelling...' : 'Cancel Inward'}</span>
              </button>
            )}
            {!isEdit && checkActionPermission(user, 'mod_inward', 'edit') && (
              <button 
                onClick={() => router.push(`/inward/${id}?edit=true`)}
                className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-2"
              >
                <i className="bi bi-pencil-square"></i>
                <span>Edit Inward</span>
              </button>
            )}
          </div>
        </div>

        <div className="animate-fade-in">
          <InwardForm mode={isEdit ? 'edit' : 'view'} initialData={inward} />
        </div>

        <ConfirmationModal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          onConfirm={handleCancelConfirm}
          title="Cancel Inward"
          message="Are you sure you want to cancel this inward? A return challan will be automatically generated."
          confirmLabel="Yes, Cancel"
          type="danger"
        />
      </div>
    </ModuleGuard>
  );
}
