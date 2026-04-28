'use client';

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Link from 'next/link';
import { RootState } from '@/redux/store';
import { setLeadFilters, deleteLead, fetchLeads, setLeadPage } from '@/redux/features/leadSlice';
import { createCustomer } from '@/redux/features/customerSlice';
import Breadcrumb from '@/components/Breadcrumb';
import StatusModal from '@/components/StatusModal';
import { checkActionPermission } from '@/config/permissions';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Loader from '@/components/Loader';
import ConfirmationModal from '@/components/ConfirmationModal';

import ExportExcel from '@/components/shared/ExportExcel';

const LeadsPage = () => {
  const [mounted, setMounted] = useState(false);
  const dispatch = useDispatch();
  const { user, company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items, filters, pagination, loading } = useSelector((state: RootState) => state.leads);

  const [modal, setModal] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false,
    title: '',
    message: ''
  });

  const [confirmModal, setConfirmModal] = useState<{ 
    isOpen: boolean; 
    id: string | null; 
    type: 'delete' | 'promote' | null;
    leadData?: any;
  }>({ 
    isOpen: false, id: null, type: null 
  });

  useEffect(() => {
    setMounted(true);
    (dispatch as any)(fetchLeads(activeCompany?.id));
  }, [dispatch, activeCompany?.id]);

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

    // Date range filtering (Inquiry Date uses createdAt)
    let matchesDate = true;
    if (filters.fromDate && item.createdAt && new Date(item.createdAt) < new Date(filters.fromDate)) matchesDate = false;
    if (filters.toDate && item.createdAt && new Date(item.createdAt) > new Date(filters.toDate)) matchesDate = false;

    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalPages = Math.ceil(filteredItems.length / pagination.itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (pagination.currentPage - 1) * pagination.itemsPerPage,
    pagination.currentPage * pagination.itemsPerPage
  );

  const handlePromoteParams = (lead: any) => {
    setConfirmModal({ isOpen: true, id: lead.id, type: 'promote', leadData: lead });
  };

  const handleDeleteParams = (id: string) => {
    setConfirmModal({ isOpen: true, id, type: 'delete' });
  };

  const confirmAction = () => {
    if (!confirmModal.id || !confirmModal.type) return;

    if (confirmModal.type === 'promote') {
      const lead = confirmModal.leadData;
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
      (dispatch as any)(deleteLead(lead.id));
      setModal({
        isOpen: true,
        title: 'Lead Converted!',
        message: `${lead.company} is now an active customer. All logistics and invoicing modules are enabled for this client.`
      });
    } else if (confirmModal.type === 'delete') {
      (dispatch as any)(deleteLead(confirmModal.id));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new': return <span className="badge bg-primary-soft text-primary px-2 py-1 rounded-pill small fw-800">NEW</span>;
      case 'contacted': return <span className="badge bg-info-soft text-info px-2 py-1 rounded-pill small fw-800">CONTACTED</span>;
      case 'qualified': return <span className="badge bg-warning-soft text-warning px-2 py-1 rounded-pill small fw-800">QUALIFIED</span>;
      case 'converted': return <span className="badge bg-success-soft text-success px-2 py-1 rounded-pill small fw-800">CONVERTED</span>;
      default: return null;
    }
  };

  const handlePrintLeadRecord = (lead: any) => {
    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return;
    printWindow.document.write('<html><head><title>Lead Summary</title>');
    printWindow.document.write('<style>body { font-family: sans-serif; padding: 40px; color: #333; } .header { border-bottom: 2px solid #ea580c; padding-bottom: 20px; margin-bottom: 30px; } .label { font-weight: bold; color: #666; font-size: 0.8rem; text-transform: uppercase; margin-bottom: 4px; } .value { font-size: 1.1rem; margin-bottom: 20px; font-weight: 500; } .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write('<div class="header"><h1 style="margin: 0; color: #ea580c;">Globus Engineering CRM</h1><p style="margin: 5px 0 0; color: #666;">Lead Summary Record</p></div>');
    printWindow.document.write('<div class="grid">');
    printWindow.document.write(`<div><div class="label">Contact Name</div><div class="value">${lead.name}</div></div>`);
    printWindow.document.write(`<div><div class="label">Company</div><div class="value">${lead.company}</div></div>`);
    printWindow.document.write(`<div><div class="label">Source</div><div class="value">${lead.source}</div></div>`);
    printWindow.document.write(`<div><div class="label">Industry</div><div class="value">${lead.industry}</div></div>`);
    printWindow.document.write(`<div><div class="label">Current Status</div><div class="value">${lead.status.toUpperCase()}</div></div>`);
    printWindow.document.write('</div>');
    printWindow.document.write('<div style="margin-top: 50px; text-align: center; font-size: 0.8rem; color: #999; border-top: 1px solid #eee; padding-top: 20px;">Prospect Inquiry Record on ' + new Date().toLocaleString() + '</div>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  const handleExportPDFLeadRecord = (lead: any) => {
    const doc = new jsPDF();
    doc.setFillColor(37, 99, 235); doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.text("GLOBUS ENGINEERING", 14, 25);
    doc.setFontSize(10); doc.text("LEAD SUMMARY RECORD", 14, 32);
    doc.setTextColor(33, 33, 33); doc.setFontSize(12); doc.text("PROSPECT DETAILS", 14, 55);
    autoTable(doc, {
      startY: 60,
      body: [
        ['Contact Name', lead.name], ['Company', lead.company],
        ['Source', lead.source], ['Industry', lead.industry],
        ['Current Status', lead.status.toUpperCase()]
      ],
      theme: 'grid', styles: { cellPadding: 8, fontSize: 10 },
      columnStyles: { 0: { fontStyle: 'bold', fillColor: [245, 245, 245], cellWidth: 50 } },
    });
    doc.save(`lead_${lead.company.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="container-fluid py-4 min-vh-100 animate-fade-in px-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <Breadcrumb items={[{ label: 'Lead Management', active: true }]} />
          <h2 className="fw-900 tracking-tight text-dark mb-1 mt-2">Prospective Enquiries</h2>
          <p className="text-muted small mb-0">Follow up with potential industrial partners and conversion funnels.</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <ExportExcel
            data={filteredItems}
            fileName="Leads_List"
            headers={{ name: 'Name', company: 'Company', industry: 'Industry', source: 'Source', status: 'Status', createdAt: 'Inquiry Date' }}
            buttonText="Export List"
          />
          {checkActionPermission(user, 'mod_lead', 'create') && (
            <Link href="/leads/new" className="btn btn-primary btn-page-action px-4">
              <i className="bi bi-funnel-fill"></i>
              <span>Add Lead</span>
            </Link>
          )}
        </div>
      </div>

      <div className="card filter-card">
        <div className="card-body p-3">
          <div className="filter-bar-row">
            <div className="filter-item-search">
              <div className="search-group">
                <span className="input-group-text">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control search-bar"
                  placeholder="Search prospects..."
                  value={filters.search}
                  onChange={(e) => dispatch(setLeadFilters({ search: e.target.value }))}
                />
              </div>
            </div>
            <div className="filter-item-select">
              <select
                className="form-select search-bar"
                value={filters.status}
                onChange={(e) => dispatch(setLeadFilters({ status: e.target.value as any }))}
              >
                <option value="all">Statuses</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
              </select>
            </div>
            <div className="date-filter-group">
              <input 
                type="date" 
                className="text-muted" 
                value={filters.fromDate}
                onChange={(e) => dispatch(setLeadFilters({ fromDate: e.target.value }))}
              />
              <span className="text-muted small fw-bold mx-1">TO</span>
              <input 
                type="date" 
                className="text-muted" 
                value={filters.toDate}
                onChange={(e) => dispatch(setLeadFilters({ toDate: e.target.value }))}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm overflow-hidden">
        <div className="card-body p-0">
          <div className="table-responsive" style={{ minHeight: '400px', paddingBottom: '80px' }}>
            <table className="table table-hover align-middle mb-0">
          <thead>
            <tr className="bg-light">
              <th className="px-4 py-3 small fw-800 text-muted text-capitalize tracking-widest border-0">Prospect Info</th>
              <th className="py-3 small fw-800 text-muted text-capitalize tracking-widest border-0">Source</th>
              <th className="py-3 small fw-800 text-muted text-capitalize tracking-widest border-0">Status</th>
              <th className="py-3 small fw-800 text-muted text-capitalize tracking-widest border-0">Industry</th>
              <th className="py-3 small fw-800 text-muted text-capitalize tracking-widest border-0 text-center px-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5}>
                  <Loader text="Fetching Leads..." />
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-5 text-muted fw-600">No leads found in your current view.</td>
              </tr>
            ) : (
              paginatedItems.map((lead, index) => (
                <tr key={lead.id}>
                  <td className="px-4 py-3">
                    <div className="d-flex align-items-center gap-2">
                       {/* <span className="text-muted tiny fw-bold">{(pagination.currentPage - 1) * pagination.itemsPerPage + index + 1}</span> */}
                       <div>
                          <div className="fw-800 text-dark mb-0 fs-5">{lead.name}</div>
                          <div className="small text-muted fw-600">{lead.company}</div>
                       </div>
                    </div>
                  </td>
                  <td>
                    <span className="small fw-700 text-muted "><i className="bi bi-box-arrow-in-right me-1"></i>{lead.source}</span>
                  </td>
                  <td>{getStatusBadge(lead.status)}</td>
                  <td><span className="fw-600 text-muted" style={{ fontSize: '0.9rem' }}>{lead.industry}</span></td>
                  <td className="text-center px-4">
                    <div className="d-flex justify-content-center gap-1">
                        <Link href={`/leads/${lead.id}/edit`} className="btn-action-view" title="View Profile">
                          <i className="bi bi-eye-fill"></i>
                        </Link>
                        {checkActionPermission(user, 'mod_lead', 'edit') && (
                          <Link href={`/leads/${lead.id}/edit?edit=true`} className="btn-action-edit" title="Edit Lead">
                            <i className="bi bi-pencil-fill"></i>
                          </Link>
                        )}
                        
                        <div className="dropdown">
                          <button 
                            className="btn btn-sm btn-outline-secondary border-0 text-muted p-0 ms-1 d-flex align-items-center justify-content-center" 
                            type="button" 
                            id={`actions-${lead.id}`} 
                            data-bs-toggle="dropdown" 
                            aria-expanded="false"
                            style={{ width: '32px', height: '32px', borderRadius: '8px' }}
                          >
                            <i className="bi bi-three-dots-vertical fs-5"></i>
                          </button>
                          <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3 py-2" aria-labelledby={`actions-${lead.id}`}>
                            {checkActionPermission(user, 'mod_lead', 'edit') && (
                              <li>
                                <button className="dropdown-item d-flex align-items-center gap-2 py-2 text-success" type="button" onClick={() => handlePromoteParams(lead)}>
                                  <i className="bi bi-person-plus-fill"></i>
                                  <span className="small fw-bold">Promote to Customer</span>
                                </button>
                              </li>
                            )}
                            <li>
                              <button className="dropdown-item d-flex align-items-center gap-2 py-2" type="button" onClick={() => handlePrintLeadRecord(lead)}>
                                <i className="bi bi-printer text-primary"></i>
                                <span className="small fw-semibold">Quick Print</span>
                              </button>
                            </li>
                            <li>
                              <button className="dropdown-item d-flex align-items-center gap-2 py-2" type="button" onClick={() => handleExportPDFLeadRecord(lead)}>
                                <i className="bi bi-file-earmark-pdf text-danger"></i>
                                <span className="small fw-semibold">Export PDF</span>
                              </button>
                            </li>
                            {checkActionPermission(user, 'mod_lead', 'delete') && (
                              <>
                                <li><hr className="dropdown-divider opacity-50" /></li>
                                <li>
                                  <button 
                                    className="dropdown-item d-flex align-items-center gap-2 py-2 text-danger" 
                                    type="button"
                                    onClick={() => handleDeleteParams(lead.id)}
                                  >
                                    <i className="bi bi-trash3"></i>
                                    <span className="small fw-semibold">Remove Record</span>
                                  </button>
                                </li>
                              </>
                            )}
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
      {totalPages > 1 && (
        <div className="p-3 border-top bg-light d-flex justify-content-between align-items-center px-4">
          <span className="text-muted small">Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} to {Math.min(pagination.currentPage * pagination.itemsPerPage, filteredItems.length)} of {filteredItems.length} entries</span>
          <nav>
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${pagination.currentPage === 1 ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => dispatch(setLeadPage(pagination.currentPage - 1))}>
                  <i className="bi bi-chevron-left"></i>
                </button>
              </li>
              {[...Array(totalPages)].map((_, i) => (
                <li key={i} className={`page-item ${pagination.currentPage === i + 1 ? 'active' : ''}`}>
                  <button className="page-link" onClick={() => dispatch(setLeadPage(i + 1))}>{i + 1}</button>
                </li>
              ))}
              <li className={`page-item ${pagination.currentPage === totalPages ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => dispatch(setLeadPage(pagination.currentPage + 1))}>
                  <i className="bi bi-chevron-right"></i>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </div>
  </div>

      <StatusModal 
        isOpen={modal.isOpen}
        onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
        type="success"
        title={modal.title}
        message={modal.message}
      />

      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null, type: null })}
        onConfirm={confirmAction}
        title={confirmModal.type === 'promote' ? "Promote Prospect" : "Remove Lead Record"}
        message={confirmModal.type === 'promote' ? `Are you sure you want to promote ${confirmModal.leadData?.company || 'this lead'} to an active customer? All logistics and invoicing modules will be enabled for this client.` : "Are you sure you want to delete this lead? All follow-up history will be permanently removed. This action cannot be undone."}
      />

      <style jsx>{`
        .bg-primary-soft { background-color: rgba(13, 110, 253, 0.1); }
        .bg-info-soft { background-color: rgba(13, 202, 240, 0.1); }
        .bg-warning-soft { background-color: rgba(255, 193, 7, 0.1); }
        .bg-success-soft { background-color: rgba(25, 135, 84, 0.1); }
        .table-responsive {
          min-height: 400px;
          padding-bottom: 80px;
        }
        @media print {
          :global(body *) { visibility: hidden; }
          .table-responsive, .table-responsive * { visibility: visible; }
          .table-responsive { position: absolute; left: 0; top: 0; width: 100%; }
          .table th:last-child, .table td:last-child { display: none !important; }
          .table { border: 1px solid #dee2e6 !important; width: 100% !important; }
          :global(.sidebar), :global(.header), :global(.breadcrumb), .card-header, .pagination, .border-bottom { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default LeadsPage;
