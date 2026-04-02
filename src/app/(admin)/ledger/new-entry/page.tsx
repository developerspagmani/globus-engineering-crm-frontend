'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import ModuleGuard from '@/components/ModuleGuard';
import LedgerEntryForm from '@/modules/ledger/components/LedgerEntryForm';

export default function NewLedgerEntryPage() {
  const router = useRouter();

  return (
    <ModuleGuard moduleId="mod_ledger">
      <div className="container-fluid py-4 min-vh-100 animate-fade-in px-4" style={{ backgroundColor: '#f8f9fa' }}>
        {/* Header Section - Floating Style (Matched to Customer page) */}
        <div className="d-flex align-items-center gap-3 mb-5 pt-4">
          <button 
             onClick={() => router.push('/ledger')} 
             className="btn btn-link text-dark p-0 shadow-none hover-scale"
          >
             <i className="bi bi-arrow-left-circle" style={{ fontSize: '1.8rem' }}></i>
          </button>
          <div className="pt-1">
             <h2 className="fw-bold mb-0 fs-2 text-dark tracking-tight">Add New Ledger Entry</h2>
             <p className="text-muted small mb-0">Record manual adjustments or opening balances for clients.</p>
          </div>
        </div>

        <div className="row">
            <div className="col-12">
                <LedgerEntryForm />
            </div>
        </div>
      </div>

      <style jsx>{`
        .tracking-wider { letter-spacing: 0.1em; }
      `}</style>
    </ModuleGuard>
  );
}
