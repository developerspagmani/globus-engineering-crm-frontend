'use client';

import React from 'react';
import ChallanForm from '@/modules/challan/components/ChallanForm';
import Breadcrumb from '@/components/Breadcrumb';
import Link from 'next/link';

const NewChallanPage = () => {
  return (
    <div className="content-area animate-fade-in">
      <div className="d-flex align-items-center mb-5 pb-2 border-bottom">
        <Link href="/challan" className="btn btn-outline-secondary border-0 p-0 me-3" title="Back to Challan List">
          <i className="bi bi-arrow-left-circle fs-3 text-muted"></i>
        </Link>
        <div>
          <h2 className="fw-bold mb-0 text-dark">Generate Delivery Challan</h2>
          <p className="text-muted small mb-0">Create a new delivery/returnable challan for material movement.</p>
        </div>
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

