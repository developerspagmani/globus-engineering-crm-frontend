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
  const [activePreset, setActivePreset] = React.useState<string | null>(null);

  const handlePresetClick = (type: 'week' | 'month' | 'thisMonth' | 'year') => {
    setActivePreset(type);
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
      return cells.map(td => (td as HTMLElement).innerText.trim().replace(/₹/g, 'INR '));
    });

    doc.setFillColor(30, 30, 30); doc.rect(0, 0, 210, 45, 'F');
    doc.setTextColor(255, 255, 255); 
    doc.setFontSize(22); doc.setFont("helvetica", "bold"); doc.text("GLOBUS ENGINEERING TOOLS", 105, 18, { align: "center" });
    doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.text("PRECISION INDUSTRIAL ENGINEERING & AUDIT LOGISTICS", 105, 25, { align: "center" });
    doc.setDrawColor(255, 255, 255); doc.setLineWidth(0.5); doc.line(35, 28, 175, 28);
    doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.text(`${title.toUpperCase()} ANALYSIS STATEMENT`, 105, 37, { align: "center" });

    autoTable(doc, {
      head: [headers],
      body: data,
      startY: 55,
      theme: 'grid',
      headStyles: { 
        fillColor: [60, 60, 60], 
        textColor: [255, 255, 255], 
        fontStyle: 'bold', 
        fontSize: 9, 
        halign: 'center',
        lineWidth: 0.1,
        lineColor: [0, 0, 0]
      },
      styles: { 
        fontSize: 8, 
        cellPadding: 3, 
        textColor: [0, 0, 0],
        valign: 'middle',
        lineWidth: 0.1,
        lineColor: [200, 200, 200]
      },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      margin: { left: 14, right: 14 },
      didDrawPage: (dataArg) => {
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Official Audit Export | Generated: ${new Date().toLocaleString()} | Page ${dataArg.pageNumber}`, 14, doc.internal.pageSize.height - 10);
      }
    });

    doc.save(`audit_${title.toLowerCase().replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const getBtnClass = (preset: string) => {
    const base = "btn btn-link link-dark text-decoration-none small fw-800 p-1 px-3 rounded-pill transition-all";
    if (activePreset === preset) {
      return `${base} bg-primary text-white shadow-sm`;
    }
    return `${base} hover-bg-light`;
  };

  return (
    <div className="d-flex align-items-center gap-2">
       {/* Presets - Only show if date setters are available */}
       {setFromDate && setToDate && (
         <div className="d-flex gap-1 me-2 bg-white p-1 rounded-pill border shadow-sm px-2">
             <button onClick={() => handlePresetClick('week')} className={getBtnClass('week')} style={{ fontSize: '0.75rem' }}>L7D</button>
             <button onClick={() => handlePresetClick('month')} className={getBtnClass('month')} style={{ fontSize: '0.75rem' }}>LM</button>
             <button onClick={() => handlePresetClick('thisMonth')} className={getBtnClass('thisMonth')} style={{ fontSize: '0.75rem' }}>TM</button>
             <button onClick={() => handlePresetClick('year')} className={getBtnClass('year')} style={{ fontSize: '0.75rem' }}>FY</button>
         </div>
       )}

       {/* Export Buttons */}
       <div className="d-flex gap-2 border-start ps-3 ms-auto">
          <button 
            onClick={handlePrint} 
            className="btn btn-outline-dark fw-bold d-flex align-items-center gap-2 px-3 border-dark-subtle shadow-sm hover-up btn-sm rounded-4" 
            style={{ height: '36px' }}
          >
            <i className="bi bi-printer"></i> Print Audit
          </button>
          <button 
            onClick={handleExportPDF} 
            className="btn btn-dark text-white fw-bold d-flex align-items-center gap-2 px-3 border-0 shadow-sm hover-up btn-sm rounded-4" 
            style={{ height: '36px' }}
          >
            <i className="bi bi-file-earmark-pdf"></i> Pdf
          </button>
       </div>
    </div>
  );
};

export default ReportActions;
