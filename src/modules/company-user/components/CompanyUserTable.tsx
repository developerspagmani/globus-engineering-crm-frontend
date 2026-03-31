'use client';

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { deleteUserAsync, resetUserPasswordAsync } from '@/redux/features/companyUserSlice';
import Link from 'next/link';
import { checkActionPermission } from '@/config/permissions';
import Loader from '@/components/Loader';

const CompanyUserTable: React.FC = () => {
  const dispatch = useDispatch();
  const { user: currentUser, company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items, filters, loading } = useSelector((state: RootState) => state.companyUsers);

  const [resetModalUser, setResetModalUser] = React.useState<string | null>(null);
  const [newPassword, setNewPassword] = React.useState('');
  const [resetting, setResetting] = React.useState(false);

  React.useEffect(() => {
    const { fetchUsers } = require('@/redux/features/companyUserSlice');
    dispatch(fetchUsers(activeCompany?.id));
  }, [dispatch, activeCompany?.id]);

  // Filter logic
  const filteredItems = items.filter(item => {
    // If a specific company is selected, filter by it.
    if (activeCompany && item.company_id !== String(activeCompany.id)) return false;
    
    const matchesSearch = (item.name?.toLowerCase() ?? '').includes(filters.search.toLowerCase()) || 
                         (item.email?.toLowerCase() ?? '').includes(filters.search.toLowerCase());
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser || !newPassword) return;

    setResetting(true);
    try {
      await (dispatch as any)(resetUserPasswordAsync({ id: resetModalUser, password: newPassword })).unwrap();
      alert('Password reset successfully.');
      setResetModalUser(null);
      setNewPassword('');
    } catch (err: any) {
      alert(err || 'Failed to reset password');
    } finally {
      setResetting(false);
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
    <>
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="card-body p-0">
          <div className="table-responsive" style={{ minHeight: '350px', paddingBottom: '100px' }}>
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light bg-opacity-50">
              <tr>
                <th className="px-4 py-3 border-0 x-small fw-800 text-muted text-uppercase tracking-widest">User Details</th>
                <th className="py-3 border-0 x-small fw-800 text-muted text-uppercase tracking-widest text-center">Modules</th>
                <th className="py-3 border-0 x-small fw-800 text-muted text-uppercase tracking-widest text-center">Role</th>
                <th className="py-3 border-0 x-small fw-800 text-muted text-uppercase tracking-widest text-center px-4" style={{ width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4}>
                    <Loader text="Fetching Users..." />
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-5 text-muted small fw-600">
                    No users found matching your request.
                  </td>
                </tr>
              ) : (
                filteredItems.map((user) => (
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
                        {user.modulePermissions.filter(p => (p as any).canRead).length} Modules
                      </span>
                    </td>
                    <td className="text-center">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="text-center px-4">
                      <div className="d-flex justify-content-center align-items-center gap-1">
                        <Link href={`/users/${user.id}`} className="btn-action-view" title="View Detail">
                          <i className="bi bi-eye-fill"></i>
                        </Link>
                        <div className="dropdown">
                          <button className="btn btn-sm btn-outline-secondary border-0 text-muted p-0 ms-1 d-flex align-items-center justify-content-center" type="button" id={`actions-${user.id}`} data-bs-toggle="dropdown" aria-expanded="false" style={{ width: '32px', height: '32px', borderRadius: '8px' }}>
                            <i className="bi bi-three-dots-vertical fs-5"></i>
                          </button>
                          <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3 py-2" aria-labelledby={`actions-${user.id}`}>
                            <li>
                              <button className="dropdown-item d-flex align-items-center gap-2 py-2 text-dark" onClick={() => setResetModalUser(user.id)}>
                                <i className="bi bi-key-fill text-warning"></i> <span className="small fw-semibold">Reset Password</span>
                              </button>
                            </li>
                            <li>
                              <Link href={`/users/${user.id}/edit`} className="dropdown-item d-flex align-items-center gap-2 py-2 text-dark">
                                <i className="bi bi-pencil-fill text-primary"></i> <span className="small fw-semibold">Edit Permissions</span>
                              </Link>
                            </li>
                            <li>
                              <hr className="dropdown-divider my-1 border-light" />
                            </li>
                            <li>
                              <button 
                                className={`dropdown-item d-flex align-items-center gap-2 py-2 ${user.id === currentUser?.id ? 'text-muted' : 'text-danger'}`} 
                                onClick={() => handleDelete(user.id)}
                                disabled={user.id === currentUser?.id}
                              >
                                <i className="bi bi-trash-fill"></i> <span className="small fw-semibold">Revoke Access</span>
                              </button>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>

      {/* Reset Password Modal */}
      {resetModalUser && (
        <div className="modal fade show" style={{ display: 'block', position: 'fixed', inset: 0, zIndex: 1055, backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom-0 pb-0">
                <h5 className="modal-title fw-bold">Reset Password</h5>
                <button type="button" className="btn-close" onClick={() => setResetModalUser(null)}></button>
              </div>
              <form onSubmit={handleResetPassword}>
                <div className="modal-body">
                  <p className="text-muted small">Enter a new secure password for this user. They will be able to log in with this new password immediately.</p>
                  <div className="mb-3">
                    <label className="form-label text-muted small fw-bold">New Password</label>
                    <input 
                      type="password" 
                      className="form-control"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="Enter new password"
                    />
                  </div>
                </div>
                <div className="modal-footer border-top-0 pt-0">
                  <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setResetModalUser(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary rounded-pill px-4 shadow-accent" disabled={resetting || !newPassword}>
                    {resetting ? 'Saving...' : 'Save Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CompanyUserTable;
