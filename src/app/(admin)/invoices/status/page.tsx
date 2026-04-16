'use client';

import React from 'react';
import InvoiceStatus from '@/modules/invoice/components/InvoiceStatus';
import Breadcrumb from '@/components/Breadcrumb';

const InvoiceStatusPage = () => {
  return (
    <div className="content-area">
      <div className="container-fluid p-0">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h4 className="fw-800 text-dark mb-1">Invoice Status Tracking</h4>
            <Breadcrumb 
              items={[
                { label: 'Invoices', path: '/invoices' },
                { label: 'Status Tracking', active: true }
              ]} 
            />
          </div>
        </div>

        <InvoiceStatus />
      </div>
    </div>
  );
};

export default InvoiceStatusPage;
