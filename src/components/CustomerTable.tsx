'use client';

import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import Link from 'next/link';
import { Customer } from '@/types/modules';
import { checkActionPermission } from '@/config/permissions';
import PaginationComponent from '@/components/shared/Pagination';

interface CustomerTableProps {
  customers: Customer[];
  selectedRegion: string | null;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  onLocate?: (customer: Customer) => void;
}

// Canonical Indian state names
const CANONICAL_STATES: Record<string, string> = {
  'ANDHRA PRADESH': 'Andhra Pradesh',
  'ANDHRA': 'Andhra Pradesh',
  'ANDHRAPRADESH': 'Andhra Pradesh',
  'ARUNACHAL PRADESH': 'Arunachal Pradesh',
  'ASSAM': 'Assam',
  'BIHAR': 'Bihar',
  'CHANDIGARH': 'Chandigarh',
  'CHHATTISGARH': 'Chhattisgarh',
  'CHATTISGARH': 'Chhattisgarh',
  'CHHATISGARH': 'Chhattisgarh',
  'CHATISGARH': 'Chhattisgarh',
  'CHATTISGAR': 'Chhattisgarh',
  'GOA': 'Goa',
  'GUJARAT': 'Gujarat',
  'HARYANA': 'Haryana',
  'HARIYANA': 'Haryana',
  'HIMACHAL PRADESH': 'Himachal Pradesh',
  'HP': 'Himachal Pradesh',
  'JAMMU AND KASHMIR': 'Jammu & Kashmir',
  'JAMMU & KASHMIR': 'Jammu & Kashmir',
  'J&K': 'Jammu & Kashmir',
  'JHARKHAND': 'Jharkhand',
  'JHARKAND': 'Jharkhand',
  'KARNATAKA': 'Karnataka',
  'KARNATAKE': 'Karnataka',
  'KARNATAK': 'Karnataka',
  'BANGALORE': 'Karnataka',
  'KERALA': 'Kerala',
  'LADAKH': 'Ladakh',
  'LAKSHADWEEP': 'Lakshadweep',
  'MADHYA PRADESH': 'Madhya Pradesh',
  'MP': 'Madhya Pradesh',
  'MAHARASHTRA': 'Maharashtra',
  'MAHARASTRA': 'Maharashtra',
  'MAHARASTRA STATE': 'Maharashtra',
  'MANIPUR': 'Manipur',
  'MEGHALAYA': 'Meghalaya',
  'MIZORAM': 'Mizoram',
  'NAGALAND': 'Nagaland',
  'ODISHA': 'Odisha',
  'ODHISHA': 'Odisha',
  'ORISSA': 'Odisha',
  'PUDUCHERRY': 'Puducherry',
  'PONDICHERRY': 'Puducherry',
  'PUNJAB': 'Punjab',
  'RAJASTHAN': 'Rajasthan',
  'SIKKIM': 'Sikkim',
  'TAMIL NADU': 'Tamil Nadu',
  'TAMILNADU': 'Tamil Nadu',
  'TN': 'Tamil Nadu',
  'TELANGANA': 'Telangana',
  'TRIPURA': 'Tripura',
  'UTTAR PRADESH': 'Uttar Pradesh',
  'UP': 'Uttar Pradesh',
  'UTTARAKHAND': 'Uttarakhand',
  'UTTARANCHAL': 'Uttarakhand',
  'WEST BENGAL': 'West Bengal',
  'WB': 'West Bengal',
  'DELHI': 'Delhi',
  'NEW DELHI': 'Delhi',
  'NCT': 'Delhi',
  'DELHI NCT': 'Delhi',
};

// Returns canonical state name or null if junk
const canonicalState = (raw: string | undefined | null): string | null => {
  const trimmed = (raw || '').trim();
  if (!trimmed) return null;
  // Filter out pure numbers or short junk values
  if (/^\d+$/.test(trimmed)) return null;
  if (trimmed.length < 2) return null;
  const upper = trimmed.toUpperCase();
  return CANONICAL_STATES[upper] || toTitleCase(trimmed);
};



// Always normalize to UPPERCASE for consistent comparison
const norm = (s: string | undefined | null) => (s || '').trim().toUpperCase();

// Title case for display only
const toTitleCase = (s: string) =>
  s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

// Get district value: district field or city as fallback
const getDistrict = (c: Customer) =>
  (c.district || (c as any).city || '').trim();

const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  selectedRegion,
  searchQuery,
  onSearchChange,
  onLocate,
}) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterState, setFilterState] = useState(''); // stored as UPPERCASE
  const [filterDistrict, setFilterDistrict] = useState(''); // stored as UPPERCASE
  const itemsPerPage = 10;

  // Unique states deduplicated by canonical name (handles all misspellings)
  const uniqueStates = useMemo(() => {
    const seen = new Set<string>();
    customers.forEach((c) => {
      const canonical = canonicalState(c.state);
      if (canonical) seen.add(canonical);
    });
    return [...seen].sort();
  }, [customers]);

  // Unique districts for the selected state (or all), deduplicated
  const uniqueDistricts = useMemo(() => {
    const seen = new Set<string>();
    customers.forEach((c) => {
      if (filterState && canonicalState(c.state) !== filterState) return;
      const d = toTitleCase(getDistrict(c));
      if (d) seen.add(d);
    });
    return [...seen].sort();
  }, [customers, filterState]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchState = !filterState || canonicalState(c.state) === filterState;
      const matchDistrict =
        !filterDistrict || toTitleCase(getDistrict(c)) === filterDistrict;
      return matchState && matchDistrict;
    });
  }, [customers, filterState, filterDistrict]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedItems = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleStateFilter = (val: string) => {
    setFilterState(val); // val is already UPPERCASE from option value
    setFilterDistrict('');
    setCurrentPage(1);
  };

  const handleDistrictFilter = (val: string) => {
    setFilterDistrict(val);
    setCurrentPage(1);
  };

  const hasFilters = filterState || filterDistrict;

  return (
    <div className="h-100 d-flex flex-column">
      <div className="card-header bg-white border-0 p-4 pb-2">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <div>
            <h5 className="fw-800 text-dark mb-0">
              {selectedRegion ? `${selectedRegion} Accounts` : 'Regional Accounts'}
            </h5>
            <p className="text-muted x-small mb-0 fw-600 uppercase tracking-widest mt-1">
              {filteredCustomers.length}
              {hasFilters ? ` of ${customers.length}` : ''} ENROLLED CLIENTS
            </p>
          </div>
        </div>

        {/* Filter Row — State and District dropdowns */}
        <div className="d-flex flex-wrap gap-2 align-items-center">
          {/* State Filter */}
          <select
            className="form-select form-select-sm bg-light border-0 rounded-3"
            style={{ minWidth: '130px', maxWidth: '165px', fontSize: '0.78rem' }}
            value={filterState}
            onChange={(e) => handleStateFilter(e.target.value)}
          >
            <option value="">All States</option>
            {uniqueStates.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* District Filter */}
          <select
            className="form-select form-select-sm bg-light border-0 rounded-3"
            style={{ minWidth: '130px', maxWidth: '165px', fontSize: '0.78rem' }}
            value={filterDistrict}
            onChange={(e) => handleDistrictFilter(e.target.value)}
            disabled={uniqueDistricts.length === 0}
          >
            <option value="">All Districts</option>
            {uniqueDistricts.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Clear button */}
          {hasFilters && (
            <button
              className="btn btn-sm btn-outline-secondary border-0 rounded-3"
              style={{ fontSize: '0.75rem' }}
              onClick={() => {
                setFilterState('');
                setFilterDistrict('');
                setCurrentPage(1);
              }}
            >
              <i className="bi bi-x-lg me-1"></i>Clear
            </button>
          )}
        </div>
      </div>

      <div className="table-responsive flex-grow-1 p-1">
        <table className="table mb-0 align-middle">
          <thead className="bg-light bg-opacity-50">
            <tr>
              <th className="px-4 py-3 x-small fw-800 text-muted text-capitalize tracking-widest border-bottom-0">Sno</th>
              <th className="py-3 x-small fw-800 text-muted text-capitalize tracking-widest border-bottom-0">Customer</th>
              <th className="py-3 x-small fw-800 text-muted text-capitalize tracking-widest border-bottom-0">Contact</th>
              <th className="py-3 x-small fw-800 text-muted text-capitalize tracking-widest border-bottom-0">District</th>
              <th className="py-3 x-small fw-800 text-muted text-capitalize tracking-widest border-bottom-0">State</th>
              <th className="px-4 py-3 x-small fw-800 text-muted text-capitalize tracking-widest border-bottom-0 text-end">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((customer, index) => (
              <tr key={customer.id} className="border-bottom text-dark">
                <td className="px-4 py-3 text-muted small">
                  {(currentPage - 1) * itemsPerPage + index + 1}
                </td>
                <td className="py-3">
                  <div className="fw-800 text-dark small">{customer.company || customer.name}</div>
                  <div className="x-small text-muted fw-600">{customer.industry || 'Industrial'}</div>
                </td>
                <td className="py-3">
                  <div className="small fw-700">{customer.name}</div>
                  <div className="x-small text-muted">{customer.phone || customer.email}</div>
                </td>
                <td className="py-3">
                  <span className="small text-muted fw-600">
                    {toTitleCase(getDistrict(customer)) || '-'}
                  </span>
                </td>
                <td className="py-3">
                  <span className="small text-muted fw-600">
                    {customer.state ? toTitleCase(customer.state) : '-'}
                  </span>
                </td>
                <td className="px-4 py-3 text-end">
                  <div className="d-flex justify-content-end gap-1">
                    <Link href={`/customers/${customer.id}`} className="btn-action-view" title="View Detail">
                      <i className="bi bi-eye-fill"></i>
                    </Link>
                    {checkActionPermission(user, 'mod_customer', 'edit') && (
                      <Link href={`/customers/${customer.id}?edit=true`} className="btn-action-edit" title="Edit Customer">
                        <i className="bi bi-pencil-fill"></i>
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredCustomers.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-5 text-muted small fw-600">
                  {customers.length === 0
                    ? 'Select a region on the map to view associated accounts.'
                    : 'No customers match your filters.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="p-3 border-top bg-light d-flex justify-content-between align-items-center px-4">
          <span className="text-muted small">
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
