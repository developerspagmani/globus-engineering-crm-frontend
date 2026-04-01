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
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-body py-3">
        <div className="d-flex flex-wrap align-items-center gap-2">
          {/* Search Bar */}
          <div className="flex-grow-1" style={{ minWidth: '300px' }}>
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0 py-2">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0 py-2"
                placeholder="Search by invoice number or customer..."
                name="search"
                value={filters.search}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Status Dropdown */}
          <div style={{ width: '150px' }}>
            <select
              className="form-select py-2"
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

          {/* Date Filters */}
          <div className="d-flex align-items-center gap-2">
            <div style={{ width: '150px' }}>
              <input 
                type="date" 
                className="form-control py-2" 
                name="fromDate"
                value={filters.fromDate}
                onChange={handleChange}
              />
            </div>
            <span className="text-muted small fw-bold">TO</span>
            <div style={{ width: '150px' }}>
              <input 
                type="date" 
                className="form-control py-2"
                name="toDate"
                value={filters.toDate}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .form-control {
          font-size: 0.85rem !important;
        }
        .form-select {
          font-size: 0.85rem !important;
          }
      `}</style>
    </div>
  );
};

export default InvoiceFilter;
