'use client';

import React, { Suspense } from 'react';
import OutwardForm from '@/modules/outward/components/OutwardForm';
import ModuleGuard from '@/components/ModuleGuard';
import Breadcrumb from '@/components/Breadcrumb';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function NewOutwardFormContainer() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') as 'customer' | 'vendor' | null;

  return (
    <div className="container-fluid py-4">
      <div className="d-flex align-items-center mb-5 pb-2 border-bottom">
        <Link href={`/outward${type ? `?type=${type}` : ''}`} className="back-btn-standard" title="Back to Outward List">
          <i className="bi bi-arrow-left fs-4"></i>
        </Link>
        <div>
          <h2 className="fw-bold mb-0 text-dark text-capitalize">
            {type === 'customer' ? 'New Outward Entry (Customer)' : type === 'vendor' ? 'New Outward Entry (Vendor)' : 'New Outward Entry'}
          </h2>
        </div>
      </div>

      <OutwardForm mode="create" initialPartyType={type} />
    </div>
  );
}

export default function NewOutwardPage() {
  return (
    <ModuleGuard moduleId="mod_outward">
      <Suspense fallback={<div>Loading...</div>}>
        <NewOutwardFormContainer />
      </Suspense>
    </ModuleGuard>
  );
}
