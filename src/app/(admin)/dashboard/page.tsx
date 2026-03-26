'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { checkActionPermission } from '@/config/permissions';

export default function DashboardPage() {
  const { items: allModules } = useSelector((state: RootState) => state.modules);
  const { company, user } = useSelector((state: RootState) => state.auth);

  // Determine if we should show the global super admin view or a specific tenant view
  const isViewingGlobal = user?.role === 'super_admin' && !company;

  // Filter modules if user is part of a company (Tenant logic)
  const modules = company 
    ? allModules.filter(m => (company.activeModules || []).includes(m.id))
    : allModules;

  const stats = isViewingGlobal ? [
    { label: 'Active Tenants', value: '12', change: '+2', icon: 'bi-building', color: 'primary' },
    { label: 'Total Users', value: '450', change: '+15', icon: 'bi-people', color: 'success' },
    { label: 'Monthly Revenue', value: '₹12,400', change: '+8%', icon: 'bi-bank', color: 'info' },
    { label: 'System Health', value: '99.9%', change: 'Stable', icon: 'bi-cpu', color: 'warning' },
  ] : [
    { label: 'Total Invoiced', value: company?.id === 'comp_apex' ? '₹12,450' : '₹124,284', change: '+12%', icon: 'bi-currency-rupee', color: 'primary' },
    { label: 'Pending Payments', value: company?.id === 'comp_apex' ? '₹1,200' : '₹24,500', change: '-3.2%', icon: 'bi-clock-history', color: 'warning' },
    { label: 'Invoices Paid', value: company?.id === 'comp_apex' ? '8' : '45', change: '+5%', icon: 'bi-check-circle', color: 'success' },
    { label: 'Raw Materials Cost', value: company?.id === 'comp_apex' ? '₹3,150' : '₹45,210', change: '+18%', icon: 'bi-tools', color: 'info' },
  ];

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">
            {isViewingGlobal ? 'Global System Console' : (company?.name || 'Company Dashboard')}
          </h4>
          <p className="text-muted small">
            {isViewingGlobal ? 'Platform-wide monitoring and multi-tenant control.' : 'Operational overview and resource allocation.'}
          </p>
        </div>
        {!isViewingGlobal && checkActionPermission(user, 'mod_invoice', 'create') && (
          <button className="btn btn-primary d-flex align-items-center shadow-sm rounded-pill px-4">
            <i className="bi bi-plus-lg me-2"></i> Create Invoice
          </button>
        )}
      </div>

      <div className="row g-4 mb-4">
        {stats.map((stat, idx) => (
          <div className="col-12 col-md-6 col-lg-3" key={idx}>
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className={`bg-${stat.color} bg-opacity-10 p-3 rounded-3`}>
                    <i className={`bi ${stat.icon} text-${stat.color} fs-4`}></i>
                  </div>
                  <span className={`badge ${stat.change.includes('+') ? 'bg-success' : 'bg-info'} bg-opacity-10 text-${stat.change.includes('+') ? 'success' : 'info'} rounded-pill px-2 py-1 small`}>
                    {stat.change}
                  </span>
                </div>
                <h6 className="text-muted mb-1 small">{stat.label}</h6>
                <h3 className="fw-bold mb-0">{stat.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!isViewingGlobal ? (
        <>
          <div className="row g-4 mb-5">
            <div className="col-12">
              <h5 className="fw-bold mb-3">Company Modules</h5>
              <div className="row g-3">
                {modules.map((module) => (
                  <div key={module.id} className="col-12 col-md-6 col-lg-3">
                    <div className="card h-100 border-0 shadow-sm hover-shadow transition">
                      <div className="card-body">
                        <div className="d-flex align-items-center mb-2">
                          <i className={`bi ${module.icon} text-primary fs-4 me-2`}></i>
                          <h6 className="mb-0 fw-bold">{module.name}</h6>
                        </div>
                        <p className="text-muted small mb-2">{module.description}</p>
                        <span className={`badge bg-success bg-opacity-10 text-success rounded-pill`}>
                          Active
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-12 col-lg-8">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white py-3 border-0 d-flex justify-content-between align-items-center">
                  <h5 className="fw-bold mb-0">Recent Activities</h5>
                  <button className="btn btn-link link-primary p-0 text-decoration-none small">View All</button>
                </div>
                <div className="card-body">
                  <div className="table-responsive p-1">
                    <table className="table table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th className="border-0">User</th>
                          <th className="border-0">Action</th>
                          <th className="border-0">Status</th>
                          <th className="border-0">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[1, 2, 3, 4, 5].map((i) => (
                          <tr key={i}>
                            <td>
                              <div className="d-flex align-items-center">
                                <img src={`https://i.pravatar.cc/150?u=${i}`} alt="" className="rounded-circle me-3" width="32" height="32" />
                                <div>
                                  <div className="fw-semibold">Client {i}</div>
                                  <div className="text-muted x-small" style={{ fontSize: '0.75rem' }}>INV-2024-00{i}</div>
                                </div>
                              </div>
                            </td>
                            <td>Generated final invoice</td>
                            <td><span className={`badge ${i % 2 === 0 ? 'bg-success' : 'bg-warning'} bg-opacity-10 text-${i % 2 === 0 ? 'success' : 'warning'} rounded-pill px-2 py-1`}>{i % 2 === 0 ? 'Paid' : 'Pending'}</span></td>
                            <td className="text-muted small">March {12-i}, 2024</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white py-3 border-0">
                  <h5 className="fw-bold mb-0">Invoice Distribution</h5>
                </div>
                <div className="card-body">
                  <div className="d-flex flex-column gap-4">
                    {[
                      { label: 'Direct Project', value: 45, color: 'primary' },
                      { label: 'Sub-Contracting', value: 30, color: 'success' },
                      { label: 'Maintenance', value: 15, color: 'warning' },
                      { label: 'Consulting', value: 10, color: 'info' }
                    ].map((item, idx) => (
                      <div key={idx}>
                        <div className="d-flex justify-content-between mb-2">
                          <span className="small fw-semibold">{item.label}</span>
                          <span className="small text-muted">{item.value}%</span>
                        </div>
                        <div className="progress" style={{ height: '6px' }}>
                          <div 
                            className={`progress-bar bg-${item.color}`} 
                            role="progressbar" 
                            style={{ width: `${item.value}%` }} 
                            aria-valuenow={item.value} 
                            aria-valuemin={0} 
                            aria-valuemax={100}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="row g-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white py-3 border-0">
                <h5 className="fw-bold mb-0">System Overview</h5>
              </div>
              <div className="card-body">
                <p className="text-muted">Welcome to the Super Admin Control Center. Use the sidebar to manage companies and platform-wide settings.</p>
                <div className="alert alert-info border-0 shadow-none">
                  <i className="bi bi-info-circle-fill me-2"></i>
                  Tip: You are viewing global metrics across all registered tenants.
                </div>
                
                <div className="row mt-4">
                  <div className="col-md-6 mb-3">
                    <div className="border rounded p-3 bg-light">
                      <h6 className="fw-bold"><i className="bi bi-gear-fill me-2 text-primary"></i> Platform Settings</h6>
                      <p className="small text-muted mb-0">Configure global parameters, subscription plans, and available modules.</p>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="border rounded p-3 bg-light">
                      <h6 className="fw-bold"><i className="bi bi-shield-check me-2 text-success"></i> Security Audit</h6>
                      <p className="small text-muted mb-0">Review system access logs and security performance metrics.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
