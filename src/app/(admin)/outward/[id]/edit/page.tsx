'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { useParams } from 'next/navigation';
import OutwardForm from '@/modules/outward/components/OutwardForm';
import ModuleGuard from '@/components/ModuleGuard';
import Breadcrumb from '@/components/Breadcrumb';
import Link from 'next/link';

export default function EditOutwardPage() {
  const params = useParams();
  const id = params.id as string;
  
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
              <Link href="/outward" className="btn btn-outline-secondary border-0 p-0 me-3" title="Back to Outward List">
                <i className="bi bi-arrow-left-circle fs-3 text-muted"></i>
              </Link>
              <div>
                <h2 className="fw-bold mb-0">Edit Outward: {outward.outwardNo}</h2>
                <p className="text-muted small mb-0">Modify dispatch details for {outward.customerName}.</p>
              </div>
            </div>
            <OutwardForm mode="edit" initialData={outward} />
          </>
        )}
      </div>
    </ModuleGuard>
  );
}
