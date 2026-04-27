'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { fetchOutwards, deleteOutward, setOutwardFilters, setOutwardPage } from '@/redux/features/outwardSlice';
import Breadcrumb from '@/components/Breadcrumb';
import ModuleGuard from '@/components/ModuleGuard';
import Loader from '@/components/Loader';
import ConfirmationModal from '@/components/ConfirmationModal';
import { checkActionPermission } from '@/config/permissions';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Link from 'next/link';
import ExportExcel from '@/components/shared/ExportExcel';

export default function OutwardListPage() {
  const dispatch = useDispatch();
  const { items: outwards, filters, pagination, loading } = useSelector((state: RootState) => state.outward);
  const { company, user } = useSelector((state: RootState) => state.auth);

  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
  const [mounted, setMounted] = useState(false);


  useEffect(() => {
    setMounted(true);
    (dispatch as any)(fetchOutwards(company?.id));
  }, [dispatch, company?.id]);

  const filteredOutwards = outwards.filter(item => {
    // Company data isolation
    if (company?.id && item.company_id !== company.id.toString()) return false;

    const matchesSearch = (item.customerName || '').toLowerCase().includes(filters.search.toLowerCase()) ||
                         (item.vendorName || '').toLowerCase().includes(filters.search.toLowerCase()) ||
                         (item.outwardNo || '').toLowerCase().includes(filters.search.toLowerCase()) ||
                         (item.invoiceReference || '').toLowerCase().includes(filters.search.toLowerCase());
    const matchesStatus = filters.status === 'all' || item.status === filters.status;
    
    // Date range filtering
    if (filters.fromDate && item.date && new Date(item.date) < new Date(filters.fromDate)) return false;
    if (filters.toDate && item.date && new Date(item.date) > new Date(filters.toDate)) return false;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredOutwards.length / pagination.itemsPerPage);
  const paginatedOutwards = filteredOutwards.slice(
    (pagination.currentPage - 1) * pagination.itemsPerPage,
    pagination.currentPage * pagination.itemsPerPage
  );

  const handleDeleteParams = (id: string) => { setDeleteModal({ isOpen: true, id }); };
  const confirmDelete = () => { if (deleteModal.id) (dispatch as any)(deleteOutward(deleteModal.id)); };

  const handlePrintOutward = (item: any) => {
     const p = window.open('', '', 'height=600,width=800'); if (!p) return;
     const partyName = item.partyType === 'vendor' ? item.vendorName : item.customerName;
     p.document.write('<html><head><title>Print Outward</title><style>body{font-family:sans-serif;padding:40px;color:#333;}.label{font-weight:bold;color:#666;font-size:0.8rem;text-transform:uppercase;}.value{font-size:1.1rem;margin-bottom:20px;font-weight:500;}</style></head><body><h1>Globus Engineering</h1>');
     p.document.write(`<p><span class="label">Party:</span><br/><span class="value">${partyName} (${(item.partyType || 'customer').toUpperCase()})</span></p>`);
     p.document.write(`<p><span class="label">Outward No:</span><br/><span class="value">${item.outwardNo || '-'}</span></p>`);
     p.document.write(`<p><span class="label">Date:</span><br/><span class="value">${item.date}</span></p>`);
     p.document.close(); p.print();
  };

  const handleExportPDFOutward = (item: any) => {
    const doc = new jsPDF();
    const partyName = item.partyType === 'vendor' ? item.vendorName : item.customerName;
    doc.text("GLOBUS ENGINEERING - OUTWARD RECEIPT", 14, 20);
    autoTable(doc, {
      startY: 30,
      body: [
        ['Party', partyName],
        ['Type', (item.partyType || 'customer').toUpperCase()],
        ['Outward No', item.outwardNo || '-'],
        ['Invoice Ref', item.invoiceReference || '-'],
        ['Date', item.date],
        ['Status', (item.status || 'pending').toUpperCase()],
      ],
    });
    doc.save(`outward_${item.outwardNo || 'record'}.pdf`);
  };

  return (
    <ModuleGuard moduleId="mod_outward">
      <div className="container-fluid py-4 min-vh-100 animate-fade-in px-4">
        {/* Header Section */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <Breadcrumb items={[{ label: 'Outward Logistics', active: true }]} />
            <h2 className="fw-900 tracking-tight text-dark mb-1 mt-2">Outward Entries</h2>
            <p className="text-muted small mb-0">Manage outgoing finished goods and customer/vendor dispatches.</p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <ExportExcel 
              data={filteredOutwards} 
              fileName="Outward_Records" 
              headers={{ outwardNo: 'Outward No', partyType: 'Type', customerName: 'Customer', vendorName: 'Vendor', invoiceReference: 'Invoice Ref', date: 'Date' }}
              buttonText="Export List"
            />
            {mounted && checkActionPermission(user, 'mod_outward', 'create') && (
              <Link href="/outward/new" className="btn btn-primary btn-page-action px-4">
                <i className="bi bi-box-arrow-right"></i>
                <span>Add Outward</span>
              </Link>
            )}
          </div>
        </div>

        {/* Filter Section - Aligned in one row */}
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
                    placeholder="Search by outward no, party name..."
                    className="form-control search-bar"
                    value={filters.search}
                    onChange={(e) => dispatch(setOutwardFilters({ search: e.target.value }))}
                  />
                </div>
              </div>
              <div className="filter-item-select">
                <select className="form-select search-bar" 
                  value={filters.status} 
                  onChange={(e) => dispatch(setOutwardFilters({ status: e.target.value as any }))}>
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="date-filter-group">
                <input 
                  type="date" 
                  className="text-muted" 
                  value={filters.fromDate}
                  onChange={(e) => dispatch(setOutwardFilters({ fromDate: e.target.value }))}
                />
                <span className="text-muted small fw-bold mx-1">TO</span>
                <input 
                  type="date" 
                  className="text-muted" 
                  value={filters.toDate}
                  onChange={(e) => dispatch(setOutwardFilters({ toDate: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
          <div className="table-responsive" style={{ minHeight: '400px', paddingBottom: '80px' }}>
            {loading ? <Loader text="Loading Records..." /> : (
              <table className="table align-middle mb-0 table-hover">
                <thead className="bg-light">
                  <tr className="text-capitalize small fw-bold text-muted">
                    <th className="px-4 py-4 border-0">SNO</th>
                    <th className="py-4 border-0">OUTWARD NO</th>
                    <th className="py-4 border-0">PARTY (CUSTOMER/VENDOR)</th>
                    <th className="py-4 border-0">TYPE</th>
                    <th className="py-4 border-0">INVOICE REF</th>
                    <th className="py-4 border-0">VEHICLE NO</th>
                    <th className="py-4 border-0">DATE</th>
                    <th className="py-4 border-0">STATUS</th>
                    <th className="py-4 border-0 text-center px-4" style={{ width: '130px' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOutwards.map((item, index) => (
                    <tr key={item.id} className="border-bottom border-light">
                      <td className="px-4 text-muted fw-bold">{(pagination.currentPage - 1) * pagination.itemsPerPage + index + 1}</td>
                      <td className="fw-900 text-dark fs-6">{item.outwardNo || 'N/A'}</td>
                      <td>
                        <div className="fw-900 text-dark fs-6 mb-0">{item.customerName || item.vendorName}</div>
                        <div className="x-small text-muted text-capitalize">{item.processName || (item.items?.[0]?.description) || '-'}</div>
                      </td>
                      <td>
                         <span className={`badge rounded-pill px-2 py-1 small fw-bold ${item.partyType === 'vendor' ? 'bg-info-subtle text-info' : 'bg-primary-subtle text-primary'}`}>
                            {(item.partyType || 'customer').toUpperCase()}
                         </span>
                      </td>
                      <td><span className="badge bg-light text-dark border-0 shadow-inner px-2 py-1 fw-bold" style={{ borderRadius: '6px' }}>{item.invoiceReference || '-'}</span></td>
                      <td className="text-muted small fw-bold text-capitalize">{item.vehicleNo || '-'}</td>
                      <td className="text-muted small fw-bold">{item.date}</td>
                      <td>
                        <span className={`badge rounded-pill px-3 py-1 small fw-bold ${item.status==='completed'?'bg-success-subtle text-success':'bg-warning-subtle text-warning'}`}>
                          {(item.status || 'pending').toUpperCase()}
                        </span>
                      </td>
                      <td className="text-center px-4">
                        <div className="d-flex justify-content-center align-items-center gap-1">
                          <Link href={`/outward/${item.id}/edit`} className="btn-action-view" title="View Detail"><i className="bi bi-eye-fill"></i></Link>
                          {mounted && checkActionPermission(user, 'mod_outward', 'edit') && (
                            <Link href={`/outward/${item.id}/edit?edit=true`} className="btn-action-edit" title="Edit Outward"><i className="bi bi-pencil-fill"></i></Link>
                          )}
                          <div className="dropdown">
                            <button className="btn btn-sm btn-outline-secondary border-0 text-muted p-0 ms-1 d-flex align-items-center justify-content-center" data-bs-toggle="dropdown" style={{ width: '32px', height: '32px', borderRadius: '8px' }}>
                              <i className="bi bi-three-dots-vertical fs-5"></i>
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end shadow border-0 rounded-3 py-2">
                              <li><button className="dropdown-item d-flex align-items-center gap-2 py-2 small fw-bold" onClick={() => handlePrintOutward(item)}><i className="bi bi-printer text-primary"></i> Quick Print</button></li>
                              {mounted && checkActionPermission(user, 'mod_outward', 'delete') && (
                                <>
                                  <li><hr className="dropdown-divider opacity-50" /></li>
                                  <li><button className="dropdown-item d-flex align-items-center gap-2 py-2 text-danger small fw-bold" onClick={() => handleDeleteParams(item.id)}><i className="bi bi-trash3"></i> Remove Record</button></li>
                                </>
                              )}
                            </ul>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredOutwards.length === 0 && (
                    <tr><td colSpan={8} className="text-center py-5 text-muted small">No outward entries found.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
          {totalPages > 1 && (
            <div className="p-3 border-top bg-light d-flex justify-content-between align-items-center px-4">
              <span className="text-muted small">Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} to {Math.min(pagination.currentPage * pagination.itemsPerPage, filteredOutwards.length)} of {filteredOutwards.length} entries</span>
              <nav>
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${pagination.currentPage === 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => dispatch(setOutwardPage(pagination.currentPage - 1))}>
                      <i className="bi bi-chevron-left"></i>
                    </button>
                  </li>
                  {[...Array(totalPages)].map((_, i) => (
                    <li key={i} className={`page-item ${pagination.currentPage === i + 1 ? 'active' : ''}`}>
                      <button className="page-link" onClick={() => dispatch(setOutwardPage(i + 1))}>{i + 1}</button>
                    </li>
                  ))}
                  <li className={`page-item ${pagination.currentPage === totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => dispatch(setOutwardPage(pagination.currentPage + 1))}>
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>
      <ConfirmationModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, id: null })} onConfirm={confirmDelete} title="Remove Outward Record" message="Are you sure you want to delete this record? This action is permanent and cannot be undone." />
      <style jsx>{` .fw-900 { font-weight: 900; } .bg-light-soft { background-color: #f7f9fc; } .table-responsive { min-height: 400px; padding-bottom: 80px; } `}</style>
    </ModuleGuard>
  );
}
