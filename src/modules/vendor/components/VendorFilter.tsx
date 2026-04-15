'use client';

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { setVendorFilters } from '@/redux/features/vendorSlice';

const VendorFilter: React.FC = () => {
  const dispatch = useDispatch();
  const { filters } = useSelector((state: RootState) => state.vendors);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    dispatch(setVendorFilters({ [name]: value }));
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
                  placeholder="Search vendors, companies..."
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
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="filter-item-select">
              <select
                className="form-select search-bar"
                name="category"
                value={filters.category}
                onChange={handleChange}
              >
                <option value="all">Categories</option>
                <option value="Raw Materials">Raw Materials</option>
                <option value="Logistics">Logistics</option>
                <option value="Machinery">Machinery</option>
                <option value="Electrical">Electrical</option>
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

export default VendorFilter;
