'use client';

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import Link from 'next/link';
import { Customer } from '@/types/modules';
import { checkActionPermission } from '@/config/permissions';
import PaginationComponent from '@/components/shared/Pagination';

interface CustomerTableProps {
  customers: Customer[];
  selectedRegion: string | null;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  onLocate?: (customer: Customer) => void;
}

const CustomerTable: React.FC<CustomerTableProps> = ({ 
  customers, 
  selectedRegion, 
  searchQuery, 
  onSearchChange,
  onLocate 
}) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(customers.length / itemsPerPage);
  const paginatedItems = customers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="h-100 d-flex flex-column">
      <div className="card-header bg-white border-0 p-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h5 className="fw-800 text-dark mb-0">
            {selectedRegion ? `${selectedRegion} Accounts` : 'Regional Accounts'}
          </h5>
          <p className="text-muted x-small mb-0 fw-600 uppercase tracking-widest mt-1">
            {customers.length} ENROLLED CLIENTS
          </p>
        </div>
        {/* {onSearchChange && (
          <div className="position-relative" style={{ width: '200px' }}>
            <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted small"></i>
            <input
              type="text"
              className="form-control form-control-sm ps-5 bg-light border-0 rounded-3 text-dark small"
              placeholder="Search in region..."
              value={searchQuery || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{ paddingLeft: '2.2rem', fontSize: '0.8rem' }}
            />
          </div>
        )} */}
      </div>
      
      <div className="table-responsive flex-grow-1 p-1">
        <table className="table mb-0 align-middle">
          <thead className="bg-light bg-opacity-50">
            <tr>
              <th className="px-4 py-3 x-small fw-800 text-muted text-capitalize tracking-widest border-bottom-0">Sno</th>
              <th className="py-3 x-small fw-800 text-muted text-capitalize tracking-widest border-bottom-0">Customer</th>
              <th className="py-3 x-small fw-800 text-muted text-capitalize tracking-widest border-bottom-0">Contact</th>
              <th className="px-4 py-3 x-small fw-800 text-muted text-capitalize tracking-widest border-bottom-0 text-end">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((customer, index) => (
              <tr key={customer.id} className="border-bottom text-dark">
                <td className="px-4 py-3 text-muted small">
                  {(currentPage - 1) * itemsPerPage + index + 1}
                </td>
                <td className="py-3">
                  <div className="fw-800 text-dark small">{customer.company || customer.name}</div>
                  <div className="x-small text-muted fw-600">{customer.industry || 'Industrial'}</div>
                </td>
                <td className="py-3">
                  <div className="small fw-700">{customer.name}</div>
                  <div className="x-small text-muted">{customer.phone || customer.email}</div>
                </td>
                <td className="px-4 py-3 text-end">
                  <div className="d-flex justify-content-end gap-1">
                    {/* {onLocate && customer.state && (
                      <button 
                        onClick={() => onLocate(customer)} 
                        className="btn btn-sm btn-light border-0 rounded-circle text-primary" 
                        title="Locate on Map"
                        style={{ width: '28px', height: '28px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <i className="bi bi-geo-alt-fill" style={{ fontSize: '0.85rem' }}></i>
                      </button>
                    )} */}
                    <Link href={`/customers/${customer.id}`} className="btn-action-view" title="View Detail">
                      <i className="bi bi-eye-fill"></i>
                    </Link>
                    {checkActionPermission(user, 'mod_customer', 'edit') && (
                      <Link href={`/customers/${customer.id}?edit=true`} className="btn-action-edit" title="Edit Customer">
                        <i className="bi bi-pencil-fill"></i>
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-5 text-muted small fw-600">
                  Select a region on the map to view associated accounts.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="p-3 border-top bg-light d-flex justify-content-between align-items-center px-4">
          <span className="text-muted small">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, customers.length)} of {customers.length}
          </span>
          <PaginationComponent 
            currentPage={currentPage} 
            totalPages={totalPages} 
            onPageChange={(page) => setCurrentPage(page)} 
          />
        </div>
      )}
    </div>
  );
};

export default CustomerTable;
