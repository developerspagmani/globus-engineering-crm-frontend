'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { fetchProcesses, createProcessThunk, updateProcessThunk, deleteProcessThunk } from '@/redux/features/masterSlice';
import Breadcrumb from '@/components/Breadcrumb';
import ModuleGuard from '@/components/ModuleGuard';
import Loader from '@/components/Loader';
import ConfirmationModal from '@/components/ConfirmationModal';
import { checkActionPermission } from '@/config/permissions';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import ExportExcel from '@/components/shared/ExportExcel';

export default function ProcessDetailsPage() {
  const dispatch = useDispatch();
  const { processes, loading } = useSelector((state: RootState) => state.master);
  const { company, user } = useSelector((state: RootState) => state.auth);

  const [view, setView] = useState<'add' | 'list'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ processName: '' });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    (dispatch as any)(fetchProcesses(company?.id));
  }, [dispatch, company?.id]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (company?.id) {
      try {
        setIsSubmitting(true);
        if (editingId) {
          await (dispatch as any)(updateProcessThunk({ id: editingId, ...formData })).unwrap();
          setEditingId(null);
        } else {
          await (dispatch as any)(createProcessThunk({ ...formData, company_id: company.id })).unwrap();
        }
        setFormData({ processName: '' });
        setView('list');
      } catch (err) {
        // Handle error
      } finally {
        setIsSubmitting(false);
      }
    } else {
      alert("Please select a company from the top navigation first.");
    }
  };

  const handleEdit = (p: any) => {
    setEditingId(p.id);
    setFormData({ processName: p.processName });
    setIsViewOnly(true);
    setView('add');
  };

  const handleDeleteParams = (id: string) => {
    setDeleteModal({ isOpen: true, id });
  };

  const confirmDelete = () => {
    if (deleteModal.id) {
      (dispatch as any)(deleteProcessThunk(deleteModal.id));
    }
  };

  const filteredProcesses = processes.filter(p =>
    p.processName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePrintProcess = (p: any) => {
    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return;

    printWindow.document.write('<html><head><title>Process Details</title>');
    printWindow.document.write('<style>body { font-family: sans-serif; padding: 40px; color: #333; } .header { border-bottom: 2px solid #ea580c; padding-bottom: 20px; margin-bottom: 30px; } .label { font-weight: bold; color: #666; font-size: 0.8rem; text-transform: uppercase; margin-bottom: 4px; } .value { font-size: 1.1rem; margin-bottom: 20px; font-weight: 500; }</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write('<div class="header text-center">');
    printWindow.document.write('<h1 style="margin: 0; color: #ea580c;">Globus Engineering CRM</h1>');
    printWindow.document.write('<p style="margin: 5px 0 0; color: #666;">Master Data - Process Entry</p>');
    printWindow.document.write('</div>');
    
    printWindow.document.write(`<div><div class="label">Process Name</div><div class="value">${p.processName}</div></div>`);
    printWindow.document.write(`<div><div class="label">Internal ID</div><div class="value">${p.id}</div></div>`);
    
    printWindow.document.write('<div style="margin-top: 50px; text-align: center; font-size: 0.8rem; color: #999; border-top: 1px solid #eee; padding-top: 20px;">Generated on ' + new Date().toLocaleString() + '</div>');
    
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  const handleExportPDFProcess = (p: any) => {
    const doc = new jsPDF();
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("GLOBUS ENGINEERING CRM", 14, 25);
    doc.setFontSize(10);
    doc.text("MASTER DATA: PROCESS ENTRY", 14, 32);
    
    doc.setTextColor(33, 33, 33);
    doc.setFontSize(12);
    doc.text("PROCESS INFORMATION", 14, 55);
    
    autoTable(doc, {
      startY: 60,
      body: [
        ['Process Name', p.processName],
        ['System ID', p.id],
      ],
      theme: 'grid',
      styles: { cellPadding: 8, fontSize: 10 },
      columnStyles: { 0: { fontStyle: 'bold', fillColor: [245, 245, 245], cellWidth: 50 } },
    });
    
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated on ${new Date().toLocaleString()}`, 14, 285);
    doc.save(`process_${p.id}.pdf`);
  };

  return (
    <ModuleGuard moduleId="mod_processes">
      <div className="container-fluid py-4 min-vh-100 animate-fade-in px-4">
        {/* Header Section Standardized */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <Breadcrumb 
              items={[
                { label: 'Master Data', href: '/master/processes' },
                { label: view === 'add' ? (editingId ? 'Process Detail' : 'Add Process') : 'Workflow Hub', active: true }
              ]} 
            />
            <h2 className="fw-900 tracking-tight text-dark mb-1 mt-2">
              {view === 'add' ? (editingId ? (isViewOnly ? 'Workflow Detail' : 'Edit Process') : 'Add Process') : 'Workflow Hub'}
            </h2>
            <p className="text-muted small mb-0">
              {view === 'add' ? 'Manage detailed technical steps and stages for industrial production.' : 'Manage your complete catalog of manufacturing and operational processes.'}
            </p>
          </div>
          
          <div className="d-flex align-items-center gap-2">
            {view === 'list' && mounted && checkActionPermission(user, 'mod_processes', 'create') && (
              <button
                onClick={() => { setView('add'); setEditingId(null); setFormData({ processName: '' }); }}
                className="btn btn-primary btn-page-action px-4"
              >
                <i className="bi bi-plus-lg"></i>
                <span>Add Process</span>
              </button>
            )}
            {view === 'add' && (
              <button 
                type="button" 
                className="btn btn-outline-secondary btn-page-action px-3" 
                onClick={() => setView('list')} 
              >
                <i className="bi bi-arrow-left"></i>
                <span>Back</span>
              </button>
            )}
          </div>
        </div>

        <div className="p-0">
          {view === 'add' ? (
            <div className="mx-auto" style={{ maxWidth: '900px', marginTop: '40px' }}>
              <form onSubmit={handleSubmit}>
                <div className="row mb-5 align-items-center">
                  <div className="col-md-3">
                    <label className="text-dark fw-normal" style={{ fontSize: '1.1rem' }}>Process</label>
                  </div>
                  <div className="col-md-9">
                    <input
                      type="text"
                      required
                      placeholder="Process"
                      className="form-control"
                      style={{ fontSize: '1.1rem' }}
                      value={formData.processName}
                      onChange={(e) => setFormData({ ...formData, processName: e.target.value })}
                      disabled={isViewOnly}
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-center gap-3 mt-5">
                  {!isViewOnly ? (
                    <>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn px-4 py-2 text-white fw-bold rounded-1 d-flex align-items-center justify-content-center gap-2"
                      style={{ backgroundColor: 'var(--accent-color)', border: 'none', minWidth: '120px' }}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          <span>{editingId ? 'UPDATING...' : 'SAVING...'}</span>
                        </>
                      ) : (
                        editingId ? 'UPDATE' : 'SUBMIT'
                      )}
                    </button>
                      <button
                        type="button"
                        onClick={() => { setFormData({ processName: '' }); setEditingId(null); setView('list'); }}
                        className="btn px-4 py-2 text-white fw-bold rounded-1"
                        style={{ backgroundColor: '#475569', border: 'none', minWidth: '100px' }}
                      >
                        {editingId ? 'CANCEL' : 'CLEAR'}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setView('list')}
                      className="btn px-4 py-2 text-white fw-bold rounded-1"
                      style={{ backgroundColor: '#475569', border: 'none', minWidth: '100px' }}
                    >
                      BACK
                    </button>
                  )}
                </div>
              </form>
            </div>
          ) : (
            <div className="animate-fade-in">
              <div className="d-flex align-items-center mb-4">
              <div className="search-group" style={{ maxWidth: '300px' }}>
                <span className="input-group-text">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  placeholder="Search processes..."
                  className="form-control search-bar"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              </div>

              <div className="card shadow-sm border-0 overflow-hidden">
                <div className="card-body p-0">
                  <div className="table-responsive" style={{ minHeight: '400px' }}>
                    <table className="table table-hover align-middle mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th className="px-4 py-2 text-capitalize small fw-bold" style={{ width: '80px' }}>Sno</th>
                          <th className="px-4 py-2 text-capitalize small fw-bold">Process Name</th>
                          <th className="px-4 py-3 text-capitalize small fw-bold text-end" style={{ width: '180px' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan={3}>
                              <Loader text="Fetching Processes..." />
                            </td>
                          </tr>
                        ) : filteredProcesses.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="text-center py-5 text-muted">No processes found</td>
                          </tr>
                        ) : (
                          filteredProcesses.map((p, index) => (
                            <tr key={p.id}>
                              <td className="px-4 py-3 text-muted">{index + 1}</td>
                              <td className="px-4 py-3">{p.processName}</td>
                              <td className="px-4 py-3 text-end">
                                <div className="d-flex justify-content-end align-items-center gap-1">
                                  <button onClick={() => handleEdit(p)} className="btn-action-view" title="View Profile">
                                    <i className="bi bi-eye-fill"></i>
                                  </button>
                                  {mounted && checkActionPermission(user, 'mod_processes', 'edit') && (
                                    <button 
                                      onClick={() => { setEditingId(p.id); setFormData({ processName: p.processName }); setIsViewOnly(false); setView('add'); }} 
                                      className="btn-action-edit" 
                                      title="Edit Process"
                                    >
                                      <i className="bi bi-pencil-fill"></i>
                                    </button>
                                  )}
                                  <div className="dropdown">
                                    <button 
                                      className="btn btn-sm btn-outline-secondary border-0 text-muted p-0 ms-1 d-flex align-items-center justify-content-center" 
                                      type="button" 
                                      id={`actions-${p.id}`} 
                                      data-bs-toggle="dropdown" 
                                      aria-expanded="false"
                                      style={{ width: '32px', height: '32px', borderRadius: '8px' }}
                                    >
                                      <i className="bi bi-three-dots-vertical fs-5"></i>
                                    </button>
                                    <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3 py-2" aria-labelledby={`actions-${p.id}`}>
                                      <li>
                                        <button className="dropdown-item d-flex align-items-center gap-2 py-2" type="button" onClick={() => handlePrintProcess(p)}>
                                          <i className="bi bi-printer text-primary"></i>
                                          <span className="small fw-semibold">Quick Print</span>
                                        </button>
                                      </li>
                                      <li>
                                        <button className="dropdown-item d-flex align-items-center gap-2 py-2" type="button" onClick={() => handleExportPDFProcess(p)}>
                                          <i className="bi bi-file-earmark-pdf text-danger"></i>
                                          <span className="small fw-semibold">Export PDF</span>
                                        </button>
                                      </li>
                                      {mounted && checkActionPermission(user, 'mod_processes', 'delete') && (
                                        <>
                                          <li><hr className="dropdown-divider opacity-50" /></li>
                                          <li>
                                            <button 
                                              className="dropdown-item d-flex align-items-center gap-2 py-2 text-danger" 
                                              type="button"
                                              onClick={() => handleDeleteParams(p.id)}
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
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal 
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Delete Process"
        message="Are you sure you want to delete this process? This action cannot be undone."
      />

      <style jsx>{`
        .transition-all { transition: all 0.2s ease; }
        .form-control:focus {
           border-bottom-color: #9C27B0 !important;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in { animation: fadeIn 0.4s ease; }
        .table-responsive {
          padding-bottom: 80px; /* Extra space for dropdowns */
        }
      `}</style>
    </ModuleGuard>
  );
}
