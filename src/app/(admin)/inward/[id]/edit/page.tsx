'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { useParams } from 'next/navigation';
import InwardForm from '@/modules/inward/components/InwardForm';
import ModuleGuard from '@/components/ModuleGuard';
import Breadcrumb from '@/components/Breadcrumb';

import Link from 'next/link';

export default function EditInwardPage() {
  const params = useParams();
  const id = params.id as string;
  
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
              <Link href="/inward" className="btn btn-outline-secondary border-0 p-0 me-3" title="Back to Inward List">
                <i className="bi bi-arrow-left-circle fs-3 text-muted"></i>
              </Link>
              <div>
                <h2 className="fw-bold mb-0">Edit Inward: {inward.inwardNo}</h2>
                <p className="text-muted small mb-0">Modify receipt details for {inward.vendorName}.</p>
              </div>
            </div>
            <InwardForm mode="edit" initialData={inward} />
          </>
        )}
      </div>
    </ModuleGuard>
  );
}
