'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { fetchLedgerEntries } from '@/redux/features/ledgerSlice';
import ModuleGuard from '@/components/ModuleGuard';
import Loader from '@/components/Loader';
import Breadcrumb from '@/components/Breadcrumb';
import LedgerAuditPrintTemplate from '@/modules/ledger/components/LedgerAuditPrintTemplate';
import PaginationComponent from '@/components/shared/Pagination';

import { Suspense } from 'react';

const fmtCurrency = (n: number) =>
  n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function CompanyAuditContent() {
  const dispatch = useDispatch();
  const { company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items: ledgerEntries, loading, openingBalance } = useSelector((state: RootState) => state.ledger);
  
  const [mounted, setMounted] = useState(false);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedQuarter, setSelectedQuarter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedVchType, setSelectedVchType] = useState<string>('ALL');

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);

  const yearsOptions = useMemo(() => {
    const years = new Set<number>();
    
    // Add current year and surrounding years
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

  // Available voucher types in dataset
  const vchTypeOptions = useMemo(() => {
    const types = new Set<string>();
    ledgerEntries.forEach(e => {
      if (e.vchType) types.add(e.vchType.toUpperCase());
    });
    return Array.from(types).sort();
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

  const clearAllFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSelectedYear('');
    setSelectedQuarter('ALL');
    setSearchQuery('');
    setSelectedVchType('ALL');
    setCurrentPage(1);
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

  // Filter entries based on company, date range, search, and voucher type
  const currentCompId = String(activeCompany?.id || '').toLowerCase();
  const filteredEntries = useMemo(() => {
    return ledgerEntries.filter(e => {
      const matchesCompany = String(e.company_id || (e as any).companyId || '').toLowerCase() === currentCompId;
      if (!matchesCompany) return false;

      if (dateFrom && e.date && new Date(e.date) < new Date(dateFrom)) return false;
      if (dateTo && e.date && new Date(e.date) > new Date(dateTo)) return false;

      if (selectedVchType !== 'ALL') {
        if ((e.vchType || '').toUpperCase() !== selectedVchType) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const party = String(e.partyName || '').toLowerCase();
        const desc = String(e.description || '').toLowerCase();
        const vchType = String(e.vchType || '').toLowerCase();
        const vchNo = String(e.vchNo || '').toLowerCase();
        const amount = String(e.amount || '');

        if (!party.includes(q) && !desc.includes(q) && !vchType.includes(q) && !vchNo.includes(q) && !amount.includes(q)) {
          return false;
        }
      }
      
      return true;
    });
  }, [ledgerEntries, currentCompId, dateFrom, dateTo, selectedVchType, searchQuery]);

  // Reset to first page when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [dateFrom, dateTo, selectedYear, selectedQuarter, searchQuery, selectedVchType, pageSize]);

  // Paginated slice for on-screen performance
  const totalItems = filteredEntries.length;
  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));
  
  const paginatedEntries = useMemo(() => {
    if (pageSize === -1) return filteredEntries;
    const startIndex = (currentPage - 1) * pageSize;
    return filteredEntries.slice(startIndex, startIndex + pageSize);
  }, [filteredEntries, currentPage, pageSize]);

  // Financial summary for the filtered dataset
  const { totalDebit, totalCredit, closingBalance, drWithOp, crWithOp } = useMemo(() => {
    const dr = filteredEntries.reduce((sum, e) => sum + (e.type === 'debit' ? e.amount : 0), 0);
    const cr = filteredEntries.reduce((sum, e) => sum + (e.type === 'credit' ? e.amount : 0), 0);
    const isDebitOpening = (openingBalance || 0) >= 0;
    const absOp = Math.abs(openingBalance || 0);
    const drOp = dr + (isDebitOpening ? absOp : 0);
    const crOp = cr + (!isDebitOpening ? absOp : 0);
    const close = Math.abs(drOp - crOp);
    return {
      totalDebit: dr,
      totalCredit: cr,
      closingBalance: close,
      drWithOp: drOp,
      crWithOp: crOp
    };
  }, [filteredEntries, openingBalance]);

  const handlePrint = () => {
    window.print();
  };

  const isFiltered = Boolean(dateFrom || dateTo || selectedYear || searchQuery || selectedVchType !== 'ALL');

  if (!mounted) return null;

  return (
    <ModuleGuard moduleId="mod_ledger">
      <div className="container-fluid py-4">
        <Breadcrumb 
          items={[
            { label: 'Ledger', href: '/ledger' },
            { label: 'Company', active: true }
          ]} 
        />

        {/* Action & Filter Bar */}
        <div className="card shadow-sm border-0 mb-4 rounded-3 no-print">
          <div className="card-body p-3">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
              <h5 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2">
                <i className="bi bi-building-check text-primary"></i>
                Company Ledger
                <span className="badge bg-light text-dark border ms-2" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  {totalItems.toLocaleString()} Entries
                </span>
              </h5>

              <div className="d-flex align-items-center gap-2 flex-wrap">
                {isFiltered && (
                  <button 
                    onClick={clearAllFilters} 
                    className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 px-2.5 py-1.5 rounded-2"
                    title="Clear All Filters"
                  >
                    <i className="bi bi-x-circle"></i>
                    <span>Reset</span>
                  </button>
                )}

                <button 
                  onClick={handlePrint} 
                  className="btn btn-primary btn-sm d-flex align-items-center gap-2 px-3 py-1.5 fw-bold shadow-sm rounded-2"
                >
                  <i className="bi bi-printer"></i>
                  <span>Print Audit</span>
                </button>
              </div>
            </div>

            {/* Comprehensive Filter Controls */}
            <div className="row g-2 align-items-center">
              {/* Search Bar */}
              <div className="col-12 col-md-4 col-lg-3">
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-light border-end-0 text-muted">
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0 bg-light"
                    placeholder="Search party, voucher, text..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button 
                      className="btn btn-light border border-start-0 text-muted" 
                      type="button" 
                      onClick={() => setSearchQuery('')}
                    >
                      <i className="bi bi-x"></i>
                    </button>
                  )}
                </div>
              </div>

              {/* Year Dropdown */}
              <div className="col-6 col-md-2 col-lg-2">
                <select 
                  className="form-select form-select-sm border text-muted rounded-2"
                  value={selectedYear}
                  onChange={e => handleYearChange(e.target.value)}
                >
                  <option value="">Custom Year</option>
                  {yearsOptions.map(yr => (
                      <option key={yr} value={String(yr)}>{yr}</option>
                  ))}
                </select>
              </div>

              {/* Quarter Dropdown */}
              <div className="col-6 col-md-2 col-lg-1">
                <select 
                  className="form-select form-select-sm border text-muted rounded-2"
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

              {/* Date Range Group */}
              <div className="col-12 col-md-4 col-lg-3">
                <div className="date-filter-group bg-light rounded-2 p-1 d-flex align-items-center border">
                  <input 
                    type="date" 
                    className="form-control form-control-sm border-0 bg-transparent shadow-none p-1" 
                    value={dateFrom}
                    onChange={(e) => {setDateFrom(e.target.value); setSelectedYear(""); setSelectedQuarter("ALL");}}
                    title="Start Date"
                  />
                  <span className="text-muted fw-bold px-1 small">to</span>
                  <input 
                    type="date" 
                    className="form-control form-control-sm border-0 bg-transparent shadow-none p-1" 
                    value={dateTo}
                    onChange={(e) => {setDateTo(e.target.value); setSelectedYear(""); setSelectedQuarter("ALL");}}
                    title="End Date"
                  />
                </div>
              </div>

              {/* Voucher Type Filter */}
              <div className="col-6 col-md-2 col-lg-2">
                <select 
                  className="form-select form-select-sm border text-muted rounded-2"
                  value={selectedVchType}
                  onChange={e => setSelectedVchType(e.target.value)}
                >
                  <option value="ALL">All Vch Types</option>
                  {vchTypeOptions.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Page Size Selector */}
              <div className="col-6 col-md-2 col-lg-1">
                <select
                  className="form-select form-select-sm border text-muted rounded-2"
                  value={pageSize}
                  onChange={e => setPageSize(Number(e.target.value))}
                  title="Items per page"
                >
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                  <option value={100}>100 / page</option>
                  <option value={250}>250 / page</option>
                  <option value={-1}>Show All</option>
                </select>
              </div>
            </div>

            {/* Quick KPI Summary Bar */}
            <div className="row g-2 mt-2 pt-2 border-top">
              <div className="col-6 col-md-3">
                <div className="p-2 rounded-2 bg-light border">
                  <div className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>Opening Balance</div>
                  <div className="fw-bold text-dark fs-6">₹ {fmtCurrency(Math.abs(openingBalance || 0))}</div>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="p-2 rounded-2 bg-light border">
                  <div className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>Total Debit (Period)</div>
                  <div className="fw-bold text-danger fs-6">₹ {fmtCurrency(totalDebit)}</div>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="p-2 rounded-2 bg-light border">
                  <div className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>Total Credit (Period)</div>
                  <div className="fw-bold text-success fs-6">₹ {fmtCurrency(totalCredit)}</div>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="p-2 rounded-2 bg-light border">
                  <div className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>Closing Balance</div>
                  <div className="fw-bold text-primary fs-6">₹ {fmtCurrency(closingBalance)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Report Preview */}
        {loading ? (
          <div className="d-flex justify-content-center py-5">
            <Loader />
          </div>
        ) : (
          <>
            {/* Screen Paginated View */}
            <div className="no-print">
              <div className="print-area shadow-sm border mb-3" style={{ background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
                <LedgerAuditPrintTemplate 
                  entries={paginatedEntries} 
                  allEntries={filteredEntries}
                  company={activeCompany} 
                  dateFrom={dateFrom} 
                  dateTo={dateTo} 
                  openingBalance={openingBalance}
                  hideHeaderOnScreen={true}
                />
              </div>

              {/* Pagination Controls */}
              {totalItems > 0 && (
                <div className="card shadow-sm border-0 rounded-3 p-3">
                  <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                    <span className="text-muted small">
                      {pageSize === -1 ? (
                        <>Showing all <strong>{totalItems.toLocaleString()}</strong> entries</>
                      ) : (
                        <>
                          Showing <strong>{((currentPage - 1) * pageSize + 1).toLocaleString()}</strong> to{' '}
                          <strong>{Math.min(currentPage * pageSize, totalItems).toLocaleString()}</strong> of{' '}
                          <strong>{totalItems.toLocaleString()}</strong> entries
                        </>
                      )}
                    </span>

                    {pageSize !== -1 && totalPages > 1 && (
                      <PaginationComponent 
                        currentPage={currentPage} 
                        totalPages={totalPages} 
                        onPageChange={setCurrentPage} 
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Print-Only View: Outputs Complete Unpaginated Audit Report */}
            <div className="d-none d-print-block">
              <LedgerAuditPrintTemplate 
                entries={filteredEntries} 
                company={activeCompany} 
                dateFrom={dateFrom} 
                dateTo={dateTo} 
                openingBalance={openingBalance}
                hideHeaderOnScreen={false}
              />
            </div>
          </>
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

