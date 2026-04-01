'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { fetchOutwards, deleteOutward, setOutwardFilters } from '@/redux/features/outwardSlice';
import Breadcrumb from '@/components/Breadcrumb';
import ModuleGuard from '@/components/ModuleGuard';
import Loader from '@/components/Loader';
import ConfirmationModal from '@/components/ConfirmationModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Link from 'next/link';

export default function OutwardListPage() {
  const dispatch = useDispatch();
  const { items: outwards, filters, loading } = useSelector((state: RootState) => state.outward);
  const { company } = useSelector((state: RootState) => state.auth);

  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });

  useEffect(() => {
    (dispatch as any)(fetchOutwards(company?.id));
  }, [dispatch, company?.id]);

  const filteredOutwards = outwards.filter(item => {
    // Company data isolation
    if (company?.id && item.company_id !== company.id.toString()) return false;

    const matchesSearch = (item.customerName || '').toLowerCase().includes(filters.search.toLowerCase()) ||
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
     p.document.write('<html><head><title>Print Outward</title><style>body{font-family:sans-serif;padding:40px;color:#333;}.label{font-weight:bold;color:#666;font-size:0.8rem;text-transform:uppercase;}.value{font-size:1.1rem;margin-bottom:20px;font-weight:500;}</style></head><body><h1>Globus Engineering</h1>');
     p.document.write(`<p><span class="label">Customer:</span><br/><span class="value">${item.customerName}</span></p>`);
     p.document.write(`<p><span class="label">Outward No:</span><br/><span class="value">${item.outwardNo || '-'}</span></p>`);
     p.document.write(`<p><span class="label">Date:</span><br/><span class="value">${item.date}</span></p>`);
     p.document.close(); p.print();
  };

  const handleExportPDFOutward = (item: any) => {
    const doc = new jsPDF();
    doc.text("GLOBUS ENGINEERING - OUTWARD RECEIPT", 14, 20);
    autoTable(doc, {
      startY: 30,
      body: [
        ['Customer', item.customerName],
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
      <div className="container-fluid py-4 min-vh-100" style={{ backgroundColor: '#f8fafc' }}>
        {/* Header Section matching screenshot */}
        <div className="d-flex justify-content-between align-items-start mb-4 px-3">
          <div>
            <h2 className="fw-bold mb-1">Outward Entries</h2>
            <p className="text-muted fs-6">Manage outgoing finished goods and customer dispatches.</p>
          </div>
          <Link href="/outward/new" className="btn d-flex align-items-center gap-2 px-4 shadow-sm text-white border-0 py-2 mt-2" 
            style={{ background: 'linear-gradient(135deg, #ff4c00 0%, #ff8c00 100%)', borderRadius: '12px' }}>
            <i className="bi bi-box-arrow-right fs-5"></i>
            <span className="fw-bold fs-6">New Outward Entry</span>
          </Link>
        </div>

        {/* Filter Section - Aligned in one row */}
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 p-3 bg-white">
          <div className="row g-3 align-items-center">
            <div className="col-lg-4 col-md-6">
              <div className="position-relative">
                <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                <input
                  type="text"
                  placeholder="Search by outward no, customer..."
                  className="form-control ps-5 border-light search-bar"
                  style={{ height: '54px', borderRadius: '15px'}}
                  value={filters.search}
                  onChange={(e) => dispatch(setOutwardFilters({ search: e.target.value }))}
                />
              </div>
            </div>
            <div className="col-lg-2 col-md-6">
              <select className="form-select border-light  text-dark" 
                style={{ height: '54px', borderRadius: '15px'}}
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
                    <th className="py-4 border-0">CUSTOMER</th>
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
                      <td className="text-muted small ">{item.customerName}</td>
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
                          {/* Fixed View Button using Link */}
                          <Link href={`/outward/${item.id}/edit`} className="btn-action-view" title="View Detail"><i className="bi bi-eye-fill"></i></Link>
                          <div className="dropdown">
                            <button className="btn btn-sm btn-outline-secondary border-0 text-muted p-0 ms-1 d-flex align-items-center justify-content-center" data-bs-toggle="dropdown" style={{ width: '32px', height: '32px', borderRadius: '8px' }}>
                              <i className="bi bi-three-dots-vertical fs-5"></i>
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end shadow border-0 rounded-3 py-2">
                              <li><button className="dropdown-item d-flex align-items-center gap-2 py-2 small fw-bold" onClick={() => handlePrintOutward(item)}><i className="bi bi-printer text-primary"></i> Quick Print</button></li>
                              {/* Added missing Export PDF */}
                              <li><button className="dropdown-item d-flex align-items-center gap-2 py-2 small fw-bold" onClick={() => handleExportPDFOutward(item)}><i className="bi bi-file-earmark-pdf text-danger"></i> Export PDF</button></li>
                              <li><hr className="dropdown-divider opacity-50" /></li>
                              <li><button className="dropdown-item d-flex align-items-center gap-2 py-2 text-danger small fw-bold" onClick={() => handleDeleteParams(item.id)}><i className="bi bi-trash3"></i> Remove Record</button></li>
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
