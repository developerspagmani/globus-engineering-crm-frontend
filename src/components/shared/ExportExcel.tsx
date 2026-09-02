'use client';

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import StatusModal from '@/components/StatusModal';

interface ExportExcelProps {
  data: any[];
  fileName: string;
  headers?: Record<string, string>;
  sheetName?: string;
  className?: string;
  buttonText?: string;
  variant?: 'primary' | 'success' | 'outline-success' | 'light';
  fetchData?: () => Promise<any[]>;
}

const ExportExcel: React.FC<ExportExcelProps> = ({
  data,
  fileName,
  headers,
  sheetName = 'Sheet1',
  className = '',
  buttonText = 'Export to Excel',
  variant = 'outline-success',
  fetchData
}) => {
  const [modal, setModal] = React.useState({ isOpen: false, title: '', message: '' });
  const [loading, setLoading] = React.useState(false);

  const exportToExcel = async () => {
    let exportData = data;
    
    if (fetchData) {
      try {
        setLoading(true);
        exportData = await fetchData();
      } catch (error) {
        console.error("Failed to fetch data for export:", error);
        setModal({
          isOpen: true,
          title: 'Export Failed',
          message: 'Failed to fetch the full list of records for export. Please try again.'
        });
        setLoading(false);
        return;
      } finally {
        setLoading(false);
      }
    }

    if (!exportData || exportData.length === 0) {
      setModal({
        isOpen: true,
        title: 'Empty Dataset',
        message: 'There is no data matching your current filters to export. Please adjust your criteria and try again.'
      });
      return;
    }

    // Transform data if headers mapping is provided
    let processedData = exportData;
    if (headers) {
      processedData = exportData.map((item) => {
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
    <>
      <button
        onClick={exportToExcel}
        disabled={loading}
        className={`btn btn-${variant} btn-page-action ${className}`}
        style={{ border: variant.includes('success') ? '1.5px solid #198754' : undefined }}
      >
        {loading ? (
          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        ) : (
          <i className="bi bi-file-earmark-excel-fill"></i>
        )}
        <span>{loading ? 'Exporting...' : buttonText}</span>
      </button>

      <StatusModal 
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        type="info"
        title={modal.title}
        message={modal.message}
      />
    </>
  );
};

export default ExportExcel;
