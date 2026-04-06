'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import InwardForm from '@/modules/inward/components/InwardForm';
import ModuleGuard from '@/components/ModuleGuard';
import Link from 'next/link';
import { checkActionPermission } from '@/config/permissions';

export default function EditInwardPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const [isEdit, setIsEdit] = React.useState(false);
  const isReadOnly = searchParams.get('readonly') === 'true';
  const router = useRouter()
  const { user } = useSelector((state: RootState) => state.auth);
  const inward = useSelector((state: RootState) =>
    state.inward.items.find(i => i.id === id)
  );

  return (
    <ModuleGuard moduleId="mod_inward">
      <div className="container-fluid py-4">
        {!inward ? (
          <div className="alert alert-warning">
            Entry with ID: {id} not found.
          </div>
        ) : (
          <>
            <div className="d-flex align-items-center mb-5 pb-2 border-bottom">
              <button
                onClick={() => router.back()}
                className="btn btn-outline-secondary border-0 p-0 me-3"
                title="Back to Previous Page"
              >
                <i className="bi bi-arrow-left-circle fs-3 text-muted"></i>
              </button>
              <div>
                <h2 className="fw-bold mb-0">{isEdit ? 'Edit' : 'View'} Inward: {inward.inwardNo}</h2>
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
