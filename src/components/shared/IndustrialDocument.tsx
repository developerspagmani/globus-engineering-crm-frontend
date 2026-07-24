import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { Company } from '@/types/modules';
import { numberToWords } from '@/utils/numberToWords';

/**
 * PIXEL-PERFECT INDUSTRIAL DOCUMENT
 * Calibrated for A4 standard (210mm x 297mm)
 * Supports Outward, Inward, Challan, and Voucher
 */

interface IndustrialDocumentProps {
   data: any;
   type: 'outward' | 'inward' | 'challan' | 'voucher' | 'statement';
   company?: Company | null;
   settings?: any;
}

const IndustrialDocument: React.FC<IndustrialDocumentProps> = ({ data, type, company, settings: propSettings }) => {
   const { items: customers } = useSelector((state: RootState) => state.customers || { items: [] });
   const { items: vendors } = useSelector((state: RootState) => state.vendors || { items: [] });

   const settings = propSettings || company?.invoiceSettings || {
      showLogo: true,
      logo: company?.logo,
      logoSecondary: company?.logoSecondary,
      showDeclaration: false,
      accentColor: '#0d6efd',
      companyName: company?.name || 'GLOBUS ENGINEERING MAIN',
      companySubHeader: 'No 24,Annaiyappan Street,S.S.Nagar, Nallampalayam,Ganapathy Post, Coimbatore-641006.',
      companyAddress: company?.address || 'No 24,Annaiyappan Street,S.S.Nagar, Nallampalayam,Ganapathy Post, Coimbatore-641006.',
      gstNo: company?.gstin || '33AAIFG6568K1ZZ',
      stateDetails: 'Tamilnadu - Code : 33'
   };

   const totalInWords = type === 'voucher' ? numberToWords(data.amount) : '';

   // Pagination logic similar to IndustrialInvoice
   const GLOBAL_PAGE_CAPACITY = 18;
   const FOOTER_SPACE_ROWS = 7;

   const paginate = (items: any[]) => {
      if (!items || items.length === 0) return [[]];
      let result: any[][] = [];
      let remaining = [...items];

      while (remaining.length > 0) {
         if (remaining.length <= (GLOBAL_PAGE_CAPACITY - FOOTER_SPACE_ROWS)) {
            result.push(remaining);
            remaining = [];
         } else {
            result.push(remaining.slice(0, GLOBAL_PAGE_CAPACITY));
            remaining = remaining.slice(GLOBAL_PAGE_CAPACITY);
         }
      }
      return result;
   };

   const items = type === 'voucher' ? [] : (data.items || []);
   const pagesData = paginate(items);
   const totalPages = pagesData.length;

   const getDocumentTitle = () => {
      switch (type) {
         case 'outward': return 'OUTWARD RECEIPT';
         case 'inward': return 'INWARD ENTRY / GRN';
         case 'challan': return data.type === 'delivery' ? 'DELIVERY CHALLAN' : 'CHALLAN';
         case 'voucher': return `${(data.type || 'payment').toUpperCase()} VOUCHER`;
         case 'statement': return 'STATEMENT OF ACCOUNT';
         default: return 'DOCUMENT';
      }
   };

   // Enrich data with party details if missing
   const partyId = data.partyId || data.customerId || data.vendorId || (data as any).party_id;
   const partyType = data.partyType || (data.vendorName ? 'vendor' : 'customer');
   
   let enrichedData = { ...data };
   
   // Clean up 'Migrated' prefix from description if present
   if (enrichedData.description && typeof enrichedData.description === 'string') {
      enrichedData.description = enrichedData.description.replace(/^Migrated\s+/i, '');
   }

   if (partyId) {
      if (partyType === 'customer' || !data.address) {
         const cust = customers.find((c: any) => String(c.id) === String(partyId));
         if (cust) {
            enrichedData.address = enrichedData.address || cust.street1;
            enrichedData.gstin = enrichedData.gstin || cust.gst;
            enrichedData.phone = enrichedData.phone || cust.phone;
            enrichedData.state = enrichedData.state || cust.state;
            enrichedData.stateCode = enrichedData.stateCode || cust.stateCode || (cust as any).state_code;
         }
      }
      if (partyType === 'vendor' || !enrichedData.address) {
         const vend = vendors.find((v: any) => String(v.id) === String(partyId));
         if (vend) {
            enrichedData.address = enrichedData.address || vend.street1;
            enrichedData.gstin = enrichedData.gstin || vend.gst;
            enrichedData.phone = enrichedData.phone || vend.phone;
            enrichedData.state = enrichedData.state || vend.state;
            enrichedData.stateCode = enrichedData.stateCode || vend.stateCode || (vend as any).state_code;
         }
      }
   }

   return (
      <div className="industrial-print-container">
         {pagesData.map((pageItems, idx) => (
            <DocumentPage
               key={idx}
               data={enrichedData}
               type={type}
               company={company}
               settings={settings}
               items={pageItems}
               isLastPage={idx === totalPages - 1}
               totalInWords={totalInWords}
               startSno={pagesData.slice(0, idx).reduce((sum, p) => sum + p.length, 0) + 1}
               capacity={GLOBAL_PAGE_CAPACITY}
               footerSpaceNeeded={idx === totalPages - 1 ? FOOTER_SPACE_ROWS : 0}
               title={getDocumentTitle()}
            />
         ))}

         <style jsx global>{`
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
           height: auto;
           display: flex;
           flex-direction: column;
           background: white;
           position: relative;
           color: black;
           font-family: var(--font-inter), Inter, sans-serif;
           box-sizing: border-box;
           border: none;
           margin: 0 auto;
           overflow: visible;
         }
         
         .page-border-box {
            flex: 1;
            display: flex;
            flex-direction: column;
            border: 1.5pt solid #000;
            margin: 1mm auto;
            width: 185mm;
            height: auto;
            min-height: 255mm;
            background: #fff;
            box-sizing: border-box;
         }
        .p-header { 
           height: 100px; 
           border-bottom: 1.5pt solid #000; 
           display: flex; 
           align-items: center; 
           justify-content: space-between; 
           padding: 0 15px; 
        }
         .p-meta { 
            font-size: 8.5px; 
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
           display: grid;
           grid-template-columns: 78px 14px 1fr;
           align-items: center;
        }
        .p-meta-col:last-child { border-right: 0; }
        .p-meta-col > span:first-child { font-weight: bold; color: #000; }
        .p-meta-val { font-weight: bold; color: #000; }

        .tax-invoice-label {
           text-align: center;
           font-size: 12px;
           font-weight: 900;
           padding: 5px 0;
           border-bottom: 1.5pt solid #000;
           background-color: #f0f0f0;
           letter-spacing: 1px;
           text-transform: uppercase;
        }
         .p-address { 
            display: flex; 
            border-bottom: 1.5pt solid #000; 
            font-size: 10.5px; 
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
            text-transform: uppercase;
         }
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
           vertical-align: middle;
        }
        .p-table td { 
           border: 1pt solid #000; 
           padding: 2px 6px; 
           font-size: 9px; 
           font-weight: bold; 
           vertical-align: middle;
           height: 21px; 
           line-height: 1.2;
        }
        .p-footer { border-top: 1.5pt solid #000; }
        .p-words { 
           border-bottom: 1pt solid #000; 
           padding: 3px 12px; 
           font-size: 9px; 
           text-transform: uppercase; 
           font-weight: bold;
        }
        .p-signs { 
           display: flex; 
           border-bottom: 1.5pt solid #000; 
           height: 80px; 
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
           padding: 6px 10px; 
           font-size: 8.5px; 
           line-height: 1.3; 
           font-weight: bold; 
           background: #fff;
           border-top: 1pt solid #000;
        }

         @media print {
            @page { size: A4; margin: 0mm !important; }
            html, body { margin: 0 !important; background: #fff !important; }
            .industrial-print-container { background: #fff !important; margin: 0 !important; padding: 0 !important; }
            .invoice-page { overflow: hidden !important; height: 260mm !important; }
            .page-border-box { height: 100% !important; overflow: hidden !important; }
            .page-border-box.last-page { height: 100% !important; min-height: unset !important; }
         }
      `}</style>
      </div>
   );
};

const DocumentPage = ({ data, type, company, settings, items, isLastPage, totalInWords, startSno, capacity, footerSpaceNeeded, title }: any) => {
   const targetRows = isLastPage ? (capacity - footerSpaceNeeded) : capacity;
   const fillerCount = type === 'voucher' ? 0 : Math.max(0, targetRows - items.length);

   const partyName = data.partyType === 'vendor' ? (data.vendorName || data.partyName || 'N/A Vendor') : (data.customerName || data.partyName || 'N/A Customer');
   const partyAddress = data.address || data.partyAddress || 'N/A';

   return (
      <div className="invoice-page" style={{ pageBreakAfter: isLastPage ? 'avoid' : 'always' }}>
         <div className={`page-border-box${isLastPage ? ' last-page' : ''}`}>
            {/* Header */}
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
                     {(!settings.companyName || settings.companyName === 'Globus Engineering Tools' || settings.companyName.includes('MACHINING')) 
                        ? 'GLOBUS ENGINEERING TOOLS' 
                        : settings.companyName.toUpperCase()}
                  </h1>
                  <div style={{ fontSize: '12px', fontWeight: '900', marginTop: '2px' }}>
                     {(!settings.companySubHeader || settings.companySubHeader.includes('Machining') || settings.companySubHeader.includes('Quality')) 
                        ? 'No 24,Annaiyappan Street,S.S.Nagar, Nallampalayam,Ganapathy Post, Coimbatore-641006.' 
                        : settings.companySubHeader}
                  </div>
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

            {/* Meta Grid */}
            <div className="p-meta">
               <div className="p-meta-row">
                  {type === 'statement' ? (
                     <>
                        <div className="p-meta-col">
                           <span>STATEMENT DATE</span>
                           <span>:</span>
                           <span className="p-meta-val">{new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}</span>
                        </div>
                        <div className="p-meta-col">
                           <span>CUSTOMER REF</span>
                           <span>:</span>
                           <span className="p-meta-val">{data.partyName || '-'}</span>
                        </div>
                     </>
                  ) : (
                     <>
                        <div className="p-meta-col">
                           <span>{type.toUpperCase()} NO</span>
                           <span>:</span>
                           <span className="p-meta-val">{data.outwardNo || data.inwardNo || data.challanNo || data.voucherNo}</span>
                        </div>
                        <div className="p-meta-col">
                           <span>DATE</span>
                           <span>:</span>
                           <span className="p-meta-val">{data.date ? new Date(data.date).toLocaleDateString('en-GB').replace(/\//g, '-') : '-'}</span>
                        </div>
                        {type === 'outward' && (
                           <div className="p-meta-col">
                              <span>INVOICE REF</span>
                              <span>:</span>
                              <span className="p-meta-val">{data.invoiceReference || '-'}</span>
                           </div>
                        )}
                        {type === 'inward' && (
                           <div className="p-meta-col">
                              <span>PO REF</span>
                              <span>:</span>
                              <span className="p-meta-val">{data.poReference || '-'}</span>
                           </div>
                        )}
                        {type === 'challan' && (
                           <div className="p-meta-col">
                              <span>TYPE</span>
                              <span>:</span>
                              <span className="p-meta-val">{(data.type || 'delivery').toUpperCase()}</span>
                           </div>
                        )}
                        {type === 'voucher' && (
                           <div className="p-meta-col">
                              <span>MODE</span>
                              <span>:</span>
                              <span className="p-meta-val">{data.paymentMode === 'netbanking' ? 'NET BANKING' : (data.paymentMode || '-').toUpperCase()}</span>
                           </div>
                        )}
                     </>
                  )}
               </div>
               {type !== 'statement' && (
                  <div className="p-meta-row">
                     {type === 'outward' && data.partyType === 'vendor' ? (
                        <div className="p-meta-col">
                           <span>COATING NAME</span>
                           <span>:</span>
                           <span className="p-meta-val">{data.coatingName || '-'}</span>
                        </div>
                     ) : (
                        <div className="p-meta-col">
                           <span>VEHICLE NO</span>
                           <span>:</span>
                           <span className="p-meta-val">{data.vehicleNo || '-'}</span>
                        </div>
                     )}
                     <div className="p-meta-col">
                        <span>STATE</span>
                        <span>:</span>
                        <span className="p-meta-val">
                           {data.state ? `${data.state}${data.stateCode ? `-${data.stateCode}` : ''}` : 'TamilNadu-33'}
                        </span>
                     </div>
                     {type === 'voucher' ? (
                        <div className="p-meta-col">
                           <span>REF NO</span>
                           <span>:</span>
                           <span className="p-meta-val">{data.referenceNo || '-'}</span>
                        </div>
                     ) : (
                        <div className="p-meta-col">
                           <span>{type === 'inward' ? 'DC NO' : 'CHALLAN NO'}</span>
                           <span>:</span>
                           <span className="p-meta-val">{data.dcNo || data.challanNo || '-'}</span>
                        </div>
                     )}
                  </div>
               )}
            </div>

            <div className="tax-invoice-label">{title}</div>

            {/* Address */}
            <div className="p-address">
               <div className="p-addr-box">
                  <div className="p-addr-title">SUPPLIER DETAILS :</div>
                  <div className="p-addr-content">
                     <div style={{ display: 'grid', gridTemplateColumns: '70px auto', rowGap: '2px' }}>
                        <div style={{ fontWeight: 'bold', color: '#000' }}>Name</div><div>: <strong>{(!settings.companyName || settings.companyName.toUpperCase().includes('MACHINING')) ? 'GLOBUS ENGINEERING TOOLS' : settings.companyName.toUpperCase()}</strong></div>
                        <div style={{ alignSelf: 'start', fontWeight: 'bold', color: '#000' }}>Address</div>
                        <div style={{ lineHeight: '1.2', display: 'flex', alignItems: 'flex-start' }}>
                           <span style={{ flexShrink: 0, marginRight: '2px' }}>:</span>
                           <span>{(!settings.companyAddress || settings.companyAddress.toUpperCase().includes('MACHINING')) ? 'No 24,Annaiyappan Street,S.S.Nagar, Nallampalayam,Ganapathy Post, Coimbatore-641006.' : settings.companyAddress}</span>
                        </div>
                        <div style={{ fontWeight: 'bold', color: '#000' }}>GST No</div><div>: <strong>{settings.gstNo || company?.gstin || '33AAIFG6568K1ZZ'}</strong></div>
                        <div style={{ fontWeight: 'bold', color: '#000' }}>State</div>
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
                        <div style={{ fontWeight: 'bold', color: '#000' }}>Name</div><div>: <strong>{partyName}</strong></div>
                        <div style={{ alignSelf: 'start', fontWeight: 'bold', color: '#000' }}>Address</div>
                        <div style={{ lineHeight: '1.2', display: 'flex', alignItems: 'flex-start' }}>
                           <span style={{ flexShrink: 0, marginRight: '2px' }}>:</span>
                           <span>{partyAddress !== 'N/A' ? partyAddress : 'N/A'}</span>
                        </div>
                        <div style={{ fontWeight: 'bold', color: '#000' }}>GST No</div><div>: <strong>{data.gstin || 'N/A'}</strong></div>
                        <div style={{ fontWeight: 'bold', color: '#000' }}>State</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                           <span>: {data.state || 'N/A'}</span>
                           <span>Code : {data.state?.toLowerCase() === 'telangana' ? '36' : '33'}</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Table Area */}
            <div className="p-table-area">
               {type === 'voucher' ? (
                  // ── VOUCHER: Invoice-style table ──────────────────────────────────────────
                  <table className="p-table">
                     <thead>
                        <tr>
                           <th style={{ width: '40px' }}>S.No</th>
                           <th style={{ textAlign: 'left', paddingLeft: '8px' }}>Particulars / Description</th>
                           <th style={{ width: '80px' }}>Mode</th>
                           <th style={{ width: '130px', textAlign: 'right', paddingRight: '8px' }}>Amount (₹)</th>
                        </tr>
                     </thead>
                     <tbody>
                        {/* Main payment row */}
                        <tr>
                           <td style={{ textAlign: 'center' }}>1</td>
                           <td style={{ fontWeight: 'bold', paddingLeft: '8px' }}>
                              {data.description || `${(data.type || 'Payment').toUpperCase()} towards balance settlement`}
                           </td>
                           <td style={{ textAlign: 'center', textTransform: 'uppercase' }}>{data.paymentMode === 'netbanking' ? 'NET BANKING' : (data.paymentMode || '-')}</td>
                           <td style={{ textAlign: 'right', paddingRight: '8px', fontFamily: 'Courier New, monospace' }}>
                              {Number(data.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                           </td>
                        </tr>
                        {/* Filler rows */}
                        {[...Array(8)].map((_, i) => (
                           <tr key={`v-filler-${i}`}>
                              <td style={{ textAlign: 'center' }}>&nbsp;</td>
                              <td>&nbsp;</td>
                              <td>&nbsp;</td>
                              <td>&nbsp;</td>
                           </tr>
                        ))}
                        {/* Cheque row */}
                        {data.chequeNo && (
                           <tr style={{ background: '#f8f8f8' }}>
                              <td style={{ textAlign: 'center' }}>-</td>
                              <td style={{ paddingLeft: '8px', fontStyle: 'italic' }} colSpan={2}>
                                 Cheque / DD No: <strong>{data.chequeNo}</strong>
                              </td>
                              <td>&nbsp;</td>
                           </tr>
                        )}
                        {/* Total row */}
                        <tr style={{ fontWeight: '900', background: '#f0f0f0', borderTop: '1.5pt solid #000' }}>
                           <td colSpan={3} style={{ textAlign: 'right', paddingRight: '16px', fontSize: '11px' }}>
                              TOTAL AMOUNT
                           </td>
                           <td style={{ textAlign: 'right', paddingRight: '8px', fontSize: '11px', fontFamily: 'Courier New, monospace' }}>
                              {Number(data.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                           </td>
                        </tr>
                     </tbody>
                  </table>
               ) : type === 'statement' ? (
                  // ── STATEMENT: List of Invoices ──────────────────────────────────────────
                  <table className="p-table">
                     <thead>
                        <tr>
                           <th style={{ width: '40px' }}>S.No</th>
                           <th style={{ width: '100px' }}>Date</th>
                           <th style={{ textAlign: 'left', paddingLeft: '8px' }}>Invoice No</th>
                           <th style={{ width: '150px', textAlign: 'left', paddingLeft: '8px' }}>PO No</th>
                           <th style={{ width: '150px', textAlign: 'right', paddingRight: '8px' }}>Amount (₹)</th>
                        </tr>
                     </thead>
                     <tbody>
                        {items.map((item: any, idx: number) => {
                           const invTotal = Number(item.grandTotal || 0);
                           const paidAmt = Number(item.paidAmount || 0);
                           const bal = invTotal - paidAmt;
                           return (
                              <tr key={idx}>
                                 <td style={{ textAlign: 'center' }}>{startSno + idx}</td>
                                 <td style={{ textAlign: 'center' }}>{item.date ? new Date(item.date).toLocaleDateString('en-GB') : '-'}</td>
                                 <td style={{ fontWeight: 'bold', paddingLeft: '8px' }}>{item.invoiceNumber || item.invoice_no}</td>
                                 <td style={{ paddingLeft: '8px' }}>{item.poNo || '-'}</td>
                                 <td style={{ textAlign: 'right', paddingRight: '8px', fontWeight: 'bold' }}>{bal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              </tr>
                           );
                        })}
                        {[...Array(fillerCount)].map((_, i) => (
                           <tr key={`filler-${i}`}>
                              <td style={{ textAlign: 'center' }}>&nbsp;</td>
                              <td>&nbsp;</td>
                              <td>&nbsp;</td>
                              <td>&nbsp;</td>
                              <td>&nbsp;</td>
                           </tr>
                        ))}
                        {isLastPage && (
                           <tr style={{ fontWeight: '900', background: '#f0f0f0', borderTop: '1.5pt solid #000' }}>
                              <td colSpan={4} style={{ textAlign: 'right', paddingRight: '16px', fontSize: '11px' }}>
                                 TOTAL AMOUNT
                              </td>
                              <td style={{ textAlign: 'right', paddingRight: '8px', fontSize: '11px', fontFamily: 'Courier New, monospace' }}>
                                 {Number(data.totalPending || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               ) : (

                  <table className="p-table">
                     <thead>
                        <tr>
                           <th style={{ width: '40px' }}>S.No</th>
                           <th>Description</th>
                           {type === 'inward' && <th style={{ width: '150px' }}>Process</th>}
                           {type === 'challan' && <th style={{ width: '80px' }}>HSN Code</th>}
                           {type === 'challan' && (data.bill_type === 'Both' || data.billType === 'Both') ? (
                             <>
                               <th style={{ width: '60px' }}>WP Qty</th>
                               <th style={{ width: '60px' }}>WOP Qty</th>
                             </>
                           ) : (
                             <th style={{ width: '80px' }}>{ String(data.bill_type || data.billType || '').toLowerCase().includes('without') ? 'WOP Qty' : 'Quantity'}</th>
                           )}
                           <th style={{ width: '60px' }}>Unit</th>
                        </tr>
                     </thead>
                     <tbody>
                        {items.map((item: any, idx: number) => (
                           <tr key={idx}>
                              <td style={{ textAlign: 'center' }}>{startSno + idx}</td>
                              <td style={{ fontWeight: 'bold' }}>{item.description}</td>
                              {type === 'inward' && <td style={{ textAlign: 'center' }}>{item.process || '-'}</td>}
                              {type === 'challan' && <td style={{ textAlign: 'center' }}>{item.hsnCode || '-'}</td>}
                              {type === 'challan' && (data.bill_type === 'Both' || data.billType === 'Both') ? (
                                <>
                                  <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                                  <td style={{ textAlign: 'center' }}>{item.wopQty || item.wop_qty || 0}</td>
                                </>
                              ) : (
                                <td style={{ textAlign: 'center' }}>{String(data.bill_type || data.billType || '').toLowerCase().includes('without') ? (item.wopQty || item.wop_qty || 0) : item.quantity}</td>
                              )}
                              <td style={{ textAlign: 'center' }}>{item.unit || 'pcs'}</td>
                           </tr>
                        ))}
                        {[...Array(fillerCount)].map((_, i) => (
                           <tr key={`filler-${i}`}>
                              <td style={{ textAlign: 'center' }}>&nbsp;</td>
                              <td>&nbsp;</td>
                              {type === 'inward' && <td>&nbsp;</td>}
                              {type === 'challan' && <td>&nbsp;</td>}
                              {type === 'challan' && (data.bill_type === 'Both' || data.billType === 'Both') ? (
                                 <>
                                    <td>&nbsp;</td>
                                    <td>&nbsp;</td>
                                 </>
                              ) : (
                                 <td>&nbsp;</td>
                              )}
                              <td>&nbsp;</td>
                           </tr>
                        ))}
                         {isLastPage && (
                            <tr style={{ fontWeight: '900', background: '#f0f0f0', borderTop: '1.5pt solid #000' }}>
                               <td colSpan={type === 'inward' ? 3 : (type === 'challan' ? 3 : 2)} style={{ textAlign: 'right', padding: '8px 15px', fontSize: '11px' }}>TOTAL QUANTITY</td>
                               {type === 'challan' && (data.bill_type === 'Both' || data.billType === 'Both') ? (
                                  <>
                                     <td style={{ textAlign: 'center', fontSize: '11px' }}>{items.reduce((sum: number, it: any) => sum + Number(it.quantity || 0), 0)}</td>
                                     <td style={{ textAlign: 'center', fontSize: '11px' }}>{items.reduce((sum: number, it: any) => sum + Number(it.wopQty || it.wop_qty || 0), 0)}</td>
                                  </>
                               ) : (
                                  <td style={{ textAlign: 'center', fontSize: '11px' }}>
                                     {items.reduce((sum: number, it: any) => sum + Number(String(data.bill_type || data.billType || '').toLowerCase().includes('without') ? (it.wopQty || it.wop_qty || 0) : (it.quantity || 0)), 0)}
                                  </td>
                               )}
                               <td style={{ textAlign: 'center', fontSize: '11px' }}>{items[0]?.unit || 'pcs'}</td>
                            </tr>
                         )}
                     </tbody>
                  </table>
               )}
            </div>

            {type === 'outward' && data.partyType === 'vendor' && (data.purpose || data.coatingName) && isLastPage && (
               <div style={{ borderTop: '1.5pt solid #000', display: 'flex', flexDirection: 'column' }}>
                  {data.coatingName && (
                     <div style={{ padding: '10px 15px', fontSize: '15px', fontWeight: 'bold', borderBottom: data.purpose ? '1pt dashed #ccc' : 'none' }}>
                        COATING NAME: <span style={{ marginLeft: '10px' }}>{data.coatingName}</span>
                     </div>
                  )}
                  {data.purpose && (
                     <div style={{ padding: '10px 15px', fontSize: '15px', fontWeight: 'bold' }}>
                        PURPOSE: <span style={{ marginLeft: '10px' }}>{data.purpose}</span>
                     </div>
                  )}
               </div>
            )}

            {/* Footer */}
            {isLastPage && (
               <div className="p-footer">
                  {type === 'voucher' && <div className="p-words">Total Amount in Words: <strong>{totalInWords.toUpperCase()} ONLY</strong></div>}
                  
                  <div className="p-signs">
                     <div className="p-sign-box">
                        <div style={{ marginBottom: '40px' }}>Receiver's Signature:</div>
                     </div>
                     <div className="p-sign-box" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ textAlign: 'center' }}>FOR <strong>{(settings.companyName || company?.name || 'Globus Engineering Tools').toUpperCase()}</strong></div>
                        <div style={{ fontSize: '10px', opacity: 0.6, textAlign: 'center' }}>Authorized Signatory</div>
                     </div>
                  </div>

                  {settings.showDeclaration !== false && (
                     <div className="p-declaration">
                        {settings.declarationText || (
                           <>
                              <strong>Declaration:</strong> We declare that this document shows the actual price of the goods described and that all particulars are true and correct.
                           </>
                        )}
                     </div>
                  )}
                  
                  <div style={{ padding: '10px', fontSize: '8px', textAlign: 'center', opacity: 0.7 }}>
                     This is a computer generated document. No signature required.
                  </div>
               </div>
            )}
         </div>
      </div>
   );
};

export default IndustrialDocument;
