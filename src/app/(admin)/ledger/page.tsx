'use client';

import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { fetchLedgerEntries } from '@/redux/features/ledgerSlice';
import { fetchCustomers } from '@/redux/features/customerSlice';
import ModuleGuard from '@/components/ModuleGuard';

export default function LedgerPage() {
  const dispatch = useDispatch();
  const { company: activeCompany, user: currentUser } = useSelector((state: RootState) => state.auth);
  console.log('[LEDGER FRONTEND DEBUG] Current Auth State (User/Company):', { currentUser, activeCompany });
  const { items: ledgerEntries, loading: ledgerLoading } = useSelector((state: RootState) => state.ledger);
  const { items: customers } = useSelector((state: RootState) => state.customers);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [itemsPerPage, setItemsPerPage] = React.useState(10);
  const [currentPage, setCurrentPage] = React.useState(1);

  useEffect(() => {
    console.log('[LEDGER FRONTEND DEBUG] Active Company:', activeCompany?.id, activeCompany?.name);
    if (activeCompany?.id) {
       (dispatch as any)(fetchLedgerEntries({ companyId: activeCompany.id }));
       (dispatch as any)(fetchCustomers(activeCompany.id));
    }
  }, [dispatch, activeCompany?.id]);

  useEffect(() => {
    console.log('[LEDGER FRONTEND DEBUG] Redux ledgerEntries state changed:', ledgerEntries);
    if (ledgerEntries.length > 0) {
      console.log('[LEDGER FRONTEND DEBUG] Fetched Entries Detail:', ledgerEntries.map(e => ({ partyId: e.partyId, compId: e.company_id })));
    }
  }, [ledgerEntries]);

  // DERIVE UNIQUE PARTIES FROM LEDGER ENTRIES
  const uniqueParties = React.useMemo(() => {
    const partyMap = new Map();
    const currentCompId = String(activeCompany?.id || '').toLowerCase();

    // 1. Filter ledger entries that belong to this company ID (Case Insensitive)
    const companyLedger = ledgerEntries.filter(e => 
      String(e.company_id || (e as any).companyId || '').toLowerCase() === currentCompId
    );

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
  }, [ledgerEntries, customers, activeCompany?.id]);

  const filteredItems = uniqueParties.filter(item => {
    return (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
           (item.city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
           (item.state || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <ModuleGuard moduleId="mod_ledger">
      <div className="container-fluid py-4 min-vh-100 bg-white">
        {/* Header Section */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold mb-1">Ledger Report</h2>
            <p className="text-muted small mb-0">Total parties with transactions: {uniqueParties.length}</p>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-primary d-flex align-items-center gap-2 px-4 shadow-sm" style={{ backgroundColor: '#8e44ad', border: 'none' }}>
              <i className="bi bi-plus-lg"></i>
              <span className="fw-bold text-uppercase small">Add</span>
            </button>
            <button className="btn btn-danger d-flex align-items-center gap-2 px-4 shadow-sm">
              <i className="bi bi-list"></i>
              <span className="fw-bold text-uppercase small">List</span>
            </button>
          </div>
        </div>

        {/* Action Button Group */}
        <div className="card border-0 mb-4">
           <div className="card-body p-0">
             <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center gap-3 w-50">
                    <span className="text-muted small fw-bold">Filter:</span>
                    <div className="input-group input-group-sm border rounded px-2 bg-light w-75">
                        <input 
                            type="text" 
                            className="form-control border-0 bg-transparent" 
                            placeholder="Type to filter..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <span className="input-group-text border-0 bg-transparent text-muted"><i className="bi bi-search"></i></span>
                    </div>
                </div>
                <div className="d-flex align-items-center gap-2">
                   <span className="text-muted small fw-bold">Show:</span>
                   <select 
                     className="form-select form-select-sm border-0 bg-light fw-bold" 
                     style={{ width: '70px' }}
                     value={itemsPerPage}
                     onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
                   >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                   </select>
                   <div className="btn-group ms-3 shadow-sm rounded overflow-hidden">
                      <button className="btn btn-info text-white px-3 border-0"><i className="bi bi-printer"></i> <span className="x-small fw-bold text-uppercase ms-1">Print</span></button>
                      <button className="btn btn-primary text-white px-3 border-0" style={{ backgroundColor: '#8e44ad' }}><i className="bi bi-file-earmark-excel"></i> <span className="x-small fw-bold text-uppercase ms-1">Excel</span></button>
                      <button className="btn btn-success text-white px-3 border-0"><i className="bi bi-copy"></i> <span className="x-small fw-bold text-uppercase ms-1">Copy</span></button>
                      <button className="btn btn-warning text-white px-3 border-0" style={{ backgroundColor: '#f39c12' }}><i className="bi bi-file-pdf"></i> <span className="x-small fw-bold text-uppercase ms-1">Pdf</span></button>
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
                {paginatedItems.map((party, index) => (
                  <tr key={party.id} className="border-bottom">
                    <td className="px-4 text-muted small text-center">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td className="fw-bold text-dark text-uppercase">{party.name}</td>
                    <td className="text-muted small">{party.street1 || '-'}</td>
                    <td className="text-muted small">{party.street2 || '-'}</td>
                    <td className="text-muted small">{party.city || '-'}</td>
                    <td className="text-muted small">{party.state || '-'}</td>
                    <td className="text-center px-4">
                        <button className="btn btn-success p-1 px-2 border-0 shadow-sm rounded" style={{ height: '32px', width: '32px' }}>
                            <i className="bi bi-search x-small"></i>
                        </button>
                    </td>
                  </tr>
                ))}
                {paginatedItems.length === 0 && !ledgerLoading && (
                  <tr>
                    <td colSpan={7} className="text-center py-5">
                      <p className="text-muted fw-bold text-uppercase tracking-wider small">No dynamic ledger records found for this company.</p>
                      <span className="x-small text-muted">Create an Inward entry to start the ledger history.</span>
                    </td>
                  </tr>
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
    </ModuleGuard>
  );
}
