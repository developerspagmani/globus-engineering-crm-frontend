'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { fetchOutwards, deleteOutward, setOutwardFilters } from '@/redux/features/outwardSlice';
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
  const { items: outwards, filters, loading } = useSelector((state: RootState) => state.outward);
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
            <button className="btn btn-outline-dark d-flex align-items-center gap-2 px-3 shadow-sm" onClick={() => window.print()} style={{ height: '42px', borderRadius: '10px' }}>
              <i className="bi bi-printer-fill"></i>
              <span className="fw-800 small text-uppercase">Print List</span>
            </button>
            {mounted && checkActionPermission(user, 'mod_outward', 'create') && (
              <Link href="/outward/new" className="btn btn-primary d-flex align-items-center gap-2 px-4 shadow-sm" style={{ height: '42px', borderRadius: '10px' }}>
                <i className="bi bi-box-arrow-right"></i>
                <span className="fw-800 small text-uppercase">New Outward Entry</span>
              </Link>
            )}
          </div>
        </div>

        {/* Filter Section - Aligned in one row */}
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 p-3 bg-white">
          <div className="row g-3 align-items-center">
            <div className="col-lg-4 col-md-6">
              <div className="position-relative">
                <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                <input
                  type="text"
                  placeholder="Search by outward no, party name..."
                  className="form-control ps-5 border-light search-bar"
                  style={{ height: '42px', borderRadius: '10px'}}
                  value={filters.search}
                  onChange={(e) => dispatch(setOutwardFilters({ search: e.target.value }))}
                />
              </div>
            </div>
            <div className="col-lg-2 col-md-6">
              <select className="form-select border-light  text-dark" 
                style={{ height: '42px', borderRadius: '10px'}}
                value={filters.status} onChange={(e) => dispatch(setOutwardFilters({ status: e.target.value as any }))}>
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="col-auto ms-auto d-flex align-items-center gap-2">
               <div className="d-flex align-items-center gap-2 bg-white px-3 py-1 shadow-sm border" style={{ borderRadius: '8px', height: '42px' }}>
                <input 
                  type="date" 
                   className="form-control py-1 border-0 shadow-none bg-transparent" 
                  style={{ fontSize: '0.85rem' }}
                  value={filters.fromDate}
                  onChange={(e) => dispatch(setOutwardFilters({ fromDate: e.target.value }))}
                />
                </div>
                 <span className="text-muted small fw-bold mx-1">TO</span>
                 <div className="d-flex align-items-center gap-2 bg-white px-3 py-1 shadow-sm border" style={{ borderRadius: '8px', height: '42px' }}>
                    <input 
                      type="date" 
                       className="form-control py-1 border-0 shadow-none bg-transparent" 
                      style={{ fontSize: '0.85rem' }}
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
                  <tr className="text-uppercase small fw-bold text-muted">
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
                  {filteredOutwards.map((item, index) => (
                    <tr key={item.id} className="border-bottom border-light">
                      <td className="px-4 text-muted fw-bold">{index+1}</td>
                      <td className="fw-900 text-dark fs-6">{item.outwardNo || 'N/A'}</td>
                      <td className="text-muted small ">
                         {item.partyType === 'vendor' ? item.vendorName : item.customerName}
                      </td>
                      <td>
                         <span className={`badge rounded-pill px-2 py-1 small fw-bold ${item.partyType === 'vendor' ? 'bg-info-subtle text-info' : 'bg-primary-subtle text-primary'}`}>
                            {(item.partyType || 'customer').toUpperCase()}
                         </span>
                      </td>
                      <td><span className="badge bg-light text-dark border-0 shadow-inner px-2 py-1 fw-bold" style={{ borderRadius: '6px' }}>{item.invoiceReference || '-'}</span></td>
                      <td className="text-muted small fw-bold text-uppercase">{item.vehicleNo || '-'}</td>
                      <td className="text-muted small fw-bold">{item.date}</td>
                      <td>
                        <span className={`badge rounded-pill px-3 py-1 small fw-bold ${item.status==='completed'?'bg-success-subtle text-success':'bg-warning-subtle text-warning'}`}>
                          {(item.status || 'pending').toUpperCase()}
                        </span>
                      </td>
                      <td className="text-center px-4">
                        <div className="d-flex justify-content-center align-items-center gap-1">
                          <Link href={`/outward/${item.id}/edit`} className="btn-action-view" title="View Detail"><i className="bi bi-eye-fill"></i></Link>
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
        </div>
      </div>
      <ConfirmationModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, id: null })} onConfirm={confirmDelete} title="Remove Outward Record" message="Are you sure you want to delete this record? This action is permanent and cannot be undone." />
      <style jsx>{` .fw-900 { font-weight: 900; } .bg-light-soft { background-color: #f7f9fc; } .table-responsive { min-height: 400px; padding-bottom: 80px; } `}</style>
    </ModuleGuard>
  );
}
