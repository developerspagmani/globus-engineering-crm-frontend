'use client';

import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Link from 'next/link';
import ExportExcel from '@/components/shared/ExportExcel';
import { RootState } from '@/redux/store';
import { setChallanFilters, setChallanPage, fetchChallans, deleteChallan } from '@/redux/features/challanSlice';
import Breadcrumb from '@/components/Breadcrumb';
import { checkActionPermission } from '@/config/permissions';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Loader from '@/components/Loader';
import ConfirmationModal from '@/components/ConfirmationModal';

const ChallanPage = () => {
  const dispatch = useDispatch();
  const { user, company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items, filters, pagination, loading } = useSelector((state: RootState) => state.challan);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
  const [mounted, setMounted] = React.useState(false);


  React.useEffect(() => {
    setMounted(true);
    (dispatch as any)(fetchChallans(activeCompany?.id));
  }, [dispatch, activeCompany?.id]);

  if (!mounted) return <Loader text="Initializing..." />;

  // Filter logic
  const filteredItems = items.filter(item => {
    // Company context filtering
    if (activeCompany && String(item.company_id) !== String(activeCompany.id)) return false;

    const matchesSearch =
      (item.challanNo?.toLowerCase() ?? '').includes(filters.search.toLowerCase()) ||
      (item.partyName?.toLowerCase() ?? '').includes(filters.search.toLowerCase());
    const matchesType = filters.type === 'all' || item.type === filters.type;
    const matchesStatus = filters.status === 'all' || item.status === filters.status;
    
    // Date range filtering
    if (filters.fromDate && new Date(item.date) < new Date(filters.fromDate)) return false;
    if (filters.toDate && new Date(item.date) > new Date(filters.toDate)) return false;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredItems.length / pagination.itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (pagination.currentPage - 1) * pagination.itemsPerPage,
    pagination.currentPage * pagination.itemsPerPage
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'dispatched': return <span className="badge bg-primary-soft text-primary px-3 py-2 rounded-pill fw-700 x-small">DISPATCHED</span>;
      case 'received': return <span className="badge bg-success-soft text-success px-3 py-2 rounded-pill fw-700 x-small">RECEIVED</span>;
      case 'draft': return <span className="badge bg-secondary-soft text-muted px-3 py-2 rounded-pill fw-700 x-small">DRAFT</span>;
      case 'cancelled': return <span className="badge bg-danger-soft text-danger px-3 py-2 rounded-pill fw-700 x-small">CANCELLED</span>;
      default: return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'delivery': return <i className="bi bi-box-seam text-primary me-2"></i>;
      case 'returnable': return <i className="bi bi-arrow-left-right text-accent me-2"></i>;
      case 'job_work': return <i className="bi bi-tools text-dark me-2"></i>;
      default: return null;
    }
  };

  const handlePrintChallanRecord = (challan: any) => {
    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return;
    printWindow.document.write('<html><head><title>Challan Summary</title>');
    printWindow.document.write('<style>body { font-family: sans-serif; padding: 40px; color: #333; } .header { border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; } .label { font-weight: bold; color: #666; font-size: 0.8rem; text-transform: uppercase; margin-bottom: 4px; } .value { font-size: 1.1rem; margin-bottom: 20px; font-weight: 500; } .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write('<div class="header"><h1 style="margin: 0; color: #2563eb;">Globus Engineering CRM</h1><p style="margin: 5px 0 0; color: #666;">Challan Summary Record</p></div>');
    printWindow.document.write('<div class="grid">');
    printWindow.document.write(`<div><div class="label">Challan No</div><div class="value">${challan.challanNo}</div></div>`);
    printWindow.document.write(`<div><div class="label">Date</div><div class="value">${new Date(challan.date).toLocaleDateString()}</div></div>`);
    printWindow.document.write(`<div><div class="label">Party / Client</div><div class="value">${challan.partyName}</div></div>`);
    printWindow.document.write(`<div><div class="label">Challan Type</div><div class="value">${challan.type.toUpperCase()}</div></div>`);
    printWindow.document.write(`<div><div class="label">Items Count</div><div class="value">${challan.items.length}</div></div>`);
    printWindow.document.write(`<div><div class="label">Current Status</div><div class="value">${challan.status.toUpperCase()}</div></div>`);
    printWindow.document.write('</div>');
    printWindow.document.write('<div style="margin-top: 50px; text-align: center; font-size: 0.8rem; color: #999; border-top: 1px solid #eee; padding-top: 20px;">System Generated Challan Record on ' + new Date().toLocaleString() + '</div>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  const handleExportPDFChallanRecord = (challan: any) => {
    const doc = new jsPDF();
    doc.setFillColor(37, 99, 235); doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.text("GLOBUS ENGINEERING", 14, 25);
    doc.setFontSize(10); doc.text("CHALLAN SUMMARY RECORD", 14, 32);
    doc.setTextColor(33, 33, 33); doc.setFontSize(12); doc.text("MOVEMENT DETAILS", 14, 55);
    autoTable(doc, {
      startY: 60,
      body: [
        ['Challan Number', challan.challanNo], ['Date', new Date(challan.date).toLocaleDateString()],
        ['Party Name', challan.partyName], ['Type', challan.type.toUpperCase()],
        ['Items Count', challan.items.length], ['Status', challan.status.toUpperCase()]
      ],
      theme: 'grid', styles: { cellPadding: 8, fontSize: 10 },
      columnStyles: { 0: { fontStyle: 'bold', fillColor: [245, 245, 245], cellWidth: 50 } },
    });
    doc.save(`challan_${challan.challanNo}.pdf`);
  };

  const handleDeleteParams = (id: string) => {
    setDeleteModal({ isOpen: true, id });
  };

  const confirmDelete = () => {
    if (deleteModal.id) {
      (dispatch as any)(deleteChallan(deleteModal.id));
    }
  };

  return (
    <div className="container-fluid py-4 min-vh-100 animate-fade-in px-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <Breadcrumb
            items={[
              { label: 'Challan System', active: true }
            ]}
          />
          <h2 className="fw-900 tracking-tight text-dark mb-1 mt-2">Challan Management</h2>
          <p className="text-muted small mb-0">Track material movement and delivery challans across industrial sites.</p>
        </div>
          <div className="d-flex align-items-center gap-2">
            <ExportExcel 
              data={filteredItems} 
              fileName="Challan_Records" 
              headers={{ challanNo: 'Challan No', date: 'Date', partyName: 'Party Name', type: 'Type', status: 'Status' }}
              buttonText="Export List"
            />
            <button className="btn btn-outline-dark d-flex align-items-center gap-2 px-3 shadow-sm" onClick={() => window.print()} style={{ height: '42px', borderRadius: '10px' }}>
              <i className="bi bi-printer-fill"></i>
              <span className="fw-800 small text-uppercase">Print List</span>
            </button>
          {checkActionPermission(user, 'mod_challan', 'create') && (
            <Link href="/challan/new" className="btn btn-primary d-flex align-items-center gap-2 px-4 shadow-sm" style={{ height: '42px', borderRadius: '10px' }}>
              <i className="bi bi-plus-lg"></i>
              <span className="fw-800 small text-uppercase">Create Challan</span>
            </Link>
          )}
        </div>
      </div>

        <div className="card shadow-sm border-0 mb-4 overflow-hidden">
        <div className="card-body p-3">
          <div className="d-flex flex-wrap align-items-center gap-2">
            <div className="flex-grow-1" style={{ minWidth: '250px' }}>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0 text-muted ps-3 py-2">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0 search-bar"
                  placeholder="Search by challan or party..."
                  value={filters.search}
                  onChange={(e) => dispatch(setChallanFilters({ search: e.target.value }))}
                  style={{ height: '42px' }}
                />
              </div>
            </div>
            
            <div style={{ width: '180px' }}>
              <select
                className="form-select"
                value={filters.type}
                onChange={(e) => dispatch(setChallanFilters({ type: e.target.value as any }))}
                style={{ height: '42px', borderRadius: '8px' }}
              >
                <option value="all">All Types</option>
                <option value="delivery">Delivery</option>
                <option value="returnable">Returnable</option>
                <option value="job_work">Job Work</option>
              </select>
            </div>

            <div className="col-auto ms-auto d-flex align-items-center gap-2">
               <div className="d-flex align-items-center gap-2 bg-white px-3 py-1 shadow-sm border" style={{ borderRadius: '8px', height: '42px' }}>
                 <input 
                   type="date" 
                   className="form-control py-1 border-0 shadow-none bg-transparent" 
                   value={filters.fromDate}
                   onChange={(e) => dispatch(setChallanFilters({ fromDate: e.target.value }))}
                   style={{ width: '135px', fontSize: '0.85rem' }}
                 />
                 </div>
                 <span className="text-muted small fw-bold mx-1">TO</span>
               <div className="d-flex align-items-center gap-2 bg-white px-3 py-1 shadow-sm border" style={{ borderRadius: '8px', height: '42px' }}>
                
                 <input 
                   type="date" 
                   className="form-control py-1 border-0 shadow-none bg-transparent" 
                   value={filters.toDate}
                   onChange={(e) => dispatch(setChallanFilters({ toDate: e.target.value }))}
                   style={{ width: '135px', fontSize: '0.85rem' }}
                 />
               </div>
               </div>
            </div>
          </div>
        </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr className="bg-light">
                  <th className="px-4 py-3 border-0 small fw-bold text-muted">Sno</th>
                  <th className="py-3 border-0 small fw-bold text-muted">Challan No</th>
                  <th className="py-3 border-0 small fw-bold text-muted">Date</th>
                  <th className="py-3 border-0 small fw-bold text-muted">Party / Client</th>
                  <th className="py-3 border-0 small fw-bold text-muted">Items</th>
                  <th className="py-3 border-0 small fw-bold text-muted text-center">Status</th>
                  <th className="py-3 border-0 small fw-bold text-muted text-center px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7}>
                      <Loader text="Fetching Challan Records..." />
                    </td>
                  </tr>
                ) : (
                  <>
                    {paginatedItems.map((challan, index) => (
                      <tr key={challan.id}>
                        <td className="px-4 text-nowrap text-muted small">{(pagination.currentPage - 1) * pagination.itemsPerPage + index + 1}</td>
                        <td className="text-nowrap fw-bold text-dark">
                          {challan.challanNo}
                          <div className="text-muted x-small fw-normal text-uppercase">{challan.type.replace('_', ' ')}</div>
                        </td>
                        <td className="text-nowrap text-muted small">{new Date(challan.date).toLocaleDateString()}</td>
                        <td className="text-nowrap text-muted small">
                          <div className="fw-bold text-dark">{challan.partyName}</div>
                          <div className="x-small text-uppercase">{challan.partyType}</div>
                        </td>
                        <td className="text-nowrap text-muted small">
                          {challan.items[0]?.description}
                          {challan.items.length > 1 && <span className="ms-1 text-primary x-small fw-bold">+{challan.items.length - 1} more</span>}
                        </td>
                        <td className="text-center">
                          <span className="badge bg-light text-dark border-0 shadow-sm x-small fw-bold">
                            {challan.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="text-center px-4 text-nowrap">
                          <div className="d-flex justify-content-center gap-1">
                            <Link href={`/challan/${challan.id}/edit`} className="btn-action-view" title="View Profile">
                              <i className="bi bi-eye-fill"></i>
                            </Link>
                            
                            <div className="dropdown">
                              <button 
                                className="btn btn-sm btn-outline-secondary border-0 text-muted p-0 ms-1 d-flex align-items-center justify-content-center" 
                                type="button" 
                                id={`actions-${challan.id}`} 
                                data-bs-toggle="dropdown" 
                                aria-expanded="false"
                                style={{ width: '32px', height: '32px', borderRadius: '8px' }}
                              >
                                <i className="bi bi-three-dots-vertical fs-5"></i>
                              </button>
                              <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3 py-2" aria-labelledby={`actions-${challan.id}`}>
                                <li>
                                  <button className="dropdown-item d-flex align-items-center gap-2 py-2" type="button" onClick={() => handlePrintChallanRecord(challan)}>
                                    <i className="bi bi-printer text-primary"></i>
                                    <span className="small fw-semibold">Quick Print</span>
                                  </button>
                                </li>
                                {checkActionPermission(user, 'mod_challan', 'delete') && (
                                  <>
                                    <li><hr className="dropdown-divider opacity-50" /></li>
                                    <li>
                                      <button 
                                        className="dropdown-item d-flex align-items-center gap-2 py-2 text-danger" 
                                        type="button"
                                        onClick={() => handleDeleteParams(challan.id)}
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
                    ))}
                    {paginatedItems.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-5 text-muted">
                          No challans found matching your filters.
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="px-4 py-3 border-top d-flex align-items-center justify-content-between">
              <div className="text-muted small">
                Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} to {Math.min(pagination.currentPage * pagination.itemsPerPage, filteredItems.length)} of {filteredItems.length} entries
              </div>
              <nav aria-label="Table navigation">
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${pagination.currentPage === 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => dispatch(setChallanPage(pagination.currentPage - 1))}>
                      <i className="bi bi-chevron-left"></i>
                    </button>
                  </li>
                  {[...Array(totalPages)].map((_, i) => (
                    <li key={i} className={`page-item ${pagination.currentPage === i + 1 ? 'active' : ''}`}>
                      <button className="page-link" onClick={() => dispatch(setChallanPage(i + 1))}>
                        {i + 1}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item ${pagination.currentPage === totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => dispatch(setChallanPage(pagination.currentPage + 1))}>
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal 
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Delete Challan Record"
        message="Are you sure you want to remove this challan? This action may affect linked stock levels and movement history. This cannot be undone."
      />

      <style jsx>{`
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

export default ChallanPage;
