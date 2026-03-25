'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { useParams } from 'next/navigation';
import InwardForm from '@/modules/inward/components/InwardForm';
import ModuleGuard from '@/components/ModuleGuard';
import Breadcrumb from '@/components/Breadcrumb';

export default function EditInwardPage() {
  const params = useParams();
  const id = params.id as string;
  
  const inward = useSelector((state: RootState) => 
    state.inward.items.find(i => i.id === id)
  );

  return (
    <ModuleGuard moduleId="mod_inward">
      <div className="container-fluid py-4">
        <Breadcrumb 
          items={[
            { label: 'Inward', href: '/inward' },
            { label: `Edit ${inward?.inwardNo || 'Entry'}`, active: true }
          ]} 
        />

        {!inward ? (
          <div className="alert alert-warning">
            Entry with ID: {id} not found.
          </div>
        ) : (
          <>
            <div className="mb-4">
              <h2 className="fw-bold mb-1">Edit Inward: {inward.inwardNo}</h2>
              <p className="text-muted small mb-0">Modify receipt details for {inward.vendorName}.</p>
            </div>
            <InwardForm mode="edit" initialData={inward} />
          </>
        )}
      </div>
    </ModuleGuard>
  );
}
