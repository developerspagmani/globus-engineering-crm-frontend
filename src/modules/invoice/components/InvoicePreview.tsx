'use client';

import React, { useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { Invoice, Company } from '@/data/mockModules';

interface InvoicePreviewProps {
  invoice: Invoice;
  company: Company | null;
  hideControls?: boolean;
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoice, company, hideControls = false }) => {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const { settings } = useSelector((state: RootState) => state.invoices);

  const handlePrint = () => {
    window.print();
  };

  const accentColor = settings.accentColor || '#0d6efd';

  return (
    <div>
      {!hideControls && (
        <div className="d-flex justify-content-end gap-2 mb-4 no-print">
          <button className="btn btn-outline-primary" onClick={handlePrint}>
            <i className="bi bi-printer me-2"></i> Print Invoice
          </button>
          <button className="btn btn-primary" style={{ backgroundColor: accentColor, borderColor: accentColor }} onClick={handlePrint}>
            <i className="bi bi-file-earmark-pdf me-2"></i> Export as PDF
          </button>
        </div>
      )}

      <div ref={invoiceRef} className="invoice-container shadow-lg rounded-4 overflow-hidden bg-white mx-auto print-area" style={{ maxWidth: '850px', minHeight: '1100px', color: '#111827', fontFamily: "'Inter', 'Roboto', sans-serif" }}>
        {/* Invoice Header */}
        <div style={{ padding: '2.5rem 3rem', borderBottom: `4px solid ${accentColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              {settings.showLogo && settings.logo ? (
                <img src={settings.logo} alt="Logo" style={{ height: '45px', objectFit: 'contain' }} />
              ) : (
                <div className="p-2 rounded-3" style={{ backgroundColor: accentColor }}>
                  <i className="bi bi-factory text-white fs-4"></i>
                </div>
              )}
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0, color: '#111827' }}>
                {company?.name || 'Globus Engineering Tools'}
              </h1>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0, maxWidth: '400px', lineHeight: '1.5' }}>
              No. 7, 1st Floor, Opp. To SBI Bank,<br />
              Peenya 2nd Stage, Bangalore - 560058
            </p>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem', fontWeight: 600 }}>GSTIN: {company?.id ? '29ABCDE1234F1Z5' : 'GST REGISTERED'}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: accentColor, letterSpacing: '0.05em' }}>TAX INVOICE</div>
            <div className="mt-2">
               <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Invoice No: <strong style={{ color: '#111827' }}>{invoice.invoiceNumber}</strong></div>
               <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Invoice Date: <strong style={{ color: '#111827' }}>{new Date(invoice.date).toLocaleDateString('en-IN')}</strong></div>
               <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>DC No: <strong style={{ color: '#111827' }}>{invoice.dcNo || '-'}</strong></div>
               <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>DC Date: <strong style={{ color: '#111827' }}>{invoice.dcDate ? new Date(invoice.dcDate).toLocaleDateString('en-IN') : '-'}</strong></div>
            </div>
          </div>
        </div>

        {/* Bill To & Details */}
        <div style={{ padding: '2rem 3rem', display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem', borderBottom: '1px solid #f3f4f6' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>Bill To Customer</div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#111827' }}>{invoice.customerName}</div>
            <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.4rem', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
              {invoice.address || 'Address Not Provided'}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>Order Info</div>
            <div className="d-flex flex-column gap-1">
               <div style={{ fontSize: '0.85rem', color: '#374151' }}>PO No: <strong>{invoice.poNo || '-'}</strong></div>
               <div style={{ fontSize: '0.85rem', color: '#374151' }}>PO Date: <strong>{invoice.poDate ? new Date(invoice.poDate).toLocaleDateString('en-IN') : '-'}</strong></div>
               <div style={{ fontSize: '0.85rem', color: '#374151' }}>Due Date: <strong className="text-danger">{new Date(invoice.dueDate).toLocaleDateString('en-IN')}</strong></div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div style={{ padding: '0 3rem', minHeight: '400px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: `2px solid #374151` }}>
                <th style={{ padding: '0.75rem 0', textAlign: 'left', fontWeight: 700, textTransform: 'uppercase', width: '40px' }}>Sno</th>
                <th style={{ padding: '0.75rem 0', textAlign: 'left', fontWeight: 700, textTransform: 'uppercase' }}>Description of Goods</th>
                <th style={{ padding: '0.75rem 0', textAlign: 'left', fontWeight: 700, textTransform: 'uppercase' }}>Process</th>
                <th style={{ padding: '0.75rem 0', textAlign: 'center', fontWeight: 700, textTransform: 'uppercase' }}>Qty</th>
                <th style={{ padding: '0.75rem 0', textAlign: 'right', fontWeight: 700, textTransform: 'uppercase' }}>Rate</th>
                <th style={{ padding: '0.75rem 0', textAlign: 'right', fontWeight: 700, textTransform: 'uppercase' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '1rem 0', color: '#374151' }}>{index + 1}</td>
                  <td style={{ padding: '1rem 0', fontWeight: 600, color: '#111827' }}>{item.description}</td>
                  <td style={{ padding: '1rem 0', color: '#4b5563 italic' }}>{item.process || '-'}</td>
                  <td style={{ padding: '1rem 0', textAlign: 'center', color: '#111827', fontWeight: 600 }}>{item.quantity}</td>
                  <td style={{ padding: '1rem 0', textAlign: 'right', color: '#374151' }}>₹{item.unitPrice.toFixed(2)}</td>
                  <td style={{ padding: '1rem 0', textAlign: 'right', fontWeight: 700, color: '#111827' }}>₹{item.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div style={{ padding: '2rem 3rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem' }}>
            <div style={{ fontSize: '0.8rem', color: '#6b7280', alignSelf: 'end' }}>
               <div style={{ fontWeight: 700, color: '#374151', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Amount in Words:</div>
               <div style={{ color: '#111827', fontWeight: 600 }}>Twelve Hundred and Forty Three Rupees Only</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="d-flex flex-column gap-2">
                <div className="d-flex justify-content-between">
                  <span style={{ color: '#6b7280', fontWeight: 500 }}>Taxable Value</span>
                  <span style={{ fontWeight: 700 }}>₹{invoice.subTotal.toFixed(2)}</span>
                </div>
                {/* CGST/SGST vs IGST Logic Placeholder */}
                <div className="d-flex justify-content-between">
                  <span style={{ color: '#6b7280', fontWeight: 500 }}>CGST (9%)</span>
                  <span style={{ fontWeight: 600 }}>₹{(invoice.taxTotal / 2).toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span style={{ color: '#6b7280', fontWeight: 500 }}>SGST (9%)</span>
                  <span style={{ fontWeight: 600 }}>₹{(invoice.taxTotal / 2).toFixed(2)}</span>
                </div>
                <div style={{ height: '1px', background: '#374151', margin: '0.25rem 0' }} />
                <div className="d-flex justify-content-between align-items-center">
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: '#111827' }}>Total Amount</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 900, color: accentColor }}>
                    ₹{invoice.grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Terms & Footer */}
        <div style={{ padding: '0 3rem 3rem 3rem', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '3rem', alignItems: 'end' }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#111827', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Declaration:</div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', lineHeight: 1.5 }}>
               We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ borderTop: `1px solid #111827`, paddingTop: '1rem' }}>
               <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#111827', textTransform: 'uppercase' }}>For {company?.name || 'Globus Engineering Tools'}</div>
               <div style={{ height: '50px' }}></div>
               <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Authorized Signatory</div>
            </div>
          </div>
        </div>

        <div className="mt-4 py-3 text-center text-muted x-small bg-light no-print">
          Generated automatically by Globus CRM Hub
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          .main-wrapper { margin-left: 0 !important; }
          .sidebar, .navbar-custom, .breadcrumb, .btn { display: none !important; }
          body { background-color: white !important; }
          .content-area { padding: 0 !important; }
          .invoice-container { box-shadow: none !important; padding: 0 !important; margin: 0 !important; width: 100% !important; max-width: none !important; }
          @page { size: auto; margin: 20mm; }
        }
      ` }} />
    </div>
  );
};

export default InvoicePreview;
