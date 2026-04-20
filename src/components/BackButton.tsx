'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

import Link from 'next/link';

interface BackButtonProps {
  onClick?: () => void;
  href?: string;
  className?: string;
  title?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ onClick, href, className = "", title = "Go Back" }) => {
  const router = useRouter();

  const handleBack = () => {
    if (onClick) {
      onClick();
    } else if (!href) {
      router.back();
    }
  };

  const buttonContent = (
    <button
      onClick={href ? undefined : handleBack}
      className={`btn-back-universal ${className}`}
      title={title}
    >
      <i className="bi bi-arrow-left"></i>
      <style jsx>{`
        .btn-back-universal {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 10px;
          color: var(--accent-color, #ea580c);
          transition: all 0.2s ease-in-out;
          cursor: pointer;
          outline: none;
          padding: 0;
          margin-right: 12px;
        }
        .btn-back-universal:hover {
          background-color: var(--accent-color, #ea580c);
          color: white;
          transform: translateX(-3px);
          box-shadow: 0 4px 12px rgba(234, 88, 12, 0.2);
          border-color: var(--accent-color, #ea580c);
        }
        .btn-back-universal i {
          font-size: 1.25rem;
          font-weight: 900 !important;
        }
      `}</style>
    </button>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: 'none' }}>
        {buttonContent}
      </Link>
    );
  }

  return buttonContent;
};

export default BackButton;
