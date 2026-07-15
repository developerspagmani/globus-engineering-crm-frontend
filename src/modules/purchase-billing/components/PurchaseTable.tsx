'use client';

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/redux/store';
import { deletePurchaseBill, setPurchasePage, setPurchaseSorting } from '@/redux/features/purchaseSlice';
import SortableHeader from '@/components/shared/SortableHeader';
import { PurchaseBill } from '@/types/modules';
import { checkActionPermission } from '@/config/permissions';
import Loader from '@/components/Loader';
import ConfirmationModal from '@/components/ConfirmationModal';
import PaginationComponent from '@/components/shared/Pagination';

interface PurchaseTableProps {
  onEdit: (bill: PurchaseBill) => void;
  onView: (bill: PurchaseBill) => void;
  onPrint: (bill: PurchaseBill) => void;
}

const PurchaseTable: React.FC<PurchaseTableProps> = ({ onEdit, onView, onPrint }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { items: purchaseBills, pagination, loading, sorting } = useSelector((state: RootState) => state.purchaseBills);
  
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });

  const handleSort = (field: string) => {
    const newOrder = sorting.sortBy === field && sorting.sortOrder === 'asc' ? 'desc' : 'asc';
    dispatch(setPurchaseSorting({ sortBy: field, sortOrder: newOrder }));
  };

  const handleDeleteTrigger = (id: string) => {
    setDeleteModal({ isOpen: true, id });
  };

  const confirmDelete = () => {
    if (deleteModal.id) {
      dispatch(deletePurchaseBill(deleteModal.id));
    }
  };

  if (loading && purchaseBills.length === 0) {
    return <Loader text="Fetching purchase bills..." />;
  }

  return (
    <div className="card shadow-sm border-0 bg-white rounded-4 overflow-hidden">
      <div className="table-responsive" style={{ minHeight: '350px' }}>
        <table className="table align-middle mb-0 table-hover bg-white" style={{ fontSize: '0.875rem' }}>
          <thead className="bg-light text-muted text-uppercase fw-bold small">
            <tr className="border-bottom">
              <SortableHeader field="received_date" label="Received Date" currentSortBy={sorting.sortBy} currentSortOrder={sorting.sortOrder} onSort={handleSort} className="fw-semibold px-3 py-3" style={{ minWidth: '110px' }} />
              {/* This is the empty header column next to Received Date as shown in the screenshot */}
              <th className="fw-semibold px-2 py-3 text-center" style={{ width: '60px' }}></th>
              <SortableHeader field="company_name" label="Company Name" currentSortBy={sorting.sortBy} currentSortOrder={sorting.sortOrder} onSort={handleSort} className="fw-semibold px-3 py-3" style={{ minWidth: '160px' }} />
              <SortableHeader field="invoice_no" label="Invoice No" currentSortBy={sorting.sortBy} currentSortOrder={sorting.sortOrder} onSort={handleSort} className="fw-semibold px-3 py-3" style={{ minWidth: '100px' }} />
              <SortableHeader field="amount" label="Amount" currentSortBy={sorting.sortBy} currentSortOrder={sorting.sortOrder} onSort={handleSort} className="fw-semibold px-3 py-3 text-end" style={{ minWidth: '100px' }} />
              <SortableHeader field="grand_total" label="Grand Total" currentSortBy={sorting.sortBy} currentSortOrder={sorting.sortOrder} onSort={handleSort} className="fw-semibold px-3 py-3 text-end text-primary" style={{ minWidth: '110px' }} />
              <th className="text-center fw-semibold px-3 py-3" style={{ width: '80px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {purchaseBills.length === 0 ? (
              <tr>
                <td colSpan={15} className="text-center py-5 text-muted">
                  <i className="bi bi-folder-x fs-2 d-block mb-2"></i>
                  No purchase bill entries found. Click "Add Purchase Bill" to create one.
                </td>
              </tr>
            ) : (
              purchaseBills.map((item, index) => {
                const globalIndex = (pagination.currentPage - 1) * pagination.itemsPerPage + index + 1;
                return (
                  <tr key={item.id} className="border-bottom table-row-hover text-uppercase">
                    {/* Received Date */}
                    <td className="px-3 text-dark small fw-semibold">
                      {item.receivedDate ? new Date(item.receivedDate).toLocaleDateString('en-GB').replace(/\//g, '-') : '-'}
                    </td>
                    
                    {/* Blank / S.No Column */}
                    <td className="px-2 text-center text-muted small font-monospace">
                      #{globalIndex}
                    </td>

                    {/* Company Name */}
                    <td className="px-3 text-dark fw-bold text-wrap" style={{ maxWidth: '200px' }}>
                      {item.companyName || 'N/A'}
                    </td>

                    {/* Invoice No */}
                    <td className="px-3 text-dark small fw-semibold font-monospace">
                      {item.invoiceNo}
                    </td>

                    {/* Amount */}
                    <td className="px-3 text-end font-monospace">
                      ₹{item.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Grand Total */}
                    <td className="px-3 text-end text-primary fw-bold font-monospace">
                      ₹{item.grandTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Action Buttons */}
                    <td className="text-center">
                      <div className="d-flex justify-content-center gap-1 align-items-center">
                        <button
                          className="btn btn-sm btn-action-view"
                          title="View"
                          onClick={() => onView(item)}
                          style={{ color: '#0dcaf0', background: '#e0f8fb', border: 'none', borderRadius: '6px', width: '28px', height: '28px' }}
                        >
                          <i className="bi bi-eye-fill"></i>
                        </button>
                        {checkActionPermission(user, 'mod_purchase_billing', 'edit') && (
                          <button
                            className="btn btn-sm btn-action-edit"
                            title="Edit"
                            onClick={() => onEdit(item)}
                          >
                            <i className="bi bi-pencil-fill"></i>
                          </button>
                        )}
                        <button
                          className="btn btn-sm btn-action-print"
                          title="Print"
                          onClick={() => onPrint(item)}
                          style={{ color: '#0d6efd', background: '#e7f1ff', border: 'none', borderRadius: '6px', width: '28px', height: '28px' }}
                        >
                          <i className="bi bi-printer-fill"></i>
                        </button>
                        {checkActionPermission(user, 'mod_purchase_billing', 'delete') && (
                          <button
                            className="btn btn-sm btn-action-delete"
                            title="Delete"
                            onClick={() => handleDeleteTrigger(item.id)}
                            style={{ color: '#dc3545', background: '#ffeef0', border: 'none', borderRadius: '6px', width: '28px', height: '28px' }}
                          >
                            <i className="bi bi-trash-fill"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="card-footer bg-white border-0 py-3">
          <PaginationComponent
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={(page) => dispatch(setPurchasePage(page))}
          />
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Remove Purchase Record"
        message="Are you sure you want to permanently delete this purchase bill record? This action is irreversible."
        onConfirm={confirmDelete}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
      />
    </div>
  );
};

export default PurchaseTable;
