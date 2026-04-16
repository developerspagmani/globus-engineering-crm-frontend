'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import ModuleGuard from '@/components/ModuleGuard';
import LedgerEntryForm from '@/modules/ledger/components/LedgerEntryForm';
import Link from 'next/link';

export default function NewLedgerEntryPage() {
  const router = useRouter();

  return (
    <ModuleGuard moduleId="mod_ledger">
      <div className="container-fluid py-4 min-vh-100 animate-fade-in px-4" style={{ backgroundColor: '#f8f9fa' }}>
        {/* Header Section - Standardized Style */}
        <div className="d-flex align-items-center mb-5 pb-2 border-bottom">
          <Link href="/ledger" className="back-btn-standard" title="Back to Ledger">
            <i className="bi bi-arrow-left fs-4"></i>
          </Link>
          <div className="pt-1">
            <h2 className="fw-bold mb-0 text-dark">Add Ledger Entry</h2>
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
