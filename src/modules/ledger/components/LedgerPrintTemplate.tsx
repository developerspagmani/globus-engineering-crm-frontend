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

const ITEMS_PER_PAGE = 50; 

const LedgerPrintTemplate: React.FC<LedgerPrintTemplateProps> = ({ 
  party, 
  entries, 
  company, 
  dateFrom, 
  dateTo 
}) => {
  const { settings } = useSelector((state: RootState) => state.invoices);
  const isVendor = party?.partyType?.toLowerCase() === 'vendor';

  // 1. Core Accounting Logic
  const { 
    processedEntries, 
    openingBalance, 
    totalDebit, 
    totalCredit, 
    isDebitOpening 
  } = useMemo(() => {
    let opBalance = 0;
    if (dateFrom) {
        const entriesBefore = entries.filter(e => new Date(e.date) < new Date(dateFrom));
        entriesBefore.forEach(e => {
            const amt = parseFloat(String(e.amount || 0));
            if (isVendor) {
                opBalance += (e.type === 'credit' ? amt : -amt);
            } else {
                opBalance += (e.type === 'debit' ? amt : -amt);
            }
        });
    }

    const filtered = entries.filter(e => {
        if (dateFrom && new Date(e.date) < new Date(dateFrom)) return false;
        if (dateTo && new Date(e.date) > new Date(dateTo)) return false;
        return true;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = opBalance;
    let periodDebitSum = 0;
    let periodCreditSum = 0;

    const mapped = filtered.map(e => {
        const amt = parseFloat(String(e.amount || 0));
        const isDebit = e.type === 'debit';
        const isCredit = e.type === 'credit';
        if (isDebit) periodDebitSum += amt;
        if (isCredit) periodCreditSum += amt;
        
        if (isVendor) runningBalance += (isCredit ? amt : -amt);
        else runningBalance += (isDebit ? amt : -amt);

        let vType = e.vchType;
        if (!vType) {
            const desc = e.description?.toLowerCase() || '';
            if (desc.includes('invoice')) vType = 'GST Purchase';
            else if (desc.includes('payment') || desc.includes('receipt')) vType = 'Payment';
            else vType = 'Journal';
        }

        return {
            ...e,
            vchType: vType,
            debitValue: isDebit ? amt : 0,
            creditValue: isCredit ? amt : 0,
        };
    });

    const isDebitOp = isVendor ? opBalance < 0 : opBalance >= 0;

    return {
      processedEntries: mapped,
      openingBalance: Math.abs(opBalance),
      isDebitOpening: opBalance !== 0 ? isDebitOp : (isVendor ? false : true),
      totalDebit: periodDebitSum,
      totalCredit: periodCreditSum
    };
  }, [entries, party, dateFrom, dateTo, isVendor]);

  const allEntries = processedEntries;
  const drTotalWithOp = totalDebit + (isDebitOpening ? openingBalance : 0);
  const crTotalWithOp = totalCredit + (!isDebitOpening ? openingBalance : 0);
  const diff = drTotalWithOp - crTotalWithOp;

  const formatDate = (d: string) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-GB', { day: 'j-digit', month: 'short', year: '2-digit' } as any)
      .replace(/ /g, '-');
  };
  
  // Custom date formatting to match "1-Apr-25" (no leading zero on day if single digit)
  const formatLedgerDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = d.toLocaleString('en-GB', { month: 'short' });
    const year = d.getFullYear().toString().slice(-2);
    return `${day}-${month}-${year}`;
  };

  return (
    <div className="ledger-master-print-container" style={{ background: 'white' }}>
      <div className="ledger-page-box">
         {/* Header Section Matches Image */}
         <div className="print-header text-center" style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h1 style={{ fontSize: '15pt', fontWeight: 'bold', margin: '0 0 2px 0', textTransform: 'uppercase' }}>{party?.name || 'ACCOUNT NAME'}</h1>
              <p style={{ fontSize: '10pt', margin: '0 0 12px 0', lineHeight: '1.2' }}>{party?.street1 || ''} {party?.street2 || ''}<br />{party?.city || ''} {party?.state || ''} - {party?.pinCode || ''}</p>
              
              <h2 style={{ fontSize: '14pt', fontWeight: 'bold', margin: '0' }}>{company?.name || 'Globus Engineering Tools'}</h2>
              <h3 style={{ fontSize: '9pt', margin: '0', fontWeight: 'normal' }}>Ledger Account</h3>
              <p style={{ fontSize: '9pt', margin: '4px auto 10px auto', maxWidth: '80%', lineHeight: '1.2' }}>
                  {(company as any)?.address || 'No 24, Annaiyappan Street,\nSS Nagar, Nallampalayam, Ganapathy Post,\nCoimbatore'}
              </p>
              
              <p className="fw-bold" style={{ fontSize: '10pt', fontWeight: 'bold' }}>
                  {formatLedgerDate(dateFrom || '')} to {formatLedgerDate(dateTo || '2026-03-31')}
              </p>
         </div>

         <table className="ledger-print-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt', tableLayout: 'fixed', border: '1px solid black' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid black', backgroundColor: '#f5f5f5' }}>
                  <th style={{ textAlign: 'left', padding: '8px 6px', width: '12%', borderRight: '1px solid black' }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '8px 6px', width: '38%', borderRight: '1px solid black' }}>Particulars</th>
                  <th style={{ textAlign: 'left', padding: '8px 6px', width: '12%', borderRight: '1px solid black' }}>Vch Type</th>
                  <th style={{ textAlign: 'left', padding: '8px 6px', width: '12%', borderRight: '1px solid black' }}>Vch No.</th>
                  <th style={{ textAlign: 'right', padding: '8px 6px', width: '13%', borderRight: '1px solid black' }}>Debit</th>
                  <th style={{ textAlign: 'right', padding: '8px 6px', width: '13%' }}>Credit</th>
              </tr>
            </thead>
            <tbody>
              {/* Opening Balance */}
              <tr style={{ fontWeight: 'bold', borderBottom: '1px solid black' }}>
                <td style={{ padding: '6px', borderRight: '1px solid black' }}>{dateFrom ? formatLedgerDate(dateFrom) : ''}</td>
                <td style={{ padding: '6px', borderRight: '1px solid black' }}>
                    <span style={{ display: 'inline-block', width: '25px' }}>{isDebitOpening ? 'To' : 'By'}</span>
                    Opening Balance
                </td>
                <td style={{ borderRight: '1px solid black' }}></td>
                <td style={{ borderRight: '1px solid black' }}></td>
                <td style={{ textAlign: 'right', padding: '6px', borderRight: '1px solid black' }}>{isDebitOpening ? openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : ''}</td>
                <td style={{ textAlign: 'right', padding: '6px' }}>{!isDebitOpening ? openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : ''}</td>
              </tr>

              {/* Entry Rows */}
              {allEntries.map((e: any, idx: number) => (
                <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '6px', verticalAlign: 'top', borderRight: '1px solid black' }}>{formatLedgerDate(e.date)}</td>
                  <td style={{ padding: '6px', verticalAlign: 'top', borderRight: '1px solid black' }}>
                      <span style={{ display: 'inline-block', width: '25px', fontWeight: '500' }}>{e.debitValue > 0 ? 'To' : 'By'}</span>
                      {e.description}
                  </td>
                  <td style={{ padding: '6px', verticalAlign: 'top', borderRight: '1px solid black' }}>{e.vchType}</td>
                  <td style={{ padding: '6px', verticalAlign: 'top', borderRight: '1px solid black' }}>{e.vchNo || '-'}</td>
                  <td style={{ textAlign: 'right', padding: '6px', verticalAlign: 'top', borderRight: '1px solid black' }}>{e.debitValue > 0 ? e.debitValue.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : ''}</td>
                  <td style={{ textAlign: 'right', padding: '6px', verticalAlign: 'top' }}>{e.creditValue > 0 ? e.creditValue.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : ''}</td>
                </tr>
              ))}

              {/* Totals Section */}
              <tr style={{ borderTop: '1px solid black', backgroundColor: '#fafafa', fontWeight: 'bold' }}>
                  <td colSpan={4} style={{ borderRight: '1px solid black', padding: '6px' }}></td>
                  <td style={{ textAlign: 'right', padding: '6px', borderRight: '1px solid black' }}>{ drTotalWithOp.toLocaleString('en-IN', { minimumFractionDigits: 2 }) }</td>
                  <td style={{ textAlign: 'right', padding: '6px' }}>{ crTotalWithOp.toLocaleString('en-IN', { minimumFractionDigits: 2 }) }</td>
              </tr>
              <tr style={{ borderBottom: '1px solid black', fontWeight: 'bold' }}>
                  <td style={{ borderRight: '1px solid black' }}></td>
                  <td style={{ padding: '6px', borderRight: '1px solid black' }}>
                      <span style={{ display: 'inline-block', width: '25px' }}>{diff > 0 ? 'By' : 'To'}</span>
                      Closing Balance
                  </td>
                  <td style={{ borderRight: '1px solid black' }}></td>
                  <td style={{ borderRight: '1px solid black' }}></td>
                  <td style={{ textAlign: 'right', padding: '6px', borderRight: '1px solid black' }}>{diff < 0 ? Math.abs(diff).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : ''}</td>
                  <td style={{ textAlign: 'right', padding: '6px' }}>{diff > 0 ? Math.abs(diff).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : ''}</td>
              </tr>
              <tr style={{ borderBottom: '2px solid black', fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>
                  <td colSpan={4} style={{ borderRight: '1px solid black', padding: '8px 6px' }}>TOTAL</td>
                  <td style={{ textAlign: 'right', padding: '8px 6px', borderRight: '1px solid black' }}>{ Math.max(drTotalWithOp, crTotalWithOp).toLocaleString('en-IN', { minimumFractionDigits: 2 }) }</td>
                  <td style={{ textAlign: 'right', padding: '8px 6px' }}>{ Math.max(drTotalWithOp, crTotalWithOp).toLocaleString('en-IN', { minimumFractionDigits: 2 }) }</td>
              </tr>
            </tbody>
         </table>

         {/* Footer Section for Ledger */}
         <div className="ledger-footer-details mt-4 pt-3" style={{ fontSize: '8.5pt' }}>
             <div className="mt-4 text-center" style={{ fontWeight: 'bold', fontStyle: 'italic' }}>
                --- End of Ledger Account ---
             </div>
         </div>

      </div>
      
      <style jsx>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          .ledger-master-print-container { 
            background: white !important; 
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
          }
          .ledger-page-box { 
            box-shadow: none !important; 
            margin: 0 !important; 
            padding: 0 !important;
            width: 100% !important;
            box-sizing: border-box !important;
            background: white;
            color: black;
            font-family: Arial, sans-serif;
            height: auto !important;
            min-height: 0 !important;
          }
          /* Ensure table fits */
          .ledger-print-table {
            width: 100% !important;
            table-layout: fixed !important;
          }
        }
      `}</style>
    </div>
  );
};

export default LedgerPrintTemplate;
