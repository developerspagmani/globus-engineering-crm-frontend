'use client';

import React, { useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { Invoice, Company } from '@/types/modules';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import IndustrialInvoice from './IndustrialInvoice';
import { updateInvoiceSettings } from '@/redux/features/invoiceSlice';

interface InvoicePreviewProps {
  invoice: Invoice;
  company: Company | null;
  hideControls?: boolean;
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoice, company, hideControls = false }) => {
  const dispatch = useDispatch();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const { settings } = useSelector((state: RootState) => state.invoices);
  const searchParams = useSearchParams();
  const isReadOnly = searchParams.get('readonly') === 'true';
  const router = useRouter();

  const handlePrint = () => {
    window.print();
  };

  React.useEffect(() => {
    if (searchParams.get('print') === 'true') {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [searchParams]);

  const toggleDeclaration = () => {
    dispatch(updateInvoiceSettings({ showDeclaration: !settings.showDeclaration }));
  };

  const accentColor = settings.accentColor || '#0d6efd';

  return (
    <div className="invoice-preview-wrapper">
      {!hideControls && (
        <div className="preview-controls no-print d-flex justify-content-between align-items-center mb-4 p-3 bg-white rounded-4 shadow-sm border mx-auto" style={{ maxWidth: '1000px' }}>
          <div className="d-flex align-items-center gap-3">
            <button
              onClick={() => router.back()}
              className="btn btn-light rounded-circle border-0 d-flex align-items-center justify-content-center"
              style={{ width: '40px', height: '40px' }}
              title="Back"
            >
              <i className="bi bi-chevron-left"></i>
            </button>
            <h4 className="m-0 fw-bold text-dark">Invoice Preview</h4>

            <div className="declaration-toggle-wrapper ms-3">
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.showDeclaration}
                  onChange={toggleDeclaration}
                />
                <span className="slider round"></span>
                <span className="label-text">Declaration</span>
              </label>
            </div>
          </div>

          <div className="d-flex gap-2">
            {!isReadOnly && (
              <Link href={`/invoices/${invoice.id}/edit`} className="btn btn-outline-secondary d-flex align-items-center gap-2 px-3 fw-semibold rounded-pill">
                <i className="bi bi-pencil"></i> Edit
              </Link>
            )}
            <button className="btn btn-outline-dark d-flex align-items-center gap-2 px-3 fw-semibold rounded-pill" onClick={handlePrint}>
              <i className="bi bi-printer"></i> Print
            </button>
            <button className="btn btn-primary d-flex align-items-center gap-2 px-4 fw-bold rounded-pill shadow-sm" style={{ backgroundColor: accentColor, borderColor: accentColor }} onClick={handlePrint}>
              <i className="bi bi-filetype-pdf"></i> Export PDF
            </button>
          </div>
        </div>
      )}

      <div ref={invoiceRef} className="print-area">
        <IndustrialInvoice invoice={invoice} company={company} settings={settings} />
      </div>

      <style jsx>{`
        .invoice-preview-wrapper {
          background-color: #f1f5f9;
          min-height: 100vh;
          padding: 20px 0;
        }
        .preview-controls {
           width: 100%;
           z-index: 1000;
        }
        .switch {
          position: relative;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          user-select: none;
        }
        .switch input { display: none; }
        .slider {
          position: relative;
          width: 46px;
          height: 24px;
          background-color: #e4e4e7;
          border-radius: 34px;
          transition: 0.3s;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          border-radius: 50%;
          transition: 0.3s;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        input:checked + .slider { background-color: #0d6efd; }
        input:checked + .slider:before { transform: translateX(22px); }
        .label-text { font-size: 14px; font-weight: 600; color: #3f3f46; }

        @media print {
          @page { 
            size: A4; 
            margin: 0 !important; 
          }
          
          /* Hide everything first */
          body * {
            visibility: hidden !important;
          }
          
          /* Show only the invoice preview and its children */
          .invoice-preview-wrapper, .invoice-preview-wrapper * {
            visibility: visible !important;
          }
          
          /* Position it at the top-left */
          .invoice-preview-wrapper {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            display: block !important;
          }
          
          .no-print, .preview-controls, .d-print-none { 
            display: none !important; 
            visibility: hidden !important;
          }
          
          .print-area { 
            margin: 0 !important; 
            padding: 0 !important;
            width: 100% !important;
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
};

export default InvoicePreview;
