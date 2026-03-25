'use client';

import React from 'react';
import ChallanForm from '@/modules/challan/components/ChallanForm';
import Breadcrumb from '@/components/Breadcrumb';

const NewChallanPage = () => {
  return (
    <div className="content-area animate-fade-in">
      <div className="mb-4">
        <Breadcrumb
          items={[
            { label: 'Challan System', href: '/challan' },
            { label: 'New Challan', active: true }
          ]}
        />
        <h3 className="fw-800 tracking-tight text-dark mb-0 mt-2">Generate Delivery Challan</h3>
        <p className="text-muted small mb-0">Create a new delivery/returnable challan for material movement.</p>
      </div>

      <div className="row justify-content-center">
        <div className="col-xl-12">
          <ChallanForm mode="create" />
        </div>
      </div>
    </div>
  );
};

export default NewChallanPage;
