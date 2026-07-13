import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { Company, PurchaseBill } from '@/types/modules';
import { numberToWords } from '@/utils/numberToWords';

interface PurchaseBillDocumentProps {
  bill: PurchaseBill;
  company?: Company | null;
}

const PurchaseBillDocument: React.FC<PurchaseBillDocumentProps> = ({ bill, company }) => {
  const settings = company?.invoiceSettings || {};

  const companyName =
    (!settings.companyName || settings.companyName.toUpperCase().includes('MACHINING'))
      ? 'GLOBUS ENGINEERING TOOLS'
      : settings.companyName.toUpperCase();

  const companyAddress =
    (!settings.companySubHeader || settings.companySubHeader.toUpperCase().includes('MACHINING'))
      ? 'No 24, Annaiyappan Street, S.S.Nagar, Nallampalayam, Ganapathy Post, Coimbatore-641006.'
      : settings.companySubHeader;

  const gstNo = settings.gstNo || company?.gstin || '33AAIFG6568K1ZZ';
  const showLogo = settings.showLogo !== false;
  const logo = settings.logo && settings.logo.length > 10 ? settings.logo : company?.logo;
  const logoSecondary = settings.logoSecondary && settings.logoSecondary.length > 10
    ? settings.logoSecondary : company?.logoSecondary;

  const fmtDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('en-GB').replace(/\//g, '-') : '-';

  const grandTotal = bill.grandTotal ?? (
    (bill.amount || 0) + (bill.cgst || 0) + (bill.sgst || 0) + (bill.igst || 0) + (bill.roundOff || 0)
  );

  const amountInWords = numberToWords(grandTotal);

  // Exactly 11 filler rows to push footer to bottom of the page
  const FILLER_COUNT = 10;

  return (
    <div className="industrial-print-container">
      <div className="invoice-page">
        <div className="page-border-box last-page">

          {/* ── HEADER ── */}
          <div className="p-header">
            <div style={{ width: '85px', height: '85px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {logo && showLogo ? (
                <img src={logo} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              ) : showLogo ? (
                <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                  <path d="M25 5 L75 5 L95 25 L95 75 L75 95 L25 95 L5 75 L5 25 Z" fill="none" stroke="#000" strokeWidth="2" />
                  <circle cx="50" cy="50" r="28" fill="none" stroke="#000" strokeWidth="2" />
                  <circle cx="50" cy="50" r="22" fill="none" stroke="#000" strokeWidth="1.2" />
                  <path d="M50 20 L50 10 M50 80 L50 90 M20 50 L10 50 M80 50 L90 50" stroke="#000" strokeWidth="2" />
                  <text x="50" y="62" fontSize="32" fontWeight="900" textAnchor="middle" fill="#000" fontFamily="Arial, sans-serif">G</text>
                </svg>
              ) : null}
            </div>

            <div style={{ textAlign: 'center', flex: 1 }}>
              <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '900', letterSpacing: '0.8pt' }}>
                {companyName}
              </h1>
              <div style={{ fontSize: '12px', fontWeight: '900', marginTop: '2px' }}>
                {companyAddress}
              </div>
            </div>

            <div style={{ width: '85px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              {logoSecondary && showLogo ? (
                <img src={logoSecondary} alt="Secondary Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              ) : showLogo ? (
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

          {/* ── DOCUMENT LABEL ── */}
          <div className="tax-invoice-label">PURCHASE BILL</div>

          {/* ── ADDRESS ── */}
          <div className="p-address">
            <div className="p-addr-box">
              <div className="p-addr-title">SUPPLIER DETAILS :</div>
              <div className="p-addr-content">
                <div style={{ display: 'grid', gridTemplateColumns: '70px auto', rowGap: '2px' }}>
                  <div>Name</div><div>: <strong>{(bill.companyName || 'N/A').toUpperCase()}</strong></div>
                  {bill.gstTin && (
                     <>
                        <div>GST No</div><div>: <strong>{bill.gstTin}</strong></div>
                     </>
                  )}
                  <div style={{ alignSelf: 'start' }}>Address</div>
                  <div style={{ lineHeight: '1.2', display: 'flex', alignItems: 'flex-start' }}>
                    <span style={{ flexShrink: 0, marginRight: '2px' }}>:</span>
                    <span>-</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-addr-box">
              <div className="p-addr-title">RECEIPIENTS DETAILS :</div>
              <div className="p-addr-content">
                <div style={{ display: 'grid', gridTemplateColumns: '70px auto', rowGap: '2px' }}>
                  <div>Name</div><div>: <strong>{companyName}</strong></div>
                  <div style={{ alignSelf: 'start' }}>Address</div>
                  <div style={{ lineHeight: '1.2', display: 'flex', alignItems: 'flex-start' }}>
                     <span style={{ flexShrink: 0, marginRight: '2px' }}>:</span>
                     <span>{companyAddress}</span>
                  </div>
                  <div>GST No</div><div>: <strong>{gstNo}</strong></div>
                  <div>State</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                     <span>: Tamilnadu</span>
                     <span>Code : 33</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── TABLE AREA ── */}
          <div className="p-table-area">
            <table className="p-table">
              <thead>
                <tr>
                  <th style={{ width: '35px' }}>S.No</th>
                  <th style={{ textAlign: 'left', paddingLeft: '6px' }}>Description / Company Name</th>
                  <th style={{ width: '55px' }}>SAC</th>
                  <th style={{ width: '50px' }}>Qty</th>
                  <th style={{ width: '100px', textAlign: 'right', paddingRight: '6px' }}>Taxable Value</th>
                  <th style={{ width: '75px', textAlign: 'right', paddingRight: '6px' }}>CGST (₹)</th>
                  <th style={{ width: '75px', textAlign: 'right', paddingRight: '6px' }}>SGST (₹)</th>
                  <th style={{ width: '75px', textAlign: 'right', paddingRight: '6px' }}>IGST (₹)</th>
                  <th style={{ width: '90px', textAlign: 'right', paddingRight: '6px' }}>Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {/* Data Row */}
                <tr>
                  <td style={{ textAlign: 'center' }}>1</td>
                  <td style={{ fontWeight: 'bold', paddingLeft: '6px' }}>{(bill.companyName || '-').toUpperCase()}</td>
                  <td style={{ textAlign: 'center' }}>{bill.sac || '-'}</td>
                  <td style={{ textAlign: 'center' }}>{bill.qty ?? '-'}</td>
                  <td style={{ textAlign: 'right', paddingRight: '6px', fontFamily: 'Courier New, monospace' }}>
                    {Number(bill.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: '6px', fontFamily: 'Courier New, monospace' }}>
                    {Number(bill.cgst || 0) > 0 ? Number(bill.cgst).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: '6px', fontFamily: 'Courier New, monospace' }}>
                    {Number(bill.sgst || 0) > 0 ? Number(bill.sgst).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: '6px', fontFamily: 'Courier New, monospace' }}>
                    {Number(bill.igst || 0) > 0 ? Number(bill.igst).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: '6px', fontWeight: '900', fontFamily: 'Courier New, monospace' }}>
                    {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>

                {/* Filler rows */}
                {[...Array(FILLER_COUNT)].map((_, i) => (
                  <tr key={`filler-${i}`}>
                    <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
                    <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
                  </tr>
                ))}

                {/* Total row */}
                <tr style={{ fontWeight: '900', background: '#f0f0f0', borderTop: '1.5pt solid #000' }}>
                  <td colSpan={4} style={{ textAlign: 'right', padding: '5px 12px', fontSize: '10px' }}>
                    ROUND OFF : {Number(bill.roundOff || 0) !== 0
                      ? Number(bill.roundOff).toLocaleString('en-IN', { minimumFractionDigits: 2 })
                      : '-'}
                  </td>
                  <td colSpan={5} style={{ textAlign: 'right', paddingRight: '8px', fontSize: '11px' }}>
                    GRAND TOTAL :&nbsp;
                    <span style={{ fontFamily: 'Courier New, monospace', fontSize: '13px' }}>
                      {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ── FOOTER ── */}
          <div className="p-footer">
            <div className="p-words">
              Amount in Words : <strong>{amountInWords.toUpperCase()} ONLY</strong>
            </div>

            <div className="p-signs">
              <div className="p-sign-box">
                <div style={{ marginBottom: '40px' }}>Receiver's Signature:</div>
              </div>
              <div className="p-sign-box">
                <div>Checked By</div>
              </div>
              <div className="p-sign-box" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>FOR <strong>{companyName}</strong></div>
                <div style={{ fontSize: '10px', opacity: 0.6, textAlign: 'center' }}>Authorised Signatory</div>
              </div>
            </div>

            <div className="p-declaration">
              This is a computer generated document. Subject to Coimbatore jurisdiction.
            </div>
          </div>

        </div>
      </div>

      <style jsx global>{`
        @page { size: A4; margin: 0 !important; }
        .industrial-print-container {
          background: #fff;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          margin: 0;
        }
        .invoice-page {
          width: 210mm;
          height: 297mm;
          background: white;
          color: black;
          font-family: var(--font-inter), Inter, sans-serif;
          box-sizing: border-box;
          border: none;
          margin: 0 auto;
          overflow: hidden;
        }
        .page-border-box {
          border: 1.5pt solid #000;
          margin: 5mm;
          width: calc(210mm - 10mm);
          height: calc(297mm - 10mm);
          display: flex;
          flex-direction: column;
          background: #fff;
          box-sizing: border-box;
          overflow: hidden;
        }
        .page-border-box.last-page {
          height: calc(297mm - 10mm) !important;
          overflow: hidden !important;
        }
        .p-header {
          height: 100px;
          border-bottom: 1.5pt solid #000;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 15px;
          flex-shrink: 0;
        }
        .tax-invoice-label {
          text-align: center;
          font-size: 12px;
          font-weight: 900;
          padding: 5px 0;
          border-bottom: 1.5pt solid #000;
          background-color: #f0f0f0;
          letter-spacing: 1px;
          text-transform: uppercase;
          flex-shrink: 0;
        }
        .p-meta { font-size: 8.5px; border-bottom: 1.5pt solid #000; flex-shrink: 0; }
        .p-meta-row { display: flex; border-bottom: 1pt solid #000; }
        .p-meta-row:last-child { border-bottom: 0; }
        .p-meta-col {
          flex: 1;
          border-right: 1pt solid #000;
          padding: 4px 8px;
          display: grid;
          grid-template-columns: 88px 14px 1fr;
          align-items: center;
        }
        .p-meta-col:last-child { border-right: 0; }
        .p-meta-val { font-weight: bold; text-transform: uppercase; }
        .p-address {
          display: flex;
          border-bottom: 1.5pt solid #000;
          font-size: 9px;
          flex-shrink: 0;
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
        .p-addr-content { padding: 5px 8px; flex: 1; line-height: 1.4; text-transform: uppercase; }
        .p-table-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .p-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        .p-table th {
          border: 1pt solid #000;
          padding: 4px 2px;
          font-size: 8px;
          text-align: center;
          background: #e9e9e9;
          text-transform: uppercase;
          font-weight: bold;
          vertical-align: middle;
        }
        .p-table td {
          border: 1pt solid #000;
          padding: 2px 4px;
          font-size: 9px;
          font-weight: bold;
          vertical-align: middle;
          height: 19px;
          line-height: 1.2;
        }
        .p-footer { border-top: 1.5pt solid #000; flex-shrink: 0; }
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
        .p-sign-box:last-child { border-right: 0; }
        .p-declaration {
          padding: 4px 10px;
          font-size: 8.5px;
          line-height: 1.3;
          font-weight: bold;
          background: #fff;
        }
        @media print {
          @page { size: A4; margin: 0 !important; }
          html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
          .industrial-print-container { background: #fff !important; margin: 0 !important; padding: 0 !important; }
          .invoice-page { overflow: hidden !important; }
          .page-border-box { overflow: hidden !important; }
        }
      `}</style>
    </div>
  );
};

export default PurchaseBillDocument;
