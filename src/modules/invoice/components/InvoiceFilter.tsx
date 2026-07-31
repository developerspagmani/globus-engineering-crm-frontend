'use client';

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { setInvoiceFilters } from '@/redux/features/invoiceSlice';
import { fetchProcesses } from '@/redux/features/masterSlice';
import PartyTypeToggle from '@/components/shared/PartyTypeToggle';
import { useSearchParams } from 'next/navigation';

const InvoiceFilter: React.FC = () => {
  const dispatch = useDispatch();
  const { filters } = useSelector((state: RootState) => state.invoices);
  const { processes } = useSelector((state: RootState) => state.master);
  const activeCompanyId = useSelector((state: RootState) => state.auth.company?.id);
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'ADD_INVOICE';
  const isInvoiceSelectionTab = activeTab === 'ADD_INVOICE';

  useEffect(() => {
    if (activeCompanyId && processes.length === 0) {
      dispatch(fetchProcesses({ company_id: activeCompanyId, limit: 100 }) as any);
    }
  }, [activeCompanyId, processes.length, dispatch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    dispatch(setInvoiceFilters({ [name]: value }));
  };


  return (
    <div className="card filter-card">
      <div className="card-body p-3">
        <div className="d-flex flex-wrap gap-2 align-items-center pb-1">
          <div className="filter-item-select" style={{ minWidth: '150px' }}>
            <PartyTypeToggle
              partyType={(filters as any).partyType || 'customer'}
              setPartyType={(type) => dispatch(setInvoiceFilters({ partyType: type }))}
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
                placeholder="Search by invoice number or customer..."
                name="search"
                value={filters.search}
                onChange={handleChange}
              />
            </div>
          </div>

          {!isInvoiceSelectionTab && (
            <>
              <div className="filter-item-select">
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
              <div className="filter-item-select">
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
      </div>
    </div>
  );
};

export default InvoiceFilter;
