'use client';

import React from 'react';
import * as XLSX from 'xlsx';

interface ExportExcelProps {
  data: any[];
  fileName: string;
  headers?: Record<string, string>;
  sheetName?: string;
  className?: string;
  buttonText?: string;
  variant?: 'primary' | 'success' | 'outline-success' | 'light';
}

const ExportExcel: React.FC<ExportExcelProps> = ({
  data,
  fileName,
  headers,
  sheetName = 'Sheet1',
  className = '',
  buttonText = 'Export to Excel',
  variant = 'outline-success'
}) => {
  const exportToExcel = () => {
    if (!data || data.length === 0) {
      alert('No data available to export');
      return;
    }

    // Transform data if headers mapping is provided
    let processedData = data;
    if (headers) {
      processedData = data.map((item) => {
        const newItem: any = {};
        Object.keys(headers).forEach((key) => {
          // Handle nested objects if needed (e.g., 'customer.name')
          const value = key.split('.').reduce((obj, k) => obj?.[k], item);
          newItem[headers[key]] = value !== undefined ? value : '';
        });
        return newItem;
      });
    }

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(processedData);
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Generate buffer and download
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${fileName}_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={exportToExcel}
      className={`btn btn-${variant} d-flex align-items-center gap-2 rounded-pill px-3 fw-semibold shadow-sm transition-all ${className}`}
      style={{ border: variant.includes('success') ? '1.5px solid #198754' : '' }}
    >
      <i className="bi bi-file-earmark-excel-fill"></i>
      <span>{buttonText}</span>
      <style jsx>{`
        button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1) !important;
        }
        button:active {
          transform: translateY(0);
        }
      `}</style>
    </button>
  );
};

export default ExportExcel;
