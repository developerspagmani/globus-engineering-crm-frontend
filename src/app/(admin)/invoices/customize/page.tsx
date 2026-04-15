'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { mockInvoices, mockCompanies } from '@/data/mockModules';
import InvoicePreview from '@/modules/invoice/components/InvoicePreview';
import InvoiceSettings from '@/modules/settings/components/InvoiceSettings';
import Breadcrumb from '@/components/Breadcrumb';
import Link from 'next/link';

const InvoiceCustomizePage = () => {
  const { company } = useSelector((state: RootState) => state.auth);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Use a sample invoice for preview
  const sampleInvoice = mockInvoices[0];
  const activeCompany = company || mockCompanies[0];

  return (
    <div className="content-area animate-fade-in">
      <div className="mb-4 d-flex justify-content-between align-items-end">
        <div>
          <Breadcrumb 
            items={[
              { label: 'Invoices', href: '/invoices' },
              { label: 'Template Customizer', active: true }
            ]} 
          />
          <h3 className="fw-900 tracking-tight text-dark mb-1 mt-2">Customize Invoice Template</h3>
          <p className="text-muted small">Real-time design and configuration of your industrial invoice template.</p>
        </div>
        <Link href="/invoices" className="btn btn-light rounded-pill px-4 btn-sm shadow-sm mb-1">
          <i className="bi bi-arrow-left me-2"></i> Back to Invoices
        </Link>
      </div>

      <div className="row g-4">
        {/* Left Side - Configuration Form */}
        <div className="col-xl-5 order-2 order-xl-1">
           <div className="animate-fade-in-up">
              <InvoiceSettings />
           </div>
        </div>

        {/* Right Side - Live Preview */}
        <div className="col-xl-7 order-1 order-xl-2">
          <div className="sticky-top" style={{ top: '100px', zIndex: 10 }}>
            <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="card-header bg-dark text-white py-3 px-4 d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                  <div className="spinner-grow spinner-grow-sm text-success" role="status"></div>
                  <span className="small fw-bold text-capitalize tracking-wider">Live Template Preview</span>
                </div>
                <div className="badge bg-primary rounded-pill">A4 Standard</div>
              </div>
              <div className="card-body bg-secondary bg-opacity-10 p-4 overflow-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
                <div className="preview-scale-wrapper">
                   <InvoicePreview invoice={sampleInvoice} company={activeCompany} hideControls={true} />
                </div>
              </div>
            </div>
            
            <div className="mt-3 p-3 bg-primary bg-opacity-10 rounded-4 border border-primary border-opacity-25 d-flex align-items-start gap-3">
              <i className="bi bi-info-circle-fill text-primary fs-4"></i>
              <div>
                <div className="fw-bold text-primary small">Design Tip</div>
                <div className="text-muted x-small">The preview above reflects how your customers will see the invoice. Changes in the left panel reflect here immediately.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .preview-scale-wrapper {
          transform-origin: top center;
          width: 100%;
        }
        
        /* Adjusting internal invoice layout for preview mode */
        :global(.invoice-container) {
          margin-bottom: 0 !important;
          transform: scale(0.95);
          transform-origin: top center;
        }

        @media (max-width: 1400px) {
           :global(.invoice-container) {
            transform: scale(0.85);
          }
        }
      `}</style>
    </div>
  );
};

export default InvoiceCustomizePage;
