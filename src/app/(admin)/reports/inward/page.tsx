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

  const totals = filteredItems.reduce((acc, item) => {
    return {
      count: acc.count + 1,
      completed: acc.completed + (item.status === 'completed' ? 1 : 0),
      pending: acc.pending + (item.status === 'pending' ? 1 : 0),
      parties: acc.parties.add(item.customerName || item.vendorName || 'N/A')
    };
  }, { count: 0, completed: 0, pending: 0, parties: new Set<string>() });

  const { settings: invSettings } = useSelector((state: RootState) => state.invoices);
  
  const handlePrintRecord = (item: any) => {
    const p = window.open('', '', 'height=800,width=1000'); if (!p) return;
    const accentColor = invSettings?.accentColor || '#0d6efd';
    
    p.document.write(`
      <html>
        <head>
          <title>Inward Receipt - ${item.dcNo || item.challanNo}</title>
          <style>
            @page { size: A4; margin: 10mm; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; }
            .header { border-bottom: 2px solid ${accentColor}; padding-bottom: 15px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
            .company-name { font-size: 24px; font-weight: 900; color: #000; }
            .receipt-label { background: #333; color: white; padding: 5px 15px; border-radius: 4px; font-weight: bold; text-transform: uppercase; font-size: 14px; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .meta-item { font-size: 13px; }
            .meta-label { color: #666; font-weight: bold; text-transform: uppercase; font-size: 10px; display: block; margin-bottom: 2px; }
            .meta-value { font-weight: 800; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f8f9fa; border: 1px solid #dee2e6; padding: 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: #666; }
            td { border: 1px solid #dee2e6; padding: 15px; text-align: left; font-size: 14px; }
            .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
            .status-completed { background: #d1fae5; color: #065f46; }
            .footer { margin-top: 60px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 15px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">${activeCompany?.name || 'GLOBUS ENGINEERING'}</div>
            <div class="receipt-label">Inward Material Receipt</div>
          </div>
          
          <div class="meta-grid">
            <div class="meta-item">
              <span class="meta-label">Customer / Vendor</span>
              <span class="meta-value">${item.customerName || item.vendorName}</span>
            </div>
            <div class="meta-item" style="text-align: right;">
              <span class="meta-label">Reference DC No</span>
              <span class="meta-value">${item.dcNo || item.challanNo || '-'}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Receipt Date</span>
              <span class="meta-value">${item.date}</span>
            </div>
            <div class="meta-item" style="text-align: right;">
              <span class="meta-label">Material Status</span>
              <span class="status-badge status-completed">${item.status || 'Success'}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Logistics Entry Detail</th>
                <th>Information</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Supplier Address</td>
                <td>${item.address || 'N/A'}</td>
              </tr>
              <tr>
                <td>Receipt Identification</td>
                <td>${item.dcNo || item.challanNo || 'N/A'}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            Material received and verified in good condition.<br/>
            ${activeCompany?.name || 'Globus Engineering Main'}
          </div>
        </body>
      </html>
    `);
    p.document.close();
    setTimeout(() => { p.print(); }, 500);
  };

  const handleExportPDFRecord = (item: any) => {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text("GLOBUS ENGINEERING - INWARD AUDIT", 14, 20);
    autoTable(doc, { 
       startY: 30, 
       head: [['Field', 'Value']],
       body: [
          ['Party Name', item.customerName || item.vendorName], 
          ['DC No', item.dcNo || item.challanNo || '-'], 
          ['Date', item.date], 
          ['Status', (item.status || 'pending').toUpperCase()]
       ],
       theme: 'grid'
    });
    doc.save(`audit_inward_${item.dcNo || 'record'}.pdf`);
  };

  return (
    <div className="container-fluid py-4 animate-fade-in bg-light min-vh-100">
      <div className="d-flex justify-content-between align-items-center mb-4 px-2 flex-wrap gap-2">
        <div>
          <Breadcrumb items={[{ label: 'Intelligence Reports', active: false }, { label: 'Inward Report', active: true }]} />
          <h2 className="fw-900 mb-1 text-dark tracking-tight mt-2">Inward Report</h2>
          <p className="text-muted small mb-0 font-weight-500">History of all incoming material receipts and industrial logistics entries.</p>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-2">
          <ReportActions setFromDate={setFromDate} setToDate={setToDate} title="Inward History Report" />
          <button className="btn btn-white shadow-sm border border-light px-3 d-flex align-items-center gap-2" style={{ height: '36px', borderRadius: '18px' }} onClick={() => (dispatch as any)(fetchInwards(activeCompany?.id))}><i className="bi bi-arrow-repeat text-primary fw-bold"></i> <span className="small fw-800 text-muted">Refresh</span></button>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-4 overflow-hidden rounded-4">
        <div className="card-body p-3">
          <div className="filter-bar-row">
            <div className="filter-item-search">
              <div className="search-group">
                <span className="input-group-text">
                  <i className="bi bi-search"></i>
                </span>
                <input type="text" className="form-control search-bar" placeholder="Search customer or DC..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            
            <div className="date-filter-group">
              <input type="date" className="text-muted" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              <span className="text-muted small fw-bold mx-1">To</span>
              <input type="date" className="text-muted" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* Audit Summary Cards */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total Receipts', val: totals.count, icon: 'box-seam', color: 'primary' },
          { label: 'Completed', val: totals.completed, icon: 'check-circle', color: 'success' },
          { label: 'Pending Entries', val: totals.pending, icon: 'clock-history', color: 'warning' },
          { label: 'Active Parties', val: totals.parties.size, icon: 'people', color: 'info' }
        ].map((item, i) => (
          <div key={i} className="col-md-3">
            <div className="card shadow-sm border-0 rounded-4 bg-white p-3 h-100 animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="d-flex align-items-center gap-3">
                <div className={`rounded-circle bg-${item.color} bg-opacity-10 p-2 d-flex align-items-center justify-content-center`} style={{ width: '42px', height: '42px' }}>
                  <i className={`bi bi-${item.icon} text-${item.color} fs-5`}></i>
                </div>
                <div>
                  <p className="text-muted tiny mb-0 fw-bold text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>{item.label}</p>
                  <h4 className="fw-900 mb-0">{item.val}</h4>
                </div>
              </div>
            </div>
          </div>
        ))}
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
                  <tr className="text-capitalize small fw-bold text-muted">
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
                      <td className="text-dark fw-800 text-capitalize" style={{ fontSize: '0.85rem' }}>{item.customerName || item.vendorName}</td>
                      <td className="text-muted small text-truncate" style={{ maxWidth: '200px' }}>{item.address || '-'}</td>
                      <td><span className={`badge rounded-pill px-3 py-1 small text-capitalize ${item.status === 'completed' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'}`}>{item.status || 'pending'}</span></td>
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
                  <tr className="bg-light-soft fw-900 border-top border-dark">
                    <td colSpan={5} className="text-center py-3">Audit Summary (Cumulative Receipts)</td>
                    <td colSpan={2} className="text-center py-3">{totals.count} Inwards Listed</td>
                  </tr>
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
