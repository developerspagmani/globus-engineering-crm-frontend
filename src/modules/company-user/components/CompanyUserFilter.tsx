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
        <div className="filter-bar-row">
          <div className="filter-item-search">
            <div className="search-group">
              <span className="input-group-text">
                <i className="bi bi-search"></i>
              </span>
              <input 
                type="text" 
                className="form-control search-bar" 
                placeholder="Search users by name, email..." 
                value={filters.search}
                onChange={(e) => dispatch(setUserFilters({ search: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="filter-item-select">
            <select 
              className="form-select search-bar"
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
