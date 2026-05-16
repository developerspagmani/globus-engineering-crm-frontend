'use client';

import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportActionsProps {
  setFromDate?: (date: string) => void;
  setToDate?: (date: string) => void;
  fromDate?: string;
  toDate?: string;
  title?: string;
  orientation?: 'portrait' | 'landscape';
  onFetchAll?: () => Promise<{ headers: string[], data: string[][] }>;
  variant?: 'default' | 'industrial';
}

const ReportActions: React.FC<ReportActionsProps> = ({ 
  setFromDate, 
  setToDate, 
  fromDate,
  toDate,
  title = "Report", 
  orientation = 'portrait', 
  onFetchAll,
  variant = 'default'
}) => {
  const [activePreset, setActivePreset] = React.useState<string | null>(null);
  const [printLoading, setPrintLoading] = React.useState(false);
  const [pdfLoading, setPdfLoading] = React.useState(false);

  React.useEffect(() => {
    if (!fromDate && !toDate) {
      setActivePreset(null);
    }
  }, [fromDate, toDate]);

  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const handlePresetClick = (type: 'week' | 'month' | 'thisMonth' | 'year') => {
    if (activePreset === type) {
      setActivePreset(null);
      setFromDate?.("");
      setToDate?.("");
      return;
    }
    setActivePreset(type);
    const today = new Date();
    let from = new Date();
    let to = new Date(); // Use a fresh copy of today

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

    setFromDate?.(formatDate(from));
    setToDate?.(formatDate(to));
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

    const isIndustrial = variant === 'industrial';

    printWindow.document.write(`<html><head><title>${title} - Audit Report</title>`);
    printWindow.document.write('<style>');
    printWindow.document.write(`@page { size: ${orientation}; margin: 10mm; }`);
    
    if (isIndustrial) {
      printWindow.document.write(`
        body { font-family: 'Times New Roman', Times, serif; padding: 20px; color: black; }
        .audit-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
        .co-name { font-size: 18pt; font-weight: bold; }
        .co-addr { font-size: 10pt; margin-bottom: 5px; }
        .report-title { font-size: 14pt; font-weight: bold; text-decoration: underline; margin-top: 10px; }
        .date-range { font-size: 10pt; margin-top: 5px; font-style: italic; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 10pt; }
        th, td { border: 1px solid #000; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; text-transform: uppercase; font-size: 9pt; }
        .text-end { text-align: right; }
        .fw-bold { font-weight: bold; }
      `);
    } else {
      printWindow.document.write('body { font-family: sans-serif; padding: 20px; }');
      printWindow.document.write('table {width:100%; border-collapse: collapse; font-size: 10px;}');
      printWindow.document.write('th, td {border: 1px solid #ddd; padding: 6px; text-align: left; text-transform: uppercase;}');
      printWindow.document.write('th {background-color: #f2f2f2; color: #333; font-weight: bold;}');
      printWindow.document.write('h2 { color: #ea580c; margin-bottom: 10px; text-align: center; font-size: 18px; }');
      printWindow.document.write('p { text-align: center; font-size: 10px; color: #666; }');
    }
    
    printWindow.document.write('</style>');
    printWindow.document.write('</head><body>');
    
    if (isIndustrial) {
      printWindow.document.write(`
        <div style="border: 1.5pt solid #000; display: flex; align-items: center; justify-content: space-between; padding: 10px 15px;">
           <div style="width: 75px; height: 75px; display: flex; align-items: center; justify-content: center;">
              <svg viewBox="0 0 100 100" style="width: 100%; height: 100%;">
                <path d="M25 5 L75 5 L95 25 L95 75 L75 95 L25 95 L5 75 L5 25 Z" fill="none" stroke="#000" stroke-width="2" />
                <circle cx="50" cy="50" r="28" fill="none" stroke="#000" stroke-width="2" />
                <text x="50" y="62" font-size="32" font-weight="900" text-anchor="middle" fill="#000" font-family="Arial, sans-serif">S</text>
              </svg>
           </div>
           <div style="text-align: center; flex: 1; padding: 0 20px;">
              <h1 style="margin: 0; font-size: 24pt; font-weight: 900; letter-spacing: 0.8pt;">GLOBUS ENGINEERING TOOLS</h1>
              <div style="font-size: 10pt; font-weight: bold; margin-top: 4px;">
                No 24,Annaiyappan Street,S.S.Nagar, Nallampalayam,Ganapathy Post, Coimbatore-641006.
              </div>
           </div>
           <div style="width: 75px; display: flex; justify-content: flex-end; align-items: center;">
              <div style="width: 60px; border: 1.5pt solid #000; text-align: center;">
                 <div style="font-size: 8pt; font-weight: 900; border-bottom: 1pt solid #000; background: #f0f0f0; padding: 1px 0;">Q</div>
                 <div style="padding: 2px 0;">
                    <div style="font-size: 14pt; font-weight: 900; line-height: 1;">TÜV</div>
                    <div style="font-size: 9pt; font-weight: 900;">SÜD</div>
                 </div>
                 <div style="font-size: 7pt; font-weight: 900; border-top: 1pt solid #000; padding: 1px 0;">ISO 9001</div>
              </div>
           </div>
        </div>
        <div style="text-align: center; font-size: 12pt; font-weight: 900; padding: 6px 0; border: 1.5pt solid #000; border-top: 0; background-color: #f2f2f2; letter-spacing: 1.5px; text-transform: uppercase;">
           ${title.toUpperCase()}
        </div>
        <div style="text-align: center; font-size: 10pt; font-style: italic; border: 1.5pt solid #000; border-top: 0; padding: 4px 0; margin-bottom: 20px;">
           Period: ${fromDate || 'Start'} to ${toDate || 'Today'}
        </div>
      `);
    } else {
      printWindow.document.write('<div>');
      printWindow.document.write(`<h2>Globus Engineering - ${title || 'Official Audit Statement'}</h2>`);
      printWindow.document.write('<p>Generated on ' + new Date().toLocaleString() + '</p>');
      printWindow.document.write('</div>');
    }
    
    let tableHtml = '<table><thead><tr>';
    headers.forEach(h => { tableHtml += `<th>${h}</th>`; });
    tableHtml += '</tr></thead><tbody>';
    data.forEach(row => {
      const isTotalRow = row.some(cell => cell.toString().includes('TOTAL'));
      const rowStyle = isTotalRow ? (isIndustrial ? 'font-weight: bold; background-color: #eee;' : 'font-weight: bold; background-color: #f8f9fa;') : '';
      tableHtml += `<tr style="${rowStyle}">`;
      row.forEach((cell, idx) => { 
        // Right align numeric columns (usually from 2 onwards in these reports)
        const isNumeric = idx >= 2 && !isNaN(Number(cell.toString().replace(/,/g, '')));
        tableHtml += `<td class="${isNumeric ? 'text-end' : ''}">${cell}</td>`; 
      });
      tableHtml += '</tr>';
    });

    tableHtml += '</tbody></table>';

    if (isIndustrial) {
      printWindow.document.write('<div style="margin-top: 30px; font-size: 9pt; color: #666; text-align: right;">');
      printWindow.document.write('This is a computer generated audit report.');
      printWindow.document.write('</div>');
    }

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
    const isIndustrial = variant === 'industrial';

    if (isIndustrial) {
      // Industrial Header (Mimicking the Invoice Layout)
      doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.5);
      doc.rect(14, 10, pageWidth - 28, 25); // Header Box
      
      // Logo Placeholder (Left)
      doc.rect(18, 12, 20, 20);
      doc.setFontSize(18); doc.setFont("helvetica", "bold"); doc.text("S", 28, 26, { align: "center" });
      
      // Company Info (Center)
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(20); doc.setFont("helvetica", "bold"); doc.text("GLOBUS ENGINEERING TOOLS", centerX, 18, { align: "center" });
      doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.text("No 24,Annaiyappan Street,S.S.Nagar, Nallampalayam,Ganapathy Post, Coimbatore-641006.", centerX, 23, { align: "center" });
      
      // ISO Box (Right)
      const isoX = pageWidth - 42;
      doc.rect(isoX, 12, 24, 20);
      doc.setFontSize(6); doc.text("ISO 9001", isoX + 12, 16, { align: "center" });
      doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.text("TÜV", isoX + 12, 24, { align: "center" });
      doc.setFontSize(7); doc.text("SÜD", isoX + 12, 29, { align: "center" });

      // Title Bar
      doc.setFillColor(240, 240, 240); doc.rect(14, 35, pageWidth - 28, 10, 'F');
      doc.rect(14, 35, pageWidth - 28, 10);
      doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.text(title.toUpperCase(), centerX, 41, { align: "center" });
      
      // Period Bar
      doc.rect(14, 45, pageWidth - 28, 8);
      doc.setFontSize(9); doc.setFont("helvetica", "italic"); doc.text(`Period: ${fromDate || 'Start'} to ${toDate || 'Today'}`, centerX, 50, { align: "center" });
    } else {
      // Default Modern Header
      doc.setFillColor(30, 30, 30); doc.rect(0, 0, pageWidth, 45, 'F');
      doc.setTextColor(255, 255, 255); 
      doc.setFontSize(22); doc.setFont("helvetica", "bold"); doc.text("GLOBUS ENGINEERING TOOLS", centerX, 18, { align: "center" });
      doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.text("No 24,Annaiyappan Street,S.S.Nagar, Nallampalayam,Ganapathy Post, Coimbatore-641006.", centerX, 25, { align: "center" });
      doc.setDrawColor(255, 255, 255); doc.setLineWidth(0.5); doc.line(centerX - 70, 28, centerX + 70, 28);
      doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.text(`${title.toUpperCase()} AUDIT STATEMENT`, centerX, 37, { align: "center" });
    }

    autoTable(doc, {
      head: [headers],
      body: data,
      startY: isIndustrial ? 60 : 55,
      theme: isIndustrial ? 'grid' : 'grid',
      headStyles: { 
        fillColor: isIndustrial ? [240, 240, 240] : [60, 60, 60], 
        textColor: isIndustrial ? [0, 0, 0] : [255, 255, 255], 
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
        lineColor: isIndustrial ? [0, 0, 0] : [200, 200, 200]
      },
      alternateRowStyles: { fillColor: isIndustrial ? [255, 255, 255] : [248, 248, 248] },
      margin: { left: 14, right: 14 },
      didParseCell: (dataArg) => {
        const isTotalRow = (dataArg.row.raw as any).some((cell: any) => cell?.toString().includes('TOTAL'));
        if (isTotalRow) {
          dataArg.cell.styles.fontStyle = 'bold';
          dataArg.cell.styles.fillColor = isIndustrial ? [230, 230, 230] : [245, 245, 245];
        }
        // Right align numeric cells
        if (dataArg.column.index >= 2 && !isNaN(Number(dataArg.cell.text[0]?.replace(/,/g, '')))) {
          dataArg.cell.styles.halign = 'right';
        }
      },
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
