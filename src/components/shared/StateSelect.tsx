'use client';

import React, { useState, useEffect, useRef } from 'react';
import { INDIAN_STATES } from '@/constants/indianStates';

interface StateSelectProps {
  value: string;
  onChange: (stateName: string, stateCode: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Reusable searchable dropdown for all 36 Indian States + UTs.
 * Automatically fills the state code when a state is selected.
 * Usage:
 *   <StateSelect
 *     value={formData.state}
 *     onChange={(name, code) => setFormData(p => ({ ...p, state: name, stateCode: code }))}
 *   />
 */
const StateSelect: React.FC<StateSelectProps> = ({ value, onChange, disabled = false, className = '' }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = INDIAN_STATES.filter(s =>
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.tin.includes(query)
  );

  const selectedState = INDIAN_STATES.find(s => s.name === value);

  if (disabled) {
    return (
      <div
        className={`form-control d-flex align-items-center bg-light ${className}`}
        style={{ height: '38px', fontSize: '0.85rem', cursor: 'not-allowed', color: '#6c757d' }}
      >
        <span>{value || '—'}</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }} className={className}>
      {/* Trigger */}
      <div
        className="form-control d-flex align-items-center justify-content-between bg-transparent fw-bold shadow-none px-2"
        style={{ height: '38px', fontSize: '0.85rem', cursor: 'pointer', userSelect: 'none' }}
        onClick={() => { setOpen(o => !o); setQuery(''); }}
      >
        <span style={{ color: value ? '#212529' : '#adb5bd', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value || 'Select State...'}
        </span>
        <div className="d-flex align-items-center gap-1 ms-2 flex-shrink-0">
          <i className={`bi bi-chevron-${open ? 'up' : 'down'} text-muted`} style={{ fontSize: '11px' }} />
        </div>
      </div>

      {/* Dropdown */}
      {open && (
        <div
          className="border rounded-2 shadow bg-white"
          style={{ position: 'absolute', top: 'calc(100% + 2px)', left: 0, right: 0, zIndex: 1060, maxHeight: '280px', display: 'flex', flexDirection: 'column' }}
        >
          {/* Sticky search */}
          <div className="p-2 border-bottom bg-white" style={{ position: 'sticky', top: 0 }}>
            <input
              autoFocus
              type="text"
              className="form-control form-control-sm shadow-none"
              placeholder="Search state or code..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
          </div>

          {/* Options */}
          <div style={{ overflowY: 'auto' }}>
            {/* Clear option */}
            {value && (
              <div
                className="px-3 py-2 text-muted small border-bottom"
                style={{ cursor: 'pointer', fontSize: '0.8rem' }}
                onClick={() => { onChange('', ''); setOpen(false); setQuery(''); }}
              >
                <i className="bi bi-x-circle me-1" /> Clear selection
              </div>
            )}
            {filtered.length === 0 ? (
              <div className="text-muted small text-center py-3">No states found</div>
            ) : (
              filtered.map(state => {
                const isActive = value === state.name;
                return (
                  <div
                    key={state.tin}
                    className="d-flex align-items-center justify-content-between px-3 py-2"
                    style={{
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      background: isActive ? 'rgba(249,115,22,0.10)' : '',
                      fontWeight: isActive ? 600 : 400,
                      transition: 'background 0.1s'
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#fff8f3'; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = ''; }}
                    onClick={() => {
                      onChange(state.name, state.tin);
                      setOpen(false);
                      setQuery('');
                    }}
                  >
                    <span>{state.name}</span>
                    <span
                      className="badge border"
                      style={{
                        fontSize: '10px',
                        minWidth: '32px',
                        background: isActive ? '#f97316' : '#f8f9fa',
                        color: isActive ? '#fff' : '#6c757d',
                        border: isActive ? '1px solid #f97316' : '1px solid #dee2e6'
                      }}
                    >
                      {state.tin}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StateSelect;
