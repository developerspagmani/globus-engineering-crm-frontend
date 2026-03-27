'use client';

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { setFilters } from '@/redux/features/customerSlice';

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
        <div className="row g-3">
          <div className="col-md-6 col-lg-8">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search customers, companies..."
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
              <option value="lead">Lead</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="col-md-3 col-lg-2">
            <select
              className="form-select"
              name="industry"
              value={filters.industry}
              onChange={handleChange}
            >
              <option value="all">All Industry</option>
              <option value="Automotive">Automotive</option>
              <option value="Electronics">Electronics</option>
              <option value="Construction">Construction</option>
              <option value="Machinery">Machinery</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerFilter;
