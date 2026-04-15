'use client';

import React from 'react';
import OutwardForm from '@/modules/outward/components/OutwardForm';
import ModuleGuard from '@/components/ModuleGuard';
import Breadcrumb from '@/components/Breadcrumb';
import Link from 'next/link';

export default function NewOutwardPage() {
  return (
    <ModuleGuard moduleId="mod_outward">
      <div className="container-fluid py-4">
        <div className="d-flex align-items-center mb-5 pb-2 border-bottom">
          <Link href="/outward" className="back-btn-standard" title="Back to Outward List">
            <i className="bi bi-arrow-left fs-4"></i>
          </Link>
          <div>
            <h2 className="fw-bold mb-0 text-dark">New Outward Entry</h2>
            <p className="text-muted small mb-0">Record product dispatch to customer.</p>
          </div>
        </div>

        <OutwardForm mode="create" />
      </div>
    </ModuleGuard>
  );
}
