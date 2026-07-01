'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { fetchLedgerEntries } from '@/redux/features/ledgerSlice';
import ModuleGuard from '@/components/ModuleGuard';
import Loader from '@/components/Loader';
import Breadcrumb from '@/components/Breadcrumb';
import LedgerAuditPrintTemplate from '@/modules/ledger/components/LedgerAuditPrintTemplate';

import { Suspense } from 'react';

function CompanyAuditContent() {
  const dispatch = useDispatch();
  const { company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items: ledgerEntries, loading } = useSelector((state: RootState) => state.ledger);
  
  const [mounted, setMounted] = useState(false);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedQuarter, setSelectedQuarter] = useState<string>('ALL');

  const yearsOptions = useMemo(() => {
    const years = new Set<number>();
    
    // Add current year and some standard surrounding years
    const currentYear = new Date().getFullYear();
    years.add(currentYear);
    years.add(currentYear - 1);
    years.add(currentYear - 2);
    years.add(currentYear - 3);
    years.add(currentYear - 4);
    
    // Collect all actual years from ledger entries data
    ledgerEntries.forEach(e => {
      if (e.date) {
        const y = new Date(e.date).getFullYear();
        if (y > 2000) years.add(y);
      }
    });

    return Array.from(years).sort((a, b) => b - a);
  }, [ledgerEntries]);

  const applyYearQuarter = (year: string, quarter: string) => {
    if (!year) return;

    let startMonth = 0; // 0-indexed
    let endMonth = 11;
    let startDay = 1;
    let endDay = 31;
    
    const cy = parseInt(year);
    const startYear = cy;
    const endYear = cy;
    
    if (quarter === 'Q1') {
      startMonth = 0;
      endMonth = 2;
      endDay = 31;
    } else if (quarter === 'Q2') {
      startMonth = 3;
      endMonth = 5;
      endDay = 30;
    } else if (quarter === 'Q3') {
      startMonth = 6;
      endMonth = 8;
      endDay = 30;
    } else if (quarter === 'Q4') {
      startMonth = 9;
      endMonth = 11;
      endDay = 31;
    } else {
      startMonth = 0;
      endMonth = 11;
      endDay = 31;
    }

    const pad = (n: number) => n.toString().padStart(2, '0');
    const fromStr = `${startYear}-${pad(startMonth + 1)}-${pad(startDay)}`;
    const toStr = `${endYear}-${pad(endMonth + 1)}-${pad(endDay)}`;

    setDateFrom(fromStr);
    setDateTo(toStr);
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    if (!year) {
      setDateFrom('');
      setDateTo('');
      setSelectedQuarter('ALL');
    } else {
      applyYearQuarter(year, selectedQuarter);
    }
  };

  const handleQuarterChange = (quarter: string) => {
    setSelectedQuarter(quarter);
    applyYearQuarter(selectedYear, quarter);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch all ledger entries for the active company
  useEffect(() => {
    if (activeCompany?.id) {
       (dispatch as any)(fetchLedgerEntries({ 
          companyId: activeCompany.id,
          dateFrom,
          dateTo,
          limit: 100000 // Fetch a large amount for the full audit
       }));
    }
  }, [dispatch, activeCompany?.id, dateFrom, dateTo]);

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
              <div className="d-flex align-items-center gap-2 hide-print">
                <select 
                  className="form-select form-select-sm border shadow-sm text-muted py-2 px-3 rounded-3"
                  style={{ minWidth: '140px', fontSize: '0.85rem' }}
                  value={selectedYear}
                  onChange={e => handleYearChange(e.target.value)}
                >
                  <option value="">Custom Year</option>
                  {yearsOptions.map(yr => (
                      <option key={yr} value={String(yr)}>{yr}</option>
                  ))}
                </select>
                <select 
                  className="form-select form-select-sm border shadow-sm text-muted py-2 px-3 rounded-3"
                  style={{ minWidth: '100px', fontSize: '0.85rem' }}
                  value={selectedQuarter}
                  onChange={e => handleQuarterChange(e.target.value)}
                  disabled={!selectedYear}
                >
                  <option value="ALL">All</option>
                  <option value="Q1">Q1</option>
                  <option value="Q2">Q2</option>
                  <option value="Q3">Q3</option>
                  <option value="Q4">Q4</option>
                </select>
              </div>

              <div className="date-filter-group bg-light rounded-3 p-1">
                <input 
                  type="date" 
                  className="form-control border-0 bg-transparent shadow-none" 
                  value={dateFrom}
                  onChange={(e) => {setDateFrom(e.target.value); setSelectedYear(""); setSelectedQuarter("ALL");}}
                  title="Start Date"
                />
                <span className="text-muted fw-bold px-1">to</span>
                <input 
                  type="date" 
                  className="form-control border-0 bg-transparent shadow-none" 
                  value={dateTo}
                  onChange={(e) => {setDateTo(e.target.value); setSelectedYear(""); setSelectedQuarter("ALL");}}
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
              hideHeaderOnScreen={true}
            />
          </div>
        )}
      </div>
    </ModuleGuard>
  );
}

export default function CompanyAuditPage() {
  return (
    <Suspense fallback={<div className="p-5 text-center"><Loader /></div>}>
      <CompanyAuditContent />
    </Suspense>
  );
}
