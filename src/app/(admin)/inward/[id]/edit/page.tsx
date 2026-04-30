'use client';

import React from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { fetchInwards } from '@/redux/features/inwardSlice';
import InwardForm from '@/modules/inward/components/InwardForm';
import ModuleGuard from '@/components/ModuleGuard';
import Link from 'next/link';
import { checkActionPermission } from '@/config/permissions';
import Loader from '@/components/Loader';

export default function EditInwardPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const dispatch = useDispatch();
  const [isEdit, setIsEdit] = React.useState(searchParams.get('edit') === 'true');
  const isReadOnly = searchParams.get('readonly') === 'true';
  const router = useRouter()
  const { user, company } = useSelector((state: RootState) => state.auth);
  const { items: inwards, loading } = useSelector((state: RootState) => state.inward);
  const inward = inwards.find(i => i.id === id);

  React.useEffect(() => {
    if (company?.id) {
      (dispatch as any)(fetchInwards(company.id));
    }
  }, [dispatch, company?.id]);

  return (
    <ModuleGuard moduleId="mod_inward">
      <div className="container-fluid py-4">
        {loading ? (
           <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
             <Loader text="Loading Record Details..." />
           </div>
        ) : !inward ? (
          <div className="alert alert-warning">
            Entry with ID: {id} not found.
          </div>
        ) : (
          <>
            <div className="d-flex align-items-center mb-5 pb-2 border-bottom">
              <Link href="/inward" className="back-btn-standard" title="Back to Inward List">
                <i className="bi bi-arrow-left fs-4"></i>
              </Link>
              <div>
                <h2 className="fw-bold mb-0">{isEdit ? 'Edit' : 'View'} Inward: {inward.inwardNo || (inward as any).dcNo}</h2>
                <p className="text-muted small mb-0">{isEdit ? `Modify receipt details for ${inward.customerName}.` : `Review receipt details for ${inward.customerName}.`}</p>
              </div>
              {!isEdit && !isReadOnly && checkActionPermission(user, 'mod_inward', 'edit') && (
                <button
                  className="btn btn-primary ms-auto d-flex align-items-center gap-2 px-4 shadow-accent"
                  onClick={() => setIsEdit(true)}
                >
                  <i className="bi bi-pencil-square"></i>
                  <span>Edit Entry</span>
                </button>
              )}
            </div>
            <InwardForm mode={isEdit ? 'edit' : 'view'} initialData={inward} />
          </>
        )}
      </div>
    </ModuleGuard>
  );
}
