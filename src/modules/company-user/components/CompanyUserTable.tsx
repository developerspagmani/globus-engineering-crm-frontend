'use client';

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { deleteUserAsync } from '@/redux/features/companyUserSlice';
import Link from 'next/link';
import { checkActionPermission } from '@/config/permissions';

const CompanyUserTable: React.FC = () => {
  const dispatch = useDispatch();
  const { user: currentUser, company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items, filters } = useSelector((state: RootState) => state.companyUsers);

  React.useEffect(() => {
    const { fetchUsers } = require('@/redux/features/companyUserSlice');
    dispatch(fetchUsers(activeCompany?.id));
  }, [dispatch, activeCompany?.id]);

  // Filter logic
  const filteredItems = items.filter(item => {
    // If a specific company is selected, filter by it.
    if (activeCompany && item.company_id !== String(activeCompany.id)) return false;
    
    const matchesSearch = item.name.toLowerCase().includes(filters.search.toLowerCase()) || 
                         item.email.toLowerCase().includes(filters.search.toLowerCase());
    const matchesRole = filters.role === 'all' || item.role === filters.role;
    
    return matchesSearch && matchesRole;
  });

  const handleDelete = (id: string) => {
    if (id === currentUser?.id) {
       alert("You cannot delete your own account.");
       return;
    }
    if (confirm('Are you sure you want to delete this user? Access will be immediately revoked.')) {
      (dispatch as any)(deleteUserAsync(id));
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin': return <span className="badge bg-dark bg-gradient text-white rounded-pill px-3 py-1 fw-800 x-small shadow-sm">SUPER ADMIN</span>;
      case 'company_admin': return <span className="badge bg-danger bg-opacity-10 text-danger rounded-pill px-3 py-1 fw-700 x-small">ADMIN</span>;
      case 'manager': return <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3 py-1 fw-700 x-small">MANAGER</span>;
      case 'sales_agent': return <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-1 fw-700 x-small">SALES</span>;
      case 'staff': return <span className="badge bg-info bg-opacity-10 text-info rounded-pill px-3 py-1 fw-700 x-small">STAFF</span>;
      default: return <span className="badge bg-secondary bg-opacity-10 text-muted rounded-pill px-3 py-1 fw-700 x-small">{role.toUpperCase()}</span>;
    }
  };

  return (
    <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light bg-opacity-50">
              <tr>
                <th className="px-4 py-3 border-0 x-small fw-800 text-muted text-uppercase tracking-widest">User Details</th>
                <th className="py-3 border-0 x-small fw-800 text-muted text-uppercase tracking-widest text-center">Modules</th>
                <th className="py-3 border-0 x-small fw-800 text-muted text-uppercase tracking-widest text-center">Role</th>
                <th className="py-3 border-0 x-small fw-800 text-muted text-uppercase tracking-widest text-end px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((user) => (
                <tr key={user.id} className="border-bottom-0">
                  <td className="px-4 py-3">
                    <div className="d-flex align-items-center">
                      <div className="flex-shrink-0">
                        <div className="rounded-circle bg-primary bg-gradient text-white d-flex align-items-center justify-content-center fw-bold shadow-sm" style={{ width: '40px', height: '40px' }}>
                          {user.name.charAt(0)}
                        </div>
                      </div>
                      <div className="ms-3">
                        <div className="fw-800 text-dark small">{user.name}</div>
                        <div className="text-muted x-small">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-center">
                    <span className="fw-800 text-primary small">
                      {user.modulePermissions.filter(p => p.canRead).length} Modules
                    </span>
                  </td>
                  <td className="text-center">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="text-end px-4">
                    <div className="d-flex justify-content-end gap-2">
                      <Link href={`/users/${user.id}/edit`} className="btn-action-edit" title="Edit">
                        <i className="bi bi-pencil-fill"></i>
                      </Link>
                      <button 
                        className="btn-action-delete"
                        onClick={() => handleDelete(user.id)}
                        disabled={user.id === currentUser?.id}
                        title="Delete"
                      >
                        <i className="bi bi-x-lg"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-5 text-muted small fw-600">
                    No users found matching your request.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CompanyUserTable;
