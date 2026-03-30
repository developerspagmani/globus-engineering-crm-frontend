'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import Breadcrumb from '@/components/Breadcrumb';
import LeadForm from '@/modules/lead/components/LeadForm';
import Link from 'next/link';

export default function EditLeadPage() {
  const [mounted, setMounted] = useState(false);
  const { id } = useParams();
  const router = useRouter();

  const { items } = useSelector((state: RootState) => state.leads);
  const lead = items.find(item => item.id === id);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (!lead) {
    return (
      <div className="content-area text-center py-5">
        <h4 className="fw-800 text-dark">Lead Not Found</h4>
        <button className="btn btn-primary px-4 mt-3" onClick={() => router.push('/leads')}>
          Back to Leads
        </button>
      </div>
    );
  }

  return (
    <div className="content-area animate-fade-in">
      <div className="mb-4 d-flex align-items-center">
        <Link href="/leads" className="btn btn-outline-secondary border-0 p-0 me-3" title="Back to Leads">
          <i className="bi bi-arrow-left-circle fs-3 text-muted"></i>
        </Link>
        <div>
          <Breadcrumb 
            items={[
              { label: 'Lead Management', href: '/leads' },
              { label: 'Edit Prospect', active: true }
            ]} 
          />
          <h3 className="fw-800 tracking-tight text-dark mb-0 mt-2">Edit: {lead.company}</h3>
          <p className="text-muted small mb-0">Update contact logs or status for this prospect.</p>
        </div>
      </div>

      <div className="row justify-content-center">
        <div className="col-xl-12">
          <LeadForm mode="edit" initialData={lead} />
        </div>
      </div>
    </div>
  );
}
