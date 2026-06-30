'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Option {
  value: string | number;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  onCreateNew?: (searchTerm: string) => void;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select Option",
  className = "",
  disabled = false,
  required = false,
  onCreateNew
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Deduplicate options based on value to prevent key collision and redundant items
  const uniqueOptions = Array.from(new Map(options.map(item => [String(item.value), item])).values());

  const selectedOption = uniqueOptions.find(o => String(o.value) === String(value));
  
  const filteredOptions = uniqueOptions.filter(o => 
    String(o.label || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (val: string | number) => {
    onChange(val);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className={`position-relative searchable-select ${className}`} ref={containerRef}>
      <div 
        className={`form-select bg-transparent d-flex align-items-center justify-content-between ${disabled ? 'disabled' : ''} ${isOpen ? 'show' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{ cursor: disabled ? 'not-allowed' : 'pointer', minHeight: '38px', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '2.5rem' }}
      >
        <span className={!selectedOption ? 'text-muted' : 'fw-bold text-dark'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
      </div>

      {isOpen && (
        <div className="dropdown-menu show w-100 shadow-lg border-0 mt-1 py-2 px-2" style={{ maxHeight: '300px', overflowY: 'auto', zIndex: 1050, position: 'absolute', top: '100%', left: 0 }}>
          <div className="px-1 mb-2 sticky-top bg-white py-1">
             <div className="input-group input-group-sm border rounded-pill overflow-hidden shadow-sm">
                <span className="input-group-text border-0 bg-transparent ps-3"><i className="bi bi-search text-muted"></i></span>
                <input
                  ref={inputRef}
                  type="text"
                  className="form-control border-0 shadow-none py-2"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                     if (e.key === 'Escape') {
                        setIsOpen(false);
                     } else if (e.key === 'Enter') {
                        // Prevent form submission
                        e.preventDefault();
                        e.stopPropagation();
                        // If there is exactly one or a highlighted result, select it
                        if (filteredOptions.length > 0) {
                           handleSelect(filteredOptions[0].value);
                        }
                     }
                  }}
                />
             </div>
          </div>
          <div className="options-list">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`dropdown-item rounded-2 py-2 px-3 mb-1 w-100 border-0 transition-all ${String(option.value) === String(value) ? 'bg-primary text-white shadow-sm fw-bold' : 'bg-transparent text-dark'}`}
                  onClick={() => handleSelect(option.value)}
                  style={{ 
                    textAlign: 'left', 
                    fontSize: '0.75rem', 
                    fontWeight: String(option.value) === String(value) ? '700' : '500',
                    whiteSpace: 'normal',
                    display: 'block',
                    lineHeight: '1.4',
                    textTransform: 'none'
                  }}
                >
                  {option.label}
                </button>
              ))
            ) : (
              !onCreateNew && (
                <div className="text-center py-4 text-muted small">
                   <i className="bi bi-inbox fs-4 d-block mb-1 opacity-50"></i>
                   No results found
                </div>
              )
            )}
            
            {onCreateNew && searchTerm.trim() !== "" && !uniqueOptions.some(o => String(o.label).toLowerCase() === searchTerm.toLowerCase().trim()) && (
               <button
                  type="button"
                  className="dropdown-item rounded-2 py-2 px-3 mt-2 w-100 border-0 text-primary fw-bold"
                  style={{ backgroundColor: '#e0f2fe', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}
                  onClick={() => {
                     onCreateNew(searchTerm);
                     setIsOpen(false);
                     setSearchTerm("");
                  }}
               >
                  <i className="bi bi-plus-circle-fill"></i> Add &quot;{searchTerm}&quot;
               </button>
            )}
          </div>
        </div>
      )}
      
      <style jsx>{`
        .searchable-select :global(.form-select) {
           background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e");
           background-repeat: no-repeat;
           background-position: right 0.75rem center;
           background-size: 16px 12px;
           text-transform: none !important;
        }
        .transition-all { transition: all 0.2s ease; }
        
        .options-list :global(.dropdown-item) {
           text-align: left !important;
           justify-content: flex-start !important;
           display: block !important;
           text-transform: none !important;
        }

        .options-list :global(.dropdown-item:hover) {
           background-color: #f1f5f9 !important;
           color: #0f172a !important;
        }

        .searchable-select :global(.input-group) {
           border: 1px solid #e2e8f0 !important;
           transition: all 0.2s ease;
        }
        
        .searchable-select :global(.input-group:focus-within) {
           border-color: #94a3b8 !important;
           box-shadow: 0 0 0 2px rgba(148, 163, 184, 0.1) !important;
        }

        .searchable-select :global(input:focus) {
           box-shadow: none !important;
           border: none !important;
        }

        .show :global(.form-select) {
           border-color: #94a3b8;
           box-shadow: 0 0 0 0.25rem rgba(148, 163, 184, 0.1);
        }
      `}</style>
    </div>
  );
};

export default SearchableSelect;
