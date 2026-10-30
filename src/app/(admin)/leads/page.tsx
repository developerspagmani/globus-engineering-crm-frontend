'use client';

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Link from 'next/link';
import { RootState } from '@/redux/store';
import { setLeadFilters, deleteLead, fetchLeads, setLeadPage, setLeadSorting, resetLeadState } from '@/redux/features/leadSlice';
import { createCustomer, updateCustomer } from '@/redux/features/customerSlice';
import Breadcrumb from '@/components/Breadcrumb';
import StatusModal from '@/components/StatusModal';
import { checkActionPermission } from '@/config/permissions';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Loader from '@/components/Loader';
import ConfirmationModal from '@/components/ConfirmationModal';
import PaginationComponent from '@/components/shared/Pagination';
import SortableHeader from '@/components/shared/SortableHeader';

import ExportExcel from '@/components/shared/ExportExcel';
import api from '@/lib/axios';

const LeadsPage = () => {
  const [mounted, setMounted] = useState(false);
  const dispatch = useDispatch();
  const { user, company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items, filters, pagination, sorting, loading, upcomingCount } = useSelector((state: RootState) => state.leads);
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);
  const [leadReminderDays, setLeadReminderDays] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'all' | 'reminders'>('all');
  const [reminderScope, setReminderScope] = useState<'all' | 'today' | 'tomorrow' | 'week' | 'overdue'>('all');

  const [searchInput, setSearchInput] = useState(filters.search || '');

  useEffect(() => {
    setSearchInput(filters.search || '');
  }, [filters.search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== (filters.search || '')) {
        dispatch(setLeadFilters({ search: searchInput }));
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, dispatch, filters.search]);

  const [modal, setModal] = useState<{ isOpen: boolean; title: string; message: string; type?: 'success' | 'error' | 'info' }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
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
    return () => {
      dispatch(resetLeadState());
    };
  }, [dispatch]);

  // Load configured lead visit reminder days from company mail settings
  useEffect(() => {
    if (activeCompany?.id) {
      api.get('/settings/mail', { params: { company_id: activeCompany.id } })
        .then(res => {
          if (res.data?.leadReminderDays) {
            setLeadReminderDays(Number(res.data.leadReminderDays));
          }
        })
        .catch(() => {});
    }
  }, [activeCompany?.id]);

  useEffect(() => {
    (dispatch as any)(fetchLeads({
      companyId: activeCompany?.id,
      page: pagination.currentPage,
      limit: pagination.itemsPerPage,
      search: filters.search,
      status: filters.status,
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      sortBy: sorting.sortBy,
      sortOrder: sorting.sortOrder,
      upcomingReminders: activeTab === 'reminders',
      reminderScope: activeTab === 'reminders' ? reminderScope : undefined
    }));
  }, [
    dispatch, 
    activeCompany?.id, 
    pagination.currentPage, 
    pagination.itemsPerPage, 
    filters.search, 
    filters.status, 
    filters.fromDate, 
    filters.toDate, 
    sorting.sortBy, 
    sorting.sortOrder,
    activeTab,
    reminderScope
  ]);

  if (!mounted) return null;

  const totalPages = pagination.totalPages;
  const paginatedItems = items;

  const handleTabChange = (tab: 'all' | 'reminders') => {
    setActiveTab(tab);
    dispatch(setLeadPage(1));
  };

  const handleReminderScopeChange = (scope: 'all' | 'today' | 'tomorrow' | 'week' | 'overdue') => {
    setReminderScope(scope);
    dispatch(setLeadPage(1));
  };

  const handleSort = (field: string) => {
    const newOrder = sorting.sortBy === field && sorting.sortOrder === 'asc' ? 'desc' : 'asc';
    dispatch(setLeadSorting({ sortBy: field, sortOrder: newOrder }));
  };

  const handlePromoteParams = (lead: any) => {
    setConfirmModal({ isOpen: true, id: lead.id, type: 'promote', leadData: lead });
  };

  const handleDeleteParams = (id: string) => {
    setConfirmModal({ isOpen: true, id, type: 'delete' });
  };

  const confirmAction = async () => {
    if (!confirmModal.id || !confirmModal.type) return;

    if (confirmModal.type === 'promote') {
      const lead = confirmModal.leadData;
      if (String(lead.id).startsWith('cust_')) {
        const customerId = String(lead.id).replace(/^cust_/, '');
        await (dispatch as any)(updateCustomer({
          id: customerId,
          name: lead.company || lead.name,
          email: lead.email,
          phone: lead.phone,
          company: lead.company || lead.name,
          industry: lead.industry,
          status: 'active',
          agentId: lead.agentId,
          company_id: lead.company_id || lead.companyId || activeCompany?.id,
        }));
      } else {
        await (dispatch as any)(createCustomer({
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          company: lead.company,
          industry: lead.industry,
          status: 'active',
          agentId: lead.agentId,
          company_id: lead.company_id || lead.companyId || activeCompany?.id,
        }));
      }
      (dispatch as any)(deleteLead(lead.id));
      setModal({
        isOpen: true,
        title: 'Lead Converted!',
        message: `${lead.company || lead.name} is now an active customer. All logistics and invoicing modules are enabled for this client.`
      });
    } else if (confirmModal.type === 'delete') {
      (dispatch as any)(deleteLead(confirmModal.id));
    }
  };

  const getStatusBadge = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'new':
      case 'lead':
        return <span className="badge bg-primary-soft text-primary px-2 py-1 rounded-pill small fw-800">NEW</span>;
      case 'contacted': return <span className="badge bg-info-soft text-info px-2 py-1 rounded-pill small fw-800">CONTACTED</span>;
      case 'qualified': return <span className="badge bg-warning-soft text-warning px-2 py-1 rounded-pill small fw-800">QUALIFIED</span>;
      case 'converted': return <span className="badge bg-success-soft text-success px-2 py-1 rounded-pill small fw-800">CONVERTED</span>;
      default: return null;
    }
  };

  const getVisitDateBadge = (dateStr?: string) => {
    if (!dateStr) {
      return <span className="text-muted small fst-italic">Not Scheduled</span>;
    }

    try {
      const visitDate = new Date(dateStr);
      if (isNaN(visitDate.getTime())) {
        return <span className="text-muted small">{dateStr}</span>;
      }

      const now = new Date();
      const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const visitMidnight = new Date(visitDate.getFullYear(), visitDate.getMonth(), visitDate.getDate());
      const diffDays = Math.round((visitMidnight.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));

      const formatted = visitDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

      if (diffDays === leadReminderDays) {
        return (
          <span className="badge bg-warning text-dark border border-warning-subtle px-2 py-1 rounded-pill small fw-bold" title={`Scheduled for automated visit reminder (${leadReminderDays} day${leadReminderDays > 1 ? 's' : ''} in advance)`}>
            <i className="bi bi-bell-fill text-danger me-1"></i>
            {diffDays === 1 ? 'Tomorrow' : `In ${diffDays} Days`} ({formatted})
          </span>
        );
      } else if (diffDays === 0) {
        return (
          <span className="badge bg-danger text-white px-2 py-1 rounded-pill small fw-bold" title="Scheduled Today">
            <i className="bi bi-clock-fill me-1"></i>
            Today ({formatted})
          </span>
        );
      } else if (diffDays === 1) {
        return (
          <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-1 rounded-pill small fw-semibold" title="Scheduled Tomorrow">
            <i className="bi bi-calendar-event me-1"></i>
            Tomorrow ({formatted})
          </span>
        );
      } else if (diffDays < 0) {
        return (
          <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1 rounded-pill small fw-semibold" title="Visit Date Has Passed">
            <i className="bi bi-calendar-x me-1"></i>
            Overdue ({formatted})
          </span>
        );
      } else {
        return (
          <span className="badge bg-light text-dark border px-2 py-1 rounded-pill small fw-medium" title={`Upcoming in ${diffDays} days`}>
            <i className="bi bi-calendar-event text-primary me-1"></i>
            {formatted}
          </span>
        );
      }
    } catch {
      return <span className="small text-muted">{dateStr}</span>;
    }
  };

  const handleSendVisitReminder = async (lead: any) => {
    if (!lead.agentId && !lead.agent_id) {
      setModal({
        isOpen: true,
        title: 'No Sales Person Assigned',
        message: 'This lead has not been assigned to a Sales Person yet. Please edit the lead and select a Sales Person first.'
      });
      return;
    }

    try {
      setSendingReminderId(lead.id);
      const res = await api.post(`/leads/${lead.id}/send-visit-reminder`, {
        company_id: activeCompany?.id
      });

      setModal({
        isOpen: true,
        title: 'Visit Reminder Sent!',
        message: res.data?.message || `Visit reminder notification sent to ${lead.agentName || 'Assigned Sales Person'} (${lead.agentEmail || res.data?.recipient || 'registered email'}).`
      });
    } catch (err: any) {
      console.error('Failed to send visit reminder:', err);
      setModal({
        isOpen: true,
        title: 'Failed to Send Reminder',
        message: err.response?.data?.error || err.message || 'Could not send visit reminder email via SMTP.'
      });
    } finally {
      setSendingReminderId(null);
    }
  };

  const handlePrintLeadRecord = (lead: any) => {
    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return;
    const visitDateText = lead.next_visit_date || lead.nextVisitDate 
      ? new Date(lead.next_visit_date || lead.nextVisitDate).toLocaleDateString('en-GB')
      : 'Not Scheduled';
    const agentText = lead.agentName ? `${lead.agentName} (${lead.agentEmail || 'No Email'})` : 'Unassigned';

    printWindow.document.write('<html><head><title>Lead Summary</title>');
    printWindow.document.write('<style>body { font-family: var(--font-inter), Inter, sans-serif; padding: 40px; color: #333; } .header { border-bottom: 2px solid #ea580c; padding-bottom: 20px; margin-bottom: 30px; } .label { font-weight: bold; color: #666; font-size: 0.8rem; text-transform: uppercase; margin-bottom: 4px; } .value { font-size: 1.1rem; margin-bottom: 20px; font-weight: 500; } .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write('<div class="header"><h1 style="margin: 0; color: #ea580c;">Globus Engineering CRM</h1><p style="margin: 5px 0 0; color: #666;">Lead Summary Record</p></div>');
    printWindow.document.write('<div class="grid">');
    printWindow.document.write(`<div><div class="label">Contact Name</div><div class="value">${lead.name}</div></div>`);
    printWindow.document.write(`<div><div class="label">Company</div><div class="value">${lead.company}</div></div>`);
    printWindow.document.write(`<div><div class="label">Source</div><div class="value">${lead.source}</div></div>`);
    printWindow.document.write(`<div><div class="label">Industry</div><div class="value">${lead.industry}</div></div>`);
    printWindow.document.write(`<div><div class="label">Next Visit Date</div><div class="value">${visitDateText}</div></div>`);
    printWindow.document.write(`<div><div class="label">Assigned Sales Person</div><div class="value">${agentText}</div></div>`);
    printWindow.document.write(`<div><div class="label">Current Status</div><div class="value">${lead.status.toUpperCase()}</div></div>`);
    printWindow.document.write('</div>');
    printWindow.document.write('<div style="margin-top: 50px; text-align: center; font-size: 0.8rem; color: #999; border-top: 1px solid #eee; padding-top: 20px;">Prospect Inquiry Record on ' + new Date().toLocaleString() + '</div>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  const handleExportPDFLeadRecord = (lead: any) => {
    const doc = new jsPDF();
    const visitDateText = lead.next_visit_date || lead.nextVisitDate 
      ? new Date(lead.next_visit_date || lead.nextVisitDate).toLocaleDateString('en-GB')
      : 'Not Scheduled';
    const agentText = lead.agentName ? `${lead.agentName} (${lead.agentEmail || 'No Email'})` : 'Unassigned';

    doc.setFillColor(37, 99, 235); doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.text("GLOBUS ENGINEERING", 14, 25);
    doc.setFontSize(10); doc.text("LEAD SUMMARY RECORD", 14, 32);
    doc.setTextColor(33, 33, 33); doc.setFontSize(12); doc.text("PROSPECT DETAILS", 14, 55);
    autoTable(doc, {
      startY: 60,
      body: [
        ['Contact Name', lead.name], ['Company', lead.company],
        ['Next Visit Date', visitDateText],
        ['Assigned Sales Person', agentText],
        ['Source', lead.source], ['Industry', lead.industry],
        ['Current Status', (lead.status || '').toUpperCase()]
      ],
      theme: 'grid', styles: { cellPadding: 8, fontSize: 10 },
      columnStyles: { 0: { fontStyle: 'bold', fillColor: [245, 245, 245], cellWidth: 50 } },
    });
    doc.save(`lead_${(lead.company || lead.name || 'record').replace(/\s+/g, '_')}.pdf`);
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
          <Link 
            href="/settings?tab=mail" 
            className="badge bg-light text-muted border text-decoration-none px-3 py-2 rounded-pill small d-flex align-items-center gap-1 shadow-xs"
            title="Click to configure lead reminder days in Settings"
          >
            <i className="bi bi-bell-fill text-warning"></i>
            <span>Reminder: <strong>{leadReminderDays} day{leadReminderDays > 1 ? 's' : ''} before</strong></span>
            <i className="bi bi-gear text-secondary ms-1" style={{ fontSize: '11px' }}></i>
          </Link>
          <ExportExcel
            data={items}
            fileName={activeTab === 'reminders' ? "Upcoming_Lead_Reminders" : "Leads_List"}
            headers={{ 
              name: 'Name', 
              company: 'Company', 
              nextVisitDate: 'Next Visit Date',
              agentName: 'Sales Person',
              industry: 'Industry', 
              source: 'Source', 
              status: 'Status', 
              createdAt: 'Inquiry Date' 
            }}
            buttonText={activeTab === 'reminders' ? "Export Reminders" : "Export List"}
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
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
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

      {/* Lead Management Table with Tabs */}
      <div className="card border-0 shadow-sm overflow-hidden rounded-4">
        {/* Navigation Tabs Header */}
        <div className="d-flex text-uppercase py-2 mb-0 px-3 bg-white border-bottom align-items-center justify-content-between flex-wrap gap-2">
          <div className="d-flex gap-2 align-items-center">
            <button
              type="button"
              className={`btn shadow-none border-0 rounded-3 py-2 px-3 fw-bold small transition-all d-flex align-items-center gap-2 ${activeTab === 'all' ? 'bg-primary-subtle text-primary border border-primary-subtle shadow-xs' : 'text-muted'}`}
              onClick={() => handleTabChange('all')}
            >
              <i className="bi bi-people-fill"></i>
              <span>All Prospects</span>
              {activeTab === 'all' && (
                <span className="badge bg-primary text-white rounded-pill px-2 py-1 ms-1">
                  {pagination.totalItems || items.length}
                </span>
              )}
            </button>

            <button
              type="button"
              className={`btn shadow-none border-0 rounded-3 py-2 px-3 fw-bold small transition-all d-flex align-items-center gap-2 ${activeTab === 'reminders' ? 'bg-warning-subtle text-warning-emphasis border border-warning-subtle shadow-xs' : 'text-muted'}`}
              onClick={() => handleTabChange('reminders')}
            >
              <i className="bi bi-bell-fill text-warning"></i>
              <span>Upcoming Reminders</span>
              <span className={`badge rounded-pill px-2 py-1 ms-1 ${activeTab === 'reminders' ? 'bg-warning text-dark' : 'bg-secondary-subtle text-secondary'}`}>
                {upcomingCount > 0 ? upcomingCount : items.filter(l => l.nextVisitDate || l.next_visit_date).length}
              </span>
            </button>
          </div>

          {/* Sub-filters for Upcoming Reminders Tab */}
          {activeTab === 'reminders' && (
            <div className="d-flex gap-1 align-items-center flex-wrap">
              <span className="text-muted x-small fw-bold me-1 text-uppercase">Timeline:</span>
              {[
                { id: 'all', label: 'All Scheduled' },
                { id: 'today', label: 'Today', icon: 'bi-clock-fill text-danger' },
                { id: 'tomorrow', label: 'Tomorrow', icon: 'bi-calendar-event text-warning' },
                { id: 'week', label: 'Next 7 Days', icon: 'bi-calendar-week text-primary' },
                { id: 'overdue', label: 'Overdue', icon: 'bi-exclamation-triangle-fill text-danger' }
              ].map(sub => (
                <button
                  key={sub.id}
                  type="button"
                  className={`btn btn-sm rounded-pill px-2 py-1 shadow-none transition-all ${reminderScope === sub.id ? 'btn-dark text-white fw-bold shadow-xs' : 'btn-light border text-muted'}`}
                  style={{ fontSize: '0.75rem' }}
                  onClick={() => handleReminderScopeChange(sub.id as any)}
                >
                  {sub.icon && <i className={`bi ${sub.icon} me-1`}></i>}
                  {sub.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reminder Information Banner */}
        {activeTab === 'reminders' && (
          <div className="px-4 py-2 bg-warning-subtle bg-opacity-25 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2 small text-dark">
              <i className="bi bi-info-circle-fill text-warning fs-6"></i>
              <span>Automated system triggers reminders to sales agents <strong>{leadReminderDays} day{leadReminderDays > 1 ? 's' : ''}</strong> before scheduled visit dates.</span>
            </div>
            <Link href="/settings?tab=mail" className="small text-decoration-none fw-semibold text-primary">
              Configure Schedule in Settings &rarr;
            </Link>
          </div>
        )}

        <div className="card-body p-0">
          <div className="table-responsive" style={{ minHeight: '400px', paddingBottom: '80px' }}>
            <table className="table table-hover align-middle mb-0">
          <thead>
            {activeTab === 'reminders' ? (
              <tr className="bg-light">
                <SortableHeader field="name" label="Prospect / Company" currentSortBy={sorting.sortBy} currentSortOrder={sorting.sortOrder} onSort={handleSort} className="px-4 py-3 small fw-800 text-muted text-capitalize tracking-widest" />
                <SortableHeader field="next_visit_date" label="Scheduled Visit & Status" currentSortBy={sorting.sortBy} currentSortOrder={sorting.sortOrder} onSort={handleSort} className="py-3 small fw-800 text-muted text-capitalize tracking-widest" />
                <th className="py-3 small fw-800 text-muted text-capitalize tracking-widest border-0">Assigned Sales Person</th>
                <th className="py-3 small fw-800 text-muted text-capitalize tracking-widest border-0">Contact Details</th>
                <SortableHeader field="status" label="Status" currentSortBy={sorting.sortBy} currentSortOrder={sorting.sortOrder} onSort={handleSort} className="py-3 small fw-800 text-muted text-capitalize tracking-widest" />
                <th className="py-3 small fw-800 text-muted text-capitalize tracking-widest border-0 text-center">Send Alert</th>
                <th className="py-3 small fw-800 text-muted text-capitalize tracking-widest border-0 text-center px-4">Action</th>
              </tr>
            ) : (
              <tr className="bg-light">
                <SortableHeader field="name" label="Prospect Info" currentSortBy={sorting.sortBy} currentSortOrder={sorting.sortOrder} onSort={handleSort} className="px-4 py-3 small fw-800 text-muted text-capitalize tracking-widest" />
                <SortableHeader field="next_visit_date" label="Next Visit" currentSortBy={sorting.sortBy} currentSortOrder={sorting.sortOrder} onSort={handleSort} className="py-3 small fw-800 text-muted text-capitalize tracking-widest" />
                <th className="py-3 small fw-800 text-muted text-capitalize tracking-widest border-0">Sales Person</th>
                <SortableHeader field="source" label="Source" currentSortBy={sorting.sortBy} currentSortOrder={sorting.sortOrder} onSort={handleSort} className="py-3 small fw-800 text-muted text-capitalize tracking-widest" />
                <SortableHeader field="status" label="Status" currentSortBy={sorting.sortBy} currentSortOrder={sorting.sortOrder} onSort={handleSort} className="py-3 small fw-800 text-muted text-capitalize tracking-widest" />
                <SortableHeader field="industry" label="Industry" currentSortBy={sorting.sortBy} currentSortOrder={sorting.sortOrder} onSort={handleSort} className="py-3 small fw-800 text-muted text-capitalize tracking-widest" />
                <th className="py-3 small fw-800 text-muted text-capitalize tracking-widest border-0 text-center px-4">Action</th>
              </tr>
            )}
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7}>
                  <Loader text={activeTab === 'reminders' ? "Fetching Upcoming Reminders..." : "Fetching Leads..."} />
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-5">
                  {activeTab === 'reminders' ? (
                    <div className="py-4">
                      <i className="bi bi-bell-slash text-muted" style={{ fontSize: '3rem', opacity: 0.4 }}></i>
                      <h6 className="fw-bold text-dark mt-3 mb-1">No upcoming visit reminders found</h6>
                      <p className="text-muted small mb-3">
                        {reminderScope === 'all' 
                          ? "There are no leads with scheduled visit dates yet." 
                          : `No scheduled visits found for '${reminderScope}'.`}
                      </p>
                      <Link href="/leads/new" className="btn btn-sm btn-primary rounded-pill px-3">
                        <i className="bi bi-plus-lg me-1"></i> Schedule a New Visit
                      </Link>
                    </div>
                  ) : (
                    <div className="text-muted fw-600">No leads found in your current view.</div>
                  )}
                </td>
              </tr>
            ) : activeTab === 'reminders' ? (
              paginatedItems.map((lead) => (
                <tr key={lead.id} className="border-bottom table-row-hover">
                  {/* Prospect / Company */}
                  <td className="px-4 py-3">
                    <div>
                      <div className="fw-800 text-dark mb-0 fs-6">{lead.name}</div>
                      <div className="small text-muted fw-600">{lead.company}</div>
                      {lead.industry && (
                        <span className="badge bg-light text-muted border border-light-subtle rounded-pill x-small mt-1">
                          {lead.industry}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Scheduled Visit & Status */}
                  <td>
                    <div className="d-flex flex-column gap-1">
                      {getVisitDateBadge(lead.next_visit_date || lead.nextVisitDate)}
                      {lead.productInterest && (
                        <div className="text-muted x-small text-truncate" style={{ maxWidth: '180px' }} title={lead.productInterest}>
                          <i className="bi bi-tag me-1"></i>{lead.productInterest}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Assigned Sales Person */}
                  <td>
                    {lead.agentName ? (
                      <div>
                        <div className="fw-700 text-dark small">
                          <i className="bi bi-person-fill text-primary me-1"></i>
                          {lead.agentName}
                        </div>
                        {lead.agentEmail && (
                          <div className="text-muted x-small" title={lead.agentEmail}>
                            <i className="bi bi-envelope me-1"></i>
                            {lead.agentEmail}
                          </div>
                        )}
                        {lead.agentPhone && (
                          <div className="text-muted x-small">
                            <i className="bi bi-telephone me-1"></i>
                            {lead.agentPhone}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="badge bg-warning-subtle text-warning-emphasis px-2 py-1 rounded-pill small">
                        <i className="bi bi-exclamation-circle me-1"></i>Unassigned
                      </span>
                    )}
                  </td>

                  {/* Contact Details */}
                  <td>
                    <div>
                      {lead.phone && (
                        <div>
                          <a href={`tel:${lead.phone}`} className="text-decoration-none small text-dark fw-semibold">
                            <i className="bi bi-telephone-fill text-success me-1"></i>{lead.phone}
                          </a>
                        </div>
                      )}
                      {lead.email && (
                        <div>
                          <a href={`mailto:${lead.email}`} className="text-decoration-none x-small text-muted text-truncate d-inline-block" style={{ maxWidth: '160px' }}>
                            <i className="bi bi-envelope-fill text-secondary me-1"></i>{lead.email}
                          </a>
                        </div>
                      )}
                      {lead.assignedArea && (
                        <div className="x-small text-muted">
                          <i className="bi bi-geo-alt me-1"></i>{lead.assignedArea}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td>{getStatusBadge(lead.status)}</td>

                  {/* Send Alert Button */}
                  <td className="text-center">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-warning text-dark border-warning-subtle shadow-none rounded-pill px-3 py-1 d-inline-flex align-items-center gap-1"
                      style={{ fontSize: '0.8rem' }}
                      disabled={sendingReminderId === lead.id}
                      onClick={() => handleSendVisitReminder(lead)}
                      title="Send Email Reminder to Sales Person"
                    >
                      {sendingReminderId === lead.id ? (
                        <>
                          <span className="spinner-border spinner-border-sm text-warning" role="status" aria-hidden="true"></span>
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <i className="bi bi-bell-fill text-warning"></i>
                          <span className="fw-semibold">Send Reminder</span>
                        </>
                      )}
                    </button>
                  </td>

                  {/* Action dropdown */}
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
                          id={`actions-rem-${lead.id}`} 
                          data-bs-toggle="dropdown" 
                          aria-expanded="false"
                          style={{ width: '32px', height: '32px', borderRadius: '8px' }}
                        >
                          <i className="bi bi-three-dots-vertical fs-5"></i>
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3 py-2" aria-labelledby={`actions-rem-${lead.id}`}>
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
                    {getVisitDateBadge(lead.next_visit_date || lead.nextVisitDate)}
                  </td>
                  <td>
                    {lead.agentName ? (
                      <div>
                        <div className="fw-700 text-dark small">
                          <i className="bi bi-person-fill text-primary me-1"></i>
                          {lead.agentName}
                        </div>
                        {lead.agentEmail && (
                          <div className="text-muted small" style={{ fontSize: '0.78rem' }} title={lead.agentEmail}>
                            <i className="bi bi-envelope me-1"></i>
                            {lead.agentEmail}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="badge bg-secondary-subtle text-secondary px-2 py-1 rounded-pill small">Unassigned</span>
                    )}
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
                            <li>
                              <button 
                                className="dropdown-item d-flex align-items-center gap-2 py-2 text-primary" 
                                type="button"
                                disabled={sendingReminderId === lead.id}
                                onClick={() => handleSendVisitReminder(lead)}
                              >
                                {sendingReminderId === lead.id ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm text-primary" role="status" aria-hidden="true"></span>
                                    <span className="small fw-semibold">Sending Reminder...</span>
                                  </>
                                ) : (
                                  <>
                                    <i className="bi bi-bell-fill text-warning"></i>
                                    <span className="small fw-semibold">Send Visit Reminder to Agent</span>
                                  </>
                                )}
                              </button>
                            </li>
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
          <span className="text-muted small">Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} to {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems} entries</span>
            <PaginationComponent 
              currentPage={pagination.currentPage} 
              totalPages={totalPages} 
              onPageChange={(page) => dispatch(setLeadPage(page))} 
            />

        </div>
      )}
    </div>
  </div>

      <StatusModal 
        isOpen={modal.isOpen}
        onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
        type={modal.type || 'success'}
        title={modal.title}
        message={modal.message}
      />

      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null, type: null })}
        onConfirm={confirmAction}
        title={confirmModal.type === 'promote' ? "Promote Prospect" : "Remove Lead Record"}
        message={confirmModal.type === 'promote' ? `Are you sure you want to promote ${confirmModal.leadData?.company || confirmModal.leadData?.name || 'this lead'} to an active customer? All logistics and invoicing modules will be enabled for this client.` : "Are you sure you want to delete this lead? All follow-up history will be permanently removed. This action cannot be undone."}
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
