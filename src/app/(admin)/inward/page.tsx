'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { fetchInwards, deleteInward } from '@/redux/features/inwardSlice';
import Breadcrumb from '@/components/Breadcrumb';
import ModuleGuard from '@/components/ModuleGuard';
import Loader from '@/components/Loader';
import ConfirmationModal from '@/components/ConfirmationModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Link from 'next/link';

export default function InwardListPage() {
  const dispatch = useDispatch();
  const { items: inwards, loading } = useSelector((state: RootState) => state.inward);
  const { company } = useSelector((state: RootState) => state.auth);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });

  useEffect(() => {
    (dispatch as any)(fetchInwards(company?.id));
  }, [dispatch, company?.id]);

  const filteredInwards = inwards.filter(item => {
    // Company data isolation
    if (company?.id && item.company_id !== company.id.toString()) return false;

    const matchesSearch = (item.customerName || item.vendorName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.dcNo || item.challanNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.poReference || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDeleteParams = (id: string) => {
    setDeleteModal({ isOpen: true, id });
  };

  const confirmDelete = () => {
    if (deleteModal.id) {
      (dispatch as any)(deleteInward(deleteModal.id));
    }
  };

  const handleCopyTable = () => {
    const table = document.querySelector('table');
    if (!table) return;
    let text = "";
    const rows = table.querySelectorAll('tr');
    rows.forEach(row => {
      const cols = Array.from(row.querySelectorAll('th, td'));
      const rowData = cols.slice(0, -1).map(col => (col as HTMLElement).innerText.trim()).join("\t");
      text += rowData + "\n";
    });
    navigator.clipboard.writeText(text);
  };

  const handleExportExcel = () => {
    const rows = document.querySelectorAll('table tr');
    let csvContent = "data:text/csv;charset=utf-8,";
    rows.forEach(row => {
      const cols = Array.from(row.querySelectorAll('th, td'));
      const rowData = cols.slice(0, -1).map(col => `"${(col as HTMLElement).innerText.replace(/"/g, '""').trim()}"`).join(",");
      csvContent += rowData + "\r\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "inward_list.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintInward = (item: any) => {
    const p = window.open('', '', 'height=600,width=800');
    if (!p) return;
    p.document.write('<html><head><title>Print Inward</title><style>body{font-family:sans-serif;padding:40px;color:#333;}.label{font-weight:bold;color:#666;font-size:0.8rem;text-transform:uppercase;}.value{font-size:1.1rem;margin-bottom:20px;font-weight:500;}</style></head><body><h1>Globus Engineering</h1>');
    p.document.write(`<p><span class="label">Customer:</span><br/><span class="value">${item.customerName || item.vendorName}</span></p>`);
    p.document.write(`<p><span class="label">DC No:</span><br/><span class="value">${item.dcNo || item.challanNo || '-'}</span></p>`);
    p.document.write(`<p><span class="label">Date:</span><br/><span class="value">${item.date}</span></p>`);
    p.document.close(); p.print();
  };

  const handleExportPDFInward = (item: any) => {
    const doc = new jsPDF();
    doc.text("GLOBUS ENGINEERING - INWARD RECEIPT", 14, 20);
    autoTable(doc, {
      startY: 30,
      body: [
        ['Customer', item.customerName || item.vendorName],
        ['DC No', item.dcNo || item.challanNo || '-'],
        ['PO No', item.poReference || '-'],
        ['Date', item.date],
        ['Status', (item.status || 'pending').toUpperCase()],
      ],
    });
    doc.save(`inward_${item.dcNo}.pdf`);
  };

  return (
    <ModuleGuard moduleId="mod_inward">
      <div className="container-fluid py-4 min-vh-100" style={{ backgroundColor: '#f8fafc' }}>
        {/* Header Section */}
        <div className="d-flex justify-content-between align-items-start mb-4 px-3">
          <div>
            <h2 className="fw-bold mb-1">Inward Entries</h2>
            <p className="text-muted fs-6">Manage incoming materials and vendor gate receipts.</p>
          </div>
          <Link href="/inward/new" className="btn d-flex align-items-center gap-2 px-4 shadow-sm text-white border-0 py-2 mt-2" 
            style={{ background: 'linear-gradient(135deg, #ff4c00 0%, #ff8c00 100%)', borderRadius: '12px' }}>
            <i className="bi bi-box-arrow-in-right fs-5"></i>
            <span className="fw-bold fs-6">New Inward Entry</span>
          </Link>
        </div>

        {/* Filter Section - Aligned in one row */}
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 p-3 bg-white">
          <div className="row g-3 align-items-center">
            <div className="col-lg-5 col-md-6">
              <div className="position-relative">
                <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                <input
                  type="text"
                  placeholder="Search by Customer Name..."
                  className="form-control ps-5 border-light bg-light-soft"
                  style={{ height: '54px', borderRadius: '15px', fontSize: '1.1rem' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <select className="form-select border-light bg-light-soft text-dark fw-bold" 
                style={{ height: '54px', borderRadius: '15px', fontSize: '1.1rem' }}
                value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="col-lg-4 col-md-12 d-flex justify-content-end gap-2">
<button onClick={handleExportExcel} className="btn shadow-sm text-white fw-bold d-flex align-items-center gap-2 px-3 border-0 transition-smooth" style={{ backgroundColor: '#da3e00', borderRadius: 'var(--radius-lg)', height: '42px', fontSize: '0.8rem' }}>                <i className="bi bi-file-earmark-spreadsheet"></i> EXCEL
              </button>
<button onClick={handleCopyTable} className="btn shadow-sm btn-success fw-bold d-flex align-items-center gap-2 px-3 border-0 transition-smooth" style={{ height: '42px', fontSize: '0.8rem', borderRadius: 'var(--radius-lg)' }}>                <i className="bi bi-files"></i> COPY
              </button>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
          <div className="table-responsive" style={{ minHeight: '400px', paddingBottom: '80px' }}>
            {loading ? (
              <Loader text="Loading Inward Records..." />
            ) : (
              <table className="table align-middle mb-0 table-hover">
                <thead className="bg-light">
                  <tr className="text-uppercase small fw-bold text-muted">
                    <th className="px-4 py-4 border-0">SNO</th>
                    <th className="py-4 border-0">CUSTOMER</th>
                    <th className="py-4 border-0">PO NO</th>
                    <th className="py-4 border-0">DC NO</th>
                    <th className="py-4 border-0">INWARD DATE</th>
                    <th className="py-4 border-0 text-center px-4" style={{ width: '130px' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInwards.map((item, index) => (
                    <tr key={item.id} className="border-bottom border-light">
                      <td className="px-4 text-muted">{index + 1}</td>
                      <td>
                        <div className="fw-900 text-dark fs-6 mb-0">{item.customerName || item.vendorName}</div>
                        <div className="x-small text-muted">{item.address || '-'}</div>
                      </td>
                      <td className="text-dark fs-7">{item.poReference || '-'}</td>
                      <td>
                        <span className="badge bg-light text-dark border-0 shadow-inner px-3 py-2" style={{ fontSize: '0.9rem', borderRadius: '10px' }}>
                          {item.dcNo || item.challanNo || '-'}
                        </span>
                      </td>
                      <td className="text-muted small fw-bold">{item.date}</td>
                      <td className="text-center px-4">
                        <div className="d-flex justify-content-center align-items-center gap-1">
                          <Link href={`/inward/${item.id}/edit`} className="btn-action-view" title="View Detail"><i className="bi bi-eye-fill"></i></Link>
                          <div className="dropdown">
                            <button className="btn btn-sm btn-outline-secondary border-0 text-muted p-0 ms-1 d-flex align-items-center justify-content-center" data-bs-toggle="dropdown" style={{ width: '32px', height: '32px', borderRadius: '8px' }}>
                              <i className="bi bi-three-dots-vertical fs-5"></i>
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end shadow border-0 rounded-3 py-2">
                              <li><button className="dropdown-item d-flex align-items-center gap-2 py-2 small fw-bold" onClick={() => handlePrintInward(item)}><i className="bi bi-printer text-primary"></i> Quick Print</button></li>
                              <li><button className="dropdown-item d-flex align-items-center gap-2 py-2 small fw-bold" onClick={() => handleExportPDFInward(item)}><i className="bi bi-file-earmark-pdf text-danger"></i> Export PDF</button></li>
                              <li><hr className="dropdown-divider opacity-50" /></li>
                              <li><button className="dropdown-item d-flex align-items-center gap-2 py-2 text-danger small fw-bold" onClick={() => handleDeleteParams(item.id)}><i className="bi bi-trash3"></i> Remove Record</button></li>
                            </ul>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredInwards.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-5 text-muted small">No inward entries found.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <ConfirmationModal 
        isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, id: null })} onConfirm={confirmDelete}
        title="Remove Inward Record" message="Are you sure you want to delete this record? This action is permanent and cannot be undone."
      />

      <style jsx>{`
        .fw-900 { font-weight: 900; }
        .fw-black { font-weight: 900; }
        .bg-light-soft { background-color: #f7f9fc; }
        .table-responsive { min-height: 400px; padding-bottom: 80px; }
      `}</style>
    </ModuleGuard>
  );
}
