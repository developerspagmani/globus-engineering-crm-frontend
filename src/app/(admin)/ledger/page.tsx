'use client';

import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Link from 'next/link';
import { RootState } from '@/redux/store';
import { fetchLedgerEntries, addLedgerEntry, setLedgerFilters } from '@/redux/features/ledgerSlice';
import { fetchCustomers } from '@/redux/features/customerSlice';
import ModuleGuard from '@/components/ModuleGuard';
import Loader from '@/components/Loader';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function LedgerPage() {
  const dispatch = useDispatch();
  const { company: activeCompany, user: currentUser } = useSelector((state: RootState) => state.auth);
  console.log('[LEDGER FRONTEND DEBUG] Current Auth State (User/Company):', { currentUser, activeCompany });
  const { items: ledgerEntries, loading: ledgerLoading, filters } = useSelector((state: RootState) => state.ledger);
  const { items: customers } = useSelector((state: RootState) => state.customers);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);
  const [currentPage, setCurrentPage] = React.useState(1);

  useEffect(() => {
    console.log('[LEDGER FRONTEND DEBUG] Active Company:', activeCompany?.id, activeCompany?.name);
    if (activeCompany?.id) {
       (dispatch as any)(fetchLedgerEntries({ companyId: activeCompany.id }));
       (dispatch as any)(fetchCustomers(activeCompany.id));
    }
  }, [dispatch, activeCompany?.id]);

  // DERIVE UNIQUE PARTIES FROM LEDGER ENTRIES
  const uniqueParties = React.useMemo(() => {
    const partyMap = new Map();
    const currentCompId = String(activeCompany?.id || '').toLowerCase();

    // 1. Filter ledger entries that belong to this company ID (Case Insensitive) and match date filters
    const companyLedger = ledgerEntries.filter(e => {
        const matchesCompany = String(e.company_id || (e as any).companyId || '').toLowerCase() === currentCompId;
        if (!matchesCompany) return false;

        if (filters.dateFrom && e.date && new Date(e.date) < new Date(filters.dateFrom)) return false;
        if (filters.dateTo && e.date && new Date(e.date) > new Date(filters.dateTo)) return false;
        
        return true;
    });

    companyLedger.forEach(entry => {
      const entryPartyId = String(entry.partyId || '').toLowerCase();
      if (!partyMap.has(entryPartyId)) {
        // Find matching customer data for address
        const customerRef = customers.find(c => 
           String(c.id).toLowerCase() === entryPartyId
        );
        
        // Even if customer metadata is missing, we show the name from the ledger entry
        partyMap.set(entryPartyId, {
          id: entry.partyId,
          name: entry.partyName || customerRef?.name || 'Unknown',
          street1: customerRef?.street1 || 'Address not specified',
          street2: customerRef?.street2 || '',
          city: customerRef?.city || '-',
          state: customerRef?.state || '-',
          lastUpdated: entry.date
        });
      }
    });
    
    const result = Array.from(partyMap.values());
    console.log('[LEDGER FRONTEND DEBUG] Unique Parties Calculated:', result);
    return result;
  }, [ledgerEntries, customers, activeCompany?.id, filters.dateFrom, filters.dateTo]);

  const filteredItems = uniqueParties.filter(item => {
    return (item.name || '').toLowerCase().includes(filters.search.toLowerCase()) ||
           (item.city || '').toLowerCase().includes(filters.search.toLowerCase()) ||
           (item.state || '').toLowerCase().includes(filters.search.toLowerCase());
  });

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // --- EXPORT ACTIONS ---
  const handlePrint = () => {
    const table = document.querySelector('table');
    if (!table) return;

    // Clone and cleanup
    const printTable = table.cloneNode(true) as HTMLTableElement;
    const headerRow = printTable.querySelector('thead tr');
    if (headerRow) {
      const lastTh = headerRow.querySelector('th:last-child');
      if (lastTh) lastTh.remove();
    }
    const bodyRows = printTable.querySelectorAll('tbody tr');
    bodyRows.forEach(row => {
      const lastTd = row.querySelector('td:last-child');
      if (lastTd) lastTd.remove();
    });

    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return;

    printWindow.document.write('<html><head><title>Ledger Export</title>');
    printWindow.document.write('<style>table {width:100%; border-collapse: collapse; font-family: "Roboto", sans-serif;} th, td {border: 1px solid #ddd; padding: 10px; text-align: left;} th {background-color: #f2f2f2;} .text-uppercase {text-transform: uppercase;}</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write('<h2 style="text-align: center;">Globus Engineering CRM - Ledger Report</h2>');
    printWindow.document.write(printTable.outerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const table = document.querySelector('table');
    if (!table) return;

    const headers = Array.from(table.querySelectorAll('thead th')).slice(0, -1).map(h => (h as HTMLElement).innerText.trim());
    const data = Array.from(table.querySelectorAll('tbody tr')).map(row => {
      return Array.from(row.querySelectorAll('td')).slice(0, -1).map(td => (td as HTMLElement).innerText.trim());
    });

    doc.text("Globus Engineering CRM - Ledger Report", 14, 15);
    autoTable(doc, {
      head: [headers],
      body: data,
      startY: 20,
      theme: 'grid',
      headStyles: { fillColor: [0, 188, 212] },
    });

    doc.save(`ledger_export_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <ModuleGuard moduleId="mod_ledger">
      <div className="container-fluid py-4 min-vh-100 bg-white">
        {/* Header Section */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold mb-1">Ledger Report</h2>
            <p className="text-muted small mb-0">Total parties with transactions: {uniqueParties.length}</p>
          </div>
          <div className="d-flex gap-2 hide-print">
            <Link 
              href="/ledger/new"
              className="btn btn-primary d-flex align-items-center gap-2 px-4 shadow-sm" 
              style={{ backgroundColor: '#ff4081', border: 'none' }}
            >
              <i className="bi bi-plus-lg"></i>
              <span className="fw-bold text-uppercase small">Add Ledger</span>
            </Link>
          </div>
        </div>

        {/* Action Button Group */}
        <div className="card border-0 mb-4">
           <div className="card-body p-0">
             <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center flex-grow-1">
                   <div className="position-relative" style={{ minWidth: '350px' }}>
                     <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                     <input 
                         type="text" 
                         className="form-control ps-5 py-2 border-0 bg-white shadow-sm" 
                         placeholder="SEARCH FOR PARTY, CITY OR STATE..." 
                         style={{ borderRadius: '4px', border: '1px solid #e0e0e0 !important' }}
                         value={filters.search}
                         onChange={(e) => dispatch(setLedgerFilters({ search: e.target.value }))}
                     />
                   </div>
                </div>
                
                <div className="d-flex align-items-center gap-3">
                   {/* Date Filters Moved to Right Corner */}
                   <div className="d-flex align-items-center gap-2 bg-white px-3 py-1 shadow-sm border" style={{ borderRadius: '4px', borderColor: '#e0e0e0' }}>
                     <input 
                       type="date" 
                       className="form-control py-1 border-0 shadow-none bg-transparent" 
                       value={filters.dateFrom}
                       onChange={(e) => dispatch(setLedgerFilters({ dateFrom: e.target.value }))}
                       style={{ width: '135px', fontSize: '0.85rem' }}
                     />
                     <span className="text-muted small fw-bold mx-1">TO</span>
                     <input 
                       type="date" 
                       className="form-control py-1 border-0 shadow-none bg-transparent" 
                       value={filters.dateTo}
                       onChange={(e) => dispatch(setLedgerFilters({ dateTo: e.target.value }))}
                       style={{ width: '135px', fontSize: '0.85rem' }}
                     />
                   </div>

                   <div className="d-flex gap-1 hide-print flex-wrap">
                      <button onClick={handlePrint} className="btn btn-sm fw-bold px-3 py-2 rounded-0 text-white shadow-sm" style={{ backgroundColor: '#3B82F6', borderColor: '#3B82F6' }}><i className="bi bi-printer fw-bold"></i> PRINT</button>
                      <button onClick={handleExportPDF} className="btn btn-sm fw-bold px-3 py-2 rounded-0 text-white shadow-sm" style={{ backgroundColor: '#ff9800', borderColor: '#ff9800' }}><i className="bi bi-file-earmark-pdf fw-bold"></i> PDF</button>
                   </div>
                </div>
             </div>
           </div>
        </div>

        {/* Exact Table Layout requested by user - DYNAMICALLY POPULATED FROM LEDGER */}
        <div className="card border-0 shadow-sm rounded-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr className="text-muted border-bottom small text-uppercase fw-bold">
                  <th className="px-4 py-3 border-0 text-center" style={{ width: '80px' }}>Sno</th>
                  <th className="py-3 border-0">Customer Name</th>
                  <th className="py-3 border-0">Strret1</th>
                  <th className="py-3 border-0">Strret2</th>
                  <th className="py-3 border-0">City</th>
                  <th className="py-3 border-0">State</th>
                  <th className="py-3 border-0 text-center px-4" style={{ width: '100px' }}>Action</th>
                </tr>
              </thead>
              <tbody className="border-top-0">
                {ledgerLoading ? (
                  <tr>
                    <td colSpan={7}>
                      <Loader text="Fetching Ledger Entries..." />
                    </td>
                  </tr>
                ) : paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-5">
                      <p className="text-muted fw-bold text-uppercase tracking-wider small">No dynamic ledger records found for this company.</p>
                      <span className="x-small text-muted">Create an Inward entry to start the ledger history.</span>
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((party, index) => (
                    <tr key={party.id} className="border-bottom">
                      <td className="px-4 text-muted small text-center">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                      <td className="fw-bold text-dark text-uppercase">{party.name}</td>
                      <td className="text-muted small">{party.street1 || '-'}</td>
                      <td className="text-muted small">{party.street2 || '-'}</td>
                      <td className="text-muted small">{party.city || '-'}</td>
                      <td className="text-muted small">{party.state || '-'}</td>
                      <td className="text-center px-4">
                        <div className="d-flex justify-content-center align-items-center gap-1">
                          <button className="btn btn-success p-1 px-2 border-0 shadow-sm rounded" style={{ height: '32px', width: '32px' }} title="View Ledger Details">
                              <i className="bi bi-search x-small"></i>
                          </button>
                          
                          <div className="dropdown">
                            <button 
                              className="btn btn-sm btn-outline-secondary border-0 text-muted p-0 ms-1 d-flex align-items-center justify-content-center" 
                              type="button" 
                              id={`actions-${party.id}`} 
                              data-bs-toggle="dropdown" 
                              aria-expanded="false"
                              style={{ width: '32px', height: '32px', borderRadius: '8px' }}
                            >
                              <i className="bi bi-three-dots-vertical fs-5"></i>
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3 py-2" aria-labelledby={`actions-${party.id}`}>
                              <li>
                                <button className="dropdown-item d-flex align-items-center gap-2 py-2" type="button" onClick={handlePrint}>
                                  <i className="bi bi-printer text-primary"></i>
                                  <span className="small fw-semibold">Quick Print</span>
                                </button>
                              </li>
                              <li>
                                <button className="dropdown-item d-flex align-items-center gap-2 py-2" type="button" onClick={handleExportPDF}>
                                  <i className="bi bi-file-earmark-pdf text-danger"></i>
                                  <span className="small fw-semibold">Export PDF</span>
                                </button>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Rendering */}
        {totalPages > 1 && (
          <div className="mt-4 d-flex justify-content-between align-items-center">
            <span className="text-muted small">Showing {paginatedItems.length} records</span>
            <nav>
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)}>Previous</button>
                </li>
                {[...Array(totalPages)].map((_, i) => (
                  <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)}>Next</button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>
      <style jsx>{`
        @media print {
          :global(body *) { visibility: hidden; }
          .container-fluid, .container-fluid * { visibility: visible; }
          .container-fluid { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; }
          .table th:last-child, .table td:last-child { display: none !important; }
          .hide-print { display: none !important; }
          :global(.sidebar), :global(.header), .h2, h2, .text-muted, .pagination, .card-header { display: none !important; }
          .card { border: none !important; box-shadow: none !important; }
        }
      `}</style>
    </ModuleGuard>
  );
}
