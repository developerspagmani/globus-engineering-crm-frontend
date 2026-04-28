'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';

interface FullPageStatusProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  redirectUrl?: string;
  onClose?: () => void;
  buttonLabel?: string;
}

const FullPageStatus: React.FC<FullPageStatusProps> = ({
  type,
  title,
  message,
  redirectUrl,
  onClose,
  buttonLabel
}) => {
  const router = useRouter();

  const config = {
    success: {
      icon: 'bi-check2-circle',
      color: '#10b981', // Emerald
      bg: '#ecfdf5',
    },
    error: {
      icon: 'bi-x-circle',
      color: '#ef4444', // Red
      bg: '#fef2f2',
    },
    warning: {
      icon: 'bi-exclamation-circle',
      color: '#f59e0b', // Amber
      bg: '#fffbeb',
    },
    info: {
      icon: 'bi-info-circle',
      color: '#3b82f6', // Blue
      bg: '#eff6ff',
    }
  };

  const style = config[type];
  const label = buttonLabel || (type === 'success' ? 'OK' : 'CONTINUE');

  const handleAction = () => {
    if (onClose) {
      onClose();
    } else if (redirectUrl) {
      router.push(redirectUrl);
    }
  };

  const modalContent = (
    <div 
      className="d-flex align-items-center justify-content-center" 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.1)', 
        backdropFilter: 'blur(10px)',
        zIndex: 999999, 
      }}
    >
      <div 
        className="border-0 shadow-lg rounded-4 overflow-hidden animate-bounce-in" 
        style={{ 
          width: '100%',
          maxWidth: '420px', 
          backgroundColor: '#fff',
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
            onClick={handleAction}
          >
            {label.toUpperCase()}
          </button>
        </div>
      </div>
      <style jsx>{`
        .animate-bounce-in { animation: bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
        @keyframes bounceIn {
          0% { opacity: 0; transform: scale(0.3); }
          50% { opacity: 1; transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        .hover-lift:hover { transform: translateY(-2px); opacity: 0.9; }
      `}</style>
    </div>
  );

  if (typeof window === 'undefined') return modalContent;
  return createPortal(modalContent, document.body);
};

export default FullPageStatus;
