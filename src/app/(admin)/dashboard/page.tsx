'use client';

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Link from 'next/link';
import { RootState, AppDispatch } from '@/redux/store';
import { checkActionPermission } from '@/config/permissions';
import { fetchDashboardStats, fetchAuditLogs } from '@/redux/features/dashboardSlice';

export default function DashboardPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { items: allModules } = useSelector((state: RootState) => state.modules);
  const { company, user } = useSelector((state: RootState) => state.auth);
  const { stats: realStats, logs: auditLogs, loading } = useSelector((state: RootState) => state.dashboard);

  React.useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchAuditLogs());
  }, [dispatch]);

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
    { label: 'Total Invoiced', value: `₹${realStats?.summary.totalInvoiced.toLocaleString() || '0'}`, change: '+0%', icon: 'bi-currency-rupee', color: 'primary' },
    { label: 'Pending Payments', value: `₹${realStats?.summary.pendingAmount.toLocaleString() || '0'}`, change: 'Live', icon: 'bi-clock-history', color: 'warning' },
    { label: 'Customer Count', value: realStats?.summary.customerCount.toString() || '0', change: 'Active', icon: 'bi-people', color: 'success' },
    { label: 'Overdue Invoices', value: realStats?.summary.overdueCount.toString() || '0', change: '>30 Days', icon: 'bi-exclamation-triangle', color: 'danger' },
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
          <Link href="/invoices?tab=ADD_INVOICE" className="text-decoration-none">
            <button className="btn btn-primary d-flex align-items-center shadow-sm rounded-pill px-4 py-2 border-0" style={{ backgroundColor: '#ff4081' }}>
              <i className="bi bi-plus-lg me-2"></i> Create Invoice
            </button>
          </Link>
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
                        {auditLogs.length > 0 ? auditLogs.map((log) => (
                           <tr key={log.id}>
                             <td>
                               <div className="d-flex align-items-center">
                                 <div className="bg-light rounded-circle me-3 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                                   {log.user_name.charAt(0)}
                                 </div>
                                 <div className="fw-semibold small">{log.user_name}</div>
                               </div>
                             </td>
                             <td className="small">
                               <span className="text-primary fw-bold text-uppercase x-small me-1">{log.action}</span> 
                               {(() => {
                                 const details = log.details ? JSON.parse(log.details) : null;
                                 const displayId = details?.invoice_no || details?.business_id || log.entity_id;
                                 return `${log.entity} #${displayId}`;
                               })()}
                             </td>
                             <td><span className="badge bg-success bg-opacity-10 text-success rounded-pill px-2 py-1">Success</span></td>
                             <td className="text-muted x-small">{new Date(log.created_at).toLocaleDateString()}</td>
                           </tr>
                         )) : (
                            <tr>
                              <td colSpan={4} className="text-center py-4 text-muted small">No recent activities found</td>
                           </tr>
                         )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white py-3 border-0">
                  <h5 className="fw-bold mb-0 text-danger">Payment Reminders</h5>
                  <p className="text-muted x-small mb-0">Invoices overdue by more than 30 days</p>
                </div>
                <div className="card-body">
                  <div className="d-flex flex-column gap-3">
                    {realStats?.overdueInvoices && realStats.overdueInvoices.length > 0 ? (
                      realStats.overdueInvoices.map((inv, idx) => (
                        <div key={idx} className="p-2 border rounded bg-danger bg-opacity-10 border-danger border-opacity-25">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <div className="fw-bold small text-danger">INV-#{inv.invoice_no}</div>
                              <div className="text-muted extra-small">{inv.customer}</div>
                            </div>
                            <div className="text-end">
                              <div className="fw-bold small">₹{inv.pending.toLocaleString()}</div>
                              <div className="text-muted extra-small">{new Date(inv.due_date).toLocaleDateString()}</div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-muted small">
                        <i className="bi bi-check2-circle text-success d-block fs-3 mb-2"></i>
                        No overdue payments!
                      </div>
                    )}
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
