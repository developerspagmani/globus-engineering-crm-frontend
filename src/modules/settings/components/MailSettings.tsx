'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import api from '@/lib/axios';

interface MailFormData {
  smtpHost: string;
  smtpPort: number | string;
  smtpUser: string;
  smtpPass: string;
  secure: boolean;
  fromName: string;
  fromEmail: string;
  replyTo: string;
  ccEmail: string;
  enableAutoReminders: boolean;
  reminderSchedule: string[];
  enableLeadReminders: boolean;
  leadReminderDays: number | string;
}

const PRESETS = [
  {
    name: 'Gmail / Google Workspace',
    icon: 'bi-google',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    note: 'Requires 2-Step Verification & 16-character App Password (not your normal password).'
  },
  {
    name: 'Microsoft 365 / Outlook',
    icon: 'bi-microsoft',
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    note: 'Requires SMTP AUTH enabled in Microsoft 365 Admin Center.'
  },
  {
    name: 'Zoho Mail',
    icon: 'bi-envelope-paper',
    host: 'smtp.zoho.com',
    port: 465,
    secure: true,
    note: 'Requires SSL on port 465 and App-Specific Password.'
  },
  {
    name: 'Amazon SES',
    icon: 'bi-cloud-check',
    host: 'email-smtp.us-east-1.amazonaws.com',
    port: 587,
    secure: false,
    note: 'Use your AWS SES SMTP credentials.'
  }
];

const REMINDER_OPTIONS = [
  { id: '30_days', label: '30 Days Before Due Date', desc: 'Early payment heads-up' },
  { id: '1_week', label: '7 Days Before Due Date', desc: 'Standard reminder' },
  { id: '1_day', label: '1 Day Before Due Date', desc: 'Pre-due notification' },
  { id: 'today', label: 'On Due Date', desc: 'Due date alert' },
  { id: 'overdue_7_days', label: '7 Days Overdue', desc: 'First overdue notice' },
  { id: 'overdue_15_days', label: '15 Days Overdue', desc: 'Urgent overdue notice' },
];

const MailSettings: React.FC = () => {
  const { company: activeCompany } = useSelector((state: RootState) => state.auth);

  const [formData, setFormData] = useState<MailFormData>({
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    secure: false,
    fromName: activeCompany?.name || 'Globus Engineering Tools',
    fromEmail: '',
    replyTo: '',
    ccEmail: '',
    enableAutoReminders: true,
    reminderSchedule: ['30_days', '1_week', '1_day', 'today', 'overdue_7_days', 'overdue_15_days'],
    enableLeadReminders: true,
    leadReminderDays: 1
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasStoredPassword, setHasStoredPassword] = useState(false);
  const [testRecipient, setTestRecipient] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  useEffect(() => {
    if (activeCompany?.id) {
      loadMailSettings();
    }
  }, [activeCompany?.id]);

  const loadMailSettings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/settings/mail', {
        params: { company_id: activeCompany?.id }
      });
      const data = response.data;
      setFormData({
        smtpHost: data.smtpHost || '',
        smtpPort: data.smtpPort || 587,
        smtpUser: data.smtpUser || '',
        smtpPass: data.smtpPass || '',
        secure: data.secure === true,
        fromName: data.fromName || activeCompany?.name || 'Globus Engineering Tools',
        fromEmail: data.fromEmail || data.smtpUser || '',
        replyTo: data.replyTo || '',
        ccEmail: data.ccEmail || '',
        enableAutoReminders: data.enableAutoReminders !== false,
        reminderSchedule: Array.isArray(data.reminderSchedule) ? data.reminderSchedule : [
          '30_days', '1_week', '1_day', 'today', 'overdue_7_days', 'overdue_15_days'
        ],
        enableLeadReminders: data.enableLeadReminders !== undefined ? data.enableLeadReminders : true,
        leadReminderDays: data.leadReminderDays !== undefined ? data.leadReminderDays : 1
      });
      setHasStoredPassword(data.hasPassword || false);
      if (data.fromEmail) {
        setTestRecipient(data.fromEmail);
      } else if (data.smtpUser) {
        setTestRecipient(data.smtpUser);
      }
    } catch (err: any) {
      console.error('Failed to load mail settings:', err);
      setFeedback({
        type: 'error',
        message: 'Failed to fetch current mail settings'
      });
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setFormData(prev => ({
      ...prev,
      smtpHost: preset.host,
      smtpPort: preset.port,
      secure: preset.secure
    }));
    setActivePreset(preset.name);
    setFeedback({
      type: 'success',
      message: `Applied ${preset.name} configuration. Please verify your username and App Password.`
    });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const toggleReminderOption = (optionId: string) => {
    setFormData(prev => {
      const current = prev.reminderSchedule || [];
      const updated = current.includes(optionId)
        ? current.filter(id => id !== optionId)
        : [...current, optionId];
      return { ...prev, reminderSchedule: updated };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany?.id) return;

    if (!formData.smtpHost || !formData.smtpUser) {
      setFeedback({
        type: 'error',
        message: 'SMTP Host and Username/Email are required.'
      });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      const payload = {
        company_id: activeCompany.id,
        smtpHost: formData.smtpHost.trim(),
        smtpPort: Number(formData.smtpPort) || 587,
        smtpUser: formData.smtpUser.trim(),
        smtpPass: formData.smtpPass,
        secure: formData.secure,
        fromName: formData.fromName.trim(),
        fromEmail: formData.fromEmail.trim(),
        replyTo: formData.replyTo.trim(),
        ccEmail: formData.ccEmail.trim(),
        enableAutoReminders: formData.enableAutoReminders,
        reminderSchedule: formData.reminderSchedule,
        enableLeadReminders: formData.enableLeadReminders,
        leadReminderDays: Number(formData.leadReminderDays) || 1
      };

      const response = await api.put('/settings/mail', payload);
      setFeedback({
        type: 'success',
        message: response.data.message || 'SMTP settings saved successfully!'
      });
      setHasStoredPassword(true);
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      console.error('Failed to save mail settings:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || 'Failed to save SMTP settings.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!activeCompany?.id) return;

    if (!testRecipient || !testRecipient.includes('@')) {
      setTestResult({
        success: false,
        message: 'Please provide a valid test recipient email address.'
      });
      return;
    }

    setTesting(true);
    setTestResult(null);
    try {
      const response = await api.post('/settings/mail/test', {
        company_id: activeCompany.id,
        testEmail: testRecipient.trim(),
        smtpHost: formData.smtpHost.trim(),
        smtpPort: Number(formData.smtpPort) || 587,
        smtpUser: formData.smtpUser.trim(),
        smtpPass: formData.smtpPass,
        secure: formData.secure,
        fromName: formData.fromName.trim(),
        fromEmail: formData.fromEmail.trim()
      });

      setTestResult({
        success: true,
        message: response.data.message || `Test email sent to ${testRecipient} successfully!`
      });
    } catch (err: any) {
      console.error('SMTP test failed:', err);
      setTestResult({
        success: false,
        message: err.response?.data?.error || err.message || 'SMTP test connection failed.'
      });
    } finally {
      setTesting(false);
    }
  };

  if (!activeCompany) {
    return (
      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-body p-5 text-center">
          <i className="bi bi-building-exclamation display-1 text-muted opacity-25 mb-4"></i>
          <h5 className="fw-bold">No Company Context</h5>
          <p className="text-muted">Please select an active company to configure its mail and SMTP settings.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-body p-5 text-center">
          <div className="spinner-border text-primary mb-3" role="status"></div>
          <p className="text-muted small">Loading mail configuration...</p>
        </div>
      </div>
    );
  }

  const isConfigured = !!(formData.smtpHost && formData.smtpUser && (formData.smtpPass || hasStoredPassword));

  return (
    <div className="d-flex flex-column gap-4">
      {/* Top Banner Alert Feedback */}
      {feedback && (
        <div className={`alert alert-${feedback.type === 'success' ? 'success' : 'danger'} border-0 shadow-sm rounded-4 p-3 d-flex align-items-center gap-3`}>
          <i className={`bi bi-${feedback.type === 'success' ? 'check-circle-fill' : 'exclamation-triangle-fill'} fs-4`}></i>
          <div className="flex-grow-1 fw-medium small">{feedback.message}</div>
          <button type="button" className="btn-close" onClick={() => setFeedback(null)}></button>
        </div>
      )}

      {/* Main Configuration Card */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        {/* Header */}
        <div className="card-header bg-white border-bottom border-light p-4 d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <h5 className="fw-bold mb-0">SMTP & Outbound Mail Configuration</h5>
              {isConfigured ? (
                <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3 py-1">
                  <i className="bi bi-shield-check me-1"></i> Active
                </span>
              ) : (
                <span className="badge bg-warning-subtle text-warning border border-warning-subtle rounded-pill px-3 py-1">
                  <i className="bi bi-exclamation-circle me-1"></i> Setup Required
                </span>
              )}
            </div>
            <p className="text-muted small mb-0">
              Configure the outgoing email server used for sending invoice PDFs, reminder notices, and lead visit alerts.
            </p>
          </div>

          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary rounded-pill px-3 fw-semibold small d-flex align-items-center gap-2"
              onClick={loadMailSettings}
              disabled={loading || saving}
            >
              <i className="bi bi-arrow-clockwise"></i> Reload
            </button>
            <button
              type="button"
              className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-2"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm"></span>
                  Saving...
                </>
              ) : (
                <>
                  <i className="bi bi-check2"></i> Save Configuration
                </>
              )}
            </button>
          </div>
        </div>

        <div className="card-body p-4">
          {/* Quick Provider Presets */}
          <div className="mb-4">
            <label className="form-label small text-muted text-uppercase fw-bold mb-2">
              <i className="bi bi-lightning-charge-fill text-warning me-1"></i> Quick Provider Presets
            </label>
            <div className="row g-2">
              {PRESETS.map((preset) => (
                <div key={preset.name} className="col-md-3 col-sm-6">
                  <button
                    type="button"
                    className={`btn w-100 text-start p-3 rounded-3 border d-flex flex-column gap-1 transition-all ${formData.smtpHost === preset.host ? 'border-primary bg-primary-subtle' : 'bg-light border-light-subtle'}`}
                    onClick={() => applyPreset(preset)}
                    style={{ transition: 'all 0.15s ease-in-out' }}
                  >
                    <div className="d-flex align-items-center gap-2 fw-bold small text-dark">
                      <i className={`bi ${preset.icon} text-primary fs-6`}></i>
                      <span>{preset.name}</span>
                    </div>
                    <div className="text-muted" style={{ fontSize: '11px' }}>
                      {preset.host}:{preset.port}
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSave}>
            <div className="row g-4">
              {/* Left Column: Server Credentials */}
              <div className="col-lg-6">
                <div className="p-3 bg-light rounded-4 border">
                  <h6 className="fw-bold mb-3 d-flex align-items-center gap-2 text-dark">
                    <i className="bi bi-hdd-network text-primary"></i> SMTP Server Details
                  </h6>

                  <div className="row g-3">
                    <div className="col-md-8">
                      <label className="form-label small fw-semibold text-muted">
                        SMTP Host / Server <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        name="smtpHost"
                        className="form-control shadow-none"
                        placeholder="e.g. smtp.gmail.com"
                        value={formData.smtpHost}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-semibold text-muted">
                        Port <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        name="smtpPort"
                        className="form-control shadow-none"
                        placeholder="587"
                        value={formData.smtpPort}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold text-muted">
                        Security / Encryption
                      </label>
                      <select
                        name="secure"
                        className="form-select shadow-none"
                        value={formData.secure ? 'true' : 'false'}
                        onChange={(e) => {
                          const isSec = e.target.value === 'true';
                          setFormData(prev => ({
                            ...prev,
                            secure: isSec,
                            smtpPort: isSec ? 465 : (prev.smtpPort === 465 ? 587 : prev.smtpPort)
                          }));
                        }}
                      >
                        <option value="false">STARTTLS / TLS (Port 587 recommended)</option>
                        <option value="true">SSL / TLS (Port 465)</option>
                      </select>
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold text-muted">
                        SMTP Username / Email <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-white text-muted">
                          <i className="bi bi-person"></i>
                        </span>
                        <input
                          type="text"
                          name="smtpUser"
                          className="form-control shadow-none"
                          placeholder="e.g. accounts@globusengineering.com"
                          value={formData.smtpUser}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold text-muted d-flex justify-content-between">
                        <span>SMTP Password / App Password <span className="text-danger">*</span></span>
                        {hasStoredPassword && (
                          <span className="badge bg-secondary-subtle text-secondary" style={{ fontSize: '10px' }}>
                            Stored securely
                          </span>
                        )}
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-white text-muted">
                          <i className="bi bi-key"></i>
                        </span>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="smtpPass"
                          className="form-control shadow-none"
                          placeholder={hasStoredPassword ? '•••••••• (leave unchanged to keep)' : 'Enter 16-character App Password'}
                          value={formData.smtpPass}
                          onChange={handleInputChange}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setShowPassword(!showPassword)}
                          title={showPassword ? 'Hide Password' : 'Show Password'}
                        >
                          <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                        </button>
                      </div>
                      <div className="form-text text-muted" style={{ fontSize: '11px' }}>
                        For Gmail, generate an <strong>App Password</strong> at Google Account &gt; Security &gt; 2-Step Verification &gt; App Passwords.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Sender Identity & Reply-To */}
              <div className="col-lg-6">
                <div className="p-3 bg-light rounded-4 border h-100">
                  <h6 className="fw-bold mb-3 d-flex align-items-center gap-2 text-dark">
                    <i className="bi bi-person-badge text-primary"></i> Sender Identity & Headers
                  </h6>

                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label small fw-semibold text-muted">
                        Default From Name
                      </label>
                      <input
                        type="text"
                        name="fromName"
                        className="form-control shadow-none"
                        placeholder="e.g. Globus Engineering Tools"
                        value={formData.fromName}
                        onChange={handleInputChange}
                      />
                      <div className="form-text text-muted" style={{ fontSize: '11px' }}>
                        The name displayed in the recipient&apos;s email inbox.
                      </div>
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold text-muted">
                        Default From Email
                      </label>
                      <input
                        type="email"
                        name="fromEmail"
                        className="form-control shadow-none"
                        placeholder="e.g. billing@globusengineering.com"
                        value={formData.fromEmail}
                        onChange={handleInputChange}
                      />
                      <div className="form-text text-muted" style={{ fontSize: '11px' }}>
                        Leave blank to use the SMTP username email address.
                      </div>
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold text-muted">
                        Reply-To Email <span className="text-muted fw-normal">(Optional)</span>
                      </label>
                      <input
                        type="email"
                        name="replyTo"
                        className="form-control shadow-none"
                        placeholder="e.g. accounts@globusengineering.com"
                        value={formData.replyTo}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold text-muted">
                        Invoice Copy CC / BCC <span className="text-muted fw-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        name="ccEmail"
                        className="form-control shadow-none"
                        placeholder="e.g. audit@globusengineering.com"
                        value={formData.ccEmail}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Automated Reminder Schedule Section */}
              <div className="col-12">
                <div className="p-4 bg-white rounded-4 border">
                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
                    <div>
                      <h6 className="fw-bold mb-1 d-flex align-items-center gap-2 text-dark">
                        <i className="bi bi-alarm text-primary"></i> Automated Payment Reminders Schedule
                      </h6>
                      <p className="text-muted small mb-0">
                        Automatically dispatch polite email reminders with PDF invoices attached as payment due dates approach.
                      </p>
                    </div>

                    <div className="form-check form-switch m-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="enableAutoReminders"
                        name="enableAutoReminders"
                        checked={formData.enableAutoReminders}
                        onChange={handleInputChange}
                        style={{ cursor: 'pointer', width: '2.5rem', height: '1.25rem' }}
                      />
                      <label className="form-check-label fw-bold small ms-2" htmlFor="enableAutoReminders" style={{ cursor: 'pointer' }}>
                        {formData.enableAutoReminders ? 'Auto Reminders Active' : 'Auto Reminders Paused'}
                      </label>
                    </div>
                  </div>

                  {formData.enableAutoReminders && (
                    <div className="row g-3 pt-2">
                      {REMINDER_OPTIONS.map((opt) => {
                        const isChecked = formData.reminderSchedule?.includes(opt.id);
                        return (
                          <div key={opt.id} className="col-md-4 col-sm-6">
                            <div 
                              className={`p-3 rounded-3 border d-flex align-items-start gap-2 cursor-pointer transition-all ${isChecked ? 'bg-primary-subtle border-primary-subtle' : 'bg-light border-light'}`}
                              onClick={() => toggleReminderOption(opt.id)}
                              style={{ cursor: 'pointer' }}
                            >
                              <input
                                type="checkbox"
                                className="form-check-input mt-1"
                                checked={isChecked}
                                onChange={() => {}} // Controlled by parent div
                              />
                              <div>
                                <div className="fw-bold small text-dark">{opt.label}</div>
                                <div className="text-muted" style={{ fontSize: '11px' }}>{opt.desc}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Automated Lead Visit Reminders Configuration Section */}
              <div className="col-12">
                <div className="p-4 bg-white rounded-4 border">
                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
                    <div>
                      <h6 className="fw-bold mb-1 d-flex align-items-center gap-2 text-dark">
                        <i className="bi bi-calendar-check text-success fs-5"></i> Automated Lead Visit Reminders Configuration
                      </h6>
                      <p className="text-muted small mb-0">
                        Configure how many days in advance the assigned Sales Person receives an email reminder before their scheduled lead visit date.
                      </p>
                    </div>

                    <div className="form-check form-switch m-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="enableLeadReminders"
                        name="enableLeadReminders"
                        checked={formData.enableLeadReminders}
                        onChange={handleInputChange}
                        style={{ cursor: 'pointer', width: '2.5rem', height: '1.25rem' }}
                      />
                      <label className="form-check-label fw-bold small ms-2" htmlFor="enableLeadReminders" style={{ cursor: 'pointer' }}>
                        {formData.enableLeadReminders ? 'Lead Reminders Active' : 'Lead Reminders Paused'}
                      </label>
                    </div>
                  </div>

                  {formData.enableLeadReminders && (
                    <div className="pt-2">
                      <div className="row g-3 align-items-center">
                        <div className="col-md-5">
                          <label className="form-label small fw-semibold text-muted mb-2">
                            Send Reminder (Days Before Visit Date)
                          </label>
                          <div className="input-group">
                            <span className="input-group-text bg-light text-primary fw-bold">
                              <i className="bi bi-bell-fill me-2 text-warning"></i> Days Before
                            </span>
                            <input
                              type="number"
                              min="1"
                              max="30"
                              name="leadReminderDays"
                              className="form-control shadow-none fw-bold text-center fs-5"
                              value={formData.leadReminderDays}
                              onChange={handleInputChange}
                              required
                            />
                            <span className="input-group-text bg-light text-muted small">Day(s)</span>
                          </div>
                        </div>

                        <div className="col-md-7">
                          <label className="form-label small fw-semibold text-muted mb-2">
                            Quick Presets
                          </label>
                          <div className="d-flex flex-wrap gap-2">
                            {[
                              { days: 1, label: '1 Day Before (Tomorrow)' },
                              { days: 2, label: '2 Days Before' },
                              { days: 3, label: '3 Days Before' },
                              { days: 5, label: '5 Days Before' },
                              { days: 7, label: '7 Days Before (1 Week)' }
                            ].map(preset => (
                              <button
                                key={preset.days}
                                type="button"
                                className={`btn btn-sm rounded-pill px-3 py-1 ${Number(formData.leadReminderDays) === preset.days ? 'btn-primary shadow-sm fw-bold' : 'btn-outline-secondary'}`}
                                onClick={() => setFormData(prev => ({ ...prev, leadReminderDays: preset.days }))}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 p-3 bg-light rounded-3 border d-flex align-items-center gap-3">
                        <div className="badge bg-success-subtle text-success p-2 rounded-circle fs-5">
                          <i className="bi bi-clock-history"></i>
                        </div>
                        <div className="small text-muted">
                          <strong>Active Schedule Rule:</strong> The assigned Sales Person will receive the automated visit reminder email exactly <strong>{formData.leadReminderDays} day{Number(formData.leadReminderDays) > 1 ? 's' : ''}</strong> before the scheduled visit date during the daily scheduler runs (10:00 AM &amp; 12:40 PM).
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Live Connection Test Card */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="card-header bg-white border-bottom border-light p-4">
          <div className="d-flex align-items-center gap-2 mb-1">
            <i className="bi bi-send-check text-primary fs-5"></i>
            <h6 className="fw-bold mb-0">Test SMTP Configuration & Send Diagnostic Email</h6>
          </div>
          <p className="text-muted small mb-0">
            Verify your SMTP connection by sending a real diagnostic email to your inbox before sending to customers.
          </p>
        </div>

        <div className="card-body p-4">
          <div className="row g-3 align-items-end">
            <div className="col-md-7">
              <label className="form-label small fw-semibold text-muted">
                Test Recipient Email Address
              </label>
              <div className="input-group">
                <span className="input-group-text bg-white text-muted">
                  <i className="bi bi-envelope-at"></i>
                </span>
                <input
                  type="email"
                  className="form-control shadow-none"
                  placeholder="name@example.com"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  disabled={testing}
                />
              </div>
            </div>

            <div className="col-md-5">
              <button
                type="button"
                className="btn btn-dark rounded-pill px-4 fw-bold w-100 d-flex align-items-center justify-content-center gap-2"
                onClick={handleTestEmail}
                disabled={testing || !testRecipient}
              >
                {testing ? (
                  <>
                    <span className="spinner-border spinner-border-sm"></span>
                    Testing Connection & Sending...
                  </>
                ) : (
                  <>
                    <i className="bi bi-send"></i> Send Test Email
                  </>
                )}
              </button>
            </div>
          </div>

          {testResult && (
            <div className={`alert alert-${testResult.success ? 'success' : 'danger'} border-0 rounded-4 mt-3 p-3 d-flex align-items-start gap-2 mb-0`}>
              <i className={`bi bi-${testResult.success ? 'check-circle-fill' : 'x-circle-fill'} fs-5 mt-1`}></i>
              <div className="small">
                <strong>{testResult.success ? 'Success!' : 'SMTP Connection Failed:'}</strong> {testResult.message}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MailSettings;
