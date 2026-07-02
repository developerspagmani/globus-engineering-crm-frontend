'use client';

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/redux/store';
import { deletePurchaseBill, setPurchasePage } from '@/redux/features/purchaseSlice';
import { PurchaseBill } from '@/types/modules';
import { checkActionPermission } from '@/config/permissions';
import Loader from '@/components/Loader';
import ConfirmationModal from '@/components/ConfirmationModal';
import PaginationComponent from '@/components/shared/Pagination';

interface PurchaseTableProps {
  onEdit: (bill: PurchaseBill) => void;
}

const PurchaseTable: React.FC<PurchaseTableProps> = ({ onEdit }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { items: purchaseBills, pagination, loading } = useSelector((state: RootState) => state.purchaseBills);
  
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });

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
              <th className="fw-semibold px-3 py-3" style={{ minWidth: '110px' }}>Received Date</th>
              {/* This is the empty header column next to Received Date as shown in the screenshot */}
              <th className="fw-semibold px-2 py-3 text-center" style={{ width: '60px' }}></th>
              <th className="fw-semibold px-3 py-3" style={{ minWidth: '160px' }}>Company Name</th>
              <th className="fw-semibold px-3 py-3" style={{ minWidth: '130px' }}>GST TIN</th>
              <th className="fw-semibold px-3 py-3" style={{ minWidth: '100px' }}>D.C No</th>
              <th className="fw-semibold px-3 py-3" style={{ minWidth: '100px' }}>Invoice No</th>
              <th className="fw-semibold px-2 py-3 text-center" style={{ minWidth: '70px' }}>SAC</th>
              <th className="fw-semibold px-2 py-3 text-center" style={{ minWidth: '70px' }}>Qty</th>
              <th className="fw-semibold px-3 py-3 text-end" style={{ minWidth: '100px' }}>Amount</th>
              {/* CGST, SGST, IGST, Round Off are styled with red color class */}
              <th className="fw-semibold px-3 py-3 text-end text-danger" style={{ minWidth: '85px' }}>CGST</th>
              <th className="fw-semibold px-3 py-3 text-end text-danger" style={{ minWidth: '85px' }}>SGST</th>
              <th className="fw-semibold px-3 py-3 text-end text-danger" style={{ minWidth: '85px' }}>IGST</th>
              <th className="fw-semibold px-3 py-3 text-end text-danger" style={{ minWidth: '85px' }}>Round off</th>
              <th className="fw-semibold px-3 py-3 text-end text-primary" style={{ minWidth: '110px' }}>Grand Total</th>
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

                    {/* GST TIN */}
                    <td className="px-3 text-muted small font-monospace">
                      {item.gstTin || '-'}
                    </td>

                    {/* D.C No */}
                    <td className="px-3 text-muted small">
                      {item.dcNo || '-'}
                    </td>

                    {/* Invoice No */}
                    <td className="px-3 text-dark small fw-semibold font-monospace">
                      {item.invoiceNo}
                    </td>

                    {/* SAC */}
                    <td className="px-2 text-center text-muted small font-monospace">
                      {item.sac || '-'}
                    </td>

                    {/* Qty */}
                    <td className="px-2 text-center text-dark font-monospace">
                      {item.qty || '0'}
                    </td>

                    {/* Amount */}
                    <td className="px-3 text-end font-monospace">
                      ₹{item.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* CGST - red text */}
                    <td className="px-3 text-end text-danger font-monospace">
                      {item.cgst > 0 ? `₹${item.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                    </td>

                    {/* SGST - red text */}
                    <td className="px-3 text-end text-danger font-monospace">
                      {item.sgst > 0 ? `₹${item.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                    </td>

                    {/* IGST - red text */}
                    <td className="px-3 text-end text-danger font-monospace">
                      {item.igst > 0 ? `₹${item.igst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                    </td>

                    {/* Round off - red text */}
                    <td className="px-3 text-end text-danger font-monospace">
                      {item.roundOff !== 0 ? `₹${item.roundOff.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                    </td>

                    {/* Grand Total */}
                    <td className="px-3 text-end text-primary fw-bold font-monospace">
                      ₹{item.grandTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Action Dropdown */}
                    <td className="text-center">
                      <div className="d-flex justify-content-center gap-1 align-items-center">
                        {checkActionPermission(user, 'mod_purchase_billing', 'edit') && (
                          <button
                            className="btn btn-sm btn-action-edit"
                            title="Edit"
                            onClick={() => onEdit(item)}
                          >
                            <i className="bi bi-pencil-fill"></i>
                          </button>
                        )}
                        {checkActionPermission(user, 'mod_purchase_billing', 'delete') && (
                          <button
                            className="btn btn-sm btn-action-delete ms-1"
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
