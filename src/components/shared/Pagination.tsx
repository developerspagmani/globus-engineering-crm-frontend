'use client';

import React, { useState } from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisiblePages?: number;
}

const Pagination: React.FC<PaginationProps> = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  maxVisiblePages = 5 
}) => {
  const [showJumpModal, setShowJumpModal] = useState(false);
  const [jumpInput, setJumpInput] = useState('');

  if (totalPages <= 1) return null;

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(jumpInput);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
      setShowJumpModal(false);
      setJumpInput('');
    }
  };

  const renderPageNumbers = () => {
    const pages = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);

    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // First page
    if (startPage > 1) {
      pages.push(
        <li key={1} className="page-item">
          <button className="page-link" onClick={() => onPageChange(1)}>1</button>
        </li>
      );
      if (startPage > 2) {
        pages.push(
          <li key="ellipsis-1" className="page-item disabled">
            <span className="page-link">...</span>
          </li>
        );
      }
    }

    // Visible pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <li key={i} className={`page-item ${currentPage === i ? 'active' : ''}`}>
          <button className="page-link" onClick={() => onPageChange(i)}>
            {i}
          </button>
        </li>
      );
    }

    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <li key="ellipsis-2" className="page-item disabled">
            <span className="page-link">...</span>
          </li>
        );
      }
      pages.push(
        <li key={totalPages} className="page-item">
          <button className="page-link" onClick={() => onPageChange(totalPages)}>
            {totalPages}
          </button>
        </li>
      );
    }

    return pages;
  };

  return (
    <div className="d-flex align-items-center gap-2">
      <nav aria-label="Page navigation">
        <ul className="pagination pagination-sm mb-0">
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <button 
              className="page-link" 
              onClick={() => onPageChange(currentPage - 1)}
              aria-label="Previous"
            >
              <i className="bi bi-chevron-left"></i>
            </button>
          </li>
          
          {renderPageNumbers()}

          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
            <button 
              className="page-link" 
              onClick={() => onPageChange(currentPage + 1)}
              aria-label="Next"
            >
              <i className="bi bi-chevron-right"></i>
            </button>
          </li>
        </ul>
      </nav>

      {/* Jump to Page Trigger */}
      <div className="position-relative">
        <button 
          className="btn btn-sm btn-outline-secondary border-0 shadow-none p-1 d-flex align-items-center justify-content-center" 
          onClick={() => setShowJumpModal(!showJumpModal)}
          title="Jump to Page"
          style={{ width: '28px', height: '28px', borderRadius: '4px' }}
        >
          <i className="bi bi-grid-3x3-gap-fill text-primary" style={{ fontSize: '1rem' }}></i>
        </button>

        {showJumpModal && (
          <>
            <div 
              className="position-fixed top-0 start-0 w-100 h-100" 
              style={{ zIndex: 1050 }} 
              onClick={() => setShowJumpModal(false)}
            ></div>
            <div 
              className="position-absolute bottom-100 end-0 mb-2 bg-white shadow-lg border rounded-3 p-3 animate-slide-up" 
              style={{ zIndex: 1051, width: '220px' }}
            >
              <form onSubmit={handleJump}>
                <label className="small fw-bold text-dark mb-2 d-block">Go to Page (1 - {totalPages})</label>
                <div className="input-group input-group-sm">
                  <input 
                    type="number" 
                    className="form-control border-end-0" 
                    placeholder="Page #" 
                    value={jumpInput}
                    onChange={(e) => setJumpInput(e.target.value)}
                    autoFocus
                  />
                  <button className="btn btn-primary border-0" type="submit">GO</button>
                </div>
                <div className="mt-3 d-flex flex-wrap gap-1 overflow-auto" style={{ maxHeight: '150px' }}>
                   {[...Array(totalPages)].map((_, i) => (
                     <button 
                       key={i+1} 
                       type="button"
                       className={`btn btn-sm p-0 d-flex align-items-center justify-content-center ${currentPage === i + 1 ? 'btn-primary' : 'btn-light text-muted'}`}
                       style={{ width: '24px', height: '24px', fontSize: '10px' }}
                       onClick={() => { onPageChange(i + 1); setShowJumpModal(false); }}
                     >
                       {i + 1}
                     </button>
                   ))}
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Pagination;
