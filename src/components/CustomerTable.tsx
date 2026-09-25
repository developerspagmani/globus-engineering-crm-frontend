'use client';

import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import Link from 'next/link';
import { Customer } from '@/types/modules';
import { checkActionPermission } from '@/config/permissions';
import PaginationComponent from '@/components/shared/Pagination';
import { canonicalState, cleanDistrict, getDistrict, getCustomerState, isDistrictMatch, isRegionMatch, toTitleCase, formatINR } from '@/utils/geo_utils';

interface CustomerTableProps {
  customers: Customer[];
  selectedRegion?: string | null;
  selectedState?: string | null;
  selectedDistrict?: string | null;
  onStateChange?: (state: string) => void;
  onDistrictChange?: (district: string) => void;
  fromDate?: string;
  toDate?: string;
  onFromDateChange?: (val: string) => void;
  onToDateChange?: (val: string) => void;
  totalBilling?: number;
  matchingInvoicesCount?: number;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  onLocate?: (customer: Customer) => void;
  onClearFilters?: () => void;
}

const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  selectedRegion,
  selectedState,
  selectedDistrict,
  onStateChange,
  onDistrictChange,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  totalBilling: propTotalBilling,
  matchingInvoicesCount: propMatchingInvoicesCount,
  searchQuery,
  onSearchChange,
  onLocate,
  onClearFilters,
}) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const invoices = useSelector((state: RootState) => state.invoices.items);
  const [currentPage, setCurrentPage] = useState(1);
  const [localFilterState, setLocalFilterState] = useState('');
  const [localFilterDistrict, setLocalFilterDistrict] = useState('');
  const [localFromDate, setLocalFromDate] = useState('');
  const [localToDate, setLocalToDate] = useState('');
  const itemsPerPage = 10;

  // Use props if provided, fallback to local state
  const effState = selectedState !== undefined ? (selectedState || '') : localFilterState;
  const effDistrict = selectedDistrict !== undefined ? (selectedDistrict || '') : localFilterDistrict;
  const effFromDate = fromDate !== undefined ? fromDate : localFromDate;
  const effToDate = toDate !== undefined ? toDate : localToDate;

  // Set of customer IDs matching state & district
  const regionMatchingCustomerIds = useMemo(() => {
    const ids = new Set<string>();
    customers.forEach((c) => {
      const cState = getCustomerState(c);
      const cDistrict = getDistrict(c);
      const matchState = !effState || cState === canonicalState(effState) || isRegionMatch(cState, effState);
      const matchDistrict = !effDistrict || isDistrictMatch(cDistrict, effDistrict) || cleanDistrict(cDistrict).toLowerCase() === cleanDistrict(effDistrict).toLowerCase();
      if (matchState && matchDistrict) {
        ids.add(String(c.id));
      }
    });
    return ids;
  }, [customers, effState, effDistrict]);

  // Compute matching invoices & total billing if not provided via props
  const { calculatedBilling, calculatedInvoiceCount, billedCustomerIds } = useMemo(() => {
    const from = effFromDate ? new Date(effFromDate) : null;
    const to = effToDate ? new Date(effToDate) : null;
    if (to) to.setHours(23, 59, 59, 999);

    let sum = 0;
    let count = 0;
    const billedIds = new Set<string>();

    (invoices || []).forEach((inv: any) => {
      if (effState || effDistrict) {
        if (!inv.customerId || !regionMatchingCustomerIds.has(String(inv.customerId))) {
          return;
        }
      }

      if (from || to) {
        const rawDate = inv.date || inv.invoice_date;
        if (!rawDate) return;
        const invDate = new Date(rawDate);
        if (from && invDate < from) return;
        if (to && invDate > to) return;
      }

      const amt = Number(inv.grandTotal ?? inv.grand_total ?? 0);
      sum += isNaN(amt) ? 0 : amt;
      count++;
      if (inv.customerId) billedIds.add(String(inv.customerId));
    });

    return { calculatedBilling: sum, calculatedInvoiceCount: count, billedCustomerIds: billedIds };
  }, [invoices, effState, effDistrict, regionMatchingCustomerIds, effFromDate, effToDate]);

  const activeTotalBilling = propTotalBilling !== undefined ? propTotalBilling : calculatedBilling;
  const activeInvoiceCount = propMatchingInvoicesCount !== undefined ? propMatchingInvoicesCount : calculatedInvoiceCount;

  // Unique states deduplicated by canonical name (with fallback resolution)
  const uniqueStates = useMemo(() => {
    const seen = new Set<string>();
    customers.forEach((c) => {
      const canonical = getCustomerState(c);
      if (canonical) seen.add(canonical);
    });
    return [...seen].sort();
  }, [customers]);

  // Unique districts for the selected state (or all), deduplicated
  const uniqueDistricts = useMemo(() => {
    const seen = new Set<string>();
    customers.forEach((c) => {
      if (effState) {
        const cState = getCustomerState(c);
        if (cState !== canonicalState(effState) && !isRegionMatch(cState, effState)) return;
      }
      const d = getDistrict(c);
      if (d) seen.add(d);
    });
    return [...seen].sort();
  }, [customers, effState]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const cState = getCustomerState(c);
      const matchState = !effState || cState === canonicalState(effState) || isRegionMatch(cState, effState);
      const matchDistrict =
        !effDistrict || isDistrictMatch(getDistrict(c), effDistrict) || cleanDistrict(getDistrict(c)).toLowerCase() === cleanDistrict(effDistrict).toLowerCase();

      const matchInvoiceDate =
        (!effFromDate && !effToDate) || billedCustomerIds.has(String(c.id));

      const matchSearch = !searchQuery ||
        Object.values(c).some(val =>
          String(val).toLowerCase().includes(searchQuery.toLowerCase())
        );
      return matchState && matchDistrict && matchInvoiceDate && matchSearch;
    });
  }, [customers, effState, effDistrict, effFromDate, effToDate, billedCustomerIds, searchQuery]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedItems = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleStateFilter = (val: string) => {
    setLocalFilterState(val);
    setLocalFilterDistrict('');
    setCurrentPage(1);
    if (onStateChange) onStateChange(val);
    if (onDistrictChange) onDistrictChange('');
  };

  const handleDistrictFilter = (val: string) => {
    setLocalFilterDistrict(val);
    setCurrentPage(1);
    if (onDistrictChange) onDistrictChange(val);
  };

  const handleClearFilters = () => {
    setLocalFilterState('');
    setLocalFilterDistrict('');
    setLocalFromDate('');
    setLocalToDate('');
    setCurrentPage(1);
    if (onFromDateChange) onFromDateChange('');
    if (onToDateChange) onToDateChange('');
    if (onClearFilters) {
      onClearFilters();
    } else {
      if (onStateChange) onStateChange('');
      if (onDistrictChange) onDistrictChange('');
    }
  };

  const hasFilters = effState || effDistrict || effFromDate || effToDate;

  return (
    <div className="card shadow-sm bg-white rounded-4 border-0 h-100 d-flex flex-column overflow-hidden">
      {/* Table Header: Sleek, Unified SaaS Bar */}
      <div className="p-3 border-bottom bg-white">
        {/* Row 1: Territory Title & KPI Badges */}
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
          <div className="me-2">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-geo-alt-fill text-primary" style={{ fontSize: '0.95rem' }}></i>
              <h6 className="fw-bold text-dark mb-0 fs-6">
                {effDistrict ? `${effDistrict}, ${effState}` : effState ? `${effState} Territory` : 'All Territory Accounts'}
              </h6>
            </div>
            <div className="text-muted fw-medium mt-0.5" style={{ fontSize: '0.72rem' }}>
              {filteredCustomers.length} Client{filteredCustomers.length === 1 ? '' : 's'} • {activeInvoiceCount} Invoice{activeInvoiceCount === 1 ? '' : 's'}
              {effFromDate || effToDate ? ` (${effFromDate || 'Start'} to ${effToDate || 'Today'})` : ''}
            </div>
          </div>

          {/* Metric Badges: Total Billing & Client Count */}
          <div className="d-flex align-items-center gap-2 flex-wrap mb-3">
            {/* Total Billing Pill */}
            <div className="p-2 rounded-3 d-flex align-items-center gap-2" style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0' }}>
              <div className="rounded-circle d-flex align-items-center justify-content-center text-white" style={{ backgroundColor: '#059669', width: '22px', height: '22px', fontSize: '0.75rem', flexShrink: 0 }}>
                <i className="bi bi-currency-rupee"></i>
              </div>
              <div className="text-start">
                <div className="fw-bold text-uppercase" style={{ fontSize: '0.58rem', letterSpacing: '0.04em', color: '#047857' }}>Total Billing</div>
                <div className="fw-bolder leading-none" style={{ fontSize: '0.88rem', color: '#064e3b' }}>
                  {formatINR(activeTotalBilling)}
                </div>
              </div>
            </div>

            {/* Client Count Pill */}
            <div className="p-2 rounded-3 d-flex align-items-center gap-2" style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <div className="rounded-circle d-flex align-items-center justify-content-center text-white" style={{ backgroundColor: '#2563eb', width: '22px', height: '22px', fontSize: '0.75rem', flexShrink: 0 }}>
                <i className="bi bi-people-fill"></i>
              </div>
              <div className="text-start">
                <div className="fw-bold text-uppercase" style={{ fontSize: '0.58rem', letterSpacing: '0.04em', color: '#1d4ed8' }}>Clients</div>
                <div className="fw-bolder leading-none" style={{ fontSize: '0.88rem', color: '#1e3a8a' }}>
                  {filteredCustomers.length}
                </div>
              </div>
            </div>

            {/* Reset Button */}
            {hasFilters && (
              <button
                type="button"
                className="btn btn-sm btn-outline-danger border rounded-pill px-2.5 py-1 d-flex align-items-center gap-1 shadow-none"
                style={{ fontSize: '0.7rem', height: '32px' }}
                onClick={handleClearFilters}
                title="Reset all filters"
              >
                <i className="bi bi-x-circle-fill"></i>
                <span className="fw-semibold">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Filter Controls - Structured 4-Column Grid that never overflows or collapses */}
        <div className="row g-2 pt-2 border-top align-items-end">
          {/* State Filter */}
          <div className="col-6 col-md-3">
            <label className="text-muted fw-bold d-flex align-items-center gap-1 mb-1" style={{ fontSize: '0.64rem', letterSpacing: '0.03em' }}>
              <i className="bi bi-geo-alt text-primary" style={{ fontSize: '0.7rem' }}></i>
              <span>STATE</span>
            </label>
            <select
              className="form-select form-select-sm bg-light border rounded-3 shadow-none w-100"
              style={{ fontSize: '0.75rem', height: '32px' }}
              value={effState}
              onChange={(e) => handleStateFilter(e.target.value)}
            >
              <option value="">All States</option>
              {uniqueStates.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* District Filter */}
          <div className="col-6 col-md-3">
            <label className="text-muted fw-bold d-flex align-items-center gap-1 mb-1" style={{ fontSize: '0.64rem', letterSpacing: '0.03em' }}>
              <i className="bi bi-pin-map text-primary" style={{ fontSize: '0.7rem' }}></i>
              <span>DISTRICT</span>
            </label>
            <select
              className="form-select form-select-sm bg-light border rounded-3 shadow-none w-100"
              style={{ fontSize: '0.75rem', height: '32px' }}
              value={effDistrict}
              onChange={(e) => handleDistrictFilter(e.target.value)}
              disabled={uniqueDistricts.length === 0}
            >
              <option value="">All Districts</option>
              {uniqueDistricts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* From Date */}
          <div className="col-6 col-md-3">
            <label className="text-muted fw-bold d-flex align-items-center gap-1 mb-1" style={{ fontSize: '0.64rem', letterSpacing: '0.03em' }}>
              <i className="bi bi-calendar-event text-primary" style={{ fontSize: '0.7rem' }}></i>
              <span>FROM DATE</span>
            </label>
            <input
              type="date"
              className="form-control form-control-sm bg-light border rounded-3 shadow-none w-100"
              style={{ fontSize: '0.74rem', height: '32px' }}
              value={effFromDate}
              onChange={(e) => {
                setLocalFromDate(e.target.value);
                onFromDateChange?.(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* To Date */}
          <div className="col-6 col-md-3">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="text-muted fw-bold d-flex align-items-center gap-1 mb-0" style={{ fontSize: '0.64rem', letterSpacing: '0.03em' }}>
                <i className="bi bi-calendar-check text-primary" style={{ fontSize: '0.7rem' }}></i>
                <span>TO DATE</span>
              </label>
              {hasFilters && (
                <button
                  type="button"
                  className="btn btn-link p-0 text-danger text-decoration-none fw-bold"
                  style={{ fontSize: '0.62rem', lineHeight: '1' }}
                  onClick={handleClearFilters}
                  title="Reset all filters"
                >
                  Clear All
                </button>
              )}
            </div>
            <input
              type="date"
              className="form-control form-control-sm bg-light border rounded-3 shadow-none w-100"
              style={{ fontSize: '0.74rem', height: '32px' }}
              value={effToDate}
              onChange={(e) => {
                setLocalToDate(e.target.value);
                onToDateChange?.(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="table-responsive flex-grow-1 p-0 overflow-auto">
        <table className="table table-hover mb-0 align-middle" style={{ width: '100%' }}>
          <thead className="bg-light sticky-top z-1 border-bottom">
            <tr>
              <th className="ps-3 py-2 text-muted fw-bold text-uppercase" style={{ width: '38px', minWidth: '38px', fontSize: '0.68rem', whiteSpace: 'nowrap' }}>#</th>
              <th className="py-2 text-muted fw-bold text-uppercase" style={{ minWidth: '150px', fontSize: '0.68rem', whiteSpace: 'nowrap' }}>Customer</th>
              <th className="py-2 text-muted fw-bold text-uppercase" style={{ minWidth: '130px', fontSize: '0.68rem', whiteSpace: 'nowrap' }}>Contact</th>
              <th className="py-2 text-muted fw-bold text-uppercase" style={{ minWidth: '110px', fontSize: '0.68rem', whiteSpace: 'nowrap' }}>Location</th>
              <th className="pe-3 py-2 text-muted fw-bold text-uppercase text-end" style={{ width: '88px', minWidth: '88px', fontSize: '0.68rem', whiteSpace: 'nowrap' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((customer, index) => {
              const custState = getCustomerState(customer);
              const custDistrict = getDistrict(customer);

              // Clean text sanitizer helper to prevent "0", "-", "null"
              const cleanVal = (val?: string | null) => {
                if (!val) return '';
                const s = String(val).trim();
                if (s === '0' || s === '-' || s === 'null' || s === 'undefined' || s === 'N/A' || s === 'none') return '';
                return s;
              };

              const contactPerson = cleanVal(customer.contactPerson1) || (cleanVal(customer.name) && customer.name !== customer.company ? cleanVal(customer.name) : '');
              const contactPhone = cleanVal(customer.phoneNumber1) || cleanVal(customer.phone);
              const contactEmail = cleanVal(customer.emailId1) || cleanVal(customer.email);

              return (
                <tr key={customer.id} className="border-bottom">
                  <td className="ps-3 py-2 text-muted small" style={{ fontSize: '0.72rem' }}>
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  <td className="py-2">
                    <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.78rem', lineHeight: '1.25', maxWidth: '240px' }} title={customer.company || customer.name}>
                      {customer.company || customer.name}
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.65rem' }}>{customer.industry || 'Industrial'}</div>
                  </td>
                  <td className="py-2">
                    {contactPerson ? (
                      <div className="text-dark fw-medium text-truncate" style={{ fontSize: '0.74rem', lineHeight: '1.2', maxWidth: '180px' }} title={contactPerson}>
                        {contactPerson}
                      </div>
                    ) : null}
                    {contactPhone ? (
                      <div className="text-muted text-truncate" style={{ fontSize: '0.65rem' }}>
                        <i className="bi bi-telephone me-1" style={{ fontSize: '0.6rem' }}></i>
                        {contactPhone}
                      </div>
                    ) : contactEmail ? (
                      <div className="text-muted text-truncate" style={{ fontSize: '0.65rem', maxWidth: '180px' }} title={contactEmail}>
                        <i className="bi bi-envelope me-1" style={{ fontSize: '0.6rem' }}></i>
                        {contactEmail}
                      </div>
                    ) : !contactPerson ? (
                      <span className="text-muted" style={{ fontSize: '0.72rem' }}>-</span>
                    ) : null}
                  </td>
                  <td className="py-2">
                    <span className="text-dark fw-bold text-truncate d-block" style={{ fontSize: '0.74rem', lineHeight: '1.2' }}>
                      {custDistrict ? toTitleCase(custDistrict) : '-'}
                    </span>
                    <span className="text-muted text-truncate d-block mt-0.5" style={{ fontSize: '0.66rem' }}>
                      {custState || 'India'}
                    </span>
                  </td>
                  <td className="pe-3 py-2 text-end">
                    <div className="d-flex justify-content-end align-items-center gap-1">
                      <button
                        type="button"
                        className="btn btn-sm btn-light border-0 p-1 rounded-circle text-primary"
                        style={{ width: '26px', height: '26px' }}
                        title="Zoom to Customer on Map"
                        onClick={() => onLocate && onLocate(customer)}
                      >
                        <i className="bi bi-geo-alt-fill" style={{ fontSize: '0.75rem' }}></i>
                      </button>
                      <Link
                        href={`/customers/${customer.id}`}
                        className="btn btn-sm btn-light border-0 p-1 rounded-circle text-secondary"
                        style={{ width: '26px', height: '26px' }}
                        title="View Customer"
                      >
                        <i className="bi bi-eye" style={{ fontSize: '0.75rem' }}></i>
                      </Link>
                      {checkActionPermission(user, 'mod_customer', 'edit') && (
                        <Link
                          href={`/customers/${customer.id}?edit=true`}
                          className="btn btn-sm btn-light border-0 p-1 rounded-circle text-secondary"
                          style={{ width: '26px', height: '26px' }}
                          title="Edit Customer"
                        >
                          <i className="bi bi-pencil" style={{ fontSize: '0.72rem' }}></i>
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredCustomers.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-5 text-muted small fw-600">
                  {customers.length === 0
                    ? 'No customer records found for the current company.'
                    : 'No customers match the selected state, district, or date criteria.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-2 border-top bg-light bg-opacity-50 d-flex justify-content-between align-items-center px-3">
          <span className="text-muted fw-semibold" style={{ fontSize: '0.7rem' }}>
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredCustomers.length)} of{' '}
            {filteredCustomers.length}
          </span>
          <PaginationComponent
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}
    </div>
  );
};

export default CustomerTable;
