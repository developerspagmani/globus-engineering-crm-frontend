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
      className={`back-btn-standard ${className}`}
      title={title}
      style={{ border: 'none', background: 'transparent', padding: 0 }}
    >
      <i className="bi bi-arrow-left fs-4"></i>
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
