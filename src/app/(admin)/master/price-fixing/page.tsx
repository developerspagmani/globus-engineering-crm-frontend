'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { fetchPriceFixings, createPriceFixingThunk, updatePriceFixingThunk, deletePriceFixingThunk, fetchItems, fetchProcesses } from '@/redux/features/masterSlice';
import { fetchCustomers } from '@/redux/features/customerSlice';
import Breadcrumb from '@/components/Breadcrumb';
import ModuleGuard from '@/components/ModuleGuard';
import Loader from '@/components/Loader';
import ConfirmationModal from '@/components/ConfirmationModal';
import { checkActionPermission } from '@/config/permissions';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function PriceFixingPage() {
  const dispatch = useDispatch();
  const { priceFixings, items, processes, loading: masterLoading } = useSelector((state: RootState) => state.master);
  const { items: customers, loading: customersLoading } = useSelector((state: RootState) => state.customers);
  const { company, user } = useSelector((state: RootState) => state.auth);

  const [view, setView] = useState<'add' | 'list' | 'view'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    customerId: '',
    itemId: '',
    processId: '',
    price: ''
  });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });

  useEffect(() => {
    (dispatch as any)(fetchPriceFixings(company?.id));
    (dispatch as any)(fetchItems(company?.id));
    (dispatch as any)(fetchProcesses(company?.id));
    (dispatch as any)(fetchCustomers(company?.id));
  }, [dispatch, company?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (company?.id) {
      const customer = customers.find(c => String(c.id) === formData.customerId);
      const item = items.find(i => String(i.id) === formData.itemId);
      const process = processes.find(p => String(p.id) === formData.processId);

      const payload = {
        ...formData,
        customerName: customer?.name || '',
        itemName: item?.itemName || '',
        processName: process?.processName || '',
        company_id: company.id
      };

      if (editingId) {
        await (dispatch as any)(updatePriceFixingThunk({ id: editingId, ...payload }));
        setEditingId(null);
      } else {
        await (dispatch as any)(createPriceFixingThunk(payload));
      }
      setFormData({ customerId: '', itemId: '', processId: '', price: '' });
      setView('list');
    } else {
      alert("Please select a company from the top navigation first.");
    }
  };

  const handleView = (pf: any) => {
    setEditingId(pf.id);
    setFormData({
      customerId: String(pf.customerId),
      itemId: String(pf.itemId),
      processId: String(pf.processId),
      price: String(pf.price)
    });
    setView('view');
  };

  const handleEdit = (pf: any) => {
    setEditingId(pf.id);
    setFormData({
      customerId: String(pf.customerId),
      itemId: String(pf.itemId),
      processId: String(pf.processId),
      price: String(pf.price)
    });
    setView('add');
  };

  const handleDeleteParams = (id: string) => {
    setDeleteModal({ isOpen: true, id });
  };

  const confirmDelete = () => {
    if (deleteModal.id) {
      (dispatch as any)(deletePriceFixingThunk(deleteModal.id));
    }
  };

  const filteredPriceFixings = priceFixings.filter(pf =>
    pf.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pf.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pf.processName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePrintPricing = (pf: any) => {
    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return;

    printWindow.document.write('<html><head><title>Pricing Rule Details</title>');
    printWindow.document.write('<style>body { font-family: sans-serif; padding: 40px; color: #333; } .header { border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; } .label { font-weight: bold; color: #666; font-size: 0.8rem; text-transform: uppercase; margin-bottom: 4px; } .value { font-size: 1.1rem; margin-bottom: 20px; font-weight: 500; }</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write('<div class="header">');
    printWindow.document.write('<h1 style="margin: 0; color: #2563eb;">Globus Engineering CRM</h1>');
    printWindow.document.write('<p style="margin: 5px 0 0; color: #666;">Master Data - Special Pricing Entry</p>');
    printWindow.document.write('</div>');
    
    printWindow.document.write(`<div><div class="label">Customer</div><div class="value">${pf.customerName}</div></div>`);
    printWindow.document.write(`<div><div class="label">Item</div><div class="value">${pf.itemName}</div></div>`);
    printWindow.document.write(`<div><div class="label">Process</div><div class="value">${pf.processName}</div></div>`);
    printWindow.document.write(`<div><div class="label">Contract Price</div><div class="value">INR ${Number(pf.price).toLocaleString('en-IN')}</div></div>`);
    
    printWindow.document.write('<div style="margin-top: 50px; text-align: center; font-size: 0.8rem; color: #999; border-top: 1px solid #eee; padding-top: 20px;">Generated on ' + new Date().toLocaleString() + '</div>');
    
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  const handleExportPDFPricing = (pf: any) => {
    const doc = new jsPDF();
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("GLOBUS ENGINEERING CRM", 14, 25);
    doc.setFontSize(10);
    doc.text("MASTER DATA: PRICING CONTRACT", 14, 32);
    
    doc.setTextColor(33, 33, 33);
    doc.setFontSize(12);
    doc.text("CONTRACT DETAILS", 14, 55);
    
    autoTable(doc, {
      startY: 60,
      body: [
        ['Customer', pf.customerName],
        ['Item Name', pf.itemName],
        ['Process', pf.processName],
        ['Contract Price', `INR ${Number(pf.price).toLocaleString('en-IN')}`],
      ],
      theme: 'grid',
      styles: { cellPadding: 8, fontSize: 10 },
      columnStyles: { 0: { fontStyle: 'bold', fillColor: [245, 245, 245], cellWidth: 50 } },
    });
    
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated on ${new Date().toLocaleString()}`, 14, 285);
    doc.save(`pricing_${pf.id}.pdf`);
  };

  return (
    <ModuleGuard moduleId="mod_price_fixing">
      <div className="bg-white min-vh-100">
        {/* Header Section */}
        <div className="px-4 py-3 border-bottom d-flex align-items-center">
          {(view === 'add' || view === 'view') && (
            <button 
              type="button" 
              className="btn btn-outline-secondary border-0 p-0 me-3 d-flex align-items-center justify-content-center" 
              onClick={() => setView('list')} 
              title="Back to List"
              style={{ width: '40px', height: '40px' }}
            >
              <i className="bi bi-arrow-left-circle fs-2 text-muted"></i>
            </button>
          )}
          <h4 className="mb-0 text-dark fw-bold" style={{ fontSize: '1.5rem' }}>{view === 'add' ? (editingId ? 'Edit Price Rule' : 'Add New Price Rule') : view === 'view' ? 'Price Profile' : 'Pricing Hub'}</h4>
          <div className="ms-auto d-flex gap-2">
            {view === 'view' && checkActionPermission(user, 'mod_price_fixing', 'edit') && (
              <button
                onClick={() => setView('add')}
                className="btn btn-primary d-flex align-items-center gap-2 px-3 shadow-accent"
              >
                <i className="bi bi-pencil-square"></i>
                <span>Edit Rule</span>
              </button>
            )}
            {view === 'list' && checkActionPermission(user, 'mod_price_fixing', 'create') && (
              <button
                onClick={() => { setView('add'); setEditingId(null); setFormData({ customerId: '', itemId: '', processId: '', price: '' }); }}
                className="btn btn-primary d-flex align-items-center gap-2 px-4 shadow-accent"
              >
                <i className="bi bi-plus-lg fs-5"></i>
                <span className="fw-bold">Add New Price</span>
              </button>
            )}
          </div>
        </div>

        <div className="px-4 pt-3">
          <Breadcrumb 
            items={[
              { label: 'Master Data', href: '/master/price-fixing' },
              { label: view === 'add' ? (editingId ? 'Price Rules' : 'New Rule') : view === 'view' ? 'Price Profiling' : 'Pricing Matrix', active: true }
            ]} 
          />
        </div>

        <div className="p-4 bg-light min-vh-100">
          {(view === 'add' || view === 'view') ? (
            <div className="mx-auto" style={{ maxWidth: '900px', marginTop: '40px' }}>
              <div className="mb-4">
                <h5 className="fw-bold text-primary">{view === 'view' ? 'View Price Fixing' : editingId ? 'Edit Price Fixing' : 'Add New Price Fixing'}</h5>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="row mb-5 align-items-center">
                  <div className="col-md-3">
                    <label className="text-dark fw-normal" style={{ fontSize: '1.1rem' }}>Customer</label>
                  </div>
                  <div className="col-md-9">
                    <select
                      required
                      className="form-select border-0 border-bottom rounded-0 px-0 shadow-none bg-transparent"
                      style={{ borderBottomColor: '#ddd !important', fontSize: '1.1rem' }}
                      value={formData.customerId}
                      onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                      disabled={view === 'view'}
                    >
                      <option value="">{customersLoading ? 'Loading Customers...' : 'Select Customer'}</option>
                      {customers.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="row mb-5 align-items-center">
                  <div className="col-md-3">
                    <label className="text-dark fw-normal" style={{ fontSize: '1.1rem' }}>Item</label>
                  </div>
                  <div className="col-md-9">
                    <select
                      required
                      className="form-select border-0 border-bottom rounded-0 px-0 shadow-none bg-transparent"
                      style={{ borderBottomColor: '#ddd !important', fontSize: '1.1rem' }}
                      value={formData.itemId}
                      onChange={(e) => setFormData({ ...formData, itemId: e.target.value })}
                      disabled={view === 'view'}
                    >
                      <option value="">Select Item</option>
                      {items.map(i => <option key={i.id} value={String(i.id)}>{i.itemName}</option>)}
                    </select>
                  </div>
                </div>

                <div className="row mb-5 align-items-center">
                  <div className="col-md-3">
                    <label className="text-dark fw-normal" style={{ fontSize: '1.1rem' }}>Process</label>
                  </div>
                  <div className="col-md-9">
                    <select
                      required
                      className="form-select border-0 border-bottom rounded-0 px-0 shadow-none bg-transparent"
                      style={{ borderBottomColor: '#ddd !important', fontSize: '1.1rem' }}
                      value={formData.processId}
                      onChange={(e) => setFormData({ ...formData, processId: e.target.value })}
                      disabled={view === 'view'}
                    >
                      <option value="">Select Process</option>
                      {processes.map(p => <option key={p.id} value={String(p.id)}>{p.processName}</option>)}
                    </select>
                  </div>
                </div>

                <div className="row mb-5 align-items-center">
                  <div className="col-md-3">
                    <label className="text-dark fw-normal" style={{ fontSize: '1.1rem' }}>Price</label>
                  </div>
                  <div className="col-md-9">
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="Price"
                      className="form-control border-0 border-bottom rounded-0 px-0 shadow-none"
                      style={{ borderBottomColor: '#ddd !important', fontSize: '1.1rem' }}
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      disabled={view === 'view'}
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-center gap-3 mt-5">
                  {view !== 'view' ? (
                    <>
                      <button
                        type="submit"
                        className="btn px-4 py-2 text-white fw-bold rounded-1"
                        style={{ backgroundColor: '#da3e00', border: 'none', minWidth: '100px' }}
                      >
                        {editingId ? 'UPDATE' : 'ADD'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setFormData({ customerId: '', itemId: '', processId: '', price: '' }); setEditingId(null); }}
                        className="btn px-4 py-2 text-white fw-bold rounded-1"
                        style={{ backgroundColor: '#475569', border: 'none', minWidth: '100px' }}
                      >
                        {editingId ? 'CANCEL' : 'RESET'}
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
                <div className="input-group" style={{ maxWidth: '300px' }}>
                  <span className="input-group-text bg-white border-end-0">
                    <i className="bi bi-search "></i>
                  </span>
                  <input
                    type="text"
                    placeholder="Search pricing..."
                    className="form-control border-start-0 shadow-none search-bar"
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
                          <th className="px-4 py-2 text-uppercase small fw-bold" style={{ width: '60px' }}>Sno</th>
                          <th className="px-4 py-3 text-uppercase small fw-bold">Customer</th>
                          <th className="px-4 py-3 text-uppercase small fw-bold">Item</th>
                          <th className="px-4 py-3 text-uppercase small fw-bold">Process</th>
                          <th className="px-4 py-3 text-uppercase small fw-bold text-end">Price</th>
                          <th className="px-4 py-3 text-uppercase small fw-bold text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {masterLoading || customersLoading ? (
                          <tr>
                            <td colSpan={6}>
                              <Loader text="Fetching Pricing Data..." />
                            </td>
                          </tr>
                        ) : filteredPriceFixings.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-5 text-muted">No pricing records found</td>
                          </tr>
                        ) : (
                          filteredPriceFixings.map((pf, index) => (
                            <tr key={pf.id}>
                              <td className="px-4 py-3 text-muted">{index + 1}</td>
                              <td className="px-4 py-3 fw-bold">{pf.customerName}</td>
                              <td className="px-4 py-3">{pf.itemName}</td>
                              <td className="px-4 py-3 text-muted italic">{pf.processName}</td>
                              <td className="px-4 py-3 text-end fw-bold text-success">₹ {Number(pf.price).toLocaleString('en-IN')}</td>
                              <td className="px-4 py-3 text-end">
                                <div className="d-flex justify-content-end align-items-center gap-1">
                                  <button onClick={() => handleView(pf)} className="btn-action-view" title="View Profile">
                                    <i className="bi bi-eye-fill"></i>
                                  </button>
                                  <div className="dropdown">
                                    <button 
                                      className="btn btn-sm btn-outline-secondary border-0 text-muted p-0 ms-1 d-flex align-items-center justify-content-center" 
                                      type="button" 
                                      id={`actions-${pf.id}`} 
                                      data-bs-toggle="dropdown" 
                                      aria-expanded="false"
                                      style={{ width: '32px', height: '32px', borderRadius: '8px' }}
                                    >
                                      <i className="bi bi-three-dots-vertical fs-5"></i>
                                    </button>
                                    <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3 py-2" aria-labelledby={`actions-${pf.id}`}>
                                      <li>
                                        <button className="dropdown-item d-flex align-items-center gap-2 py-2" type="button" onClick={() => handlePrintPricing(pf)}>
                                          <i className="bi bi-printer text-primary"></i>
                                          <span className="small fw-semibold">Quick Print</span>
                                        </button>
                                      </li>
                                      <li>
                                        <button className="dropdown-item d-flex align-items-center gap-2 py-2" type="button" onClick={() => handleExportPDFPricing(pf)}>
                                          <i className="bi bi-file-earmark-pdf text-danger"></i>
                                          <span className="small fw-semibold">Export PDF</span>
                                        </button>
                                      </li>
                                      {checkActionPermission(user, 'mod_price_fixing', 'delete') && (
                                        <>
                                          <li><hr className="dropdown-divider opacity-50" /></li>
                                          <li>
                                            <button 
                                              className="dropdown-item d-flex align-items-center gap-2 py-2 text-danger" 
                                              type="button"
                                              onClick={() => handleDeleteParams(pf.id)}
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
        title="Delete Price Rule"
        message="Are you sure you want to delete this pricing rule? This action cannot be undone."
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
