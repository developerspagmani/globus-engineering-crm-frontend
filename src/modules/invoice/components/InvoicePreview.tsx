'use client';

import React, { useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { Invoice, Company } from '@/types/modules';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import IndustrialInvoice from './IndustrialInvoice';
import { updateInvoiceSettings, initializeInvoiceSettings } from '@/redux/features/invoiceSlice';
import InvoiceEmailReminderToggle from './InvoiceEmailReminderToggle';
import BackButton from '@/components/BackButton';

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
      // Small delay to ensure styles are loaded
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [searchParams]);

  const toggleDeclaration = () => {
    dispatch(updateInvoiceSettings({ showDeclaration: !settings.showDeclaration }));
  };

  // Sync settings from company context if they aren't loaded in Redux yet (handles direct navigation/refresh)
  React.useEffect(() => {
    if (company && (!settings.companyName || settings.companyName === 'GLOBUS ENGINEERING MAIN')) {
      const dbSettings = company.invoiceSettings || {};
      const initialSettings = {
        ...settings,
        ...dbSettings,
        // Prioritize actual database columns for logos if JSON settings are empty or invalid
        logo: (dbSettings.logo && dbSettings.logo.length > 10) ? dbSettings.logo : (company.logo || settings.logo),
        logoSecondary: (dbSettings.logoSecondary && dbSettings.logoSecondary.length > 10) ? dbSettings.logoSecondary : (company.logoSecondary || settings.logoSecondary)
      };
      dispatch(initializeInvoiceSettings(initialSettings));
    }
  }, [company, dispatch, settings.companyName]);

  const accentColor = settings.accentColor || '#0d6efd';

  return (
    <div className="invoice-preview-page">
      {!hideControls && (
        <div className="d-flex justify-content-between align-items-center mb-4 no-print flex-wrap gap-3 p-3 bg-white rounded-4 shadow-sm border">
          <div className="d-flex align-items-center gap-3">
            <BackButton />
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
            <InvoiceEmailReminderToggle invoice={invoice} />
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
        <div className="print-wrapper">
          <IndustrialInvoice invoice={invoice} company={company} settings={settings} />
        </div>
      </div>

      <style jsx>{`
        .print-area {
          margin: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .print-wrapper {
          display: inline-block;
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
            margin: 0mm !important; 
          }
          .no-print, .declaration-toggle-wrapper { display: none !important; }
          html, body { 
            background: white !important; 
            margin: 0 !important; 
            padding: 0 !important; 
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
          }
          .invoice-preview-page {
            padding: 0 !important;
            margin: 0 !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
          }
          .print-area { 
            margin: 0 !important; 
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            display: block !important;
            overflow: visible !important;
          }
          .print-wrapper {
            display: block !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
          }
          .industrial-print-container {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
          }
          .industrial-print-container > :last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
    </div>
  );
};

export default InvoicePreview;
