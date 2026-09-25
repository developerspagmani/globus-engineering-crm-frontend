'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { Invoice } from '@/types/modules';
import api from '@/lib/axios';

interface InvoiceEmailReminderToggleProps {
  invoice: Invoice;
  compact?: boolean;
  modalOnly?: boolean;
  autoOpenSend?: boolean;
  onClose?: () => void;
}

interface ReminderStatusData {
  enabled: boolean;
  customerEmail?: string | null;
  customerName?: string;
  isPaid?: boolean;
  dueDate?: string | null;
  lastSent?: string | null;
  lastReminderType?: string | null;
  totalSentCount?: number;
}

const InvoiceEmailReminderToggle: React.FC<InvoiceEmailReminderToggleProps> = ({ 
  invoice, 
  compact = false,
  modalOnly = false,
  autoOpenSend = false,
  onClose
}) => {
  const { company: activeCompany } = useSelector((state: RootState) => state.auth);
  
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [statusData, setStatusData] = useState<ReminderStatusData | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showSendModal, setShowSendModal] = useState(autoOpenSend);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [customNote, setCustomNote] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (autoOpenSend) {
      setShowSendModal(true);
    }
  }, [autoOpenSend]);

  // Load reminder status on mount and when invoice/company changes
  useEffect(() => {
    if (activeCompany?.id && invoice?.id) {
      fetchReminderStatus();
    }
  }, [activeCompany?.id, invoice?.id]);

  const fetchReminderStatus = async () => {
    try {
      const response = await api.get(`/invoices/${invoice.id}/reminder-status`, {
        params: { company_id: activeCompany?.id }
      });
      const data = response.data;
      setReminderEnabled(data.enabled !== false);
      setStatusData(data);
      if (data.customerEmail) {
        setRecipientEmail(data.customerEmail);
      }
    } catch (error) {
      console.error('Failed to fetch reminder status:', error);
      // Default to true on failure so reminders aren't accidentally shown as disabled
      setReminderEnabled(true);
    }
  };

  const toggleReminder = async () => {
    if (!activeCompany?.id || !invoice?.id) return;

    setLoading(true);
    setFeedback(null);
    try {
      const newStatus = !reminderEnabled;
      const response = await api.put(`/invoices/${invoice.id}/reminder-status`, {
        company_id: activeCompany.id,
        enabled: newStatus,
      });

      setReminderEnabled(newStatus);
      setFeedback({
        type: 'success',
        message: newStatus ? 'Email reminders enabled for this invoice' : 'Email reminders disabled for this invoice'
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (error: any) {
      console.error('Failed to toggle reminder:', error);
      setFeedback({
        type: 'error',
        message: error.response?.data?.error || 'Failed to update reminder status'
      });
      setTimeout(() => setFeedback(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany?.id || !invoice?.id) return;

    if (!recipientEmail || !recipientEmail.trim() || !recipientEmail.includes('@')) {
      setFeedback({
        type: 'error',
        message: 'Please provide a valid recipient email address'
      });
      return;
    }

    setSendingEmail(true);
    setFeedback(null);
    try {
      const response = await api.post(`/invoices/${invoice.id}/send-reminder`, {
        company_id: activeCompany.id,
        recipientEmail: recipientEmail.trim(),
        customNote: customNote.trim() || undefined
      });

      setFeedback({
        type: 'success',
        message: response.data.message || `Reminder email sent to ${recipientEmail}`
      });
      setShowSendModal(false);
      setCustomNote('');
      fetchReminderStatus();
      setTimeout(() => setFeedback(null), 6000);
    } catch (error: any) {
      console.error('Failed to send reminder email:', error);
      setFeedback({
        type: 'error',
        message: error.response?.data?.error || 'Failed to send reminder email'
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const isInvoicePaid = statusData?.isPaid || 
    invoice.status === 'paid' || 
    (invoice.grandTotal > 0 && invoice.paidAmount >= invoice.grandTotal - 0.5);

  const formattedLastSent = statusData?.lastSent 
    ? new Date(statusData.lastSent).toLocaleDateString('en-GB')
    : null;

  const handleClose = () => {
    setShowSendModal(false);
    if (onClose) onClose();
  };

  return (
    <div className="d-inline-flex align-items-center position-relative">
      {!modalOnly && (
        <div className="d-flex align-items-center gap-2">
          {/* Toggle Switch */}
          <div 
            className="d-flex align-items-center bg-light px-2 py-1 rounded-pill border"
            title={isInvoicePaid ? 'Invoice is paid' : reminderEnabled ? 'Auto reminders active' : 'Auto reminders paused'}
          >
            <div className="form-check form-switch m-0 d-flex align-items-center">
              <input
                className="form-check-input my-0"
                type="checkbox"
                role="switch"
                id={`reminder-toggle-${invoice.id}`}
                checked={reminderEnabled}
                onChange={toggleReminder}
                disabled={loading || isInvoicePaid}
                style={{ cursor: loading || isInvoicePaid ? 'not-allowed' : 'pointer' }}
              />
              <label 
                className="form-check-label small fw-semibold ms-2 user-select-none" 
                htmlFor={`reminder-toggle-${invoice.id}`}
                style={{ cursor: loading || isInvoicePaid ? 'not-allowed' : 'pointer', fontSize: '12px' }}
              >
                {loading ? (
                  <span className="text-muted">
                    <span className="spinner-border spinner-border-sm me-1" style={{ width: '10px', height: '10px' }}></span>
                    Saving...
                  </span>
                ) : isInvoicePaid ? (
                  <span className="text-success">
                    <i className="bi bi-check-circle-fill me-1"></i> Paid
                  </span>
                ) : reminderEnabled ? (
                  <span className="text-success">
                    <i className="bi bi-bell-fill me-1"></i> Reminders ON
                  </span>
                ) : (
                  <span className="text-muted">
                    <i className="bi bi-bell-slash me-1"></i> Reminders OFF
                  </span>
                )}
              </label>
            </div>
          </div>

          {/* Send Reminder Button */}
          {!isInvoicePaid && (
            <button
              type="button"
              className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1 rounded-pill px-2 py-1 fw-semibold text-nowrap"
              onClick={() => {
                setFeedback(null);
                setShowSendModal(true);
              }}
              title={formattedLastSent ? `Last sent on ${formattedLastSent} (${statusData?.totalSentCount || 1} sent)` : 'Send payment reminder with PDF attachment now'}
              style={{ fontSize: '12px' }}
            >
              <i className="bi bi-send-fill text-primary"></i>
              <span>Send Reminder</span>
              {formattedLastSent && (
                <span className="badge bg-primary-subtle text-primary rounded-pill ms-1" style={{ fontSize: '10px' }}>
                  {statusData?.totalSentCount}
                </span>
              )}
            </button>
          )}
        </div>
      )}

      {/* Floating feedback toast alert */}
      {feedback && (
        <div 
          className={`position-absolute top-100 start-50 translate-middle-x mt-2 alert alert-${feedback.type === 'success' ? 'success' : 'danger'} py-1 px-3 rounded-pill shadow-sm small z-3 text-nowrap d-flex align-items-center gap-2`}
          style={{ minWidth: '220px', fontSize: '12px' }}
        >
          <i className={`bi bi-${feedback.type === 'success' ? 'check-circle-fill' : 'exclamation-triangle-fill'}`}></i>
          <span>{feedback.message}</span>
          <button 
            type="button" 
            className="btn-close ms-auto" 
            style={{ fontSize: '8px' }} 
            onClick={() => setFeedback(null)}
          ></button>
        </div>
      )}

      {/* Send Reminder Modal */}
      {showSendModal && (
        <div 
          className="modal fade show d-block" 
          tabIndex={-1} 
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(2px)', zIndex: 1055 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable" style={{ maxWidth: '480px' }}>
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-primary text-white border-0 py-3 px-4">
                <div className="d-flex align-items-center gap-2">
                  <div className="bg-white bg-opacity-25 rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                    <i className="bi bi-envelope-paper-fill fs-5"></i>
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold mb-0 text-white" style={{ fontSize: '16px' }}>
                      Send Payment Reminder
                    </h5>
                    <div className="text-white-50 small" style={{ fontSize: '12px' }}>
                      Invoice #{invoice.invoiceNumber || invoice.id} &bull; {invoice.customerName}
                    </div>
                  </div>
                </div>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={handleClose}
                  disabled={sendingEmail}
                ></button>
              </div>

              <form onSubmit={handleSendReminder}>
                <div className="modal-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  {/* Invoice Summary Box */}
                  <div className="bg-light rounded-3 p-3 mb-3 border">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="text-muted small">Total Outstanding:</span>
                      <span className="fw-bold text-success fs-6">
                        Rs. {Math.round(invoice.grandTotal || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center small text-muted">
                      <span>Due Date:</span>
                      <span>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-GB') : 'Immediate'}</span>
                    </div>
                    {formattedLastSent && (
                      <div className="d-flex justify-content-between align-items-center small text-muted mt-1 pt-1 border-top">
                        <span>Last Reminder Sent:</span>
                        <span className="badge bg-secondary-subtle text-secondary">{formattedLastSent}</span>
                      </div>
                    )}
                  </div>

                  {/* Recipient Email */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-dark d-flex justify-content-between">
                      <span>Recipient Email Address <span className="text-danger">*</span></span>
                      {!statusData?.customerEmail && (
                        <span className="text-warning small" style={{ fontSize: '11px' }}>
                          <i className="bi bi-info-circle me-1"></i> No email on file
                        </span>
                      )}
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-white text-muted">
                        <i className="bi bi-envelope"></i>
                      </span>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="customer@example.com"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        required
                        disabled={sendingEmail}
                      />
                    </div>
                    <div className="form-text text-muted" style={{ fontSize: '11px' }}>
                      Official invoice PDF will be generated and attached automatically.
                    </div>
                  </div>

                  {/* Optional Custom Note */}
                  <div className="mb-2">
                    <label className="form-label fw-semibold small text-dark">
                      Custom Note / Message <span className="text-muted fw-normal">(Optional)</span>
                    </label>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="e.g. Kindly verify and arrange payment before this Friday."
                      value={customNote}
                      onChange={(e) => setCustomNote(e.target.value)}
                      disabled={sendingEmail}
                    />
                  </div>
                </div>

                <div className="modal-footer bg-light border-0 py-3 px-4 d-flex justify-content-end gap-2">
                  <button 
                    type="button" 
                    className="btn btn-light rounded-pill px-3 fw-semibold" 
                    onClick={handleClose}
                    disabled={sendingEmail}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary rounded-pill px-4 fw-bold d-flex align-items-center gap-2 shadow-sm"
                    disabled={sendingEmail}
                  >
                    {sendingEmail ? (
                      <>
                        <span className="spinner-border spinner-border-sm"></span>
                        Sending Email & PDF...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send-fill"></i>
                        Send Email Now
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceEmailReminderToggle;
