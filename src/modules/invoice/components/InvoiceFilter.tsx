'use client';

import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { setInvoiceFilters } from '@/redux/features/invoiceSlice';
import { fetchProcesses } from '@/redux/features/masterSlice';
import { fetchCustomers } from '@/redux/features/customerSlice';
import { fetchVendors } from '@/redux/features/vendorSlice';
import SearchableSelect from '@/components/shared/SearchableSelect';
import PartyTypeToggle from '@/components/shared/PartyTypeToggle';
import { useSearchParams } from 'next/navigation';

const InvoiceFilter: React.FC = () => {
  const dispatch = useDispatch();
  const { filters } = useSelector((state: RootState) => state.invoices);
  const { processes } = useSelector((state: RootState) => state.master);
  const { items: customers } = useSelector((state: RootState) => state.customers);
  const { items: vendors } = useSelector((state: RootState) => state.vendors);
  const activeCompanyId = useSelector((state: RootState) => state.auth.company?.id);
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'ADD_INVOICE';
  const isInvoiceSelectionTab = activeTab === 'ADD_INVOICE';

  const partyType = (filters as any).partyType || 'customer';
  const isVendor = partyType === 'vendor';

  useEffect(() => {
    if (activeCompanyId) {
      if (processes.length === 0) {
        dispatch(fetchProcesses({ company_id: activeCompanyId, limit: 100 }) as any);
      }
      if (customers.length === 0) {
        dispatch(fetchCustomers({ company_id: activeCompanyId, limit: 1000 }) as any);
      }
      if (vendors.length === 0) {
        dispatch(fetchVendors({ company_id: activeCompanyId, limit: 1000 }) as any);
      }
    }
  }, [activeCompanyId, processes.length, customers.length, vendors.length, dispatch]);

  const partyOptions = useMemo(() => {
    if (isVendor) {
      const sorted = [...vendors].sort((a, b) =>
        (a.name || a.company || '').localeCompare(b.name || b.company || '')
      );
      return [
        { value: 'all', label: 'All Vendors', displayLabel: 'All Vendors' },
        ...sorted.map(v => ({
          value: String(v.id),
          label: v.name || v.company || `Vendor #${v.id}`,
          displayLabel: v.name || v.company || `Vendor #${v.id}`
        }))
      ];
    } else {
      const sorted = [...customers].sort((a, b) =>
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
    }
  }, [isVendor, vendors, customers]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    dispatch(setInvoiceFilters({ [name]: value }));
  };

  const handlePartyChange = (val: string | number) => {
    dispatch(setInvoiceFilters({ customerId: String(val) }));
  };

  const hasActiveFilters = Boolean(
    filters.search ||
    (filters.status && filters.status !== 'all') ||
    filters.fromDate ||
    filters.toDate ||
    (filters.process && filters.process !== 'all') ||
    (filters.customerId && filters.customerId !== 'all')
  );

  return (
    <div className="card filter-card" style={{ overflow: 'visible', position: 'relative', zIndex: 100 }}>
      <div className="card-body p-3" style={{ overflow: 'visible' }}>
        {/* Row 1: Primary Search Row */}
        <div className="row g-2 align-items-center mb-3">
          {/* Left Side: Party Type Toggle & General Invoice/DC/PO Search */}
          <div className="col-12 col-lg-6">
            <div className="d-flex gap-2 align-items-center">
              <div className="filter-item-select" style={{ minWidth: '150px', flexShrink: 0 }}>
                <PartyTypeToggle
                  partyType={partyType}
                  setPartyType={(type) => dispatch(setInvoiceFilters({ partyType: type, customerId: 'all' }))}
                />
              </div>

              <div className="filter-item-search flex-grow-1">
                <div className="search-group">
                  <span className="input-group-text">
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control search-bar"
                    placeholder="Search by invoice number, DC, PO..."
                    name="search"
                    value={filters.search}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Customer Search Dropdown (FULL WIDTH) */}
          <div className="col-12 col-lg-6">
            <div className="invoice-customer-filter w-100">
              <SearchableSelect
                options={partyOptions}
                value={filters.customerId || 'all'}
                onChange={handlePartyChange}
                placeholder={isVendor ? 'Select Vendor' : 'Select Customer'}
                className="w-100"
              />
            </div>
          </div>
        </div>

        {/* Row 2: Secondary Filters & Clear */}
        <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between pt-2 border-top border-light-subtle">
          <div className="d-flex flex-wrap gap-2 align-items-center">
            {!isInvoiceSelectionTab && (
              <>
                <div className="filter-item-select" style={{ minWidth: '160px' }}>
                  <select
                    className="form-select search-bar"
                    name="process"
                    value={filters.process || 'all'}
                    onChange={handleChange}
                  >
                    <option value="all">All Processes</option>
                    {processes.map(p => (
                      <option key={p.id} value={p.processName}>{p.processName}</option>
                    ))}
                  </select>
                </div>
                <div className="filter-item-select" style={{ minWidth: '140px' }}>
                  <select
                    className="form-select search-bar"
                    name="status"
                    value={filters.status}
                    onChange={handleChange}
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </>
            )}

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
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1 shadow-none"
              style={{ height: '38px', borderRadius: '8px', fontSize: '0.78rem' }}
              onClick={() => dispatch(setInvoiceFilters({ search: '', status: 'all', fromDate: '', toDate: '', process: 'all', customerId: 'all' }))}
              title="Reset all filters"
            >
              <i className="bi bi-x-circle"></i>
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .invoice-customer-filter :global(.form-select) {
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

export default InvoiceFilter;
