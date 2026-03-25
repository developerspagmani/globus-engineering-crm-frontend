'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { useParams } from 'next/navigation';
import OutwardForm from '@/modules/outward/components/OutwardForm';
import ModuleGuard from '@/components/ModuleGuard';
import Breadcrumb from '@/components/Breadcrumb';

export default function EditOutwardPage() {
  const params = useParams();
  const id = params.id as string;
  
  const outward = useSelector((state: RootState) => 
    state.outward.items.find(o => o.id === id)
  );

  return (
    <ModuleGuard moduleId="mod_outward">
      <div className="container-fluid py-4">
        <Breadcrumb 
          items={[
            { label: 'Outward', href: '/outward' },
            { label: `Edit ${outward?.outwardNo || 'Entry'}`, active: true }
          ]} 
        />

        {!outward ? (
          <div className="alert alert-warning">
            Entry with ID: {id} not found.
          </div>
        ) : (
          <>
            <div className="mb-4">
              <h2 className="fw-bold mb-1">Edit Outward: {outward.outwardNo}</h2>
              <p className="text-muted small mb-0">Modify dispatch details for {outward.customerName}.</p>
            </div>
            <OutwardForm mode="edit" initialData={outward} />
          </>
        )}
      </div>
    </ModuleGuard>
  );
}
