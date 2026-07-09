import React from 'react';

interface SortableHeaderProps {
  field: string;
  label: string;
  currentSortBy?: string;
  currentSortOrder?: 'asc' | 'desc';
  onSort: (field: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export default function SortableHeader({ 
  field, 
  label, 
  currentSortBy, 
  currentSortOrder, 
  onSort,
  className = '',
  style
}: SortableHeaderProps) {
  const isActive = currentSortBy === field;

  return (
    <th 
      className={`border-0 ${className}`} 
      onClick={() => onSort(field)}
      style={{ cursor: 'pointer', userSelect: 'none', ...style }}
    >
      <div className="d-flex align-items-center gap-2">
        <span>{label}</span>
        <div className="d-flex flex-column text-muted" style={{ fontSize: '0.65rem', lineHeight: 1 }}>
          {isActive ? (
            currentSortOrder === 'asc' ? (
              <i className="bi bi-chevron-up text-primary fw-bold" style={{ fontSize: '0.8rem' }}></i>
            ) : (
              <i className="bi bi-chevron-down text-primary fw-bold" style={{ fontSize: '0.8rem' }}></i>
            )
          ) : (
            <>
              <i className="bi bi-chevron-up mb-n1" style={{ opacity: 0.7 }}></i>
              <i className="bi bi-chevron-down" style={{ opacity: 0.7 }}></i>
            </>
          )}
        </div>
      </div>
    </th>
  );
}
