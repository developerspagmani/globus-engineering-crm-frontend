'use client';

import React from 'react';
import Breadcrumb from '@/components/Breadcrumb';
import LeadForm from '@/modules/lead/components/LeadForm';

export default function NewLeadPage() {
  return (
    <div className="content-area animate-fade-in">
      <div className="mb-4">
        <Breadcrumb 
          items={[
            { label: 'Lead Management', href: '/leads' },
            { label: 'Register Enquiry', active: true }
          ]} 
        />
        <h3 className="fw-800 tracking-tight text-dark mb-0 mt-2">New Industrial Prospect</h3>
        <p className="text-muted small mb-0">Record initial enquiry details for engineering projects.</p>
      </div>

      <div className="row justify-content-center">
        <div className="col-xl-12">
          <LeadForm mode="create" />
        </div>
      </div>
    </div>
  );
}
