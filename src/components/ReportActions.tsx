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
    printWindow.document.write('<html><head><title>Print Records</title>');
    printWindow.document.write('<style>');
    printWindow.document.write('table {width:100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 11px;}');
    printWindow.document.write('th, td {border: 1px solid #ddd; padding: 8px; text-align: left;}');
    printWindow.document.write('th {background-color: #f8f9fa; color: #333; text-transform: uppercase; font-weight: bold;}');
    printWindow.document.write('.text-uppercase {text-transform: uppercase;}');
    printWindow.document.write('h2 {font-family: Arial, sans-serif; margin-bottom: 20px;}');
    printWindow.document.write('</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write('<div style="text-align: center;">');
    printWindow.document.write('<h2>Globus Engineering - Report Export</h2>');
    printWindow.document.write('</div>');
    printWindow.document.write(printTable.outerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    
    // Slight delay to ensure contents are loaded before printing
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
      
      // Exclude action column if present
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
    
    // Find Action column index to exclude it
    const headerNames = Array.from(table.querySelectorAll('thead th')).map(h => (h as HTMLElement).innerText.toLowerCase());
    const actionIndex = headerNames.indexOf('action');

    rows.forEach(row => {
      let cols = Array.from(row.querySelectorAll('th, td'));
      
      // Exclude action column if present
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

    // Filter out Action column if present
    const headers = actionIndex !== -1 ? allHeaders.filter((_, idx) => idx !== actionIndex) : allHeaders;
    
    const data = Array.from(table.querySelectorAll('tbody tr')).map(row => {
      let cells = Array.from(row.querySelectorAll('td'));
      if (actionIndex !== -1) {
          cells = cells.filter((_, idx) => idx !== actionIndex);
      }
      return cells.map(td => (td as HTMLElement).innerText.trim());
    });

    doc.setFontSize(16);
    doc.text("Globus Engineering - Generated Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

    autoTable(doc, {
      head: [headers],
      body: data,
      startY: 30,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }, // #3B82F6 (Blue)
      styles: { fontSize: 8 }
    });

    doc.save(`report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="d-flex gap-1 flex-wrap hide-print">
      <button 
        onClick={handlePrint} 
        className="btn btn-info text-white btn-sm fw-bold px-3 py-2 rounded-0 shadow-sm" 
        style={{ backgroundColor: '#3B82F6', borderColor: '#3B82F6' }}
      >
        <i className="bi bi-printer fw-bold"></i> PRINT
      </button>
      <button 
        onClick={handleExportExcel} 
        className="btn btn-sm fw-bold px-3 py-2 rounded-0 text-white shadow-sm" 
        style={{ backgroundColor: '#da3e00', borderColor: '#da3e00' }}
      >
        <i className="bi bi-file-earmark-spreadsheet fw-bold"></i> EXCEL
      </button>
      <button 
        onClick={handleCopyTable} 
        className="btn btn-success btn-sm fw-bold px-3 py-2 rounded-0 shadow-sm"
      >
        <i className="bi bi-files fw-bold"></i> COPY
      </button>
      <button 
        onClick={handleExportPDF} 
        className="btn btn-warning text-white btn-sm fw-bold px-3 py-2 rounded-0 shadow-sm" 
        style={{ backgroundColor: '#ff9800', borderColor: '#ff9800' }}
      >
        <i className="bi bi-file-earmark-pdf fw-bold"></i> PDF
      </button>
    </div>
  );
};

export default ReportActions;
