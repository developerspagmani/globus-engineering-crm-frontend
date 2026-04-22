'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { fetchItems, createItemThunk, updateItemThunk, deleteItemThunk } from '@/redux/features/masterSlice';
import Breadcrumb from '@/components/Breadcrumb';
import ModuleGuard from '@/components/ModuleGuard';
import Loader from '@/components/Loader';
import ConfirmationModal from '@/components/ConfirmationModal';
import ExportExcel from '@/components/shared/ExportExcel';
import { checkActionPermission } from '@/config/permissions';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ItemDetailsPage() {
  const dispatch = useDispatch();
  const { items, loading } = useSelector((state: RootState) => state.master);
  const { company, user } = useSelector((state: RootState) => state.auth);

  const [view, setView] = useState<'add' | 'list'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ itemCode: '', itemName: '' });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    (dispatch as any)(fetchItems(company?.id));
  }, [dispatch, company?.id]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (company?.id) {
      try {
        setIsSubmitting(true);
        if (editingId) {
          await (dispatch as any)(updateItemThunk({ id: editingId, ...formData })).unwrap();
          setEditingId(null);
        } else {
          await (dispatch as any)(createItemThunk({ ...formData, company_id: company.id })).unwrap();
        }
        setFormData({ itemCode: '', itemName: '' });
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

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({ itemCode: item.itemCode, itemName: item.itemName });
    setIsViewOnly(true);
    setView('add');
  };

  const handleDeleteParams = (id: string) => {
    setDeleteModal({ isOpen: true, id });
  };

  const confirmDelete = () => {
    if (deleteModal.id) {
      (dispatch as any)(deleteItemThunk(deleteModal.id));
    }
  };

  const filteredItems = items.filter(item =>
    item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.itemCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    navigator.clipboard.writeText(text).then(() => alert("Table data copied to clipboard!"));
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
    link.setAttribute("download", `items_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintItem = (item: any) => {
    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return;

    printWindow.document.write('<html><head><title>Item Details</title>');
    printWindow.document.write('<style>body { font-family: sans-serif; padding: 40px; color: #333; } .header { border-bottom: 2px solid #ea580c; padding-bottom: 20px; margin-bottom: 30px; } .label { font-weight: bold; color: #666; font-size: 0.8rem; text-transform: uppercase; margin-bottom: 4px; } .value { font-size: 1.1rem; margin-bottom: 20px; font-weight: 500; }</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write('<div class="header">');
    printWindow.document.write('<h1 style="margin: 0; color: #ea580c;">Globus Engineering CRM</h1>');
    printWindow.document.write('<p style="margin: 5px 0 0; color: #666;">Master Data - Item Entry</p>');
    printWindow.document.write('</div>');
    
    printWindow.document.write(`<div><div class="label">Item Code</div><div class="value">${item.itemCode}</div></div>`);
    printWindow.document.write(`<div><div class="label">Item Name</div><div class="value">${item.itemName}</div></div>`);
    
    printWindow.document.write('<div style="margin-top: 50px; text-align: center; font-size: 0.8rem; color: #999; border-top: 1px solid #eee; padding-top: 20px;">Generated on ' + new Date().toLocaleString() + '</div>');
    
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  const handleExportPDFItem = (item: any) => {
    const doc = new jsPDF();
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("GLOBUS ENGINEERING CRM", 14, 25);
    doc.setFontSize(10);
    doc.text("MASTER DATA: ITEM ENTRY", 14, 32);
    
    doc.setTextColor(33, 33, 33);
    doc.setFontSize(12);
    doc.text("ITEM INFORMATION", 14, 55);
    
    autoTable(doc, {
      startY: 60,
      body: [
        ['Item Code', item.itemCode],
        ['Item Name', item.itemName],
        ['System ID', item.id],
      ],
      theme: 'grid',
      styles: { cellPadding: 8, fontSize: 10 },
      columnStyles: { 0: { fontStyle: 'bold', fillColor: [245, 245, 245], cellWidth: 50 } },
    });
    
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated on ${new Date().toLocaleString()}`, 14, 285);
    doc.save(`item_${item.id}.pdf`);
  };

  return (
    <ModuleGuard moduleId="mod_items">
      <div className="container-fluid py-4 min-vh-100 animate-fade-in px-4">
        {/* Header Section Standardized */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <Breadcrumb 
              items={[
                { label: 'Master Data', href: '/master/items' },
                { label: view === 'add' ? (editingId ? 'Item Profile' : 'New Item') : 'Item Hub', active: true }
              ]} 
            />
            <h2 className="fw-900 tracking-tight text-dark mb-1 mt-2">
              {view === 'add' ? (editingId ? (isViewOnly ? 'Item Profile' : 'Edit Item') : 'Add Item') : 'Item Hub'}
            </h2>
            <p className="text-muted small mb-0">
              {view === 'add' ? 'Manage detailed specifications and pricing for this industrial component.' : 'Manage your complete catalog of parts, tools, and industrial materials.'}
            </p>
          </div>
          
          <div className="d-flex align-items-center gap-2">
            {view === 'list' && (
              <ExportExcel 
                data={items} 
                fileName="Product_Master_List" 
                headers={{ itemName: 'Item Name', itemCode: 'Item Code', id: 'Internal ID' }}
                buttonText="Export List"
              />
            )}
            {view === 'add' && editingId && isViewOnly && mounted && checkActionPermission(user, 'mod_items', 'edit') && (
              <button 
                className="btn btn-primary btn-page-action px-4"
                onClick={() => setIsViewOnly(false)}
              >
                <i className="bi bi-pencil-square"></i>
                <span>Edit Item</span>
              </button>
            )}
            {view === 'list' && mounted && checkActionPermission(user, 'mod_items', 'create') && (
              <button
                onClick={() => { setView('add'); setEditingId(null); setFormData({ itemCode: '', itemName: '' }); }}
                className="btn btn-primary btn-page-action px-4"
              >
                <i className="bi bi-plus-lg"></i>
                <span>Add Item</span>
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
                {/* Item Code Field */}
                <div className="row mb-5 align-items-center">
                  <div className="col-md-3">
                    <label className="text-dark fw-normal" style={{ fontSize: '1.1rem' }}>Item Code</label>
                  </div>
                  <div className="col-md-9">
                    <input
                      type="text"
                      required
                      placeholder="Item Code"
                      className="form-control"
                      style={{ fontSize: '1.1rem' }}
                      value={formData.itemCode}
                      onChange={(e) => setFormData({ ...formData, itemCode: e.target.value })}
                      disabled={isViewOnly}
                    />
                  </div>
                </div>

                {/* Item Name Field */}
                <div className="row mb-5 align-items-center">
                  <div className="col-md-3">
                    <label className="text-dark fw-normal" style={{ fontSize: '1.1rem' }}>Item Name</label>
                  </div>
                  <div className="col-md-9">
                    <input
                      type="text"
                      required
                      placeholder="Item Name"
                      className="form-control"
                      style={{ fontSize: '1.1rem' }}
                      value={formData.itemName}
                      onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                      disabled={isViewOnly}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                {!isViewOnly ? (
                  <div className="d-flex justify-content-center gap-3 mt-5">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn px-4 py-2 text-white fw-bold d-flex align-items-center justify-content-center gap-2"
                      style={{ backgroundColor: 'var(--accent-color)', border: 'none', minWidth: '120px', borderRadius: '4px' }}
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
                      onClick={() => { setFormData({ itemCode: '', itemName: '' }); setEditingId(null); setView('list'); }}
                      className="btn px-4 py-2 text-white fw-bold rounded-1"
                      style={{ backgroundColor: '#475569', border: 'none', minWidth: '100px' }}
                    >
                      {editingId ? 'CANCEL' : 'CLEAR'}
                    </button>
                  </div>
                ) : (
                  <div className="d-flex justify-content-center gap-3 mt-5">
                    <button
                      type="button"
                      onClick={() => setView('list')}
                      className="btn px-4 py-2 text-white fw-bold rounded-1"
                      style={{ backgroundColor: '#475569', border: 'none', minWidth: '100px' }}
                    >
                      BACK
                    </button>
                  </div>
                )}
              </form>
            </div>
          ) : (
            <div className="animate-fade-in">
              <div className="card filter-card mb-4">
                <div className="filter-bar-row">
                  <div className="filter-item-search">
                    <div className="search-group">
                      <span className="input-group-text">
                        <i className="bi bi-search"></i>
                      </span>
                      <input
                        type="text"
                        placeholder="Search items..."
                        className="form-control search-bar"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="card shadow-sm border-0 overflow-hidden">
                <div className="card-body p-0">
                  <div className="table-responsive" style={{ minHeight: '400px' }}>
                    <table className="table table-hover align-middle mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th className="px-4 py-2 text-capitalize small fw-bold" style={{ width: '60px' }}>Sno</th>
                          <th className="px-4 py-2 text-capitalize small fw-bold">Item Code</th>
                          <th className="px-4 py-2 text-capitalize small fw-bold">Item Name</th>
                          <th className="px-4 py-2 text-capitalize small fw-bold text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan={4}>
                              <Loader text="Fetching Items..." />
                            </td>
                          </tr>
                        ) : filteredItems.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="text-center py-5 text-muted">No items found</td>
                          </tr>
                        ) : (
                          filteredItems.map((item, index) => (
                            <tr key={item.id}>
                              <td className="px-4 py-3 text-muted">{index + 1}</td>
                              <td className="px-4 py-3 font-monospace">{item.itemCode}</td>
                              <td className="px-4 py-3">{item.itemName}</td>
                              <td className="px-4 py-3 text-end">
                                <div className="d-flex justify-content-end align-items-center gap-1">
                                  <button onClick={() => handleEdit(item)} className="btn-action-view" title="View Profile">
                                    <i className="bi bi-eye-fill"></i>
                                  </button>
                                  {mounted && checkActionPermission(user, 'mod_items', 'edit') && (
                                    <button 
                                      onClick={() => { setEditingId(item.id); setFormData({ itemCode: item.itemCode, itemName: item.itemName }); setIsViewOnly(false); setView('add'); }} 
                                      className="btn-action-edit" 
                                      title="Edit Item"
                                    >
                                      <i className="bi bi-pencil-fill"></i>
                                    </button>
                                  )}
                                  <div className="dropdown">
                                    <button 
                                      className="btn btn-sm btn-outline-secondary border-0 text-muted p-0 ms-1 d-flex align-items-center justify-content-center" 
                                      type="button" 
                                      id={`actions-${item.id}`} 
                                      data-bs-toggle="dropdown" 
                                      aria-expanded="false"
                                      style={{ width: '32px', height: '32px', borderRadius: '8px' }}
                                    >
                                      <i className="bi bi-three-dots-vertical fs-5"></i>
                                    </button>
                                    <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3 py-2" aria-labelledby={`actions-${item.id}`}>
                                      <li>
                                        <button className="dropdown-item d-flex align-items-center gap-2 py-2" type="button" onClick={() => handlePrintItem(item)}>
                                          <i className="bi bi-printer text-primary"></i>
                                          <span className="small fw-semibold">Quick Print</span>
                                        </button>
                                      </li>
                                      <li>
                                        <button className="dropdown-item d-flex align-items-center gap-2 py-2" type="button" onClick={() => handleExportPDFItem(item)}>
                                          <i className="bi bi-file-earmark-pdf text-danger"></i>
                                          <span className="small fw-semibold">Export PDF</span>
                                        </button>
                                      </li>
                                      {mounted && checkActionPermission(user, 'mod_items', 'delete') && (
                                        <>
                                          <li><hr className="dropdown-divider opacity-50" /></li>
                                          <li>
                                            <button 
                                              className="dropdown-item d-flex align-items-center gap-2 py-2 text-danger" 
                                              type="button"
                                              onClick={() => handleDeleteParams(item.id)}
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
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
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
