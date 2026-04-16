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

const ITEMS_PER_PAGE = 35; 

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

  const chunkEntries = (items: any[], size: number) => {
    const chunks = [];
    for (let i = 0; i < items.length; i += size) {
      chunks.push(items.slice(i, i + size));
    }
    return chunks.length > 0 ? chunks : [[]];
  };

  const pages = chunkEntries(processedEntries, ITEMS_PER_PAGE);
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
      {pages.map((pageEntries, pageIdx) => (
        <div key={pageIdx} className="ledger-page-box" style={{ 
            width: '198mm', 
            margin: '0 auto', 
            background: 'white', 
            padding: '10mm', 
            boxSizing: 'border-box',
            position: 'relative',
            color: 'black',
            fontFamily: 'Arial, sans-serif'
        }}>
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

           <table className="ledger-print-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt', tableLayout: 'fixed' }}>
              <thead>
                <tr style={{ borderTop: '0.8pt solid black', borderBottom: '0.8pt solid black' }}>
                    <th style={{ textAlign: 'left', padding: '10px 4px', width: '13%' }}>Date</th>
                    <th style={{ textAlign: 'left', padding: '10px 4px', width: '37%' }}>Particulars</th>
                    <th style={{ textAlign: 'left', padding: '10px 4px', width: '14%' }}>Vch Type</th>
                    <th style={{ textAlign: 'left', padding: '10px 4px', width: '10%' }}>Vch No.</th>
                    <th style={{ textAlign: 'right', padding: '10px 4px', width: '13%' }}>Debit</th>
                    <th style={{ textAlign: 'right', padding: '10px 4px', width: '13%' }}>Credit</th>
                </tr>
              </thead>
              <tbody>
                {/* Opening Balance (Only Page 1) */}
                {pageIdx === 0 && (
                  <tr style={{ fontWeight: 'bold' }}>
                    <td style={{ padding: '8px 4px' }}>{dateFrom ? formatLedgerDate(dateFrom) : ''}</td>
                    <td style={{ padding: '8px 4px' }}>{isDebitOpening ? 'To ' : 'By '} Opening Balance</td>
                    <td></td>
                    <td></td>
                    <td style={{ textAlign: 'right', padding: '8px 4px' }}>{isDebitOpening ? openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : ''}</td>
                    <td style={{ textAlign: 'right', padding: '8px 4px' }}>{!isDebitOpening ? openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : ''}</td>
                  </tr>
                )}

                {/* Entry Rows */}
                {pageEntries.map((e: any, idx: number) => (
                  <tr key={idx}>
                    <td style={{ padding: '4px', verticalAlign: 'top' }}>{formatLedgerDate(e.date)}</td>
                    <td style={{ padding: '4px', verticalAlign: 'top' }}>
                        <span style={{ display: 'inline-block', width: '25px' }}>{e.debitValue > 0 ? 'To' : 'By'}</span>
                        {e.description}
                    </td>
                    <td style={{ padding: '4px', verticalAlign: 'top' }}>{e.vchType}</td>
                    <td style={{ padding: '4px', verticalAlign: 'top' }}>{e.vchNo || '-'}</td>
                    <td style={{ textAlign: 'right', padding: '4px', verticalAlign: 'top' }}>{e.debitValue > 0 ? e.debitValue.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : ''}</td>
                    <td style={{ textAlign: 'right', padding: '4px', verticalAlign: 'top' }}>{e.creditValue > 0 ? e.creditValue.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : ''}</td>
                  </tr>
                ))}

                {/* Totals Section (Only Page LAST) */}
                {pageIdx === pages.length - 1 && (
                  <>
                    <tr style={{ borderTop: '0.8pt solid black' }}>
                        <td colSpan={4}></td>
                        <td style={{ textAlign: 'right', padding: '6px 4px', fontWeight: 'bold' }}>{ drTotalWithOp.toLocaleString('en-IN', { minimumFractionDigits: 2 }) }</td>
                        <td style={{ textAlign: 'right', padding: '6px 4px', fontWeight: 'bold' }}>{ crTotalWithOp.toLocaleString('en-IN', { minimumFractionDigits: 2 }) }</td>
                    </tr>
                    <tr>
                        <td></td>
                        <td style={{ padding: '6px 4px', fontWeight: 'bold' }}>
                            <span style={{ display: 'inline-block', width: '25px' }}>{diff > 0 ? 'By' : 'To'}</span>
                            Closing Balance
                        </td>
                        <td></td>
                        <td></td>
                        <td style={{ textAlign: 'right', padding: '6px 4px', fontWeight: 'bold' }}>{diff < 0 ? Math.abs(diff).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : ''}</td>
                        <td style={{ textAlign: 'right', padding: '6px 4px', fontWeight: 'bold' }}>{diff > 0 ? Math.abs(diff).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : ''}</td>
                    </tr>
                    <tr style={{ borderTop: '0.8pt solid black', borderBottom: '0.8pt solid black', fontWeight: 'bold' }}>
                        <td colSpan={4}></td>
                        <td style={{ textAlign: 'right', padding: '6px 4px' }}>{ Math.max(drTotalWithOp, crTotalWithOp).toLocaleString('en-IN', { minimumFractionDigits: 2 }) }</td>
                        <td style={{ textAlign: 'right', padding: '6px 4px' }}>{ Math.max(drTotalWithOp, crTotalWithOp).toLocaleString('en-IN', { minimumFractionDigits: 2 }) }</td>
                    </tr>
                    {/* Double line at the very bottom as seen in accounting */}
                    <tr style={{ borderTop: '0.5pt solid black' }}><td colSpan={6} style={{ height: '1px', padding: '0' }}></td></tr>
                  </>
                )}
              </tbody>
           </table>

           {/* Footer Section for Ledger - only on last page */}
           {pageIdx === pages.length - 1 && (
             <div className="ledger-footer-details mt-4 border-top pt-3" style={{ fontSize: '8.5pt' }}>
                 <div className="mt-4 text-center" style={{ fontWeight: 'bold', fontStyle: 'italic' }}>
                    --- End of Ledger Account ---
                 </div>
             </div>
           )}

           <div style={{ position: 'absolute', bottom: '10mm', right: '10mm', fontSize: '10pt', fontWeight: 'bold' }}>
                Page {pageIdx + 1}
           </div>
        </div>
      ))}
      
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
          }
          .ledger-page-box { 
            box-shadow: none !important; 
            margin: 0 !important; 
            padding: 0 !important;
            width: 100% !important;
            break-after: page !important;
            page-break-after: always !important;
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
