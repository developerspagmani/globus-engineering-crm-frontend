'use client';

import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportActionsProps {
  setFromDate?: (date: string) => void;
  setToDate?: (date: string) => void;
  title?: string;
}

const ReportActions: React.FC<ReportActionsProps> = ({ setFromDate, setToDate, title = "Report" }) => {
  const handlePresetClick = (type: 'week' | 'month' | 'thisMonth' | 'year') => {
    const today = new Date();
    let from = new Date();
    let to = today;

    if (type === 'week') {
      from.setDate(today.getDate() - 7);
    } else if (type === 'month') {
      from.setMonth(today.getMonth() - 1);
    } else if (type === 'thisMonth') {
      from = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (type === 'year') {
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();
      if (currentMonth < 3) {
        from = new Date(currentYear - 1, 3, 1);
        to = new Date(currentYear, 2, 31);
      } else {
        from = new Date(currentYear, 3, 1);
        to = new Date(currentYear + 1, 2, 31);
      }
    }

    setFromDate?.(from.toISOString().split('T')[0]);
    setToDate?.(to.toISOString().split('T')[0]);
  };

  const handlePrint = () => {
    const table = document.querySelector('table');
    if (!table) return;

    const printTable = table.cloneNode(true) as HTMLTableElement;
    const headerRow = printTable.querySelector('thead tr');
    if (headerRow) {
      const headerNames = Array.from(headerRow.querySelectorAll('th')).map(h => h.innerText.toLowerCase());
      const actionIndex = headerNames.indexOf('action');
      if (actionIndex !== -1) {
          headerRow.querySelector(`th:nth-child(${actionIndex + 1})`)?.remove();
          const bodyRows = printTable.querySelectorAll('tbody tr');
          bodyRows.forEach(row => {
              row.querySelector(`td:nth-child(${actionIndex + 1})`)?.remove();
          });
      }
    }

    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return;

    printWindow.document.write('<html><head><title>Print Report Records</title>');
    printWindow.document.write('<style>');
    printWindow.document.write('body { font-family: sans-serif; padding: 20px; }');
    printWindow.document.write('table {width:100%; border-collapse: collapse; font-size: 11px;}');
    printWindow.document.write('th, td {border: 1px solid #ddd; padding: 8px; text-align: left; text-transform: uppercase;}');
    printWindow.document.write('th {background-color: #f8f9fa; color: #333; font-weight: bold;}');
    printWindow.document.write('h2 { color: #ea580c; margin-bottom: 20px; text-align: center; }');
    printWindow.document.write('</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write('<div>');
    printWindow.document.write(`<h2>Globus Engineering - ${title || 'Official Report Export'}</h2>`);
    printWindow.document.write('<p style="font-size: 10px; color: #666; text-align: center;">Generated on ' + new Date().toLocaleString() + '</p>');
    printWindow.document.write('</div>');
    printWindow.document.write(printTable.outerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    
    setTimeout(() => {
        printWindow.print();
    }, 500);
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
      if (actionIndex !== -1) {
          cells = cells.filter((_, idx) => idx !== actionIndex);
      }
      return cells.map(td => (td as HTMLElement).innerText.trim());
    });

    doc.setFillColor(37, 99, 235); doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.text("GLOBUS ENGINEERING", 14, 25);
    doc.setFontSize(10); doc.text(`${(title || 'REPORT EXPORT').toUpperCase()} STATEMENTS`, 14, 32);

    autoTable(doc, {
      head: [headers],
      body: data,
      startY: 50,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 8, cellPadding: 3 }
    });

    doc.save(`${(title || 'report').toLowerCase().replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="d-flex align-items-center gap-2">
       {/* Presets - Only show if date setters are available */}
       {setFromDate && setToDate && (
         <div className="d-flex gap-1 me-2 bg-white p-1 rounded-pill border shadow-sm px-2">
             <button onClick={() => handlePresetClick('week')} className="btn btn-link link-dark text-decoration-none small fw-bold p-1 px-2 hover-bg-light rounded-pill" style={{ fontSize: '0.75rem' }}>L7D</button>
             <button onClick={() => handlePresetClick('month')} className="btn btn-link link-dark text-decoration-none small fw-bold p-1 px-2 hover-bg-light rounded-pill" style={{ fontSize: '0.75rem' }}>LM</button>
             <button onClick={() => handlePresetClick('thisMonth')} className="btn btn-link link-dark text-decoration-none small fw-bold p-1 px-2 hover-bg-light rounded-pill" style={{ fontSize: '0.75rem' }}>TM</button>
             <button onClick={() => handlePresetClick('year')} className="btn btn-link link-dark text-decoration-none small fw-bold p-1 px-2 hover-bg-light rounded-pill" style={{ fontSize: '0.75rem' }}>FY</button>
         </div>
       )}

       {/* Export Buttons */}
       <div className="d-flex gap-2 border-start ps-3 ms-auto">
          <button 
            onClick={handlePrint} 
            className="btn btn-outline-primary fw-bold d-flex align-items-center gap-2 px-3 border-light-subtle shadow-sm hover-up btn-sm rounded-pill" 
            style={{ height: '36px' }}
          >
            <i className="bi bi-printer"></i> Print
          </button>
          <button 
            onClick={handleExportPDF} 
            className="btn btn-warning text-white fw-bold d-flex align-items-center gap-2 px-3 border-0 shadow-sm hover-up btn-sm rounded-pill" 
            style={{ backgroundColor: '#ff9800', height: '36px' }}
          >
            <i className="bi bi-file-earmark-pdf"></i> Pdf
          </button>
       </div>
    </div>
  );
};

export default ReportActions;
