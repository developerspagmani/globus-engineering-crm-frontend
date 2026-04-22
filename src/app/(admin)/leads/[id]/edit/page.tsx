'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import Breadcrumb from '@/components/Breadcrumb';
import LeadForm from '@/modules/lead/components/LeadForm';
import Link from 'next/link';
import { checkActionPermission } from '@/config/permissions';

export default function EditLeadPage() {
  const [mounted, setMounted] = useState(false);
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isEdit, setIsEdit] = useState(searchParams.get('edit') === 'true');

  const { user } = useSelector((state: RootState) => state.auth);
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
      <div className="mb-4 d-flex align-items-center border-bottom pb-3">
        <Link href="/leads" className="btn btn-outline-secondary border-0 p-0 me-3" title="Back to Leads">
          <i className="bi bi-arrow-left fs-3 text-muted"></i>
        </Link>
        <div>
          <Breadcrumb 
            items={[
              { label: 'Lead Management', href: '/leads' },
              { label: isEdit ? 'Edit Prospect' : 'View Prospect', active: true }
            ]} 
          />
          <h3 className="fw-800 tracking-tight text-dark mb-0 mt-2">{isEdit ? 'Edit' : 'View'}: {lead.company}</h3>
          <p className="text-muted small mb-0">{isEdit ? 'Update contact logs or status for this prospect.' : 'Review contact logs or status for this prospect.'}</p>
        </div>
        {!isEdit && checkActionPermission(user, 'mod_lead', 'edit') && (
          <button 
            className="btn btn-primary ms-auto d-flex align-items-center gap-2 px-4 shadow-accent"
            onClick={() => setIsEdit(true)}
          >
            <i className="bi bi-pencil-square"></i>
            <span>Edit Prospect</span>
          </button>
        )}
      </div>

      <div className="row justify-content-center">
        <div className="col-xl-12">
          <LeadForm mode={isEdit ? 'edit' : 'view'} initialData={lead} />
        </div>
      </div>
    </div>
  );
}
