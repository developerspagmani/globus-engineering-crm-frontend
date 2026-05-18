'use client';

import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { fetchLedgerEntries } from '@/redux/features/ledgerSlice';
import ModuleGuard from '@/components/ModuleGuard';
import Loader from '@/components/Loader';
import Breadcrumb from '@/components/Breadcrumb';
import LedgerAuditPrintTemplate from '@/modules/ledger/components/LedgerAuditPrintTemplate';

export default function CompanyAuditPage() {
  const dispatch = useDispatch();
  const { company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items: ledgerEntries, loading } = useSelector((state: RootState) => state.ledger);
  
  const [mounted, setMounted] = useState(false);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch all ledger entries for the active company
  useEffect(() => {
    if (activeCompany?.id) {
       (dispatch as any)(fetchLedgerEntries({ 
          companyId: activeCompany.id,
          limit: 10000 // Fetch a large amount for the full audit
       }));
    }
  }, [dispatch, activeCompany?.id]);

  if (!mounted) return null;

  // Filter entries based on the date range
  const currentCompId = String(activeCompany?.id || '').toLowerCase();
  const filteredEntries = ledgerEntries.filter(e => {
    const matchesCompany = String(e.company_id || (e as any).companyId || '').toLowerCase() === currentCompId;
    if (!matchesCompany) return false;

    if (dateFrom && e.date && new Date(e.date) < new Date(dateFrom)) return false;
    if (dateTo && e.date && new Date(e.date) > new Date(dateTo)) return false;
    
    return true;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <ModuleGuard moduleId="mod_ledger">
      <div className="container-fluid py-4">
        <Breadcrumb 
          items={[
            { label: 'Ledger', href: '/ledger' },
            { label: 'Company', active: true }
          ]} 
        />

        {/* Action Bar */}
        <div className="card shadow-sm border-0 mb-4 rounded-3 no-print">
          <div className="card-body p-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
            <h5 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2">
              <i className="bi bi-building-check text-primary"></i>
              Company Ledger
            </h5>

            <div className="d-flex align-items-center gap-3">
              <div className="date-filter-group bg-light rounded-3 p-1">
                <input 
                  type="date" 
                  className="form-control border-0 bg-transparent shadow-none" 
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  title="Start Date"
                />
                <span className="text-muted fw-bold px-1">to</span>
                <input 
                  type="date" 
                  className="form-control border-0 bg-transparent shadow-none" 
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  title="End Date"
                />
              </div>

              <button onClick={handlePrint} className="btn btn-primary d-flex align-items-center gap-2 px-3 fw-bold shadow-sm">
                <i className="bi bi-printer"></i>
                <span>Print Audit</span>
              </button>
            </div>
          </div>
        </div>

        {/* Report Preview */}
        {loading ? (
          <div className="d-flex justify-content-center py-5">
            <Loader />
          </div>
        ) : (
          <div className="print-area shadow-sm border" style={{ background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
            <LedgerAuditPrintTemplate 
              entries={filteredEntries} 
              company={activeCompany} 
              dateFrom={dateFrom} 
              dateTo={dateTo} 
            />
          </div>
        )}
      </div>
    </ModuleGuard>
  );
}
