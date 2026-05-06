'use client';

import React, { useMemo } from 'react';
import { Company, LedgerEntry } from '@/types/modules';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

interface LedgerPrintTemplateProps {
  party: {
    name: string;
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    pinCode?: string;
    partyType: string;
  };
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

const LedgerPrintTemplate: React.FC<LedgerPrintTemplateProps> = ({
  party,
  entries,
  company,
  dateFrom,
  dateTo,
}) => {
  const { settings } = useSelector((state: RootState) => state.invoices);
  const isVendor = party?.partyType?.toLowerCase() === 'vendor';

  const docSettings = settings || company?.invoiceSettings || {};
  const companyName =
    (docSettings as any).companyName || company?.name?.toUpperCase() || 'GLOBUS ENGINEERING MAIN';
  const companyAddress =
    (docSettings as any).companyAddress ||
    company?.address ||
    'No:24, Annaiyappan Street, S.S.Nagar, Nallampalayam, Coimbatore - 641 006';

  // ── Accounting Logic ──────────────────────────────────────────────────
  const {
    processedEntries,
    openingBalance,
    isDebitOpening,
    totalDebit,
    totalCredit,
  } = useMemo(() => {
    // Opening balance = sum of ALL entries BEFORE dateFrom
    let opBalance = 0;
    if (dateFrom) {
      entries
        .filter(e => new Date(e.date) < new Date(dateFrom))
        .forEach(e => {
          const amt = parseFloat(String(e.amount || 0));
          if (isVendor) opBalance += e.type === 'credit' ? amt : -amt;
          else opBalance += e.type === 'debit' ? amt : -amt;
        });
    }

    // Period entries sorted ASC (oldest first — tally style)
    const period = entries
      .filter(e => {
        if (dateFrom && new Date(e.date) < new Date(dateFrom)) return false;
        if (dateTo && new Date(e.date) > new Date(dateTo)) return false;
        return true;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let drSum = 0;
    let crSum = 0;

    const mapped = period.map(e => {
      const amt = parseFloat(String(e.amount || 0));
      if (e.type === 'debit') drSum += amt;
      else crSum += amt;
      return {
        ...e,
        debitValue: e.type === 'debit' ? amt : 0,
        creditValue: e.type === 'credit' ? amt : 0,
      };
    });

    return {
      processedEntries: mapped,
      openingBalance: Math.abs(opBalance),
      isDebitOpening: opBalance >= 0,
      totalDebit: drSum,
      totalCredit: crSum,
    };
  }, [entries, dateFrom, dateTo, isVendor]);

  // ── Grand-total balancing ─────────────────────────────────────────────
  // Tally convention:
  //   Dr side = period debits  + (opening if Dr) + (closing if Dr)
  //   Cr side = period credits + (opening if Cr) + (closing if Cr)
  //   Both sides must be equal (grand total)
  const drWithOp = totalDebit + (isDebitOpening ? openingBalance : 0);
  const crWithOp = totalCredit + (!isDebitOpening ? openingBalance : 0);

  // Closing balance fills the smaller side so both equal
  const closingBalance = Math.abs(drWithOp - crWithOp);
  const isDebitClosing = crWithOp > drWithOp; // closing goes to Dr if Cr is bigger
  const grandTotal = Math.max(drWithOp, crWithOp) + closingBalance; // = max side (already bigger by closingBalance)
  // Actually: grandTotal = max(drWithOp, crWithOp)
  const gt = Math.max(drWithOp, crWithOp);

  const dateRangeLabel = () => {
    const from = dateFrom ? formatLedgerDate(dateFrom) : '1-Apr-25';
    const to = dateTo ? formatLedgerDate(dateTo) : '31-Mar-26';
    return `${from} to ${to}`;
  };

  const partyAddrParts = [party?.street1, party?.street2, party?.city, party?.state]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="lt-wrap">

      {/* ═══════════════════ HEADER ═══════════════════ */}
      <table className="lt-header-table">
        <tbody>
          <tr>
            <td className="lt-hdr-left"></td>
            <td className="lt-hdr-center">
              <div className="lt-co-name">{companyName}</div>
              <div className="lt-co-addr">{companyAddress}</div>
              <div className="lt-party-name">{party?.name || 'ACCOUNT NAME'}</div>
              <div className="lt-party-sub">Ledger Account</div>
              {partyAddrParts && <div className="lt-party-addr">{partyAddrParts}</div>}
              <div className="lt-date-range">{dateRangeLabel()}</div>
            </td>
            <td className="lt-hdr-right"></td>
          </tr>
        </tbody>
      </table>

      {/* ═══════════════════ LEDGER TABLE ═══════════════════ */}
      <table className="lt-table">
        <thead>
          <tr>
            <th className="w-date">Date</th>
            <th className="w-part">Particulars</th>
            <th className="w-vtype">Vch Type</th>
            <th className="w-vno">Vch No.</th>
            <th className="w-amt">Debit</th>
            <th className="w-amt">Credit</th>
          </tr>
        </thead>
        <tbody>

          {/* ── Opening Balance ── */}
          <tr>
            <td className="td-date">{dateFrom ? formatLedgerDate(dateFrom) : '1-Apr-25'}</td>
            <td>
              <span className="byto">{isDebitOpening ? 'To' : 'By'}</span>
              <strong>Opening Balance</strong>
            </td>
            <td></td>
            <td></td>
            <td className="num">{isDebitOpening && openingBalance > 0 ? fmt(openingBalance) : ''}</td>
            <td className="num">{!isDebitOpening && openingBalance > 0 ? fmt(openingBalance) : ''}</td>
          </tr>

          {/* ── Period Entries ── */}
          {processedEntries.map((e: any, idx: number) => {
            // "To" = debit (money going out / receivable), "By" = credit (money coming in / payable)
            const prefix = e.debitValue > 0 ? 'To' : 'By';
            return (
              <tr key={idx}>
                <td className="td-date">{formatLedgerDate(e.date)}</td>
                <td>
                  <span className="byto">{prefix}</span>
                  {e.description || e.vchType || '-'}
                </td>
                <td>{e.vchType || ''}</td>
                <td>{e.vchNo || ''}</td>
                <td className="num">{e.debitValue > 0 ? fmt(e.debitValue) : ''}</td>
                <td className="num">{e.creditValue > 0 ? fmt(e.creditValue) : ''}</td>
              </tr>
            );
          })}

          {/* Closing balance shown only in footer */}

        </tbody>
        <tfoot>
          {/* ── Subtotals row ── */}
          <tr className="row-subtotal">
            <td colSpan={4}></td>
            <td className="num">{fmt(drWithOp)}</td>
            <td className="num">{fmt(crWithOp)}</td>
          </tr>

          {/* ── Closing Balance row ── */}
          {closingBalance > 0 && (
            <tr className="row-closinglabel">
              <td></td>
              <td>
                <span className="byto">{isDebitClosing ? 'To' : 'By'}</span>
                <strong>Closing Balance</strong>
              </td>
              <td colSpan={2}></td>
              <td className="num">{isDebitClosing ? fmt(closingBalance) : ''}</td>
              <td className="num">{!isDebitClosing ? fmt(closingBalance) : ''}</td>
            </tr>
          )}

          {/* ── Grand Total ── */}
          <tr className="row-grandtotal">
            <td colSpan={4}></td>
            <td className="num">{fmt(gt)}</td>
            <td className="num">{fmt(gt)}</td>
          </tr>
        </tfoot>
      </table>

      {/* ═══════════════════ STYLES ═══════════════════ */}
      <style jsx>{`
        * { box-sizing: border-box; }

        .lt-wrap {
          background: #fff;
          width: 100%;
          font-family: 'Times New Roman', Times, serif;
          font-size: 9.5pt;
          color: #000;
        }

        /* ─ Header ─ */
        .lt-header-table {
          width: 100%;
          border-collapse: collapse;
          border-bottom: 1pt solid #000;
          padding-bottom: 4px;
        }
        .lt-hdr-left  { width: 15%; vertical-align: top; padding: 6px 8px; }
        .lt-hdr-center { width: 70%; text-align: center; padding: 6px 4px; vertical-align: top; }
        .lt-hdr-right  { width: 15%; text-align: right; vertical-align: top; padding: 6px 8px; font-size: 8.5pt; }

        .lt-co-name    { font-size: 12pt; font-weight: bold; }
        .lt-co-addr    { font-size: 8.5pt; margin-top: 1px; }
        .lt-party-name { font-size: 11pt; font-weight: bold; margin-top: 8px; }
        .lt-party-sub  { font-size: 9pt; }
        .lt-party-addr { font-size: 8.5pt; margin-top: 2px; }
        .lt-date-range { font-size: 9pt; margin-top: 4px; }

        /* ─ Table ─ */
        .lt-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 9pt;
        }

        .lt-table thead tr {
          border-top: 1pt solid #000;
          border-bottom: 1pt solid #000;
        }
        .lt-table th {
          font-size: 9pt;
          font-weight: bold;
          padding: 4px 6px;
          text-align: left;
        }
        .lt-table th:last-child,
        .lt-table th:nth-last-child(2) {
          text-align: right;
        }

        /* Date cell: never wrap */
        .lt-table td.td-date {
          white-space: nowrap;
          width: 10%;
        }

        .w-date  { width: 10%; white-space: nowrap; }
        .w-part  { width: 40%; }
        .w-vtype { width: 16%; }
        .w-vno   { width: 10%; }
        .w-amt   { width: 12%; text-align: right; }

        .lt-table td {
          padding: 2px 6px;
          vertical-align: top;
          font-size: 9pt;
        }
        .lt-table td.num {
          text-align: right;
          font-family: 'Courier New', monospace;
          font-size: 8.5pt;
        }

        .byto {
          display: inline-block;
          width: 22px;
          font-style: normal;
        }

        /* Subtotal row */
        .row-subtotal td {
          border-top: 1pt solid #000;
          padding-top: 3px;
          padding-bottom: 2px;
        }

        /* Closing label row - visible, italic */
        .row-closinglabel td {
          font-style: italic;
          padding-bottom: 2px;
        }

        /* Grand total row */
        .row-grandtotal td {
          border-top: 1pt solid #000;
          border-bottom: 2pt double #000;
          font-weight: bold;
          padding: 3px 6px;
          font-family: 'Courier New', monospace;
          font-size: 8.5pt;
        }

        /* Keep totals together — no page break inside tfoot */
        @media print {
          tfoot { display: table-row-group; }
          .row-subtotal, .row-closinglabel, .row-grandtotal {
            page-break-inside: avoid;
            page-break-before: avoid;
          }
        }

        /* ─ Print overrides: suppress browser date/URL headers ─ */
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          .lt-wrap {
            font-size: 9pt;
            padding: 12mm 10mm;
          }
        }
      `}</style>
    </div>
  );
};

export default LedgerPrintTemplate;
