'use client';

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { setFilters } from '@/redux/features/customerSlice';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const CustomerFilter: React.FC = () => {
  const dispatch = useDispatch();
  const { filters } = useSelector((state: RootState) => state.customers);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    dispatch(setFilters({ [name]: value }));
  };

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-body">
        <div className="d-flex flex-wrap align-items-center gap-2">
          {/* Search Bar */}
          <div className="flex-grow-1" style={{ minWidth: '300px' }}>
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0 search-bar"
                placeholder="Search by Customer Name..."
                name="search"
                value={filters.search}
                onChange={handleChange}
                style={{ height: '42px' }}
              />
            </div>
          </div>

          {/* Status Dropdown */}
          <div style={{ width: '180px' }}>
            <select
              className="form-select"
              name="status"
              value={filters.status}
              onChange={handleChange}
              style={{ height: '42px', borderRadius: '8px' }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="lead">Lead</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Industry Dropdown */}
          <div style={{ width: '180px' }}>
            <select
              className="form-select"
              name="industry"
              value={filters.industry}
              onChange={handleChange}
              style={{ height: '42px', borderRadius: '8px' }}
            >
              <option value="all">Industries</option>
              <option value="Automotive">Automotive</option>
              <option value="Electronics">Electronics</option>
              <option value="Construction">Construction</option>
              <option value="Machinery">Machinery</option>
            </select>
          </div>

          {/* Date Filters */}
          <div className="d-flex align-items-center gap-2 bg-white px-3 py-1 shadow-sm border" style={{ borderRadius: '8px', height: '42px' }}>
            <input 
              type="date" 
              className="form-control py-1 border-0 shadow-none bg-transparent" 
              name="fromDate"
              value={filters.fromDate}
              onChange={handleChange}
              style={{ fontSize: '0.85rem' }}
            />
          </div>
          <span className="text-muted small fw-bold mx-1">TO</span>
          <div className="d-flex align-items-center gap-2 bg-white px-3 py-1 shadow-sm border" style={{ borderRadius: '8px', height: '42px' }}>
            <input 
              type="date" 
              className="form-control py-1 border-0 shadow-none bg-transparent" 
              name="toDate"
              value={filters.toDate}
              onChange={handleChange}
              style={{ fontSize: '0.85rem' }}
            />
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

export default CustomerFilter;
