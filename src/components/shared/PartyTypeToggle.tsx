'use client';

import React from 'react';

interface PartyTypeToggleProps {
  partyType: 'customer' | 'vendor' | 'all';
  setPartyType: (type: 'customer' | 'vendor') => void;
}

const PartyTypeToggle: React.FC<PartyTypeToggleProps> = ({ partyType, setPartyType }) => {
  // If it's 'all' (initial load), default visually to 'customer' but ideally we shouldn't have 'all' anymore
  const activeMode = partyType === 'vendor' ? 'vendor' : 'customer';
  
  const color = '#f59e0b'; // Amber/Orange for both states
  const icon = activeMode === 'customer' ? 'bi-person-fill' : 'bi-building-fill';
  const label = activeMode === 'customer' ? 'CUSTOMER' : 'VENDOR';

  return (
    <div className="mode-indicator-inline">
      <div className={`mode-box mode-${activeMode}`}>
        <div className="mode-info">
          <i className={`bi ${icon} me-2`}></i>
          <span className="mode-text fw-bold">{label}</span>
        </div>

        {activeMode === 'customer' && (
          <button 
            type="button"
            className="mode-action highlight-vendor"
            onClick={() => setPartyType('vendor')}
          >
            <i className="bi bi-building-fill me-1"></i>
            <span>VENDOR</span>
          </button>
        )}

        {activeMode === 'vendor' && (
          <button 
            type="button"
            className="mode-action highlight-customer"
            onClick={() => setPartyType('customer')}
          >
            <i className="bi bi-person-fill me-1"></i>
            <span>CUSTOMER</span>
          </button>
        )}
      </div>

      <style jsx>{`
        .mode-indicator-inline {
          display: flex;
          align-items: center;
        }

        .mode-box {
          display: flex;
          align-items: stretch;
          background: #fff;
          border: 2px solid ${color};
          border-radius: 4px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          transition: border-color 0.3s ease;
          height: 36px;
        }

        .mode-info {
          display: flex;
          align-items: center;
          padding: 6px 14px;
          color: ${color};
          background: ${color}11;
          border-right: 1.5px solid ${color}33;
          transition: all 0.3s ease;
        }

        .mode-action {
          display: flex;
          align-items: center;
          padding: 6px 16px;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.7rem;
          font-weight: 900;
          color: #fff !important;
          text-transform: uppercase;
        }

        .highlight-customer {
           background-color: #f59e0b; /* Amber */
        }

        .highlight-vendor {
           background-color: #f59e0b; /* Amber */
        }

        .mode-action:hover {
          filter: brightness(1.1);
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

export default PartyTypeToggle;
