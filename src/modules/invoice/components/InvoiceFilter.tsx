'use client';

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { setInvoiceFilters } from '@/redux/features/invoiceSlice';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const InvoiceFilter: React.FC = () => {
  const dispatch = useDispatch();
  const { filters } = useSelector((state: RootState) => state.invoices);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    dispatch(setInvoiceFilters({ [name]: value }));
  };

  const handleCopyTable = () => {
    const table = document.querySelector('table');
    if (!table) return;
    let text = "";
    const rows = table.querySelectorAll('tr');
    rows.forEach(row => {
      const cols = Array.from(row.querySelectorAll('th, td'));
      const rowData = cols.slice(0, -1).map(col => (col as HTMLElement).innerText.trim()).join("\t");
      text += rowData + "\n";
    });
    navigator.clipboard.writeText(text).then(() => alert("Table data copied to clipboard!"));
  };

  const handleExportExcel = () => {
    const rows = document.querySelectorAll('table tr');
    let csvContent = "data:text/csv;charset=utf-8,";
    rows.forEach(row => {
      const cols = Array.from(row.querySelectorAll('th, td'));
      const rowData = cols.slice(0, -1).map(col => `"${(col as HTMLElement).innerText.replace(/"/g, '""').trim()}"`).join(",");
      csvContent += rowData + "\r\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `invoices_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const table = document.querySelector('table');
    if (!table) return;
    const allHeaders = Array.from(table.querySelectorAll('thead th')).map(h => (h as HTMLElement).innerText.trim());
    const actionIndex = allHeaders.map(h => h.toLowerCase()).indexOf('action');
    const headers = actionIndex !== -1 ? allHeaders.filter((_, idx) => idx !== actionIndex) : allHeaders;
    const data = Array.from(table.querySelectorAll('tbody tr')).map(row => {
      let cells = Array.from(row.querySelectorAll('td'));
      if (actionIndex !== -1) cells = cells.filter((_, idx) => idx !== actionIndex);
      return cells.map(td => (td as HTMLElement).innerText.trim());
    });
    doc.setFontSize(16); doc.text("Invoice List Report", 14, 15);
    doc.setFontSize(10); doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);
    autoTable(doc, { head: [headers], body: data, startY: 30, theme: 'grid', styles: { fontSize: 8 } });
    doc.save(`invoices_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-body py-2">
        <div className="d-flex flex-wrap align-items-center gap-2">
          {/* Search Bar */}
          <div className="flex-grow-1" style={{ minWidth: '300px' }}>
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0 py-2">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0 py-2"
                placeholder="Search by invoice number or customer..."
                name="search"
                value={filters.search}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Status Dropdown */}
          <div style={{ width: '150px' }}>
            <select
              className="form-select py-2"
              name="status"
              value={filters.status}
              onChange={handleChange}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Export Buttons */}
          <div className="d-flex gap-2 ms-auto">
              <button onClick={handleExportExcel} className="btn shadow-sm text-white fw-bold d-flex align-items-center gap-2 px-3 border-0 transition-smooth" style={{ backgroundColor: '#da3e00', borderRadius: 'var(--radius-lg)', height: '42px', fontSize: '0.8rem' }}>
              <i className="bi bi-file-earmark-spreadsheet"></i> EXCEL
            </button>
            <button onClick={handleCopyTable} className="btn shadow-sm btn-success fw-bold d-flex align-items-center gap-2 px-3 border-0 transition-smooth" style={{ height: '42px', fontSize: '0.8rem', borderRadius: 'var(--radius-lg)' }}>
              <i className="bi bi-files"></i> COPY
            </button>
            {/* <button onClick={handleExportPDF} className="btn shadow-sm btn-warning text-white fw-bold d-flex align-items-center gap-2 px-3 border-0 transition-smooth rounded-pill" style={{ backgroundColor: '#ff9800', height: '42px', fontSize: '0.8rem' }}>
              <i className="bi bi-file-earmark-pdf"></i> PDF
            </button> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceFilter;
