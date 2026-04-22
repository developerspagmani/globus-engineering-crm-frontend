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
   };
}

const IndustrialInvoice: React.FC<IndustrialInvoiceProps> = ({ invoice, company, settings }) => {
   const totalInWords = numberToWords(invoice.grandTotal);

   // PAGINATION CAPACITIES (Strictly calibrated for FULL header on ALL pages)
   const GLOBAL_PAGE_CAPACITY = 18;     // Full header/meta/address + 18 items as requested
   const FOOTER_SPACE_ROWS = 7;         // Space for totals on final page

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

   const pagesData = paginate(invoice.items);
   const totalPages = pagesData.length;

   // Only render pages if there are actual items
   if (pagesData.length === 0) {
      return (
         <div className="industrial-print-container">
            <div className="invoice-page">
               <div className="page-border-box">
                  {/* Header */}
                  <div className="p-header">
                     <div style={{ width: '85px', height: '85px' }}>
                        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                           <path d="M25 5 L75 5 L95 25 L95 75 L75 95 L25 95 L5 75 L5 25 Z" fill="none" stroke="#000" strokeWidth="2" />
                           <circle cx="50" cy="50" r="28" fill="none" stroke="#000" strokeWidth="2" />
                           <path d="M50 20 L50 10 M50 80 L50 90 M20 50 L10 50 M80 50 L90 50" stroke="#000" strokeWidth="2" />
                           <text x="50" y="62" fontSize="32" fontWeight="900" textAnchor="middle" fill="#000" fontFamily="Georgia, serif">S</text>
                        </svg>
                     </div>

                     <div style={{ textAlign: 'center', flex: 1 }}>
                        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '900', letterSpacing: '0.5pt' }}>
                           {settings.companyName || company?.name?.toUpperCase() || 'GLOBUS ENGINEERING MAIN'}
                        </h1>
                        <div style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '2px' }}>{settings.companySubHeader || 'An ISO 9001: 2015 Certified Company'}</div>
                        <div style={{ fontSize: '9px', fontWeight: 'bold' }}>Precision Machining & Quality Engineering Solutions</div>
                     </div>

                     <div style={{ width: '85px', display: 'flex', justifyContent: 'flex-end' }}>
                        <div style={{ width: '65px', border: '1.5pt solid #000', textAlign: 'center' }}>
                           <div style={{ fontSize: '10px', fontWeight: 'bold', borderBottom: '1pt solid #000', background: '#e9e9e9' }}>Q</div>
                           <div style={{ padding: '4px 0' }}>
                              <div style={{ fontSize: '18px', fontWeight: '900', lineHeight: 1 }}>TÜV</div>
                              <div style={{ fontSize: '11px', fontWeight: 'bold' }}>SÜD</div>
                           </div>
                           <div style={{ fontSize: '8px', fontWeight: 'bold', borderTop: '1pt solid #000' }}>ISO 9001</div>
                        </div>
                     </div>
                  </div>

                  {/* Meta Grid */}
                  <div className="p-meta">
                     <div className="p-meta-row">
                        <div className="p-meta-col"><span>Invoice No</span><span>: <span className="p-meta-val">{invoice.invoiceNumber}</span></span></div>
                        <div className="p-meta-col"><span>DC No</span><span>: <span className="p-meta-val">{invoice.dcNo || invoice.dc_no || ''}</span></span></div>
                        <div className="p-meta-col"><span>PO No</span><span>: <span className="p-meta-val">{invoice.poNo || invoice.po_no || ''}</span></span></div>
                        <div className="p-meta-col"><span>State</span><span>: <span className="p-meta-val">TamilNadu-33</span></span></div>
                     </div>
                     <div className="p-meta-row">
                        <div className="p-meta-col"><span>Invoice Date</span><span>: <span className="p-meta-val">{(invoice.date) ? new Date(invoice.date as any).toLocaleDateString('en-GB').replace(/\//g, '-') : ''}</span></span></div>
                        <div className="p-meta-col"><span></span><span>: <span className="p-meta-val">{(invoice.dcDate || invoice.dc_date) ? new Date((invoice.dcDate || invoice.dc_date) as any).toLocaleDateString('en-GB').replace(/\//g, '-') : ''}</span></span></div>
                        <div className="p-meta-col"><span>PO Date</span><span>: <span className="p-meta-val">{(invoice.poDate || invoice.po_date) ? new Date((invoice.poDate || invoice.po_date) as any).toLocaleDateString('en-GB').replace(/\//g, '-') : ''}</span></span></div>
                        <div className="p-meta-col"><span>Reverse Charge (Y/N)</span><span>: <span className="p-meta-val">N</span></span></div>
                     </div>
                  </div>

                  <div className="tax-invoice-label">Tax Invoice</div>

                  {/* Address Row */}
                  <div className="p-address">
                     <div className="p-addr-box">
                        <div className="p-addr-title">SUPPLIER DETAILS :</div>
                        <div className="p-addr-content">
                           <div style={{ display: 'grid', gridTemplateColumns: '70px auto', rowGap: '2px' }}>
                              <div>Name</div><div>: <strong>{settings.companyName || company?.name || 'Globus Engineering Main'}</strong></div>
                              <div style={{ alignSelf: 'start' }}>Address</div><div style={{ lineHeight: '1.2' }}>: {settings.companyAddress || company?.address || 'No:24, Annaiyappan Street, S.S.Nagar, Nallampalayam, Coimbatore - 641006'}</div>
                              <div>GST No</div><div>: <strong>{settings.gstNo || company?.gstin || '33AAIFG6568K1ZZ'}</strong></div>
                              <div>State</div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                 <span>: {settings.stateDetails?.split(' - ')[0] || 'Tamilnadu'}</span>
                                 <span>{settings.stateDetails?.split(' - ')[1] || 'Code : 33'}</span>
                              </div>
                           </div>
                        </div>
                     </div>
                     <div className="p-addr-box">
                        <div className="p-addr-title">RECEIPIENTS DETAILS :</div>
                        <div className="p-addr-content">
                           <div style={{ display: 'grid', gridTemplateColumns: '70px auto', rowGap: '2px' }}>
                              <div>Name</div><div>: <strong>{invoice.customerName}</strong></div>
                              <div style={{ alignSelf: 'start' }}>Address</div><div style={{ lineHeight: '1.2' }}>: {invoice.address || 'N/A'}</div>
                              <div>GST No</div><div>: <strong>{invoice.gstin || 'N/A'}</strong></div>
                              <div>State</div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                 <span>: {invoice.state || 'N/A'}</span>
                                 <span>Code : {invoice.state?.toLowerCase() === 'telangana' ? '36' : '33'}</span>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Empty Table with Footer */}
                  <div className="p-table-area">
                     <table className="p-table">
                        <thead>
                           <tr>
                              <th style={{ width: '40px' }}>S.No</th>
                              <th>Description of Goods</th>
                              <th style={{ width: '80px' }}>SAC Code</th>
                              <th style={{ width: '60px' }}>Qty</th>
                              <th style={{ width: '90px' }}>Price</th>
                              <th style={{ width: '100px' }}>Amount (Rs)</th>
                           </tr>
                        </thead>
                        <tbody>
                           <tr className="total-row">
                              <td colSpan={3} style={{ textAlign: 'right' }}>Total (Taxable Value)</td>
                              <td style={{ textAlign: 'center' }}>0</td>
                              <td>&nbsp;</td>
                              <td style={{ textAlign: 'right' }}>{invoice.subTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}</td>
                           </tr>
                            {(() => {
                               const isIntraState = (invoice.state || '').toLowerCase().replace(/[^a-z]/g, '') === 'tamilnadu';
                               const taxRate = invoice.taxRate || 0;
                               const taxTotal = invoice.taxTotal || 0;

                               if (isIntraState) {
                                  return (
                                     <>
                                        <tr style={{ height: '22px' }}>
                                           <td colSpan={5} style={{ textAlign: 'right', fontSize: '9px' }}>CGST ({taxRate / 2}%)</td>
                                           <td style={{ textAlign: 'right' }}>{(taxTotal / 2).toFixed(2) || '0.00'}</td>
                                        </tr>
                                        <tr style={{ height: '22px' }}>
                                           <td colSpan={5} style={{ textAlign: 'right', fontSize: '9px' }}>SGST ({taxRate / 2}%)</td>
                                           <td style={{ textAlign: 'right' }}>{(taxTotal / 2).toFixed(2) || '0.00'}</td>
                                        </tr>
                                     </>
                                  );
                               } else {
                                  return (
                                     <tr style={{ height: '22px' }}>
                                        <td colSpan={5} style={{ textAlign: 'right', fontSize: '9px' }}>IGST ({taxRate}%)</td>
                                        <td style={{ textAlign: 'right' }}>{taxTotal.toFixed(2) || '0.00'}</td>
                                     </tr>
                                  );
                               }
                            })()}
                           <tr className="total-row" style={{ height: '30px' }}>
                              <td colSpan={5} style={{ textAlign: 'right', fontSize: '13px' }}>GRAND TOTAL</td>
                              <td style={{ textAlign: 'right', fontSize: '13px' }}>{invoice.grandTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}</td>
                           </tr>
                        </tbody>
                     </table>
                  </div>

                  {/* Footer */}
                  <div className="p-footer">
                     <div className="p-words">Amount (in words) : <strong>{totalInWords} Only</strong></div>

                     <div className="p-details-row">
                        <div className="p-details-box">
                           <div className="p-details-head">Company Details</div>
                           <div style={{ padding: '6px 12px' }}>
                              <div>VAT TIN &nbsp;: {settings.vatTin || '33132028969'}</div>
                              <div>CST NO &nbsp;: {settings.cstNo || '1091562'}</div>
                              <div>PAN NO &nbsp;: {settings.panNo || 'AAIFG6568K'}</div>
                           </div>
                        </div>
                        <div className="p-details-box">
                           <div className="p-details-head">Bank Details</div>
                           <div style={{ padding: '6px 12px' }}>
                              <div>Bank &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: <strong>{settings.bankName || 'INDIAN OVERSEAS BANK'}</strong></div>
                              <div>A/C No &nbsp;&nbsp;: <strong>{settings.bankAcc || '170902000000962'}</strong></div>
                              <div>IFSC &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: <strong>{settings.bankBranchIfsc || 'IOBA0001709'}</strong></div>
                           </div>
                        </div>
                     </div>

                     <div className="p-signs">
                        <div className="p-sign-box">
                           <div style={{ marginBottom: '40px' }}>Receivers Sign :</div>
                        </div>
                        <div className="p-sign-box">
                           <div>For <strong>{settings.companyName || company?.name || 'Globus Engineering Tools'}</strong></div>
                           <img
                              src="/seal.png"
                              className="seal"
                              alt="seal"
                              onError={(e: any) => e.target.style.display = 'none'}
                           />
                        </div>
                     </div>

                     {settings.showDeclaration && (
                        <div className="p-declaration" style={{ whiteSpace: 'pre-line' }}>
                           {settings.declarationText || (
                              <>
                                 <div><strong>Declaration:</strong>Supplied to Special Economic Zone-Duties & Taxes Are Exempted</div>
                                 <div>(Folio-No.8/3/2007 Suzlon ON INFRA SEZ DT.24.9.2007)</div>
                                 <div style={{ marginBottom: '2px' }}>UNDER EPCG LICENCE NO</div>

                                 <div style={{ textAlign: 'center', fontSize: '8.5px' }}>
                                    "Supply Meant For export/supply yo SEZ Unit or Sez developer for authorised<br />
                                    Operations under Bond or Letter of Undertaking without Payment of Integrated Tax"<br />
                                    (Export Covered Under LUT NO AD330625078562X v Dated 25/06/2025)
                                 </div>

                                 <div style={{ marginTop: '3px' }}>
                                    Declartion: We declare that this invoice shows the actual price of the goods described and that all particulars are true and<br />
                                    correct
                                 </div>
                              </>
                           )}
                        </div>
                     )}
                  </div>
               </div>
            </div>

            <style jsx global>{`
            /* GLOBAL RESET FOR PRINT */
            @page {
              size: A4;
              margin: 0 !important;
            }

            .industrial-print-container {
              background: #fdfdfd;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 0;
              padding: 0;
              width: 100%;
            }

            .invoice-page {
              width: 210mm;
              height: 297mm; /* Exact A4 height */
              background: white;
              position: relative;
              color: black;
              font-family: 'Arial', sans-serif;
              box-sizing: border-box;
              overflow: hidden;
              padding: 5mm; /* Safe margin for most printers */
            }

            /* THE BORDER BOX - FIXED DIMENSIONS */
            .page-border-box {
               border: 1.5pt solid #000;
               width: 100%;
               height: 100%;
               display: flex;
               flex-direction: column;
               background: #fff;
               box-sizing: border-box;
            }

            /* HEADER SECTION */
            .p-header { 
               height: 110px; 
               border-bottom: 1.5pt solid #000; 
               display: flex; 
               align-items: center; 
               justify-content: space-between; 
               padding: 5px 15px; 
            }
            
            /* META GRID */
            .p-meta { 
               font-size: 10px; 
               border-bottom: 1.5pt solid #000; 
            }
            .p-meta-row { 
               display: flex; 
               border-bottom: 1pt solid #000; 
            }
            .p-meta-row:last-child { border-bottom: 0; }
            .p-meta-col { 
               flex: 1; 
               border-right: 1pt solid #000; 
               padding: 4px 8px; 
               display: flex; 
               justify-content: space-between; 
            }
            .p-meta-col:last-child { border-right: 0; }
            .p-meta-val { font-weight: 900; }

            .tax-invoice-label {
               text-align: center;
               font-size: 14px;
               font-weight: 900;
               padding: 6px 0;
               border-bottom: 1.5pt solid #000;
               background-color: #f5f5f5;
               letter-spacing: 2px;
               text-transform: uppercase;
            }

            /* ADDRESS SECTION */
            .p-address { 
               display: flex; 
               border-bottom: 1.5pt solid #000; 
               font-size: 9px; 
               min-height: 90px; 
            }
            .p-addr-box { 
               flex: 1; 
               border-right: 1.5pt solid #000; 
               display: flex; 
               flex-direction: column; 
            }
            .p-addr-box:last-child { border-right: 0; }
            .p-addr-title { 
               background: #f0f0f0; 
               border-bottom: 1.2pt solid #000; 
               padding: 4px 8px; 
               font-weight: 900;
               font-size: 10px;
               text-transform: uppercase;
            }
            .p-addr-content { 
               padding: 8px 12px; 
               flex: 1; 
               line-height: 1.4;
            }

            /* TABLE SECTION */
            .p-table-area { 
               flex: 1; 
               display: flex; 
               flex-direction: column; 
            }
            .p-table { 
               width: 100%; 
               border-collapse: collapse; 
               table-layout: fixed;
               height: 100%;
            }
            .p-table th { 
               border: 1pt solid #000; 
               padding: 6px 2px; 
               font-size: 9px; 
               text-align: center; 
               background: #f0f0f0; 
               text-transform: uppercase;
               font-weight: 900;
            }
            .p-table td { 
               border: 1pt solid #000; 
               padding: 6px 10px; 
               font-size: 11px; 
               font-weight: 800; 
               vertical-align: top;
               height: 34px; 
               line-height: 1.3;
            }
            .p-table tr.total-row td { 
               border-top: 2pt solid #000; 
               border-bottom: 1.5pt solid #000;
               background: #f9f9f9; 
               font-size: 11.5px; 
               font-weight: 900;
               height: 28px;
            }

            /* FOOTER FOR LAST PAGE */
            .p-footer { 
               border-top: 1.5pt solid #000; 
               background: #fff;
            }
            .p-words { 
               border-bottom: 1pt solid #000; 
               padding: 5px 15px; 
               font-size: 10px; 
               text-transform: uppercase; 
               font-weight: 900;
            }
            .p-details-row { 
               display: flex; 
               border-bottom: 1.5pt solid #000; 
            }
            .p-details-box { 
               flex: 1; 
               border-right: 1.5pt solid #000; 
               font-size: 9.5px; 
            }
            .p-details-box:last-child { border-right: 0; }
            .p-details-head {
               background: #f0f0f0;
               text-align: center;
               border-bottom: 1pt solid #000;
               padding: 3px;
               font-weight: 900;
               font-size: 11px;
            }
            
            .p-signs { 
               display: flex; 
               border-bottom: 1.5pt solid #000; 
               height: 80px; 
            }
            .p-sign-box { 
               flex: 1; 
               border-right: 1.5pt solid #000; 
               padding: 8px 15px; 
               font-size: 11px; 
               font-weight: 900;
               position: relative;
            }
            .p-sign-box:last-child { border-right: 0; text-align: center; }

            .p-declaration { 
               padding: 6px 15px; 
               font-size: 8.5px; 
               line-height: 1.3; 
               font-weight: 800; 
               background: #fff; 
            }

            .seal {
               position: absolute;
               top: 0;
               left: 50%;
               transform: translateX(-50%) rotate(-10deg);
               width: 65px;
               height: 65px;
               opacity: 0.55;
            }

            /* PRINT OVERRIDES */
            @media print {
               body { margin: 0 !important; background: #fff !important; }
               .industrial-print-container { background: #fff !important; }
               .invoice-page { 
                  box-shadow: none !important; 
                  margin: 0 auto !important; 
                  border: none !important;
                  width: 190mm !important;
                  height: 270mm !important;
                  overflow: hidden !important;
               }
               .page-border-box { 
              border: 1.5pt solid #000 !important; 
              margin: 1mm auto !important;
              width: 185mm !important;
              height: 265mm !important;
              display: flex !important;
              flex-direction: column !important;
              overflow: hidden !important;
           }
           .p-table-area {
              flex: 1 !important;
              display: flex !important;
              flex-direction: column !important;
           }
           .p-table {
              width: 100% !important;
              border-collapse: collapse !important;
              flex: 1 !important;
           }
           .industrial-print-container {
              page-break-after: avoid !important;
              page-break-inside: avoid !important;
           }
           .invoice-page {
              page-break-after: avoid !important;
              page-break-inside: avoid !important;
           }
           .invoice-page:last-child {
              page-break-after: auto !important;
           }
            }
         `}</style>
         </div>
      );
   }

   return (
      <div className="industrial-print-container">
         {pagesData.length > 0 && pagesData.map((pageItems, idx) => (
            <InvoicePage
               key={idx}
               invoice={invoice}
               company={company}
               settings={settings}
               items={pageItems}
               isLastPage={idx === totalPages - 1}
               totalInWords={totalInWords}
               startSno={pagesData.slice(0, idx).reduce((sum: number, p: any[]) => sum + p.length, 0) + 1}
               capacity={GLOBAL_PAGE_CAPACITY}
               footerSpaceNeeded={idx === totalPages - 1 ? FOOTER_SPACE_ROWS : 0}
            />
         ))}

         <style jsx global>{`
        /* GLOBAL RESET FOR PRINT */
        @page {
          size: A4;
          margin: 5mm !important;
        }

        .industrial-print-container {
          background: #fdfdfd;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
          padding: 0;
          width: 100%;
          margin: 0;
        }

        .invoice-page {
          width: 190mm;
          height: 270mm;
          background: white;
          position: relative;
          color: black;
          font-family: 'Arial', sans-serif;
          box-sizing: border-box;
          border: none;
          margin: 0 auto;
          overflow: hidden;
        }

        
        /* THE BORDER BOX - FIXED DIMENSIONS */
        .page-border-box {
           border: 1.5pt solid #000;
           margin: 1mm auto;
           width: 185mm;
           height: 265mm;
           display: flex;
           flex-direction: column;
           background: #fff;
           box-sizing: border-box;
           overflow: hidden;
        }

        /* HEADER SECTION */
        .p-header { 
           height: 100px; 
           border-bottom: 1.5pt solid #000; 
           display: flex; 
           align-items: center; 
           justify-content: space-between; 
           padding: 0 15px; 
           page-break-inside: avoid;
        }
        
        /* META GRID */
        .p-meta { 
           font-size: 10px; 
           border-bottom: 1.5pt solid #000; 
           page-break-inside: avoid;
        }
        .p-meta-row { 
           display: flex; 
           border-bottom: 1pt solid #000; 
        }
        .p-meta-row:last-child { border-bottom: 0; }
        .p-meta-col { 
           flex: 1; 
           border-right: 1pt solid #000; 
           padding: 4px 8px; 
           display: flex; 
           justify-content: space-between; 
        }
        .p-meta-col:last-child { border-right: 0; }
        .p-meta-val { font-weight: bold; }

        .tax-invoice-label {
           text-align: center;
           font-size: 12px;
           font-weight: 900;
           padding: 5px 0;
           border-bottom: 1.5pt solid #000;
           background-color: #f0f0f0;
           letter-spacing: 1px;
           text-transform: uppercase;
           page-break-after: avoid;
           page-break-inside: avoid;
        }

        /* ADDRESS SECTION */
        .p-address { 
           display: flex; 
           border-bottom: 1.5pt solid #000; 
           font-size: 8.5px; 
           min-height: 80px; 
           page-break-inside: avoid;
        }
        .p-addr-box { 
           flex: 1; 
           border-right: 1.5pt solid #000; 
           display: flex; 
           flex-direction: column; 
        }
        .p-addr-box:last-child { border-right: 0; }
        .p-addr-title { 
           background: #e9e9e9; 
           border-bottom: 1pt solid #000; 
           padding: 3px 8px; 
           font-weight: bold;
           font-size: 9px;
           text-transform: uppercase;
        }
        .p-addr-content { 
           padding: 8px 10px; 
           flex: 1; 
           line-height: 1.4;
        }

        /* TABLE SECTION */
        .p-table-area { 
           flex: 1; 
           display: flex; 
           flex-direction: column; 
        }
        .p-table { 
           width: 100%; 
           border-collapse: collapse; 
           table-layout: fixed;
        }
        .p-table th { 
           border: 1pt solid #000; 
           padding: 4px 2px; 
           font-size: 8.5px; 
           text-align: center; 
           background: #e9e9e9; 
           text-transform: uppercase;
           font-weight: bold;
        }
        .p-table td { 
           border: 1pt solid #000; 
           padding: 2px 6px; 
           font-size: 9px; 
           font-weight: bold; 
           vertical-align: top;
           height: 21px; 
           line-height: 1.2;
           word-break: break-all;
        }
        .p-table tr.total-row td { 
           border-top: 1.5pt solid #000; 
           border-bottom: 1.pt solid #000;
           background: #f9f9f9; 
           font-size: 11px; 
           font-weight: 900;
        }

        /* FOOTER FOR LAST PAGE */
        .p-footer { border-top: 1.5pt solid #000; }
        .p-words { 
           border-bottom: 1pt solid #000; 
           padding: 3px 12px; 
           font-size: 9px; 
           text-transform: uppercase; 
           font-weight: bold;
        }
        .p-details-row { 
           display: flex; 
           border-bottom: 1.5pt solid #000; 
        }
        .p-details-box { 
           flex: 1; 
           border-right: 1.5pt solid #000; 
           font-size: 9px; 
        }
        .p-details-box:last-child { border-right: 0; }
        .p-details-head {
           background: #e9e9e9;
           text-align: center;
           border-bottom: 1pt solid #000;
           padding: 2px;
           font-weight: bold;
           font-size: 10px;
        }
        
        .p-signs { 
           display: flex; 
           border-bottom: 1.5pt solid #000; 
           height: 65px; 
        }
        .p-sign-box { 
           flex: 1; 
           border-right: 1.5pt solid #000; 
           padding: 5px 10px; 
           font-size: 10px; 
           font-weight: bold;
           position: relative;
        }
        .p-sign-box:last-child { border-right: 0; text-align: center; }

        .p-declaration { 
           padding: 5px 10px; 
           font-size: 8px; 
           line-height: 1.2; 
           font-weight: bold; 
           background: #fff; 
        }

        .seal {
           position: absolute;
           top: 0;
           left: 50%;
           transform: translateX(-50%) rotate(-10deg);
           width: 65px;
           height: 65px;
           opacity: 0.55;
        }

        .page-num {
           position: absolute;
           bottom: 15mm; /* Safe from bottom edge */
           right: 15mm;
           font-size: 8px;
           font-weight: bold;
           opacity: 0.6;
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
              margin: 0 !important;
              padding: 0 !important;
              height: auto !important;
              min-height: 0 !important;
              overflow: visible !important;
           }
           .industrial-print-container:empty {
              display: none !important;
           }
           /* invoice-page must be overflow:visible so declaration
              can show even if border-box content slightly exceeds 265mm */
           .invoice-page {
              overflow: visible !important;
           }
           /* Keep 265mm height so flex:1 table area fills properly.
              overflow:visible lets the declaration render below the border line
              if it exceeds 265mm on the last page */
           .page-border-box {
              overflow: visible !important;
           }
           /* Last page border box: auto-height so content determines size */
           .page-border-box.last-page {
              height: auto !important;
              min-height: 265mm;
           }
           .p-table-area {
              flex: 1 !important;
              display: flex !important;
              flex-direction: column !important;
           }
           .p-table {
              flex: 1 !important;
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

const InvoicePage = ({ invoice, company, settings, items, isLastPage, totalInWords, startSno, capacity, footerSpaceNeeded }: any) => {
   const isFirstPage = startSno === 1;

   // Filler rows to reach full page height
   const targetRows = isLastPage ? (capacity - footerSpaceNeeded) : capacity;
   const fillerCount = Math.max(0, targetRows - items.length);

   return (
      <div
         className="invoice-page"
         style={{
            pageBreakAfter: isLastPage ? 'avoid' : 'always',
            breakAfter: isLastPage ? 'avoid' : 'page',
         }}
      >
         <div className={`page-border-box${isLastPage ? ' last-page' : ''}`}>
            {/* Header - Always full on every page */}
            <div className="p-header">
               <div style={{ width: '85px', height: '85px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {(settings.logo || company?.logo) && settings.showLogo ? (
                     <img
                        src={settings.logo && settings.logo.length > 10 ? settings.logo : company?.logo}
                        alt="Logo"
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                     />
                  ) : settings.showLogo ? (
                     <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                        <path d="M25 5 L75 5 L95 25 L95 75 L75 95 L25 95 L5 75 L5 25 Z" fill="none" stroke="#000" strokeWidth="2" />
                        <circle cx="50" cy="50" r="28" fill="none" stroke="#000" strokeWidth="2" />
                        <circle cx="50" cy="50" r="22" fill="none" stroke="#000" strokeWidth="1.2" />
                        <path d="M50 20 L50 10 M50 80 L50 90 M20 50 L10 50 M80 50 L90 50" stroke="#000" strokeWidth="2" />
                        <text x="50" y="62" fontSize="32" fontWeight="900" textAnchor="middle" fill="#000" fontFamily="Arial, sans-serif">S</text>
                     </svg>
                  ) : null}
               </div>

               <div style={{ textAlign: 'center', flex: 1 }}>
                  <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '900', letterSpacing: '0.8pt' }}>
                     {settings.companyName || company?.name?.toUpperCase() || 'GLOBUS ENGINEERING MAIN'}
                  </h1>
                  <div style={{ fontSize: '12px', fontWeight: '900', marginTop: '2px' }}>{settings.companySubHeader || 'An ISO 9001: 2015 Certified Company'}</div>
                  <div style={{ fontSize: '10px', fontWeight: '900', marginTop: '1px' }}>Precision Machining & Quality Engineering Solutions</div>
               </div>

               <div style={{ width: '85px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                  {(settings.logoSecondary || company?.logoSecondary) && settings.showLogo ? (
                     <img
                        src={settings.logoSecondary && settings.logoSecondary.length > 10 ? settings.logoSecondary : company?.logoSecondary}
                        alt="Secondary Logo"
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                     />
                  ) : settings.showLogo ? (
                     <div style={{ width: '65px', border: '1.5pt solid #000', textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', fontWeight: '900', borderBottom: '1.2pt solid #000', background: '#f0f0f0', padding: '1px 0' }}>Q</div>
                        <div style={{ padding: '3px 0' }}>
                           <div style={{ fontSize: '18px', fontWeight: '900', lineHeight: 1 }}>TÜV</div>
                           <div style={{ fontSize: '11px', fontWeight: '900' }}>SÜD</div>
                        </div>
                        <div style={{ fontSize: '8px', fontWeight: '900', borderTop: '1.2pt solid #000', padding: '1px 0' }}>ISO 9001</div>
                     </div>
                  ) : null}
               </div>
            </div>

            {/* Meta Grid - Always on every page */}
            <div className="p-meta">
               <div className="p-meta-row">
                  <div className="p-meta-col"><span>Invoice No</span><span>: <span className="p-meta-val">{invoice.invoiceNumber}</span></span></div>
                  <div className="p-meta-col"><span>DC No</span><span>: <span className="p-meta-val">{invoice.dcNo || invoice.dc_no || ''}</span></span></div>
                  <div className="p-meta-col"><span>PO No</span><span>: <span className="p-meta-val">{invoice.poNo || invoice.po_no || ''}</span></span></div>
                  <div className="p-meta-col"><span>State</span><span>: <span className="p-meta-val">TamilNadu-33</span></span></div>
               </div>
               <div className="p-meta-row">
                  <div className="p-meta-col"><span>Invoice Date</span><span>: <span className="p-meta-val">{(invoice.date) ? new Date(invoice.date as any).toLocaleDateString('en-GB').replace(/\//g, '-') : ''}</span></span></div>
                  <div className="p-meta-col"><span>DC Date</span><span>: <span className="p-meta-val">{(invoice.dcDate || invoice.dc_date) ? new Date((invoice.dcDate || invoice.dc_date) as any).toLocaleDateString('en-GB').replace(/\//g, '-') : ''}</span></span></div>
                  <div className="p-meta-col"><span>PO Date</span><span>: <span className="p-meta-val">{(invoice.poDate || invoice.po_date) ? new Date((invoice.poDate || invoice.po_date) as any).toLocaleDateString('en-GB').replace(/\//g, '-') : ''}</span></span></div>
                  <div className="p-meta-col">
                     <span>Reverse Charge</span><span>: <span className="p-meta-val">N</span></span>
                  </div>
               </div>
            </div>

            <div className="tax-invoice-label">Tax Invoice</div>

            {/* Address Row - Always on every page */}
            <div className="p-address">
               <div className="p-addr-box">
                  <div className="p-addr-title">SUPPLIER DETAILS :</div>
                  <div className="p-addr-content">
                     <div style={{ display: 'grid', gridTemplateColumns: '70px auto', rowGap: '2px' }}>
                        <div>Name</div><div>: <strong>{settings.companyName || company?.name || 'Globus Engineering Main'}</strong></div>
                        <div style={{ alignSelf: 'start' }}>Address</div><div style={{ lineHeight: '1.2' }}>: {settings.companyAddress || company?.address || 'No:24, Annaiyappan Street, S.S.Nagar, Nallampalayam, Coimbatore - 641006'}</div>
                        <div>GST No</div><div>: <strong>{settings.gstNo || company?.gstin || '33AAIFG6568K1ZZ'}</strong></div>
                        <div>State</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                           <span>: {settings.stateDetails?.split(' - ')[0] || 'Tamilnadu'}</span>
                           <span>{settings.stateDetails?.split(' - ')[1] || 'Code : 33'}</span>
                        </div>
                     </div>
                  </div>
               </div>
               <div className="p-addr-box">
                  <div className="p-addr-title">RECEIPIENTS DETAILS :</div>
                  <div className="p-addr-content">
                     <div style={{ display: 'grid', gridTemplateColumns: '70px auto', rowGap: '2px' }}>
                        <div>Name</div><div>: <strong>{invoice.customerName}</strong></div>
                        <div style={{ alignSelf: 'start' }}>Address</div><div style={{ lineHeight: '1.2' }}>: {invoice.address || 'N/A'}</div>
                        <div>GST No</div><div>: <strong>{invoice.gstin || 'N/A'}</strong></div>
                        <div>State</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                           <span>: {invoice.state || 'N/A'}</span>
                           <span>Code : {invoice.state?.toLowerCase() === 'telangana' ? '36' : '33'}</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Items Table */}
            <div className="p-table-area">
               <table className="p-table">
                  <thead>
                     <tr>
                        <th style={{ width: '40px' }}>S.No</th>
                        <th>Description of Goods</th>
                        <th style={{ width: '80px' }}>SAC Code</th>
                        <th style={{ width: '60px' }}>Qty</th>
                        <th style={{ width: '90px' }}>Price</th>
                        <th style={{ width: '100px' }}>Amount (₹)</th>
                     </tr>
                  </thead>
                  <tbody>
                     {items.map((item: any, idx: number) => (
                        <tr key={idx}>
                           <td style={{ textAlign: 'center' }}>{startSno + idx}</td>
                           <td style={{ fontWeight: 'bold' }}>{item.description}</td>
                           <td style={{ textAlign: 'center' }}>84661010</td>
                           <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                           <td style={{ textAlign: 'right' }}>{item.unitPrice.toFixed(2)}</td>
                           <td style={{ textAlign: 'right' }}>{item.amount.toFixed(2)}</td>
                        </tr>
                     ))}

                     {/* Full Filler Rows to occupy entire page height */}
                     {[...Array(fillerCount)].map((_, i) => (
                        <tr key={`filler-${i}`}>
                           <td style={{ textAlign: 'center' }}>&nbsp;</td>
                           <td>&nbsp;</td>
                           <td>&nbsp;</td>
                           <td>&nbsp;</td>
                           <td>&nbsp;</td>
                           <td>&nbsp;</td>
                        </tr>
                     ))}

                     {isLastPage && (
                        <>
                           <tr className="total-row">
                              <td colSpan={3} style={{ textAlign: 'right' }}>Total (Taxable Value)</td>
                              <td style={{ textAlign: 'center' }}>{invoice.items.reduce((sum: number, item: any) => sum + item.quantity, 0)}</td>
                              <td>&nbsp;</td>
                              <td style={{ textAlign: 'right' }}>{invoice.subTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                           </tr>
                           {(() => {
                              const isIntraState = (invoice.state || '').toLowerCase().replace(/[^a-z]/g, '') === 'tamilnadu';
                              const taxRate = invoice.taxRate || 0;
                              const taxTotal = invoice.taxTotal || 0;

                              if (isIntraState) {
                                 return (
                                    <>
                                       <tr style={{ height: '22px' }}>
                                          <td colSpan={5} style={{ textAlign: 'right', fontSize: '9px' }}>CGST ({taxRate / 2}%)</td>
                                          <td style={{ textAlign: 'right' }}>{(taxTotal / 2).toFixed(2)}</td>
                                       </tr>
                                       <tr style={{ height: '22px' }}>
                                          <td colSpan={5} style={{ textAlign: 'right', fontSize: '9px' }}>SGST ({taxRate / 2}%)</td>
                                          <td style={{ textAlign: 'right' }}>{(taxTotal / 2).toFixed(2)}</td>
                                       </tr>
                                    </>
                                 );
                              } else {
                                 return (
                                    <tr style={{ height: '22px' }}>
                                       <td colSpan={5} style={{ textAlign: 'right', fontSize: '9px' }}>IGST ({taxRate}%)</td>
                                       <td style={{ textAlign: 'right' }}>{taxTotal.toFixed(2)}</td>
                                    </tr>
                                 );
                              }
                           })()}
                           <tr className="total-row" style={{ height: '30px' }}>
                              <td colSpan={5} style={{ textAlign: 'right', fontSize: '13px' }}>GRAND TOTAL</td>
                              <td style={{ textAlign: 'right', fontSize: '13px' }}>{invoice.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                           </tr>
                        </>
                     )}
                  </tbody>
               </table>
            </div>

            {/* Footer only on last page */}
            {isLastPage && (
               <div className="p-footer">
                  <div className="p-words">Amount (in words) : <strong>{totalInWords.toUpperCase()}</strong></div>

                  <div className="p-details-row">
                     <div className="p-details-box">
                        <div className="p-details-head">Company Details</div>
                        <div style={{ padding: '6px 12px' }}>
                           <div>VAT TIN &nbsp;: {settings.vatTin || '33132028969'}</div>
                           <div>CST NO &nbsp;: {settings.cstNo || '1091562'}</div>
                           <div>PAN NO &nbsp;: {settings.panNo || 'AAIFG6568K'}</div>
                        </div>
                     </div>
                     <div className="p-details-box">
                        <div className="p-details-head">Bank Details</div>
                        <div style={{ padding: '6px 12px' }}>
                           <div>Bank &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: <strong>{settings.bankName || 'INDIAN OVERSEAS BANK'}</strong></div>
                           <div>A/C No &nbsp;&nbsp;: <strong>{settings.bankAcc || '170902000000962'}</strong></div>
                           <div>IFSC &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: <strong>{settings.bankBranchIfsc || 'IOBA0001709'}</strong></div>
                        </div>
                     </div>
                  </div>

                  <div className="p-signs">
                     <div className="p-sign-box">
                        <div style={{ marginBottom: '40px' }}>Receivers Sign :</div>
                     </div>
                     <div className="p-sign-box">
                        <div>For <strong>{settings.companyName || company?.name || 'Globus Engineering Tools'}</strong></div>
                        <img
                           src="/seal.png"
                           className="seal"
                           alt="seal"
                           onError={(e: any) => e.target.style.display = 'none'}
                        />
                     </div>
                  </div>

                  {settings.showDeclaration && (
                     <div className="p-declaration" style={{ whiteSpace: 'pre-line' }}>
                        {settings.declarationText || (
                           <>
                              <div><strong>Declaration:</strong>Supplied to Special Economic Zone-Duties & Taxes Are Exempted</div>
                              <div>(Folio-No.8/3/2007 Suzlon ON INFRA SEZ DT.24.9.2007)</div>
                              <div style={{ marginBottom: '2px' }}>UNDER EPCG LICENCE NO</div>

                              <div style={{ textAlign: 'center', fontSize: '8.5px' }}>
                                 "Supply Meant For export/supply yo SEZ Unit or Sez developer for authorised<br />
                                 Operations under Bond or Letter of Undertaking without Payment of Integrated Tax"<br />
                                 (Export Covered Under LUT NO AD330625078562X v Dated 25/06/2025)
                              </div>

                              <div style={{ marginTop: '3px' }}>
                                 Declartion: We declare that this invoice shows the actual price of the goods described and that all particulars are true and<br />
                                 correct
                              </div>
                           </>
                        )}
                     </div>
                  )}
               </div>
            )}
         </div>
      </div>
   );
};

export default IndustrialInvoice;
