'use client';

import React from 'react';
import { Invoice, Company } from '@/types/modules';
import { numberToWords } from '@/utils/numberToWords';

interface IndustrialInvoiceProps {
   invoice: Invoice;
   company?: Company | null;
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
   };
}

const IndustrialInvoice: React.FC<IndustrialInvoiceProps> = ({ invoice, company, settings }) => {
   const totalInWords = numberToWords(invoice.grandTotal);

   // Updated A4 Layout Calculation
   // Total A4 Height ~1122px (at 96 DPI)
   // We can fit about 28-30 rows on a full page without many headers.
   // With industrial headers/footers, let's be more precise:
   // Re-calibrated for exactly 20 rows per page limit
   const rowsOnMiddlePage = 20; 
   const rowsOnLastPage = 15; 

   const paginate = (items: any[]) => {
      let result: any[][] = [];
      let remaining = [...items];

      if (remaining.length === 0) return [[]];

      // Special case: fits on a single page
      if (remaining.length <= rowsOnLastPage) {
         return [remaining];
      }

      // Multiple pages case
      while (remaining.length > 0) {
         // If what's left fits completely on the last page WITH the footer
         if (remaining.length <= rowsOnLastPage) {
            result.push(remaining);
            remaining = [];
         } 
         // If it's too much for a last page, fill this page as much as possible
         // but leave at least 1 item so there is a "Last Page" to hold the footer.
         else {
            const take = Math.min(remaining.length - 1, rowsOnMiddlePage);
            result.push(remaining.slice(0, take));
            remaining = remaining.slice(take);
         }
      }
      return result;
   };

   const pagesData = paginate(invoice.items);
   const totalPages = pagesData.length || 1;

   return (
      <div className="industrial-invoice-wrapper">
         {pagesData.map((pageItems, idx) => (
            <InvoicePage
               key={idx}
               invoice={invoice}
               company={company}
               settings={settings}
               items={pageItems}
               pageNo={idx + 1}
               totalPages={totalPages}
               isLastPage={idx === totalPages - 1}
               totalInWords={totalInWords}
               startSno={pagesData.slice(0, idx).reduce((sum: number, p: any[]) => sum + p.length, 0) + 1}
               maxRows={idx === totalPages - 1 ? rowsOnLastPage : rowsOnMiddlePage}
            />
         ))}

         <style jsx global>{`
        .industrial-invoice-wrapper {
          background: #525659;
          padding: 40px 0;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }
        
        .invoice-page {
          width: 210mm;
          min-height: 297mm;
          background: white;
          box-shadow: 0 0 15px rgba(0,0,0,0.5);
          display: flex;
          flex-direction: column;
          position: relative;
          color: black;
          font-family: 'Arial', sans-serif;
          box-sizing: border-box;
          border: 1px solid #777;
          overflow: hidden;
        }

        .border-box {
           border: 2px solid black;
           margin: 10mm 15mm 5mm 5mm; /* Top Right Bottom Left - Moved LEFT */
           width: 180mm;   /* More reduction to be super safe */
           min-height: 275mm;
           display: flex;
           flex-direction: column;
           background: white;
        }

        .i-header { height: 110px; border-bottom: 2.5px solid black; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; }
        .i-meta { font-size: 10.5px; font-weight: bold; border-bottom: 2.5px solid black; }
        .i-meta-row { display: flex; border-bottom: 1.5px solid black; }
        .i-meta-row:last-child { border-bottom: 0; }
        .i-meta-col { flex: 1; border-right: 1.5px solid black; padding: 4px 10px; display: flex; justify-content: space-between; }
        .i-meta-col:last-child { border-right: 0; }
        
        .i-address { display: flex; border-bottom: 2px solid black; font-size: 10.5px; font-weight: bold; min-height: 120px; }
        .i-addr-box { flex: 1; border-right: 2px solid black; display: flex; flex-direction: column; }
        .i-addr-box:last-child { border-right: 0; }
        .i-addr-label { background: #f3f4f6; border-bottom: 1.5px solid black; padding: 4px 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
        .i-addr-content { padding: 8px 12px; line-height: 1.5; flex: 1; }

        .i-table-wrap { flex: 1; display: flex; flex-direction: column; }
        .i-table { width: 100%; border-collapse: collapse; }
        .i-table th { border: 1.5px solid black; padding: 6px; font-size: 10.5px; text-align: center; background: #f3f4f6; text-transform: uppercase; }
        .i-table td { 
          border: 1.5px solid black; 
          padding: 4px 10px; 
          font-size: 11px; 
          font-weight: 700; 
          vertical-align: top;
          height: 28px; /* Restored for better look with 20 rows */
          line-height: 1.2;
          word-break: break-word;
        }
        .i-table tr.total-row td { border: 2px solid black; background: #f3f4f6; font-size: 11.5px; padding: 6px 10px; }
        
        .i-footer-last { border-top: 2.5px solid black; }
        .i-words { border-bottom: 1.5px solid black; padding: 6px 12px; font-size: 10px; font-weight: 900; text-transform: uppercase; background: #fff; }
        .i-details { display: flex; border-bottom: 2px solid black; }
        .i-details-box { flex: 1; border-right: 2px solid black; font-size: 10.5px; font-weight: bold; }
        .i-details-box:last-child { border-right: 0; }
        
        .i-sign { display: flex; border-bottom: 2px solid black; height: 90px; }
        .i-sign-box { flex: 1; border-right: 2px solid black; padding: 8px 12px; font-size: 10.5px; font-weight: bold; }
        .i-sign-box:last-child { border-right: 0; text-align: center; position: relative; }
        
        .i-decl { padding: 6px 12px; font-size: 8px; line-height: 1.2; font-weight: bold; background: #fff; }

        .stamp-official {
           position: absolute; top: 15px; left: 50%; transform: translateX(-50%) rotate(-12deg); width: 70px; height: 70px;
           border: 2.5px solid #003399; border-radius: 50%; opacity: 0.6;
           display: flex; flex-direction: column; align-items: center; justify-content: center; color: #003399;
        }

        @media print {
          @page { 
            size: A4 portrait; 
            margin: 0; 
          }
          body { 
            margin: 0; 
            padding: 0;
            background: white !important;
          }
          .industrial-invoice-wrapper { 
            padding: 0; 
            background: white; 
            gap: 0; 
            min-height: auto; 
            display: block; 
          }
          .invoice-page { 
            box-shadow: none; 
            margin: 0; 
            border: 0; 
            page-break-after: always; 
            width: 210mm; 
            height: 297mm; 
          }
          .invoice-page:last-child { 
            page-break-after: avoid; 
          }
          .border-box { 
            margin: 10mm 15mm 5mm 5mm !important; 
            border: 2px solid black !important; 
            -webkit-print-color-adjust: exact !important; 
          }
        }
      `}</style>
      </div>
   );
};

const InvoicePage = ({ invoice, company, settings, items, pageNo, totalPages, isLastPage, totalInWords, startSno, maxRows }: any) => {
   return (
      <div className="invoice-page">
         <div className="border-box">
            {/* Header Section */}
            <div className="i-header">
               <div style={{ width: '90px', height: '90px' }}>
                  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                     <path d="M25 5 L75 5 L95 25 L95 75 L75 95 L25 95 L5 75 L5 25 Z" fill="none" stroke="black" strokeWidth="3" />
                     <circle cx="50" cy="50" r="30" fill="none" stroke="black" strokeWidth="2.5" />
                     <path d="M50 20 L50 8 M50 80 L50 92 M20 50 L8 50 M80 50 L92 50" stroke="black" strokeWidth="3" />
                     <text x="50" y="62" fontSize="36" fontWeight="900" textAnchor="middle" fill="black" fontFamily="Georgia, serif">S</text>
                  </svg>
               </div>

               <div style={{ textAlign: 'center', flex: 1, padding: '0 10px' }}>
                  <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '900', letterSpacing: '1px' }}>
                     {company?.name?.toUpperCase() || 'GLOBUS ENGINEERING TOOLS'}
                  </h1>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '4px' }}>An ISO 9001: 2015 Certified Company</div>
                  <div style={{ fontSize: '10px', fontWeight: 'bold' }}>Precision Machining & Quality Engineering Solutions</div>
               </div>

               <div style={{ width: '90px', display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ width: '70px', border: '2.5px solid black', textAlign: 'center' }}>
                     <div style={{ fontSize: '11px', fontWeight: 'bold', borderBottom: '2px solid black', background: '#f3f4f6' }}>Q</div>
                     <div style={{ padding: '5px 0' }}>
                        <div style={{ fontSize: '20px', fontWeight: '900', lineHeight: 1 }}>TÜV</div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold' }}>SÜD</div>
                     </div>
                     <div style={{ fontSize: '9px', fontWeight: 'bold', borderTop: '2px solid black' }}>ISO 9001</div>
                  </div>
               </div>
            </div>

            {/* Invoice Meta Grid */}
            <div className="i-meta">
               <div className="i-meta-row">
                  <div className="i-meta-col"><span>Invoice No</span><span>: <strong>{invoice.invoiceNumber}</strong></span></div>
                  <div className="i-meta-col"><span>DC No</span><span>: {invoice.dcNo || invoice.dc_no || ''}</span></div>
                  <div className="i-meta-col"><span>PO No</span><span>: {invoice.poNo || invoice.po_no || ''}</span></div>
                  <div className="i-meta-col" style={{ flex: 1.2 }}><span>State</span><span>: TamilNadu-33</span></div>
               </div>
               <div className="i-meta-row">
                  <div className="i-meta-col"><span>Invoice Date</span><span>: {invoice.date ? new Date(invoice.date).toLocaleDateString('en-GB').replace(/\//g, '-') : ''}</span></div>
                  <div className="i-meta-col"><span>DC Dte</span><span>: {invoice.dcDate || invoice.dc_date ? new Date(invoice.dcDate || invoice.dc_date).toLocaleDateString('en-GB').replace(/\//g, '-') : ''}</span></div>
                  <div className="i-meta-col"><span>PO Date</span><span>: {invoice.poDate || invoice.po_date ? new Date(invoice.poDate || invoice.po_date).toLocaleDateString('en-GB').replace(/\//g, '-') : ''}</span></div>
                  <div className="i-meta-col" style={{ flex: 1.2 }}><span>Reverse Charge (Y/N)</span><span>: N</span></div>
               </div>
            </div>

            <div style={{ textAlign: 'center', fontSize: '13px', fontWeight: '900', padding: '6px 0', borderBottom: '2px solid black', backgroundColor: '#f3f4f6', letterSpacing: '2px' }}>TAX INVOICE</div>

            {/* Address Section */}
            <div className="i-address">
               <div className="i-addr-box">
                  <div className="i-addr-label">Supplier Details :</div>
                  <div className="i-addr-content">
                     <div className="d-flex mb-1"><div style={{ width: '70px' }}>Name</div><div>: <strong>{company?.name || 'Globus Engineering Tools'}</strong></div></div>
                     <div className="d-flex mb-1"><div style={{ width: '70px' }}>Address</div><div style={{ flex: 1 }}>: {company?.address || 'No:24, Annaiyappan Street, S.S.Nagar, Nallampalayam, Coimbatore - 641006'}</div></div>
                     <div className="d-flex mb-1"><div style={{ width: '70px' }}>GST No</div><div>: <strong>{company?.gstin || '33AAIFG6568K1ZZ'}</strong></div></div>
                     <div className="d-flex"><div style={{ width: '70px' }}>State</div><div style={{ width: '130px' }}>: Tamilnadu</div><div className="ms-auto" style={{ width: '70px' }}>Code : 33</div></div>
                  </div>
               </div>
               <div className="i-addr-box">
                  <div className="i-addr-label">Receipients Details :</div>
                  <div className="i-addr-content">
                     <div className="d-flex mb-1"><div style={{ width: '70px' }}>Name</div><div>: <strong>{invoice.customerName}</strong></div></div>
                     <div className="d-flex mb-1"><div style={{ width: '70px' }}>Address</div><div style={{ flex: 1 }}>: {invoice.address || 'N/A'}</div></div>
                     <div className="d-flex mb-1"><div style={{ width: '70px' }}>GST No</div><div>: <strong>{invoice.gstin || 'N/A'}</strong></div></div>
                     <div className="d-flex"><div style={{ width: '70px' }}>State</div><div style={{ width: '130px' }}>: {invoice.state || 'N/A'}</div><div className="ms-auto" style={{ width: '70px' }}>Code : {invoice.state?.toLowerCase() === 'telangana' ? '36' : '33'}</div></div>
                  </div>
               </div>
            </div>

            {/* Items Table */}
            <div className="i-table-wrap">
               <table className="i-table">
                  <thead>
                     <tr>
                        <th style={{ width: '7%' }}>S.No</th>
                        <th style={{ width: '43%' }}>Description of Goods</th>
                        <th style={{ width: '12%' }}>SAC Code</th>
                        <th style={{ width: '12%' }}>Qty</th>
                        <th style={{ width: '12%' }}>Rate</th>
                        <th style={{ width: '14%' }}>Amount (₹)</th>
                     </tr>
                  </thead>
                  <tbody>
                     {items.map((item: any, idx: number) => (
                        <tr key={idx}>
                           <td style={{ textAlign: 'center' }}>{startSno + idx}</td>
                           <td>
                              <div style={{ marginBottom: '2px' }}>{item.description}</div>
                              {item.process && <div style={{ fontWeight: 'normal', fontSize: '10px', color: '#444' }}>Process: {item.process}</div>}
                           </td>
                           <td style={{ textAlign: 'center' }}>84661010</td>
                           <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                           <td style={{ textAlign: 'right' }}>{item.unitPrice.toFixed(2)}</td>
                           <td style={{ textAlign: 'right' }}>{item.amount.toFixed(2)}</td>
                        </tr>
                     ))}

                     {/* Fill remaining space with empty rows to LOCK layout */}
                     {[...Array(Math.max(0, maxRows - items.length))].map((_, i) => (
                        <tr key={`empty-${i}`} style={{ height: '28px' }}>
                           <td style={{ borderBottom: 'none' }}>&nbsp;</td>
                           <td style={{ borderBottom: 'none' }}>&nbsp;</td>
                           <td style={{ borderBottom: 'none' }}>&nbsp;</td>
                           <td style={{ borderBottom: 'none' }}>&nbsp;</td>
                           <td style={{ borderBottom: 'none' }}>&nbsp;</td>
                           <td style={{ borderBottom: 'none' }}>&nbsp;</td>
                        </tr>
                     ))}
                     {isLastPage && (
                        <>
                           <tr className="total-row">
                              <td colSpan={2} style={{ textAlign: 'right', fontWeight: '900' }}>SUB TOTAL (Taxable Value)</td>
                              <td>&nbsp;</td>
                              <td style={{ textAlign: 'center' }}>{invoice.items.reduce((sum: number, item: any) => sum + item.quantity, 0)}</td>
                              <td>&nbsp;</td>
                              <td style={{ textAlign: 'right', fontWeight: '900' }}>₹ {invoice.subTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || invoice.sub_total?.toLocaleString('en-IN')}</td>
                           </tr>
                           <tr className="total-row">
                              <td colSpan={5} style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '10px' }}>CGST ({settings.accentColor ? '9' : (invoice.taxRate ? (invoice.taxRate/2) : '9')}%)</td>
                              <td style={{ textAlign: 'right' }}>₹ {(invoice.taxTotal / 2).toFixed(2)}</td>
                           </tr>
                           <tr className="total-row">
                              <td colSpan={5} style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '10px' }}>SGST ({settings.accentColor ? '9' : (invoice.taxRate ? (invoice.taxRate/2) : '9')}%)</td>
                              <td style={{ textAlign: 'right' }}>₹ {(invoice.taxTotal / 2).toFixed(2)}</td>
                           </tr>
                           <tr className="total-row">
                              <td colSpan={5} style={{ textAlign: 'right', fontWeight: '900', fontSize: '12px' }}>GRAND TOTAL</td>
                              <td style={{ textAlign: 'right', fontWeight: '900', fontSize: '12px' }}>₹ {invoice.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                           </tr>
                        </>
                     )}
                  </tbody>
               </table>
            </div>

            {/* Footer Section (ONLY ON LAST PAGE) */}
            {isLastPage ? (
               <div className="i-footer-last">
                  <div className="i-words">Amount Chargeable(in words) : <strong>Indian Rupees {totalInWords} Only</strong></div>
                  <div className="i-details">
                     <div className="i-details-box">
                        <div style={{ background: '#f3f4f6', textAlign: 'center', borderBottom: '1.5px solid black', padding: '3px', fontWeight: 'bold' }}>Our Identity Details</div>
                        <div style={{ padding: '8px 12px' }}>
                           <div className="d-flex mb-1"><div style={{ width: '85px' }}>VAT TIN</div>: {settings.vatTin || '33132028969'}</div>
                           <div className="d-flex mb-1"><div style={{ width: '85px' }}>CST NO</div>: {settings.cstNo || '1091562'}</div>
                           <div className="d-flex"><div style={{ width: '85px' }}>PAN NO</div>: {settings.panNo || 'AAIFG6568K'}</div>
                        </div>
                     </div>
                     <div className="i-details-box">
                        <div style={{ background: '#f3f4f6', textAlign: 'center', borderBottom: '1.5px solid black', padding: '3px', fontWeight: 'bold' }}>Bank Settlement Details</div>
                        <div style={{ padding: '8px 12px' }}>
                           <div className="d-flex mb-1"><div style={{ width: '105px' }}>Bank Name</div>: <strong>{settings.bankName || 'INDIAN OVERSEAS BANK'}</strong></div>
                           <div className="d-flex mb-1"><div style={{ width: '105px' }}>Bank A/C No</div>: <strong>{settings.bankAcc || '170902000000962'}</strong></div>
                           <div className="d-flex"><div style={{ width: '105px' }}>Branch & IFSC</div>: <strong>{settings.bankBranchIfsc || 'IOBA0001709'}</strong></div>
                        </div>
                     </div>
                  </div>

                  <div className="i-sign">
                     <div className="i-sign-box">
                        <div style={{ fontSize: '9px', marginBottom: '40px' }}>Receivers Name & Signature (With Date)</div>
                        <div style={{ borderTop: '1px solid #777', width: '70%', paddingTop: '3px', fontSize: '9px' }}>Customer Acknowledgement</div>
                     </div>
                     <div className="i-sign-box">
                        <div style={{ fontSize: '10px' }}>For <strong>{company?.name || 'Globus Engineering Tools'}</strong></div>
                        <div className="stamp-official">
                           <div style={{ fontSize: '7px', fontWeight: '900', textAlign: 'center', lineHeight: 1.1 }}>GLOBUS<br />ENGINEERING</div>
                           <div style={{ border: '1.5px solid #003399', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '2px 0', fontSize: '13px' }}>S</div>
                           <div style={{ fontSize: '7px', fontWeight: '900' }}>TOOLS</div>
                        </div>
                        <div style={{ position: 'absolute', bottom: '8px', left: '0', width: '100%', fontSize: '10px', fontWeight: 'bold', textDecoration: 'overline' }}>Authorized Signatory</div>
                     </div>
                  </div>

                  <div className="i-decl">
                     <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '4px', marginBottom: '4px' }}>
                        <strong>Declaration:</strong> Supplied to Special Economic Zone-Duties & Taxes Are Exempted
                        (Folio-No.8/3/2007 Suzlon ON INFRA SEZ DT.24.9.2007) UNDER EPCG LICENCE NO
                     </div>
                     <div style={{ textAlign: 'center', textTransform: 'uppercase', marginBottom: '4px', fontSize: '8.5px', color: '#333' }}>
                        "Supply Meant For export/supply to SEZ Unit or Sez developer for authorised
                        Operations under Bond or Letter of Undertaking without Payment of Integrated Tax"
                        (Export Covered Under LUT NO AD330625078562X v Dated 25/06/2025)
                     </div>
                     <div style={{ fontStyle: 'italic', color: '#111' }}>
                        <strong>Final Confirmation:</strong> We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
                     </div>
                  </div>
               </div>
            ) : (
               <div style={{ textAlign: 'center', padding: '12px', fontSize: '11px', color: '#777', borderTop: '1.5px dashed #ccc', fontWeight: 'bold' }}>
                  --- Continued on Next Page ({pageNo + 1}) ---
               </div>
            )}
         </div>

         {/* Page Numbers */}
         <div style={{ position: 'absolute', bottom: '6mm', right: '12mm', fontSize: '11px', fontWeight: '900' }}>
            Page {pageNo} / {totalPages}
         </div>
      </div>
   );
};

export default IndustrialInvoice;
