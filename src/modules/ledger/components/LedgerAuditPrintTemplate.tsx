'use client';

import React from 'react';
import { Company, LedgerEntry } from '@/types/modules';

interface LedgerAuditPrintTemplateProps {
  entries: LedgerEntry[];
  company: Company | null;
  dateFrom?: string;
  dateTo?: string;
}

const fmt = (n: number) =>
  n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatLedgerDate = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const day = d.getDate();
  const month = d.toLocaleString('en-GB', { month: 'short' });
  const year = String(d.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
};

const LedgerAuditPrintTemplate: React.FC<LedgerAuditPrintTemplateProps> = ({
  entries,
  company,
  dateFrom,
  dateTo,
}) => {
  const companyName = company?.name?.toUpperCase() || 'GLOBUS ENGINEERING';
  const companyAddress = company?.address || 'COIMBATORE';

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
      <div className="industrial-header">
         <div className="header-logo-box">
            <svg viewBox="0 0 100 100" className="header-svg">
              <path d="M25 5 L75 5 L95 25 L95 75 L75 95 L25 95 L5 75 L5 25 Z" fill="none" stroke="#000" strokeWidth="2" />
              <circle cx="50" cy="50" r="28" fill="none" stroke="#000" strokeWidth="2" />
              <text x="50" y="62" fontSize="32" fontWeight="900" textAnchor="middle" fill="#000">S</text>
            </svg>
         </div>
         <div className="header-center">
            <h1 className="company-name-large">{companyName}</h1>
            <div className="company-addr-small">{companyAddress}</div>
         </div>
         <div className="header-iso-box">
            <div className="iso-border">
               <div className="iso-q">Q</div>
               <div className="iso-tuv-box">
                  <div className="iso-tuv">TÜV</div>
                  <div className="iso-sud">SÜD</div>
               </div>
               <div className="iso-std">ISO 9001</div>
            </div>
         </div>
      </div>

      <div className="report-title-bar">FULL LEDGER AUDIT REPORT</div>
      <div className="period-bar">Period: {dateRangeLabel()}</div>

      <table className="audit-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Party Name</th>
            <th>Particulars</th>
            <th>Vch Type</th>
            <th>Vch No</th>
            <th className="text-end">Debit</th>
            <th className="text-end">Credit</th>
          </tr>
        </thead>
        <tbody>
          {sortedEntries.map((e, idx) => (
            <tr key={idx}>
              <td>{formatLedgerDate(e.date)}</td>
              <td className="text-capitalize">{e.partyName || '-'}</td>
              <td>{e.description || '-'}</td>
              <td>{e.vchType || 'JOURNAL'}</td>
              <td>{e.vchNo || '-'}</td>
              <td className="text-end">{e.type === 'debit' ? fmt(e.amount) : ''}</td>
              <td className="text-end">{e.type === 'credit' ? fmt(e.amount) : ''}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="footer-total">
            <td colSpan={5} className="text-end fw-bold">TOTAL PERIOD TRANSACTIONS</td>
            <td className="text-end fw-bold">{fmt(totalDebit)}</td>
            <td className="text-end fw-bold">{fmt(totalCredit)}</td>
          </tr>
          <tr className="footer-net">
            <td colSpan={5} className="text-end fw-bold">NET DIFFERENCE</td>
            <td colSpan={2} className="text-end fw-bold">
              {totalDebit > totalCredit 
                ? `₹ ${fmt(totalDebit - totalCredit)} (DR)` 
                : `₹ ${fmt(totalCredit - totalDebit)} (CR)`}
            </td>
          </tr>
        </tfoot>
      </table>

      <style jsx>{`
        .audit-wrap {
          padding: 20mm 15mm;
          background: white;
          color: black;
          font-family: 'Times New Roman', Times, serif;
          font-size: 10pt;
        }
        .audit-wrap {
          padding: 15mm 10mm;
          background: white;
          color: black;
          font-family: 'Times New Roman', Times, serif;
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
        .header-svg { width: 100%; height: 100%; }
        .header-center { text-align: center; flex: 1; padding: 0 20px; }
        .company-name-large { margin: 0; font-size: 22pt; font-weight: 900; letter-spacing: 0.8pt; }
        .company-addr-small { font-size: 9pt; font-weight: bold; margin-top: 4px; color: #333; }
        
        .header-iso-box { width: 75px; display: flex; justify-content: flex-end; align-items: center; }
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
          margin-bottom: 20px;
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

        @media print {
          @page { margin: 0; }
          .audit-wrap { padding: 10mm; }
        }
      `}</style>
    </div>
  );
};

export default LedgerAuditPrintTemplate;
