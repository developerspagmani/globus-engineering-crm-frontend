'use client';

import React, { Suspense } from 'react';
import InwardForm from '@/modules/inward/components/InwardForm';
import ModuleGuard from '@/components/ModuleGuard';
import Breadcrumb from '@/components/Breadcrumb';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function NewInwardFormContainer() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') as 'customer' | 'vendor' | null;

  return (
    <div className="container-fluid py-4">
      <div className="d-flex align-items-center mb-5 pb-2 border-bottom">
        <Link href={`/inward${type ? `?type=${type}` : ''}`} className="back-btn-standard" title="Back to Inward List">
          <i className="bi bi-arrow-left fs-4"></i>
        </Link>
        <div>
          <h2 className="fw-bold mb-0 text-dark text-capitalize">
            {type === 'customer' ? 'New Inward Entry (Customer)' : type === 'vendor' ? 'New Inward Entry (Vendor)' : 'New Inward Entry'}
          </h2>
        </div>
      </div>

      <InwardForm mode="create" initialPartyType={type} />
    </div>
  );
}

export default function NewInwardPage() {
  return (
    <ModuleGuard moduleId="mod_inward">
      <Suspense fallback={<div>Loading...</div>}>
        <NewInwardFormContainer />
      </Suspense>
    </ModuleGuard>
  );
}

