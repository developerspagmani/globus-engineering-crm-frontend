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
                placeholder="Search by customer name..."
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
              <option value="active">Active</option>
              <option value="lead">Lead</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="filter-item-select">
            <select
              className="form-select search-bar"
              name="industry"
              value={filters.industry}
              onChange={handleChange}
            >
              <option value="all">Industries</option>
              <option value="Automotive">Automotive</option>
              <option value="Electronics">Electronics</option>
              <option value="Construction">Construction</option>
              <option value="Machinery">Machinery</option>
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
            <span className="text-muted small fw-bold mx-1">To</span>
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

export default CustomerFilter;
