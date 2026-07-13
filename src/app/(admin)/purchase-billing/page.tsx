'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/redux/store';
import { fetchPurchaseBills, setPurchaseFilters, resetPurchaseState } from '@/redux/features/purchaseSlice';
import ModuleGuard from '@/components/ModuleGuard';
import Breadcrumb from '@/components/Breadcrumb';
import ExportExcel from '@/components/shared/ExportExcel';
import PurchaseTable from '@/modules/purchase-billing/components/PurchaseTable';
import PurchaseForm from '@/modules/purchase-billing/components/PurchaseForm';
import { PurchaseBill } from '@/types/modules';
import { checkActionPermission } from '@/config/permissions';
import PurchaseBillDocument from '@/components/shared/PurchaseBillDocument';

export default function PurchaseBillingPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { user, company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items: purchaseBills, filters, pagination, sorting } = useSelector((state: RootState) => state.purchaseBills);

  const [mounted, setMounted] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedBill, setSelectedBill] = useState<PurchaseBill | null>(null);
  const [printBill, setPrintBill] = useState<PurchaseBill | null>(null);

  // Filter local state
  const [search, setSearch] = useState(filters.search);
  const [fromDate, setFromDate] = useState(filters.fromDate);
  const [toDate, setToDate] = useState(filters.toDate);

  useEffect(() => {
    setMounted(true);
    return () => {
      dispatch(resetPurchaseState());
    };
  }, [dispatch]);

  // Fetch purchase bills whenever company or filters or page changes
  useEffect(() => {
    if (activeCompany?.id && mounted) {
      dispatch(fetchPurchaseBills({
        company_id: activeCompany.id,
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        search: filters.search,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        sortBy: sorting.sortBy,
        sortOrder: sorting.sortOrder
      }));
    }
  }, [dispatch, activeCompany?.id, pagination.currentPage, pagination.itemsPerPage, filters, sorting.sortBy, sorting.sortOrder, mounted]);

  // Update filters in Redux state when user submits local filter inputs
  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(setPurchaseFilters({ search, fromDate, toDate }));
  };

  const handleResetFilters = () => {
    setSearch('');
    setFromDate('');
    setToDate('');
    dispatch(setPurchaseFilters({ search: '', fromDate: '', toDate: '' }));
  };

  const handleEditBill = (bill: PurchaseBill) => {
    setSelectedBill(bill);
    setFormMode('edit');
    setFormOpen(true);
  };

  const handleAddBill = () => {
    setSelectedBill(null);
    setFormMode('create');
    setFormOpen(true);
  };

  const handleViewBill = (bill: PurchaseBill) => {
    setSelectedBill(bill);
    setFormMode('view');
    setFormOpen(true);
  };

  const handlePrintBill = (bill: PurchaseBill) => {
    setPrintBill(bill);
    setTimeout(() => window.print(), 300);
  };

  if (!mounted) return null;

  // Calculate high-level metrics for Summary Cards
  const totalTaxable = purchaseBills.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalCgstSgst = purchaseBills.reduce((acc, curr) => acc + (curr.cgst || 0) + (curr.sgst || 0), 0);
  const totalIgst = purchaseBills.reduce((acc, curr) => acc + (curr.igst || 0), 0);
  const totalGrand = purchaseBills.reduce((acc, curr) => acc + (curr.grandTotal || 0), 0);

  return (
    <ModuleGuard moduleId="mod_purchase_billing">
      <div className="container-fluid py-4 animate-fade-in px-4">
        
        {/* Header Block */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3 d-print-none">
          <div>
            <Breadcrumb items={[{ label: 'Purchase Hub', active: true }]} />
            <h2 className="fw-900 tracking-tight text-dark mb-1 mt-2">Purchase Billing</h2>
            <p className="text-muted small mb-0">Record and monitor vendor incoming bills and industrial purchase logs • {pagination.totalItems} total</p>
          </div>
          <div className="d-flex align-items-center gap-3">
            <ExportExcel 
              data={purchaseBills} 
              fileName="Purchase_Billing_Report" 
              headers={{
                receivedDate: 'Received Date',
                companyName: 'Company Name',
                gstTin: 'GST TIN',
                dcNo: 'D.C No',
                invoiceNo: 'Invoice No',
                sac: 'SAC',
                qty: 'Qty',
                amount: 'Taxable Amount',
                cgst: 'CGST',
                sgst: 'SGST',
                igst: 'IGST',
                roundOff: 'Round off',
                grandTotal: 'Grand Total'
              }}
              buttonText="Export Excel"
            />
            {checkActionPermission(user, 'mod_purchase_billing', 'create') && (
              <button
                onClick={handleAddBill}
                className="btn btn-primary btn-page-action px-4 d-flex align-items-center gap-2"
              >
                <i className="bi bi-file-earmark-plus"></i>
                <span>Add Purchase Bill</span>
              </button>
            )}
          </div>
        </div>

        {/* Analytics Widgets */}
        <div className="row g-4 mb-4 d-print-none">
          {/* Total Purchased Amount */}
          <div className="col-md-3">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body p-4">
                <div className="x-small text-capitalize tracking-widest text-muted fw-bold mb-2">Total Taxable value</div>
                <div className="h3 fw-bold mb-0 text-dark">₹{totalTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              </div>
            </div>
          </div>

          {/* CGST + SGST Total */}
          <div className="col-md-3">
            <div className="card border-0 shadow-sm rounded-4 h-100 border-start border-4 border-danger">
              <div className="card-body p-4">
                <div className="x-small text-capitalize tracking-widest text-danger fw-bold mb-2">Total CGST + SGST</div>
                <div className="h3 fw-bold mb-0 text-danger">₹{totalCgstSgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              </div>
            </div>
          </div>

          {/* IGST Total */}
          <div className="col-md-3">
            <div className="card border-0 shadow-sm rounded-4 h-100 border-start border-4 border-warning">
              <div className="card-body p-4">
                <div className="x-small text-capitalize tracking-widest text-warning fw-bold mb-2">Total IGST</div>
                <div className="h3 fw-bold mb-0 text-warning">₹{totalIgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              </div>
            </div>
          </div>

          {/* Gross Purchase Total */}
          <div className="col-md-3">
            <div className="card border-0 shadow-sm rounded-4 h-100 border-start border-4 border-primary">
              <div className="card-body p-4">
                <div className="x-small text-capitalize tracking-widest text-primary fw-bold mb-2">Gross Purchase Total</div>
                <div className="h3 fw-bold mb-0 text-primary">₹{totalGrand.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white d-print-none">
          <form onSubmit={handleApplyFilters} className="row g-3 align-items-end">
            <div className="col-md-4">
              <label className="form-label text-muted small fw-bold text-uppercase">Search</label>
              <input
                type="text"
                className="form-control rounded-3 border-light-subtle shadow-none py-2"
                placeholder="Search by Company, Invoice, Challan, GSTIN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label text-muted small fw-bold text-uppercase">From Date</label>
              <input
                type="date"
                className="form-control rounded-3 border-light-subtle shadow-none py-2"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label text-muted small fw-bold text-uppercase">To Date</label>
              <input
                type="date"
                className="form-control rounded-3 border-light-subtle shadow-none py-2"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <div className="col-md-2 d-flex gap-2">
              <button type="submit" className="btn btn-primary rounded-3 w-100 py-2 btn-page-action shadow-none">
                Apply
              </button>
              <button type="button" className="btn btn-outline-secondary rounded-3 w-100 py-2 shadow-none" onClick={handleResetFilters}>
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Listing Table */}
        <div className="d-print-none">
          <PurchaseTable onEdit={handleEditBill} onView={handleViewBill} onPrint={handlePrintBill} />
        </div>

        {/* Form Modal (Add / Edit / View) */}
        <PurchaseForm
          isOpen={formOpen}
          initialData={selectedBill}
          mode={formMode}
          onClose={() => {
            setFormOpen(false);
            setSelectedBill(null);
          }}
        />

        {/* Industrial Print Area */}
        {printBill && (
          <div className="d-none d-print-block" id="purchase-bill-print-area" style={{ position: 'absolute', top: 0, left: 0, width: '100%', zIndex: 9999 }}>
            <PurchaseBillDocument bill={printBill} company={activeCompany} />
          </div>
        )}

      </div>
    </ModuleGuard>
  );
}
