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
      enableRoundOff?: boolean;
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
         const taxableAmount = subTotal - (invoice.discount || 0) + (invoice.otherCharges || 0);
         const taxTotal = taxableAmount * ((invoice.taxRate || 0) / 100);
         displayInvoice = {
            ...invoice,
            items: displayItems,
            subTotal,
            taxTotal,
            grandTotal: settings?.enableRoundOff === false ? (taxableAmount + taxTotal) : Math.round(taxableAmount + taxTotal)
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

   const isRoundOffEnabled = settings?.enableRoundOff !== false;
   const exactSubTotal = Number(displayInvoice.subTotal || 0);
   const exactTaxTotal = exactSubTotal * ((Number(displayInvoice.taxRate) || 0) / 100);
   const exactGrandTotal = exactSubTotal - (Number(displayInvoice.discount) || 0) + (Number(displayInvoice.otherCharges) || 0) + exactTaxTotal;
   const wordsTotal = isRoundOffEnabled ? Math.round(displayInvoice.grandTotal || exactGrandTotal) : (exactGrandTotal > 0 ? exactGrandTotal : Number(displayInvoice.grandTotal || 0));
   const totalInWords = numberToWords(Number(wordsTotal.toFixed(2)));

   const getItemHeight = (item: any) => {
      let lines = 1;
      if (item.description) {
         const texts = String(item.description).split('\n');
         lines = texts.reduce((acc, text) => acc + Math.max(1, Math.ceil(text.length / 45)), 0);
      }
      if (item.process) lines += 1;
      return 12 + (lines * 14); // 12px padding/borders + 14px per line
   };

   const paginate = (items: any[]) => {
      if (!items || items.length === 0) return [[]];

      const PAGE_MAX_HEIGHT = 1040; // Safe height for A4 at 100% print scale
      const FIRST_PAGE_HEADER_HEIGHT = 330; // Header + Meta + Addresses on first page
      const OTHER_PAGE_HEADER_HEIGHT = 140; // Only Header on continuation pages
      const TABLE_HEADER_HEIGHT = 38;
      const declarationText = settings?.showDeclaration ? (settings?.declarationText || 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.') : '';
      const declarationLines = declarationText ? Math.ceil(declarationText.length / 90) : 0;
      const declarationHeight = declarationLines > 0 ? (declarationLines * 14) + 10 : 0;
      const FOOTER_HEIGHT = (isWOP ? 90 : 220) + declarationHeight;
      
      let pages: any[][] = [];
      let currentPage: any[] = [];
      let currentHeight = FIRST_PAGE_HEADER_HEIGHT + TABLE_HEADER_HEIGHT;
      
      for (let i = 0; i < items.length; i++) {
         const item = items[i];
         const h = getItemHeight(item);
         
         let remainingItemsHeight = 0;
         for (let j = i; j < items.length; j++) {
            remainingItemsHeight += getItemHeight(items[j]);
         }
         
         // If all remaining items fit perfectly with the footer, flush and finish!
         if (currentHeight + remainingItemsHeight + FOOTER_HEIGHT <= PAGE_MAX_HEIGHT) {
            pages.push([...currentPage, ...items.slice(i)]);
            return pages;
         }
         
         // If the page is full, start a new page
         if (currentHeight + h > PAGE_MAX_HEIGHT) {
            pages.push(currentPage);
            currentPage = [item];
            currentHeight = OTHER_PAGE_HEADER_HEIGHT + TABLE_HEADER_HEIGHT + h;
         } else {
            // Fits on current page
            currentPage.push(item);
            currentHeight += h;
         }
      }
      
      if (currentPage.length > 0) {
         if (currentHeight + FOOTER_HEIGHT <= PAGE_MAX_HEIGHT) {
             pages.push(currentPage);
         } else {
             // Footer overflows! Pull the last 2 items onto the final page to prevent an empty grid
             if (currentPage.length > 2) {
                 const movedItems = currentPage.splice(currentPage.length - 2, 2);
                 pages.push(currentPage);
                 pages.push(movedItems);
             } else {
                 pages.push(currentPage);
                 pages.push([]);
             }
         }
      }
      
      return pages;
   };

   const isPrint = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('print') === 'true';
   const urlCopies = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('copies');
   
   let copyTypes = [''];
   if (isPrint && !isWOP) {
      if (urlCopies) {
         copyTypes = urlCopies.split(',');
      } else {
         copyTypes = ['ORIGINAL', 'DUPLICATE', 'TRIPLICATE'];
      }
   } else if (!isPrint && !isWOP) {
      copyTypes = ['ORIGINAL'];
   }

   const pagesData = paginate(displayItems);
   const totalPages = pagesData.length;

   return (
      <div className="industrial-print-container">
         {copyTypes.map((copyType, copyIdx) => (
            <React.Fragment key={`copy-${copyIdx}`}>
               {pagesData.length > 0 && pagesData.map((pageItems, idx) => (
                  <InvoicePage
                     key={`page-${idx}`}
                     invoice={displayInvoice}
                     company={company}
                     settings={settings}
                     items={pageItems}
                     isLastPage={idx === totalPages - 1}
                     pageIndex={idx}
                     totalPages={totalPages}
                     totalInWords={totalInWords}
                     startSno={pagesData.slice(0, idx).reduce((sum: number, p: any[]) => sum + p.length, 0) + 1}
                     isWOP={isWOP}
                     copyType={copyType}
                     isLastCopyAndPage={(copyIdx === copyTypes.length - 1) && (idx === totalPages - 1)}
                  />
               ))}
            </React.Fragment>
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
            width: 210mm;
            height: auto;
            display: flex;
            flex-direction: column;
            padding: 5mm 10mm;
            background: white;
            position: relative;
            color: #000;
            box-sizing: border-box;
            margin: 0 auto;
            overflow: visible;
         }
        
         .page-border-box {
            flex: 1;
            display: flex;
            flex-direction: column;
            border: 1px solid #000000;
            margin: 0 auto;
            width: 100%;
            height: auto;
            min-height: 260mm;
            background: #fff;
            box-sizing: border-box;
         }

        /* HEADER SECTION */
        .p-header { 
           border-bottom: 1px solid #000000; 
           display: flex; 
           padding: 5px 15px; 
           justify-content: space-between;
           page-break-inside: avoid;
        }
        
        /* META 2-COLUMN SECTION */
         .p-meta { 
            display: flex;
            border-bottom: 1px solid #000000; 
            page-break-inside: avoid;
            font-size: 11px;
         }
         .p-meta-col {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 5px;
            padding: 4px 15px;
         }
         .p-meta-col:first-child {
            border-right: 1px solid #000000;
         }
         .p-meta-row-item {
            display: grid;
            grid-template-columns: 130px 10px 1fr;
            align-items: center;
         }
         .p-meta-label { color: #000; font-weight: bold; }
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
           border-right: 1px solid #000000;
        }
        .p-addr-title { 
           font-weight: bold;
           font-size: 12px;
           color: #000;
           padding: 4px 15px;
           border-bottom: 1px solid #000000;
        }
         .p-addr-content { 
            line-height: 1.45;
            color: #000;
            padding: 4px 15px;
         }
         
        /* TABLE SECTION */
         .p-table-area { 
            display: flex; 
            flex-direction: column; 
            flex: 1;
         }
         .p-table { 
            width: 100%; 
            border-collapse: collapse; 
            table-layout: fixed;
            border-top: 1px solid #000000;
            border-bottom: 1px solid #000000;
            height: auto;
         }
        .p-table th { 
           border-bottom: 1px solid #000000; 
           border-right: 1px solid #000000;
           padding: 2px 8px; 
           font-size: 10px; 
           text-align: left; 
           background: #fdfdfd; 
           color: #000;
           font-weight: bold;
        }
        .p-table th:last-child {
           border-right: none;
        }
        .p-table tr.real-row {
           height: 1px;
        }
        .p-table tr.filler-row {
           height: auto;
        }
        .p-table td { 
           padding: 2px 8px; 
           font-size: 10px; 
           color: #000;
           vertical-align: top;
           word-break: break-word;
           border-bottom: 1px solid #000000;
           border-right: 1px solid #000000;
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
           padding-top: 8px;
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
           margin-bottom: 2px;
           font-size: 11px;
        }
        .p-totals-row.bold {
           font-weight: bold;
           margin-top: 6px;
           padding-top: 6px;
           font-size: 12px;
        }

         .p-footer { 
            display: flex;
            page-break-inside: avoid;
            margin-top: 8px;
            padding-bottom: 6px;
         }
        .p-footer-box { 
           flex: 1; 
           padding: 4px 15px;
           font-size: 11px; 
        }
        .p-footer-head {
           font-weight: bold;
           font-size: 11px;
           margin-bottom: 6px;
           color: #000;
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
            margin: 0 !important;
          }
          .invoice-page {
             page-break-after: always;
             page-break-inside: avoid;
             margin: 0 !important;
             border: none !important;
             height: 293mm !important;
             padding: 5mm 10mm !important;
             overflow: visible !important;
          }
          html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
          .industrial-print-container { 
             background: #fff !important; 
          }
          .industrial-print-container:empty {
             display: none;
          }
          .page-border-box { height: 100% !important; overflow: hidden !important; }
          .page-border-box.last-page { height: 100% !important; min-height: unset !important; }
        }
      `}</style>
      </div>
   );
};

const InvoicePage = ({ invoice, company, settings, items, isLastPage, pageIndex, totalPages, totalInWords, startSno, isWOP, copyType, isLastCopyAndPage }: any) => {
   const calculatedTaxRate = (invoice.subTotal && invoice.subTotal > 0) 
      ? Math.round(((invoice.taxTotal || 0) / invoice.subTotal) * 100) 
      : (invoice.taxRate || 18);
   
   const taxRate = calculatedTaxRate;

   return (
      <div
         className="invoice-page"
         style={{
            pageBreakAfter: isLastCopyAndPage ? 'avoid' : 'always',
            breakAfter: isLastCopyAndPage ? 'avoid' : 'page',
         }}
      >
          {/* Top Title With Copy Type Badge */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', paddingLeft: '5px' }}>
             {copyType && (
                <span style={{ 
                   fontSize: '13px', 
                   fontWeight: 'bold', 
                   textTransform: 'uppercase',
                   letterSpacing: '1px'
                }}>
                   {copyType}
                </span>
             )}
          </div>

          <div className={`page-border-box${isLastPage ? ' last-page' : ''}`} style={isWOP ? { height: '260mm' } : {}}>
             
             {/* Header ALWAYS SHOW */}
             <div className="p-header">
                <div style={{ display: 'flex', gap: '20px' }}>
                   {/* Logo Box */}
                   <div style={{ 
                      width: 'auto', 
                      minWidth: '110px', 
                      maxWidth: '220px', 
                      minHeight: '80px', 
                      maxHeight: '130px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      border: ((settings.logo && settings.logo.length > 10) || company?.logo) && settings.showLogo ? 'none' : '1px solid #ccc',
                      padding: ((settings.logo && settings.logo.length > 10) || company?.logo) && settings.showLogo ? '0' : '6px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxSizing: 'border-box' 
                   }}>
                      {(settings.logo || company?.logo) && settings.showLogo ? (
                         <img
                            src={settings.logo && settings.logo.length > 10 ? settings.logo : company?.logo}
                            alt="Logo"
                            style={{ maxWidth: '220px', maxHeight: '120px', width: 'auto', height: 'auto', objectFit: 'contain', display: 'block', borderRadius: '12px', overflow: 'hidden' }}
                          />
                      ) : settings.showLogo ? (
                         <svg viewBox="0 0 100 100" style={{ width: '120px', height: '120px' }}>
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
                      <div style={{ fontSize: '11px', color: '#000', marginTop: '4px' }}>
                         Website: {settings.website || company?.website || ''} <br/>
                         Contact Details: {settings.contactDetails || company?.phone || ''} <br/>
                         Mail ID: {settings.emailId || company?.email || ''}
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

             {/* Meta Details ONLY ON FIRST PAGE */}
             {pageIndex === 0 && (
                <div className="p-meta">
                <div className="p-meta-col">
                   <div className="p-meta-row-item">
                      <span className="p-meta-label">{isWOP ? 'Delivery No' : 'Invoice No'}</span>
                      <span>:</span>
                      <span className="p-meta-val">{isWOP ? (invoice.challanNumber || 'N/A') : invoice.invoiceNumber}</span>
                   </div>
                   <div className="p-meta-row-item">
                      <span className="p-meta-label">{isWOP ? 'Customer DC No' : 'DC No'}</span>
                      <span>:</span>
                      <span className="p-meta-val">{invoice.dcNo || invoice.dc_no || ''}</span>
                   </div>
                   <div className="p-meta-row-item">
                      <span className="p-meta-label">PO No</span>
                      <span>:</span>
                      <span className="p-meta-val">{invoice.poNo || invoice.po_no || ''}</span>
                   </div>
                </div>
                <div className="p-meta-col">
                   <div className="p-meta-row-item">
                      <span className="p-meta-label">{isWOP ? 'Delivery Date' : 'Invoice Date'}</span>
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
                </div>
             </div>
             )}

             {/* Addresses ONLY ON FIRST PAGE */}
             {pageIndex === 0 && (
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
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>M/s. {invoice.customerName}</div>
                      <div style={{ marginBottom: '4px', whiteSpace: 'pre-line' }}>{invoice.address || 'N/A'}</div>
                      <div style={{ marginBottom: '4px' }}>GSTIN: {invoice.gstin || 'N/A'}</div>
                      <div>State: {invoice.state || 'N/A'} (Code: {invoice.state?.toLowerCase() === 'telangana' ? '36' : '33'})</div>
                   </div>
                </div>
             </div>
             )}

             {/* Table */}
             <div className="p-table-area">
                <table className="p-table" style={isWOP ? { flex: 1, height: '100%' } : {}}>
                   <thead>
                      <tr>
                         <th style={{ width: '6%', textAlign: 'center' }}>S.NO</th>
                         <th style={{ width: '44%', textAlign: 'center' }}>DESCRIPTION</th>
                         <th style={{ width: isWOP ? '25%' : '12%', textAlign: 'center' }}>HSN CODE</th>
                         <th style={{ width: isWOP ? '25%' : '10%', textAlign: 'center' }}>QTY</th>
                         {!isWOP && <th style={{ width: '14%', textAlign: 'right' }}>PRICE</th>}
                         {!isWOP && <th style={{ width: '14%', textAlign: 'right' }}>AMOUNT (₹)</th>}
                      </tr>
                   </thead>
                   <tbody>
                      {items.map((item: any, idx: number) => (
                         <tr key={idx} className="real-row">
                            <td style={{ fontWeight: 'bold', textAlign: 'center' }}>{startSno + idx}</td>
                            <td style={{ textAlign: 'center' }}>
                               <div style={{ whiteSpace: 'pre-wrap' }}>{item.description}</div>
                               {item.process && <div style={{ fontSize: '10px', color: '#555', marginTop: '2px' }}>{item.process}</div>}
                            </td>
                            <td style={{ textAlign: 'center' }}>{item.hsnCode || '998898'}</td>
                            <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                            {!isWOP && <td style={{ textAlign: 'right' }}>{Number(item.unitPrice || 0).toFixed(2)}</td>}
                            {!isWOP && <td style={{ textAlign: 'right' }}>{Number(item.amount || 0).toFixed(2)}</td>}
                         </tr>
                      ))}
                      {isWOP && (
                         <tr className="filler-row">
                            <td style={{ borderBottom: 'none' }}></td>
                            <td style={{ borderBottom: 'none' }}></td>
                            <td style={{ borderBottom: 'none' }}></td>
                            <td style={{ borderBottom: 'none' }}></td>
                         </tr>
                      )}
                   </tbody>
                   {isLastPage && !isWOP && (
                      <tfoot>
                         <tr style={{ background: '#fdfdfd' }}>
                            <td colSpan={3} style={{ textAlign: 'right', borderTop: '1px solid #000000', borderBottom: 'none', padding: '8px 12px', fontWeight: 'bold' }}>
                               Total Quantity
                            </td>
                            <td style={{ textAlign: 'center', borderTop: '1px solid #000000', borderBottom: 'none', padding: '8px 12px', fontWeight: 'bold', borderRight: '1px solid #000000' }}>
                               {invoice.items.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0)}
                            </td>
                            <td colSpan={2} style={{ borderTop: '1px solid #000000', borderBottom: 'none', padding: '8px 12px', borderRight: 'none' }}></td>
                         </tr>
                      </tfoot>
                   )}
                   {isLastPage && isWOP && (
                      <tfoot>
                         <tr style={{ background: '#fdfdfd' }}>
                            <td colSpan={2} style={{ borderTop: '1px solid #000000', borderBottom: 'none', borderRight: '1px solid #000000', padding: '8px 12px', fontWeight: 'bold', fontSize: '11px', color: '#000' }}>
                               WITHOUT PROCESS
                            </td>
                            <td style={{ borderTop: '1px solid #000000', borderBottom: 'none', borderRight: '1px solid #000000', padding: '8px 12px', fontWeight: 'bold', textAlign: 'center', fontSize: '11px', color: '#000' }}>
                               Total Quantity
                            </td>
                            <td style={{ borderTop: '1px solid #000000', borderBottom: 'none', borderRight: 'none', padding: '8px 12px', fontWeight: 'bold', textAlign: 'center', fontSize: '11px', color: '#000' }}>
                               {invoice.items.reduce((sum: number, item: any) => sum + (Number(item.wopQty) || Number(item.quantity) || 0), 0)}
                            </td>
                         </tr>
                      </tfoot>
                   )}
                </table>
             </div>

             {/* Totals Section */}
             {isLastPage && !isWOP && (
                <div className="p-totals">
                   <div className="p-totals-left">
                      <div style={{ marginBottom: '6px', fontSize: '11px', color: '#000', fontWeight: 'bold' }}>Total In Words</div>
                      <div style={{ fontSize: '12px', textTransform: 'capitalize', fontWeight: 'bold', fontStyle: 'italic', color: '#000' }}>
                         Indian Rupee {String(totalInWords).toLowerCase().replace(' only', '')} Only
                      </div>
                   </div>
                   <div className="p-totals-right">
                      <div className="p-totals-row bold" style={{ marginTop: '0', paddingTop: '0' }}>
                         <span>Sub Total</span>
                         <span>{Number(invoice.subTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      {Number(invoice.discount || 0) > 0 && (
                         <div className="p-totals-row">
                            <span>Discount</span>
                            <span>-{Number(invoice.discount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                         </div>
                      )}
                      {Number(invoice.otherCharges || 0) > 0 && (
                         <div className="p-totals-row">
                            <span>Other Charges</span>
                            <span>+{Number(invoice.otherCharges).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                         </div>
                      )}
                      {(() => {
                         const isIntraState = (invoice.state || '').toLowerCase().replace(/[^a-z]/g, '') === 'tamilnadu';
                         const exactTaxTotal = (invoice.subTotal || 0) * (taxRate / 100);

                         if (isIntraState) {
                            return (
                               <>
                                  <div className="p-totals-row">
                                     <span>CGST ({taxRate / 2}%)</span>
                                     <span>{(exactTaxTotal / 2).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                  </div>
                                  <div className="p-totals-row">
                                     <span>SGST ({taxRate / 2}%)</span>
                                     <span>{(exactTaxTotal / 2).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                  </div>
                               </>
                             );
                          } else {
                             return (
                                <div className="p-totals-row">
                                   <span>IGST ({taxRate}%)</span>
                                   <span>{exactTaxTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                             );
                          }
                       })()}
                       {(() => {
                          if (settings?.enableRoundOff === false) return null;
                          const exactTaxTotal = (invoice.subTotal || 0) * (taxRate / 100);
                          const exactTotal = (invoice.subTotal || 0) - (invoice.discount || 0) + (Number(invoice.otherCharges) || 0) + exactTaxTotal;
                          const roundedTotal = Math.round(invoice.grandTotal || exactTotal);
                          const roundOff = roundedTotal - exactTotal;
                          return (
                             <div className="p-totals-row">
                                <span>Round Off</span>
                                <span>{roundOff > 0 ? '+' : ''}{roundOff.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                             </div>
                          );
                       })()}
                       <div className="p-totals-row bold">
                          <span>Total</span>
                          <span>{(() => {
                             const exactTaxTotal = (invoice.subTotal || 0) * (taxRate / 100);
                             const exactTotal = (invoice.subTotal || 0) - (invoice.discount || 0) + (Number(invoice.otherCharges) || 0) + exactTaxTotal;
                             const finalVal = settings?.enableRoundOff === false ? exactTotal : Math.round(invoice.grandTotal || exactTotal || 0);
                             return Number(finalVal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                          })()}</span>
                       </div>
                    </div>
                 </div>
              )}

             {/* Company & Bank Details */}
             {isLastPage && !isWOP && (
                <div style={{ display: 'flex', borderBottom: '1px solid #000000', borderTop: '1px solid #000000', pageBreakInside: 'avoid', fontSize: '11px', marginTop: '6px' }}>
                   <div style={{ flex: 1, borderRight: '1px solid #000000', padding: '8px 15px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#000', fontSize: '12px' }}>Company Details</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '80px 10px 1fr', gap: '4px' }}>
                         <span style={{ color: '#000', fontWeight: 'bold' }}>VAT TIN</span><span>:</span><span style={{ fontWeight: 'bold', color: '#000' }}>{settings.vatTin || '33132028969'}</span>
                         <span style={{ color: '#000', fontWeight: 'bold' }}>CST NO</span><span>:</span><span style={{ fontWeight: 'bold', color: '#000' }}>{settings.cstNo || '1091562'}</span>
                         <span style={{ color: '#000', fontWeight: 'bold' }}>PAN NO</span><span>:</span><span style={{ fontWeight: 'bold', color: '#000' }}>{settings.panNo || 'AAIFG6568K'}</span>
                      </div>
                   </div>
                   <div style={{ flex: 1, padding: '8px 15px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#000', fontSize: '12px' }}>Bank Details</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '120px 10px 1fr', gap: '4px' }}>
                         <span style={{ color: '#000', fontWeight: 'bold' }}>Bank Name</span><span>:</span><span style={{ fontWeight: 'bold', color: '#000' }}>{settings.bankName || 'INDIAN OVERSEAS BANK'}</span>
                         <span style={{ color: '#000', fontWeight: 'bold' }}>Bank A/C</span><span>:</span><span style={{ fontWeight: 'bold', color: '#000' }}>{settings.bankAcc || '170902000000962'}</span>
                         <span style={{ color: '#000', fontWeight: 'bold' }}>Branch & IFSC Code</span><span>:</span><span style={{ fontWeight: 'bold', color: '#000' }}>{settings.bankBranchIfsc || 'IOBA0001709'}</span>
                      </div>
                   </div>
                </div>
             )}

             {/* Footer / Notes */}
             {isLastPage && (
                 <div className="p-footer" style={{ display: 'flex', flexDirection: 'column', borderTop: 'none' }}>
                    {/* Notes row — natural height, no flex stretch */}
                    <div style={{ display: 'flex', padding: '0px 15px', fontSize: '11px' }}>
                       <div style={{ flex: 1.5 }}>
                          {settings.showDeclaration && (
                             <div style={{ fontSize: '10px', color: '#000', fontWeight: 'bold', maxWidth: '95%', lineHeight: '1.4', paddingTop: '8px' }}>
                                {settings.declarationText || 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.'}
                             </div>
                          )}
                       </div>
                       <div style={{ flex: 1 }} />
                    </div>
                    {/* Signature row — always directly below notes, no empty gap */}
                    <div style={{ display: 'flex', borderTop: 'none', padding: '6px 15px' }}>
                       <div style={{ flex: 1.5, fontWeight: 'bold', fontSize: '11px', color: '#000' }}>
                          Receiver's Signature
                       </div>
                       <div style={{ flex: 1, position: 'relative', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <img
                             src="/seal.png"
                             className="seal"
                             style={{ position: 'absolute', right: '100px', bottom: '0px', transform: 'rotate(-5deg)', width: '60px', height: '60px', top: 'auto', left: 'auto', opacity: 0.55 }}
                             alt="seal"
                             onError={(e) => (e.target as any).style.display = 'none'}
                          />
                          <div className="p-footer-head" style={{ margin: 0, fontWeight: 'bold', fontSize: '11px', color: '#000' }}>Authorized signature</div>
                       </div>
                    </div>
                 </div>
              )}
          </div>
      </div>
);
};

export default IndustrialInvoice;
