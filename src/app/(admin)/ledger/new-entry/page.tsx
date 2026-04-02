'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import ModuleGuard from '@/components/ModuleGuard';
import LedgerEntryForm from '@/modules/ledger/components/LedgerEntryForm';

export default function NewLedgerEntryPage() {
  const router = useRouter();

  return (
    <ModuleGuard moduleId="mod_ledger">
      <div className="container-fluid py-4 min-vh-100 bg-white">
        <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom border-light">
          <div>
            <button onClick={() => router.back()} className="btn btn-sm text-muted p-0 mb-2">
              <i className="bi bi-arrow-left me-2"></i>Back to Ledger list
            </button>
            <h2 className="fw-bold mb-1">Add New Ledger Entry</h2>
            <p className="text-muted small mb-0 tracking-wider">Record manual financial adjustments and opening balances</p>
          </div>
        </div>

        <div className="row justify-content-center">
            <div className="col-lg-10">
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
