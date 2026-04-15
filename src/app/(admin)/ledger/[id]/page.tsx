'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { fetchLedgerEntries, resetLedgerState } from '@/redux/features/ledgerSlice';
import { fetchCustomers } from '@/redux/features/customerSlice';
import { fetchVendors } from '@/redux/features/vendorSlice';
import { fetchInvoices } from '@/redux/features/invoiceSlice';
import ModuleGuard from '@/components/ModuleGuard';
import Loader from '@/components/Loader';
import Link from 'next/link';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import LedgerPrintTemplate from '@/modules/ledger/components/LedgerPrintTemplate';

const reportRef = React.createRef<HTMLDivElement>();

export default function LedgerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  
  const [dateFrom, setDateFrom] = useState<string>(searchParams.get('dateFrom') || '');
  const [dateTo, setDateTo] = useState<string>(searchParams.get('dateTo') || '');

  const partyId = params.id as string;
  const [exporting, setExporting] = useState(false);
  const reportContainerRef = React.useRef<HTMLDivElement>(null);

  const { company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items: allEntries, loading, filters } = useSelector((state: RootState) => state.ledger);
  const { items: customers } = useSelector((state: RootState) => state.customers);
  const { items: vendors } = useSelector((state: RootState) => state.vendors);
  const { items: allInvoices } = useSelector((state: RootState) => state.invoices);

  // 1. Identify Party
  const party = useMemo(() => {
    const cust = customers.find(c => String(c.id) === String(partyId));
    if (cust) return { ...cust, partyType: 'customer' };
    const vend = vendors.find(v => String(v.id) === String(partyId));
    if (vend) return { ...vend, partyType: 'vendor' };
    return null;
  }, [customers, vendors, partyId]);

  useEffect(() => {
    if (activeCompany?.id) {
      dispatch(resetLedgerState());
      (dispatch as any)(fetchLedgerEntries({ partyId, companyId: activeCompany.id }));
      (dispatch as any)(fetchCustomers(activeCompany.id));
      (dispatch as any)(fetchVendors(activeCompany.id));
      (dispatch as any)(fetchInvoices(activeCompany.id));
    }
    
    return () => {
      dispatch(resetLedgerState());
    };
  }, [dispatch, activeCompany?.id, partyId]);

  const handleDownloadPDF = async () => {
    if (!reportContainerRef.current) return;
    setExporting(true);
    
    try {
        const element = reportContainerRef.current;
        const originalStyle = element.style.cssText;
        
        // Temporarily make it visible and properly sized for capture
        element.style.display = 'block';
        element.style.position = 'fixed';
        element.style.top = '0';
        element.style.left = '0';
        element.style.width = '210mm';
        element.style.zIndex = '-1';
        element.style.backgroundColor = 'white';
        element.style.visibility = 'visible';

        // Wait a small moment for the layout to calculate after setting display: block
        await new Promise(resolve => setTimeout(resolve, 100));

        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            windowWidth: 1000, 
            backgroundColor: '#ffffff'
        });

        // Restore original styles
        element.style.cssText = originalStyle;

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const imgHeight = (canvasHeight * pdfWidth) / canvasWidth;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
        pdf.save(`${(party?.name || 'Ledger').replace(/ /g, '_')}_Statement.pdf`);
        
        if (searchParams.get('export') === 'true') {
            setTimeout(() => router.back(), 1000);
        }
    } catch (err) {
        console.error('PDF export failed:', err);
    } finally {
        setExporting(false);
    }
  };

  useEffect(() => {
    if (searchParams.get('print') === 'true' && !loading && party && allEntries.length > 0) {
        const timer = setTimeout(() => {
            window.print();
        }, 1200); // 1.2s delay to ensure styles and data are fully rendered
        return () => clearTimeout(timer);
    }

    if (searchParams.get('export') === 'true' && !loading && party && allEntries.length > 0) {
        handleDownloadPDF();
    }
  }, [searchParams, loading, party, allEntries]);

  // 2. Process Ledger Calculations
  const { 
    processedEntries, 
    openingBalance, 
    totalDebit, 
    totalCredit, 
    closingBalance,
    isDebitOpening
  } = useMemo(() => {
    const isVendor = party?.partyType === 'vendor';
    
    const df = dateFrom || filters.dateFrom;
    const dt = dateTo || filters.dateTo;
    
    // 1. Calculate Opening Balance (from entries before dateFrom)
    let opBalance = 0;
    if (df) {
        const entriesBefore = allEntries.filter(e => new Date(e.date) < new Date(df));
        entriesBefore.forEach(e => {
            const amt = parseFloat(String(e.amount || 0));
            if (isVendor) {
                opBalance += (e.type === 'credit' ? amt : -amt);
            } else {
                opBalance += (e.type === 'debit' ? amt : -amt);
            }
        });
    }

    let runningBalance = opBalance;
    let periodDebitSum = 0;
    let periodCreditSum = 0;

    // Filter by date range
    const filtered = allEntries.filter(e => {
        if (df && new Date(e.date) < new Date(df)) return false;
        if (dt && new Date(e.date) > new Date(dt)) return false;
        return true;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Chronological for processing

    const mapped = filtered.map(e => {
        const amt = parseFloat(String(e.amount || 0));
        const isDebit = e.type === 'debit';
        const isCredit = e.type === 'credit';

        if (isDebit) periodDebitSum += amt;
        if (isCredit) periodCreditSum += amt;

        if (isVendor) {
            runningBalance += (isCredit ? amt : -amt);
        } else {
            runningBalance += (isDebit ? amt : -amt);
        }

        let vType = e.vchType;
        if (!vType) {
            const desc = e.description?.toLowerCase() || '';
            if (desc.includes('invoice')) vType = 'INVOICE';
            else if (desc.includes('payment') || desc.includes('receipt')) vType = 'PAYMENT';
            else if (desc.includes('dispatch') || desc.includes('outward')) vType = 'OUTWARD';
            else vType = 'JOURNAL';
        }

        return {
            ...e,
            vchType: vType,
            debitValue: isDebit ? amt : 0,
            creditValue: isCredit ? amt : 0,
            runningBalance
        };
    });

    const isDebitOp = isVendor ? opBalance < 0 : opBalance >= 0;

    return {
      processedEntries: [...mapped].reverse(), // UI shows newest first
      openingBalance: Math.abs(opBalance),
      isDebitOpening: opBalance !== 0 ? isDebitOp : (isVendor ? false : true),
      totalDebit: periodDebitSum,
      totalCredit: periodCreditSum,
      closingBalance: runningBalance
    };
  }, [allEntries, party, dateFrom, dateTo]);

  const handlePrint = () => { window.print(); };

  if (loading || (!party && !allEntries.length)) return <Loader text="Syncing Statement..." />;

  const isVendor = party?.partyType === 'vendor';

  return (
    <ModuleGuard moduleId="mod_ledger">
      <div className="container-fluid py-4 min-vh-100 bg-light-subtle px-4">
        
        {/* STATEMENT HEADER (Professional) */}
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 bg-white ledger-statement-header" style={{ borderLeftColor: isVendor ? '#6f42c1' : '#0d6efd' }}>
           <div className="card-body p-4 p-lg-5">
              <div className="d-flex justify-content-between align-items-start mb-5">
                 <div>
                    <div className="d-flex align-items-center gap-3 mb-2">
                        <Link href="/ledger" className="btn btn-sm btn-light rounded-circle hide-print"><i className="bi bi-chevron-left"></i></Link>
                        <h1 className="fw-900 mb-0 tracking-tight" style={{ color: 'var(--accent-color)' }}>GLOBUS ENGINEERING</h1>
                        {/* <span className={`badge rounded-pill px-3 py-2 ms-2 fw-bold ${isVendor ? 'bg-purple-subtle text-purple' : 'bg-primary-subtle text-primary'}`}>
                            {isVendor ? 'VENDOR / SUPPLIER' : 'CUSTOMER STATEMENT'}
                        </span> */}
                    </div>
                    <p className="text-muted small fw-bold text-capitalize tracking-widest mb-0 opacity-75">Professional Account Ledger Statement</p>
                 </div>
                  <div className="text-end hide-print">
                    <button onClick={handlePrint} className="btn btn-dark rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-2">
                        <i className="bi bi-printer-fill"></i> PRINT STATEMENT
                    </button>
                  </div>
              </div>

              <div className="row g-4 border-top pt-4">
                 <div className="col-md-5">
                    <span className="text-muted x-small fw-800 text-capitalize tracking-wider d-block mb-2">Account Holder</span>
                    <h3 className="fw-900 mb-1 text-dark">{party?.name || 'Loading Name...'}</h3>
                    {/* <p className="text-muted small mb-0 font-monospace">ID: {partyId}</p> */}
                    <p className="text-muted small mb-0">{party?.street1 || 'No address specified'}</p>
                 </div>
                 <div className="col-md-3 border-start">
                    <span className="text-muted x-small fw-800 text-capitalize tracking-wider d-block mb-2">Statement Period</span>
                    <div className="d-flex flex-column gap-1">
                        <input type="date" className="form-control form-control-sm border-0 bg-light hide-print mb-1" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                        <input type="date" className="form-control form-control-sm border-0 bg-light hide-print" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                        <span className="small fw-bold text-dark show-print-only">
                            {dateFrom || 'Start'} to {dateTo || 'Today'}
                        </span>
                    </div>
                 </div>
                 <div className="col-md-4 border-start text-end">
                    <div className="px-3">
                        <span className="text-muted x-small fw-800 text-capitalize tracking-wider d-block mb-2">Current Balance Status</span>
                        <h2 className={`fw-900 mb-0 ${closingBalance >= 0 ? 'text-success' : 'text-danger'}`} style={{ fontSize: '2.5rem' }}>
                            ₹ {Math.abs(closingBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            <small className="ms-2 fs-6 opacity-50">{closingBalance >= 0 ? (isVendor ? 'CR' : 'DR') : (isVendor ? 'DR' : 'CR')}</small>
                        </h2>
                        <span className="small fw-bold opacity-75">{closingBalance >= 0 ? (isVendor ? 'Payable Amount' : 'Receivable Amount') : (isVendor ? 'Adv Paid' : 'Excess Paid')}</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* SUMMARY TILES */}
        <div className="row g-4 mb-4 hide-print">
            <div className="col-md-4">
                <div className="card border-0 shadow-sm rounded-4 h-100 bg-white">
                    <div className="card-body p-4">
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <span className="text-muted x-small fw-800 text-capitalize tracking-wider mb-1 d-block">Total Debits (DR)</span>
                                <h4 className="fw-900 text-danger mb-0">₹ {totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h4>
                            </div>
                            <div className="bg-danger-subtle p-3 rounded-4"><i className="bi bi-dash-circle text-danger fs-4"></i></div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="col-md-4">
                <div className="card border-0 shadow-sm rounded-4 h-100 bg-white">
                    <div className="card-body p-4">
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <span className="text-muted x-small fw-800 text-capitalize tracking-wider mb-1 d-block">Total Credits (CR)</span>
                                <h4 className="fw-900 text-success mb-0">₹ {totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h4>
                            </div>
                            <div className="bg-success-subtle p-3 rounded-4"><i className="bi bi-plus-circle text-success fs-4"></i></div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="col-md-4">
                <div className="card border-0 shadow-sm rounded-4 h-100" style={{ backgroundColor: 'var(--accent-soft)' }}>
                    <div className="card-body p-4 text-center">
                         <span className="text-muted x-small fw-800 text-capitalize tracking-wider mb-1 d-block opacity-75">Total Ledger Records</span>
                         <h4 className="fw-900 mb-0" style={{ color: 'var(--accent-color)' }}>{processedEntries.length} Transactions</h4>
                    </div>
                </div>
            </div>
        </div>

         {/* LEDGER TABLE (Professional Design) */}
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white hide-print">
            <div className="table-responsive" style={{ minHeight: '600px' }}>
                <table className="table ledger-professional-table mb-0 align-middle">
                    <thead>
                        <tr>
                            <th className="ps-5 py-4 text-capitalize fw-800 x-small text-muted tracking-widest border-0">Date</th>
                            <th className="py-4 text-capitalize fw-800 x-small text-muted tracking-widest border-0" style={{ width: '35%' }}>Particulars (Transaction Details)</th>
                            <th className="py-4 text-capitalize fw-800 x-small text-muted tracking-widest border-0">Vch Type</th>
                            <th className="py-4 text-capitalize fw-800 x-small text-muted tracking-widest border-0">Vch No</th>
                            <th className="py-4 text-capitalize fw-800 x-small text-muted tracking-widest border-0 text-center">Status</th>
                            <th className="py-4 text-capitalize fw-800 x-small text-muted tracking-widest border-0 text-end">Debit (Dr)</th>
                            <th className="py-4 text-capitalize fw-800 x-small text-muted tracking-widest border-0 text-end">Credit (Cr)</th>
                            <th className="pe-5 py-4 text-capitalize fw-800 x-small text-muted tracking-widest border-0 text-end">Net Balance</th>
                        </tr>
                    </thead>
                    <tbody className="border-top-0">
                        {processedEntries.length === 0 && (
                            <tr><td colSpan={8} className="text-center py-5 text-muted">No transactions found for this period.</td></tr>
                        )}
                        {processedEntries.map((e, idx) => (
                            <tr key={e.id} className="ledger-row border-bottom border-light-subtle">
                                <td className="ps-5 py-3 small fw-bold text-muted">{new Date(e.date).toLocaleDateString()}</td>
                                <td className="py-3">
                                    <div className="fw-800 text-dark small text-capitalize" style={{ letterSpacing: '0.01em' }}>{e.description}</div>
                                    {/* <div className="x-small text-muted mt-1 opacity-75">{e.referenceNo || (e as any).referenceId || (e as any).reference_id ? `Ref: ${e.referenceNo || (e as any).referenceId || (e as any).reference_id}` : ''}</div> */}
                                </td>
                                <td className="py-3">
                                    <span className={`badge border py-2 px-3 fw-800 x-small text-capitalize tracking-wider rounded-pill shadow-none ${
                                        e.vchType === 'INVOICE' ? 'bg-primary-subtle text-primary border-primary-subtle' :
                                        (e.vchType === 'PAYMENT' || e.vchType === 'RECEIPT') ? 'bg-success-subtle text-success border-success-subtle' :
                                        e.vchType === 'OUTWARD' ? 'bg-purple-subtle text-purple border-purple-subtle' :
                                        'bg-light text-dark border-secondary-subtle'
                                    }`}>
                                        {e.vchType || 'JOURNAL'}
                                    </span>
                                </td>
                                <td className="py-3 small fw-bold text-muted font-monospace">{e.vchNo || '-'}</td>
                                <td className="py-3 text-center">
                                    {(() => {
                                      // DYNAMIC STATUS CHECK
                                      const linkedId = e.vchNo || e.referenceNo;
                                      const targetInv = allInvoices.find(inv => 
                                        String(inv.id) === String(linkedId) || 
                                        String(inv.invoiceNumber) === String(e.vchNo)
                                      );

                                      if (targetInv) {
                                        const isActuallyPaid = targetInv.status?.toLowerCase() === 'paid';
                                        return (
                                          <span className={`badge rounded-pill fw-900 x-small px-3 py-1 ${isActuallyPaid ? 'bg-success text-white' : 'bg-warning-subtle text-warning border border-warning-subtle'}`}>
                                            {isActuallyPaid ? 'PAID' : 'DUE'}
                                          </span>
                                        );
                                      }
                                      
                                      const isSettlement = isVendor ? e.debitValue > 0 : e.creditValue > 0;
                                      if (isSettlement) {
                                        return (
                                          <span className="badge rounded-pill fw-900 x-small px-3 py-1 bg-success text-white">
                                            {e.vchType === 'JOURNAL' ? 'ADJUSTED' : 'PAID'}
                                          </span>
                                        );
                                      }

                                      return (
                                        <span className="badge rounded-pill fw-900 x-small px-3 py-1 bg-warning-subtle text-warning border border-warning-subtle">
                                          DUE
                                        </span>
                                      );
                                    })()}
                                </td>
                                <td className={`py-3 text-end fw-bold ${e.debitValue > 0 ? 'text-danger' : 'text-light opacity-25'}`}>
                                    {e.debitValue > 0 ? e.debitValue.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
                                </td>
                                <td className={`py-3 text-end fw-bold ${e.creditValue > 0 ? 'text-success' : 'text-light opacity-25'}`}>
                                    {e.creditValue > 0 ? e.creditValue.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
                                </td>
                                <td className="pe-5 py-3 text-end fw-900 border-start bg-light bg-opacity-25" style={{ fontSize: '10.5pt' }}>
                                    ₹ {Math.abs(e.runningBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    <span className="ms-1 x-small opacity-50">{e.runningBalance >= 0 ? (isVendor ? 'Cr' : 'Dr') : (isVendor ? 'Dr' : 'Cr')}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* LEDGER PRINT VIEW (Standard Accounting Format) */}
        <div className="show-print-only" ref={reportContainerRef}>
            <LedgerPrintTemplate 
                party={party!} 
                entries={allEntries} 
                company={activeCompany} 
                dateFrom={dateFrom} 
                dateTo={dateTo} 
            />
        </div>

        <style jsx>{`
            .fw-900 { font-weight: 900; }
            .fw-800 { font-weight: 800; }
            .x-small { font-size: 0.70rem; }
            .bg-purple-subtle { background-color: #f3e8ff; }
            .text-purple { color: #6f42c1; }
            .border-purple-subtle { border-color: #e9d5ff !important; }
            .ledger-statement-header { border-left: 8px solid #0d6efd; }
            .ledger-professional-table th { background-color: #f8fafc; border-bottom: 2px solid #e2e8f0 !important; }
            .ledger-row:hover { background-color: #f7f9fc; }
            .show-print-only { display: none; }
            
            .ledger-print-table { border-collapse: collapse; font-family: 'Arial', sans-serif; font-size: 9pt; }
            .ledger-print-table th { font-weight: bold; border-color: #000 !important; }
            .ledger-print-table td { padding: 4px; vertical-align: top; }

            @media print {
                .hide-print { display: none !important; }
                .show-print-only { display: block !important; }
                body { padding: 0 !important; background: white !important; color: black !important; }
                .container-fluid { padding: 0 !important; }
                .card { border: none !important; box-shadow: none !important; border-radius: 0 !important; }
                .ledger-statement-header { display: none !important; }
                .bg-light-subtle { background-color: white !important; }
                .ledger-print-container { padding: 10mm; color: black; }
                .ledger-print-table { color: black !important; border-color: black !important; }
                .ledger-print-table th { background-color: transparent !important; color: black !important; }
                .table-responsive { overflow: visible !important; }
                @page { margin: 0.5cm; size: A4; }
                .border-dark { border-color: black !important; }
            }
        `}</style>
      </div>
    </ModuleGuard>
  );
}
