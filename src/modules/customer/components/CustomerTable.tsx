'use client';

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { deleteCustomer, setPage, fetchCustomers } from '@/redux/features/customerSlice';
import Link from 'next/link';
import { Customer } from '@/types/modules';
import { checkActionPermission } from '@/config/permissions';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import PaginationComponent from '@/components/shared/Pagination';

import Loader from '@/components/Loader';
import ConfirmationModal from '@/components/ConfirmationModal';

const CustomerTable: React.FC = () => {
  const dispatch = useDispatch();
  const { user, company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items, filters, pagination, loading } = useSelector((state: RootState) => state.customers);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });

  React.useEffect(() => {
    (dispatch as any)(fetchCustomers({
      company_id: activeCompany?.id,
      page: pagination.currentPage,
      limit: pagination.itemsPerPage,
      search: filters.search
    }));
  }, [dispatch, activeCompany?.id, pagination.currentPage, pagination.itemsPerPage, filters.search]);

  const totalPages = pagination.totalPages;
  const paginatedItems = items;

  const handleDeleteParams = (id: string) => {
    setDeleteModal({ isOpen: true, id });
  };

  const confirmDelete = () => {
    if (deleteModal.id) {
      (dispatch as any)(deleteCustomer(deleteModal.id));
    }
  };

  const handlePrintCustomer = (customer: Customer) => {
    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return;
    printWindow.document.write('<html><head><title>Customer Account</title>');
    printWindow.document.write('<style>body { font-family: sans-serif; padding: 40px; color: #333; } .header { border-bottom: 2px solid #ea580c; padding-bottom: 20px; margin-bottom: 30px; } .label { font-weight: bold; color: #666; font-size: 0.8rem; text-transform: uppercase; margin-bottom: 4px; } .value { font-size: 1.1rem; margin-bottom: 20px; font-weight: 500; } .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write('<div class="header"><h1>Globus Engineering</h1><p>Customer Profile</p></div>');
    printWindow.document.write('<div class="grid">');
    printWindow.document.write(`<div><div class="label">Customer / Company</div><div class="value">${customer.company || customer.name}</div></div>`);
    printWindow.document.write(`<div><div class="label">Contact Name</div><div class="value">${customer.name}</div></div>`);
    printWindow.document.write(`<div><div class="label">Industry</div><div class="value">${customer.industry || '-'}</div></div>`);
    printWindow.document.write(`<div><div class="label">Phone</div><div class="value">${customer.phone || customer.phoneNumber1 || '-'}</div></div>`);
    printWindow.document.write(`<div><div class="label">Email</div><div class="value">${customer.email || customer.emailId1 || '-'}</div></div>`);
    printWindow.document.write(`<div><div class="label">GST Identification</div><div class="value">${customer.gst || '-'}</div></div>`);
    printWindow.document.write('</div>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  const handleExportPDFCustomer = (customer: Customer) => {
    const doc = new jsPDF();
    doc.setFillColor(37, 99, 235); doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.text("GLOBUS ENGINEERING", 14, 25);
    doc.setTextColor(33, 33, 33);
    autoTable(doc, {
      startY: 55,
      body: [
        ['Customer', customer.company || customer.name],
        ['Contact Name', customer.name],
        ['Phone', customer.phone || customer.phoneNumber1 || '-'],
        ['Email', customer.email || customer.emailId1 || '-'],
        ['GST Identification', customer.gst || '-'],
      ],
      theme: 'grid', styles: { cellPadding: 8, fontSize: 10 },
      columnStyles: { 0: { fontStyle: 'bold', fillColor: [245, 245, 245], cellWidth: 50 } },
    });
    doc.save(`customer_${customer.id}.pdf`);
  };

  return (
    <div className="card shadow-sm border-0 bg-white rounded-4 overflow-hidden">
      <div className="table-responsive" style={{ minHeight: '400px', paddingBottom: '80px' }}>
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th className="px-4 py-3 border-0 small fw-bold text-muted">Sno</th>
                <th className="py-3 border-0 small fw-bold text-muted">Customer Name</th>
                <th className="py-3 border-0 small fw-bold text-muted">Email</th>
                <th className="py-3 border-0 small fw-bold text-muted">Phone Number</th>
                <th className="py-3 border-0 small fw-bold text-muted">GST Identification</th>
                <th className="py-3 border-0 small fw-bold text-muted">Created On</th>
                <th className="py-3 border-0 small fw-bold text-muted text-center px-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6}><Loader text="Fetching Data..." /></td></tr>
              ) : (
                <>
                  {paginatedItems.map((customer, index) => (
                    <tr key={customer.id}>
                      <td className="px-4 text-muted small">{(pagination.currentPage - 1) * pagination.itemsPerPage + index + 1}</td>
                      <td className="fw-bold text-dark text-nowrap">{customer.name || '-'}</td>
                      <td className="text-muted small">{customer.email || customer.emailId1 || '-'}</td>
                      <td className="text-muted small">{customer.phone || customer.phoneNumber1 || '-'}</td>
                      <td><span className="badge bg-light text-dark border-0 shadow-sm fw-semibold p-2">{customer.gst || '-'}</span></td>
                      <td className="text-muted small">{customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                      <td className="text-center px-4">
                        <div className="d-flex justify-content-center gap-1">
                          <Link href={`/customers/${customer.id}`} className="btn-action-view" title="View Detail"><i className="bi bi-eye-fill"></i></Link>
                          {checkActionPermission(user, 'mod_customer', 'edit') && (
                            <Link href={`/customers/${customer.id}?edit=true`} className="btn-action-edit" title="Edit Customer"><i className="bi bi-pencil-fill"></i></Link>
                          )}
                          <div className="dropdown">
                            <button className="btn btn-sm btn-outline-secondary border-0 text-muted p-0 ms-1 d-flex align-items-center justify-content-center" type="button" id={`actions-${customer.id}`} data-bs-toggle="dropdown" aria-expanded="false" style={{ width: '32px', height: '32px', borderRadius: '8px' }}>
                              <i className="bi bi-three-dots-vertical fs-5"></i>
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3 py-2" aria-labelledby={`actions-${customer.id}`}>
                              <li><button className="dropdown-item d-flex align-items-center gap-2 py-2" type="button" onClick={() => handlePrintCustomer(customer)}><i className="bi bi-printer text-primary"></i> <span className="small fw-semibold">Quick Print</span></button></li>
                              <li><button className="dropdown-item d-flex align-items-center gap-2 py-2" type="button" onClick={() => handleExportPDFCustomer(customer)}><i className="bi bi-file-earmark-pdf text-danger"></i> <span className="small fw-semibold">Download PDF</span></button></li>
                              {checkActionPermission(user, 'mod_customer', 'delete') && (
                                <>
                                  <li><hr className="dropdown-divider opacity-50" /></li>
                                  <li><button className="dropdown-item d-flex align-items-center gap-2 py-2 text-danger font-weight-bold" type="button" onClick={() => handleDeleteParams(customer.id)}><i className="bi bi-trash3"></i> <span className="small fw-bold">Remove Record</span></button></li>
                                </>
                              )}
                            </ul>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </>
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
               onPageChange={(page) => dispatch(setPage(page))} 
             />

          </div>
        )}
      <ConfirmationModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, id: null })} onConfirm={confirmDelete} title="Remove Customer Record" message="Are you sure you want to delete this customer entry? This action is permanent and cannot be undone." />
      <style jsx>{` .table-responsive { min-height: 400px; padding-bottom: 80px; } `}</style>
    </div>
  );
};

export default CustomerTable;
