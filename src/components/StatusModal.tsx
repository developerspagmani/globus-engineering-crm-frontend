'use client';

import React from 'react';

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm?: () => void;
}

const StatusModal: React.FC<StatusModalProps> = ({
  isOpen,
  onClose,
  type,
  title,
  message,
  confirmLabel = 'Success',
  onConfirm
}) => {
  if (!isOpen) return null;

  const config = {
    success: {
      icon: 'bi-check2-circle',
      color: '#10b981', // Emerald
      bg: '#ecfdf5',
      shadow: 'rgba(16, 185, 129, 0.2)'
    },
    error: {
      icon: 'bi-x-circle',
      color: '#ef4444', // Red
      bg: '#fef2f2',
      shadow: 'rgba(239, 68, 68, 0.2)'
    },
    warning: {
      icon: 'bi-exclamation-circle',
      color: '#f59e0b', // Amber
      bg: '#fffbeb',
      shadow: 'rgba(245, 158, 11, 0.2)'
    },
    info: {
      icon: 'bi-info-circle',
      color: '#3b82f6', // Blue
      bg: '#eff6ff',
      shadow: 'rgba(59, 130, 246, 0.2)'
    }
  };

  const style = config[type];

  return (
    <div 
      className="show d-flex align-items-center justify-content-center px-3" 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)', 
        zIndex: 99999, 
        backdropFilter: 'blur(6px)',
        height: '100vh',
        width: '100vw'
      }}
    >
      <div 
        className="modal-content border-0 shadow-lg rounded-4 overflow-hidden animate-fade-in" 
        style={{ 
          width: '420px', 
          backgroundColor: '#fff',
          zIndex: 100000,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
      >
        {/* Top Status Border */}
        <div style={{ height: '6px', backgroundColor: style.color }}></div>
        
        <div className="p-4 text-center">
          {/* Icon Circle */}
          <div 
            className="d-inline-flex align-items-center justify-content-center rounded-circle mb-4" 
            style={{ width: '80px', height: '80px', backgroundColor: style.bg, color: style.color }}
          >
            <i className={`bi ${style.icon}`} style={{ fontSize: '2.5rem' }}></i>
          </div>
          
          <h4 className="fw-900 text-dark mb-2 tracking-tight">{title}</h4>
          <p className="text-muted small px-3 mb-5 fw-medium" style={{ lineHeight: '1.6' }}>{message}</p>
          
          <button 
            type="button" 
            className="btn w-100 py-3 rounded-3 fw-800 text-white border-0 shadow-sm transition-all hover-lift"
            style={{ backgroundColor: style.color }}
            onClick={() => {
              if (onConfirm) onConfirm();
              onClose();
            }}
          >
            {confirmLabel.toUpperCase()}
          </button>
        </div>
      </div>
      <style jsx>{`
        .animate-fade-in { animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .hover-lift:hover { transform: translateY(-2px); opacity: 0.9; }
      `}</style>
    </div>
  );
};

export default StatusModal;
