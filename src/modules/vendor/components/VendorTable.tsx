'use client';

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/redux/store';
import { deleteVendor, setVendorPage, fetchVendors } from '@/redux/features/vendorSlice';
import Link from 'next/link';
import { Vendor } from '@/types/modules';
import { checkActionPermission } from '@/config/permissions';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const VendorTable: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items, filters, pagination, loading } = useSelector((state: RootState) => state.vendors);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  React.useEffect(() => {
    dispatch(fetchVendors(activeCompany?.id));
  }, [dispatch, activeCompany?.id]);
 
  const filteredItems = items.filter(item => {
    if (activeCompany && (item.companyId || item.company_id) !== activeCompany.id) return false;
    const matchesSearch = item.name.toLowerCase().includes(filters.search.toLowerCase()) || 
                          (item.company && item.company.toLowerCase().includes(filters.search.toLowerCase()));
    const matchesStatus = filters.status === 'all' || item.status === filters.status;
    const matchesCategory = filters.category === 'all' || item.category === filters.category;
    let matchesDate = true;
    if (filters.fromDate && item.createdAt && new Date(item.createdAt) < new Date(filters.fromDate)) matchesDate = false;
    if (filters.toDate && item.createdAt && new Date(item.createdAt) > new Date(filters.toDate)) matchesDate = false;
    return matchesSearch && matchesStatus && matchesCategory && matchesDate;
  });

  const totalPages = Math.ceil(filteredItems.length / pagination.itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (pagination.currentPage - 1) * pagination.itemsPerPage,
    pagination.currentPage * pagination.itemsPerPage
  );

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this vendor?')) {
      dispatch(deleteVendor(id));
    }
  };

  const handlePrint = (v: any) => {
    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return;
    printWindow.document.write('<html><head><title>Vendor Profile - ' + v.name + '</title>');
    printWindow.document.write('<style>body { font-family: sans-serif; padding: 40px; color: #333; } .header { border-bottom: 2px solid #f97316; padding-bottom: 20px; margin-bottom: 30px; } .label { font-weight: bold; color: #666; font-size: 0.8rem; text-transform: uppercase; margin-bottom: 4px; } .value { font-size: 1.1rem; margin-bottom: 20px; font-weight: 500; } .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write('<div class="header"><h1 style="margin: 0; color: #f97316;">Globus Engineering</h1><p style="margin: 5px 0 0; color: #666;">Vendor Information Profile</p></div>');
    printWindow.document.write('<div class="grid">');
    printWindow.document.write(`<div><div class="label">Vendor Name</div><div class="value">${v.name}</div></div>`);
    printWindow.document.write(`<div><div class="label">GSTIN</div><div class="value">${v.gst || '-'}</div></div>`);
    printWindow.document.write(`<div><div class="label">Contact Person</div><div class="value">${v.contactPerson1 || '-'}</div></div>`);
    printWindow.document.write(`<div><div class="label">Phone</div><div class="value">${v.phone || v.phoneNumber1 || '-'}</div></div>`);
    printWindow.document.write(`<div><div class="label">Email</div><div class="value">${v.email || v.emailId1 || '-'}</div></div>`);
    printWindow.document.write(`<div><div class="label">Category</div><div class="value">${v.category || '-'}</div></div>`);
    printWindow.document.write('</div>');
    printWindow.document.write('<div style="margin-top: 50px; text-align: center; font-size: 0.8rem; color: #999; border-top: 1px solid #eee; padding-top: 20px;">Generated from Globus CRM Hub</div>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  const handleExportPDF = (v: any) => {
    const doc = new jsPDF();
    doc.setFillColor(249, 115, 22); doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.text("GLOBUS ENGINEERING", 14, 25);
    doc.setFontSize(10); doc.text("VENDOR INFORMATION PROFILE", 14, 32);
    doc.setTextColor(33, 33, 33);
    autoTable(doc, {
      startY: 55,
      body: [
        ['Vendor Name', v.name], ['GSTIN', v.gst || '-'],
        ['Contact Person', v.contactPerson1 || '-'], ['Email', v.email || v.emailId1 || '-'],
        ['Phone', v.phone || v.phoneNumber1 || '-'], ['Category', v.category || '-'],
        ['Address', `${v.street1 || ''}, ${v.city || ''}, ${v.state || ''}`.trim()]
      ],
      theme: 'grid', styles: { cellPadding: 8, fontSize: 10 },
      columnStyles: { 0: { fontStyle: 'bold', fillColor: [245, 245, 245], cellWidth: 50 } },
    });
    doc.save(`vendor_${v.name.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="card border-0 shadow-sm overflow-hidden">
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light">
              <tr className="text-uppercase small fw-bold text-muted">
                <th className="px-4 py-3 border-0">Sno</th>
                <th className="py-3 border-0">Vendor Name</th>
                <th className="py-3 border-0">Email</th>
                <th className="py-3 border-0">Phone Number</th>
                <th className="py-3 border-0">GSTN</th>
                <th className="py-3 border-0 text-center px-4" style={{ width: '120px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-5">
                    <div className="d-flex flex-column align-items-center gap-3">
                      <div className="spinner-border text-orange" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <span className="text-muted small fw-bold text-uppercase tracking-wider">Fetching Vendors...</span>
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {paginatedItems.map((vendor, index) => (
                    <tr key={vendor.id} className="border-bottom border-light">
                      <td className="px-4 small text-muted font-monospace">{(pagination.currentPage - 1) * pagination.itemsPerPage + index + 1}</td>
                      <td className="text-dark fw-bold">{vendor.name || '-'}</td>
                      <td className="text-muted small">{vendor.email || vendor.emailId1 || '-'}</td>
                      <td className="text-muted small">{vendor.phone || vendor.phoneNumber1 || '-'}</td>
                      <td className="text-muted small">
                        <span className="badge bg-light text-dark border-0 shadow-sm fw-600" style={{ letterSpacing: '0.02em' }}>{vendor.gst || '-'}</span>
                      </td>
                      
                      <td className="text-center px-4">
                        <div className="d-flex justify-content-center align-items-center gap-1">
                          <Link href={`/vendors/${vendor.id}/edit`} className="btn-action-view" title="View Detail"><i className="bi bi-eye-fill"></i></Link>
                          
                          <div className="dropdown">
                            <button className="btn btn-sm btn-outline-secondary border-0 text-muted p-0 ms-1 d-flex align-items-center justify-content-center" type="button" id={`actions-${vendor.id}`} data-bs-toggle="dropdown" aria-expanded="false" style={{ width: '32px', height: '32px', borderRadius: '8px' }}>
                              <i className="bi bi-three-dots-vertical fs-5"></i>
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3 py-2" aria-labelledby={`actions-${vendor.id}`}>
                              <li><button className="dropdown-item d-flex align-items-center gap-2 py-2" type="button" onClick={() => handlePrint(vendor)}><i className="bi bi-printer text-primary"></i> <span className="small fw-semibold">Quick Print</span></button></li>
                              <li><button className="dropdown-item d-flex align-items-center gap-2 py-2" type="button" onClick={() => handleExportPDF(vendor)}><i className="bi bi-file-earmark-pdf text-danger"></i> <span className="small fw-semibold">Export PDF</span></button></li>
                              {checkActionPermission(user, 'mod_vendor', 'delete') && (
                                <>
                                  <div className="dropdown-divider"></div>
                                  <li><button className="dropdown-item d-flex align-items-center gap-2 py-2 text-danger" type="button" onClick={() => handleDelete(vendor.id)}><i className="bi bi-trash"></i> <span className="small fw-semibold text-uppercase" style={{ fontSize: '10px' }}>Delete Vendor</span></button></li>
                                </>
                              )}
                            </ul>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginatedItems.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-5 text-muted small">No vendors found matching filters.</td></tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-4 py-3 border-top d-flex align-items-center justify-content-between bg-light bg-opacity-50">
            <div className="text-muted small">
              Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} to {Math.min(pagination.currentPage * pagination.itemsPerPage, filteredItems.length)} of {filteredItems.length} entries
            </div>
            <nav aria-label="Table navigation">
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${pagination.currentPage === 1 ? 'disabled' : ''}`}>
                  <button className="page-link border-0 shadow-sm" onClick={() => dispatch(setVendorPage(pagination.currentPage - 1))}><i className="bi bi-chevron-left text-dark"></i></button>
                </li>
                {[...Array(totalPages)].map((_, i) => (
                  <li key={i} className={`page-item ${pagination.currentPage === i + 1 ? 'active' : ''}`}>
                    <button className="page-link border-0 shadow-sm mx-1 rounded" style={{ backgroundColor: pagination.currentPage === i + 1 ? '#f97316' : '#fff' }} onClick={() => dispatch(setVendorPage(i + 1))}>{i + 1}</button>
                  </li>
                ))}
                <li className={`page-item ${pagination.currentPage === totalPages ? 'disabled' : ''}`}>
                  <button className="page-link border-0 shadow-sm" onClick={() => dispatch(setVendorPage(pagination.currentPage + 1))}><i className="bi bi-chevron-right text-dark"></i></button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorTable;
