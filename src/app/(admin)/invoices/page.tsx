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
      <div className="container-fluid py-4 animate-fade-in">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <h2 className="fw-900 tracking-tight text-dark mb-1">Invoices</h2>
            <p className="text-muted small mb-0">Generate and manage industrial billing records • {filteredInvoices.length} total</p>
          </div>
          <div className="d-flex gap-2">
            {checkActionPermission(user, 'mod_invoice', 'edit') && (
              <Link 
                href="/invoices/customize" 
                className="btn btn-outline-dark d-flex align-items-center gap-2 px-4 shadow-sm bg-white rounded-4 fw-bold border-light"
                style={{ height: '48px' }}
              >
                <i className="bi bi-palette"></i>
                <span>Customize Template</span>
                <i className="bi bi-chevron-right small opacity-50 ms-1"></i>
              </Link>
            )}
            {checkActionPermission(user, 'mod_invoice', 'create') && (
              <Link 
                href="/invoices/new" 
                className="btn btn-primary d-flex align-items-center gap-2 px-4 shadow-sm rounded-4 fw-bold"
                style={{ height: '48px' }}
              >
                <i className="bi bi-file-earmark-plus"></i>
                <span>Create New Invoice</span>
              </Link>
            )}
          </div>
        </div>

        {/* Revenue Analytics Cards */}
        <div className="row g-4 mb-4">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-4 h-100">
               <div className="card-body p-4">
                  <div className="x-small text-uppercase tracking-widest text-muted fw-bold mb-2">Total Billed</div>
                  <div className="h3 fw-900 mb-0 font-monospace">₹{totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
               </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-4 h-100">
               <div className="card-body p-4">
                  <div className="x-small text-uppercase tracking-widest text-success fw-bold mb-2">Total Paid</div>
                  <div className="h3 fw-900 mb-0 font-monospace text-success">₹{totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
               </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-4 h-100 border-start border-4 border-warning">
               <div className="card-body p-4">
                  <div className="x-small text-uppercase tracking-widest text-warning fw-bold mb-2">Outstanding Balance</div>
                  <div className="h3 fw-900 mb-0 font-monospace text-warning">₹{totalUnpaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
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
