'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { fetchInwards } from '@/redux/features/inwardSlice';
import Link from 'next/link';
import Loader from '@/components/Loader';
import ReportActions from '@/components/ReportActions';
import Breadcrumb from '@/components/Breadcrumb';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const InwardReportPage = () => {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const dispatch = useDispatch();
  const { company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items, loading } = useSelector((state: RootState) => state.inward);

  useEffect(() => {
    setMounted(true);
    if (activeCompany?.id) { dispatch(fetchInwards(activeCompany.id) as any); }
  }, [dispatch, activeCompany?.id]);

  if (!mounted) return null;

  const filteredItems = items.filter(item => {
    const term = search.toLowerCase();
    const matchesSearch = (item.customerName || item.vendorName || '').toLowerCase().includes(term) || 
                         (item.dcNo || item.challanNo || '').toLowerCase().includes(term);
    
    // Date range filtering
    let matchesDate = true;
    if (fromDate && item.date && new Date(item.date) < new Date(fromDate)) matchesDate = false;
    if (toDate && item.date && new Date(item.date) > new Date(toDate)) matchesDate = false;

    return matchesSearch && matchesDate;
  });

  const handlePrintRecord = (item: any) => {
    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return;
    printWindow.document.write('<html><head><title>Inward Summary</title><style>body { font-family: sans-serif; padding: 40px; color: #333; } .header { border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; } .label { font-weight: bold; color: #666; font-size: 0.8rem; text-transform: uppercase; margin-bottom: 4px; } .value { font-size: 1.1rem; margin-bottom: 20px; font-weight: 500; } .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }</style></head><body>');
    printWindow.document.write('<div class="header"><h1>Globus Engineering</h1><p>Inward Summary Statement</p></div>');
    printWindow.document.write('<div class="grid">');
    printWindow.document.write(`<div><div class="label">Customer</div><div class="value">${item.customerName || item.vendorName}</div></div>`);
    printWindow.document.write(`<div><div class="label">DC No</div><div class="value">${item.dcNo || item.challanNo || '-'}</div></div>`);
    printWindow.document.write(`<div><div class="label">Date</div><div class="value">${item.date}</div></div>`);
    printWindow.document.write(`<div><div class="label">Status</div><div class="value">${(item.status || 'PENDING').toUpperCase()}</div></div>`);
    printWindow.document.write('</div>');
    printWindow.document.close(); printWindow.print();
  };

  const handleExportPDFRecord = (item: any) => {
    const doc = new jsPDF();
    doc.setFillColor(37, 99, 235); doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255); doc.text("GLOBUS ENGINEERING", 14, 25);
    autoTable(doc, { startY: 55, body: [['Customer', item.customerName || item.vendorName], ['DC No', item.dcNo || item.challanNo || '-'], ['Date', item.date], ['Status', (item.status || 'PENDING').toUpperCase()]], theme: 'grid' });
    doc.save(`inward_${item.dcNo || 'record'}.pdf`);
  };

  return (
    <div className="container-fluid py-4 animate-fade-in bg-light min-vh-100">
      <div className="d-flex justify-content-between align-items-center mb-4 px-2">
        <div>
          <Breadcrumb items={[{ label: 'Intelligence Reports', active: false }, { label: 'Inward Report', active: true }]} />
          <h2 className="fw-900 mb-1 text-dark tracking-tight mt-2">Inward Report</h2>
          <p className="text-muted small mb-0 font-weight-500">History of all incoming material receipts and industrial logistics entries.</p>
        </div>
        <button className="btn btn-white shadow-sm border border-light px-3" onClick={() => (dispatch as any)(fetchInwards(activeCompany?.id))}><i className="bi bi-arrow-repeat text-primary fw-bold"></i> <span className="small fw-800 text-muted">Refresh</span></button>
      </div>

      <div className="card border-0 shadow-sm mb-4 overflow-hidden rounded-4">
        <div className="card-body p-3">
          <div className="row g-3 align-items-center">
            <div className="col-lg-4 col-md-4">
              <div className="position-relative"><i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i><input type="text" className="form-control ps-5 border-0 bg-light-soft px-3" placeholder="Search customer or DC..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ height: '42px', borderRadius: '10px' }} /></div>
            </div>
            <div className="col-auto ms-auto d-flex align-items-center gap-1">
              <div className="d-flex align-items-center gap-2 bg-light-soft px-3" style={{ height: '42px', borderRadius: '10px' }}>
                <input type="date" className="form-control border-0 bg-transparent p-0" style={{ width: '130px', fontSize: '0.9rem' }} value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                </div>
                <span className="text-muted small fw-bold mx-1">TO</span>
                
              <div className="d-flex align-items-center gap-2 bg-light-soft px-3" style={{ height: '42px', borderRadius: '10px' }}>
                <input type="date" className="form-control border-0 bg-transparent p-0" style={{ width: '130px', fontSize: '0.9rem' }} value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </div>
              <ReportActions />
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm overflow-hidden rounded-4">
        <div className="card-body p-0">
          {loading ? (
            <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '400px' }}>
              <Loader text="Compiling Data..." />
            </div>
          ) : (
            <div className="table-responsive" style={{ minHeight: '400px', paddingBottom: '80px' }}>
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light">
                  <tr className="text-uppercase small fw-bold text-muted">
                    <th className="px-4 py-3 border-0">Sno</th>
                    <th className="py-3 border-0">Date</th>
                    <th className="py-3 border-0">Dc No</th>
                    <th className="py-3 border-0">Customer Name</th>
                    <th className="py-3 border-0">Address</th>
                    <th className="py-3 border-0">Status</th>
                    <th className="py-3 border-0 text-center px-4" style={{ width: '120px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item, index) => (
                    <tr key={item.id} className="border-bottom border-light">
                      <td className="px-4 small text-muted font-monospace">{index + 1}</td>
                      <td className="small text-muted">{item.date}</td>
                      <td className="text-dark fw-bold">{item.dcNo || item.challanNo || '-'}</td>
                      <td className="text-dark fw-800 text-uppercase" style={{ fontSize: '0.85rem' }}>{item.customerName || item.vendorName}</td>
                      <td className="text-muted small text-truncate" style={{ maxWidth: '200px' }}>{item.address || '-'}</td>
                      <td><span className={`badge rounded-pill px-3 py-1 small ${item.status === 'completed' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'}`}>{item.status?.toUpperCase() || 'PENDING'}</span></td>
                      <td className="text-center px-4">
                        <div className="d-flex justify-content-center align-items-center gap-1">
                          <Link href={`/inward/${item.id}/edit?readonly=true`} className="btn-action-view" title="View Detail"><i className="bi bi-eye-fill"></i></Link>
                          <div className="dropdown">
                            <button className="btn btn-sm btn-outline-secondary border-0 text-muted p-0 ms-1 d-flex align-items-center justify-content-center" type="button" data-bs-toggle="dropdown" style={{ width: '32px', height: '32px' }}><i className="bi bi-three-dots-vertical fs-5"></i></button>
                            <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3 py-2">
                              <li><button className="dropdown-item d-flex align-items-center gap-2 py-2 small" onClick={() => handlePrintRecord(item)}><i className="bi bi-printer text-primary"></i> Quick Print</button></li>
                              <li><button className="dropdown-item d-flex align-items-center gap-2 py-2 small" onClick={() => handleExportPDFRecord(item)}><i className="bi bi-file-earmark-pdf text-danger"></i> Export PDF</button></li>
                            </ul>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredItems.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-5 text-muted small">No inward records found matching filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <style jsx>{` .fw-900 { font-weight: 900; } .bg-light-soft { background-color: #f7f9fc; } .table-responsive { padding-bottom: 80px; } `}</style>
    </div>
  );
};

export default InwardReportPage;
