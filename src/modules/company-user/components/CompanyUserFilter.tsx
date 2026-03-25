'use client';

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { setUserFilters } from '@/redux/features/companyUserSlice';

const CompanyUserFilter: React.FC = () => {
  const dispatch = useDispatch();
  const { filters } = useSelector((state: RootState) => state.companyUsers);

  return (
    <div className="card shadow-sm border-0 mb-4 overflow-hidden">
      <div className="card-body p-3">
        <div className="row g-3">
          <div className="col-md-8">
            <div className="input-group group-pill bg-light rounded-pill px-2">
              <span className="input-group-text bg-transparent border-0 text-muted ps-3">
                <i className="bi bi-search"></i>
              </span>
              <input 
                type="text" 
                className="form-control bg-transparent border-0 shadow-none ps-0" 
                placeholder="Search users by name, email..." 
                value={filters.search}
                onChange={(e) => dispatch(setUserFilters({ search: e.target.value }))}
              />
            </div>
          </div>
          <div className="col-md-4">
            <select 
              className="form-select border-0 bg-light rounded-pill px-4 shadow-none fw-600 text-muted"
              value={filters.role}
              onChange={(e) => dispatch(setUserFilters({ role: e.target.value }))}
            >
              <option value="all">All Roles</option>
              <option value="super_admin">Super Admins</option>
              <option value="company_admin">Admins</option>
              <option value="manager">Managers</option>
              <option value="sales_agent">Sales Agents</option>
              <option value="staff">Staff</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyUserFilter;
