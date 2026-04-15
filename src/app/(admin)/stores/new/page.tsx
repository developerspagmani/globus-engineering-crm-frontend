'use client';

import React from 'react';
import StoreForm from '@/modules/stores/components/StoreForm';
import ModuleGuard from '@/components/ModuleGuard';
import Link from 'next/link';

export default function NewStorePage() {
  return (
    <ModuleGuard moduleId="mod_lead">
      <div className="bg-white min-vh-100 p-4 animate-fade-in shadow-sm">
        <div className="mb-4 d-flex align-items-center gap-3 border-bottom pb-3">
          <Link href="/stores" className="back-btn-standard" title="Back to Stores">
            <i className="bi bi-arrow-left fs-3 text-muted"></i>
          </Link>
          <div>
            <h4 className="fw-800 tracking-tight text-dark mb-0">Add Store</h4>
            <p className="text-muted small mb-0">Register a new retail shop for field visits.</p>
          </div>
        </div>
        <StoreForm mode="create" />
      </div>
    </ModuleGuard>
  );
}
);
}
