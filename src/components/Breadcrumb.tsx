'use client';

import React from 'react';
import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav aria-label="breadcrumb" className="mb-4">
      <ol className="breadcrumb mb-0 p-0 bg-transparent">
        <li className="breadcrumb-item">
          <Link href="/dashboard" className="text-decoration-none text-muted transition">
            <i className="bi bi-house-door me-1"></i>
            Home
          </Link>
        </li>
        {items.map((item, index) => (
          <li 
            key={index} 
            className={`breadcrumb-item ${item.active ? 'active fw-semibold text-dark' : 'text-muted'}`}
            aria-current={item.active ? 'page' : undefined}
          >
            {item.href && !item.active ? (
              <Link href={item.href} className="text-decoration-none text-muted hover-text-primary">
                {item.label}
              </Link>
            ) : (
              <span>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
