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

   const [fromDate, setFromDate] = React.useState<string>('');
   const [toDate, setToDate] = React.useState<string>('');
   const [filterType, setFilterType] = React.useState<'ALL' | 'DEBIT' | 'CREDIT'>('ALL');
   const [showFilters, setShowFilters] = React.useState(false);

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

            // Apply Date Filter
            const entryDate = new Date(e.date || e.createdAt || e.created_at);
            if (fromDate && entryDate < new Date(fromDate)) return false;
            if (toDate && entryDate > new Date(toDate)) return false;

            return isIdMatch && !isMaterialPlaceholder;
         })
         .sort((a: any, b: any) => {
            const dateA = new Date(a.createdAt || a.created_at || a.date).getTime();
            const dateB = new Date(b.createdAt || b.current_at || b.date).getTime();
            return dateA - dateB;
         });

      let runningBal = 0;
      const mapped = partyEntries.map((e: any) => {
         const typeStr = (e.type || '').toUpperCase();
         const desc = (e.description || '').toLowerCase();

         // 1. Check for explicit database type first
         let isDebit = typeStr === 'DEBIT' || typeStr === 'INVOICE';
         let isCredit = typeStr === 'CREDIT' || typeStr === 'RECEIPT';

         // 2. Fallback to specific description scanning (for legacy or untyped data)
         if (!isDebit && !isCredit) {
            isDebit = desc.includes('invoice generated') || desc.includes('challan generated');
            isCredit = desc.includes('payment') || desc.includes('receipt') || desc.includes('chq') || desc.includes('vch') || desc.includes('paid');
         }

         // 3. ROBUST AMOUNT RETRIEVAL
         const rawAmt = e.amount || e.grandTotal || e.total || e.grand_total || '0';
         const amt = parseFloat(String(rawAmt).replace(/[^\d.]/g, ''));

         if (isDebit) runningBal += amt;
         else if (isCredit) runningBal -= amt;

         // Apply Type Filter (Filter for display, but keep original entries for balance calculation)
         if (filterType === 'DEBIT' && !isDebit) return null;
         if (filterType === 'CREDIT' && !isCredit) return null;

         // Extract Ref/Invoice No
         let refNo = '-';
         const rawRef = e.referenceId || e.reference_id || e.invoiceNo || e.invoice_no || '';
         const rawDesc = e.description || '';

         if (rawRef && String(rawRef).length >= 2) {
            const cleanVal = String(rawRef).replace(/[^\d]/g, '');
            refNo = cleanVal ? `#${cleanVal}` : '-';
         } else {
            // Flexible pattern: Keywords -> any non-digits -> the number
            const pattern = /(?:inv|invoice|ref|#|man)[^0-9]*(\d+)/i;
            const match = rawDesc.match(pattern);
            if (match) {
               refNo = `#${match[1]}`;
            }
         }

         return {
            ...e,
            resolvedAmount: amt,
            balance: runningBal,
            isDebit,
            refNo,
            displayType: isDebit ? 'DEBIT' : (isCredit ? 'CREDIT' : (typeStr || 'LEDGER'))
         };
      }).filter((item): item is any => item !== null);

      const latestBalance = mapped.length > 0 ? mapped[mapped.length - 1].balance : 0;

      return {
         statementEntries: [...mapped].reverse(), // Newest at top
         finalBalance: latestBalance
      };
   }, [allEntries, partyId, fromDate, toDate, filterType]);

   const handlePrint = () => {
      const printWindow = window.open('', '_blank', 'height=800,width=1000');
      if (!printWindow) return;

      const html = `
         <html>
            <head>
               <title>Ledger Statement - ${customer?.name || 'Customer'}</title>
               <style>
                  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 50px; color: #1e293b; line-height: 1.5; }
                  .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #0f172a; padding-bottom: 20px; margin-bottom: 40px; }
                  .company-info h1 { margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px; }
                  .company-info p { margin: 5px 0 0; font-size: 13px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
                  .statement-meta { text-align: right; }
                  .balance-box { background: #f8fafc; padding: 15px 25px; border-radius: 12px; border: 1px solid #e2e8f0; display: inline-block; margin-top: 10px; }
                  .balance-label { font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }
                  .balance-value { font-size: 24px; font-weight: 900; color: #0f172a; }
                  .customer-section { margin-bottom: 40px; }
                  .customer-section h2 { margin: 0; font-size: 18px; font-weight: 800; color: #0f172a; }
                  .customer-section p { margin: 5px 0 0; color: #64748b; font-size: 14px; }
                  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                  th { background: #0f172a; color: white; text-align: left; padding: 12px 15px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
                  td { padding: 12px 15px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #334155; }
                  .text-end { text-align: right; }
                  .text-center { text-align: center; }
                  .fw-bold { font-weight: 700; }
                  .text-danger { color: #dc2626; }
                  .text-success { color: #16a34a; }
                  @media print { body { padding: 20px; } .balance-box { border: 1px solid #ddd; } }
               </style>
            </head>
            <body>
               <div class="header">
                  <div class="company-info">
                     <h1>GLOBUS ENGINEERING</h1>
                     <p>Financial Statement Account</p>
                  </div>
                  <div class="statement-meta">
                     <div class="balance-box">
                        <div class="balance-label">Statement Balance</div>
                        <div class="balance-value">INR ${Math.abs(finalBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                     </div>
                  </div>
               </div>

               <div class="customer-section">
                  <h2>${customer?.name || 'Customer Statement'}</h2>
                  <p>${customer?.city || ''}, ${customer?.state || ''}</p>
                  <p style="font-size: 12px; margin-top: 10px;">Statement Date: ${new Date().toLocaleDateString()}</p>
               </div>

               <table>
                  <thead>
                     <tr>
                        <th>Date</th>
                        <th>Ref / Invoice No</th>
                        <th class="text-center">Type</th>
                        <th class="text-end">Debit (+)</th>
                        <th class="text-end">Credit (-)</th>
                        <th class="text-end">Balance</th>
                     </tr>
                  </thead>
                  <tbody>
                     ${statementEntries.map(e => `
                        <tr>
                           <td>${new Date(e.date).toLocaleDateString()}</td>
                           <td class="fw-bold">${e.refNo || '—'}</td>
                           <td class="text-center font-monospace" style="font-size: 11px; font-weight: 800;">${String(e.displayType).toUpperCase()}</td>
                           <td class="text-end fw-bold ${e.isDebit ? 'text-danger' : ''}">${e.isDebit ? '₹' + e.resolvedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}</td>
                           <td class="text-end fw-bold ${!e.isDebit ? 'text-success' : ''}">${!e.isDebit ? '₹' + e.resolvedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}</td>
                           <td class="text-end fw-bold" style="background: #fdfdfe;">₹${Math.abs(e.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                     `).join('')}
                  </tbody>
               </table>
            </body>
         </html>
      `;

      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
   };

   return (
      <>
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
                  <div className="d-flex align-items-center">
                     {/* Section 1: Balance */}
                     <div className="pe-5" style={{ minWidth: '220px' }}>
                        <span className="text-muted text-uppercase x-small d-block fw-bold tracking-wider mb-1 opacity-75">Current Due Balance</span>
                        <span className={`fs-2 fw-900 ${finalBalance > 0 ? 'text-danger' : 'text-success'}`}>
                           ₹ {Math.abs(finalBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                           <small className="ms-2 fs-6 opacity-75">{finalBalance > 0 ? '(DR)' : '(CR)'}</small>
                        </span>
                     </div>

                     {/* Section 2: Location */}
                     <div className="border-start ps-5 pe-5 flex-grow-1">
                        <span className="text-muted text-uppercase x-small d-block fw-bold tracking-wider mb-1 opacity-75">Contact Address & Location</span>
                        <span className="fw-bold text-dark fs-5">{customer?.city || 'N/A'}, {customer?.state || '-'}</span>
                        <p className="text-muted small mb-0 mt-1">{customer?.street1 || 'No specific address details found.'}</p>
                     </div>

                     {/* Section 3: Filters (Orange Pill) */}
                     <div className="border-start ps-5 h-100 d-flex align-items-center">
                        <button
                           onClick={() => setShowFilters(!showFilters)}
                           className={`btn rounded-pill px-4 py-2 fw-bold text-uppercase d-flex align-items-center gap-2 border-2 transition-all shadow-sm ${showFilters ? 'btn-dark' : 'btn-primary'}`}
                           style={{
                              fontSize: '12px',
                              letterSpacing: '1px',
                              backgroundColor: !showFilters ? '#ff5722' : '#ff5722',
                              borderColor: !showFilters ? '#ff5722' : '#ff5722'
                           }}
                        >
                           <i className={`bi ${showFilters ? 'bi-x-lg' : 'bi-funnel'}`} style={{ fontSize: '0.9rem' }}></i>
                           {showFilters ? 'Close' : 'Filters'}
                        </button>
                     </div>
                  </div>
               </div>
            </div>

            {/* Collapsible Filter Bar - High-Fidelity UI */}
            {showFilters && (
               <div className="card bg-white border border-light-subtle shadow-sm px-4 py-3 rounded-4 mb-4 animate-fade-in hide-print position-relative">
                  <div className="d-flex align-items-stretch justify-content-between" style={{ minHeight: '60px' }}>
                     <div className="d-flex align-items-center flex-grow-1">
                        
                        {/* FROM SECTION */}
                        <div className="me-2 text-start">
                           <label className="d-block fw-800 text-muted mb-1" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>FROM</label>
                           <input
                              type="date"
                              className="form-control form-control-sm border border-secondary border-opacity-25 px-3 fw-600 rounded-3 text-dark"
                              value={fromDate}
                              onChange={(e) => setFromDate(e.target.value)}
                              style={{ width: '150px', height: '42px', backgroundColor: '#f9f9f5' }}
                           />
                        </div>

                        <div className="mx-2 mt-4 text-muted opacity-50 fw-bold">—</div>

                        {/* TO SECTION */}
                        <div className="mx-2 ps-2 pe-4 border-end d-flex flex-column justify-content-center">
                           <label className="d-block fw-800 text-muted mb-1" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>TO</label>
                           <input
                              type="date"
                              className="form-control form-control-sm border border-secondary border-opacity-25 px-3 fw-600 rounded-3 text-dark"
                              value={toDate}
                              onChange={(e) => setToDate(e.target.value)}
                              style={{ width: '150px', height: '42px', backgroundColor: '#f9f9f5' }}
                           />
                        </div>

                        {/* TYPE SECTION (PILLS) */}
                        <div className="mx-4 pe-4 border-end d-flex flex-column justify-content-center">
                           <label className="d-block fw-800 text-muted mb-1" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>TYPE</label>
                           <div className="d-flex gap-2">
                              <button
                                 onClick={() => setFilterType('ALL')}
                                 className={`btn btn-sm px-3 rounded-3 fw-bold transition-all shadow-none ${filterType === 'ALL' ? 'bg-dark text-white shadow-sm' : 'border border-secondary border-opacity-25 text-dark'}`}
                                 style={{ height: '38px', minWidth: '55px', backgroundColor: filterType === 'ALL' ? '#1a1a1a' : 'transparent' }}
                              >
                                 All
                              </button>
                              <button
                                 onClick={() => setFilterType('DEBIT')}
                                 className={`btn btn-sm px-3 rounded-3 fw-bold transition-all shadow-none ${filterType === 'DEBIT' ? 'bg-dark text-white shadow-sm' : 'border border-secondary border-opacity-25 text-dark'}`}
                                 style={{ height: '38px', minWidth: '65px', backgroundColor: filterType === 'DEBIT' ? '#1a1a1a' : 'transparent' }}
                              >
                                 Debit
                              </button>
                              <button
                                 onClick={() => setFilterType('CREDIT')}
                                 className={`btn btn-sm px-3 rounded-3 fw-bold transition-all shadow-none ${filterType === 'CREDIT' ? 'bg-dark text-white shadow-sm' : 'border border-secondary border-opacity-25 text-dark'}`}
                                 style={{ height: '38px', minWidth: '65px', backgroundColor: filterType === 'CREDIT' ? '#1a1a1a' : 'transparent' }}
                              >
                                 Credit
                              </button>
                           </div>
                        </div>

                        {/* RESULTS BADGE */}
                        <div className="ms-3 d-flex align-items-center">
                           <div className="d-flex align-items-center border border-secondary border-opacity-10 px-2 py-2 rounded-4" style={{ backgroundColor: '#f5f5f0' }}>
                              <i className="bi bi-info-circle text-dark me-2 small"></i>
                              <span className="fw-800 text-dark small" style={{ fontSize: '13px' }}>{statementEntries.length} results</span>
                           </div>
                        </div>
                     </div>

                     {/* RESET BUTTON */}
                     <div className="ms-4 ps-4 border-start d-flex align-items-center">
                        <button
                           onClick={() => { setFromDate(''); setToDate(''); setFilterType('ALL'); }}
                           className="btn btn-outline-dark btn-sm rounded-pill px-4 fw-800 transition-all shadow-none border-secondary border-opacity-25"
                           style={{ fontSize: '11px', height: '38px', letterSpacing: '0.5px' }}
                        >
                           RESET
                        </button>
                     </div>
                  </div>
               </div>
            )}

            {/* Main Ledger Table */}
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
               <div className="table-responsive" style={{ minHeight: '400px', paddingBottom: '40px' }}>
                  <table className="table table-hover align-middle mb-0">
                     <thead className="bg-light">
                        <tr className="small text-muted fw-bold text-uppercase border-bottom">
                           <th className="ps-4 py-3 border-0" style={{ width: '12%' }}>Date</th>
                           <th className="py-3 border-0 text-center" style={{ width: '15%' }}>Ref No</th>
                           <th className="py-3 border-0 text-center" style={{ width: '10%' }}>Type</th>
                           <th className="py-3 border-0 text-end" style={{ width: '21%' }}>Debit (+)</th>
                           <th className="py-3 border-0 text-end" style={{ width: '21%' }}>Credit (-)</th>
                           <th className="py-3 border-0 text-end pe-4" style={{ width: '21%' }}>Balance</th>
                        </tr>
                     </thead>
                     <tbody>
                        {statementEntries.length === 0 ? (
                           <tr><td colSpan={5} className="text-center py-5">No records found.</td></tr>
                        ) : (
                           statementEntries.map((e: any, idx) => (
                              <tr key={idx} className="border-bottom border-light">
                                 <td className="ps-4 py-3 small fw-bold text-dark">{new Date(e.date).toLocaleDateString()}</td>
                                 <td className="py-3 text-center small fw-bold text-primary">{e.refNo || '-'}</td>
                                 <td className="py-3 text-center">
                                    <span className={`badge ${e.isDebit ? 'bg-danger' : 'bg-success'} bg-opacity-10 ${e.isDebit ? 'text-danger' : 'text-success'} xx-small fw-800 tracking-wider`}>
                                       {e.displayType}
                                    </span>
                                 </td>
                                 <td className="py-3 text-end text-danger fw-bold small">
                                    {e.isDebit ? `₹ ${e.resolvedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                                 </td>
                                 <td className="py-3 text-end text-success fw-bold small">
                                    {!e.isDebit ? `₹ ${e.resolvedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
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
               <style jsx>{`
               .hide-print { @media print { display : none !important; } }
               .x-small { font-size: 0.75rem; }
               .xx-small { font-size: 0.65rem; }
               .fw-900 { font-weight: 900; }
               .fw-800 { font-weight: 800; }
               `}</style>
            </div>
         </ModuleGuard>
      </>
   );
}
