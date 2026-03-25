'use client';

import React from 'react';
import OutwardForm from '@/modules/outward/components/OutwardForm';
import ModuleGuard from '@/components/ModuleGuard';
import Breadcrumb from '@/components/Breadcrumb';

export default function NewOutwardPage() {
  return (
    <ModuleGuard moduleId="mod_outward">
      <div className="container-fluid py-4">
        <Breadcrumb 
          items={[
            { label: 'Outward', href: '/outward' },
            { label: 'New Entry', active: true }
          ]} 
        />

        <div className="mb-4">
          <h2 className="fw-bold mb-1 text-dark">New Outward Entry</h2>
          <p className="text-muted small mb-0">Record product dispatch to customer.</p>
        </div>

        <OutwardForm mode="create" />
      </div>
    </ModuleGuard>
  );
}
