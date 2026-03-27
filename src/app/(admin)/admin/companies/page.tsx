'use client';

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { deleteCompany } from '@/redux/features/companySlice';
import Link from 'next/link';

export default function CompaniesPage() {
  const [mounted, setMounted] = React.useState(false);
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { items: companies } = useSelector((state: RootState) => state.companies);

  const [deleteModal, setDeleteModal] = React.useState<{ isOpen: boolean; company_id: string | null }>({
    isOpen: false,
    company_id: null
  });
  const [confirmText, setConfirmText] = React.useState('');

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleDeleteTrigger = (id: string) => {
    setDeleteModal({ isOpen: true, company_id: id });
    setConfirmText('');
  };

  const confirmDelete = () => {
    if (confirmText === 'DELETE' && deleteModal.company_id) {
      dispatch(deleteCompany(deleteModal.company_id) as any);
      setDeleteModal({ isOpen: false, company_id: null });
      setConfirmText('');
    }
  };

  if (!mounted) return null;

  if (user?.role !== 'super_admin') {
    return (
      <div className="container-fluid py-5">
        <div className="alert alert-danger shadow-sm rounded-4 p-4 border-0 animate-shake d-flex align-items-center">
            <div className="bg-danger bg-opacity-10 p-3 rounded-circle me-4">
                <i className="bi bi-shield-lock-fill text-danger fs-3"></i>
            </div>
            <div>
                <h5 className="fw-bold text-danger mb-1">Access Restricted</h5>
                <p className="mb-0 text-muted small">This specialized console is reserved for Super Admin identities only. If you believe this is an error, contact systems administration.</p>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 className="fw-900 text-dark tracking-tight mb-1">Tenant Ecosystem</h2>
          <p className="text-muted small mb-0 fw-600">Global control center for multi-tenant provisioning and module licensing.</p>
        </div>
        <Link
          href="/admin/companies/new"
          className="btn btn-primary d-flex align-items-center gap-2 px-4 py-2 rounded-pill shadow-accent fw-bold text-decoration-none"
        >
          <i className="bi bi-plus-lg fs-5"></i>
          <span>Onboard New Company</span>
        </Link>
      </div>

      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light bg-opacity-50">
                <tr>
                  <th className="px-4 py-3 border-0 x-small fw-800 text-muted text-uppercase tracking-widest">Company Identity</th>
                  <th className="py-3 border-0 x-small fw-800 text-muted text-uppercase tracking-widest">Plan Tier</th>
                  <th className="py-3 border-0 x-small fw-800 text-muted text-uppercase tracking-widest text-center">Modules Allocated</th>
                  <th className="py-3 border-0 x-small fw-800 text-muted text-uppercase tracking-widest text-end px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.id} className="border-bottom-0">
                    <td className="px-4 py-3">
                      <div className="d-flex align-items-center">
                        <div className="bg-primary bg-gradient text-white p-3 rounded-4 me-3 shadow-sm d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                          <i className="bi bi-building fs-5"></i>
                        </div>
                        <div>
                          <div className="fw-800 text-dark small">{company.name}</div>
                          <div className="text-muted x-small tracking-wider">{company.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${company.plan === 'enterprise' ? 'bg-dark' :
                          company.plan === 'premium' ? 'bg-info bg-opacity-10 text-info' :
                            'bg-primary bg-opacity-10 text-primary'
                        } rounded-pill px-3 py-1 fw-800 x-small`}>
                        {company.plan.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="d-flex flex-wrap gap-1 justify-content-center">
                        {company.activeModules.map((modId: string) => (
                          <span key={modId} className="badge bg-light text-muted border-0 small px-2 py-1 rounded-pill" style={{ fontSize: '0.65rem' }}>
                            {modId.split('_')[1]}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="text-end px-4">
                      <div className="d-flex justify-content-end gap-2">
                        <Link
                          href={`/admin/companies/${company.id}/edit`}
                          className="btn-action-edit"
                          title="Edit"
                        >
                          <i className="bi bi-pencil-fill"></i>
                        </Link>
                        <button
                          onClick={() => handleDeleteTrigger(company.id)}
                          className="btn-action-delete"
                          title="Delete"
                        >
                          <i className="bi bi-x-lg"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 animate-scale-in">
              <div className="modal-header border-0 pb-0">
                <button type="button" className="btn-close" onClick={() => setDeleteModal({ isOpen: false, company_id: null })}></button>
              </div>
              <div className="modal-body text-center p-4">
                <div className="bg-danger bg-opacity-10 text-danger rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '70px', height: '70px' }}>
                  <i className="bi bi-exclamation-triangle-fill fs-1"></i>
                </div>
                <h4 className="fw-900 text-dark mb-2">Double Confirmation</h4>
                <p className="text-muted small px-3">
                  You are about to decommission this company. This action is critical. 
                  To proceed, please type <b className="text-danger">DELETE</b> in the field below.
                </p>
                
                <div className="mt-4">
                  <input 
                    type="text" 
                    className="form-control form-control-lg text-center fw-bold tracking-widest" 
                    placeholder="Type DELETE here"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer border-0 p-4 pt-0 text-center d-flex justify-content-center gap-2">
                <button 
                  type="button" 
                  className="btn btn-light rounded-pill px-4 fw-bold" 
                  onClick={() => setDeleteModal({ isOpen: false, company_id: null })}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger rounded-pill px-4 shadow-sm fw-bold"
                  disabled={confirmText !== 'DELETE'}
                  onClick={confirmDelete}
                >
                  Confirm Decommission
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
