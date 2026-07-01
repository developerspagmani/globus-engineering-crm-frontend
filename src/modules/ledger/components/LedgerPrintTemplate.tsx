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
  openingBalance?: number;
  isDebitOpening?: boolean;
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

const LedgerPrintTemplate: React.FC<LedgerPrintTemplateProps> = ({
  party,
  entries,
  company,
  dateFrom,
  dateTo,
  openingBalance: propOpeningBalance,
  isDebitOpening: propIsDebitOpening,
}) => {
  const { settings, items: allInvoices } = useSelector((state: RootState) => state.invoices);
  const isVendor = party?.partyType?.toLowerCase() === 'vendor';

  const docSettings = settings || company?.invoiceSettings || {};
  const companyName =
    (docSettings as any).companyName || company?.name?.toUpperCase() || 'GLOBUS ENGINEERING MAIN';
  const companyAddress =
    (docSettings as any).companyAddress ||
    company?.address ||
    'No 24,Annaiyappan Street,S.S.Nagar, Nallampalayam,Ganapathy Post, Coimbatore-641006.';

  // ── Accounting Logic ──────────────────────────────────────────────────
  const {
    processedEntries,
    openingBalance,
    isDebitOpening,
    totalDebit,
    totalCredit,
  } = useMemo(() => {
    // Opening balance logic
    let opBalance = propOpeningBalance ?? 0;
    let isDebitOp = propIsDebitOpening ?? false;

    // Only fallback to manual calculation if not provided by parent
    if (propOpeningBalance === undefined && dateFrom) {
      entries
        .filter(e => new Date(e.date) < new Date(dateFrom))
        .forEach(e => {
          const amt = parseFloat(String(e.amount || 0));
          if (isVendor) opBalance += e.type === 'credit' ? amt : -amt;
          else opBalance += e.type === 'debit' ? amt : -amt;
        });
      
      isDebitOp = opBalance >= 0;
      opBalance = Math.abs(opBalance);
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
      openingBalance: opBalance,
      isDebitOpening: isDebitOp,
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
    const from = dateFrom ? formatLedgerDate(dateFrom) : '01.04.2025';
    const to = dateTo ? formatLedgerDate(dateTo) : '31.03.2026';
    return `${from} to ${to}`;
  };

  const partyAddrParts = [party?.street1, party?.street2, party?.city, party?.state]
    .filter(Boolean)
    .join(', ');

  const showLogo = docSettings.showLogo !== false;
  const logoUrl = (docSettings.logo && docSettings.logo.length > 10) ? docSettings.logo : company?.logo;
  const logoSecondaryUrl = (docSettings.logoSecondary && docSettings.logoSecondary.length > 10) ? docSettings.logoSecondary : company?.logoSecondary;

  return (
    <div className="lt-wrap">

      {/* ═══════════════════ HEADER ═══════════════════ */}
      <table className="lt-header-table">
        <tbody>
          <tr>
            <td className="lt-hdr-left">
              <div className="logo-container">
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
            </td>
            <td className="lt-hdr-center">
              <div className="lt-co-name">{companyName}</div>
              <div className="lt-co-addr">{companyAddress}</div>
              <div className="lt-party-name">{party?.name || 'ACCOUNT NAME'}</div>
              <div className="lt-party-sub">Ledger Account</div>
              {partyAddrParts && <div className="lt-party-addr">{partyAddrParts}</div>}
              <div className="lt-date-range">{dateRangeLabel()}</div>
            </td>
            <td className="lt-hdr-right">
              <div className="logo-container right-logo">
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
            </td>
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
            <th className="w-vno">Vch No</th>
            <th className="w-amt">Debit</th>
            <th className="w-amt">Credit</th>
          </tr>
        </thead>
        <tbody>

          {/* ── Opening Balance ── */}
          <tr>
            <td className="td-date">{dateFrom ? formatLedgerDate(dateFrom) : '01.04.2025'}</td>
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
                  {(() => {
                    if (e.vchType === 'INVOICE') {
                      return 'GST Sales';
                    }
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
                    return e.description?.replace(/^Migrated\s+/i, '') || e.vchType || '-';
                  })()}
                </td>
                <td>{e.vchType === 'INVOICE' ? 'Sales' : e.vchType === 'RECEIPT' ? 'Receipt' : e.vchType || ''}</td>
                <td>{e.vchNo?.replace(/^REC-/i, '') || '-'}</td>
                <td className="num">{e.debitValue > 0 ? fmt(e.debitValue) : ''}</td>
                <td className="num">{e.creditValue > 0 ? fmt(e.creditValue) : ''}</td>
              </tr>
            );
          })}

          {/* Closing balance shown only in footer */}

        </tbody>
        <tfoot>
          {/* ── Tally Style Footer ── */}
          <tr className="tally-footer-row" style={{ borderTop: '1px solid #ccc' }}>
            <td colSpan={4} style={{ textAlign: 'right' }}>Opening Balance :</td>
            <td className="num">{isDebitOpening && openingBalance > 0 ? fmt(openingBalance) : ''}</td>
            <td className="num">{!isDebitOpening && openingBalance > 0 ? fmt(openingBalance) : ''}</td>
          </tr>
          <tr className="tally-footer-row">
            <td colSpan={4} style={{ textAlign: 'right' }}>Current Total :</td>
            <td className="num">{totalDebit > 0 ? fmt(totalDebit) : ''}</td>
            <td className="num">{totalCredit > 0 ? fmt(totalCredit) : ''}</td>
          </tr>
          <tr className="tally-footer-row">
            <td colSpan={4} style={{ textAlign: 'right' }}>Closing Balance :</td>
            <td className="num">{drWithOp > crWithOp && closingBalance > 0 ? fmt(closingBalance) : ''}</td>
            <td className="num">{crWithOp > drWithOp && closingBalance > 0 ? fmt(closingBalance) : ''}</td>
          </tr>
        </tfoot>
      </table>

      {/* ═══════════════════ STYLES ═══════════════════ */}
      <style jsx>{`
        * { box-sizing: border-box; }

        .lt-wrap {
          background: #fff;
          width: 100%;
          font-family: 'Roboto', 'Arial', sans-serif;
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

        .logo-container {
          width: 75px;
          height: 75px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .right-logo {
          justify-content: flex-end;
          float: right;
        }
        .logo-img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        .header-svg {
          width: 100%;
          height: 100%;
        }
        .iso-border {
          width: 60px;
          border: 1.5pt solid #000;
          text-align: center;
        }
        .iso-q {
          font-size: 8pt;
          font-weight: 900;
          border-bottom: 1pt solid #000;
          background: #f0f0f0;
          padding: 1px 0;
          line-height: 1;
        }
        .iso-tuv-box {
          padding: 2px 0;
        }
        .iso-tuv {
          font-size: 14pt;
          font-weight: 900;
          line-height: 1;
        }
        .iso-sud {
          font-size: 9pt;
          font-weight: 900;
          line-height: 1;
        }
        .iso-std {
          font-size: 7pt;
          font-weight: 900;
          border-top: 1pt solid #000;
          padding: 1px 0;
          line-height: 1;
        }

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
        .w-vtype { width: 12%; }
        .w-vno   { width: 14%; }
        .w-amt   { width: 12%; text-align: right; }

        .lt-table td {
          padding: 2px 6px;
          vertical-align: top;
          font-size: 9pt;
        }
        .lt-table td.num {
          text-align: right;
          font-family: 'Roboto', 'Arial', sans-serif;
          font-size: 8.5pt;
        }

        .byto {
          display: inline-block;
          width: 22px;
          font-style: normal;
        }

        /* Tally Style Footer rows */
        .tally-footer-row td {
          padding-top: 4px;
          padding-bottom: 4px;
          font-weight: bold;
          font-family: 'Roboto', 'Arial', sans-serif;
          font-size: 8.5pt;
        }

        /* Keep totals together — no page break inside tfoot */
        @media print {
          tfoot { display: table-row-group; }
          .tally-footer-row {
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
