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
         <div className="container-fluid py-4 bg-white min-vh-100">
            <div className="d-flex justify-content-between align-items-start mb-4 pb-3 border-bottom">
               <div>
                  <button onClick={() => router.back()} className="btn btn-sm text-muted p-0 mb-2 hide-print">
                     <i className="bi bi-arrow-left me-2"></i>Back
                  </button>
                  <h2 className="fw-bold mb-1">{customer?.name || 'Customer Statement'}</h2>
                  <div className="d-flex gap-4 align-items-center">
                     <div className="small border-end pe-4">
                        <span className="text-muted text-uppercase x-small d-block fw-bold">Balance Owed</span>
                        <span className="fs-3 fw-bold text-danger">₹ {finalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                     </div>
                     <div className="small">
                        <span className="text-muted text-uppercase x-small d-block fw-bold">Customer City</span>
                        <span className="fw-semibold text-dark">{customer?.city || 'N/A'}</span>
                     </div>
                  </div>
               </div>
               <div className="hide-print">
                  <button onClick={handlePrint} className="btn btn-dark fw-bold px-4 shadow-sm rounded-pill">
                     <i className="bi bi-printer me-2"></i>PRINT STATEMENT
                  </button>
               </div>
            </div>

            <div className="card border-0 shadow-sm rounded-4 overflow-hidden mt-4">
               <table className="table table-hover align-middle mb-0">
                  <thead className="bg-light">
                     <tr className="small text-muted fw-bold text-uppercase">
                        <th className="ps-4 py-3 border-0">Date</th>
                        <th className="py-3 border-0">Particulars</th>
                        <th className="py-3 border-0 text-end">Debit (+)</th>
                        <th className="py-3 border-0 text-end">Credit (-)</th>
                        <th className="py-3 border-0 text-end pe-4">Current Balance</th>
                     </tr>
                  </thead>
                  <tbody>
                     {statementEntries.length === 0 ? (
                        <tr><td colSpan={5} className="text-center py-5">No records found.</td></tr>
                     ) : (
                        statementEntries.map((e: any, idx) => (
                           <tr key={idx} className="border-bottom">
                              <td className="ps-4 py-3 small fw-bold">{new Date(e.date).toLocaleDateString()}</td>
                              <td className="py-3">
                                 <span className="d-block fw-bold text-dark small">{e.description}</span>
                                 <div className="small text-muted text-uppercase" style={{ fontSize: '10px' }}>{e.displayType}</div>
                              </td>
                              <td className="py-3 text-end text-danger fw-bold">
                                 {e.isDebit ? `₹ ${e.resolvedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                              </td>
                              <td className="py-3 text-end text-success fw-bold">
                                 {!e.isDebit ? `₹ ${e.resolvedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                              </td>
                              <td className="py-3 text-end pe-4 fw-bold text-primary">
                                 ₹ {e.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                           </tr>
                        ))
                     )}
                  </tbody>
               </table>
            </div>
         </div>
         <style jsx>{`
         .hide-print { @media print { display: none !important; } }
         .x-small { font-size: 0.7rem; }
      `}</style>
      </ModuleGuard>
   );
}
