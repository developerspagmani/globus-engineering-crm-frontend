'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RootState } from '@/redux/store';
import { fetchLedgerEntries, addLedgerEntry, setLedgerFilters, setLedgerPage } from '@/redux/features/ledgerSlice';
import { fetchCustomers } from '@/redux/features/customerSlice';
import { fetchVendors } from '@/redux/features/vendorSlice';
import ModuleGuard from '@/components/ModuleGuard';
import Loader from '@/components/Loader';
import { checkActionPermission } from '@/config/permissions';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import LedgerPrintTemplate from '@/modules/ledger/components/LedgerPrintTemplate';
import LedgerAuditPrintTemplate from '@/modules/ledger/components/LedgerAuditPrintTemplate';
import { LedgerEntry } from '@/types/modules';
import ExportExcel from '@/components/shared/ExportExcel';
import Breadcrumb from '@/components/Breadcrumb';
import PaginationComponent from '@/components/shared/Pagination';
export default function LedgerPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { company: activeCompany, user: currentUser } = useSelector((state: RootState) => state.auth);
  const { items: ledgerEntries, loading: ledgerLoading, filters, pagination } = useSelector((state: RootState) => state.ledger);
  
  const { items: customers } = useSelector((state: RootState) => state.customers);
  const { items: vendors } = useSelector((state: RootState) => state.vendors);
  const [partyTypeFilter, setPartyTypeFilter] = React.useState<'all' | 'customer' | 'vendor'>('all');
  const [mounted, setMounted] = React.useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditData, setAuditData] = useState<LedgerEntry[]>([]);
  const auditPrintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (activeCompany?.id) {
       (dispatch as any)(fetchLedgerEntries({ 
          companyId: activeCompany.id,
          page: pagination.currentPage,
          limit: pagination.itemsPerPage,
          search: filters.search
       }));
       (dispatch as any)(fetchCustomers({ company_id: activeCompany.id, limit: 1000 }));
       (dispatch as any)(fetchVendors({ company_id: activeCompany.id, limit: 1000 }));
    }
  }, [dispatch, activeCompany?.id, pagination.currentPage, pagination.itemsPerPage, filters.search]);

  // DERIVE UNIQUE PARTIES FROM LEDGER ENTRIES + ALL CUSTOMERS/VENDORS
  const uniqueParties = React.useMemo(() => {
    const partyMap = new Map();
    const currentCompId = String(activeCompany?.id || '').toLowerCase();

    // 1. First, add all customers to the map
    customers.forEach(c => {
      const partyId = String(c.id).toLowerCase();
      partyMap.set(partyId, {
        id: c.id,
        name: c.name || 'Unknown',
        street1: c.street1 || 'Address not specified',
        street2: c.street2 || '',
        city: c.city || '-',
        state: c.state || '-',
        partyType: 'customer',
        lastUpdated: '1970-01-01'
      });
    });

    // 2. Add all vendors to the map
    vendors.forEach(v => {
      const partyId = String(v.id).toLowerCase();
      // If a vendor shares an ID with a customer, we prioritize customer or handle separately
      // In this system, they seem to have distinct ID spaces or prefixes
      if (!partyMap.has(partyId)) {
        partyMap.set(partyId, {
            id: v.id,
            name: v.name || 'Unknown',
            street1: v.street1 || 'Address not specified',
            street2: v.street2 || '',
            city: v.city || '-',
            state: v.state || '-',
            partyType: 'vendor',
            lastUpdated: '1970-01-01'
        });
      }
    });

    // 3. Filter ledger entries that belong to this company ID (Case Insensitive) and match date filters
    const companyLedger = ledgerEntries.filter(e => {
        const matchesCompany = String(e.company_id || (e as any).companyId || '').toLowerCase() === currentCompId;
        if (!matchesCompany) return false;

        if (filters.dateFrom && e.date && new Date(e.date) < new Date(filters.dateFrom)) return false;
        if (filters.dateTo && e.date && new Date(e.date) > new Date(filters.dateTo)) return false;
        
        return true;
    });

     companyLedger.forEach(entry => {
      const entryPartyId = String(entry.partyId || '').toLowerCase();
      const entryDate = entry.date || '';

      if (!partyMap.has(entryPartyId)) {
        // Find matching customer OR vendor data for address if we missed it
        const customerRef = customers.find(c => String(c.id).toLowerCase() === entryPartyId);
        const vendorRef = !customerRef ? vendors.find(v => String(v.id).toLowerCase() === entryPartyId) : null;
        const partyRef = customerRef || vendorRef;
        
        // Even if metadata is missing, we show the name from the ledger entry
        partyMap.set(entryPartyId, {
          id: entry.partyId,
          name: entry.partyName || partyRef?.name || 'Unknown',
          street1: partyRef?.street1 || 'Address not specified',
          street2: partyRef?.street2 || '',
          city: partyRef?.city || '-',
          state: partyRef?.state || '-',
          partyType: customerRef ? 'customer' : (vendorRef ? 'vendor' : ((entry as any).partyType || (entry as any).party_type || 'customer')),
          lastUpdated: entryDate
        });
      } else {
        // UPDATE lastUpdated if this transaction is newer
        const existing = partyMap.get(entryPartyId);
        if (new Date(entryDate) > new Date(existing.lastUpdated)) {
            existing.lastUpdated = entryDate;
        }
      }
    });
    
    let result = Array.from(partyMap.values());
    
    // 4. Filter by Party Type
    if (partyTypeFilter !== 'all') {
      result = result.filter(p => p.partyType.toLowerCase() === partyTypeFilter.toLowerCase());
    }

    // 5. SORT: Recent First (Parties with transactions show first, others follow)
    result.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());

    return result;
  }, [ledgerEntries, customers, vendors, activeCompany?.id, filters.dateFrom, filters.dateTo, partyTypeFilter]);

  const totalItems = uniqueParties.length;
  const itemsPerPage = 10;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedItems = React.useMemo(() => {
    const start = (pagination.currentPage - 1) * pagination.itemsPerPage;
    return uniqueParties.slice(start, start + pagination.itemsPerPage);
  }, [uniqueParties, pagination.currentPage, pagination.itemsPerPage]);

  // --- EXPORT ACTIONS ---
  const handlePrint = () => {
    const headers = ['SNO', 'PARTY NAME', 'STREET', 'CITY', 'STATE'];
    const data = uniqueParties.map((p, idx) => [
      (idx + 1).toString(),
      p.name.toUpperCase(),
      p.street1 || '-',
      p.city || '-',
      p.state || '-'
    ]);

    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return;

    printWindow.document.write('<html><head><title>Ledger Export</title>');
    printWindow.document.write('<style>table {width:100%; border-collapse: collapse; font-family: "Roboto", sans-serif; font-size: 10px;} th, td {border: 1px solid #ddd; padding: 8px; text-align: left;} th {background-color: #f2f2f2;} h2 {text-align: center; color: #333;}</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write('<h2>Globus Engineering CRM - Ledger Report</h2>');
    printWindow.document.write('<p style="text-align: center; font-size: 10px;">Total Parties: ' + uniqueParties.length + '</p>');
    
    let tableHtml = '<table><thead><tr>';
    headers.forEach(h => { tableHtml += `<th>${h}</th>`; });
    tableHtml += '</tr></thead><tbody>';
    data.forEach(row => {
      tableHtml += '<tr>';
      row.forEach(cell => { tableHtml += `<td>${cell}</td>`; });
      tableHtml += '</tr>';
    });
    tableHtml += '</tbody></table>';
    
    printWindow.document.write(tableHtml);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const headers = [['SNO', 'PARTY NAME', 'STREET', 'CITY', 'STATE']];
    const data = uniqueParties.map((p, idx) => [
      (idx + 1).toString(),
      p.name.toUpperCase(),
      p.street1 || '-',
      p.city || '-',
      p.state || '-'
    ]);

    doc.setFontSize(18);
    doc.text("Globus Engineering CRM - Ledger Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Total Parties: ${uniqueParties.length} | Generated: ${new Date().toLocaleDateString()}`, 14, 22);

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 28,
      theme: 'grid',
      headStyles: { fillColor: [0, 188, 212] },
      styles: { fontSize: 8 }
    });

    doc.save(`ledger_export_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const [downloadingItem, setDownloadingItem] = useState<any>(null);
  const downloadRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (downloadingItem && downloadRef.current) {
      const captureAndDownload = async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (downloadRef.current) {
          const canvas = await html2canvas(downloadRef.current, { scale: 2, useCORS: true, logging: false });
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const imgProps = pdf.getImageProperties(imgData);
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save(`LEDGER_${downloadingItem.name.toUpperCase()}_${new Date().toISOString().split('T')[0]}.pdf`);
          setDownloadingItem(null);
        }
      };
      captureAndDownload();
    }
  }, [downloadingItem]);

  const handleQuickPrint = (party: any) => {
    router.push(`/ledger/${party.id}?print=true`);
  };

  const handleExportPDFRecord = (party: any) => {
    setDownloadingItem(party);
  };

  // Helper: Build the audit HTML for a print window
  const buildAuditHtml = (entries: LedgerEntry[], companyName: string, companyAddress: string, fromLabel: string, toLabel: string) => {
    const fmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtDate = (d: string) => { if (!d) return ''; const dt = new Date(d); return `${String(dt.getDate()).padStart(2, '0')}.${String(dt.getMonth() + 1).padStart(2, '0')}.${dt.getFullYear()}`; };
    const sorted = [...entries].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const totalDebit = entries.reduce((s,e) => s + (e.type==='debit' ? Number(e.amount) : 0), 0);
    const totalCredit = entries.reduce((s,e) => s + (e.type==='credit' ? Number(e.amount) : 0), 0);
    const rows = sorted.map((e,i) => `
      <tr style="background:${i%2===0?'#fff':'#fafafa'}">
        <td>${fmtDate(e.date)}</td>
        <td class="cap">${e.partyName||'-'}</td>
        <td>${e.description||'-'}</td>
        <td>${e.vchType||'JOURNAL'}</td>
        <td class="right">${e.type==='debit' ? fmt(Number(e.amount)) : ''}</td>
        <td class="right">${e.type==='credit' ? fmt(Number(e.amount)) : ''}</td>
      </tr>`).join('');
    const net = totalDebit > totalCredit
      ? `₹ ${fmt(totalDebit - totalCredit)} (DR)`
      : `₹ ${fmt(totalCredit - totalDebit)} (CR)`;
    const today = new Date().toLocaleDateString('en-GB');
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Ledger Audit</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0;}
      body{font-family:'Times New Roman',Times,serif;font-size:10pt;color:#000;background:#fff;padding:15mm 10mm;}
      
      .industrial-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        border: 1.5pt solid #000;
        padding: 10px 15px;
        margin-bottom: 0;
      }
      .header-logo-box { width: 75px; height: 75px; display: flex; align-items: center; justify-content: center; }
      .header-center { text-align: center; flex: 1; padding: 0 20px; }
      .company-name-large { margin: 0; font-size: 22pt; font-weight: 900; letter-spacing: 0.8pt; }
      .company-addr-small { font-size: 9pt; font-weight: bold; margin-top: 4px; color: #333; }
      
      .header-iso-box { width: 75px; display: flex; justify-content: flex-end; align-items: center; }
      .iso-border { width: 60px; border: 1.5pt solid #000; text-align: center; }
      .iso-q { font-size: 8pt; font-weight: 900; border-bottom: 1pt solid #000; background: #f0f0f0; padding: 1px 0; }
      .iso-tuv-box { padding: 2px 0; }
      .iso-tuv { font-size: 14pt; font-weight: 900; line-height: 1; }
      .iso-sud { font-size: 9pt; font-weight: 900; }
      .iso-std { font-size: 7pt; font-weight: 900; border-top: 1pt solid #000; padding: 1px 0; }

      .report-title-bar {
        text-align: center;
        font-size: 12pt;
        font-weight: 900;
        padding: 6px 0;
        border: 1.5pt solid #000;
        border-top: 0;
        background-color: #f2f2f2;
        letter-spacing: 1.5px;
        text-transform: uppercase;
      }
      .period-bar {
        text-align: center;
        font-size: 10pt;
        font-style: italic;
        border: 1.5pt solid #000;
        border-top: 0;
        padding: 4px 0;
      }

      .meta-grid{width:100%;margin-bottom:20px;border:1.5pt solid #000;border-top:0;padding:10px;}
      .meta-row{display:flex;justify-content:space-between;margin-bottom:5px;}
      .meta-item{width:48%;display:flex;font-size:10pt;}
      .meta-label{width:140px;font-weight:bold;}
      .meta-val{flex:1;}

      table{width:100%;border-collapse:collapse;}
      th,td{border:1px solid #000;padding:6px 8px;text-align:left;}
      th{background:#f2f2f2;font-weight:bold;text-transform:uppercase;font-size:9pt;}
      .right{text-align:right;}
      .cap{text-transform:capitalize;}
      .ft-total td{border-top:2px solid #000;background:#fafafa;font-weight:bold;}
      .ft-net td{border-top:1px solid #000;background:#eee;font-weight:bold;}
      @media print{
        @page{margin:10mm;size:A4 portrait;}
        body{padding:0;}
      }
    </style></head><body>
    <div class="hdr-wrap">
      <div class="industrial-header">
         <div class="header-logo-box">
            <svg viewBox="0 0 100 100" style="width:100%;height:100%">
              <path d="M25 5 L75 5 L95 25 L95 75 L75 95 L25 95 L5 75 L5 25 Z" fill="none" stroke="#000" stroke-width="2" />
              <circle cx="50" cy="50" r="28" fill="none" stroke="#000" stroke-width="2" />
              <text x="50" y="62" font-size="32" font-weight="900" text-anchor="middle" fill="#000" font-family="Arial, sans-serif">S</text>
            </svg>
         </div>
         <div class="header-center">
            <h1 class="company-name-large">${companyName}</h1>
            <div class="company-addr-small">${companyAddress}</div>
         </div>
         <div class="header-iso-box">
            <div class="iso-border">
               <div class="iso-q">Q</div>
               <div class="iso-tuv-box">
                  <div class="iso-tuv">TÜV</div>
                  <div class="iso-sud">SÜD</div>
               </div>
               <div class="iso-std">ISO 9001</div>
            </div>
         </div>
      </div>
      <div class="report-title-bar">FULL LEDGER AUDIT REPORT</div>
      <div class="period-bar">Period: ${fromLabel} to ${toLabel}</div>
      
      <div class="meta-grid">
        <div class="meta-row">
          <div class="meta-item">
            <span class="meta-label">Report Type</span>
            <span class="meta-val">: Full Audit Statement</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Statement Period</span>
            <span class="meta-val">: ${fromLabel} to ${toLabel}</span>
          </div>
        </div>
        <div class="meta-row">
          <div class="meta-item">
            <span class="meta-label">Generated On</span>
            <span class="meta-val">: ${today}</span>
          </div>
        </div>
      </div>
    </div>
    <table>
      <thead><tr><th>Date</th><th>Party Name</th><th>Particulars</th><th>Vch Type</th><th class="right">Debit</th><th class="right">Credit</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr class="ft-total"><td colspan="4" class="right">TOTAL PERIOD TRANSACTIONS</td><td class="right">${fmt(totalDebit)}</td><td class="right">${fmt(totalCredit)}</td></tr>
        <tr class="ft-net"><td colspan="4" class="right">NET DIFFERENCE</td><td colspan="2" class="right">${net}</td></tr>
      </tfoot>
    </table>
    <script>window.onload=()=>{setTimeout(()=>{window.print();},500);}<\/script>
    </body></html>`;
  };

  // Print Audit → opens browser print preview (user can choose PDF or printer)
  const handlePrintAudit = async () => {
    if (!activeCompany?.id) return;
    setAuditLoading(true);
    try {
      const response = await (dispatch as any)(fetchLedgerEntries({
        companyId: activeCompany.id,
        page: 1,
        limit: 10000,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo
      })).unwrap();

      const entries: LedgerEntry[] = response.items;
      const companyName = activeCompany?.name?.toUpperCase() || 'GLOBUS ENGINEERING';
      const companyAddress = (activeCompany as any)?.address || 'COIMBATORE';
      const fmtDate = (d: string) => { if (!d) return ''; const dt = new Date(d); return `${String(dt.getDate()).padStart(2, '0')}.${String(dt.getMonth() + 1).padStart(2, '0')}.${dt.getFullYear()}`; };
      const fromLabel = filters.dateFrom ? fmtDate(filters.dateFrom) : 'Start';
      const toLabel = filters.dateTo ? fmtDate(filters.dateTo) : 'Today';

      const html = buildAuditHtml(entries, companyName, companyAddress, fromLabel, toLabel);
      const pw = window.open('', '_blank', 'width=900,height=700');
      if (pw) {
        pw.document.write(html);
        pw.document.close();
      }
    } catch (error) {
      console.error('Print audit failed:', error);
    } finally {
      setAuditLoading(false);
    }
  };

  // Download Audit PDF → silently saves as PDF (no preview)
  const handleDownloadAuditPDF = async () => {
    if (!activeCompany?.id) return;
    setAuditLoading(true);
    try {
      const response = await (dispatch as any)(fetchLedgerEntries({
        companyId: activeCompany.id,
        page: 1,
        limit: 10000,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo
      })).unwrap();
      setAuditData(response.items);

      setTimeout(async () => {
        if (auditPrintRef.current) {
          const canvas = await html2canvas(auditPrintRef.current, { scale: 2, useCORS: true, logging: false, windowWidth: 1200 });
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          const imgProps = pdf.getImageProperties(imgData);
          const imgWidth = pdfWidth;
          const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
          let heightLeft = imgHeight;
          let position = 0;
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pdfHeight;
          while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;
          }
          pdf.save(`FULL_LEDGER_AUDIT_${new Date().toISOString().split('T')[0]}.pdf`);
          setAuditData([]);
        }
        setAuditLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Audit PDF download failed:', error);
      setAuditLoading(false);
    }
  };


  return (
    <ModuleGuard moduleId="mod_ledger">
      <div className="container-fluid py-4 min-vh-100 animate-fade-in px-4">
        {/* Header Section Standardized */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <Breadcrumb items={[{ label: 'Financial Hub', active: true }]} />
            <h2 className="fw-900 tracking-tight text-dark mb-1 mt-2">Account Ledger</h2>
            <p className="text-muted small mb-0">Total parties with transactions: {uniqueParties.length} • Tracking industrial statements</p>
          </div>
          <div className="d-flex align-items-center gap-2 hide-print">
            <ExportExcel 
              data={ledgerEntries} 
              fileName="Ledger_Report" 
              headers={{ partyName: 'Party Name', date: 'Date', description: 'Description', debit: 'Debit', credit: 'Credit', balance: 'Balance' }}
              buttonText="Export List"
            />
            {mounted && checkActionPermission(currentUser, 'mod_ledger', 'create') && (
              <Link
                href="/ledger/new-entry"
                className="btn btn-primary btn-page-action px-4"
              >
                <i className="bi bi-plus-lg"></i>
                <span>Add Entry</span>
              </Link>
            )}
          </div>
        </div>

        {/* Filter Row */}
        <div className="card filter-card">
          <div className="card-body p-3">
            <div className="filter-bar-row">
              <div className="filter-item-search">
                <div className="search-group">
                  <span className="input-group-text">
                    <i className="bi bi-search"></i>
                  </span>
                  <input 
                    type="text" 
                    className="form-control search-bar" 
                    placeholder="Search by party name, city or state..." 
                    value={filters.search}
                    onChange={(e) => dispatch(setLedgerFilters({ search: e.target.value }))}
                  />
                </div>
              </div>

              <div className="filter-item-select">
                 <select 
                    className="form-select search-bar"
                    value={partyTypeFilter}
                    onChange={(e) => setPartyTypeFilter(e.target.value as any)}
                 >
                    <option value="all">All Parties</option>
                    <option value="customer">Customers</option>
                    <option value="vendor">Vendors</option>
                 </select>
              </div>
              
              <div className="date-filter-group">
                <input 
                  type="date" 
                  className="text-muted"
                  value={filters.dateFrom}
                  onChange={(e) => dispatch(setLedgerFilters({ dateFrom: e.target.value }))}
                />
                <span className="text-muted small fw-bold mx-1">TO</span>
                <input 
                  type="date" 
                  className="text-muted"
                  value={filters.dateTo}
                  onChange={(e) => dispatch(setLedgerFilters({ dateTo: e.target.value }))}
                />
                <button 
                  className="btn btn-audit btn-sm ms-2 d-flex align-items-center gap-2 rounded-pill px-3 shadow-sm"
                  style={{ height: '38px' }}
                  onClick={handlePrintAudit}
                  disabled={auditLoading}
                  title="Preview & Print ledger audit (or Save as PDF via browser)"
                >
                  {auditLoading ? (
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  ) : (
                    <i className="bi bi-printer-fill"></i>
                  )}
                  <span className="fw-bold small">Print Audit</span>
                </button>
                <button 
                  className="btn btn-audit btn-sm ms-1 d-flex align-items-center gap-2 rounded-pill px-3 shadow-sm"
                  style={{ height: '38px' }}
                  onClick={handleDownloadAuditPDF}
                  disabled={auditLoading}
                  title="Download Full Ledger Audit as PDF file"
                >
                  <i className="bi bi-file-earmark-pdf-fill"></i>
                  <span className="fw-bold small">PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Table from Ledger */}
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="table-responsive" style={{ minHeight: '400px', paddingBottom: '80px' }}>
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr className="border-bottom">
                  <th className="py-3 border-0 small fw-bold text-muted text-capitalize tracking-wider text-center" style={{ width: '60px' }}>Sno</th>
                  <th className="py-3 border-0 small fw-bold text-muted text-capitalize tracking-wider">Party Name</th>
                  <th className="py-3 border-0 small fw-bold text-muted text-capitalize tracking-wider">Street</th>
                  <th className="py-3 border-0 small fw-bold text-muted text-capitalize tracking-wider">City</th>
                  <th className="py-3 border-0 small fw-bold text-muted text-capitalize tracking-wider">State</th>
                  <th className="py-3 border-0 small fw-bold text-muted text-capitalize tracking-wider text-center px-4" style={{ width: '120px' }}>Action</th>
                </tr>
              </thead>
              <tbody className="border-top-0">
                {ledgerLoading ? (
                  <tr>
                    <td colSpan={6}>
                      <Loader text="Fetching Ledger Entries..." />
                    </td>
                  </tr>
                ) : paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5">
                      <p className="text-muted fw-normal small">No ledger records found for this company.</p>
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((party, index) => (
                    <tr key={party.id || `party-${index}`}>
                      <td className="text-muted small text-center">{(pagination.currentPage - 1) * pagination.itemsPerPage + index + 1}</td>
                      <td>
                        <div className="d-flex flex-column">
                           <Link href={`/ledger/${party.id}`} className="fw-bold text-dark text-capitalize text-decoration-none hover-underline" style={{ cursor: 'pointer' }}>{party.name}</Link>
                        </div>
                      </td>
                      <td className="text-muted small">{party.street1 || '-'}</td>
                      <td className="text-muted small">{party.city || '-'}</td>
                      <td className="text-muted small">{party.state || '-'}</td>
                      <td className="text-center px-4">
                        <div className="d-flex justify-content-center align-items-center gap-1">
                          <Link href={`/ledger/${party.id}`} className="btn-action-view" title="View Detail">
                            <i className="bi bi-eye-fill"></i>
                          </Link>
                          
                          <div className="dropdown">
                            <button 
                              className="btn btn-sm btn-outline-secondary border-0 text-muted p-0 ms-1 d-flex align-items-center justify-content-center" 
                              type="button" 
                              id={`actions-${party.id}`} 
                              data-bs-toggle="dropdown" 
                              aria-expanded="false"
                              style={{ width: '32px', height: '32px', borderRadius: '8px' }}
                            >
                              <i className="bi bi-three-dots-vertical fs-5"></i>
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3 py-2" aria-labelledby={`actions-${party.id}`}>
                              <li>
                                <button className="dropdown-item d-flex align-items-center gap-2 py-2" type="button" onClick={() => handleQuickPrint(party)}>
                                  <i className="bi bi-printer text-primary"></i>
                                  <span className="small fw-semibold">Quick Print</span>
                                </button>
                              </li>
                              <li>
                                <button className="dropdown-item d-flex align-items-center gap-2 py-2" type="button" onClick={() => handleExportPDFRecord(party)}>
                                  <i className="bi bi-file-earmark-pdf text-danger"></i>
                                  <span className="small fw-semibold">Export PDF</span>
                                </button>
                              </li>
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

        {/* Pagination Rendering */}
        {totalPages > 1 && (
          <div className="mt-4 d-flex justify-content-between align-items-center">
            <span className="text-muted small">Showing {Math.min((pagination.currentPage - 1) * itemsPerPage + 1, totalItems)} to {Math.min(pagination.currentPage * itemsPerPage, totalItems)} of {totalItems} entries</span>
            <PaginationComponent 
              currentPage={pagination.currentPage} 
              totalPages={totalPages} 
              onPageChange={(page) => dispatch(setLedgerPage(page))} 
            />

          </div>
        )}

        {/* Pagination Rendering removed if single page, but kept for list */}
      </div>

      <style jsx>{`
        @media print {
          :global(body *) { visibility: hidden; }
          .container-fluid, .container-fluid * { visibility: visible; }
          .container-fluid { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; }
          .table th:last-child, .table td:last-child { display: none !important; }
          .hide-print { display: none !important; }
          :global(.sidebar), :global(.header), .h2, h2, .text-muted, .pagination, .card-header { display: none !important; }
          .card { border: none !important; box-shadow: none !important; }
        }

        .btn-audit {
          background-color: white;
          border: 1px solid #dee2e6 !important;
          color: #1a1a1a;
          transition: all 0.3s ease;
        }

        .btn-audit:hover {
          background-color: #1a1a1a !important;
          color: white !important;
          border-color: #1a1a1a !important;
        }

        .btn-audit i {
          color: #475569;
          transition: all 0.3s ease;
        }

        .btn-audit:hover i {
          color: #ffffff !important;
        }
      `}</style>
      {/* Hidden Download Generators */}
      {downloadingItem && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <div ref={downloadRef}>
            <LedgerPrintTemplate 
               party={downloadingItem} 
               entries={ledgerEntries.filter(e => String(e.partyId) === String(downloadingItem.id))} 
               company={activeCompany} 
            />
          </div>
        </div>
      )}

      {auditData.length > 0 && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <div ref={auditPrintRef} style={{ width: '210mm' }}>
             <LedgerAuditPrintTemplate 
                entries={auditData} 
                company={activeCompany} 
                dateFrom={filters.dateFrom} 
                dateTo={filters.dateTo} 
             />
          </div>
        </div>
      )}
    </ModuleGuard>
  );
}
