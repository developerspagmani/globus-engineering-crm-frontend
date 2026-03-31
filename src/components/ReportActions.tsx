'use client';

import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ReportActions = () => {
  const handlePrint = () => {
    const table = document.querySelector('table');
    if (!table) return;

    // Clone table and remove action column if it exists
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

    // Build print document with basic styling
    printWindow.document.write('<html><head><title>Print Report Records</title>');
    printWindow.document.write('<style>');
    printWindow.document.write('body { font-family: sans-serif; padding: 20px; }');
    printWindow.document.write('table {width:100%; border-collapse: collapse; font-size: 11px;}');
    printWindow.document.write('th, td {border: 1px solid #ddd; padding: 8px; text-align: left; text-transform: uppercase;}');
    printWindow.document.write('th {background-color: #f8f9fa; color: #333; font-weight: bold;}');
    printWindow.document.write('h2 { color: #2563eb; margin-bottom: 20px; }');
    printWindow.document.write('</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write('<div style="text-align: center;">');
    printWindow.document.write('<h2>Globus Engineering - Official Report Export</h2>');
    printWindow.document.write('<p style="font-size: 10px; color: #666;">Generated on ' + new Date().toLocaleString() + '</p>');
    printWindow.document.write('</div>');
    printWindow.document.write(printTable.outerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    
    setTimeout(() => {
        printWindow.print();
    }, 500);
  };

  const handleCopyTable = () => {
    const table = document.querySelector('table');
    if (!table) return;
    
    let text = "";
    const rows = table.querySelectorAll('tr');
    
    // Find Action column index to exclude it
    const headerNames = Array.from(table.querySelectorAll('thead th')).map(h => (h as HTMLElement).innerText.toLowerCase());
    const actionIndex = headerNames.indexOf('action');

    rows.forEach(row => {
      let cols = Array.from(row.querySelectorAll('th, td'));
      
      if (actionIndex !== -1) {
          cols = cols.filter((_, idx) => idx !== actionIndex);
      }
      
      const rowData = cols.map(col => (col as HTMLElement).innerText.trim()).join("\t");
      text += rowData + "\n";
    });

    navigator.clipboard.writeText(text).then(() => {
      alert("Report data copied to clipboard!");
    });
  };

  const handleExportExcel = () => {
    const table = document.querySelector('table');
    if (!table) return;

    const rows = table.querySelectorAll('tr');
    let csvContent = "data:text/csv;charset=utf-8,";
    
    const headerNames = Array.from(table.querySelectorAll('thead th')).map(h => (h as HTMLElement).innerText.toLowerCase());
    const actionIndex = headerNames.indexOf('action');

    rows.forEach(row => {
      let cols = Array.from(row.querySelectorAll('th, td'));
      
      if (actionIndex !== -1) {
          cols = cols.filter((_, idx) => idx !== actionIndex);
      }

      const rowData = cols
        .map(col => `"${(col as HTMLElement).innerText.replace(/"/g, '""').trim()}"`)
        .join(",");
      csvContent += rowData + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const fileName = `report_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute("download", fileName);
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
      if (actionIndex !== -1) {
          cells = cells.filter((_, idx) => idx !== actionIndex);
      }
      return cells.map(td => (td as HTMLElement).innerText.trim());
    });

    doc.setFillColor(37, 99, 235); doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.text("GLOBUS ENGINEERING", 14, 25);
    doc.setFontSize(10); doc.text("OFFICIAL REPORT EXPORT STATEMENTS", 14, 32);

    autoTable(doc, {
      head: [headers],
      body: data,
      startY: 50,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 8, cellPadding: 3 }
    });

    doc.save(`report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="d-flex gap-2">
      {/* <button 
        onClick={handlePrint} 
        className="btn btn-primary fw-bold d-flex align-items-center gap-2 px-3 border-0 transition-smooth shadow-sm" 
        style={{ height: '42px', fontSize: '0.8rem', borderRadius: 'var(--radius-lg)' }}
      >
        <i className="bi bi-printer"></i> PRINT
      </button> */}
                    <button onClick={handleExportExcel} className="btn shadow-sm text-white fw-bold d-flex align-items-center gap-2 px-3 border-0 transition-smooth" style={{ backgroundColor: '#da3e00', borderRadius: 'var(--radius-lg)', height: '42px', fontSize: '0.8rem' }}>

        <i className="bi bi-file-earmark-spreadsheet"></i> EXCEL
      </button>
                  <button onClick={handleCopyTable} className="btn shadow-sm btn-success fw-bold d-flex align-items-center gap-2 px-3 border-0 transition-smooth" style={{ height: '42px', fontSize: '0.8rem', borderRadius: 'var(--radius-lg)' }}>

        <i className="bi bi-files"></i> COPY
      </button>
      {/* <button 
        onClick={handleExportPDF} 
        className="btn btn-warning text-white fw-bold d-flex align-items-center gap-2 px-3 border-0 transition-smooth shadow-sm" 
        style={{ backgroundColor: '#ff9800', height: '42px', fontSize: '0.8rem', borderRadius: 'var(--radius-lg)' }}
      >
        <i className="bi bi-file-earmark-pdf"></i> PDF
      </button> */}
    </div>
  );
};

export default ReportActions;
