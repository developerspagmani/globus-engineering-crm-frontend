'use client';

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Link from 'next/link';
import { RootState } from '@/redux/store';
import { setLeadFilters, deleteLead } from '@/redux/features/leadSlice';
import { createCustomer } from '@/redux/features/customerSlice';
import Breadcrumb from '@/components/Breadcrumb';
import StatusModal from '@/components/StatusModal';
import { checkActionPermission } from '@/config/permissions';

const LeadsPage = () => {
  const [mounted, setMounted] = useState(false);
  const dispatch = useDispatch();
  const { user, company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items, filters } = useSelector((state: RootState) => state.leads);

  const [modal, setModal] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false,
    title: '',
    message: ''
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Data isolation
  const filteredItems = items.filter(item => {
    // Company context filtering
    if (activeCompany && item.company_id !== activeCompany.id) return false;

    // Agent-level isolation (for sales agents)
    if (user?.role === 'sales_agent' && item.agentId !== user.id) return false;
    
    const matchesSearch = item.name.toLowerCase().includes(filters.search.toLowerCase()) || 
                          item.company.toLowerCase().includes(filters.search.toLowerCase());
    const matchesStatus = filters.status === 'all' || item.status === filters.status;
    return matchesSearch && matchesStatus;
  });

  const handleConvertToCustomer = (lead: any) => {
    if (confirm(`Promote ${lead.company} to active customer?`)) {
      (dispatch as any)(createCustomer({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        industry: lead.industry,
        status: 'active',
        agentId: lead.agentId,
        company_id: lead.company_id,
      }));
      
      dispatch(deleteLead(lead.id));
      
      setModal({
        isOpen: true,
        title: 'Lead Converted!',
        message: `${lead.company} is now an active customer. All logistics and invoicing modules are now enabled for this client.`
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new': return <span className="badge bg-primary-soft text-primary px-2 py-1 rounded-pill x-small fw-800">NEW</span>;
      case 'contacted': return <span className="badge bg-info-soft text-info px-2 py-1 rounded-pill x-small fw-800">CONTACTED</span>;
      case 'qualified': return <span className="badge bg-warning-soft text-warning px-2 py-1 rounded-pill x-small fw-800">QUALIFIED</span>;
      case 'converted': return <span className="badge bg-success-soft text-success px-2 py-1 rounded-pill x-small fw-800">CONVERTED</span>;
      default: return null;
    }
  };

  return (
    <div className="content-area animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Breadcrumb items={[{ label: 'Lead Management', active: true }]} />
          <h3 className="fw-800 tracking-tight text-dark mb-0 mt-2">Prospective Enquiries</h3>
          <p className="text-muted small mb-0">Follow up with potential industrial partners and conversion funnels.</p>
        </div>
        {checkActionPermission(user, 'mod_lead', 'create') && (
          <Link href="/leads/new" className="btn btn-primary d-flex align-items-center gap-2 py-2 px-4 shadow-accent">
            <i className="bi bi-funnel fs-5"></i>
            <span>Add Lead</span>
          </Link>
        )}
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
           <div className="row g-3">
             <div className="col-md-8">
               <input 
                 type="text" 
                 className="form-control" 
                 placeholder="Search prospects..." 
                 value={filters.search}
                 onChange={(e) => dispatch(setLeadFilters({ search: e.target.value }))}
               />
             </div>
             <div className="col-md-4">
               <select 
                 className="form-select"
                 value={filters.status}
                 onChange={(e) => dispatch(setLeadFilters({ status: e.target.value as any }))}
               >
                 <option value="all">All Statuses</option>
                 <option value="new">New</option>
                 <option value="contacted">Contacted</option>
                 <option value="qualified">Qualified</option>
               </select>
             </div>
           </div>
        </div>
      </div>

      <div className="table-responsive p-1 mx-auto" style={{ maxWidth: '1100px' }}>
        <table className="table align-middle">
          <thead>
            <tr>
              <th className="x-small fw-800 text-muted text-uppercase tracking-widest border-bottom-0">Prospect Info</th>
              <th className="x-small fw-800 text-muted text-uppercase tracking-widest border-bottom-0">Source</th>
              <th className="x-small fw-800 text-muted text-uppercase tracking-widest border-bottom-0">Status</th>
              <th className="x-small fw-800 text-muted text-uppercase tracking-widest border-bottom-0">Industry</th>
              <th className="x-small fw-800 text-muted text-uppercase tracking-widest border-bottom-0 text-end">Pipeline Move</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(lead => (
              <tr key={lead.id} className="border-bottom">
                <td>
                  <div className="fw-800 text-dark mb-0">{lead.name}</div>
                  <div className="x-small text-muted fw-600">{lead.company}</div>
                </td>
                <td>
                  <span className="x-small fw-700 text-muted"><i className="bi bi-box-arrow-in-right me-1"></i>{lead.source}</span>
                </td>
                <td>{getStatusBadge(lead.status)}</td>
                <td><span className="small fw-600 text-muted">{lead.industry}</span></td>
                <td className="text-end">
                   <div className="d-flex justify-content-end gap-2">
                      {checkActionPermission(user, 'mod_lead', 'edit') && (
                        <button 
                          onClick={() => handleConvertToCustomer(lead)}
                          className="btn btn-outline-success btn-sm rounded-pill px-3 fw-800 x-small"
                        >
                          PROMOTE TO CUSTOMER
                        </button>
                      )}
                       {checkActionPermission(user, 'mod_lead', 'edit') && (
                         <Link href={`/leads/${lead.id}/edit`} className="btn-action-edit" title="Edit">
                           <i className="bi bi-pencil-fill"></i>
                         </Link>
                       )}
                   </div>
                </td>
              </tr>
            ))}
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-5 text-muted small fw-600">No leads found in your current view.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <StatusModal 
        isOpen={modal.isOpen}
        onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
        type="success"
        title={modal.title}
        message={modal.message}
      />

      <style jsx>{`
        .bg-primary-soft { background-color: rgba(13, 110, 253, 0.1); }
        .bg-info-soft { background-color: rgba(13, 202, 240, 0.1); }
        .bg-warning-soft { background-color: rgba(255, 193, 7, 0.1); }
        .bg-success-soft { background-color: rgba(25, 135, 84, 0.1); }
      `}</style>
    </div>
  );
};

export default LeadsPage;
