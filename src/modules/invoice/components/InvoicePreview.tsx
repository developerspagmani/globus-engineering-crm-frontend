'use client';

import React, { useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { Invoice, Company } from '@/types/modules';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import IndustrialInvoice from './IndustrialInvoice';
import ModernTaxInvoice from './ModernTaxInvoice';
import InvoiceLayoutModal, { InvoiceLayoutFormat } from './InvoiceLayoutModal';
import { updateInvoiceSettings, initializeInvoiceSettings } from '@/redux/features/invoiceSlice';
import InvoiceEmailReminderToggle from './InvoiceEmailReminderToggle';
import BackButton from '@/components/BackButton';

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface InvoicePreviewProps {
  invoice: Invoice;
  company: Company | null;
  hideControls?: boolean;
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoice, company, hideControls = false }) => {
  const dispatch = useDispatch();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const printFiredRef = useRef(false);
  const { settings } = useSelector((state: RootState) => state.invoices);
  const searchParams = useSearchParams();
  const isReadOnly = searchParams.get('readonly') === 'true';
  const router = useRouter();

  const initialLayout: InvoiceLayoutFormat =
    (searchParams.get('layout') || searchParams.get('format')) === 'modern' ? 'modern' : 'classic';
  const [layout, setLayout] = React.useState<InvoiceLayoutFormat>(initialLayout);
  const [layoutModal, setLayoutModal] = React.useState<{ isOpen: boolean; actionType: 'print' | 'export' }>({
    isOpen: false,
    actionType: 'print'
  });

  React.useEffect(() => {
    const paramLayout = searchParams.get('layout') || searchParams.get('format');
    if (paramLayout === 'modern' || paramLayout === 'classic') {
      setLayout(paramLayout);
    }
  }, [searchParams]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (!invoiceRef.current) return;
    const canvas = await html2canvas(invoiceRef.current, {
      scale: 2,
      useCORS: true,
      logging: false,
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`INVOICE_${invoice.invoiceNumber || invoice.id}_${layout.toUpperCase()}.pdf`);
  };

  React.useEffect(() => {
    if (searchParams.get('print') === 'true' && !printFiredRef.current) {
      printFiredRef.current = true;
      setTimeout(() => { window.print(); }, 500);
    }
    if (searchParams.get('download') === 'true') {
      handleDownload();
    }
  }, [searchParams]);

  const toggleDeclaration = () => {
    dispatch(updateInvoiceSettings({ showDeclaration: !settings.showDeclaration }));
  };

  const toggleWopText = () => {
    dispatch(updateInvoiceSettings({ showWopText: settings.showWopText === false ? true : false }));
  };

  const toggleRoundOff = () => {
    dispatch(updateInvoiceSettings({ enableRoundOff: settings.enableRoundOff === false ? true : false }));
  };

  // Sync settings and reset declaration on mount or company change
  React.useEffect(() => {
    if (!company) return;

    const dbSettings = company.invoiceSettings || {};
    
    // Check if we need to pull basic company info into settings
    if (!settings.companyName || settings.companyName === 'GLOBUS ENGINEERING MAIN' || settings.companyName === 'Globus Engineering Tools') {
      const initialSettings = {
        ...settings,
        ...dbSettings,
        showDeclaration: false,
        enableRoundOff: dbSettings.enableRoundOff !== undefined ? dbSettings.enableRoundOff : (settings.enableRoundOff !== undefined ? settings.enableRoundOff : true),
        // Prioritize actual database columns for logos if JSON settings are empty or invalid
        logo: (dbSettings.logo && dbSettings.logo.length > 10) ? dbSettings.logo : (company.logo || settings.logo),
        logoSecondary: dbSettings.logoSecondary !== undefined ? dbSettings.logoSecondary : (settings.logoSecondary !== undefined ? settings.logoSecondary : company.logoSecondary)
      };
      dispatch(initializeInvoiceSettings(initialSettings));
    } else {
      // Just ensure declaration is OFF for this specific preview session.
      dispatch(updateInvoiceSettings({ showDeclaration: false }));
    }
  }, [company?.id, dispatch]); // Using company.id for a stable dependency array length

  const accentColor = settings.accentColor || '#0d6efd';

  return (
    <div className="invoice-preview-page">
      {!hideControls && (
        <div className="d-flex justify-content-between align-items-center mb-4 no-print flex-nowrap gap-3 p-3 bg-white rounded-4 shadow-sm border overflow-x-auto text-nowrap">
          <div className="d-flex align-items-center gap-2 flex-shrink-0">
            <BackButton />
            <h5 className="m-0 fw-bold text-dark pe-2">Invoice Preview</h5>
            
            {/* Invoice Layout Format Switcher */}
            <div className="d-flex align-items-center bg-light border rounded-pill p-1 ms-1">
              <button
                type="button"
                className={`btn btn-sm rounded-pill px-3 py-1 fw-bold transition-all ${
                  layout === 'classic' ? 'btn-dark text-white shadow-sm' : 'text-muted'
                }`}
                onClick={() => setLayout('classic')}
                title="Format 1: Classic Industrial Globus layout"
              >
                <i className="bi bi-layout-text-window me-1"></i> Classic Layout
              </button>
              <button
                type="button"
                className={`btn btn-sm rounded-pill px-3 py-1 fw-bold transition-all ${
                  layout === 'modern' ? 'btn-primary text-white shadow-sm' : 'text-muted'
                }`}
                onClick={() => setLayout('modern')}
                title="Format 2: Modern Nexus Tax Invoice layout"
              >
                <i className="bi bi-file-earmark-spreadsheet-fill me-1"></i> Modern Format (Nexus)
              </button>
            </div>

            {layout === 'classic' && (
              <div className="declaration-toggle-wrapper ms-2 d-flex align-items-center gap-3">
                 <label className="switch mb-0">
                    <input 
                      type="checkbox" 
                      checked={settings.showDeclaration}
                      onChange={toggleDeclaration}
                    />
                    <span className="slider round flex-shrink-0"></span>
                    <span className="label-text">Declaration</span>
                 </label>
                 {(invoice?.billType === 'Without Process' || invoice?.type === 'WOP' || String(invoice?.billType || '').toLowerCase().includes('without')) && (
                   <label className="switch mb-0">
                      <input 
                        type="checkbox" 
                        checked={settings.showWopText !== false}
                        onChange={toggleWopText}
                      />
                      <span className="slider round flex-shrink-0"></span>
                      <span className="label-text">WOP Label</span>
                   </label>
                 )}
                 <label className="switch mb-0">
                    <input 
                      type="checkbox" 
                      checked={settings.enableRoundOff !== false}
                      onChange={toggleRoundOff}
                    />
                    <span className="slider round flex-shrink-0"></span>
                    <span className="label-text">Round Off</span>
                 </label>
              </div>
            )}
          </div>
          
          <div className="d-flex align-items-center gap-2 flex-shrink-0">
            {!isReadOnly && (
              <Link href={`/invoices/${invoice.id}/edit`} className="btn btn-outline-secondary d-flex align-items-center gap-1 px-3 fw-semibold rounded-pill text-nowrap">
                <i className="bi bi-pencil"></i> Edit
              </Link>
            )}
            <InvoiceEmailReminderToggle invoice={invoice} />
            <button
              className="btn btn-outline-dark d-flex align-items-center gap-1 px-3 fw-semibold rounded-pill text-nowrap"
              onClick={() => setLayoutModal({ isOpen: true, actionType: 'print' })}
              title="Choose format and print invoice"
            >
              <i className="bi bi-printer"></i> Print
            </button>
            <button
              className="btn btn-primary d-flex align-items-center gap-2 px-3 fw-bold rounded-pill shadow-sm text-nowrap"
              style={{ backgroundColor: accentColor, borderColor: accentColor }}
              onClick={() => setLayoutModal({ isOpen: true, actionType: 'export' })}
              title="Choose format and export PDF"
            >
              <i className="bi bi-filetype-pdf"></i> Export PDF
            </button>
          </div>
        </div>
      )}

      <div ref={invoiceRef} className="print-area">
        <div className="print-wrapper">
          {layout === 'modern' ? (
            <ModernTaxInvoice
              invoice={invoice}
              company={company}
              settings={settings}
              typeParam={searchParams.get('type')}
              copyType={searchParams.get('copies') || undefined}
            />
          ) : (
            <IndustrialInvoice
              invoice={invoice}
              company={company}
              settings={settings}
              typeParam={searchParams.get('type')}
            />
          )}
        </div>
      </div>

      {/* Invoice Layout Choice Modal */}
      <InvoiceLayoutModal
        isOpen={layoutModal.isOpen}
        actionType={layoutModal.actionType}
        invoiceNumber={invoice.invoiceNumber}
        defaultCopies={searchParams.get('copies') || 'ORIGINAL,DUPLICATE,TRIPLICATE'}
        onClose={() => setLayoutModal({ isOpen: false, actionType: 'print' })}
        onConfirm={(chosenLayout, chosenCopies) => {
          setLayout(chosenLayout);
          const currentAction = layoutModal.actionType;
          setLayoutModal({ isOpen: false, actionType: 'print' });
          if (currentAction === 'print') {
            setTimeout(() => {
              window.print();
            }, 300);
          } else {
            setTimeout(() => {
              handleDownload();
            }, 300);
          }
        }}
      />

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
