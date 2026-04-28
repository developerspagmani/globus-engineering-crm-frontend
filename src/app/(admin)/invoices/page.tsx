'use client';

import React from 'react';
import Link from 'next/link';
import InvoiceFilter from '@/modules/invoice/components/InvoiceFilter';
import InvoiceTable from '@/modules/invoice/components/InvoiceTable';
import ModuleGuard from '@/components/ModuleGuard';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { checkActionPermission } from '@/config/permissions';
import { fetchInvoices } from '@/redux/features/invoiceSlice';
import ExportExcel from '@/components/shared/ExportExcel';

import Breadcrumb from '@/components/Breadcrumb';

export default function InvoiceHistoryPage() {
  const [mounted, setMounted] = React.useState(false);
  const dispatch = useDispatch();
  const { user, company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items } = useSelector((state: RootState) => state.invoices);

  React.useEffect(() => {
    setMounted(true);
    (dispatch as any)(fetchInvoices(activeCompany?.id));
  }, [dispatch, activeCompany?.id]);

  if (!mounted) return null;

  // Filter items based on active company context
  const filteredInvoices = activeCompany
    ? items.filter(inv => inv.company_id === activeCompany.id)
    : items;

  // Analytics logic from previous app
  const totalBilled = filteredInvoices.reduce((acc, inv) => acc + inv.grandTotal, 0);
  const totalPaid = filteredInvoices
    .filter(inv => inv.status === 'paid')
    .reduce((acc, inv) => acc + inv.grandTotal, 0);
  const totalUnpaid = totalBilled - totalPaid;

  return (
    <ModuleGuard moduleId="mod_invoice">
      <div className="container-fluid py-4 animate-fade-in px-4">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <Breadcrumb items={[{ label: 'Billing Hub', active: true }]} />
            <h2 className="fw-900 tracking-tight text-dark mb-1 mt-2">Invoices</h2>
            <p className="text-muted small mb-0">Generate and manage industrial billing records • {filteredInvoices.length} total</p>
          </div>
          <div className="d-flex align-items-center gap-3">
            <ExportExcel 
              data={filteredInvoices} 
              fileName="Invoice_History" 
              headers={{ invoiceNumber: 'Invoice No', date: 'Date', customerName: 'Customer', grandTotal: 'Amount', status: 'Status' }}
              buttonText="Export List"
            />
            {checkActionPermission(user, 'mod_invoice', 'create') && (
              <Link
                href="/invoices/new"
                className="btn btn-primary btn-page-action px-4"
              >
                <i className="bi bi-file-earmark-plus"></i>
                <span>Add Invoice</span>
              </Link>
            )}
          </div>
        </div>

        {/* Revenue Analytics Cards */}
        <div className="row g-4 mb-4">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body p-4">
                <div className="x-small text-capitalize tracking-widest text-muted fw-bold mb-2">Total Billed</div>
                <div className="h2 fw-bold mb-0">₹{totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body p-4">
                <div className="x-small text-capitalize tracking-widest text-success fw-bold mb-2">Total Paid</div>
                <div className="h2 fw-bold mb-0  text-success">₹{totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-4 h-100 border-start border-4 border-warning">
              <div className="card-body p-4">
                <div className="x-small text-capitalize tracking-widest text-warning fw-bold mb-2">Outstanding Balance</div>
                <div className="h2 fw-bold mb-0  text-warning">₹{totalUnpaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              </div>
            </div>
          </div>
        </div>

        <InvoiceFilter />
        <InvoiceTable />
      </div>
    </ModuleGuard>
  );
}
