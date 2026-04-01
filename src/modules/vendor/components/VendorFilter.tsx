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
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-body">
        <div className="row g-3">
          <div className="col-md-6 col-lg-4">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search vendors, companies..."
                name="search"
                value={filters.search}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="col-md-3 col-lg-2">
            <select
              className="form-select"
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
          <div className="col-lg-4 col-md-12 d-flex align-items-center gap-2">
            <div style={{ width: '170px' }}>
              <input 
                type="date" 
                className="form-control" 
                name="fromDate"
                value={filters.fromDate}
                onChange={handleChange}
              />
            </div>
            <span className="text-muted small fw-bold">TO</span>
            <div style={{ width: '170px' }}>
              <input 
                type="date" 
                className="form-control"
                name="toDate"
                value={filters.toDate}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="col-md-3 col-lg-2">
            <select
              className="form-select"
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
        </div>
      </div>
    </div>
  );
};

export default VendorFilter;
