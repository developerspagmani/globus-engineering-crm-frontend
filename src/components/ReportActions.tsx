'use client';

import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportActionsProps {
  setFromDate?: (date: string) => void;
  setToDate?: (date: string) => void;
  title?: string;
  orientation?: 'portrait' | 'landscape';
  onFetchAll?: () => Promise<{ headers: string[], data: string[][] }>;
}

const ReportActions: React.FC<ReportActionsProps> = ({ 
  setFromDate, 
  setToDate, 
  title = "Report", 
  orientation = 'portrait', 
  onFetchAll 
}) => {
  const [activePreset, setActivePreset] = React.useState<string | null>(null);
  const [printLoading, setPrintLoading] = React.useState(false);
  const [pdfLoading, setPdfLoading] = React.useState(false);

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

  const handlePrint = async () => {
    let headers: string[] = [];
    let data: string[][] = [];

    if (onFetchAll) {
      setPrintLoading(true);
      try {
        const res = await onFetchAll();
        headers = res.headers;
        data = res.data;
      } catch (err) {
        console.error("Failed to fetch full report data", err);
        return;
      } finally {
        setPrintLoading(false);
      }
    } else {
      const table = document.querySelector('table');
      if (!table) return;

      const allHeaders = Array.from(table.querySelectorAll('thead th')).map(h => (h as HTMLElement).innerText.trim());
      const actionIndex = allHeaders.map(h => h.toLowerCase()).indexOf('action');
      headers = actionIndex !== -1 ? allHeaders.filter((_, idx) => idx !== actionIndex) : allHeaders;

      data = Array.from(table.querySelectorAll('tbody tr')).map(row => {
        let cells = Array.from(row.querySelectorAll('td'));
        if (actionIndex !== -1) {
            cells = cells.filter((_, idx) => idx !== actionIndex);
        }
        return cells.map(td => (td as HTMLElement).innerText.trim());
      });
    }

    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return;

    printWindow.document.write(`<html><head><title>${title} - Audit Report</title>`);
    printWindow.document.write('<style>');
    printWindow.document.write(`@page { size: ${orientation}; margin: 10mm; }`);
    printWindow.document.write('body { font-family: sans-serif; padding: 20px; }');
    printWindow.document.write('table {width:100%; border-collapse: collapse; font-size: 10px;}');
    printWindow.document.write('th, td {border: 1px solid #ddd; padding: 6px; text-align: left; text-transform: uppercase;}');
    printWindow.document.write('th {background-color: #f2f2f2; color: #333; font-weight: bold;}');
    printWindow.document.write('h2 { color: #ea580c; margin-bottom: 10px; text-align: center; font-size: 18px; }');
    printWindow.document.write('p { text-align: center; font-size: 10px; color: #666; }');
    printWindow.document.write('</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write('<div>');
    printWindow.document.write(`<h2>Globus Engineering - ${title || 'Official Audit Statement'}</h2>`);
    printWindow.document.write('<p>Generated on ' + new Date().toLocaleString() + '</p>');
    printWindow.document.write('</div>');
    
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

  const handleExportPDF = async () => {
    let headers: string[] = [];
    let data: string[][] = [];

    if (onFetchAll) {
      setPdfLoading(true);
      try {
        const res = await onFetchAll();
        headers = res.headers;
        data = res.data;
      } catch (err) {
        console.error("Failed to fetch full report data", err);
        return;
      } finally {
        setPdfLoading(false);
      }
    } else {
      const table = document.querySelector('table');
      if (!table) return;

      const allHeaders = Array.from(table.querySelectorAll('thead th')).map(h => (h as HTMLElement).innerText.trim());
      const actionIndex = allHeaders.map(h => h.toLowerCase()).indexOf('action');
      headers = actionIndex !== -1 ? allHeaders.filter((_, idx) => idx !== actionIndex) : allHeaders;

      data = Array.from(table.querySelectorAll('tbody tr')).map(row => {
        let cells = Array.from(row.querySelectorAll('td'));
        if (actionIndex !== -1) {
            cells = cells.filter((_, idx) => idx !== actionIndex);
        }
        return cells.map(td => (td as HTMLElement).innerText.trim().replace(/₹/g, ''));
      });
    }

    const doc = new jsPDF({ orientation: orientation });
    const pageWidth = doc.internal.pageSize.getWidth();
    const centerX = pageWidth / 2;

    doc.setFillColor(30, 30, 30); doc.rect(0, 0, pageWidth, 45, 'F');
    doc.setTextColor(255, 255, 255); 
    doc.setFontSize(22); doc.setFont("helvetica", "bold"); doc.text("GLOBUS ENGINEERING TOOLS", centerX, 18, { align: "center" });
    doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.text("PRECISION INDUSTRIAL ENGINEERING & AUDIT LOGISTICS", centerX, 25, { align: "center" });
    doc.setDrawColor(255, 255, 255); doc.setLineWidth(0.5); doc.line(centerX - 70, 28, centerX + 70, 28);
    doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.text(`${title.toUpperCase()} AUDIT STATEMENT`, centerX, 37, { align: "center" });

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
    <div className="d-flex align-items-center gap-3">
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
            disabled={printLoading || pdfLoading}
            className="btn btn-outline-dark fw-bold d-flex align-items-center gap-2 px-3 border-dark-subtle shadow-sm hover-up btn-sm rounded-4" 
            style={{ height: '36px' }}
          >
            {printLoading ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-printer"></i>}
            Print Audit
          </button>
          <button 
            onClick={handleExportPDF} 
            disabled={printLoading || pdfLoading}
            className="btn btn-dark text-white fw-bold d-flex align-items-center gap-2 px-3 border-0 shadow-sm hover-up btn-sm rounded-4" 
            style={{ height: '36px' }}
          >
            {pdfLoading ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-file-earmark-pdf"></i>}
            Pdf
          </button>
       </div>
    </div>
  );
};

export default ReportActions;
