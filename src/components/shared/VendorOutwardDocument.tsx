import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { Company } from '@/types/modules';

interface VendorOutwardDocumentProps {
   data: any;
   company?: Company | null;
   settings?: any;
   formatType: 'format1' | 'format2';
}

/* Border weights matching physical document */
const OUTER = '1.5px solid #000';   // outer box & section separators
const INNER = '1px solid #000';     // column dividers inside table

const VendorOutwardDocument: React.FC<VendorOutwardDocumentProps> = ({ data, company, settings: propSettings, formatType }) => {
   const { items: vendors } = useSelector((state: RootState) => state.vendors || { items: [] });
   const settings = propSettings || company?.invoiceSettings || {};

   const partyId = data.partyId || data.vendorId || (data as any).party_id;
   let enrichedData = { ...data };
   if (partyId) {
      const vend = vendors.find((v: any) => String(v.id) === String(partyId));
      if (vend) {
         enrichedData.address = enrichedData.address || vend.street1;
         enrichedData.gstin = enrichedData.gstin || vend.gst;
      }
   }

   const allItems: any[] = enrichedData.items || [];
   const logoSrc = settings.logo || company?.logo || '/globus-logo.jpg';
   const companyName = (settings.companyName && !settings.companyName.toLowerCase().includes('machining'))
      ? settings.companyName.toUpperCase() : 'GLOBUS ENGINEERING TOOLS';
   const companyAddress = settings.companyAddress || settings.companySubHeader
      || 'No:24, Annaiyappan Street, S.S.Nagar, Nallampalayam, Ganapathy Post, Coimbatore-641006, TAMIL NADU';
   const gstNo = settings.gstNo || company?.gstin || '33AAIFG6568K1ZZ';
   const partyName = enrichedData.vendorName || enrichedData.partyName || '';
   const partyAddress = enrichedData.address || enrichedData.partyAddress || '';
   const partyGst = enrichedData.gstin || '';
   const dcNo = enrichedData.outwardNo || enrichedData.id || '';
   const dcDate = enrichedData.date
      ? new Date(enrichedData.date).toLocaleDateString('en-GB').replace(/\//g, '-') : '';
   const purpose = enrichedData.coatingName || enrichedData.purpose || 'OPTIMA COATING';
   const totalQty = allItems.reduce((s: number, it: any) => s + Number(it.quantity || 0), 0);

   /* Column widths — measured from the physical document proportionally */
   const COL_SNO  = '38px';
   const COL_QTY  = '58px';
   const PANEL_W  = '148px';   /* DC.NO / DATE right panel */
   const PANEL_LBL = '46px';  /* "DC.NO" / "DATE" label */
   const FOOTER_R = '185px';  /* footer right half */

   return (
      <>
         <div style={{
            width: '210mm',
            height: '297mm',
            margin: '0 auto',
            background: '#fff',
            fontFamily: 'Arial, sans-serif',
            fontSize: '9px',
            color: '#000',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
         }}>
            {/* Outer border wrapper */}
            <div style={{
               border: OUTER,
               margin: '5mm',
               flex: 1,
               display: 'flex',
               flexDirection: 'column',
            }}>

               {/* ── HEADER ── */}
               <div style={{ display: 'flex', borderBottom: OUTER, flexShrink: 0, minHeight: '72px' }}>
                  <div style={{ width: '88px', borderRight: OUTER, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px', flexShrink: 0 }}>
                     <img src={logoSrc} alt="Logo" style={{ maxWidth: '78px', maxHeight: '65px', objectFit: 'contain' }} />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px 10px', textAlign: 'center' }}>
                     <div style={{ fontSize: '19px', fontWeight: '900', letterSpacing: '0.4px', lineHeight: 1.1 }}>{companyName}</div>
                     <div style={{ fontSize: '8.5px', fontWeight: 'bold', marginTop: '2px', color: '#444' }}>An ISO 9001: 2015 Certified Company</div>
                     <div style={{ fontSize: '7.5px', marginTop: '4px' }}>{companyAddress}</div>
                     <div style={{ fontSize: '7.5px', marginTop: '1px' }}>GSTTIN: {gstNo}</div>
                     <div style={{ fontSize: '7.5px', marginTop: '1px' }}>Web : www.globusengineeringtools.com</div>
                  </div>
               </div>

               {/* ── TITLE ── */}
               <div style={{ textAlign: 'center', fontWeight: '900', fontSize: '11px', padding: '4px 0', borderBottom: OUTER, background: '#eeeeee', letterSpacing: '1.5px', flexShrink: 0 }}>
                  DELIVERY CHALLAN
               </div>

               {/* ── TO / DC ROW ── */}
               <div style={{ display: 'flex', borderBottom: OUTER, flexShrink: 0 }}>
                  {/* Party block */}
                  <div style={{ flex: 1, borderRight: OUTER, display: 'flex', flexDirection: 'column' }}>
                     <div style={{ padding: '5px 8px', flex: 1 }}>
                        <div style={{ fontSize: '7.5px', marginBottom: '2px' }}>TO,</div>
                        <div style={{ fontSize: '9px', fontWeight: 'bold', lineHeight: 1.6 }}>{partyName}</div>
                        <div style={{ fontSize: '8px', lineHeight: 1.6 }}>{partyAddress}</div>
                     </div>
                     <div style={{ borderTop: OUTER, padding: '3px 8px', fontSize: '8px', fontWeight: 'bold' }}>
                        GST No : {partyGst}
                     </div>
                  </div>
                  {/* DC NO / DATE panel */}
                  <div style={{ width: PANEL_W, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                     <div style={{ display: 'flex', flex: 1, borderBottom: OUTER }}>
                        <div style={{ width: PANEL_LBL, borderRight: OUTER, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 'bold', textAlign: 'center' }}>DC.NO</div>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12.5px', fontWeight: '900', textAlign: 'center' }}>{dcNo}</div>
                     </div>
                     <div style={{ display: 'flex', flex: 1 }}>
                        <div style={{ width: PANEL_LBL, borderRight: OUTER, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 'bold', textAlign: 'center' }}>DATE</div>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12.5px', fontWeight: '900', textAlign: 'center' }}>{dcDate}</div>
                     </div>
                  </div>
               </div>

               {/* ── TABLE (flex:1 — takes all remaining height) ── */}
               <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

                  {/* Column headers */}
                  <div style={{ display: 'flex', borderBottom: OUTER, background: '#eeeeee', flexShrink: 0 }}>
                     <div style={{ width: COL_SNO, borderRight: INNER, padding: '4px 2px', fontSize: '8px', fontWeight: '900', textAlign: 'center' }}>S.NO</div>
                     <div style={{ flex: 1, borderRight: INNER, padding: '4px 2px', fontSize: '8px', fontWeight: '900', textAlign: 'center' }}>DESCRIPTION</div>
                     <div style={{ width: COL_QTY, padding: '4px 2px', fontSize: '8px', fontWeight: '900', textAlign: 'center' }}>QTY</div>
                  </div>

                  {/* Populated item rows */}
                  {allItems.map((item: any, idx: number) => (
                     <div key={idx} style={{ display: 'flex', flexShrink: 0, minHeight: '24px' }}>
                        <div style={{ width: COL_SNO, borderRight: INNER, padding: '3px 2px', fontSize: '9px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{idx + 1}</div>
                        <div style={{ flex: 1, borderRight: INNER, padding: '3px 8px', fontSize: '9px', fontWeight: 'bold', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.description}</div>
                        <div style={{ width: COL_QTY, padding: '3px 2px', fontSize: '9px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.quantity}</div>
                     </div>
                  ))}

                  {/* ── Empty stretch — vertical column lines continue to bottom ── */}
                  <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
                     <div style={{ width: COL_SNO, borderRight: INNER, boxSizing: 'border-box' }}></div>
                     <div style={{ flex: 1, borderRight: INNER, boxSizing: 'border-box' }}></div>
                     <div style={{ width: COL_QTY, boxSizing: 'border-box' }}></div>
                  </div>

                  {/* TOTAL row */}
                  <div style={{ display: 'flex', borderTop: OUTER, flexShrink: 0 }}>
                     <div style={{ width: COL_SNO, borderRight: INNER, padding: '5px 2px' }}></div>
                     <div style={{ flex: 1, borderRight: INNER, padding: '5px', textAlign: 'center', fontWeight: '900', fontSize: '9.5px' }}>TOTAL</div>
                     <div style={{ width: COL_QTY, padding: '5px', textAlign: 'center', fontWeight: '900', fontSize: '9.5px' }}>{totalQty}</div>
                  </div>
               </div>

               {/* ── FOOTER ── */}
               <div style={{ borderTop: OUTER, flexShrink: 0 }}>
                  {/* OPTIMA COATING | For COMPANY — same row */}
                  <div style={{ display: 'flex', borderBottom: OUTER }}>
                     <div style={{ flex: 1, padding: '5px 10px', fontWeight: '900', fontSize: '9.5px', background: '#dddddd', textAlign: 'center', borderRight: OUTER, letterSpacing: '0.5px' }}>
                        {purpose}
                     </div>
                     <div style={{ width: FOOTER_R, padding: '5px 8px', fontSize: '8.5px', fontWeight: '900', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        For {companyName}
                     </div>
                  </div>
                  {/* Received text | empty */}
                  <div style={{ display: 'flex', borderBottom: OUTER }}>
                     <div style={{ flex: 1, padding: '4px 10px', fontSize: '8px', textAlign: 'center', borderRight: OUTER }}>
                        Received the above goods in good condition
                     </div>
                     <div style={{ width: FOOTER_R }}></div>
                  </div>
                  {/* Signatures */}
                  <div style={{ display: 'flex', height: '46px', alignItems: 'flex-end' }}>
                     <div style={{ flex: 1, borderRight: OUTER, padding: '4px', textAlign: 'center', fontSize: '8px' }}>
                        Receivers signature
                     </div>
                     <div style={{ width: FOOTER_R, padding: '4px', textAlign: 'center', fontSize: '8px' }}>
                        Authorised signature
                     </div>
                  </div>
               </div>

            </div>{/* end outer border */}
         </div>{/* end A4 page */}

         <style jsx global>{`
            @page { size: A4; margin: 0 !important; }
            @media print {
               html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
            }
         `}</style>
      </>
   );
};

export default VendorOutwardDocument;
