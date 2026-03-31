'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'danger' | 'warning' | 'primary';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone. Do you want to proceed?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  type = 'danger'
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const typeConfig = {
    danger: { color: '#ef4444', icon: 'bi-exclamation-triangle-fill', btnClass: 'btn-danger' },
    warning: { color: '#f59e0b', icon: 'bi-exclamation-circle-fill', btnClass: 'btn-warning' },
    primary: { color: '#3b82f6', icon: 'bi-info-circle-fill', btnClass: 'btn-primary' }
  };
  const config = typeConfig[type];

  const modalContent = (
    <div 
      className="confirmation-modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div 
        className="confirmation-modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          width: '90%',
          maxWidth: '450px',
          backgroundColor: '#fff',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          animation: 'slideUp 0.3s ease-out'
        }}
      >
        <div style={{ padding: '30px', textAlign: 'center' }}>
          <div 
            style={{
              width: '70px',
              height: '70px',
              backgroundColor: `${config.color}15`,
              color: config.color,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '2rem'
            }}
          >
            <i className={`bi ${config.icon}`}></i>
          </div>
          <h4 style={{ fontWeight: 800, color: '#1a1a1a', marginBottom: '10px' }}>{title}</h4>
          <p style={{ color: '#666', fontSize: '1rem', lineHeight: '1.5', margin: 0 }}>{message}</p>
        </div>
        
        <div style={{ padding: '0 30px 30px', display: 'flex', gap: '12px' }}>
          <button 
            style={{
              flex: 1,
              padding: '12px',
              border: '1px solid #ddd',
              backgroundColor: '#fff',
              color: '#666',
              borderRadius: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            onClick={onClose}
          >
            {cancelLabel}
          </button>
          <button 
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              backgroundColor: config.color,
              color: '#fff',
              borderRadius: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: `0 4px 12px ${config.color}40`
            }}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ConfirmationModal;
