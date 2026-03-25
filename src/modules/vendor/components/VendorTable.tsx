'use client';

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/redux/store';
import { deleteVendor, setVendorPage, fetchVendors } from '@/redux/features/vendorSlice';
import Link from 'next/link';
import { Vendor } from '@/types/modules';
import { checkActionPermission } from '@/config/permissions';

const VendorTable: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items, filters, pagination, loading } = useSelector((state: RootState) => state.vendors);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  React.useEffect(() => {
    dispatch(fetchVendors(activeCompany?.id));
  }, [dispatch, activeCompany?.id]);
 
  const filteredItems = items.filter(item => {
    // 1. Context Sync: Ensure we only show vendors of the selected company (or all in Global View)
    // Check both camelCase and snake_case to support both freshly created and fetched items
    if (activeCompany && (item.companyId || item.company_id) !== activeCompany.id) return false;

    // 2. Search Filter
    const matchesSearch = item.name.toLowerCase().includes(filters.search.toLowerCase()) || 
                          (item.company && item.company.toLowerCase().includes(filters.search.toLowerCase()));
    
    // 3. Status/Category
    const matchesStatus = filters.status === 'all' || item.status === filters.status;
    const matchesCategory = filters.category === 'all' || item.category === filters.category;
    
    return matchesSearch && matchesStatus && matchesCategory;
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
    if (confirm('Are you sure you want to delete this vendor?')) {
      dispatch(deleteVendor(id));
    }
  };

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="px-4 py-3 border-0 text-nowrap">Sno</th>
                <th className="py-3 border-0 text-nowrap">Vendor Name</th>
                <th className="py-3 border-0 text-nowrap">Street 1</th>
                <th className="py-3 border-0 text-nowrap">Street 2</th>
                <th className="py-3 border-0 text-nowrap">City</th>
                <th className="py-3 border-0 text-nowrap">State</th>
                <th className="py-3 border-0 text-nowrap">State Code</th>
                <th className="py-3 border-0 text-nowrap">Area</th>
                <th className="py-3 border-0 text-nowrap">Pin Code</th>
                <th className="py-3 border-0 text-nowrap">Contact Person 1</th>
                <th className="py-3 border-0 text-nowrap">Designation 1</th>
                <th className="py-3 border-0 text-nowrap">Email id 1</th>
                <th className="py-3 border-0 text-nowrap">Phone Number 1</th>
                <th className="py-3 border-0 text-nowrap">Contact Person 2</th>
                <th className="py-3 border-0 text-nowrap">Designation 2</th>
                <th className="py-3 border-0 text-nowrap">Email id 2</th>
                <th className="py-3 border-0 text-nowrap">Phone Number 2</th>
                <th className="py-3 border-0 text-nowrap">Contact Person 3</th>
                <th className="py-3 border-0 text-nowrap">Designation 3</th>
                <th className="py-3 border-0 text-nowrap">Email id 3</th>
                <th className="py-3 border-0 text-nowrap">Phone Number 3</th>
                <th className="py-3 border-0 text-nowrap">Landline</th>
                <th className="py-3 border-0 text-nowrap">GSt</th>
                <th className="py-3 border-0 text-nowrap">Tin</th>
                <th className="py-3 border-0 text-nowrap">CST</th>
                <th className="py-3 border-0 text-nowrap">TC</th>
                <th className="py-3 border-0 text-nowrap">VMC</th>
                <th className="py-3 border-0 text-nowrap">HMC</th>
                <th className="py-3 border-0 text-nowrap">Vendor Type</th>
                <th className="py-3 border-0 text-center px-4 text-nowrap">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={30} className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {paginatedItems.map((vendor, index) => (
                    <tr key={vendor.id}>
                      <td className="px-4 text-nowrap text-muted small">{(pagination.currentPage - 1) * pagination.itemsPerPage + index + 1}</td>
                      <td className="text-nowrap fw-bold text-dark">{vendor.name || '-'}</td>
                      <td className="text-nowrap text-muted small">{vendor.street1 || '-'}</td>
                      <td className="text-nowrap text-muted small">{vendor.street2 || '-'}</td>
                      <td className="text-nowrap text-muted small">{vendor.city || '-'}</td>
                      <td className="text-nowrap text-muted small">{vendor.state || '-'}</td>
                      <td className="text-nowrap text-muted small">{vendor.stateCode || '-'}</td>
                      <td className="text-nowrap text-muted small">{vendor.area || '-'}</td>
                      <td className="text-nowrap text-muted small">{vendor.pinCode || '0'}</td>
                      
                      <td className="text-nowrap text-muted small">{vendor.contactPerson1 || '-'}</td>
                      <td className="text-nowrap text-muted small">{vendor.designation1 || '-'}</td>
                      <td className="text-nowrap text-muted small">{vendor.emailId1 || '-'}</td>
                      <td className="text-nowrap text-muted small">{vendor.phoneNumber1 || '-'}</td>
                      
                      <td className="text-nowrap text-muted small">{vendor.contactPerson2 || '-'}</td>
                      <td className="text-nowrap text-muted small">{vendor.designation2 || '-'}</td>
                      <td className="text-nowrap text-muted small">{vendor.emailId2 || '-'}</td>
                      <td className="text-nowrap text-muted small">{vendor.phoneNumber2 || '-'}</td>
                      
                      <td className="text-nowrap text-muted small">{vendor.contactPerson3 || '-'}</td>
                      <td className="text-nowrap text-muted small">{vendor.designation3 || '-'}</td>
                      <td className="text-nowrap text-muted small">{vendor.emailId3 || '-'}</td>
                      <td className="text-nowrap text-muted small">{vendor.phoneNumber3 || '-'}</td>
                      
                      <td className="text-nowrap text-muted small">{vendor.landline || '0'}</td>
                      <td className="text-nowrap text-muted small">{vendor.gst || '-'}</td>
                      <td className="text-nowrap text-muted small">{vendor.tin || '-'}</td>
                      <td className="text-nowrap text-muted small">{vendor.cst || '-'}</td>
                      <td className="text-nowrap text-muted small">{vendor.tc || '0'}</td>
                      <td className="text-nowrap text-muted small">{vendor.vmc || '0'}</td>
                      <td className="text-nowrap text-muted small">{vendor.hmc || '0'}</td>
                      <td className="text-nowrap text-muted small">{vendor.vendorType || 'vendor'}</td>
                      
                      <td className="text-center px-4 text-nowrap">
                        <div className="d-flex justify-content-center gap-1">
                          {user && checkActionPermission(user, 'mod_vendor', 'edit') && (
                            <Link href={`/vendors/${vendor.id}/edit`} className="btn btn-sm btn-success border-0 rounded-1 text-white p-1 px-2" title="Edit">
                              <i className="bi bi-pencil-fill xs-small"></i>
                            </Link>
                          )}
                          {user && checkActionPermission(user, 'mod_vendor', 'delete') && (
                            <button 
                              className="btn btn-sm btn-danger border-0 rounded-1 text-white p-1 px-2"
                              onClick={() => handleDelete(vendor.id)}
                            >
                              <i className="bi bi-x-lg xs-small"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginatedItems.length === 0 && (
                    <tr>
                      <td colSpan={30} className="text-center py-5 text-muted">
                        No vendors found matching your filters.
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-4 py-3 border-top d-flex align-items-center justify-content-between">
            <div className="text-muted small">
              Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} to {Math.min(pagination.currentPage * pagination.itemsPerPage, filteredItems.length)} of {filteredItems.length} entries
            </div>
            <nav aria-label="Table navigation">
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${pagination.currentPage === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => dispatch(setVendorPage(pagination.currentPage - 1))}>
                    <i className="bi bi-chevron-left"></i>
                  </button>
                </li>
                {[...Array(totalPages)].map((_, i) => (
                  <li key={i} className={`page-item ${pagination.currentPage === i + 1 ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => dispatch(setVendorPage(i + 1))}>
                      {i + 1}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${pagination.currentPage === totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => dispatch(setVendorPage(pagination.currentPage + 1))}>
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

export default VendorTable;
