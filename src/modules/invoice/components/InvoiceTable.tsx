'use client';

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import IndustrialDocument from '@/components/shared/IndustrialDocument';
import IndustrialInvoice from './IndustrialInvoice';
import { deleteInvoice, setInvoicePage, fetchNextNumbers, fetchInvoices } from '@/redux/features/invoiceSlice';
import { deleteInward, fetchInwards } from '@/redux/features/inwardSlice';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { checkActionPermission } from '@/config/permissions';
import autoTable from 'jspdf-autotable';
import Loader from '@/components/Loader';
import ConfirmationModal from '@/components/ConfirmationModal';
import ExportExcel from '@/components/shared/ExportExcel';
import PaginationComponent from '@/components/shared/Pagination';


const InvoiceTable: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { user, company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items: invoices, filters, pagination, loading: invoiceLoading } = useSelector((state: RootState) => state.invoices);
  const { items: inwards, loading: inwardLoading } = useSelector((state: RootState) => state.inward);
  const initialTab = searchParams.get('tab') as any || 'ADD_INVOICE';
  const [activeTab, setActiveTab] = useState<'ADD_INVOICE' | 'INVOICELIST' | 'WOP_LIST' | 'BOTH_LIST' | 'ALL_LIST'>(initialTab);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null; type: 'invoice' | 'inward' | null }>({ isOpen: false, id: null, type: null });

  const handleTabChange = (tab: any) => { setActiveTab(tab); const params = new URLSearchParams(searchParams.toString()); params.set('tab', tab); router.push(`${pathname}?${params.toString()}`); };

  const [downloadingItem, setDownloadingItem] = useState<{item: any, type: 'invoice' | 'inward'} | null>(null);
  const downloadRef = React.useRef<HTMLDivElement>(null);
  const { settings: invoiceSettings } = useSelector((state: RootState) => state.invoices);

  React.useEffect(() => {
    if (downloadingItem && downloadRef.current) {
      const captureAndDownload = async () => {
        await new Promise(resolve => setTimeout(resolve, 800));
        if (downloadRef.current) {
          const canvas = await html2canvas(downloadRef.current, { scale: 2, useCORS: true, logging: false });
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const imgProps = pdf.getImageProperties(imgData);
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          const fileName = downloadingItem.type === 'invoice' 
            ? `INVOICE_${downloadingItem.item.invoiceNumber || downloadingItem.item.id}.pdf`
            : `INWARD_${downloadingItem.item.inwardNo || downloadingItem.item.id}.pdf`;
          pdf.save(fileName);
          setDownloadingItem(null);
        }
      };
      captureAndDownload();
    }
  }, [downloadingItem]);

  const handlePrintRecord = (item: any) => {
    const isInvoice = !!item.invoiceNumber;
    if (isInvoice) {
      router.push(`/invoices/${item.id}?print=true`);
      return;
    }
    router.push(`/logistics-print?type=inward&id=${item.id}&print=true`);
  };

  const handleExportPDFRecord = (item: any) => {
    const isInvoice = !!item.invoiceNumber;
    setDownloadingItem({ item, type: isInvoice ? 'invoice' : 'inward' });
  };

  const handleDeleteParams = (id: string, type: 'invoice' | 'inward') => { setDeleteModal({ isOpen: true, id, type }); };
  const confirmDelete = () => { if (deleteModal.id && deleteModal.type) { if (deleteModal.type === 'invoice') dispatch(deleteInvoice(deleteModal.id) as any); else dispatch(deleteInward(deleteModal.id) as any); } };

  React.useEffect(() => {
    if (activeCompany?.id) {
      if (activeTab === 'ADD_INVOICE') {
        (dispatch as any)(fetchInwards({ 
          company_id: activeCompany.id,
          status: 'pending',
          partyType: (filters as any).partyType,
          limit: 100 // Fetch more for selection
        }));
      }
      (dispatch as any)(fetchNextNumbers({ companyId: activeCompany.id }));
    }
  }, [dispatch, activeCompany?.id, activeTab]);

  React.useEffect(() => {
    if (activeCompany?.id) {
      const typeMap: any = {
        'INVOICELIST': 'WP',
        'WOP_LIST': 'WOP',
        'BOTH_LIST': 'BOTH',
        'ALL_LIST': 'all'
      };
      
      (dispatch as any)(fetchInvoices({
        company_id: activeCompany.id,
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        search: filters.search,
        status: filters.status,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        partyType: (filters as any).partyType,
        type: typeMap[activeTab] || 'all'
      }));
    }
  }, [dispatch, activeCompany?.id, pagination.currentPage, pagination.itemsPerPage, filters, activeTab]);

  const filteredInwards = inwards.filter(item => {
    const itemCompId = String(item.company_id || (item as any).companyId || '').toLowerCase();
    const activeCompId = String(activeCompany?.id || '').toLowerCase();
    
    if (user?.role !== 'super_admin' && activeCompany && itemCompId !== activeCompId) return false;
    
    // Check both status and remaining items balance
    const isPending = String(item.status || '').toLowerCase() === 'pending';
    const hasRemaining = (item.totalRemaining ?? 1) > 0;
    
    if (!isPending && !hasRemaining) return false;

    const search = String(filters.search || '').toLowerCase();
    const custName = String(item.customerName || item.vendorName || '').toLowerCase();
    const dcNo = String(item.dcNo || item.challanNo || '').toLowerCase();

    return custName.includes(search) || dcNo.includes(search);
  });

  const displayItems: any[] = activeTab === 'ADD_INVOICE' ? filteredInwards : invoices;
  const totalPages = activeTab === 'ADD_INVOICE' 
    ? Math.ceil(filteredInwards.length / pagination.itemsPerPage) 
    : pagination.totalPages;

  const paginatedItems = activeTab === 'ADD_INVOICE'
    ? displayItems.slice((pagination.currentPage - 1) * pagination.itemsPerPage, pagination.currentPage * pagination.itemsPerPage)
    : displayItems;

  const invoiceHeaders = {
    invoiceNumber: "Invoice Number",
    customerName: "Customer Name",
    date: "Date",
    grandTotal: "Grand Total",
    status: "Status",
    poNo: "PO Number",
    dcNo: "DC Number"
  };

  const renderTabs = () => (
    <div className="d-flex text-uppercase py-2 mb-0 px-3 bg-white border-bottom align-items-center">
      <div className="d-flex gap-2">
        {['ADD_INVOICE', 'INVOICELIST', 'WOP_LIST', 'BOTH_LIST', 'ALL_LIST'].map(tab => (
          <button
            key={tab}
            className={`btn shadow-none border-0 rounded-3 py-2 px-3 fw-bold small transition-all ${activeTab === tab ? 'bg-danger-subtle text-danger border border-danger-subtle' : 'text-muted'}`}
            onClick={() => handleTabChange(tab)}
          >
            {tab === 'ADD_INVOICE' ? 'Invoice Selection' : 
             tab === 'INVOICELIST' ? 'WP List' : 
             tab === 'WOP_LIST' ? 'WOP List' : 
             tab === 'BOTH_LIST' ? 'Both List' : 'All Invoices'}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="card shadow-sm border-0 bg-white rounded-4 overflow-hidden">
      {renderTabs()}
      <div className="table-responsive" style={{ minHeight: '400px', paddingBottom: '80px' }}>
        <table className="table align-middle mb-0 table-hover bg-white mb-0">
          <thead className="bg-light text-muted small">
            <tr className="border-bottom">
              <th className="fw-semibold px-4 py-3">Sno</th>
              <th className="fw-semibold px-4 py-3">{activeTab === 'ADD_INVOICE' ? 'Customer' : 'Customer Name'}</th>
              <th className="fw-semibold px-4 py-3">
                {activeTab === 'ADD_INVOICE' ? 'Dc No' : (activeTab === 'WOP_LIST' ? 'Invoice WOP No' : 'Invoice No')}
              </th>
              <th className="fw-semibold px-4 py-3">{activeTab === 'ADD_INVOICE' ? 'Inward Date' : 'Invoice Date'}</th>
              {activeTab !== 'WOP_LIST' && (
                <th className="fw-semibold px-4 py-3">{activeTab === 'ADD_INVOICE' ? 'PO Ref' : 'Grand Total'}</th>
              )}
              <th className="text-center fw-semibold px-4 py-3 pe-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {(activeTab === 'ADD_INVOICE' ? inwardLoading : invoiceLoading) ? <tr><td colSpan={6}><Loader text="Loading..." /></td></tr> : (
              paginatedItems.map((item, index) => {
                const rowUrl = activeTab === 'ADD_INVOICE' 
                  ? `/invoices/new?inwardId=${item.id}&tab=${activeTab}` 
                  : `/invoices/${item.id}`;
                return (
                <tr key={`${activeTab}-${item.id}`} className="border-bottom text-uppercase table-row-hover" style={{ cursor: 'pointer' }} onClick={() => router.push(rowUrl)}>
                  <td className="px-4 text-muted small">{(pagination.currentPage - 1) * pagination.itemsPerPage + index + 1}</td>
                  <td><div className="fw-bold text-dark small">{activeTab === 'ADD_INVOICE' ? (item.customerName || item.vendorName) : item.customerName}</div></td>
                  <td className="text-muted small">
                    {activeTab === 'ADD_INVOICE' ? (item.dcNo || item.dc_no || '-') : (activeTab === 'WOP_LIST' ? (item.challanNumber || '-') : (
                      <Link href={`/invoices/${item.id}`} className="text-dark fw-bold text-decoration-none hover-underline" onClick={(e) => e.stopPropagation()}>{item.invoiceNumber}</Link>
                    ))}
                  </td>
                  <td className="text-muted small">{item.date ? new Date(item.date).toLocaleDateString('en-GB').replace(/\//g, '-') : '-'}</td>
                  {activeTab !== 'WOP_LIST' && (
                    <td className={activeTab === 'ADD_INVOICE' ? "text-muted small" : "text-dark fw-bold small"}>
                      {activeTab === 'ADD_INVOICE' ? (item.poReference || '-') : `₹${item.grandTotal.toLocaleString()}`}
                    </td>
                  )}
                  <td className="text-center pe-4">
                    <div className="d-flex justify-content-center gap-1 align-items-center">
                      {activeTab === 'ADD_INVOICE' && (
                        <Link
                          href={`/inward/${item.id}`}
                          className="btn-action-view mx-1"
                          title="View Inward"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <i className="bi bi-eye-fill"></i>
                        </Link>
                      )}
                      <Link
                        href={activeTab === 'ADD_INVOICE' ? `/invoices/new?inwardId=${item.id}&tab=${activeTab}` : `/invoices/${item.id}`}
                        className="btn-action-view"
                        title={activeTab === 'ADD_INVOICE' ? "Create Invoice" : "View Invoice"}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <i className={activeTab === 'ADD_INVOICE' ? "bi bi-plus-lg" : "bi bi-eye-fill"}></i>
                      </Link>

                      {activeTab !== 'ADD_INVOICE' && checkActionPermission(user, 'mod_invoice', 'edit') && (
                        <Link
                          href={`/invoices/${item.id}/edit`}
                          className="btn-action-edit mx-1"
                          title="Edit Invoice"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <i className="bi bi-pencil-fill"></i>
                        </Link>
                      )}

                      <div className="dropdown">
                        <button
                          className="btn btn-sm btn-outline-secondary border-0 text-muted p-0"
                          data-bs-toggle="dropdown"
                          onClick={(e) => e.stopPropagation()}
                          style={{ width: '32px', height: '32px' }}
                        >
                          <i className="bi bi-three-dots-vertical fs-5"></i>
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 py-2">
                          <li>
                            <button className="dropdown-item d-flex align-items-center gap-2 py-2 small" onClick={() => handlePrintRecord(item)}>
                              <i className="bi bi-printer text-primary"></i> Quick Print
                            </button>
                          </li>
                          <li>
                            <button className="dropdown-item d-flex align-items-center gap-2 py-2 small" onClick={() => handleExportPDFRecord(item)}>
                              <i className="bi bi-file-earmark-pdf text-danger"></i> Export PDF
                            </button>
                          </li>
                          {item.type === 'BOTH' && (
                            <>
                              <li>
                                <button
                                  className="dropdown-item d-flex align-items-center gap-2 py-2 small fw-bold text-primary"
                                  onClick={() => window.open(`/invoices/${item.id}?print=true&type=WP`, '_blank')}
                                >
                                  <i className="bi bi-printer-fill"></i> WP Print
                                </button>
                              </li>
                              <li>
                                <button
                                  className="dropdown-item d-flex align-items-center gap-2 py-2 small fw-bold text-danger"
                                  onClick={() => window.open(`/invoices/${item.id}?print=true&type=WOP`, '_blank')}
                                >
                                  <i className="bi bi-printer-fill"></i> WOP Print
                                </button>
                              </li>
                            </>
                          )}
                          {checkActionPermission(user, 'mod_invoice', 'delete') && (
                            <>
                              <li><hr className="dropdown-divider opacity-50" /></li>
                              <li><button className="dropdown-item d-flex align-items-center gap-2 py-2 text-danger fw-bold small" onClick={() => handleDeleteParams(item.id, activeTab === 'ADD_INVOICE' ? 'inward' : 'invoice')}><i className="bi bi-trash3"></i> Remove Record</button></li>
                            </>
                          )}
                        </ul>
                      </div>
                    </div>
                  </td>
                  </tr>
                );
              })
            )}
            {paginatedItems.length === 0 && <tr><td colSpan={6} className="text-center py-5 text-muted small">No records found.</td></tr>}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="p-3 border-top bg-light d-flex justify-content-between align-items-center px-4 small text-muted">
          <span>
            Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} to {Math.min(pagination.currentPage * pagination.itemsPerPage, activeTab === 'ADD_INVOICE' ? filteredInwards.length : pagination.totalItems)} of {activeTab === 'ADD_INVOICE' ? filteredInwards.length : pagination.totalItems}
          </span>
          <PaginationComponent
            currentPage={pagination.currentPage}
            totalPages={totalPages}
            onPageChange={(page) => dispatch(setInvoicePage(page))}
          />
        </div>
      )}

      <ConfirmationModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, id: null, type: null })} onConfirm={confirmDelete} title={deleteModal.type === 'invoice' ? "Remove Invoice Record" : "Remove Inward Selection"} message="Are you sure you want to delete this record? This action is permanent and cannot be undone." />
      {/* Hidden Download Generator */}
      {downloadingItem && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <div ref={downloadRef}>
            {downloadingItem.type === 'invoice' ? (
              <IndustrialInvoice 
                invoice={downloadingItem.item} 
                company={activeCompany} 
                settings={invoiceSettings} 
              />
            ) : (
              <IndustrialDocument 
                data={downloadingItem.item} 
                type="inward" 
                company={activeCompany!} 
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceTable;
