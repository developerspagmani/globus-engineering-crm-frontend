'use client';

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { setInvoiceFilters } from '@/redux/features/invoiceSlice';

const InvoiceFilter: React.FC = () => {
  const dispatch = useDispatch();
  const { filters } = useSelector((state: RootState) => state.invoices);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    dispatch(setInvoiceFilters({ [name]: value }));
  };


  return (
    <div className="card filter-card">
      <div className="card-body">
        <div className="filter-bar-row">
          <div className="filter-item-search">
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

          <div className="filter-item-select">
            <select
              className="form-select search-bar"
              name="status"
              value={filters.status}
              onChange={handleChange}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
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
        </div>
      </div>
    </div>
  );
};

export default InvoiceFilter;
