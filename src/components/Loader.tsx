'use client';

import React from 'react';

interface LoaderProps {
  text?: string;
  className?: string;
}

const Loader: React.FC<LoaderProps> = ({ text = 'Loading data...', className = '' }) => {
  return (
    <div className={`d-flex flex-column align-items-center justify-content-center py-5 ${className}`}>
      <div className="loader-container mb-3">
        <div className="spinner-orbit">
          <div className="orbit-inner ring-1"></div>
          <div className="orbit-inner ring-2"></div>
          <div className="orbit-inner ring-3"></div>
        </div>
      </div>
      <span className="text-muted small fw-bold text-uppercase tracking-wider animate-pulse">
        {text}
      </span>

      <style jsx>{`
        .spinner-orbit {
          position: relative;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .orbit-inner {
          position: absolute;
          border-radius: 50%;
          border: 3px solid transparent;
        }

        .ring-1 {
          width: 100%;
          height: 100%;
          border-top-color: #ff4081;
          animation: rotate 1.5s linear infinite;
        }

        .ring-2 {
          width: 70%;
          height: 70%;
          border-right-color: #3f51b5;
          animation: rotate 1.2s linear reverse infinite;
        }

        .ring-3 {
          width: 40%;
          height: 40%;
          border-bottom-color: #00bcd4;
          animation: rotate 1s linear infinite;
        }

        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          letter-spacing: 2px;
        }

        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }

        .tracking-wider {
          letter-spacing: 0.1em;
        }
      `}</style>
    </div>
  );
};

export default Loader;
