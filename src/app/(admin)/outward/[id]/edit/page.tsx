'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { useParams, useSearchParams } from 'next/navigation';
import OutwardForm from '@/modules/outward/components/OutwardForm';
import ModuleGuard from '@/components/ModuleGuard';
import Link from 'next/link';
import { checkActionPermission } from '@/config/permissions';

export default function EditOutwardPage() {
  const params = useParams();
  const id = params.id as string;
  const searchParams = useSearchParams();
  const [isEdit, setIsEdit] = React.useState(searchParams.get('edit') === 'true');
  
  const { user } = useSelector((state: RootState) => state.auth);
  const outward = useSelector((state: RootState) => 
    state.outward.items.find(o => o.id === id)
  );

  return (
    <ModuleGuard moduleId="mod_outward">
      <div className="container-fluid py-4">
        {!outward ? (
          <div className="alert alert-warning">
            Entry with ID: {id} not found.
          </div>
        ) : (
          <>
            <div className="d-flex align-items-center mb-5 pb-2 border-bottom">
              <Link href="/outward" className="back-btn-standard" title="Back to Outward List">
                <i className="bi bi-arrow-left fs-4"></i>
              </Link>
              <div>
                <h2 className="fw-bold mb-0">{isEdit ? 'Edit' : 'View'} Outward: {outward.outwardNo}</h2>
                <p className="text-muted small mb-0">{isEdit ? `Modify dispatch details for ${outward.customerName}.` : `Review dispatch details for ${outward.customerName}.`}</p>
              </div>
              {!isEdit && checkActionPermission(user, 'mod_outward', 'edit') && (
                <button 
                  className="btn btn-primary ms-auto d-flex align-items-center gap-2 px-4 shadow-accent"
                  onClick={() => setIsEdit(true)}
                >
                  <i className="bi bi-pencil-square"></i>
                  <span>Edit Entry</span>
                </button>
              )}
            </div>
            <OutwardForm mode={isEdit ? 'edit' : 'view'} initialData={outward} />
          </>
        )}
      </div>
    </ModuleGuard>
  );
}
