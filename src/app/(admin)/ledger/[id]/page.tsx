'use client';

import React, { useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { fetchLedgerEntries } from '@/redux/features/ledgerSlice';
import { fetchCustomers } from '@/redux/features/customerSlice';
import ModuleGuard from '@/components/ModuleGuard';
import Loader from '@/components/Loader';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function LedgerDetailPage() {
   const params = useParams();
   const router = useRouter();
   const dispatch = useDispatch();
   const partyId = params.id as string;

   const { company: activeCompany } = useSelector((state: RootState) => state.auth);
   const { items: allEntries, loading } = useSelector((state: RootState) => state.ledger);
   const { items: customers } = useSelector((state: RootState) => state.customers);

   const customer = customers.find(c => String(c.id) === String(partyId));

   useEffect(() => {
      if (activeCompany?.id) {
         (dispatch as any)(fetchLedgerEntries({ companyId: activeCompany.id }));
         (dispatch as any)(fetchCustomers(activeCompany.id));
      }
   }, [dispatch, activeCompany?.id, partyId]);

   const { statementEntries, finalBalance } = useMemo(() => {
      const partyEntries = (allEntries as any[])
         .filter((e: any) => {
            const isIdMatch = String(e.partyId || e.party_id || '').toLowerCase() === String(partyId).toLowerCase();
            const desc = (e.description || '').toLowerCase();
            const isMaterialPlaceholder = (desc.includes('material') || desc.includes('receipt')) && !desc.includes('payment') && !desc.includes('chq') && !desc.includes('vch');
            return isIdMatch && !isMaterialPlaceholder;
         })
         .sort((a: any, b: any) => {
            const dateA = new Date(a.createdAt || a.created_at || a.date).getTime();
            const dateB = new Date(b.createdAt || b.current_at || b.date).getTime();
            return dateA - dateB;
         });

      let runningBal = 0;
      const mapped = partyEntries.map((e: any) => {
         const type = (e.type || '').toUpperCase();
         const desc = (e.description || '').toLowerCase();
         
         // 1. ROBUST AMOUNT RETRIEVAL: Try all possible aliases
         const rawAmt = e.amount || e.grandTotal || e.total || e.grand_total || '0';
         const amt = parseFloat(String(rawAmt).replace(/[^\d.]/g, ''));
         
         const isDebit = type === 'DEBIT' || type === 'INVOICE' || desc.includes('inv');
         const isCredit = type === 'CREDIT' || type === 'RECEIPT' || desc.includes('payment') || desc.includes('chq') || desc.includes('vch') || desc.includes('paid');

         if (isDebit) runningBal += amt;
         else if (isCredit) runningBal -= amt;
         
         return {
            ...e,
            resolvedAmount: amt,
            balance: runningBal,
            isDebit,
            displayType: isDebit ? 'DEBIT' : (isCredit ? 'CREDIT' : (type || 'LEDGER'))
         };
      });

      const latestBalance = mapped.length > 0 ? mapped[mapped.length - 1].balance : 0;

      return {
         statementEntries: [...mapped].reverse(), // Newest at top
         finalBalance: latestBalance
      };
   }, [allEntries, partyId]);

   const handlePrint = () => window.print();

   return (
      <ModuleGuard moduleId="mod_ledger">
         <div className="container-fluid py-4 min-vh-100 animate-fade-in px-4" style={{ backgroundColor: '#f8f9fa' }}>
            
            {/* Unified Account Overview Card - EVERYTHING IN ONE CARD */}
            <div className="card bg-white border-0 shadow-sm p-4 px-lg-5 rounded-4 mb-4 mt-2">
               <div className="d-flex justify-content-between align-items-start mb-4">
                  <div className="d-flex align-items-center gap-3">
                     <button 
                        onClick={() => router.push('/ledger')} 
                        className="btn btn-link text-dark p-0 shadow-none hover-scale hide-print"
                     >
                        <i className="bi bi-arrow-left-circle" style={{ fontSize: '1.8rem' }}></i>
                     </button>
                     <div>
                        <h2 className="fw-bold mb-0 fs-2 text-dark tracking-tight">{customer?.name || 'Customer Statement'}</h2>
                        <p className="text-muted x-small mb-0 fw-bold text-uppercase tracking-wider">Financial Account Statement</p>
                     </div>
                  </div>
                  
                  <div className="hide-print">
                     <button onClick={handlePrint} className="btn btn-primary d-flex align-items-center gap-2">
                        <i className="bi bi-printer"></i>
                        <span>PRINT STATEMENT</span>
                     </button>
                  </div>
               </div>

               <div className="border-top pt-4">
                  <div className="d-flex gap-5 align-items-center">
                     <div>
                        <span className="text-muted text-uppercase x-small d-block fw-bold tracking-wider mb-1 opacity-75">Current Due Balance</span>
                        <span className={`fs-2 fw-900 ${finalBalance > 0 ? 'text-danger' : 'text-success'}`}>
                           ₹ {Math.abs(finalBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                           <small className="ms-2 fs-6 opacity-75">{finalBalance > 0 ? '(DR)' : '(CR)'}</small>
                        </span>
                     </div>
                     <div className="border-start ps-5 h-100 py-2">
                        <span className="text-muted text-uppercase x-small d-block fw-bold tracking-wider mb-1 opacity-75">Contact Address & Location</span>
                        <span className="fw-bold text-dark fs-5">{customer?.city || 'N/A'}, {customer?.state || '-'}</span>
                        <p className="text-muted small mb-0 mt-1">{customer?.street1 || 'No specific address details found.'}</p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Main Ledger Table */}
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
            <div className="table-responsive" style={{ minHeight: '400px', paddingBottom: '40px' }}>
               <table className="table table-hover align-middle mb-0">
                  <thead className="bg-light">
                     <tr className="small text-muted fw-bold text-uppercase border-bottom">
                        <th className="ps-4 py-3 border-0" style={{ width: '130px' }}>Entry Date</th>
                        <th className="py-3 border-0">Transaction Particulars</th>
                        <th className="py-3 border-0 text-end" style={{ width: '160px' }}>Debit (+)</th>
                        <th className="py-3 border-0 text-end" style={{ width: '160px' }}>Credit (-)</th>
                        <th className="py-3 border-0 text-end pe-4" style={{ width: '200px' }}>Running Balance</th>
                     </tr>
                  </thead>
                  <tbody>
                     {statementEntries.length === 0 ? (
                        <tr><td colSpan={5} className="text-center py-5">No records found.</td></tr>
                     ) : (
                        statementEntries.map((e: any, idx) => (
                           <tr key={idx} className="border-bottom border-light">
                              <td className="ps-4 py-3 small fw-bold text-dark">{new Date(e.date).toLocaleDateString()}</td>
                              <td className="py-3">
                                 <span className="d-block fw-bold text-dark small">{e.description}</span>
                                 <div className="text-muted x-small text-uppercase tracking-wider opacity-75">{e.displayType}</div>
                              </td>
                              <td className="py-3 text-end text-danger fw-bold small">
                                 {e.isDebit ? `₹ ${e.resolvedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                              </td>
                              <td className="py-3 text-end text-success fw-bold small">
                                 {!e.isDebit ? `₹ ${e.resolvedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                              </td>
                              <td className={`py-3 text-end pe-4 fw-900 ${e.balance > 0 ? 'text-danger' : 'text-success'}`} style={{ fontSize: '1rem' }}>
                                 ₹ {Math.abs(e.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                           </tr>
                        ))
                     )}
                  </tbody>
               </table>
            </div>
         </div>
 </div>
         <style jsx>{`
         .hide-print { @media print { display: none !important; } }
         .x-small { font-size: 0.7rem; }
      `}</style>
      </ModuleGuard>
   );
}
