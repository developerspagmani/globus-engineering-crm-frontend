'use client';

import React from 'react';
import { Invoice, Company } from '@/types/modules';
import { numberToWords } from '@/utils/numberToWords';

/**
 * PIXEL-PERFECT INDUSTRIAL INVOICE
 * Calibrated specifically for A4 standard (210mm x 297mm)
 * with strict layout preservation for preview and print.
 */

interface IndustrialInvoiceProps {
   invoice: Invoice;
   company?: Company | null;
   typeParam?: string | null;
   settings: {
      showLogo: boolean;
      logo: string | null;
      logoSecondary: string | null;
      showDeclaration: boolean;
      accentColor: string;
      vatTin?: string;
      cstNo?: string;
      panNo?: string;
      bankName?: string;
      bankAcc?: string;
      bankBranchIfsc?: string;
      companyName?: string;
      companySubHeader?: string;
      companyAddress?: string;
      gstNo?: string;
      stateDetails?: string;
      declarationText?: string;
      challanPrefix?: string;
   };
}

const IndustrialInvoice: React.FC<IndustrialInvoiceProps> = ({ invoice, company, settings, typeParam }) => {
   
   let displayItems = [...invoice.items];
   let displayInvoice = { ...invoice };
   let isWOP = typeParam === 'WOP' || String(invoice.type).toUpperCase() === 'WOP';

   if (String(invoice.type).toUpperCase() === 'BOTH' && typeParam) {
      if (typeParam === 'WP') {
         // `quantity` already stores the WP (billed) quantity — do NOT subtract wopQty
         displayItems = invoice.items.map(it => ({
            ...it,
            quantity: Number(it.quantity || 0),
            amount: Number(it.amount || 0)
         })).filter(it => it.quantity > 0);
         
         const subTotal = displayItems.reduce((sum, it) => sum + it.amount, 0);
         const taxTotal = subTotal * ((invoice.taxRate || 0) / 100);
         displayInvoice = {
            ...invoice,
            items: displayItems,
            subTotal,
            taxTotal,
            grandTotal: subTotal + taxTotal
         };
         isWOP = false;
      } else if (typeParam === 'WOP') {
         displayItems = invoice.items.map((it, idx) => ({
            ...it,
            quantity: Number(it.wopQty || 0),
            amount: 0,
            unitPrice: 0,
            originalIndex: idx + 1
         })).filter(it => it.quantity > 0);
         
         displayInvoice = {
            ...invoice,
            items: displayItems,
            subTotal: 0,
            taxTotal: 0,
            grandTotal: 0
         };
         isWOP = true;
      }
   } else if (isWOP) {
      displayItems = displayItems.map((it, idx) => ({
         ...it,
         quantity: Number(it.wopQty) || Number(it.quantity) || 0,
         amount: 0,
         unitPrice: 0,
         originalIndex: idx + 1
      })).filter(it => it.quantity > 0);
   } else {
      // Default case for Tax Invoices (or BOTH without explicit typeParam)
      // Hide items that have 0 quantity on the Tax Invoice view
      displayItems = displayItems.filter(it => Number(it.quantity || 0) > 0);
   }

   const totalInWords = numberToWords(Math.round(displayInvoice.grandTotal));

   // PAGINATION CAPACITIES (Strictly calibrated for FULL header on ALL pages)
   const GLOBAL_PAGE_CAPACITY = 12;     // Full header/meta/address + items
   const FOOTER_SPACE_ROWS = 9;         // Space for totals on final page

   const paginate = (items: any[]) => {
      let result: any[][] = [];
      let remaining = [...items];

      if (remaining.length === 0) return [[]];

      while (remaining.length > 0) {
         // If it's the last page and needs footer space
         if (remaining.length <= (GLOBAL_PAGE_CAPACITY - FOOTER_SPACE_ROWS)) {
            result.push(remaining);
            remaining = [];
         } else if (remaining.length <= GLOBAL_PAGE_CAPACITY) {
            result.push(remaining);
            remaining = [];
         } else {
            result.push(remaining.slice(0, GLOBAL_PAGE_CAPACITY));
            remaining = remaining.slice(GLOBAL_PAGE_CAPACITY);
         }
      }
      return result;
   };

   const isPrint = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('print') === 'true';

   const pagesData = paginate(displayItems);
   const totalPages = pagesData.length;

   return (
      <div className="industrial-print-container">
         {pagesData.length > 0 && pagesData.map((pageItems, idx) => (
            <InvoicePage
               key={idx}
               invoice={displayInvoice}
               company={company}
               settings={settings}
               items={pageItems}
               isLastPage={idx === totalPages - 1}
               totalInWords={totalInWords}
               startSno={pagesData.slice(0, idx).reduce((sum: number, p: any[]) => sum + p.length, 0) + 1}
               capacity={GLOBAL_PAGE_CAPACITY}
               footerSpaceNeeded={idx === totalPages - 1 ? FOOTER_SPACE_ROWS : 0}
               isWOP={isWOP}
            />
         ))}

         <style jsx global>{`
        /* GLOBAL RESET FOR PRINT */
        @page {
          size: A4;
          margin: 10mm !important;
        }

        .industrial-print-container {
          background: #fdfdfd;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          margin: 0;
          font-family: 'Inter', Arial, sans-serif;
        }

        .invoice-page {
          width: 190mm;
          height: 270mm;
          background: white;
          position: relative;
          color: #000;
          box-sizing: border-box;
          margin: 0 auto;
          overflow: hidden;
        }
        
        .page-border-box {
           border: 1px solid #e0e0e0;
           margin: 0 auto;
           width: 190mm;
           height: 270mm;
           display: flex;
           flex-direction: column;
           background: #fff;
           box-sizing: border-box;
           overflow: hidden;
        }

        /* HEADER SECTION */
        .p-header { 
           border-bottom: 1px solid #e0e0e0; 
           display: flex; 
           padding: 15px; 
           justify-content: space-between;
           page-break-inside: avoid;
        }
        
        /* META 2-COLUMN SECTION */
         .p-meta { 
            display: flex;
            border-bottom: 1px solid #e0e0e0; 
            page-break-inside: avoid;
            font-size: 11px;
         }
         .p-meta-col {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 12px 15px;
         }
         .p-meta-col:first-child {
            border-right: 1px solid #e0e0e0;
         }
         .p-meta-row-item {
            display: grid;
            grid-template-columns: 130px 10px 1fr;
            align-items: center;
         }
         .p-meta-label { color: #555; }
         .p-meta-val { font-weight: bold; color: #000; }

        /* ADDRESS SECTION */
         .p-address { 
            display: flex; 
            font-size: 11px; 
            page-break-inside: avoid;
         }
        .p-addr-box { 
           flex: 1; 
           display: flex;
           flex-direction: column;
        }
        .p-addr-box:first-child {
           border-right: 1px solid #e0e0e0;
        }
        .p-addr-title { 
           font-weight: bold;
           font-size: 12px;
           color: #000;
           padding: 10px 15px;
           border-bottom: 1px solid #e0e0e0;
        }
         .p-addr-content { 
            line-height: 1.6;
            color: #000;
            padding: 10px 15px;
         }
         
        /* TABLE SECTION */
         .p-table-area { 
            display: flex; 
            flex-direction: column; 
            border-bottom: 1px solid #e0e0e0;
         }
        .p-table { 
           width: 100%; 
           border-collapse: collapse; 
           table-layout: fixed;
           border-top: 1px solid #e0e0e0;
           border-bottom: 1px solid #e0e0e0;
        }
        .p-table th { 
           border-bottom: 1px solid #e0e0e0; 
           border-right: 1px solid #e0e0e0;
           padding: 10px 15px; 
           font-size: 11px; 
           text-align: left; 
           background: #fdfdfd; 
           color: #000;
           font-weight: bold;
        }
        .p-table th:last-child {
           border-right: none;
        }
        .p-table td { 
           padding: 12px 15px; 
           font-size: 11px; 
           color: #000;
           vertical-align: top;
           word-break: break-word;
           border-bottom: 1px solid #e0e0e0;
           border-right: 1px solid #e0e0e0;
        }
        .p-table td:last-child {
           border-right: none;
        }
        .p-table tr:last-child td {
           border-bottom: none;
        }

        /* FOOTER SECTIONS */
        .p-totals { 
           display: flex;
           page-break-inside: avoid;
           padding-top: 15px;
        }
        .p-totals-left {
           flex: 1;
           padding: 0 15px;
        }
        .p-totals-right {
           flex: 1;
           padding: 0 15px;
        }
        .p-totals-row {
           display: flex;
           justify-content: space-between;
           margin-bottom: 8px;
           font-size: 11px;
        }
        .p-totals-row.bold {
           font-weight: bold;
           margin-top: 12px;
           padding-top: 12px;
           font-size: 12px;
        }

        .p-footer { 
           display: flex;
           page-break-inside: avoid;
           margin-top: 120px;
           padding-bottom: 20px;
        }
        .p-footer-box { 
           flex: 1; 
           padding: 10px 15px;
           font-size: 11px; 
        }
        .p-footer-head {
           font-weight: normal;
           font-size: 11px;
           margin-bottom: 8px;
           color: #555;
        }
        
        .seal {
           position: absolute;
           top: 30px;
           left: 50%;
           transform: translateX(-50%) rotate(-10deg);
           width: 75px;
           height: 75px;
           opacity: 0.55;
        }

        /* PRINT OVERRIDES */
        @media print {
           @page {
             size: A4;
             margin: 0mm !important;
           }
           html, body { margin: 0 !important; background: #fff !important; }
           .industrial-print-container { 
              background: #fff !important; 
              height: auto !important;
           }
           .industrial-print-container:empty {
              display: none !important;
           }
           .invoice-page {
              overflow: visible !important;
           }
           .page-border-box {
              overflow: visible !important;
           }
           .page-border-box.last-page {
              height: auto !important;
              min-height: 270mm;
           }
           .p-table-area {
              display: flex !important;
              flex-direction: column !important;
           }
           .p-table {
              width: 100% !important;
           }
           .industrial-print-container > *:last-child {
              page-break-after: avoid !important;
              break-after: avoid !important;
           }
        }
      `}</style>
      </div>
   );
};

const InvoicePage = ({ invoice, company, settings, items, isLastPage, totalInWords, startSno, capacity, footerSpaceNeeded, isWOP }: any) => {
   // Filler rows to reach full page height
   const targetRows = isLastPage ? (capacity - footerSpaceNeeded) : capacity;
   const fillerCount = 0; // Disabled to prevent ugly stretched boxes
   const calculatedTaxRate = (invoice.subTotal && invoice.subTotal > 0) 
      ? Math.round(((invoice.taxTotal || 0) / invoice.subTotal) * 100) 
      : (invoice.taxRate || 18);
   
   const taxRate = calculatedTaxRate;

   return (
      <div
         className="invoice-page"
         style={{
            pageBreakAfter: isLastPage ? 'avoid' : 'always',
            breakAfter: isLastPage ? 'avoid' : 'page',
         }}
      >
          <div className={`page-border-box${isLastPage ? ' last-page' : ''}`}>
             
             {/* Header */}
             <div className="p-header">
                <div style={{ display: 'flex', gap: '20px' }}>
                   {/* Logo Box */}
                   <div style={{ width: '130px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #ccc', padding: '5px' }}>
                      {(settings.logo || company?.logo) && settings.showLogo ? (
                         <img
                            src={settings.logo && settings.logo.length > 10 ? settings.logo : company?.logo}
                            alt="Logo"
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                          />
                      ) : settings.showLogo ? (
                         <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                            <path d="M25 5 L75 5 L95 25 L95 75 L75 95 L25 95 L5 75 L5 25 Z" fill="none" stroke="#ccc" strokeWidth="1.2" />
                            <circle cx="50" cy="50" r="28" fill="none" stroke="#ccc" strokeWidth="1.2" />
                            <circle cx="50" cy="50" r="22" fill="none" stroke="#ccc" strokeWidth="0.8" />
                            <path d="M50 20 L50 10 M50 80 L50 90 M20 50 L10 50 M80 50 L90 50" stroke="#ccc" strokeWidth="1.2" />
                            <text x="50" y="61" fontSize="30" fontWeight="bold" textAnchor="middle" fill="#ccc" fontFamily="sans-serif">S</text>
                         </svg>
                      ) : null}
                   </div>
                   
                   {/* Company Info */}
                   <div style={{ paddingTop: '5px' }}>
                      <h1 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#000' }}>
                         {(!settings.companyName || settings.companyName.toUpperCase().includes('MACHINING')) 
                            ? 'GLOBUS ENGINEERING TOOLS' 
                            : settings.companyName}
                      </h1>
                      <div style={{ fontSize: '11px', color: '#000', marginTop: '6px', lineHeight: '1.5', maxWidth: '350px' }}>
                         {(!settings.companySubHeader || settings.companySubHeader.includes('Machining') || settings.companySubHeader.includes('Quality')) 
                            ? 'No 24, Annaiyappan Street, S.S.Nagar,\nNallampalayam, Ganapathy Post,\nCoimbatore - 641006.' 
                            : settings.companySubHeader}
                      </div>
                      <div style={{ fontSize: '11px', color: '#000', marginTop: '6px' }}>
                         GSTIN: {settings.gstNo || company?.gstin || '33AAIFG6568K1ZZ'}
                      </div>
                   </div>
                </div>

                {/* Document Title */}
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                   <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#000', textAlign: 'right', whiteSpace: 'pre-line', lineHeight: '1.2' }}>
                      {isWOP ? 'DELIVERY\nCHALLAN' : 'TAX\nINVOICE' }
                   </div>
                </div>
             </div>

             {/* Meta Details */}
             <div className="p-meta">
                <div className="p-meta-col">
                   <div className="p-meta-row-item">
                      <span className="p-meta-label">{isWOP ? 'Invoice WOP No' : 'Invoice No'}</span>
                      <span>:</span>
                      <span className="p-meta-val">{isWOP ? (invoice.challanNumber || 'N/A') : invoice.invoiceNumber}</span>
                   </div>
                   <div className="p-meta-row-item">
                      <span className="p-meta-label">DC No</span>
                      <span>:</span>
                      <span className="p-meta-val">{invoice.dcNo || invoice.dc_no || ''}</span>
                   </div>
                   <div className="p-meta-row-item">
                      <span className="p-meta-label">PO No</span>
                      <span>:</span>
                      <span className="p-meta-val">{invoice.poNo || invoice.po_no || ''}</span>
                   </div>
                   <div className="p-meta-row-item">
                      <span className="p-meta-label">State</span>
                      <span>:</span>
                      <span className="p-meta-val">TamilNadu-33</span>
                   </div>
                </div>
                <div className="p-meta-col">
                   <div className="p-meta-row-item">
                      <span className="p-meta-label">Invoice Date</span>
                      <span>:</span>
                      <span className="p-meta-val">{(invoice.date) ? new Date(invoice.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-') : ''}</span>
                   </div>
                   <div className="p-meta-row-item">
                      <span className="p-meta-label">DC Date</span>
                      <span>:</span>
                      <span className="p-meta-val">{(invoice.dcDate || invoice.dc_date) ? new Date(invoice.dcDate || invoice.dc_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-') : ''}</span>
                   </div>
                   <div className="p-meta-row-item">
                      <span className="p-meta-label">PO Date</span>
                      <span>:</span>
                      <span className="p-meta-val">{(invoice.poDate || invoice.po_date) ? new Date(invoice.poDate || invoice.po_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-') : ''}</span>
                   </div>
                   <div className="p-meta-row-item">
                      <span className="p-meta-label">Reverse Charge</span>
                      <span>:</span>
                      <span className="p-meta-val">N</span>
                   </div>
                </div>
             </div>

             {/* Addresses */}
             <div className="p-address">
                <div className="p-addr-box">
                   <div className="p-addr-title">SUPPLIER DETAILS</div>
                   <div className="p-addr-content">
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{(!settings.companyName || settings.companyName.toUpperCase().includes('MACHINING')) ? 'GLOBUS ENGINEERING TOOLS' : settings.companyName.toUpperCase()}</div>
                      <div style={{ marginBottom: '4px', whiteSpace: 'pre-line' }}>{(!settings.companyAddress || settings.companyAddress.toUpperCase().includes('MACHINING')) ? 'No 24, Annaiyappan Street, S.S.Nagar, Nallampalayam, Ganapathy Post, Coimbatore - 641006.' : settings.companyAddress}</div>
                      <div style={{ marginBottom: '4px' }}>GSTIN: {settings.gstNo || company?.gstin || '33AAIFG6568K1ZZ'}</div>
                      <div>State: {settings.stateDetails?.split(' - ')[0] || 'Tamilnadu'} (Code : 33)</div>
                   </div>
                </div>
                <div className="p-addr-box">
                   <div className="p-addr-title">RECIPIENT DETAILS</div>
                   <div className="p-addr-content">
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{invoice.customerName}</div>
                      <div style={{ marginBottom: '4px', whiteSpace: 'pre-line' }}>{invoice.address || 'N/A'}</div>
                      <div style={{ marginBottom: '4px' }}>GSTIN: {invoice.gstin || 'N/A'}</div>
                      <div>State: {invoice.state || 'N/A'} (Code: {invoice.state?.toLowerCase() === 'telangana' ? '36' : '33'})</div>
                   </div>
                </div>
             </div>

             {/* Table */}
             <div className="p-table-area">
                <table className="p-table">
                   <thead>
                      <tr>
                         <th style={{ width: '45px', textAlign: 'center' }}>S.NO</th>
                         <th>DESCRIPTION</th>
                         <th style={{ width: '90px', textAlign: 'center' }}>HSN CODE</th>
                         {!isWOP && <th style={{ width: '75px', textAlign: 'center' }}>GST RATE</th>}
                         <th style={{ width: '70px', textAlign: 'center' }}>QTY</th>
                         {!isWOP && <th style={{ width: '90px', textAlign: 'right' }}>PRICE</th>}
                         {!isWOP && <th style={{ width: '110px', textAlign: 'right' }}>AMOUNT (₹)</th>}
                      </tr>
                   </thead>
                   <tbody>
                      {items.map((item: any, idx: number) => (
                         <tr key={idx}>
                            <td style={{ fontWeight: 'bold', textAlign: 'center' }}>{item.originalIndex ? item.originalIndex : (startSno + idx)}</td>
                            <td>{item.description}</td>
                            <td style={{ textAlign: 'center' }}>{item.hsnCode || '998898'}</td>
                            {!isWOP && <td style={{ textAlign: 'center' }}>{taxRate}%</td>}
                            <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                            {!isWOP && <td style={{ textAlign: 'right' }}>{Number(item.unitPrice || 0).toFixed(2)}</td>}
                            {!isWOP && <td style={{ textAlign: 'right' }}>{Number(item.amount || 0).toFixed(2)}</td>}
                         </tr>
                      ))}
                      {/* Fillers */}
                      {[...Array(fillerCount)].map((_, i) => (
                         <tr key={`filler-${i}`}>
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                            {!isWOP && <td>&nbsp;</td>}
                            <td>&nbsp;</td>
                            {!isWOP && <td>&nbsp;</td>}
                            {!isWOP && <td>&nbsp;</td>}
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>

             {/* Totals Section */}
             {isLastPage && (
                <div className="p-totals">
                   <div className="p-totals-left">
                      {!isWOP && (
                         <>
                            <div style={{ marginBottom: '6px', fontSize: '11px', color: '#555' }}>Total In Words</div>
                            <div style={{ fontSize: '12px', textTransform: 'capitalize', fontWeight: 'bold', fontStyle: 'italic', color: '#000' }}>
                               Indian Rupee {String(totalInWords).toLowerCase().replace(' only', '')} Only
                            </div>
                         </>
                      )}
                   </div>
                   <div className="p-totals-right">
                      {!isWOP ? (
                         <>
                            <div className="p-totals-row bold" style={{ marginTop: '0', paddingTop: '0' }}>
                               <span>Sub Total</span>
                               <span>{Number(invoice.subTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            {(() => {
                               const isIntraState = (invoice.state || '').toLowerCase().replace(/[^a-z]/g, '') === 'tamilnadu';
                               const taxTotal = invoice.taxTotal || 0;

                               if (isIntraState) {
                                  return (
                                     <>
                                        <div className="p-totals-row">
                                           <span>CGST ({taxRate / 2}%)</span>
                                           <span>{(taxTotal / 2).toFixed(2)}</span>
                                        </div>
                                        <div className="p-totals-row">
                                           <span>SGST ({taxRate / 2}%)</span>
                                           <span>{(taxTotal / 2).toFixed(2)}</span>
                                        </div>
                                     </>
                                  );
                               } else {
                                  return (
                                     <div className="p-totals-row">
                                        <span>IGST ({taxRate}%)</span>
                                        <span>{taxTotal.toFixed(2)}</span>
                                     </div>
                                  );
                               }
                            })()}
                            <div className="p-totals-row bold">
                               <span>Total</span>
                               <span>{Math.round(invoice.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                         </>
                      ) : (
                         <div className="p-totals-row bold">
                            <span>Total Quantity</span>
                            <span>{invoice.items.reduce((sum: number, item: any) => sum + (Number(item.wopQty) || Number(item.quantity) || 0), 0)}</span>
                         </div>
                      )}
                   </div>
                </div>
             )}

             {/* Footer / Notes */}
             {isLastPage && (
                <div className="p-footer">
                   <div className="p-footer-box" style={{ flex: 1.5 }}>
                      <div className="p-footer-head">Notes</div>
                      <div>Thanks for your business.</div>
                      
                      {settings.showDeclaration && (
                         <div style={{ marginTop: '15px', fontSize: '9px', color: '#555', maxWidth: '90%' }}>
                            {settings.declarationText || 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.'}
                         </div>
                      )}
                   </div>
                   <div className="p-footer-box" style={{ position: 'relative' }}>
                      <div className="p-footer-head" style={{ marginBottom: '10px' }}>Authorized signature</div>
                      <img
                         src="/seal.png"
                         className="seal"
                         style={{ left: '30px', transform: 'rotate(-5deg)', top: '30px', width: '90px', height: '90px' }}
                         alt="seal"
                         onError={(e) => (e.target as any).style.display = 'none'}
                      />
                   </div>
                </div>
             )}
          </div>
      </div>
);
};

export default IndustrialInvoice;
