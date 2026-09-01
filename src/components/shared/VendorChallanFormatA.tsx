'use client';
import React from 'react';

/**
 * VENDOR OUTWARD CHALLAN - FORMAT A
 * EXACT replica of the physical "Delivery Challan" reference image.
 *
 * Header layout (reference):
 *   [Logo]  |  GLOBUS ENGINEERING TOOLS (large, bold right)  |  [TÜV badge]
 *              An ISO 9001 : 2015 Certified Company (italic below)
 *
 * Table empty rows: NO inner column gridlines. Just one big open space.
 * Only the S.NO and QTY outer borders show on item rows.
 */

interface FormatAProps {
   data: any;
   company?: any;
   settings?: any;
}

const VendorChallanFormatA: React.FC<FormatAProps> = ({ data, company, settings: propSettings }) => {
   const settings = propSettings || company?.invoiceSettings || {};

   const companyName = (() => {
      const n = settings.companyName || company?.name || '';
      if (!n || n.includes('Machining') || n === 'Globus Engineering Tools') return 'GLOBUS ENGINEERING TOOLS';
      return n.toUpperCase();
   })();

   const companyAddress = (() => {
      const sub = settings.companySubHeader || company?.address || '';
      if (!sub || sub.includes('Machining') || sub.includes('Quality')) {
         return 'No:24, Annaiyappan Street, S.S.Nagar, Nallampalayam, Ganapathy Post, Coimbatore-641006,TAMIL NADU';
      }
      return sub;
   })();

   const gstNo = settings.gstNo || company?.gstin || '33AAIFG6568K1ZZ';
   const website = company?.website || 'www.globusengineeringtools.com';

   const vendorName = data.vendorName || data.customerName || data.partyName || '';
   const vendorAddress = data.address || data.partyAddress || '';
   const vendorGst = data.gstin || '';

   const dcNo = data.outwardNo || data.dcNo || '-';
   const dcDate = data.date
      ? new Date(data.date).toLocaleDateString('en-GB').replace(/\//g, '-')
      : '-';

   const items: any[] = data.items || [];
   const totalQty = items.reduce((s: number, it: any) => s + Number(it.quantity || 0), 0);

   const coatingOrVendorLabel = data.coatingName || vendorName || '';

   const logoSrc = (settings.logo && settings.logo.length > 10) ? settings.logo : company?.logo;
   const secondaryLogoSrc = (settings.logoSecondary && settings.logoSecondary.length > 10) ? settings.logoSecondary : company?.logoSecondary;

   // Number of empty filler rows (reference shows ~10-12 blank rows in the big table area)
   const TOTAL_ROWS = 12;
   const fillerCount = Math.max(0, TOTAL_ROWS - items.length);
   return (
      <>
         <div className="cha-wrap">
            <div className="cha-outer">

               {/* ══════════════════════════════════════════════
                   HEADER: Logo | Company Name & Address
               ══════════════════════════════════════════════ */}
               <div className="cha-header">
                  <div className="cha-logo-left">
                     {logoSrc && <img src={logoSrc} alt="Logo" className="cha-logo-img" />}
                  </div>
                  <div className="cha-header-center">
                     <div className="cha-company-name">{companyName}</div>
                     <div className="cha-company-iso">An ISO 9001 : 2015 Certified Company</div>
                     <div className="cha-company-address-block">
                        <div>{companyAddress}</div>
                        <div>GSTIN:{gstNo}</div>
                        <div>Web : {website}</div>
                     </div>
                  </div>
               </div>

               {/* ══════════════════════════════════════════════
                   TITLE
               ══════════════════════════════════════════════ */}
               <div className="cha-title">DELIVERY CHALLAN</div>

               {/* ══════════════════════════════════════════════
                   TO + DC.NO / DATE
               ══════════════════════════════════════════════ */}
               <div className="cha-to-section">
                  {/* LEFT: TO, vendor name + address */}
                  <div className="cha-to-left">
                     <div className="cha-to-label">TO,</div>
                     <div className="cha-to-details">
                        <div className="cha-to-name">{vendorName}</div>
                        {vendorAddress && <div className="cha-to-addr">{vendorAddress}</div>}
                        {vendorGst && <div className="cha-to-gst">GST No :{vendorGst}</div>}
                     </div>
                  </div>

                  {/* RIGHT: DC.NO + DATE + JOB VALUE */}
                  <div className="cha-dc-right">
                     <div className="cha-dc-row">
                        <div className="cha-dc-key">DC.NO</div>
                        <div className="cha-dc-val cha-dc-no-val">{dcNo}</div>
                     </div>
                     <div className="cha-dc-row">
                        <div className="cha-dc-key">DATE</div>
                        <div className="cha-dc-val cha-dc-date-val">{dcDate}</div>
                     </div>
                     <div className="cha-dc-row">
                        <div className="cha-dc-key">JOB VALUE</div>
                        <div className="cha-dc-val cha-dc-job-val">{data.jobNo || data.jobValue || data.job || '-'}</div>
                     </div>
                     {((data.status === 'cancelled' && data.inwardNo) || (data.processName === 'REJECTED / RETURNED')) && (
                        <div className="cha-dc-row">
                           <div className="cha-dc-key" style={{ color: '#000' }}>STATUS</div>
                           <div className="cha-dc-val" style={{ fontSize: '18px', fontWeight: '900', color: '#000', letterSpacing: '1px' }}>CANCELLED</div>
                        </div>
                     )}
                     {data.processName && data.processName !== "REJECTED / RETURNED" && !(data.status === "cancelled" && data.inwardNo) && (
                        <div className="cha-dc-row">
                           <div className="cha-dc-key">PROCESS</div>
                           <div className="cha-dc-val" style={{ fontSize: '14px', fontWeight: 'bold', color: '#000' }}>{data.processName}</div>
                        </div>
                     )}
                     {data.partyType !== 'customer' && (
                        <div className="cha-dc-row">
                           <div className="cha-dc-key">COATING</div>
                           <div className="cha-dc-val" style={{ fontSize: '14px', fontWeight: 'bold', color: '#000' }}>{data.coatingName || data.processType || 'ULTRA COATING'}</div>
                        </div>
                     )}

                  </div>
               </div>

               {/* ══════════════════════════════════════════════
                   ITEMS TABLE  — fills the page
                   S.NO | DESCRIPTION | [BLANK] | QTY
               ══════════════════════════════════════════════ */}
               <div className="cha-table-wrap">
                  {/* Header */}
                  <div className="cha-tbl-head">
                     <div className="cha-col-sno cha-th">S.NO</div>
                     <div className="cha-col-desc cha-th">DESCRIPTION</div>
                     <div className="cha-col-qty cha-th">QTY</div>
                  </div>

                  {/* Body rows — items + filler */}
                  <div className="cha-tbl-body">
                     {/* S.NO column */}
                     <div className="cha-col-sno cha-col-body">
                        {items.map((_, i) => (
                           <div key={i} className="cha-cell">{i + 1}</div>
                        ))}
                        {[...Array(fillerCount)].map((_, i) => (
                           <div key={`fs-${i}`} className="cha-cell cha-filler">&nbsp;</div>
                        ))}
                     </div>
                     {/* DESCRIPTION column */}
                     <div className="cha-col-desc cha-col-body">
                        {items.map((item: any, i: number) => (
                           <div key={i} className="cha-cell">{item.description || ''}</div>
                        ))}
                        {[...Array(fillerCount)].map((_, i) => (
                           <div key={`fd-${i}`} className="cha-cell cha-filler">&nbsp;</div>
                        ))}
                     </div>
                     {/* QTY column */}
                     <div className="cha-col-qty cha-col-body cha-col-last">
                        {items.map((item: any, i: number) => (
                           <div key={i} className="cha-cell">{item.quantity ?? ''}</div>
                        ))}
                        {[...Array(fillerCount)].map((_, i) => (
                           <div key={`fq-${i}`} className="cha-cell cha-filler">&nbsp;</div>
                        ))}
                     </div>
                  </div>

                  {/* TOTAL row */}
                  <div className="cha-tbl-total">
                     <div className="cha-col-sno"></div>
                     <div className="cha-col-desc cha-td-total-label" style={{ justifyContent: 'flex-end', paddingRight: '20px' }}>TOTAL</div>
                     <div className="cha-col-qty cha-td-total-val">{totalQty || ''}</div>
                  </div>
               </div>

               {/* ══════════════════════════════════════════════
                   FOOTER — below the table
                   Row 1: Coating name (shaded) | right blank
                   Row 2: Received text         | For Company
                   Row 3: Receivers signature   | Authorised signature
               ══════════════════════════════════════════════ */}
               <div className="cha-footer">
                  {/* Row 0 - Purpose */}
                  <div className="cha-foot-row cha-foot-purpose-row">
                     <div className="cha-foot-left cha-foot-purpose">PURPOSE: {data.purpose || '-'}</div>
                     <div className="cha-foot-right"></div>
                  </div>
                  {/* Row 1 – Coating / Process label */}
                  {data.partyType !== 'customer' && (
                     <div className="cha-foot-row cha-foot-coating-row">
                        <div className="cha-foot-left cha-foot-coating">{coatingOrVendorLabel.toUpperCase()}</div>
                        <div className="cha-foot-right"></div>
                     </div>
                  )}
                  {/* Row 2 – Received text | For company */}
                  <div className="cha-foot-row cha-foot-received-row">
                     <div className="cha-foot-left cha-foot-received">Received the above goods in good condition</div>
                     <div className="cha-foot-right cha-foot-for-company">For&nbsp;<strong>{companyName}</strong></div>
                  </div>
                  {/* Row 3 – Signatures */}
                  <div className="cha-foot-row cha-foot-sign-row">
                     <div className="cha-foot-left cha-foot-sign-text">Receivers signature</div>
                     <div className="cha-foot-right cha-foot-sign-text" style={{ position: 'relative' }}>
                        {companyName.includes('GLOBUS') && (
                           <img
                              src="/seal.png"
                              alt="seal"
                              style={{ position: 'absolute', right: '50px', bottom: '15px', width: '70px', height: '70px', opacity: 0.55, zIndex: 1, transform: 'rotate(-5deg)' }}
                              onError={(e) => (e.target as any).style.display = 'none'}
                           />
                        )}
                        <span style={{ position: 'relative', zIndex: 2 }}>Authorised signature</span>
                     </div>
                  </div>
               </div>

            </div>
         </div>

         <style jsx global>{`
            /* ── Wrapper ──────────────────────────────────── */
            .cha-wrap {
               width: 190mm;
               margin: 0 auto;
               background: #fff;
               font-family: Arial, Helvetica, sans-serif;
               font-size: 10px;
               color: #000;
            }
            .cha-outer {
               border: 1.5pt solid #000;
               display: flex;
               flex-direction: column;
               min-height: 277mm;
            }

            /* ── HEADER ────────────────────────────────────── */
            .cha-header {
               display: flex;
               align-items: center;
               border-bottom: 1pt solid #000;
               padding: 10px;
               gap: 15px;
               min-height: 100px;
               background: #f4f4f4;
            }
            .cha-logo-left {
               width: 140px;
               height: 100px;
               flex-shrink: 0;
               display: flex;
               align-items: center;
               justify-content: center;
            }
            .cha-logo-img {
               max-width: 100%;
               max-height: 100%;
               object-fit: contain;
            }
            .cha-header-center {
               flex: 1;
               text-align: center;
               display: flex;
               flex-direction: column;
               justify-content: center;
            }
            .cha-company-name {
               font-size: 24px;
               font-weight: normal;
               letter-spacing: 1px;
               line-height: 1.2;
               color: #444;
               text-transform: uppercase;
               margin-bottom: 2px;
            }
            .cha-company-iso {
               font-size: 11px;
               font-weight: bold;
               color: #555;
               margin-bottom: 10px;
            }
            .cha-company-address-block {
               font-size: 10px;
               font-weight: normal;
               color: #333;
               line-height: 1.5;
            }

            /* ── TITLE ─────────────────────────────────────── */
            .cha-title {
               text-align: center;
               font-size: 11px;
               font-weight: 900;
               padding: 5px 0;
               border-bottom: 1pt solid #000;
               background: #f0f0f0;
               letter-spacing: 1.5px;
               text-transform: uppercase;
            }

            /* ── TO SECTION ────────────────────────────────── */
            .cha-to-section {
               display: flex;
               border-bottom: 1pt solid #000;
            }
            .cha-to-left {
               flex: 1;
               border-right: 1pt solid #000;
               display: flex;
               flex-direction: column;
               justify-content: center;
               padding: 8px 12px;
               min-height: 90px;
            }
            .cha-to-label {
               font-weight: bold;
               font-size: 9.5px;
               margin-bottom: 4px;
            }
            .cha-to-details {
               display: flex;
               flex-direction: column;
               align-items: center;
               line-height: 1.6;
            }
            .cha-to-name {
               font-weight: 900;
               text-transform: uppercase;
               text-align: center;
               font-size: 16px;
            }
            .cha-to-addr {
               text-transform: uppercase;
               text-align: center;
               font-size: 9.5px;
            }
            .cha-to-gst {
               font-size: 9.5px;
               text-align: center;
               font-weight: bold;
            }
            
            .cha-dc-right {
               width: 250px;
               flex-shrink: 0;
               display: flex;
               flex-direction: column;
            }
            .cha-dc-row {
               display: flex;
               border-bottom: 1pt solid #000;
               flex: 1;
            }
            .cha-dc-row-empty {
               flex: 0.5; /* The empty row is a bit shorter */
            }
            .cha-dc-key {
               width: 70px;
               border-right: 1pt solid #000;
               display: flex;
               align-items: center;
               justify-content: center;
               font-size: 9px;
               font-weight: bold;
               color: #333;
               background: #f8f8f8;
            }
            .cha-dc-val {
               flex: 1;
               display: flex;
               align-items: center;
               justify-content: center;
               color: #000;
               letter-spacing: 0.5px;
            }
            .cha-dc-no-val {
               font-size: 18px;
               font-weight: 900;
            }
            .cha-dc-date-val {
               font-size: 13px;
               font-weight: bold;
               color: #333;
            }
            .cha-dc-job-val {
               font-size: 13px;
               font-weight: bold;
               color: #333;
            }

            /* ── TABLE ─────────────────────────────────────── */
            .cha-table-wrap {
               flex: 1;
               display: flex;
               flex-direction: column;
               border-top: 1pt solid #000;
            }

            /* Column Widths */
            .cha-col-sno {
               width: 45px;
               border-right: 1pt solid #000;
            }
            .cha-col-desc {
               flex: 1;
               border-right: 1pt solid #000;
            }
            .cha-col-qty {
               width: 70px;
            }
            .cha-col-last {
               border-right: none;
            }

            /* Header */
            .cha-tbl-head {
               display: flex;
               border-bottom: 1pt solid #000;
               background: #e6e6e6; /* light gray for header */
               min-height: 22px;
            }
            .cha-th {
               padding: 4px;
               font-size: 9px;
               font-weight: 900;
               text-align: center;
               text-transform: uppercase;
               display: flex;
               align-items: center;
               justify-content: center;
            }

            /* Body */
            .cha-tbl-body {
               flex: 1;
               display: flex;
               background: #fff;
            }
            .cha-col-body {
               display: flex;
               flex-direction: column;
            }
            .cha-cell {
               padding: 6px 8px;
               font-size: 10px;
               font-weight: bold;
               min-height: 24px;
               word-break: break-word;
            }
            .cha-col-sno .cha-cell, .cha-col-qty .cha-cell, .cha-col-desc .cha-cell {
               text-align: center;
               justify-content: center;
            }

            /* TOTAL row */
            .cha-tbl-total {
               display: flex;
               background: #f8f8f8;
               border-top: 1pt solid #000;
               min-height: 24px;
            }
            .cha-td-total-label {
               padding: 5px 12px;
               text-align: center;
               font-weight: 900;
               font-size: 10px;
               display: flex;
               align-items: center;
               justify-content: center;
            }
            .cha-td-total-val {
               text-align: center;
               padding: 5px 4px;
               font-weight: 900;
               font-size: 10px;
               display: flex;
               align-items: center;
               justify-content: center;
            }

            /* ── FOOTER (below items table) ──────────────── */
            .cha-footer {
               border-top: 1pt solid #000;
               display: flex;
               flex-direction: column;
            }
            .cha-foot-row {
               display: flex;
               border-bottom: 1pt solid #000;
            }
            .cha-foot-row:last-child {
               border-bottom: none;
            }
            /* Left cell — spans S.NO + DESC + BLANK columns */
            .cha-foot-left {
               flex: 1;
               border-right: 1pt solid #000;
               display: flex;
               align-items: center;
               justify-content: center;
               text-align: center;
               padding: 5px 8px;
            }
            /* Right cell — spans QTY column width (matches dc-right) */
            .cha-foot-right {
               width: 210px;
               flex-shrink: 0;
               display: flex;
               align-items: center;
               justify-content: center;
               text-align: center;
               padding: 5px 8px;
            }
            /* Row 0 - Purpose */
            .cha-foot-purpose-row .cha-foot-left {
               font-weight: bold;
               font-size: 14px;
               min-height: 24px;
            }
            /* Row 1 – coating shaded */
            .cha-foot-coating-row .cha-foot-left {
               background: #e6e6e6;
               font-weight: 900;
               font-size: 16px;
               min-height: 24px;
            }
            /* Row 2 – received | For company */
            .cha-foot-received {
               font-size: 9px;
               font-weight: normal;
               min-height: 20px;
            }
            .cha-foot-for-company {
               font-size: 9px;
               font-weight: bold;
               min-height: 20px;
            }
            /* Row 3 – signatures */
            .cha-foot-sign-row .cha-foot-left,
            .cha-foot-sign-row .cha-foot-right {
               min-height: 140px;
               align-items: flex-end;
               padding-bottom: 12px;
               font-size: 9px;
               font-weight: bold;
            }

            /* ── PRINT ─────────────────────────────────────── */
            @media print {
               @page {
                  size: A4 portrait;
                  margin: 6mm;
               }
               body {
                  margin: 0 !important;
                  padding: 0 !important;
                  background: #fff !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
               }
               .cha-wrap {
                  width: 198mm !important;
                  page-break-after: avoid !important;
                  page-break-inside: avoid !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
               }
               .cha-outer {
                  height: 282mm !important;
                  overflow: hidden !important;
               }
               .cha-footer-row {
                  page-break-inside: avoid !important;
                  page-break-before: avoid !important;
               }
               .cha-table-wrap {
                  flex: 1 !important;
                  overflow: hidden !important;
               }
            }
         `}</style>
      </>
   );
};

export default VendorChallanFormatA;
