'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
import SearchableSelect from '@/components/shared/SearchableSelect';
import api from '@/lib/axios';

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
  const [search, setSearch] = useState(filters.search || '');
  const [companyName, setCompanyName] = useState(filters.companyName || 'all');
  const [invoiceNo, setInvoiceNo] = useState(filters.invoiceNo || 'all');
  const [dcNo, setDcNo] = useState(filters.dcNo || 'all');
  const [gstTin, setGstTin] = useState(filters.gstTin || 'all');
  const [fromDate, setFromDate] = useState(filters.fromDate || '');
  const [toDate, setToDate] = useState(filters.toDate || '');

  // Options fetched from backend
  const [filterOptions, setFilterOptions] = useState<{
    companies: string[];
    invoices: string[];
    challans: string[];
    gstins: string[];
  }>({
    companies: [],
    invoices: [],
    challans: [],
    gstins: []
  });

  const fetchFilterOptions = async () => {
    if (!activeCompany?.id) return;
    try {
      const res = await api.get(`/purchase-bills/filter-options?company_id=${activeCompany.id}`);
      if (res.data) {
        setFilterOptions(res.data);
      }
    } catch (err) {
      console.error('Error fetching purchase filter options:', err);
    }
  };

  useEffect(() => {
    setMounted(true);
    return () => {
      dispatch(resetPurchaseState());
    };
  }, [dispatch]);

  // Load distinct filter options whenever company is available
  useEffect(() => {
    if (activeCompany?.id && mounted) {
      fetchFilterOptions();
    }
  }, [activeCompany?.id, mounted]);

  // Sync local filter state with redux filters
  useEffect(() => {
    setSearch(filters.search || '');
    setCompanyName(filters.companyName || 'all');
    setInvoiceNo(filters.invoiceNo || 'all');
    setDcNo(filters.dcNo || 'all');
    setGstTin(filters.gstTin || 'all');
    setFromDate(filters.fromDate || '');
    setToDate(filters.toDate || '');
  }, [filters]);

  // Fetch purchase bills whenever company or filters or page changes
  useEffect(() => {
    if (activeCompany?.id && mounted) {
      dispatch(fetchPurchaseBills({
        company_id: activeCompany.id,
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        search: filters.search,
        companyName: filters.companyName,
        invoiceNo: filters.invoiceNo,
        dcNo: filters.dcNo,
        gstTin: filters.gstTin,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        sortBy: sorting.sortBy,
        sortOrder: sorting.sortOrder
      }));
    }
  }, [
    dispatch,
    activeCompany?.id,
    pagination.currentPage,
    pagination.itemsPerPage,
    filters,
    sorting.sortBy,
    sorting.sortOrder,
    mounted
  ]);

  // Dropdown options derived from backend response and current items
  const companyOptions = useMemo(() => {
    const set = new Set<string>(filterOptions.companies || []);
    purchaseBills.forEach(b => {
      if (b.companyName?.trim()) set.add(b.companyName.trim());
    });
    const sorted = Array.from(set).sort((a, b) => a.localeCompare(b));
    return [
      { value: 'all', label: 'All Companies', displayLabel: 'All Companies' },
      ...sorted.map(c => ({ value: c, label: c, displayLabel: c }))
    ];
  }, [filterOptions.companies, purchaseBills]);

  const invoiceOptions = useMemo(() => {
    const set = new Set<string>(filterOptions.invoices || []);
    purchaseBills.forEach(b => {
      if (b.invoiceNo?.trim()) set.add(b.invoiceNo.trim());
    });
    const sorted = Array.from(set).sort((a, b) => a.localeCompare(b));
    return [
      { value: 'all', label: 'All Invoices', displayLabel: 'All Invoices' },
      ...sorted.map(i => ({ value: i, label: i, displayLabel: i }))
    ];
  }, [filterOptions.invoices, purchaseBills]);

  const challanOptions = useMemo(() => {
    const set = new Set<string>(filterOptions.challans || []);
    purchaseBills.forEach(b => {
      if (b.dcNo?.trim()) set.add(b.dcNo.trim());
    });
    const sorted = Array.from(set).sort((a, b) => a.localeCompare(b));
    return [
      { value: 'all', label: 'All Challans (D.C No)', displayLabel: 'All Challans' },
      ...sorted.map(c => ({ value: c, label: c, displayLabel: c }))
    ];
  }, [filterOptions.challans, purchaseBills]);

  const gstinOptions = useMemo(() => {
    const set = new Set<string>(filterOptions.gstins || []);
    purchaseBills.forEach(b => {
      if (b.gstTin?.trim()) set.add(b.gstTin.trim());
    });
    const sorted = Array.from(set).sort((a, b) => a.localeCompare(b));
    return [
      { value: 'all', label: 'All GSTINs', displayLabel: 'All GSTINs' },
      ...sorted.map(g => ({ value: g, label: g, displayLabel: g }))
    ];
  }, [filterOptions.gstins, purchaseBills]);

  // Real-time dropdown handlers
  const handleCompanySelect = (val: string | number) => {
    const v = String(val);
    setCompanyName(v);
    dispatch(setPurchaseFilters({ companyName: v }));
  };

  const handleInvoiceSelect = (val: string | number) => {
    const v = String(val);
    setInvoiceNo(v);
    dispatch(setPurchaseFilters({ invoiceNo: v }));
  };

  const handleChallanSelect = (val: string | number) => {
    const v = String(val);
    setDcNo(v);
    dispatch(setPurchaseFilters({ dcNo: v }));
  };

  const handleGstinSelect = (val: string | number) => {
    const v = String(val);
    setGstTin(v);
    dispatch(setPurchaseFilters({ gstTin: v }));
  };

  // Update filters in Redux state when user submits local filter inputs
  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(setPurchaseFilters({
      search,
      companyName,
      invoiceNo,
      dcNo,
      gstTin,
      fromDate,
      toDate
    }));
  };

  const handleResetFilters = () => {
    setSearch('');
    setCompanyName('all');
    setInvoiceNo('all');
    setDcNo('all');
    setGstTin('all');
    setFromDate('');
    setToDate('');
    dispatch(resetPurchaseState());
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

  const fetchExportData = async () => {
    if (!activeCompany?.id) return [];

    let url = `/purchase-bills?page=1&limit=1000000&company_id=${activeCompany.id}`;
    if (filters.search) url += `&search=${encodeURIComponent(filters.search)}`;
    if (filters.companyName && filters.companyName !== 'all') url += `&companyName=${encodeURIComponent(filters.companyName)}`;
    if (filters.invoiceNo && filters.invoiceNo !== 'all') url += `&invoiceNo=${encodeURIComponent(filters.invoiceNo)}`;
    if (filters.dcNo && filters.dcNo !== 'all') url += `&dcNo=${encodeURIComponent(filters.dcNo)}`;
    if (filters.gstTin && filters.gstTin !== 'all') url += `&gstTin=${encodeURIComponent(filters.gstTin)}`;
    if (filters.fromDate) url += `&fromDate=${filters.fromDate}`;
    if (filters.toDate) url += `&toDate=${filters.toDate}`;
    if (sorting.sortBy) url += `&sortBy=${sorting.sortBy}`;
    if (sorting.sortOrder) url += `&sortOrder=${sorting.sortOrder}`;

    try {
      const response = await api.get(url);
      return response.data.items || [];
    } catch (err) {
      console.error('Error fetching export data:', err);
      return [];
    }
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
              fetchData={fetchExportData}
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
        <div
          className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white d-print-none filter-card"
          style={{ overflow: 'visible', position: 'relative', zIndex: 100 }}
        >
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-primary-subtle text-primary p-2 rounded-3">
                <i className="bi bi-funnel-fill fs-6"></i>
              </span>
              <div>
                <h6 className="fw-bold mb-0 text-dark">Search & Filter Records</h6>
                <p className="text-muted x-small mb-0">Search specifically by Company, Invoice, Challan, or GSTIN</p>
              </div>
            </div>
            {(filters.companyName !== 'all' || filters.invoiceNo !== 'all' || filters.dcNo !== 'all' || filters.gstTin !== 'all' || filters.search || filters.fromDate || filters.toDate) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn btn-sm btn-outline-danger rounded-pill px-3 py-1 d-flex align-items-center gap-1 shadow-none"
                style={{ fontSize: '0.8rem' }}
              >
                <i className="bi bi-x-circle-fill"></i> Clear All Filters
              </button>
            )}
          </div>

          <form onSubmit={handleApplyFilters}>
            {/* Row 1: Separate Dropdown Inputs with Search Option */}
            <div className="row g-3 mb-3">
              {/* Search by Company */}
              <div className="col-12 col-sm-6 col-lg-3">
                <label className="form-label text-muted x-small fw-bold text-uppercase mb-1">
                  Search by Company
                </label>
                <SearchableSelect
                  options={companyOptions}
                  value={companyName}
                  onChange={handleCompanySelect}
                  placeholder="All Companies"
                  className="w-100"
                />
              </div>

              {/* Search by Invoice */}
              <div className="col-12 col-sm-6 col-lg-3">
                <label className="form-label text-muted x-small fw-bold text-uppercase mb-1">
                  Search by Invoice
                </label>
                <SearchableSelect
                  options={invoiceOptions}
                  value={invoiceNo}
                  onChange={handleInvoiceSelect}
                  placeholder="All Invoices"
                  className="w-100"
                />
              </div>

              {/* Search by Challan */}
              <div className="col-12 col-sm-6 col-lg-3">
                <label className="form-label text-muted x-small fw-bold text-uppercase mb-1">
                  Search by Challan (D.C No)
                </label>
                <SearchableSelect
                  options={challanOptions}
                  value={dcNo}
                  onChange={handleChallanSelect}
                  placeholder="All Challans"
                  className="w-100"
                />
              </div>

              {/* Search by GSTIN */}
              <div className="col-12 col-sm-6 col-lg-3">
                <label className="form-label text-muted x-small fw-bold text-uppercase mb-1">
                  Search by GSTIN
                </label>
                <SearchableSelect
                  options={gstinOptions}
                  value={gstTin}
                  onChange={handleGstinSelect}
                  placeholder="All GSTINs"
                  className="w-100"
                />
              </div>
            </div>

            {/* Row 2: Secondary Dates, Keyword Search & Actions */}
            <div className="row g-3 align-items-end pt-1">
              <div className="col-12 col-md-4">
                <label className="form-label text-muted x-small fw-bold text-uppercase mb-1">Keyword Search</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-light-subtle text-muted">
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control rounded-end-3 border-light-subtle shadow-none py-2"
                    placeholder="Search SAC or keywords..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="col-12 col-sm-6 col-md-3">
                <label className="form-label text-muted x-small fw-bold text-uppercase mb-1">From Date</label>
                <input
                  type="date"
                  className="form-control rounded-3 border-light-subtle shadow-none py-2"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>

              <div className="col-12 col-sm-6 col-md-3">
                <label className="form-label text-muted x-small fw-bold text-uppercase mb-1">To Date</label>
                <input
                  type="date"
                  className="form-control rounded-3 border-light-subtle shadow-none py-2"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>

              <div className="col-12 col-md-2 d-flex gap-2">
                <button type="submit" className="btn btn-primary rounded-3 w-100 py-2 btn-page-action shadow-none">
                  Apply
                </button>
                <button type="button" className="btn btn-outline-secondary rounded-3 w-100 py-2 shadow-none" onClick={handleResetFilters}>
                  Reset
                </button>
              </div>
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
            fetchFilterOptions();
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
