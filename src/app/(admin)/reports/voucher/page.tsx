'use client';

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { fetchVouchers } from '@/redux/features/voucherSlice';
import Link from 'next/link';
import Loader from '@/components/Loader';
import ReportActions from '@/components/ReportActions';
import Breadcrumb from '@/components/Breadcrumb';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const VoucherReportPage = () => {
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const dispatch = useDispatch();
  const { company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items, loading } = useSelector((state: RootState) => state.voucher);

  useEffect(() => { setMounted(true); if (activeCompany?.id) { dispatch(fetchVouchers(activeCompany.id) as any); } }, [dispatch, activeCompany?.id]);

  if (!mounted) return null;

  const filteredItems = items.filter(v => {
    const matchesSearch = (v.partyName?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) || (v.voucherNo?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) || (v.chequeNo?.toLowerCase() ?? '').includes(searchTerm.toLowerCase());
    
    let matchesDate = true;
    if (fromDate && v.date && new Date(v.date) < new Date(fromDate)) matchesDate = false;
    if (toDate && v.date && new Date(v.date) > new Date(toDate)) matchesDate = false;

    return matchesSearch && matchesDate;
  });

  const handlePrint = (item: any) => {
    const p = window.open('', '', 'height=600,width=800'); if (!p) return;
    p.document.write('<html><head><title>Voucher</title><style>body { font-family: sans-serif; padding: 40px; color: #333; } .header { border-bottom: 2px solid #2563eb; padding-bottom: 20px; }</style></head><body>');
    p.document.write('<h1>Globus Engineering</h1><p>Voucher Statement</p>');
    p.document.write(`<p><b>Party:</b> ${item.partyName}</p><p><b>Voucher No:</b> ${item.voucherNo}</p><p><b>Amount:</b> ₹${item.amount.toLocaleString()}</p><p><b>Date:</b> ${item.date}</p>`);
    p.document.close(); p.print();
  };

  const handleExport = (item: any) => {
    const doc = new jsPDF(); doc.text("GLOBUS ENGINEERING", 14, 20);
    autoTable(doc, { startY: 30, body: [['Party Name', item.partyName], ['Voucher No', item.voucherNo], ['Date', item.date], ['Amount', `INR ${item.amount.toLocaleString()}`], ['Type', item.type.toUpperCase()]] });
    doc.save(`voucher_${item.voucherNo}.pdf`);
  };

  return (
    <div className="container-fluid py-4 bg-light min-vh-100 animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4 px-2">
        <div><Breadcrumb items={[{ label: 'Reports', active: false }, { label: 'Voucher Report', active: true }]} /><h2 className="fw-900 mt-2">Voucher Report</h2><p className="text-muted small">Record of all financial receipts and payments statements.</p></div>
        <button className="btn btn-white shadow-sm border border-light px-3" onClick={() => dispatch(fetchVouchers(activeCompany?.id) as any)}>REFRESH</button>
      </div>

      <div className="card shadow-sm border-0 mb-4 rounded-4 overflow-hidden">
        <div className="card-body p-3">
          <div className="row g-3 align-items-center">
            <div className="col-md-4">
              <div className="position-relative">
                <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                <input 
                  type="text" 
                  className="form-control border-0 bg-light-soft ps-5" 
                  placeholder="Search party or voucher..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  style={{ height: '42px', borderRadius: '10px' }} 
                />
              </div>
            </div>
            <div className="col-auto ms-auto d-flex align-items-center gap-3">
              <div className="d-flex align-items-center gap-2 bg-light-soft px-3" style={{ height: '42px', borderRadius: '10px' }}>
                <input type="date" className="form-control border-0 bg-transparent p-0" style={{ width: '130px', fontSize: '0.9rem' }} value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                <span className="text-muted small fw-bold mx-1">TO</span>
                <input type="date" className="form-control border-0 bg-transparent p-0" style={{ width: '130px', fontSize: '0.9rem' }} value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </div>
              <ReportActions />
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
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
                    <th className="py-3 border-0 text-center">Voucher No</th>
                    <th className="py-3 border-0">Party Name</th>
                    <th className="py-3 border-0 text-center">Type</th>
                    <th className="py-3 border-0 text-end px-4">Amount</th>
                    <th className="py-3 border-0 text-center" style={{ width: '120px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((v, i) => (
                    <tr key={v.id} className="border-bottom border-light">
                      <td className="px-4 small text-muted font-monospace">{i + 1}</td>
                      <td className="small text-muted">{v.date}</td>
                      <td className="text-center small fw-bold text-dark font-monospace">{v.voucherNo}</td>
                      <td className="fw-800 text-dark small text-uppercase">{v.partyName}</td>
                      <td className="text-center"><span className={`small fw-bold ${v.type === 'receipt' ? 'text-success' : 'text-danger'}`}>{v.type.toUpperCase()}</span></td>
                      <td className={`text-end fw-900 px-4 font-monospace ${v.type === 'receipt' ? 'text-success' : 'text-danger'}`}>₹{v.amount.toLocaleString()}</td>
                      <td className="text-center">
                        <div className="d-flex justify-content-center gap-1">
                          <Link href={`/vouchers/${v.id}/edit?readonly=true`} className="btn-action-view"><i className="bi bi-eye-fill"></i></Link>
                          <div className="dropdown">
                            <button className="btn btn-sm btn-outline-secondary border-0 p-0" data-bs-toggle="dropdown" style={{ width: '32px', height: '32px' }}>
                              <i className="bi bi-three-dots-vertical fs-5"></i>
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 py-2">
                              <li><button className="dropdown-item d-flex align-items-center gap-2 py-2 small" onClick={() => handlePrint(v)}><i className="bi bi-printer text-primary"></i> Quick Print</button></li>
                              <li><button className="dropdown-item d-flex align-items-center gap-2 py-2 small" onClick={() => handleExport(v)}><i className="bi bi-file-earmark-pdf text-danger"></i> Export PDF</button></li>
                            </ul>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredItems.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-5 text-muted small">No vouchers found matching filters.</td></tr>
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

export default VoucherReportPage;
