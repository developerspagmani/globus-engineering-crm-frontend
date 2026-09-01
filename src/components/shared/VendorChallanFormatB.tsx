'use client';
import React from 'react';

/**
 * VENDOR OUTWARD CHALLAN - FORMAT B
 * Exact replica of the "Tax Invoice" physical format (image 2)
 * Layout:
 *   - "TAX INVOICE  [ORIGINAL FOR RECIPIENT]" top-left label
 *   - Large bold company name
 *   - Address line | GSTIN | PAN | Email | Website | Phone
 *   - Divider line
 *   - Invoice No (left) | Invoice Date (right)  ← small meta row
 *   - BILL TO | SHIP TO | DC NUMBER + DC DATE (3-column)
 *   - Items table: ITEMS | HSN | QTY | RATE | TAX | AMOUNT
 *   - SUBTOTAL row
 *   - BANK DETAILS (left) | Tax breakdown + Total Amount (right)
 *   - Total Amount in Words
 *   - [Stamp box] + AUTHORISED SIGNATORY FOR ...
 *   - [Receiver Signature box]
 */

interface FormatBProps {
   data: any;
   company?: any;
   settings?: any;
}

const VendorChallanFormatB: React.FC<FormatBProps> = ({ data, company, settings: propSettings }) => {
   const settings = propSettings || company?.invoiceSettings || {};

   const companyName = (() => {
      const n = settings.companyName || company?.name || '';
      if (!n || n.includes('Machining') || n === 'Globus Engineering Tools') return 'GLOBUS ENGINEERING TOOLS';
      return n.toUpperCase();
   })();

   const companyAddress = (() => {
      const sub = settings.companySubHeader || company?.address || '';
      if (!sub || sub.includes('Machining') || sub.includes('Quality')) {
         return 'NO. 24, ANNAIYAPPAN STREET, S.S. NAGAR, NALLAMPALAYAM, GANAPATHY, COIMBATORE, Tamil Nadu, 641006';
      }
      return sub;
   })();

   const gstNo = settings.gstNo || company?.gstin || '33AAIFG6568K1ZZ';
   const panNo = company?.pan || 'AAIFG6568K';
   const email = company?.email || '';
   const website = company?.website || 'www.globusengineeringtools.com';
   const phone = company?.phone || '';

   // Vendor (Bill To / Ship To = our company, we are sending to vendor)
   // In vendor outward: WE send goods to vendor for processing
   // Bill To = Vendor (recipient), Ship To = Vendor address (same)
   // But looking at the reference image, the "Bill To" / "Ship To" is the RECIPIENT of the invoice
   // In the vendor's invoice they send to us — but since we're generating OUR challan for vendor:
   // Bill To = Vendor, Ship To = Vendor
   const vendorName = data.vendorName || data.customerName || data.partyName || '';
   const vendorAddress = data.address || data.partyAddress || '';
   const vendorGst = data.gstin || '';
   const vendorPan = data.pan || '';
   // Our company details (Bill To = us, since vendor sends goods to us for processing)
   // Actually in outward challan we send our goods TO vendor for processing
   // So BILL TO = Vendor, SHIP TO = Vendor
   const billToName = vendorName;
   const billToAddress = vendorAddress;
   const billToGstin = vendorGst;

   const dcNo = data.outwardNo || data.dcNo || '-';
   const dcDate = data.date
      ? new Date(data.date).toLocaleDateString('en-GB').replace(/\//g, '-')
      : '-';
   const coatingName = data.coatingName || data.processType || 'ULTRA COATING';

   const invoiceRef = data.invoiceReference || data.invoiceRef || '-';
   // Invoice date same as date
   const invoiceDate = dcDate;

   const items: any[] = data.items || [];

   // Calculate totals
   const subtotalQty = items.reduce((s: number, it: any) => s + Number(it.quantity || 0), 0);
   const subtotalRate = items.reduce((s: number, it: any) => s + Number(it.rate || 0), 0);
   const subtotalAmount = items.reduce((s: number, it: any) => s + Number(it.amount || 0), 0);
   const taxableAmount = subtotalAmount;
   const cgstRate = 9;
   const sgstRate = 9;
   const cgstAmount = (taxableAmount * cgstRate) / 100;
   const sgstAmount = (taxableAmount * sgstRate) / 100;
   const totalAmount = taxableAmount + cgstAmount + sgstAmount;

   const fmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2 });
   const MIN_ROWS = 5;
   const fillerCount = Math.max(0, MIN_ROWS - items.length);

   // Bank details from company or defaults
   const bankName = company?.bankName || '';
   const bankAccountNo = company?.bankAccountNo || '';
   const bankIfsc = company?.bankIfsc || '';
   const bankBranch = company?.bankBranch || '';

   const purpose = data.purpose || '';

   return (
      <div className="fmtb-page">
         {/* ── TOP LABEL ─────────────────────────────────────── */}
         <div className="fmtb-top-label">
            <span className="fmtb-tax-invoice-text">DELIVERY CHALLAN</span>
         </div>

         {/* ── COMPANY NAME ──────────────────────────────────── */}
         <div className="fmtb-company-name">{companyName}</div>

         <div className="fmtb-company-address">
            <div>{companyAddress}</div>
            <div>
               GSTIN: {gstNo} &nbsp;&nbsp;&nbsp; PAN Number: {panNo}
            </div>
            {website && <div>Website: {website}</div>}
         </div>

         <div className="fmtb-thick-divider" />

         <div className="fmtb-address-row">
            <div className="fmtb-bill-box">
               <div className="fmtb-box-title">BILL TO</div>
               <div className="fmtb-box-name">{vendorName}</div>
               {vendorAddress && <div className="fmtb-box-addr">{vendorAddress}</div>}
               {vendorGst && <div>GSTIN: {vendorGst}</div>}
               {vendorPan && <div>PAN Number: {vendorPan}</div>}
            </div>

            <div className="fmtb-ship-box">
               <div className="fmtb-box-title">SHIP TO</div>
               <div className="fmtb-box-name">{vendorName}</div>
               {vendorAddress && <div className="fmtb-box-addr">{vendorAddress}</div>}
            </div>

            <div className="fmtb-dc-box">
               <div className="fmtb-dc-row">
                  <div className="fmtb-dc-key">DC NUMBER</div>
                  <div className="fmtb-dc-val">{dcNo}</div>
               </div>
               <div className="fmtb-dc-row">
                  <div className="fmtb-dc-key">DC DATE</div>
                  <div className="fmtb-dc-val">{dcDate}</div>
               </div>
               <div className="fmtb-dc-row">
                  <div className="fmtb-dc-key">JOB VALUE</div>
                  <div className="fmtb-dc-val">{data.jobNo || data.jobValue || data.job || '-'}</div>
               </div>
               {((data.status === 'cancelled' && data.inwardNo) || (data.processName === 'REJECTED / RETURNED')) && (
                        <div className="fmtb-dc-row">
                           <div className="cha-dc-key" style={{ color: '#000' }}>STATUS</div>
                           <div className="cha-dc-val" style={{ fontSize: '18px', fontWeight: '900', color: '#000', letterSpacing: '1px' }}>CANCELLED</div>
                        </div>
                     )}
                     {data.processName && data.processName !== "REJECTED / RETURNED" && !(data.status === "cancelled" && data.inwardNo) && (
                  <div className="fmtb-dc-row">
                     <div className="fmtb-dc-key">PROCESS</div>
                     <div className="fmtb-dc-val" style={{ fontSize: '14px', fontWeight: '900' }}>{data.processName}</div>
                  </div>
               )}
               {data.partyType !== 'customer' && (
                  <div className="fmtb-dc-row">
                     <div className="fmtb-dc-key">COATING</div>
                     <div className="fmtb-dc-val" style={{ fontSize: '14px', fontWeight: '900' }}>{coatingName}</div>
                  </div>
               )}
            </div>
         </div>

         <div className="fmtb-table-container">
            <table className="fmtb-table">
               <thead>
                  <tr>
                     <th className="fmtb-th fmtb-col-items">ITEMS</th>
                     <th className="fmtb-th fmtb-col-qty">QTY.</th>
                  </tr>
               </thead>
               <tbody>
                  {items.map((item: any, i: number) => {
                     const qty = Number(item.quantity || 0);
                     const rate = Number(item.rate || 0);
                     const tax = Number(item.tax || item.taxAmount || 0);
                     const amt = Number(item.amount || (qty * rate));
                     return (
                        <tr key={i}>
                           <td className="fmtb-td fmtb-td-items">{item.description || ''}</td>
                           <td className="fmtb-td fmtb-td-center">
                              {qty > 0 ? `${qty} ${item.unit ? item.unit.toUpperCase() : 'NOS'}` : ''}
                           </td>
                        </tr>
                     );
                  })}
                  {[...Array(fillerCount)].map((_, i) => (
                     <tr key={`f-${i}`}>
                        <td className="fmtb-td">&nbsp;</td>
                        <td className="fmtb-td">&nbsp;</td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>

         <div className="fmtb-subtotal-row">
            <div className="fmtb-subtotal-label">SUBTOTAL</div>
            <div className="fmtb-subtotal-qty">{subtotalQty > 0 ? subtotalQty : ''}</div>
         </div>

         <div className="fmtb-purpose-area">
            <span className="fmtb-purpose-label">PURPOSE:</span>
            <span className="fmtb-purpose-val">{purpose}</span>
         </div>

         <div className="fmtb-sign-area">
            {/* Left Column: Receiver's Signature */}
            <div className="fmtb-sign-left-col">
               <div className="fmtb-sign-receiver-box">&nbsp;</div>
               <div className="fmtb-sign-receiver-label">Receiver's Signature</div>
            </div>

            {/* Right Column: Authorised Signatory */}
            <div className="fmtb-sign-right-col" style={{ position: 'relative' }}>
               {companyName.includes('GLOBUS') && (
                  <img
                     src="/seal.png"
                     alt="seal"
                     style={{ position: 'absolute', right: '50px', bottom: '15px', width: '70px', height: '70px', opacity: 0.55, zIndex: 1, transform: 'rotate(-5deg)' }}
                     onError={(e) => (e.target as any).style.display = 'none'}
                  />
               )}
               <div className="fmtb-sign-stamp-box" style={{ position: 'relative', zIndex: 2, backgroundColor: 'transparent' }}>&nbsp;</div>
               <div className="fmtb-sign-auth-label" style={{ position: 'relative', zIndex: 2 }}>AUTHORISED SIGNATORY FOR<br />{companyName}</div>
            </div>
         </div>

         <style jsx global>{`
            .fmtb-page {
               width: 185mm;
               min-height: 255mm;
               background: #fff;
               border: 1.5pt solid #000;
               box-sizing: border-box;
               font-family: Arial, sans-serif;
               font-size: 10px;
               color: #000;
               margin: 0 auto;
               display: flex;
               flex-direction: column;
               padding: 10px 14px;
            }

            /* Top label */
            .fmtb-top-label {
               display: flex;
               align-items: center;
               gap: 10px;
               margin-bottom: 4px;
            }
            .fmtb-tax-invoice-text {
               font-size: 10px;
               font-weight: bold;
               letter-spacing: 0.5pt;
            }

            /* Company name */
            .fmtb-company-name {
               font-size: 22px;
               font-weight: 900;
               letter-spacing: 0.3pt;
               line-height: 1.2;
               margin-bottom: 3px;
            }

            /* Top Company Address */
            .fmtb-company-address {
               font-size: 10px;
               line-height: 1.5;
               margin-bottom: 8px;
            }

            /* Thick divider */
            .fmtb-thick-divider {
               border-top: 2.5pt solid #000;
               margin: 5px 0;
            }

            /* Bill To / Ship To / DC Row container */
            .fmtb-address-row {
               display: flex;
               margin-bottom: 6px;
               min-height: 90px;
            }
            .fmtb-bill-box, .fmtb-ship-box {
               flex: 1;
               padding: 6px 10px;
            }
            .fmtb-box-title {
               font-size: 9px;
               font-weight: bold;
               margin-bottom: 4px;
               color: #333;
            }
            .fmtb-box-name {
               font-size: 10px;
               font-weight: 900;
               text-transform: uppercase;
               line-height: 1.3;
            }
            .fmtb-box-addr {
               font-size: 9px;
               line-height: 1.4;
               margin-top: 3px;
               text-transform: uppercase;
            }

            .fmtb-dc-box {
               width: 200px;
               display: flex;
               flex-direction: column;
            }
            .fmtb-dc-row {
               display: flex;
               flex: 1;
               align-items: center;
               padding: 4px 10px;
            }
            .fmtb-dc-key {
               flex: 1;
               font-size: 9px;
               font-weight: bold;
               color: #333;
            }
            .fmtb-dc-val {
               font-size: 11px;
               font-weight: bold;
               text-align: right;
            }

            /* Items table */
            .fmtb-table-container {
               /* Remove flex: 1 to let it size based on content */
            }
            .fmtb-table {
               width: 100%;
               border-collapse: collapse;
               table-layout: fixed;
            }
            .fmtb-th {
               border-top: 1.5pt solid #000;
               border-bottom: 1pt solid #000;
               padding: 5px 4px;
               font-size: 9px;
               text-align: center;
               text-transform: uppercase;
               font-weight: 900;
               vertical-align: middle;
            }
            .fmtb-td {
               padding: 5px 5px;
               font-size: 9px;
               font-weight: bold;
               vertical-align: top;
               height: 22px;
               line-height: 1.2;
            }
            .fmtb-col-items { /* flex */ text-align: center; }
            .fmtb-col-qty { width: 65px; text-align: center; }
            .fmtb-col-rate { width: 65px; text-align: center; }
            .fmtb-col-tax { width: 65px; text-align: center; }
            .fmtb-col-amt { width: 75px; text-align: right; padding-right: 8px; }
            .fmtb-td-items { text-align: center; padding-left: 6px; }
            .fmtb-td-center { text-align: center; }
            .fmtb-td-right { text-align: right; padding-right: 8px; }
            .fmtb-tax-cell { text-align: center; font-size: 8px; }
            .fmtb-tax-pct { font-size: 7.5px; color: #555; font-weight: normal; }

            /* Subtotal row */
            .fmtb-subtotal-row {
               display: flex;
               border-top: 1pt solid #000;
               border-bottom: 1.5pt solid #000;
               font-weight: 900;
               font-size: 9.5px;
               padding: 4px 0;
            }
            .fmtb-subtotal-label {
               flex: 1;
               padding: 4px 6px;
            }
            .fmtb-subtotal-qty {
               width: 65px;
               padding: 4px;
               text-align: center;
            }

            /* Bank + Tax summary */
            .fmtb-bottom-row {
               display: flex;
               border: 1pt solid #000;
               border-top: none;
               margin-bottom: 0;
            }
            .fmtb-bank-box {
               flex: 1;
               padding: 8px 10px;
               border-right: 1pt solid #000;
               font-size: 9px;
               line-height: 1.6;
            }
            .fmtb-bank-title {
               font-weight: 900;
               font-size: 10px;
               margin-bottom: 4px;
               text-decoration: underline;
            }
            .fmtb-bank-line {
               display: flex;
               gap: 6px;
            }
            .fmtb-bank-key {
               font-weight: bold;
               min-width: 80px;
               flex-shrink: 0;
            }
            .fmtb-tax-summary-box {
               width: 175px;
               flex-shrink: 0;
               padding: 6px 10px;
               font-size: 9px;
            }
            .fmtb-tax-line {
               display: flex;
               justify-content: space-between;
               padding: 2px 0;
               border-bottom: 0.5pt solid #ddd;
               line-height: 1.5;
            }
            .fmtb-tax-total {
               font-weight: 900;
               font-size: 10px;
               border-top: 1pt solid #000;
               border-bottom: 1pt solid #000;
               padding: 3px 0;
            }

            /* Amount in words */
            .fmtb-words-row {
               border: 1pt solid #000;
               border-top: none;
               padding: 4px 10px;
               font-size: 9px;
               display: flex;
               justify-content: flex-end;
               gap: 8px;
            }
            .fmtb-words-label {
               font-weight: bold;
               color: #555;
            }

            /* Signature area */
            .fmtb-sign-area {
               display: flex;
               justify-content: space-between;
               min-height: 100px;
               padding-top: 15px;
            }
            .fmtb-sign-left-col {
               display: flex;
               flex-direction: column;
               justify-content: space-between;
            }
            .fmtb-purpose-area {
               font-size: 11px;
               margin-top: 15px;
               margin-bottom: 15px;
            }
            .fmtb-purpose-label {
               font-weight: bold;
               text-decoration: underline;
               margin-right: 6px;
            }
            .fmtb-purpose-val {
               font-weight: bold;
            }
            .fmtb-sign-right-col {
               width: 175px;
               flex-shrink: 0;
               display: flex;
               flex-direction: column;
               align-items: flex-end;
               gap: 4px;
            }
            .fmtb-sign-stamp-box {
               width: 175px;
               height: 55px;
               border: none;
               margin-bottom: 2px;
            }
            .fmtb-sign-auth-label {
               font-size: 8.5px;
               font-weight: 900;
               text-align: right;
               text-transform: uppercase;
               line-height: 1.4;
               margin-bottom: 6px;
            }
            .fmtb-sign-receiver-box {
               width: 175px;
               height: 55px;
               border: none;
               margin-bottom: 2px;
            }
            .fmtb-sign-receiver-label {
               font-size: 8.5px;
               font-weight: bold;
               text-align: right;
               align-self: flex-end;
            }

            @media print {
               @page { size: A4; margin: 5mm !important; }
               .fmtb-page {
                  width: 185mm !important;
                  height: 277mm !important;
                  min-height: unset !important;
                  border: 1.5pt solid #000 !important;
                  padding: 8px 12px !important;
                  overflow: hidden !important;
               }
               .fmtb-sign-area {
                  page-break-inside: avoid !important;
                  page-break-before: avoid !important;
               }
               .fmtb-words-row {
                  page-break-inside: avoid !important;
                  page-break-before: avoid !important;
               }
            }
         `}</style>
      </div>
   );
};

export default VendorChallanFormatB;
