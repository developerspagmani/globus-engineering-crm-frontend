'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RootState } from '@/redux/store';
import { fetchLedgerEntries, addLedgerEntry, setLedgerFilters, setLedgerPage } from '@/redux/features/ledgerSlice';
import { fetchCustomers } from '@/redux/features/customerSlice';
import { fetchVendors } from '@/redux/features/vendorSlice';
import ModuleGuard from '@/components/ModuleGuard';
import Loader from '@/components/Loader';
import { checkActionPermission } from '@/config/permissions';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import LedgerPrintTemplate from '@/modules/ledger/components/LedgerPrintTemplate';
import { LedgerEntry } from '@/types/modules';
import ExportExcel from '@/components/shared/ExportExcel';
import Breadcrumb from '@/components/Breadcrumb';
import PaginationComponent from '@/components/shared/Pagination';


export default function LedgerPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { company: activeCompany, user: currentUser } = useSelector((state: RootState) => state.auth);
  const { items: ledgerEntries, loading: ledgerLoading, filters, pagination } = useSelector((state: RootState) => state.ledger);
  
  const { items: customers } = useSelector((state: RootState) => state.customers);
  const { items: vendors } = useSelector((state: RootState) => state.vendors);
  const [partyTypeFilter, setPartyTypeFilter] = React.useState<'all' | 'customer' | 'vendor'>('all');
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (activeCompany?.id) {
       (dispatch as any)(fetchLedgerEntries({ 
          companyId: activeCompany.id,
          page: pagination.currentPage,
          limit: pagination.itemsPerPage,
          search: filters.search
       }));
       (dispatch as any)(fetchCustomers({ company_id: activeCompany.id, limit: 1000 }));
       (dispatch as any)(fetchVendors({ company_id: activeCompany.id, limit: 1000 }));
    }
  }, [dispatch, activeCompany?.id, pagination.currentPage, pagination.itemsPerPage, filters.search]);

  // DERIVE UNIQUE PARTIES FROM LEDGER ENTRIES + ALL CUSTOMERS/VENDORS
  const uniqueParties = React.useMemo(() => {
    const partyMap = new Map();
    const currentCompId = String(activeCompany?.id || '').toLowerCase();

    // 1. First, add all customers to the map
    customers.forEach(c => {
      const partyId = String(c.id).toLowerCase();
      partyMap.set(partyId, {
        id: c.id,
        name: c.name || 'Unknown',
        street1: c.street1 || 'Address not specified',
        street2: c.street2 || '',
        city: c.city || '-',
        state: c.state || '-',
        partyType: 'customer',
        lastUpdated: '1970-01-01'
      });
    });

    // 2. Add all vendors to the map
    vendors.forEach(v => {
      const partyId = String(v.id).toLowerCase();
      // If a vendor shares an ID with a customer, we prioritize customer or handle separately
      // In this system, they seem to have distinct ID spaces or prefixes
      if (!partyMap.has(partyId)) {
        partyMap.set(partyId, {
            id: v.id,
            name: v.name || 'Unknown',
            street1: v.street1 || 'Address not specified',
            street2: v.street2 || '',
            city: v.city || '-',
            state: v.state || '-',
            partyType: 'vendor',
            lastUpdated: '1970-01-01'
        });
      }
    });

    // 3. Filter ledger entries that belong to this company ID (Case Insensitive) and match date filters
    const companyLedger = ledgerEntries.filter(e => {
        const matchesCompany = String(e.company_id || (e as any).companyId || '').toLowerCase() === currentCompId;
        if (!matchesCompany) return false;

        if (filters.dateFrom && e.date && new Date(e.date) < new Date(filters.dateFrom)) return false;
        if (filters.dateTo && e.date && new Date(e.date) > new Date(filters.dateTo)) return false;
        
        return true;
    });

     companyLedger.forEach(entry => {
      const entryPartyId = String(entry.partyId || '').toLowerCase();
      const entryDate = entry.date || '';

      if (!partyMap.has(entryPartyId)) {
        // Find matching customer OR vendor data for address if we missed it
        const customerRef = customers.find(c => String(c.id).toLowerCase() === entryPartyId);
        const vendorRef = !customerRef ? vendors.find(v => String(v.id).toLowerCase() === entryPartyId) : null;
        const partyRef = customerRef || vendorRef;
        
        // Even if metadata is missing, we show the name from the ledger entry
        partyMap.set(entryPartyId, {
          id: entry.partyId,
          name: entry.partyName || partyRef?.name || 'Unknown',
          street1: partyRef?.street1 || 'Address not specified',
          street2: partyRef?.street2 || '',
          city: partyRef?.city || '-',
          state: partyRef?.state || '-',
          partyType: customerRef ? 'customer' : (vendorRef ? 'vendor' : ((entry as any).partyType || (entry as any).party_type || 'customer')),
          lastUpdated: entryDate
        });
      } else {
        // UPDATE lastUpdated if this transaction is newer
        const existing = partyMap.get(entryPartyId);
        if (new Date(entryDate) > new Date(existing.lastUpdated)) {
            existing.lastUpdated = entryDate;
        }
      }
    });
    
    let result = Array.from(partyMap.values());
    
    // 4. Filter by Party Type
    if (partyTypeFilter !== 'all') {
      result = result.filter(p => p.partyType.toLowerCase() === partyTypeFilter.toLowerCase());
    }

    // 5. SORT: Recent First (Parties with transactions show first, others follow)
    result.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());

    return result;
  }, [ledgerEntries, customers, vendors, activeCompany?.id, filters.dateFrom, filters.dateTo, partyTypeFilter]);

  const totalItems = uniqueParties.length;
  const itemsPerPage = 10;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedItems = React.useMemo(() => {
    const start = (pagination.currentPage - 1) * pagination.itemsPerPage;
    return uniqueParties.slice(start, start + pagination.itemsPerPage);
  }, [uniqueParties, pagination.currentPage, pagination.itemsPerPage]);

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
    printWindow.document.write('<style>table {width:100%; border-collapse: collapse; font-family: "Roboto", sans-serif;} th, td {border: 1px solid #ddd; padding: 10px; text-align: left;} th {background-color: #f2f2f2;} .text-capitalize {text-transform: uppercase;}</style>');
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

  const handleQuickPrint = (party: any) => {
    router.push(`/ledger/${party.id}?print=true`);
  };


  return (
    <ModuleGuard moduleId="mod_ledger">
      <div className="container-fluid py-4 min-vh-100 animate-fade-in px-4">
        {/* Header Section Standardized */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <Breadcrumb items={[{ label: 'Financial Hub', active: true }]} />
            <h2 className="fw-900 tracking-tight text-dark mb-1 mt-2">Account Ledger</h2>
            <p className="text-muted small mb-0">Total parties with transactions: {uniqueParties.length} • Tracking industrial statements</p>
          </div>
          <div className="d-flex align-items-center gap-2 hide-print">
            <ExportExcel 
              data={ledgerEntries} 
              fileName="Ledger_Report" 
              headers={{ partyName: 'Party Name', date: 'Date', description: 'Description', debit: 'Debit', credit: 'Credit', balance: 'Balance' }}
              buttonText="Export List"
            />
            {mounted && checkActionPermission(currentUser, 'mod_ledger', 'create') && (
              <Link
                href="/ledger/new-entry"
                className="btn btn-primary btn-page-action px-4"
              >
                <i className="bi bi-plus-lg"></i>
                <span>Add Entry</span>
              </Link>
            )}
          </div>
        </div>

        {/* Filter Row */}
        <div className="card filter-card">
          <div className="card-body p-3">
            <div className="filter-bar-row">
              <div className="filter-item-search">
                <div className="search-group">
                  <span className="input-group-text">
                    <i className="bi bi-search"></i>
                  </span>
                  <input 
                    type="text" 
                    className="form-control search-bar" 
                    placeholder="Search by party name, city or state..." 
                    value={filters.search}
                    onChange={(e) => dispatch(setLedgerFilters({ search: e.target.value }))}
                  />
                </div>
              </div>

              <div className="filter-item-select">
                 <select 
                    className="form-select search-bar"
                    value={partyTypeFilter}
                    onChange={(e) => setPartyTypeFilter(e.target.value as any)}
                 >
                    <option value="all">All Parties</option>
                    <option value="customer">Customers</option>
                    <option value="vendor">Vendors</option>
                 </select>
              </div>
              
              <div className="date-filter-group">
                <input 
                  type="date" 
                  className="text-muted"
                  value={filters.dateFrom}
                  onChange={(e) => dispatch(setLedgerFilters({ dateFrom: e.target.value }))}
                />
                <span className="text-muted small fw-bold mx-1">TO</span>
                <input 
                  type="date" 
                  className="text-muted"
                  value={filters.dateTo}
                  onChange={(e) => dispatch(setLedgerFilters({ dateTo: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Table from Ledger */}
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="table-responsive" style={{ minHeight: '400px', paddingBottom: '80px' }}>
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr className="border-bottom">
                  <th className="py-3 border-0 small fw-bold text-muted text-capitalize tracking-wider text-center" style={{ width: '60px' }}>Sno</th>
                  <th className="py-3 border-0 small fw-bold text-muted text-capitalize tracking-wider">Party Name</th>
                  <th className="py-3 border-0 small fw-bold text-muted text-capitalize tracking-wider">Street</th>
                  <th className="py-3 border-0 small fw-bold text-muted text-capitalize tracking-wider">City</th>
                  <th className="py-3 border-0 small fw-bold text-muted text-capitalize tracking-wider">State</th>
                  <th className="py-3 border-0 small fw-bold text-muted text-capitalize tracking-wider text-center px-4" style={{ width: '120px' }}>Action</th>
                </tr>
              </thead>
              <tbody className="border-top-0">
                {ledgerLoading ? (
                  <tr>
                    <td colSpan={6}>
                      <Loader text="Fetching Ledger Entries..." />
                    </td>
                  </tr>
                ) : paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5">
                      <p className="text-muted fw-normal small">No ledger records found for this company.</p>
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((party, index) => (
                    <tr key={party.id || `party-${index}`}>
                      <td className="text-muted small text-center">{(pagination.currentPage - 1) * pagination.itemsPerPage + index + 1}</td>
                      <td>
                        <div className="d-flex flex-column">
                           <span className="fw-bold text-dark text-capitalize">{party.name}</span>
                        </div>
                      </td>
                      <td className="text-muted small">{party.street1 || '-'}</td>
                      <td className="text-muted small">{party.city || '-'}</td>
                      <td className="text-muted small">{party.state || '-'}</td>
                      <td className="text-center px-4">
                        <div className="d-flex justify-content-center align-items-center gap-1">
                          <Link href={`/ledger/${party.id}`} className="btn-action-view" title="View Detail">
                            <i className="bi bi-eye-fill"></i>
                          </Link>
                          
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
                                <button className="dropdown-item d-flex align-items-center gap-2 py-2" type="button" onClick={() => handleQuickPrint(party)}>
                                  <i className="bi bi-printer text-primary"></i>
                                  <span className="small fw-semibold">Quick Print</span>
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
            <span className="text-muted small">Showing {Math.min((pagination.currentPage - 1) * itemsPerPage + 1, totalItems)} to {Math.min(pagination.currentPage * itemsPerPage, totalItems)} of {totalItems} entries</span>
            <PaginationComponent 
              currentPage={pagination.currentPage} 
              totalPages={totalPages} 
              onPageChange={(page) => dispatch(setLedgerPage(page))} 
            />

          </div>
        )}

        {/* Pagination Rendering removed if single page, but kept for list */}
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
