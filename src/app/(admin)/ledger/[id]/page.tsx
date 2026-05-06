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
import BackButton from '@/components/BackButton';
import LedgerPrintTemplate from '@/modules/ledger/components/LedgerPrintTemplate';
import PaginationComponent from '@/components/shared/Pagination';

export default function LedgerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  
  const [dateFrom, setDateFrom] = useState<string>(searchParams.get('dateFrom') || '');
  const [dateTo, setDateTo] = useState<string>(searchParams.get('dateTo') || '');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const partyId = params.id as string;
  const reportContainerRef = React.useRef<HTMLDivElement>(null);

  const { company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items: allEntries, loading, filters, error: ledgerError } = useSelector((state: RootState) => state.ledger);
  const { items: customers, loading: isCustomerLoading, error: customerError } = useSelector((state: RootState) => state.customers);
  const { items: vendors, loading: isVendorLoading, error: vendorError } = useSelector((state: RootState) => state.vendors);
  const { items: allInvoices } = useSelector((state: RootState) => state.invoices);

  // 1. Identify Party
  const party = useMemo(() => {
    const cust = customers.find(c => String(c.id) === String(partyId));
    if (cust) return { ...cust, partyType: 'customer' };
    const vend = vendors.find(v => String(v.id) === String(partyId));
    if (vend) return { ...vend, partyType: 'vendor' };
    
    // FALLBACK: If not found in master list but we have entries, 
    // we can still show a basic ledger using the name from the entries
    if (allEntries.length > 0) {
      const first = allEntries[0];
      return {
        id: partyId,
        name: first.partyName || 'Account Holder',
        street1: 'Address details unavailable in master list',
        partyType: first.partyType || 'customer'
      };
    }
    return null;
  }, [customers, vendors, partyId, allEntries]);

  useEffect(() => {
    if (activeCompany?.id) {
      (dispatch as any)(fetchLedgerEntries({ 
        partyId, 
        companyId: activeCompany.id,
        page: currentPage,
        limit: itemsPerPage,
        dateFrom: dateFrom || filters.dateFrom,
        dateTo: dateTo || filters.dateTo
      }));
      (dispatch as any)(fetchCustomers({ company_id: activeCompany.id, limit: 1000 }));
      (dispatch as any)(fetchVendors({ company_id: activeCompany.id, limit: 1000 }));
      (dispatch as any)(fetchInvoices({ company_id: activeCompany.id }));
    }
    
    return () => {
      dispatch(resetLedgerState());
    };
  }, [dispatch, activeCompany?.id, partyId, currentPage, itemsPerPage, dateFrom, dateTo, filters.dateFrom, filters.dateTo]);

  useEffect(() => {
    if (searchParams.get('print') === 'true' && !loading && party && allEntries.length > 0) {
        const timer = setTimeout(() => {
            window.print();
        }, 800); 
        return () => clearTimeout(timer);
    }
  }, [searchParams, loading, party, allEntries]);

  // 2. Process Ledger Calculations
  const { openingBalance: rawOpeningBalance, pagination: ledgerPagination } = useSelector((state: RootState) => state.ledger);

  const processedData = useMemo(() => {
    const isVendor = party?.partyType === 'vendor';
    
    // Use rawOpeningBalance from backend
    let opBalance = isVendor ? -rawOpeningBalance : rawOpeningBalance;

    let runningBalance = opBalance;
    let periodDebitSum = 0;
    let periodCreditSum = 0;

    const sortedForBalance = [...allEntries].sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateA !== dateB) return dateA - dateB;
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeA - timeB;
    });

    const mapped = sortedForBalance.map(e => {
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

        return {
            ...e,
            debitValue: isDebit ? amt : 0,
            creditValue: isCredit ? amt : 0,
            runningBalance
        };
    });

    const isDebitOp = isVendor ? opBalance < 0 : opBalance >= 0;

    return {
      processedEntries: [...mapped].reverse(), // Back to DESC for display
      openingBalance: Math.abs(opBalance),
      isDebitOpening: opBalance !== 0 ? isDebitOp : (isVendor ? false : true),
      totalDebit: periodDebitSum,
      totalCredit: periodCreditSum,
      closingBalance: runningBalance
    };
  }, [allEntries, party, rawOpeningBalance]);

  const { 
    processedEntries, 
    openingBalance, 
    totalDebit, 
    totalCredit, 
    closingBalance,
    isDebitOpening
  } = processedData;

  const totalPages = ledgerPagination.totalPages;
  const paginatedEntries = processedEntries;

  const handlePrint = () => { window.print(); };

  // Only show loader if we are actually fetching and don't have the party yet
  if ((loading || isCustomerLoading || isVendorLoading) && !party) {
    return <Loader text="Syncing Statement..." />;
  }

  // If loading is done and still no party, show error
  if (!party) {
    return (
      <div className="container-fluid py-5 text-center">
        <div className="alert alert-warning d-inline-block px-5 py-4 rounded-4 shadow-sm">
            <h2 className="text-warning-emphasis fw-bold mb-3"><i className="bi bi-exclamation-triangle-fill me-2"></i>Account Not Identified</h2>
            <p className="mb-0 text-muted">The ledger ID <strong>{partyId}</strong> was not found in your current company database.</p>
            {ledgerError && <div className="mt-3 text-danger small"><strong>Ledger Error:</strong> {ledgerError}</div>}
            {customerError && <div className="text-danger small"><strong>Customer Fetch Error:</strong> {customerError}</div>}
            {vendorError && <div className="text-danger small"><strong>Vendor Fetch Error:</strong> {vendorError}</div>}
            <div className="mt-4 d-flex gap-2 justify-content-center">
                <Link href="/ledger" className="btn btn-primary px-4 fw-bold rounded-pill shadow-sm">Back to Ledger</Link>
                <button onClick={() => window.location.reload()} className="btn btn-outline-secondary px-4 fw-bold rounded-pill">Retry Sync</button>
            </div>
        </div>
      </div>
    );
  }

  const isVendor = party?.partyType === 'vendor';

  return (
    <ModuleGuard moduleId="mod_ledger">
      <div className="container-fluid py-4 min-vh-100 bg-light-subtle px-4">
        
        {/* STATEMENT HEADER (Professional) */}
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 bg-white ledger-statement-header hide-print" style={{ borderLeftColor: isVendor ? '#6f42c1' : '#0d6efd' }}>
           <div className="card-body p-4 p-lg-5">
              <div className="d-flex justify-content-between align-items-start mb-5">
                 <div>
                    <div className="d-flex align-items-center gap-3 mb-2">
                        <BackButton href="/ledger" title="Back to Ledger" className="hide-print" />
                        <h1 className="fw-900 mb-0 tracking-tight" style={{ color: 'var(--accent-color)' }}>GLOBUS ENGINEERING</h1>
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
                    <h3 className="fw-900 mb-1 text-dark">{party?.name}</h3>
                    <p className="text-muted small mb-0">{party?.street1 || 'No address specified'}</p>
                 </div>
                 <div className="col-md-3 border-start">
                    <span className="text-muted x-small fw-800 text-capitalize tracking-wider d-block mb-2">Statement Period</span>
                    <div className="d-flex flex-column gap-1">
                        <input type="date" className="form-control form-control-sm border-0 bg-light hide-print mb-1" value={dateFrom} onChange={e => {setDateFrom(e.target.value); setCurrentPage(1);}} />
                        <input type="date" className="form-control form-control-sm border-0 bg-light hide-print" value={dateTo} onChange={e => {setDateTo(e.target.value); setCurrentPage(1);}} />
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
                        {paginatedEntries.length === 0 && (
                            <tr><td colSpan={8} className="text-center py-5 text-muted">No transactions found for this period.</td></tr>
                        )}
                        {paginatedEntries.map((e, idx) => (
                            <tr key={e.id} className="ledger-row border-bottom border-light-subtle">
                                <td className="ps-5 py-3 small fw-bold text-muted">{new Date(e.date).toLocaleDateString()}</td>
                                <td className="py-3">
                                    <div className="fw-800 text-dark small text-capitalize" style={{ letterSpacing: '0.01em' }}>{e.description}</div>
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
                                <td className="py-3 small fw-bold text-muted">{e.vchNo || '-'}</td>
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

        {/* PAGINATION UI */}
        {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-4 hide-print">
                <span className="text-muted small">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, ledgerPagination.totalItems)} of {ledgerPagination.totalItems} entries
                </span>
                <PaginationComponent 
                    currentPage={currentPage} 
                    totalPages={totalPages} 
                    onPageChange={(page) => setCurrentPage(page)} 
                />
            </div>
        )}

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

                /* Collapse the page shell — no height, no padding, no min-height */
                html, body {
                    height: auto !important;
                    min-height: 0 !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    background: white !important;
                    color: black !important;
                }
                .container-fluid {
                    padding: 0 !important;
                    margin: 0 !important;
                    height: auto !important;
                    min-height: 0 !important;
                }
                .min-vh-100 {
                    min-height: 0 !important;
                    height: auto !important;
                }
                .card { border: none !important; box-shadow: none !important; border-radius: 0 !important; }
                .ledger-statement-header { display: none !important; }
                .bg-light-subtle { background-color: white !important; }
                .ledger-print-container { padding: 10mm; color: black; }
                .ledger-print-table { color: black !important; border-color: black !important; }
                .ledger-print-table th { background-color: transparent !important; color: black !important; }
                .table-responsive { overflow: visible !important; }
                .border-dark { border-color: black !important; }
            }
        `}</style>
      </div>
    </ModuleGuard>
  );
}
