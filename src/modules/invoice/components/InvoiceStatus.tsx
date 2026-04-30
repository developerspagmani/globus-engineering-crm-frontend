import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { fetchInvoices, setInvoicePage } from '@/redux/features/invoiceSlice';
import { Invoice } from '@/types/modules';
import Loader from '@/components/Loader';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PaginationComponent from '@/components/shared/Pagination';

const InvoiceStatus = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { items: invoices, loading: isLoading, pagination } = useSelector((state: RootState) => state.invoices);
  const { company: activeCompany } = useSelector((state: RootState) => state.auth);
  const [activeTab, setActiveTab] = React.useState<'today' | 'yesterday' | 'week' | 'month' | 'all'>('today');

  React.useEffect(() => {
    if (activeCompany?.id) {
       (dispatch as any)(fetchInvoices(activeCompany.id));
    }
  }, [dispatch, activeCompany?.id]);

  if (isLoading) return <Loader />;

  const filteredInvoices = (invoices || []).filter((inv: Invoice) => {
    if (activeTab === 'all') return true;
    if (!inv.date) return false;
    const invDate = new Date(inv.date);
    const today = new Date();
    
    // Normalize dates to start of day for accurate comparison
    const normalize = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dayInv = normalize(invDate).getTime();
    const dayToday = normalize(today).getTime();

    if (activeTab === 'today') return dayInv === dayToday;
    
    if (activeTab === 'yesterday') {
      const yesterday = normalize(new Date());
      yesterday.setDate(yesterday.getDate() - 1);
      return dayInv === yesterday.getTime();
    }

    if (activeTab === 'week') {
      const oneWeekAgo = normalize(new Date());
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return dayInv >= oneWeekAgo.getTime() && dayInv <= dayToday;
    }

    if (activeTab === 'month') {
      const thirtyDaysAgo = normalize(new Date());
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return dayInv >= thirtyDaysAgo.getTime() && dayInv <= dayToday;
    }

    return false;
  });

  // Calculate pagination
  const totalItems = filteredInvoices.length;
  const totalPages = Math.ceil(totalItems / pagination.itemsPerPage);
  const paginatedInvoices = filteredInvoices.slice(
    (pagination.currentPage - 1) * pagination.itemsPerPage,
    pagination.currentPage * pagination.itemsPerPage
  );

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };
  const tabs = [
    { id: 'today', name: 'Today', icon: 'bi-calendar-event' },
    { id: 'yesterday', name: 'Before 1 Day', icon: 'bi-calendar-minus' },
    { id: 'week', name: 'Last 1 Week', icon: 'bi-calendar-week' },
    { id: 'month', name: 'Last 30 Days', icon: 'bi-calendar-month' },
    { id: 'all', name: 'All Invoices', icon: 'bi-collection' },
  ];

  return (
    <div className="container-fluid py-4">
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="card-header bg-white border-0 py-3">
          <div className="d-flex align-items-center justify-content-between">
            <h5 className="fw-800 mb-0 d-flex align-items-center gap-2">
              <i className="bi bi-file-earmark-spreadsheet text-primary"></i>
              Invoice Status Summary
            </h5>
            <div className="badge bg-primary-subtle text-primary rounded-pill px-3 py-2 fw-700">
              {totalItems} Invoices Found
            </div>
          </div>
        </div>

        <div className="card-body p-0">
          {/* Custom Navigation Tabs */}
          <div className="d-flex border-bottom bg-light bg-opacity-50">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  dispatch(setInvoicePage(1));
                }}
                className={`flex-fill py-3 border-0 transition-all d-flex align-items-center justify-content-center gap-2 fw-800 nav-tab-btn ${
                  activeTab === tab.id 
                  ? 'bg-white text-dark active' 
                  : 'text-muted hover-bg-light'
                }`}
                style={{ 
                    fontSize: '0.85rem'
                }}
              >
                <i className={`bi ${tab.icon} ${activeTab === tab.id ? 'text-accent' : ''}`}></i>
                {tab.name}
              </button>
            ))}
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light bg-opacity-50">
                <tr>
                  <th className="ps-4 py-3 text-uppercase x-small fw-800 text-muted tracking-wider">Date</th>
                  <th className="py-3 text-uppercase x-small fw-800 text-muted tracking-wider">Invoice No</th>
                  <th className="py-3 text-uppercase x-small fw-800 text-muted tracking-wider">Customer</th>
                  <th className="py-3 text-uppercase x-small fw-800 text-muted tracking-wider text-end">Amount</th>
                  <th className="py-3 text-uppercase x-small fw-800 text-muted tracking-wider text-center">Status</th>
                  <th className="pe-4 py-3 text-uppercase x-small fw-800 text-muted tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5">
                      <div className="py-4">
                        <i className="bi bi-inbox fs-1 text-muted opacity-25"></i>
                        <p className="text-muted fw-600 mt-2">No invoices found for this period</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedInvoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="ps-4 fw-600 border-end border-light" style={{ color: '#475569' }}>
                        {formatDate(inv.date)}
                      </td>
                      <td className="fw-800" style={{ color: 'var(--accent-color)' }}>
                        {inv.invoiceNumber}
                      </td>
                      <td>
                        <div className="fw-800 text-dark" style={{ letterSpacing: '-0.01em' }}>{inv.customerName}</div>
                        <div className="xx-small text-muted fw-700 text-uppercase tracking-widest" style={{ fontSize: '0.65rem' }}>{inv.gstin || 'NO GSTIN'}</div>
                      </td>
                      <td className="text-end fw-800 pe-4">
                        <span style={{ color: '#1e293b' }}>₹ {inv.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </td>
                      <td className="text-center">
                        <span className={`badge rounded-pill px-3 py-2 fw-800 text-uppercase tracking-wider ${
                          inv.status === 'paid' ? 'bg-success-subtle text-success' : 
                          inv.status === 'sent' || inv.status === 'billed' ? 'bg-warning-subtle text-warning' :
                          'bg-danger-subtle text-danger'
                        }`} style={{ fontSize: '0.7rem' }}>
                          {inv.status || 'Draft'}
                        </span>
                      </td>
                      <td className="pe-4 text-center">
                        <div className="d-flex justify-content-center gap-2">
                          <Link
                            href={`/invoices/${inv.id}`}
                            className="btn-action shadow-sm"
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              background: 'var(--accent-soft)',
                              color: 'var(--accent-color)',
                              border: '1px solid rgba(249, 115, 22, 0.2)'
                            }}
                            title="View Invoice"
                          >
                            <i className="bi bi-eye-fill"></i>
                          </Link>

                          <div className="dropdown">
                            <button 
                              className="btn btn-sm btn-outline-secondary border-0 text-muted p-0" 
                              data-bs-toggle="dropdown" 
                              style={{ width: '32px', height: '32px' }}
                            >
                              <i className="bi bi-three-dots-vertical fs-5"></i>
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 py-2">
                               {(inv.type === 'BOTH' || inv.type === 'INVOICE') && (
                                 <li>
                                   <button 
                                     className="dropdown-item d-flex align-items-center gap-2 py-2 small" 
                                     onClick={() => router.push(`/invoices/${inv.id}?print=true&type=WP`)}
                                   >
                                     <i className="bi bi-printer text-primary"></i> WP Print
                                   </button>
                                 </li>
                               )}
                               {(inv.type === 'BOTH' || inv.type === 'WOP') && (
                                 <li>
                                   <button 
                                     className="dropdown-item d-flex align-items-center gap-2 py-2 small" 
                                     onClick={() => router.push(`/invoices/${inv.id}?print=true&type=WOP`)}
                                   >
                                     <i className="bi bi-file-earmark-text text-danger"></i> WOP Print
                                   </button>
                                 </li>
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

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="mt-4 d-flex justify-content-between align-items-center bg-white p-3 rounded-4 shadow-sm">
          <span className="text-muted small fw-600">
            Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} to {Math.min(pagination.currentPage * pagination.itemsPerPage, totalItems)} of {totalItems} entries
          </span>
          <PaginationComponent
            currentPage={pagination.currentPage}
            totalPages={totalPages}
            onPageChange={(page) => dispatch(setInvoicePage(page))}
          />
        </div>
      )}

      <style jsx>{`
        .hover-bg-light:hover {
          background-color: var(--bg-body);
        }
        .transition-all {
          transition: var(--transition-smooth);
        }
        .nav-tab-btn {
          position: relative;
          overflow: hidden;
        }
        .nav-tab-btn:after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 0;
          height: 3px;
          background: var(--accent-color);
          transition: all 0.3s ease;
          transform: translateX(-50%);
        }
        .nav-tab-btn.active:after {
          width: 80%;
        }
      `}</style>
    </div>
  );
};

export default InvoiceStatus;
