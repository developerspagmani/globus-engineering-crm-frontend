'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import ModuleGuard from '@/components/ModuleGuard';
import Breadcrumb from '@/components/Breadcrumb';

const MigrationPage = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ success?: boolean; message?: string; data?: any } | null>(null);
  const { token } = useSelector((state: RootState) => state.auth);

  const handleMigrate = async () => {
    if (!confirm('Are you sure you want to run the migration? This will update legacy records to the Globus company ID.')) {
      return;
    }

    setLoading(true);
    setStatus(null);
    console.log('📡 Sending migration request to /api/admin/migration/migrate...');
    try {
      const response = await axios.post(`/api/admin/migration/migrate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Migration Response:', response.data);
      setStatus({ success: true, message: response.data.message, data: response.data.data });
    } catch (error: any) {
      console.error('❌ Migration error:', error);
      setStatus({ 
        success: false, 
        message: error.response?.data?.error || 'Migration failed', 
        data: error.response?.data?.detail 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async () => {
    if (!confirm('WARNING: This will UNDO the migration and remove company assignments. Are you sure?')) {
      return;
    }

    setLoading(true);
    setStatus(null);
    try {
      const response = await axios.post(`/api/admin/migration/rollback`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatus({ success: true, message: response.data.message, data: response.data.data });
    } catch (error: any) {
      console.error('Rollback error:', error);
      setStatus({ 
        success: false, 
        message: error.response?.data?.error || 'Rollback failed', 
        data: error.response?.data?.detail 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModuleGuard moduleId="super_admin">
      <div className="container-fluid py-4 px-4 animate-fade-in">
        <div className="mb-4 d-flex justify-content-between align-items-end">
          <div>
            <Breadcrumb items={[{ label: 'System Admin', href: '#' }, { label: 'Data Migration', active: true }]} />
            <h2 className="fw-900 tracking-tight text-dark mb-1 mt-2">Data Migration Hub</h2>
            <p className="text-muted small mb-0">Reconcile legacy database records with the new organization-based CRM architecture.</p>
          </div>
          <button 
            className="btn btn-outline-secondary btn-sm rounded-3 px-3 d-flex align-items-center gap-2"
            onClick={handleRollback}
            disabled={loading}
          >
            <i className="bi bi-arrow-counterclockwise"></i>
            Reset Migration
          </button>
        </div>

        <div className="row">
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
              <div className="card-header bg-white py-3 border-0">
                <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
                  <i className="bi bi-database-gear text-primary"></i>
                  Legacy Sync
                </h5>
              </div>
              <div className="card-body p-4">
                <p className="text-muted">
                  This tool will identify all records in the legacy tables (Customers and Invoices) that do not have a company assigned to them and map them to <strong>Globus Engineering Main</strong>.
                </p>
                
                <div className="alert alert-warning border-0 shadow-sm rounded-3 py-3 mb-4">
                  <div className="d-flex gap-3">
                    <i className="bi bi-exclamation-triangle-fill fs-4 text-warning"></i>
                    <div>
                      <h6 className="fw-bold mb-1">Important Note</h6>
                      <p className="small mb-0 opacity-80">This action will affect live data. It is recommended to perform a database backup before proceeding.</p>
                    </div>
                  </div>
                </div>

                <button 
                  className="btn btn-primary btn-lg w-100 py-3 rounded-3 shadow-accent fw-bold d-flex align-items-center justify-content-center gap-2 transition-all"
                  onClick={handleMigrate}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      <span>MIGRATING DATA...</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-rocket-takeoff-fill"></i>
                      <span>START MIGRATION</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {status && (
              <div className={`card border-0 shadow-sm rounded-4 animate-fade-in ${status.success ? 'bg-success-subtle border-success' : 'bg-danger-subtle border-danger'}`}>
                <div className="card-body p-4">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <i className={`bi ${status.success ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-danger'} fs-4`}></i>
                    <h5 className={`mb-0 fw-bold ${status.success ? 'text-success' : 'text-danger'}`}>
                      {status.success ? 'Migration Successful' : 'Migration Failed'}
                    </h5>
                  </div>
                  <p className="mb-3 fw-medium">{status.message}</p>
                  
                  {status.data && status.success && (
                    <div className="bg-white bg-opacity-50 p-3 rounded-3 border border-white">
                      <h6 className="x-small text-uppercase fw-700 tracking-widest text-muted mb-3">Migration Results</h6>
                      <div className="d-flex justify-content-between mb-2">
                        <span className="small text-muted">Customers Updated:</span>
                        <span className="fw-bold">{status.data.customers || 0}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span className="small text-muted">Invoices Updated:</span>
                        <span className="fw-bold">{status.data.invoices || 0}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span className="small text-muted">Items Migrated:</span>
                        <span className="fw-bold">{status.data.items || 0}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span className="small text-muted">Processes Migrated:</span>
                        <span className="fw-bold">{status.data.processes || 0}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span className="small text-muted">Vendors Migrated:</span>
                        <span className="fw-bold">{status.data.vendors || 0}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span className="small text-muted">Inwards Migrated:</span>
                        <span className="fw-bold">{status.data.inwards || 0}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span className="small text-muted">Price Fixings Migrated:</span>
                        <span className="fw-bold">{status.data.priceFixings || 0}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span className="small text-muted">Employees Updated:</span>
                        <span className="fw-bold">{status.data.employees || 0}</span>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span className="small text-muted">Links Reconciled:</span>
                        <span className="fw-bold text-success">{status.data.linksUpdated || 0}</span>
                      </div>
                    </div>
                  )}
                  
                  {status.data && !status.success && (
                    <div className="bg-white bg-opacity-50 p-3 rounded-3 border border-white">
                      <code className="small text-danger">{status.data}</code>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="col-lg-6">
             <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body p-4">
                   <h6 className="text-uppercase x-small fw-800 text-muted tracking-widest mb-4">Migration Log</h6>
                   <div className="timeline">
                      <div className="d-flex gap-3 mb-4">
                         <div className="timeline-dot bg-primary mt-1"></div>
                         <div>
                            <p className="small fw-bold mb-0">Phase 1: Basic CRM Sync</p>
                            <p className="xx-small text-muted mb-1">Status: Ready</p>
                            <p className="x-small opacity-80">Targets legacy customers and invoices to restore visibility in the dashboard.</p>
                         </div>
                      </div>
                      <div className="d-flex gap-3 mb-4 opacity-50">
                         <div className="timeline-dot bg-secondary mt-1"></div>
                         <div>
                            <p className="small fw-bold mb-0">Phase 2: Master Data Sync</p>
                            <p className="xx-small text-muted mb-1">Status: Planned</p>
                            <p className="x-small">Will migrate Items, Processes, and Vendors from `tbl_` tables to modern `app_` tables.</p>
                         </div>
                      </div>
                      <div className="d-flex gap-3 opacity-50">
                         <div className="timeline-dot bg-secondary mt-1"></div>
                         <div>
                            <p className="small fw-bold mb-0">Phase 3: Logistics Sync</p>
                            <p className="xx-small text-muted mb-1">Status: Planned</p>
                            <p className="x-small">Consolidation of `tbl_inward` and `tbl_inward_item` into JSON-based inward entries.</p>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .timeline-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
      `}</style>
    </ModuleGuard>
  );
};

export default MigrationPage;
