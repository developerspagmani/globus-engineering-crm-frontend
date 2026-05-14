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
      <div className="audit-header">
        <div className="co-name">{companyName}</div>
        <div className="co-addr">{companyAddress}</div>
        <div className="report-title">FULL LEDGER AUDIT REPORT</div>
        <div className="date-range">Period: {dateRangeLabel()}</div>
      </div>

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
        .audit-header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
        }
        .co-name { font-size: 16pt; font-weight: bold; }
        .co-addr { font-size: 10pt; margin-bottom: 10px; }
        .report-title { font-size: 14pt; font-weight: bold; text-decoration: underline; margin-top: 10px; }
        .date-range { font-size: 11pt; margin-top: 5px; font-style: italic; }
        
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
