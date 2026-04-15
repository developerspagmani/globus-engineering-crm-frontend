'use client';

import React from 'react';
import InwardForm from '@/modules/inward/components/InwardForm';
import ModuleGuard from '@/components/ModuleGuard';
import Breadcrumb from '@/components/Breadcrumb';
import Link from 'next/link';

export default function NewInwardPage() {
  return (
    <ModuleGuard moduleId="mod_inward">
      <div className="container-fluid py-4">
        <div className="d-flex align-items-center mb-5 pb-2 border-bottom">
          <Link href="/inward" className="back-btn-standard" title="Back to Inward List">
            <i className="bi bi-arrow-left fs-4"></i>
          </Link>
          <div>
            <h2 className="fw-bold mb-0 text-dark">New Inward Entry</h2>
            <p className="text-muted small mb-0">Record material receipt from vendor.</p>
          </div>
        </div>

        <InwardForm mode="create" />
      </div>
    </ModuleGuard>
  );
}

