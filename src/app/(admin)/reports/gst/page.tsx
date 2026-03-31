'use client';

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { fetchInvoices } from '@/redux/features/invoiceSlice';
import { fetchCustomers } from '@/redux/features/customerSlice';
import Link from 'next/link';
import Loader from '@/components/Loader';
import ReportActions from '@/components/ReportActions';
import Breadcrumb from '@/components/Breadcrumb';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const GstReportPage = () => {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const dispatch = useDispatch();
  const { company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items: invoices, loading: invLoading } = useSelector((state: RootState) => state.invoices);
  const { items: customers, loading: custLoading } = useSelector((state: RootState) => state.customers);

  useEffect(() => { setMounted(true); (dispatch as any)(fetchInvoices(activeCompany?.id)); (dispatch as any)(fetchCustomers()); }, [dispatch, activeCompany?.id]);

  if (!mounted) return null;

  const filteredItems = (invoices || []).filter(inv => (inv.customerName?.toLowerCase() || '').includes(search.toLowerCase()) || (inv.invoiceNumber?.toLowerCase() || '').includes(search.toLowerCase()));

  const handlePrint = (item: any) => {
    const p = window.open('', '', 'height=600,width=800'); if (!p) return;
    p.document.write('<html><body><h1>Globus Engineering</h1><p>GST Report Record</p>');
    p.document.write(`<p><b>Customer:</b> ${item.customerName}</p><p><b>Invoice:</b> ${item.invoiceNumber}</p><p><b>Grand Total:</b> ₹${item.grandTotal.toLocaleString()}</p>`);
    p.document.close(); p.print();
  };

  const handleExport = (item: any) => {
    const doc = new jsPDF(); doc.text("GLOBUS ENGINEERING - GST REPORT", 14, 20);
    autoTable(doc, { startY: 30, body: [['Customer', item.customerName], ['Invoice No', item.invoiceNumber], ['Date', item.date], ['Grand Total', `INR ${item.grandTotal.toLocaleString()}`]] });
    doc.save(`gst_record_${item.invoiceNumber}.pdf`);
  };

  return (
    <div className="container-fluid py-4 bg-light min-vh-100 animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4 px-2">
        <div><Breadcrumb items={[{ label: 'Reports', active: false }, { label: 'GST Report', active: true }]} /><h2 className="fw-900 mt-2">GST Report</h2><p className="text-muted small">Tax liability analysis and CGST/SGST/IGST breakdown statements.</p></div>
        <button className="btn btn-white shadow-sm border border-light px-3" onClick={() => { (dispatch as any)(fetchInvoices(activeCompany?.id)); (dispatch as any)(fetchCustomers()); }}>REFRESH</button>
      </div>

      <div className="card shadow-sm border-0 mb-4 rounded-4 overflow-hidden"><div className="card-body p-3"><div className="row g-3 align-items-center"><div className="col-md-5"><input type="text" className="form-control border-0 bg-light-soft px-3" placeholder="Search customer or invoice..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ height: '42px', borderRadius: '10px' }} /></div><div className="col-md-2"><input type="month" className="form-control border-0 bg-light-soft" style={{ height: '42px', borderRadius: '10px' }} defaultValue="2024-03" /></div><div className="col-auto ms-auto d-flex justify-content-end"><ReportActions /></div></div></div></div>

      <div className="card shadow-sm border-0 rounded-4 overflow-hidden"><div className="card-body p-0"><div className="table-responsive" style={{ minHeight: '400px', paddingBottom: '80px' }}>
        <table className="table table-hover align-middle mb-0"><thead className="bg-light"><tr className="text-uppercase small fw-bold text-muted">
          <th className="px-4 py-3 border-0">Sno</th>
          <th className="py-3 border-0">Date</th>
          <th className="py-3 border-0">Invoice No</th>
          <th className="py-3 border-0">Customer Name</th>
          <th className="py-3 border-0">GSTIN</th>
          <th className="py-3 border-0 text-end">Amount</th>
          <th className="py-3 border-0 text-center">Taxes</th>
          <th className="py-3 border-0 text-center" style={{ width: '120px' }}>Action</th>
        </tr></thead>
          <tbody>
            {(invLoading || custLoading) ? <tr><td colSpan={8}><Loader text="Loading..." /></td></tr> : filteredItems.map((inv, idx) => {
              const customer = customers.find(c => c.id === inv.customerId);
              return (
                <tr key={inv.id} className="border-bottom border-light">
                  <td className="px-4 small text-muted font-monospace">{idx + 1}</td>
                  <td className="small text-muted">{inv.date}</td>
                  <td className="text-dark fw-bold">{inv.invoiceNumber}</td>
                  <td className="fw-800 text-dark small text-uppercase">{inv.customerName}</td>
                  <td className="small text-muted font-monospace">{customer?.gst || '-'}</td>
                  <td className="text-end fw-900 font-monospace px-2">₹{inv.grandTotal.toLocaleString()}</td>
                  <td className="text-center small text-muted font-monospace">₹{inv.taxTotal?.toLocaleString() || '-'}</td>
                  <td className="text-center"><div className="d-flex justify-content-center gap-1"><Link href={`/invoices/${inv.id}`} className="btn-action-view"><i className="bi bi-eye-fill"></i></Link><div className="dropdown"><button className="btn btn-sm btn-outline-secondary border-0 p-0" data-bs-toggle="dropdown" style={{ width: '32px', height: '32px' }}><i className="bi bi-three-dots-vertical fs-5"></i></button><ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 py-2"><li><button className="dropdown-item d-flex align-items-center gap-2 py-2 small" onClick={() => handlePrint(inv)}><i className="bi bi-printer text-primary"></i> Quick Print</button></li><li><button className="dropdown-item d-flex align-items-center gap-2 py-2 small" onClick={() => handleExport(inv)}><i className="bi bi-file-earmark-pdf text-danger"></i> Export PDF</button></li></ul></div></div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div></div></div>
      <style jsx>{` .fw-900 { font-weight: 900; } .bg-light-soft { background-color: #f7f9fc; } .table-responsive { padding-bottom: 80px; } `}</style>
    </div>
  );
};

export default GstReportPage;
