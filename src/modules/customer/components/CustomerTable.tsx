'use client';

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { deleteCustomer, setPage, fetchCustomers } from '@/redux/features/customerSlice';
import Link from 'next/link';
import { Customer } from '@/types/modules';
import { checkActionPermission } from '@/config/permissions';

const CustomerTable: React.FC = () => {
  const dispatch = useDispatch();
  const { user, company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items, filters, pagination, loading } = useSelector((state: RootState) => state.customers);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  React.useEffect(() => {
    (dispatch as any)(fetchCustomers(activeCompany?.id));
  }, [dispatch, activeCompany?.id]);
 
  // Filter logic
  const filteredItems = items.filter(item => {
    // Role-based filtering:
    // Super Admin sees everything. 
    // Others only see items matching their active company.
    if (user?.role !== 'super_admin') {
      if (!activeCompany) return false; 
      const itemCompanyId = item.company_id || (item as any).companyId;
      if (itemCompanyId !== activeCompany.id) return false;
    }

    // Role-based Data Isolation
    if (user?.role === 'sales_agent' && item.agentId !== user.id) {
      return false;
    }

    const matchesSearch = String(item.name || '').toLowerCase().includes(filters.search.toLowerCase()) || 
                         String(item.company || '').toLowerCase().includes(filters.search.toLowerCase());
    const matchesStatus = filters.status === 'all' || item.status === filters.status;
    const matchesIndustry = filters.industry === 'all' || item.industry === filters.industry;
    return matchesSearch && matchesStatus && matchesIndustry;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredItems.length / pagination.itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (pagination.currentPage - 1) * pagination.itemsPerPage,
    pagination.currentPage * pagination.itemsPerPage
  );

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedItems.map(item => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      (dispatch as any)(deleteCustomer(id));
    }
  };

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th className="px-4 py-3 border-0">Sno</th>
                <th className="py-3 border-0">Customer Name</th>
                <th className="py-3 border-0">Email</th>
                <th className="py-3 border-0">Phone Number</th>
                <th className="py-3 border-0">GSTN</th>
                <th className="py-3 border-0 text-center px-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-5">
                    <div className="d-flex flex-column align-items-center gap-3">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <span className="text-muted small fw-bold text-uppercase tracking-wider">Fetching Customers...</span>
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {paginatedItems.map((customer, index) => (
                    <tr key={customer.id}>
                      <td className="px-4 text-nowrap text-muted small">{(pagination.currentPage - 1) * pagination.itemsPerPage + index + 1}</td>
                      <td className="text-nowrap fw-bold text-dark">{customer.name || '-'}</td>
                      <td className="text-nowrap text-muted small">{customer.email || customer.emailId1 || '-'}</td>
                      <td className="text-nowrap text-muted small">{customer.phone || customer.phoneNumber1 || '-'}</td>
                      <td className="text-nowrap text-muted small"><span className="badge bg-light text-dark border-0 shadow-sm">{customer.gst || '-'}</span></td>
                      
                      <td className="text-center px-4 text-nowrap">
                        <div className="d-flex justify-content-center gap-2">
                          {checkActionPermission(user, 'mod_customer', 'edit') && (
                            <Link href={`/customers/${customer.id}/edit`} className="btn-action-edit" title="Edit">
                              <i className="bi bi-pencil-fill"></i>
                            </Link>
                          )}
                          {checkActionPermission(user, 'mod_customer', 'delete') && (
                            <button 
                              className="btn-action-delete"
                              onClick={() => handleDelete(customer.id)}
                              title="Delete"
                            >
                              <i className="bi bi-x-lg"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginatedItems.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-5 text-muted">
                        No customers found matching your filters.
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Rendering */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-top d-flex align-items-center justify-content-between">
            <div className="text-muted small">
              Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} to {Math.min(pagination.currentPage * pagination.itemsPerPage, filteredItems.length)} of {filteredItems.length} entries
            </div>
            <nav aria-label="Table navigation">
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${pagination.currentPage === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => dispatch(setPage(pagination.currentPage - 1))}>
                    <i className="bi bi-chevron-left"></i>
                  </button>
                </li>
                {[...Array(totalPages)].map((_, i) => (
                  <li key={i} className={`page-item ${pagination.currentPage === i + 1 ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => dispatch(setPage(i + 1))}>
                      {i + 1}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${pagination.currentPage === totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => dispatch(setPage(pagination.currentPage + 1))}>
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerTable;
