'use client';

import React from 'react';
import Link from 'next/link';

interface PageModeIndicatorProps {
  mode: 'view' | 'edit' | 'create';
  editUrl?: string;
  viewUrl?: string;
}

/**
 * A sticky indicator for the current page mode (View, Edit, Create).
 * Features a glassmorphic design and quick-toggle capabilities.
 */
const PageModeIndicator: React.FC<PageModeIndicatorProps> = ({ mode, editUrl, viewUrl }) => {
  const getIcon = () => {
    switch (mode) {
      case 'create': return 'bi-plus-circle-fill';
      case 'edit': return 'bi-pencil-square';
      case 'view': return 'bi-eye-fill';
      default: return 'bi-info-circle-fill';
    }
  };

  const getColor = () => {
    switch (mode) {
      case 'create': return '#3b82f6'; // Blue
      case 'edit': return '#f59e0b';   // Amber
      case 'view': return '#10b981';   // Emerald
      default: return '#6b7280';
    }
  };

  const color = getColor();

  return (
    <div className="mode-indicator-inline">
      <div className={`mode-box mode-${mode}`}>
        <div className="mode-info">
          <i className={`bi ${getIcon()} me-2`}></i>
          <span className="mode-text">{mode === 'create' ? 'NEW RECORD' : `${mode.toUpperCase()} MODE`}</span>
        </div>
        
        {mode === 'view' && editUrl && (
          <Link href={editUrl} className="mode-action highlight-edit">
            <i className="bi bi-pencil-fill me-1"></i>
            <span>SWITCH TO EDIT</span>
          </Link>
        )}
        
        {mode === 'edit' && viewUrl && (
          <Link href={viewUrl} className="mode-action highlight-view">
            <i className="bi bi-eye-fill me-1"></i>
            <span>SWITCH TO VIEW</span>
          </Link>
        )}
      </div>

      <style jsx>{`
        .mode-indicator-inline {
          display: flex;
          align-items: center;
        }

        .mode-box {
          display: flex;
          align-items: center;
          gap: 0;
          background: #fff;
          border: 2px solid ${color};
          border-radius: 4px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          transition: all 0.3s ease;
        }

        .mode-info {
          display: flex;
          align-items: center;
          padding: 6px 14px;
          color: ${color};
          background: ${color}11;
          border-right: 1.5px solid ${color}33;
        }

        .mode-action {
          display: flex;
          align-items: center;
          padding: 6px 16px;
          text-decoration: none !important;
          transition: all 0.2s ease;
          font-size: 0.7rem;
          font-weight: 900;
          color: #fff !important;
          text-transform: uppercase;
        }

        .highlight-edit {
           background-color: #f59e0b; /* Amber for Edit */
        }

        .highlight-view {
           background-color: #10b981; /* Emerald for View */
        }

        .mode-action:hover {
          filter: brightness(1.1);
          transform: scale(1.02);
        }

        @media (max-width: 768px) {
           .mode-text { display: none; }
           .mode-action span { display: none; }
           .mode-action { padding: 6px 10px; }
        }
      `}</style>
    </div>
  );
};

export default PageModeIndicator;
