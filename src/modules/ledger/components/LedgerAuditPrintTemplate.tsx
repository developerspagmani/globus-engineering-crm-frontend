'use client';

import React from 'react';
import { Company, LedgerEntry } from '@/types/modules';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

interface LedgerAuditPrintTemplateProps {
  entries: LedgerEntry[];
  company: Company | null;
  dateFrom?: string;
  dateTo?: string;
  hideHeaderOnScreen?: boolean;
}

const fmt = (n: number) =>
  n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatLedgerDate = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
};

const LedgerAuditPrintTemplate: React.FC<LedgerAuditPrintTemplateProps> = ({
  entries,
  company,
  dateFrom,
  dateTo,
  hideHeaderOnScreen = false,
}) => {
  const { settings, items: allInvoices } = useSelector((state: RootState) => state.invoices);
  const docSettings = settings || company?.invoiceSettings || {};
  
  const showLogo = docSettings.showLogo !== false;
  const logoUrl = (docSettings.logo && docSettings.logo.length > 10) ? docSettings.logo : company?.logo;
  const logoSecondaryUrl = (docSettings.logoSecondary && docSettings.logoSecondary.length > 10) ? docSettings.logoSecondary : company?.logoSecondary;

  const companyName = docSettings.companyName || company?.name?.toUpperCase() || 'GLOBUS ENGINEERING';
  const companyAddress = docSettings.companyAddress || company?.address || 'COIMBATORE';

  const dateRangeLabel = () => {
    const from = dateFrom ? formatLedgerDate(dateFrom) : 'Start';
    const to = dateTo ? formatLedgerDate(dateTo) : 'Today';
    return `${from} to ${to}`;
  };

  // Sort entries by date for the audit
  const sortedEntries = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const totalDebit = entries.reduce((sum, e) => sum + (e.type === 'debit' ? e.amount : 0), 0);
  const totalCredit = entries.reduce((sum, e) => sum + (e.type === 'credit' ? e.amount : 0), 0);

  return (
    <div className="audit-wrap">
      <div className={`industrial-header${hideHeaderOnScreen ? ' hide-on-screen-only' : ''}`}>
         <div className="header-logo-box">
            {logoUrl && showLogo ? (
               <img
                  src={logoUrl}
                  alt="Logo"
                  className="logo-img"
               />
            ) : showLogo ? (
               <svg viewBox="0 0 100 100" className="header-svg">
                 <path d="M25 5 L75 5 L95 25 L95 75 L75 95 L25 95 L5 75 L5 25 Z" fill="none" stroke="#000" strokeWidth="2" />
                 <circle cx="50" cy="50" r="28" fill="none" stroke="#000" strokeWidth="2" />
                 <circle cx="50" cy="50" r="22" fill="none" stroke="#000" strokeWidth="1.2" />
                 <path d="M50 20 L50 10 M50 80 L50 90 M20 50 L10 50 M80 50 L90 50" stroke="#000" strokeWidth="2" />
                 <text x="50" y="62" fontSize="32" fontWeight="900" textAnchor="middle" fill="#000" fontFamily="Arial, sans-serif">S</text>
               </svg>
            ) : null}
         </div>
         <div className="header-center">
            <h1 className="company-name-large">{companyName}</h1>
            <div className="company-addr-small">{companyAddress}</div>
         </div>
         <div className="header-iso-box">
            {logoSecondaryUrl && showLogo ? (
               <img
                  src={logoSecondaryUrl}
                  alt="Secondary Logo"
                  className="logo-img"
               />
            ) : showLogo ? (
               <div className="iso-border">
                  <div className="iso-q">Q</div>
                  <div className="iso-tuv-box">
                     <div className="iso-tuv">TÜV</div>
                     <div className="iso-sud">SÜD</div>
                  </div>
                  <div className="iso-std">ISO 9001</div>
               </div>
            ) : null}
         </div>
      </div>

      <div className={`report-title-bar${hideHeaderOnScreen ? ' hide-on-screen-only' : ''}`}>FULL LEDGER AUDIT REPORT</div>
      <div className={`period-bar${hideHeaderOnScreen ? ' hide-on-screen-only' : ''}`}>Period: {dateRangeLabel()}</div>

      <table className="audit-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Party Name</th>
            <th>Particulars</th>
            <th>Vch Type</th>
            <th className="text-end">Debit</th>
            <th className="text-end">Credit</th>
          </tr>
        </thead>
        <tbody>
          {sortedEntries.map((e, idx) => (
            <tr key={idx}>
              <td>{formatLedgerDate(e.date)}</td>
              <td className="text-capitalize">{e.partyName || '-'}</td>
               <td>
                 {(() => {
                   if (e.vchType === 'RECEIPT' || e.vchType === 'PAYMENT') {
                     const desc = e.description || '';
                     
                     // 1. Check if it matches a legacy migrated invoice receipt
                     const invMatch = desc.match(/(?:Receipt for Inv:|Migrated Receipt for Inv:)\s*(\d+)/i);
                     if (invMatch) {
                       const invNo = invMatch[1].trim();
                       const invoice = allInvoices.find(inv => String(inv.invoiceNumber || (inv as any).invoice_no || '') === invNo);
                       if (invoice && ((invoice as any).chequeNo || (invoice as any).cheque_no)) {
                         return (invoice as any).chequeNo || (invoice as any).cheque_no;
                       }
                     }

                     // 2. Format payment modes cleanly
                     let cleanDesc = desc.replace(/^(RECEIPT|PAYMENT)\s*-\s*/i, '');
                     
                     if (cleanDesc.includes('|')) {
                       const parts = cleanDesc.split('|').map((p: string) => p.trim());
                       const mode = parts[1].toUpperCase();
                       const modeLabels: Record<string, string> = {
                         CASH: 'Cash', NEFT: 'NEFT', RTGS: 'RTGS',
                         CHEQUE: 'Cheque', UPI: 'UPI', ONLINE: 'Online', BANK: 'Bank',
                       };
                       return `${modeLabels[mode] || mode} (${parts[0]})`;
                     }
                     
                     const uppercaseDesc = cleanDesc.toUpperCase();
                     const rawModeLabels: Record<string, string> = {
                       CASH: 'Cash', NEFT: 'NEFT', RTGS: 'RTGS',
                       CHEQUE: 'Cheque', UPI: 'UPI', ONLINE: 'Online', BANK: 'Bank',
                     };
                     if (rawModeLabels[uppercaseDesc]) {
                       return rawModeLabels[uppercaseDesc];
                     }

                     return cleanDesc.replace(/^Migrated\s+/i, '') || 'Receipt';
                   }
                   return e.description || '-';
                 })()}
               </td>
              <td>{e.vchType || 'JOURNAL'}</td>
              <td className="text-end">{e.type === 'debit' ? fmt(e.amount) : ''}</td>
              <td className="text-end">{e.type === 'credit' ? fmt(e.amount) : ''}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="footer-total">
            <td colSpan={4} className="text-end fw-bold">TOTAL PERIOD TRANSACTIONS</td>
            <td className="text-end fw-bold">{fmt(totalDebit)}</td>
            <td className="text-end fw-bold">{fmt(totalCredit)}</td>
          </tr>
          <tr className="footer-net">
            <td colSpan={4} className="text-end fw-bold">NET DIFFERENCE</td>
            <td colSpan={2} className="text-end fw-bold">
              ₹ {fmt(Math.abs(totalDebit - totalCredit))}
            </td>
          </tr>
        </tfoot>
      </table>

      <style jsx>{`
        .audit-wrap {
          padding: 15mm 10mm;
          background: white;
          color: black;
          font-family: 'Roboto', 'Arial', sans-serif;
          font-size: 10pt;
        }
        .industrial-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border: 1.5pt solid #000;
          padding: 10px 15px;
          margin-bottom: 0;
        }
        .header-logo-box { width: 75px; height: 75px; display: flex; align-items: center; justify-content: center; }
        .logo-img { max-width: 100%; max-height: 100%; object-fit: contain; }
        .header-svg { width: 100%; height: 100%; }
        .header-center { text-align: center; flex: 1; padding: 0 20px; }
        .company-name-large { margin: 0; font-size: 22pt; font-weight: 900; letter-spacing: 0.8pt; }
        .company-addr-small { font-size: 9pt; font-weight: bold; margin-top: 4px; color: #333; }
        
        .header-iso-box { width: 75px; height: 75px; display: flex; justify-content: flex-end; align-items: center; }
        .iso-border { width: 60px; border: 1.5pt solid #000; text-align: center; }
        .iso-q { font-size: 8pt; font-weight: 900; border-bottom: 1pt solid #000; background: #f0f0f0; padding: 1px 0; }
        .iso-tuv-box { padding: 2px 0; }
        .iso-tuv { font-size: 14pt; font-weight: 900; line-height: 1; }
        .iso-sud { font-size: 9pt; font-weight: 900; }
        .iso-std { font-size: 7pt; font-weight: 900; border-top: 1pt solid #000; padding: 1px 0; }

        .report-title-bar {
          text-align: center;
          font-size: 12pt;
          font-weight: 900;
          padding: 6px 0;
          border: 1.5pt solid #000;
          border-top: 0;
          background-color: #f2f2f2;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }
        .period-bar {
          text-align: center;
          font-size: 10pt;
          font-style: italic;
          border: 1.5pt solid #000;
          border-top: 0;
          padding: 4px 0;
        }
        
        .audit-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        .audit-table th, .audit-table td {
          border: 1px solid #000;
          padding: 6px 8px;
          text-align: left;
        }
        .audit-table th {
          background-color: #f2f2f2;
          font-weight: bold;
          text-transform: uppercase;
          font-size: 9pt;
        }
        .text-end { text-align: right !important; }
        .fw-bold { font-weight: bold; }
        
        .footer-total td {
          border-top: 2px solid #000;
          background-color: #fafafa;
        }
        .footer-net td {
          border-top: 1px solid #000;
          background-color: #eeeeee;
        }

        @media screen {
          .hide-on-screen-only {
            display: none !important;
          }
        }

        @media print {
          @page { margin: 0; }
          .audit-wrap { padding: 10mm; }
        }
      `}</style>
    </div>
  );
};

export default LedgerAuditPrintTemplate;
