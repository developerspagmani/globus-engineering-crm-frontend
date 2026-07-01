'use client';

import React from 'react';

interface PartyTypeToggleProps {
  partyType: 'customer' | 'vendor' | 'all';
  setPartyType: (type: 'customer' | 'vendor') => void;
}

const PartyTypeToggle: React.FC<PartyTypeToggleProps> = ({ partyType, setPartyType }) => {
  const activeMode = partyType === 'vendor' ? 'vendor' : 'customer';
  const color = '#f59e0b'; // Amber/Orange

  return (
    <div className="party-type-toggle">
      <button
        type="button"
        className={`toggle-btn ${activeMode === 'customer' ? 'active' : ''}`}
        onClick={() => setPartyType('customer')}
      >
        <i className="bi bi-person-fill me-2"></i>
        <span>CUSTOMER</span>
      </button>
      <button
        type="button"
        className={`toggle-btn ${activeMode === 'vendor' ? 'active' : ''}`}
        onClick={() => setPartyType('vendor')}
      >
        <i className="bi bi-building-fill me-2"></i>
        <span>VENDOR</span>
      </button>

      <style jsx>{`
        .party-type-toggle {
          display: flex;
          background: #fff;
          border: 2px solid ${color};
          border-radius: 6px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          height: 38px;
        }

        .toggle-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px 16px;
          border: none;
          background: transparent;
          color: ${color};
          cursor: pointer;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          transition: all 0.25s ease;
          flex: 1;
        }

        .toggle-btn.active {
          background-color: ${color};
          color: #fff !important;
        }

        .toggle-btn:not(.active):hover {
          background-color: ${color}15;
        }

        @media (max-width: 768px) {
           .toggle-btn span { display: none; }
        }
      `}</style>
    </div>
  );
};

export default PartyTypeToggle;
