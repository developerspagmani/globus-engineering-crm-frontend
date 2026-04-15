'use client';

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import Breadcrumb from '@/components/Breadcrumb';
import { Deal, Lead, Customer } from '@/types/modules';
import { updateDeal } from '@/redux/features/salesSlice';
import { addCustomer } from '@/redux/features/customerSlice';
import { deleteLead } from '@/redux/features/leadSlice';
import Link from 'next/link';
import StatusModal from '@/components/StatusModal';
import { checkActionPermission } from '@/config/permissions';

import ExportExcel from '@/components/shared/ExportExcel';

const SalesHubPage = () => {
  const [mounted, setMounted] = useState(false);
  const dispatch = useDispatch();
  const { user, company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { deals } = useSelector((state: RootState) => state.sales);
  const { items: allLeads } = useSelector((state: RootState) => state.leads);

  const [modal, setModal] = useState<{ isOpen: boolean; type: 'success' | 'error'; title: string; message: string }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Data Isolation Logic
  const myDeals = deals.filter(d => {
    if (activeCompany && d.company_id !== activeCompany.id) return false;
    if (user?.role === 'sales_agent' && d.agentId !== user.id) return false;
    return true;
  });

  const myLeads = allLeads.filter(l => {
    if (activeCompany && l.company_id !== activeCompany.id) return false;
    if (user?.role === 'sales_agent' && l.agentId !== user.id) return false;
    return true;
  });

  const isAgent = user?.role === 'sales_agent';

  const handleSealDeal = (deal: Deal) => {
    const lead = allLeads.find(l => l.id === deal.leadId);
    if (!lead) return;

    if (confirm(`Seal the deal for "${deal.title}"? This will convert ${lead.company} into an active Customer.`)) {
      // 1. Mark Deal as Won
      (dispatch as any)(updateDeal({ ...deal, status: 'won' }));

      // 2. Convert Lead to Customer
      (dispatch as any)(addCustomer({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        industry: lead.industry,
        status: 'active',
        agentId: lead.agentId,
        company_id: lead.company_id,
      }));

      // 3. Remove Lead
      (dispatch as any)(deleteLead(lead.id));

      setModal({
        isOpen: true,
        type: 'success',
        title: 'Deal Signed!',
        message: `Congratulations! ${lead.company} has been onboarded as an active client. Career/Project modules are now unlocked for them.`
      });
    }
  };

  const stats = {
    totalDeals: myDeals.length,
    totalValue: myDeals.reduce((sum, d) => sum + d.value, 0),
    wonDeals: myDeals.filter(d => d.status === 'won').length,
    negotiationCount: myDeals.filter(d => d.status === 'negotiation').length,
    myLeadsCount: myLeads.length
  };

  const getStatusBadge = (status: Deal['status']) => {
    switch (status) {
      case 'open': return <span className="badge bg-info-soft text-info rounded-pill px-3 py-1 fw-700 x-small">OPEN</span>;
      case 'negotiation': return <span className="badge bg-warning-soft text-warning rounded-pill px-3 py-1 fw-700 x-small">NEGOTIATION</span>;
      case 'won': return <span className="badge bg-success-soft text-success rounded-pill px-3 py-1 fw-700 x-small">WON</span>;
      case 'lost': return <span className="badge bg-danger-soft text-danger rounded-pill px-3 py-1 fw-700 x-small">LOST</span>;
    }
  };

  return (
    <div className="container-fluid py-4 min-vh-100 animate-fade-in px-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <Breadcrumb items={[{ label: 'Sales & Deal Hub', active: true }]} />
          <h2 className="fw-900 tracking-tight text-dark mb-1 mt-2">
            {isAgent ? 'Personal Pipeline' : 'Enterprise Sales Hub'}
          </h2>
          <p className="text-muted small mb-0">Track engagement funnels and convert industrial prospects into clients.</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <ExportExcel
            data={myDeals}
            fileName="Sales_Pipeline_Report"
            headers={{ title: 'Deal Title', value: 'Value', status: 'Status', expectedClosingDate: 'Target Date' }}
            buttonText="Export List"
          />
          {checkActionPermission(user, 'mod_lead', 'create') && (
            <Link href="/leads/new" className="btn btn-outline-primary btn-page-action px-4">
              <i className="bi bi-funnel-fill"></i>
              <span>Add Lead</span>
            </Link>
          )}
          {checkActionPermission(user, 'mod_sales_hub', 'create') && (
            <button className="btn btn-primary btn-page-action px-4">
              <i className="bi bi-plus-lg"></i>
              <span>Add Deal</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Section */}
      <div className="row g-4 mb-5">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm p-4 bg-primary bg-gradient text-white rounded-4 h-100">
            <p className="x-small fw-700 text-capitalize tracking-widest opacity-75 mb-1">Pipeline Value</p>
            <h2 className="fw-900 mb-0">₹{(stats.totalValue / 100000).toFixed(2)}L</h2>
            <div className="mt-3 x-small fw-600 opacity-75">Base Currency: INR</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm p-4 rounded-4 h-100">
            <p className="x-small text-muted fw-700 text-capitalize tracking-widest mb-1">Active Deals</p>
            <h2 className="fw-900 text-dark mb-0">{stats.totalDeals}</h2>
            <div className="mt-2 progress" style={{ height: '6px' }}>
               <div className="progress-bar bg-warning" style={{ width: `${(stats.negotiationCount / stats.totalDeals) * 100}%` }}></div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm p-4 rounded-4 h-100">
            <p className="x-small text-muted fw-700 text-capitalize tracking-widest mb-1">Personal Leads</p>
            <h2 className="fw-900 text-dark mb-0">{stats.myLeadsCount}</h2>
            <div className="mt-2 x-small text-success fw-700"><i className="bi bi-arrow-up me-1"></i>Active Prospects</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm p-4 rounded-4 h-100">
            <p className="x-small text-muted fw-700 text-capitalize tracking-widest mb-1">Win Count</p>
            <h2 className="fw-900 text-success mb-0">{stats.wonDeals}</h2>
            <div className="mt-2 x-small text-muted fw-600">Converted to Customers</div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Deal Pipeline */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
            <div className="card-header bg-white border-0 p-4 d-flex justify-content-between align-items-center">
              <h5 className="fw-800 text-dark mb-0">Sales Pipeline</h5>
              <button className="btn btn-light btn-sm rounded-pill px-3 fw-700 x-small text-muted border">VIEW ALL</button>
            </div>
            <div className="table-responsive p-1">
              <table className="table mb-0 align-middle">
                <thead className="bg-light bg-opacity-50">
                  <tr>
                    <th className="px-4 py-3 x-small fw-800 text-muted text-capitalize tracking-widest border-bottom-0">Deal Title</th>
                    <th className="py-3 x-small fw-800 text-muted text-capitalize tracking-widest border-bottom-0">Prospect</th>
                    <th className="py-3 x-small fw-800 text-muted text-capitalize tracking-widest border-bottom-0">Value</th>
                    <th className="py-3 x-small fw-800 text-muted text-capitalize tracking-widest border-bottom-0">Status</th>
                    <th className="px-4 py-3 x-small fw-800 text-muted text-capitalize tracking-widest border-bottom-0 text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {myDeals.map(deal => {
                    const prospect = allLeads.find(l => l.id === deal.leadId);
                    return (
                      <tr key={deal.id} className="border-bottom">
                        <td className="px-4 py-3">
                          <div className="fw-800 text-dark small">{deal.title}</div>
                          <div className="x-small text-muted fw-600">Expected: {deal.expectedClosingDate}</div>
                        </td>
                        <td className="py-3">
                          <div className="small fw-700">{prospect?.company || 'Unknown Client'}</div>
                          <div className="x-small text-muted">{prospect?.name}</div>
                        </td>
                        <td className="py-3">
                          <div className="small fw-800 text-primary">₹{deal.value.toLocaleString('en-IN')}</div>
                        </td>
                        <td className="py-3">
                          {getStatusBadge(deal.status)}
                        </td>
                        <td className="px-4 py-3 text-end">
                          {deal.status !== 'won' && deal.status !== 'lost' ? (
                            checkActionPermission(user, 'mod_sales_hub', 'edit') && (
                              <button 
                                onClick={() => handleSealDeal(deal)}
                                className="btn btn-success btn-sm rounded-pill px-3 fw-800 x-small"
                              >
                                SEAL DEAL
                              </button>
                            )
                          ) : (
                            <button disabled className="btn btn-light btn-sm rounded-pill px-3 fw-700 x-small text-muted">FINALIZED</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {myDeals.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-5 text-muted small fw-600">No active deals found in your funnel.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Lead Status Section */}
        <div className="col-lg-4">
           <div className="card border-0 shadow-sm rounded-4 h-100">
             <div className="card-header bg-white border-0 p-4">
                <h5 className="fw-800 text-dark mb-0">Recent Prospects</h5>
             </div>
             <div className="card-body p-0">
               {myLeads.slice(0, 5).map(lead => (
                 <div key={lead.id} className="d-flex align-items-center justify-content-between p-4 border-top animate-fade-in">
                   <div>
                     <div className="fw-800 text-dark small mb-1">{lead.company}</div>
                     <div className="x-small text-muted fw-600">
                       <i className="bi bi-person me-1"></i>{lead.name}
                     </div>
                   </div>
                   <div>
                      <span className="badge bg-light text-muted border rounded-pill px-2 py-1 x-small fw-800">{lead.status.toUpperCase()}</span>
                   </div>
                 </div>
               ))}
               {myLeads.length === 0 && (
                 <div className="p-5 text-center text-muted small fw-600">No leads assigned to you yet.</div>
               )}
             </div>
             <div className="card-footer bg-light bg-opacity-50 border-0 p-4 text-center">
                <Link href="/leads" className="text-primary text-decoration-none x-small fw-800 tracking-widest uppercase">
                  MANAGE ALL LEADS <i className="bi bi-arrow-right ms-1"></i>
                </Link>
             </div>
           </div>
        </div>
      </div>

      <StatusModal 
        isOpen={modal.isOpen}
        onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
        type={modal.type}
        title={modal.title}
        message={modal.message}
      />

      <style jsx>{`
        .bg-info-soft { background-color: rgba(13, 202, 240, 0.1); }
        .bg-warning-soft { background-color: rgba(255, 193, 7, 0.1); }
        .bg-success-soft { background-color: rgba(25, 135, 84, 0.1); }
        .bg-danger-soft { background-color: rgba(220, 53, 69, 0.1); }
      `}</style>
    </div>
  );
};

export default SalesHubPage;
