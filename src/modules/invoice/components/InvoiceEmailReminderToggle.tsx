'use client';

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { Invoice } from '@/types/modules';

interface InvoiceEmailReminderToggleProps {
  invoice: Invoice;
}

const InvoiceEmailReminderToggle: React.FC<InvoiceEmailReminderToggleProps> = ({ invoice }) => {
  const dispatch = useDispatch();
  const { company: activeCompany } = useSelector((state: RootState) => state.auth);
  
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load reminder state from backend on component mount
  useEffect(() => {
    if (activeCompany?.id && invoice.id) {
      fetchReminderStatus();
    }
  }, [activeCompany?.id, invoice.id]);

  const fetchReminderStatus = async () => {
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/reminder-status?company_id=${activeCompany?.id}`);
      const data = await response.json();
      setReminderEnabled(data.enabled || false);
    } catch (error) {
      console.error('Failed to fetch reminder status:', error);
    }
  };

  const toggleReminder = async () => {
    if (!activeCompany?.id) return;

    setLoading(true);
    try {
      const newStatus = !reminderEnabled;
      await fetch(`/api/invoices/${invoice.id}/reminder-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled: newStatus,
          company_id: activeCompany.id,
        }),
      });

      setReminderEnabled(newStatus);
    } catch (error) {
      console.error('Failed to toggle reminder:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if invoice has DC date for reminder logic
  const hasDCDate = !!invoice.dcDate;

  return (
    <div className="d-flex align-items-center gap-2 ms-3">
      <div className="form-check form-switch">
        <input
          className="form-check-input"
          type="checkbox"
          id={`reminder-toggle-${invoice.id}`}
          checked={reminderEnabled}
          onChange={toggleReminder}
          disabled={loading || !hasDCDate}
        />
        <label 
          className="form-check-label small fw-medium ms-2" 
          htmlFor={`reminder-toggle-${invoice.id}`}
          style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-1"></span>
              Updating...
            </>
          ) : reminderEnabled ? (
            <>
              <i className="bi bi-bell-fill text-success me-1"></i>
              Email Reminders ON
            </>
          ) : (
            <>
              <i className="bi bi-bell text-muted me-1"></i>
              Email Reminders OFF
            </>
          )}
        </label>
      </div>
      
      {!hasDCDate && (
        <div className="small text-muted">
          <i className="bi bi-info-circle me-1"></i>
          No DC date set
        </div>
      )}
    </div>
  );
};

export default InvoiceEmailReminderToggle;
