'use client';

import React from 'react';
import { Company } from '@/types/modules';
import LedgerPrintTemplate from './LedgerPrintTemplate';
import { mockLedgerEntries, mockParty } from '@/data/mockLedger';

interface LedgerSettingsPreviewProps {
  company: Company | null;
}

const LedgerSettingsPreview: React.FC<LedgerSettingsPreviewProps> = ({
  company
}) => {
  return (
    <div className="ledger-settings-preview">
      <LedgerPrintTemplate
        party={mockParty}
        entries={mockLedgerEntries}
        company={company}
        dateFrom="2026-04-01"
        dateTo="2026-04-30"
      />
      
      <style jsx>{`
        .ledger-settings-preview {
          transform: scale(0.85);
          transform-origin: top center;
          width: 100%;
          padding: 20px;
          background: #f8f9fa;
          min-height: 600px;
          overflow: auto;
        }
        
        @media (max-width: 1600px) {
          .ledger-settings-preview { 
            transform: scale(0.75); 
          }
        }
        
        @media print {
          .ledger-settings-preview {
            transform: none;
            padding: 0;
            background: white;
          }
        }
      `}</style>
    </div>
  );
};

export default LedgerSettingsPreview;
