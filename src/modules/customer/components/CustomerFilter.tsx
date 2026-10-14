'use client';

import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { setFilters, fetchDropdownCustomers } from '@/redux/features/customerSlice';
import SearchableSelect from '@/components/shared/SearchableSelect';

const CustomerFilter: React.FC = () => {
  const dispatch = useDispatch();
  const { filters, dropdownCustomers, items } = useSelector((state: RootState) => state.customers);
  const activeCompanyId = useSelector((state: RootState) => state.auth.company?.id);

  useEffect(() => {
    if (activeCompanyId && dropdownCustomers.length === 0) {
      dispatch(fetchDropdownCustomers({ company_id: activeCompanyId }) as any);
    }
  }, [activeCompanyId, dropdownCustomers.length, dispatch]);

  const customerList = dropdownCustomers.length > 0 ? dropdownCustomers : items;

  const customerOptions = useMemo(() => {
    const sorted = [...customerList].sort((a, b) =>
      (a.company || a.name || '').localeCompare(b.company || b.name || '')
    );
    return [
      { value: 'all', label: 'All Customers', displayLabel: 'All Customers' },
      ...sorted.map(c => ({
        value: String(c.id),
        label: c.company || c.name || `Customer #${c.id}`,
        displayLabel: c.company || c.name || `Customer #${c.id}`
      }))
    ];
  }, [customerList]);

  const handleCustomerChange = (val: string | number) => {
    dispatch(setFilters({ customerId: String(val) }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    dispatch(setFilters({ [name]: value }));
  };

  const hasActiveFilters = Boolean(
    (filters.customerId && filters.customerId !== 'all') ||
    filters.search ||
    (filters.status && filters.status !== 'all') ||
    filters.fromDate ||
    filters.toDate
  );

  const handleClear = () => {
    dispatch(setFilters({
      customerId: 'all',
      search: '',
      status: 'all',
      fromDate: '',
      toDate: ''
    }));
  };

  return (
    <div className="card filter-card mb-4" style={{ overflow: 'visible', position: 'relative', zIndex: 100 }}>
      <div className="card-body p-3" style={{ overflow: 'visible' }}>
        <div className="filter-bar-row d-flex flex-wrap gap-2 align-items-center">
          <div className="filter-item-select flex-grow-1 customer-select-filter" style={{ minWidth: '260px' }}>
            <SearchableSelect
              options={customerOptions}
              value={filters.customerId || 'all'}
              onChange={handleCustomerChange}
              placeholder="Select Customer"
              className="w-100"
            />
          </div>

          <div className="filter-item-select" style={{ minWidth: '150px' }}>
            <select
              className="form-select search-bar"
              name="status"
              value={filters.status}
              onChange={handleChange}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="lead">Lead</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="date-filter-group">
            <input 
              type="date" 
              className="text-muted" 
              name="fromDate"
              value={filters.fromDate}
              onChange={handleChange}
            />
            <span className="text-muted small fw-bold mx-1">TO</span>
            <input 
              type="date" 
              className="text-muted" 
              name="toDate"
              value={filters.toDate}
              onChange={handleChange}
            />
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1 shadow-none"
              style={{ height: '38px', borderRadius: '8px', fontSize: '0.78rem' }}
              onClick={handleClear}
              title="Reset all filters"
            >
              <i className="bi bi-x-circle"></i>
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .customer-select-filter :global(.form-select) {
          height: 42px !important;
          min-height: 42px !important;
          border-radius: 0.5rem !important;
          border: 1px solid #e2e8f0 !important;
          background-color: #fff !important;
          font-size: 0.875rem !important;
        }
      `}</style>
    </div>
  );
};

export default CustomerFilter;
