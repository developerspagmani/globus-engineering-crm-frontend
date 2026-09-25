'use client';

import React, { useState } from 'react';

export type InvoiceLayoutFormat = 'classic' | 'modern';

interface InvoiceLayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (layout: InvoiceLayoutFormat, copies?: string) => void;
  actionType: 'print' | 'export';
  invoiceNumber?: string;
  defaultCopies?: string;
}

export const InvoiceLayoutModal: React.FC<InvoiceLayoutModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  actionType,
  invoiceNumber,
  defaultCopies = 'ORIGINAL,DUPLICATE,TRIPLICATE'
}) => {
  const [selectedLayout, setSelectedLayout] = useState<InvoiceLayoutFormat>('modern');
  const [selectedCopies, setSelectedCopies] = useState<string>(defaultCopies);

  if (!isOpen) return null;

  const handleAction = () => {
    onConfirm(selectedLayout, selectedCopies);
  };

  return (
    <div className="modal-backdrop-custom animate-fade-in">
      <div className="modal-card-custom shadow-lg">
        {/* Header */}
        <div className="modal-header-custom border-bottom pb-3 mb-3 d-flex justify-content-between align-items-center">
          <div>
            <h5 className="modal-title fw-bold mb-1 d-flex align-items-center gap-2">
              <i className={`bi ${actionType === 'print' ? 'bi-printer text-primary' : 'bi-file-earmark-pdf text-danger'}`}></i>
              Choose Invoice Layout Format
            </h5>
            <p className="text-muted small mb-0">
              Select your desired template layout for {invoiceNumber ? `Invoice #${invoiceNumber}` : 'this invoice'}
            </p>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={onClose}
            aria-label="Close"
          ></button>
        </div>

        {/* Body - Layout Picker */}
        <div className="modal-body-custom py-2">
          <div className="layout-options-grid mb-3">
            {/* Format 2: Modern Nexus Layout (Recommended) */}
            <div
              className={`layout-option-card ${selectedLayout === 'modern' ? 'active-layout' : ''}`}
              onClick={() => setSelectedLayout('modern')}
            >
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="d-flex align-items-center gap-2">
                  <div className="icon-wrapper modern-icon">
                    <i className="bi bi-file-earmark-spreadsheet-fill fs-5"></i>
                  </div>
                  <div>
                    <div className="fw-bold text-dark">Format 2: Modern Tax Invoice</div>
                    <div className="text-muted x-small">Nexus Clean Layout</div>
                  </div>
                </div>
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2 py-1 small fw-semibold">
                  New Format
                </span>
              </div>
              <ul className="layout-features-list small text-muted mb-0 ps-3">
                <li>Dark-charcoal header items table with vertical grid lines</li>
                <li>Side-by-side Bill To &amp; Ship To columns</li>
                <li>Bank Details block, Tax in Words, and highlight Grand Total</li>
              </ul>
              <div className="selection-radio mt-2 d-flex align-items-center gap-2">
                <input
                  type="radio"
                  name="layoutChoice"
                  checked={selectedLayout === 'modern'}
                  onChange={() => setSelectedLayout('modern')}
                />
                <span className="small fw-semibold text-dark">Select Modern Format</span>
              </div>
            </div>

            {/* Format 1: Classic Industrial Format */}
            <div
              className={`layout-option-card ${selectedLayout === 'classic' ? 'active-layout' : ''}`}
              onClick={() => setSelectedLayout('classic')}
            >
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="d-flex align-items-center gap-2">
                  <div className="icon-wrapper classic-icon">
                    <i className="bi bi-layout-text-window fs-5"></i>
                  </div>
                  <div>
                    <div className="fw-bold text-dark">Format 1: Classic Industrial</div>
                    <div className="text-muted x-small">Globus Standard Layout</div>
                  </div>
                </div>
                <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle rounded-pill px-2 py-1 small fw-semibold">
                  Classic
                </span>
              </div>
              <ul className="layout-features-list small text-muted mb-0 ps-3">
                <li>Outer bordered box with company letterhead banner</li>
                <li>Detailed metadata rows, VAT/CST/PAN registrations</li>
                <li>Compact industrial grid and receiver/authorized signatures</li>
              </ul>
              <div className="selection-radio mt-2 d-flex align-items-center gap-2">
                <input
                  type="radio"
                  name="layoutChoice"
                  checked={selectedLayout === 'classic'}
                  onChange={() => setSelectedLayout('classic')}
                />
                <span className="small fw-semibold text-dark">Select Classic Format</span>
              </div>
            </div>
          </div>

          {/* Copies Selector (Only when action is print) */}
          {actionType === 'print' && (
            <div className="copies-section bg-light p-3 rounded-3 border mb-3">
              <label className="form-label fw-bold small text-muted mb-2">
                <i className="bi bi-copy me-1"></i> Print Copies:
              </label>
              <div className="d-flex flex-wrap gap-2">
                {[
                  { label: 'All Copies (3)', val: 'ORIGINAL,DUPLICATE,TRIPLICATE' },
                  { label: 'Original Only', val: 'ORIGINAL' },
                  { label: 'Duplicate Only', val: 'DUPLICATE' },
                  { label: 'Triplicate Only', val: 'TRIPLICATE' }
                ].map((c) => (
                  <button
                    key={c.val}
                    type="button"
                    className={`btn btn-sm rounded-pill px-3 py-1 fw-semibold transition-all ${
                      selectedCopies === c.val
                        ? 'btn-dark shadow-sm'
                        : 'btn-outline-secondary bg-white'
                    }`}
                    onClick={() => setSelectedCopies(c.val)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="modal-footer-custom pt-3 border-top d-flex justify-content-end gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary px-4 rounded-pill fw-semibold"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`btn px-4 rounded-pill fw-bold d-flex align-items-center gap-2 shadow-sm ${
              actionType === 'print' ? 'btn-primary' : 'btn-danger'
            }`}
            onClick={handleAction}
          >
            <i className={`bi ${actionType === 'print' ? 'bi-printer-fill' : 'bi-download'}`}></i>
            {actionType === 'print' ? 'Proceed to Print' : 'Download PDF'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .modal-backdrop-custom {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          padding: 20px;
        }

        .modal-card-custom {
          background: #ffffff;
          border-radius: 16px;
          width: 100%;
          max-width: 580px;
          padding: 24px;
          animation: scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes scaleUp {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .layout-options-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .layout-option-card {
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 14px 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: #ffffff;
        }

        .layout-option-card:hover {
          border-color: #94a3b8;
          transform: translateY(-1px);
        }

        .layout-option-card.active-layout {
          border-color: #2563eb;
          background: #eff6ff;
        }

        .icon-wrapper {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modern-icon {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .classic-icon {
          background: #f1f5f9;
          color: #475569;
        }

        .layout-features-list {
          line-height: 1.5;
        }

        .layout-features-list li {
          margin-bottom: 2px;
        }

        .x-small {
          font-size: 11px;
        }
      `}</style>
    </div>
  );
};

export default InvoiceLayoutModal;
