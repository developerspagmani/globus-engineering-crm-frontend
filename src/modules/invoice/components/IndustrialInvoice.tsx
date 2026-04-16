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

   // Strict A4 Layout Calculation (96 DPI)
   // Page: 1123px total height
   // Non-table header: ~280px
   // Footer: ~255px
   // Row: ~26px

   const rowsOnMiddlePage = 24;
   const rowsOnLastPage = 10;

   // Split items into pages
   const pages: any[][] = [];
   let currentItems = [...invoice.items];

   const paginate = (items: any[]) => {
      let result: any[][] = [];
      let remaining = [...items];

      if (remaining.length === 0) return [[]];

      while (remaining.length > 0) {
         // If the rest of the items fit perfectly on a last page (with footer)
         if (remaining.length <= rowsOnLastPage) {
            result.push(remaining);
            remaining = [];
         } else {
            // We need to move some to a new page because the footer won't fit here.
            // If we have more than a full middle page, take exactly one full page.
            // If we have between rowsOnLastPage and rowsOnMiddlePage, split it in half
            // so both pages look balanced and the last one has space for the footer.
            const takeCount = remaining.length > rowsOnMiddlePage
               ? rowsOnMiddlePage
               : Math.ceil(remaining.length / 2);

            result.push(remaining.slice(0, takeCount));
            remaining = remaining.slice(takeCount);
         }
      }
      return result;
   };

   const pagesData = paginate(invoice.items);
   const totalPages = pagesData.length || 1;

   return (
      <div className="industrial-invoice-wrapper">
         {pagesData.length === 0 ? (
            <InvoicePage invoice={invoice} company={company} settings={settings} items={[]} pageNo={1} totalPages={1} isLastPage={true} totalInWords={totalInWords} />
         ) : (
            pagesData.map((pageItems, idx) => (
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
                  startSno={pagesData.slice(0, idx).reduce((sum, p) => sum + p.length, 0) + 1}
               />
            ))
         )}

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
          height: 290mm;
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
           border: 1.5px solid black;
           margin: 5mm auto;
           width: 196mm;
           height: 278mm;
           display: flex;
           flex-direction: column;
        }

        .i-header { height: 95px; border-bottom: 1.5px solid black; display: flex; align-items: center; justify-content: space-between; padding: 0 15px; }
        .i-meta { font-size: 10px; font-weight: bold; border-bottom: 1.5px solid black; }
        .i-meta-row { display: flex; border-bottom: 1px solid black; }
        .i-meta-row:last-child { border-bottom: 0; }
        .i-meta-col { flex: 1; border-right: 1.5px solid black; padding: 2px 8px; display: flex; justify-content: space-between; }
        .i-meta-col:last-child { border-right: 0; }
        
        .i-address { display: flex; border-bottom: 1.5px solid black; font-size: 10.5px; font-weight: bold; }
        .i-addr-box { flex: 1; border-right: 1.5px solid black; }
        .i-addr-box:last-child { border-right: 0; }
        .i-addr-label { background: #eee; border-bottom: 1px solid black; padding: 2px 8px; font-size: 10px; }
        .i-addr-content { padding: 6px 10px; line-height: 1.4; }

        .i-table-wrap { flex: 1; display: flex; flex-direction: column; }
        .i-table { width: 100%; border-collapse: collapse; }
        .i-table th { border: 1.5px solid black; padding: 4px; font-size: 10px; text-align: center; background: #eee; }
        .i-table td { 
          border-left: 1.5px solid black; 
          border-right: 1.5px solid black; 
          padding: 3px 8px; 
          font-size: 10.5px; 
          font-weight: bold; 
          vertical-align: top;
          height: 28px;
          line-height: 1.2;
          word-break: break-word;
        }
        .i-table tr.total-row td { border-top: 1.5px solid black; border-bottom: 1.5px solid black; background: #eee; font-size: 11px; padding: 5px 8px; }
        
        .i-footer-last { border-top: 1.5px solid black; }
        .i-words { border-bottom: 1.5px solid black; padding: 4px 10px; font-size: 9.5px; font-weight: bold; text-transform: uppercase; }
        .i-details { display: flex; border-bottom: 1.5px solid black; }
        .i-details-box { flex: 1; border-right: 1.5px solid black; font-size: 10px; font-weight: bold; }
        .i-details-box:last-child { border-right: 0; }
        
        .i-sign { display: flex; border-bottom: 1.5px solid black; height: 90px; }
        .i-sign-box { flex: 1; border-right: 1.5px solid black; padding: 5px 10px; font-size: 10px; font-weight: bold; }
        .i-sign-box:last-child { border-right: 0; text-align: center; position: relative; }
        
        .i-decl { padding: 4px 10px; font-size: 7.5px; line-height: 1.2; font-weight: bold; }

        .stamp-official {
           position: absolute; top: 15px; left: 50%; transform: translateX(-50%) rotate(-10deg); width: 68px; height: 68px;
           border: 2px solid #003399; border-radius: 50%; opacity: 0.55;
           display: flex; flex-direction: column; align-items: center; justify-content: center; color: #003399;
        }

        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { margin: 0; }
          .industrial-invoice-wrapper { padding: 0; background: white; gap: 0; }
          .invoice-page { box-shadow: none; margin: 0; border: 0; page-break-after: always; }
          .invoice-page:last-child { page-break-after: avoid; }
          .border-box { margin: 10mm; border: 1.5px solid black !important; -webkit-print-color-adjust: exact !important; }
        }
      `}</style>
      </div>
   );
};

const InvoicePage = ({ invoice, company, settings, items, pageNo, totalPages, isLastPage, totalInWords, startSno }: any) => {
   return (
      <div className="invoice-page">
         <div className="border-box">
            {/* Header Section */}
            <div className="i-header">
               <div style={{ width: '85px', height: '85px' }}>
                  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                     <path d="M25 5 L75 5 L95 25 L95 75 L75 95 L25 95 L5 75 L5 25 Z" fill="none" stroke="black" strokeWidth="2.5" />
                     <circle cx="50" cy="50" r="30" fill="none" stroke="black" strokeWidth="2" />
                     <path d="M50 20 L50 8 M50 80 L50 92 M20 50 L8 50 M80 50 L92 50" stroke="black" strokeWidth="2.5" />
                     <text x="50" y="62" fontSize="34" fontWeight="900" textAnchor="middle" fill="black" fontFamily="Georgia, serif">S</text>
                  </svg>
               </div>

               <div style={{ textAlign: 'center', flex: 1 }}>
                  <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '900', letterSpacing: '0.8px' }}>
                     {company?.name?.toUpperCase() || 'GLOBUS ENGINEERING TOOLS'}
                  </h1>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '2px' }}>An ISO 9001: 2015 Certified Company</div>
               </div>

               <div style={{ width: '85px', display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ width: '65px', border: '2px solid black', textAlign: 'center' }}>
                     <div style={{ fontSize: '10px', fontWeight: 'bold', borderBottom: '1.5px solid black', background: '#eee' }}>Q</div>
                     <div style={{ padding: '4px 0' }}>
                        <div style={{ fontSize: '18px', fontWeight: '900', lineHeight: 1 }}>TÜV</div>
                        <div style={{ fontSize: '11px', fontWeight: 'bold' }}>SÜD</div>
                     </div>
                     <div style={{ fontSize: '8px', fontWeight: 'bold', borderTop: '1.5px solid black' }}>ISO 9001</div>
                  </div>
               </div>
            </div>

            {/* Invoice Meta Grid */}
            <div className="i-meta">
               <div className="i-meta-row">
                  <div className="i-meta-col"><span>Invoice No</span><span>: {invoice.invoiceNumber}</span></div>
                  <div className="i-meta-col"><span>DC No</span><span>: {invoice.dcNo || ''}</span></div>
                  <div className="i-meta-col"><span>PO No</span><span>: {invoice.poNo || ''}</span></div>
                  <div className="i-meta-col" style={{ flex: 1.2 }}><span>State</span><span>: TamilNadu-33</span></div>
               </div>
               <div className="i-meta-row">
                  <div className="i-meta-col"><span>Invoice Date</span><span>: {invoice.date ? new Date(invoice.date).toLocaleDateString('en-GB').replace(/\//g, '-') : ''}</span></div>
                  <div className="i-meta-col"><span>DC Dte</span><span>: {invoice.dcDate ? new Date(invoice.dcDate).toLocaleDateString('en-GB').replace(/\//g, '-') : ''}</span></div>
                  <div className="i-meta-col"><span>PO Date</span><span>: {invoice.poDate ? new Date(invoice.poDate).toLocaleDateString('en-GB').replace(/\//g, '-') : ''}</span></div>
                  <div className="i-meta-col" style={{ flex: 1.2 }}><span>Reverse Charge (Y/N)</span><span>: N</span></div>
               </div>
            </div>

            <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: 'bold', padding: '3px 0', borderBottom: '1.5px solid black', backgroundColor: '#eee' }}>TAX INVOICE</div>

            {/* Address Section */}
            <div className="i-address">
               <div className="i-addr-box">
                  <div className="i-addr-label">Supplier Details :</div>
                  <div className="i-addr-content">
                     <div className="d-flex"><div style={{ width: '60px' }}>Name</div><div>: {company?.name || 'Globus Engineering Tools'}</div></div>
                     <div className="d-flex"><div style={{ width: '60px' }}>Address</div><div style={{ flex: 1, height: '42px' }}>: {company?.address || 'No:24, Annaiyappan Street, S.S.Nagar, Nallampalayam, Coimbatore - 641006'}</div></div>
                     <div className="d-flex"><div style={{ width: '60px' }}>GST No</div><div>: {company?.gstin || '33AAIFG6568K1ZZ'}</div></div>
                     <div className="d-flex"><div style={{ width: '60px' }}>State</div><div style={{ width: '130px' }}>: Tamilnadu</div><div className="ms-auto" style={{ width: '70px' }}>Code : 33</div></div>
                  </div>
               </div>
               <div className="i-addr-box">
                  <div className="i-addr-label">Receipients Details :</div>
                  <div className="i-addr-content">
                     <div className="d-flex"><div style={{ width: '60px' }}>Name</div><div>: {invoice.customerName}</div></div>
                     <div className="d-flex"><div style={{ width: '60px' }}>Address</div><div style={{ flex: 1, height: '42px' }}>: {invoice.address || 'N/A'}</div></div>
                     <div className="d-flex"><div style={{ width: '60px' }}>GST No</div><div>: {invoice.gstin || 'N/A'}</div></div>
                     <div className="d-flex"><div style={{ width: '60px' }}>State</div><div style={{ width: '130px' }}>: {invoice.state || 'N/A'}</div><div className="ms-auto" style={{ width: '70px' }}>Code : {invoice.state === 'Telangana' ? '36' : '33'}</div></div>
                  </div>
               </div>
            </div>

            {/* Items Table */}
            <div className="i-table-wrap">
               <table className="i-table">
                  <thead>
                     <tr>
                        <th style={{ width: '7%' }}>S.No</th>
                        <th style={{ width: '45%' }}>Description</th>
                        <th style={{ width: '12%' }}>SAC Code</th>
                        <th style={{ width: '10%' }}>Qty</th>
                        <th style={{ width: '12%' }}>Price</th>
                        <th style={{ width: '14%' }}>Amount</th>
                     </tr>
                  </thead>
                  <tbody>
                     {items.map((item: any, idx: number) => (
                        <tr key={idx}>
                           <td style={{ textAlign: 'center' }}>{startSno + idx}</td>
                           <td>
                              <div>{item.description}</div>
                              {item.process && <div style={{ fontWeight: 'normal', fontSize: '9px', marginTop: '2px' }}>{item.process}</div>}
                           </td>
                           <td style={{ textAlign: 'center' }}>84661010</td>
                           <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                           <td style={{ textAlign: 'center' }}>{item.unitPrice.toFixed(2)}</td>
                           <td style={{ textAlign: 'right' }}>{item.amount.toFixed(2)}</td>
                        </tr>
                     ))}

                     {/* Fill remaining space with empty rows to LOCK layout */}
                     {[...Array(Math.max(0, (isLastPage ? 10 : 24) - items.length))].map((_, i) => (
                        <tr key={`empty-${i}`} style={{ height: '28px' }}>
                           <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
                        </tr>
                     ))}
                  </tbody>
                  {isLastPage && (
                     <tr className="total-row">
                        <td colSpan={2} style={{ textAlign: 'center' }}>Total</td>
                        <td>&nbsp;</td>
                        <td style={{ textAlign: 'center' }}>{invoice.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                        <td>&nbsp;</td>
                        <td style={{ textAlign: 'right' }}>{invoice.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                     </tr>
                  )}
               </table>
            </div>

            {/* Footer Section (ONLY ON LAST PAGE) */}
            {isLastPage ? (
               <div className="i-footer-last">
                  <div className="i-words">Amount Chargeable(in words) : Indian Rupees {totalInWords} Only</div>
                  <div className="i-details">
                     <div className="i-details-box">
                        <div style={{ background: '#eee', textAlign: 'center', borderBottom: '1px solid black', padding: '1px' }}>Company Details</div>
                        <div style={{ padding: '6px 10px' }}>
                           <div className="d-flex"><div style={{ width: '80px' }}>VAT TIN</div>: {settings.vatTin || '33132028969'}</div>
                           <div className="d-flex"><div style={{ width: '80px' }}>CST NO</div>: {settings.cstNo || '1091562'}</div>
                           <div className="d-flex"><div style={{ width: '80px' }}>PAN NO</div>: {settings.panNo || 'AAIFG6568K'}</div>
                        </div>
                     </div>
                     <div className="i-details-box">
                        <div style={{ background: '#eee', textAlign: 'center', borderBottom: '1px solid black', padding: '1px' }}>Bank Details</div>
                        <div style={{ padding: '6px 10px' }}>
                           <div className="d-flex"><div style={{ width: '100px' }}>Bank Name</div>: {settings.bankName || 'INDIAN OVERSEAS BANK'}</div>
                           <div className="d-flex"><div style={{ width: '100px' }}>Bank A/C</div>: {settings.bankAcc || '170902000000962'}</div>
                           <div className="d-flex"><div style={{ width: '100px' }}>Branch & IFSC</div>: {settings.bankBranchIfsc || 'IOBA0001709'}</div>
                        </div>
                     </div>
                  </div>

                  <div className="i-sign">
                     <div className="i-sign-box">Receivers Sign :</div>
                     <div className="i-sign-box">
                        <div>For {company?.name || 'Globus Engineering Tools'}</div>
                        <div className="stamp-official">
                           <div style={{ fontSize: '7px', fontWeight: '900', textAlign: 'center', lineHeight: 1.1 }}>GLOBUS<br />ENGINEERING</div>
                           <div style={{ border: '1.2px solid #003399', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '1px 0', fontSize: '12px' }}>S</div>
                           <div style={{ fontSize: '7px', fontWeight: '900' }}>TOOLS</div>
                        </div>
                     </div>
                  </div>

                  <div className="i-decl">
                     <div style={{ borderBottom: '0.5px solid #ccc', paddingBottom: '3px', marginBottom: '3px' }}>
                        <strong>Declaration:</strong> Supplied to Special Economic Zone-Duties & Taxes Are Exempted<br />
                        (Folio-No.8/3/2007 Suzlon ON INFRA SEZ DT.24.9.2007) UNDER EPCG LICENCE NO
                     </div>
                     <div style={{ textAlign: 'center', textTransform: 'uppercase', marginBottom: '3px' }}>
                        "Supply Meant For export/supply to SEZ Unit or Sez developer for authorised<br />
                        Operations under Bond or Letter of Undertaking without Payment of Integrated Tax"<br />
                        (Export Covered Under LUT NO AD330625078562X v Dated 25/06/2025)
                     </div>
                     <div>
                        <strong>Declartion:</strong> We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct
                     </div>
                  </div>
               </div>
            ) : (
               <div style={{ textAlign: 'center', padding: '10px', fontSize: '10px', color: '#777', borderTop: '1px solid #eee' }}>
                  (Continued on Page {pageNo + 1}...)
               </div>
            )}
         </div>

         {/* Page Numbers */}
         <div style={{ position: 'absolute', bottom: '5mm', right: '10mm', fontSize: '10px', fontWeight: 'bold' }}>
            Page {pageNo} of {totalPages}
         </div>
      </div>
   );
};

export default IndustrialInvoice;
