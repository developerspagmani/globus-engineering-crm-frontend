'use client';

import React from 'react';

interface LoaderProps {
  text?: string;
  className?: string;
}

const Loader: React.FC<LoaderProps> = ({ text = 'Loading data...', className = '' }) => {
  return (
    <div className={`d-flex flex-column align-items-center justify-content-center py-5 ${className}`}>
      <div className="premium-loader-container mb-4">
        <div className="loader-circle"></div>
        <div className="loader-core"></div>
      </div>
      
      <div className="text-center">
        <div className="loader-text fw-900 text-uppercase tracking-wider mb-1">
          {text}
        </div>
        <div className="loader-brand text-muted xx-small fw-bold">
          GLOBUS ENGINEERING
        </div>
      </div>

      <style jsx>{`
        .premium-loader-container {
          position: relative;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .loader-circle {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 3px solid #e2e8f0;
          border-top-color: var(--accent-color, #0d6efd);
          border-radius: 50%;
          animation: spin 1s cubic-bezier(0.55, 0.17, 0.45, 0.83) infinite;
        }

        .loader-core {
          width: 12px;
          height: 12px;
          background: var(--accent-color, #0d6efd);
          border-radius: 50%;
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.5; }
        }

        .loader-text {
          font-size: 13px;
          letter-spacing: 3px;
          color: #1e293b;
          animation: text-glow 2s ease-in-out infinite;
        }

        .loader-brand {
          font-size: 8px;
          letter-spacing: 5px;
          opacity: 0.5;
        }

        @keyframes text-glow {
          0%, 100% { opacity: 1; filter: blur(0px); }
          50% { opacity: 0.6; filter: blur(0.5px); }
        }

        .xx-small { font-size: 8px; }
      `}</style>
    </div>
  );
};

export default Loader;
