'use client';

import React from 'react';
import InwardForm from '@/modules/inward/components/InwardForm';
import ModuleGuard from '@/components/ModuleGuard';
import Breadcrumb from '@/components/Breadcrumb';

export default function NewInwardPage() {
  return (
    <ModuleGuard moduleId="mod_inward">
      <div className="container-fluid py-4">
        <Breadcrumb 
          items={[
            { label: 'Inward', href: '/inward' },
            { label: 'New Entry', active: true }
          ]} 
        />

        <div className="mb-4">
          <h2 className="fw-bold mb-1 text-dark">New Inward Entry</h2>
          <p className="text-muted small mb-0">Record material receipt from vendor.</p>
        </div>

        <InwardForm mode="create" />
      </div>
    </ModuleGuard>
  );
}
