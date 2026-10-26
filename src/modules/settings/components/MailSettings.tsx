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
  reminderExecutionTime: string;
  enableSecondaryTime: boolean;
  secondaryExecutionTime: string;
  reminderDaysOfWeek: string[];
  leadSameDayAlert: boolean;
  customReminderDaysBefore: string;
  customReminderDaysAfter: string;
  lastRunTimestamp?: string | null;
  lastRunStats?: { totalSent: number; invoicesSent: number; leadRemindersSent: number } | null;
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
  { id: '60_days', label: '60 Days Before Due Date', desc: 'Early quarter advance notice', category: 'pre_due' },
  { id: '30_days', label: '30 Days Before Due Date', desc: 'Early payment heads-up', category: 'pre_due' },
  { id: '15_days', label: '15 Days Before Due Date', desc: 'Mid-cycle reminder notice', category: 'pre_due' },
  { id: '1_week', label: '7 Days Before Due Date', desc: 'Standard 1-week notice', category: 'pre_due' },
  { id: '3_days', label: '3 Days Before Due Date', desc: 'Imminent due date alert', category: 'pre_due' },
  { id: '1_day', label: '1 Day Before Due Date', desc: 'Pre-due notification', category: 'pre_due' },
  { id: 'today', label: 'On Due Date', desc: 'Due date alert', category: 'pre_due' },
  { id: 'overdue_3_days', label: '3 Days Overdue', desc: 'Grace period overdue alert', category: 'overdue' },
  { id: 'overdue_7_days', label: '7 Days Overdue', desc: 'First overdue notice', category: 'overdue' },
  { id: 'overdue_15_days', label: '15 Days Overdue', desc: 'Urgent overdue notice', category: 'overdue' },
  { id: 'overdue_30_days', label: '30 Days Overdue', desc: 'Critical collection notice', category: 'overdue' },
];

const DAYS_OF_WEEK = [
  { id: 'mon', label: 'Monday', short: 'Mon' },
  { id: 'tue', label: 'Tuesday', short: 'Tue' },
  { id: 'wed', label: 'Wednesday', short: 'Wed' },
  { id: 'thu', label: 'Thursday', short: 'Thu' },
  { id: 'fri', label: 'Friday', short: 'Fri' },
  { id: 'sat', label: 'Saturday', short: 'Sat' },
  { id: 'sun', label: 'Sunday', short: 'Sun' },
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
    leadReminderDays: 1,
    reminderExecutionTime: '10:00',
    enableSecondaryTime: true,
    secondaryExecutionTime: '12:40',
    reminderDaysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
    leadSameDayAlert: true,
    customReminderDaysBefore: '',
    customReminderDaysAfter: '',
    lastRunTimestamp: null,
    lastRunStats: null
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [triggeringManual, setTriggeringManual] = useState(false);
  const [triggerResult, setTriggerResult] = useState<{ success: boolean; message: string; stats?: any } | null>(null);
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
        leadReminderDays: data.leadReminderDays !== undefined ? data.leadReminderDays : 1,
        reminderExecutionTime: data.reminderExecutionTime || '10:00',
        enableSecondaryTime: data.enableSecondaryTime !== undefined ? data.enableSecondaryTime : true,
        secondaryExecutionTime: data.secondaryExecutionTime || '12:40',
        reminderDaysOfWeek: Array.isArray(data.reminderDaysOfWeek) ? data.reminderDaysOfWeek : ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
        leadSameDayAlert: data.leadSameDayAlert !== undefined ? data.leadSameDayAlert : true,
        customReminderDaysBefore: data.customReminderDaysBefore || '',
        customReminderDaysAfter: data.customReminderDaysAfter || '',
        lastRunTimestamp: data.lastRunTimestamp || null,
        lastRunStats: data.lastRunStats || null
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

  const toggleDayOfWeek = (dayId: string) => {
    setFormData(prev => {
      const current = prev.reminderDaysOfWeek || [];
      const updated = current.includes(dayId)
        ? current.filter(id => id !== dayId)
        : [...current, dayId];
      return { ...prev, reminderDaysOfWeek: updated };
    });
  };

  const setAllDaysOfWeek = () => {
    setFormData(prev => ({
      ...prev,
      reminderDaysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
    }));
  };

  const setWeekdaysOnly = () => {
    setFormData(prev => ({
      ...prev,
      reminderDaysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri']
    }));
  };

  const handleTriggerManualReminders = async () => {
    if (!activeCompany?.id) return;
    setTriggeringManual(true);
    setTriggerResult(null);
    try {
      const res = await api.post('/settings/mail/run-reminders', {
        company_id: activeCompany.id
      });
      setTriggerResult({
        success: true,
        message: res.data.message || 'Automated reminders check executed successfully!',
        stats: {
          totalSent: res.data.totalSent,
          invoicesSent: res.data.invoicesSent,
          leadRemindersSent: res.data.leadRemindersSent
        }
      });
      setFormData(prev => ({
        ...prev,
        lastRunTimestamp: res.data.lastRunTimestamp,
        lastRunStats: {
          totalSent: res.data.totalSent,
          invoicesSent: res.data.invoicesSent,
          leadRemindersSent: res.data.leadRemindersSent
        }
      }));
    } catch (err: any) {
      console.error('Failed to trigger manual reminders:', err);
      setTriggerResult({
        success: false,
        message: err.response?.data?.error || err.message || 'Failed to trigger automated reminders.'
      });
    } finally {
      setTriggeringManual(false);
    }
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
        leadReminderDays: Number(formData.leadReminderDays) || 1,
        reminderExecutionTime: formData.reminderExecutionTime || '10:00',
        enableSecondaryTime: formData.enableSecondaryTime,
        secondaryExecutionTime: formData.secondaryExecutionTime || '12:40',
        reminderDaysOfWeek: formData.reminderDaysOfWeek,
        leadSameDayAlert: formData.leadSameDayAlert,
        customReminderDaysBefore: formData.customReminderDaysBefore || '',
        customReminderDaysAfter: formData.customReminderDaysAfter || ''
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
      }, {
        timeout: 30000
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

              {/* Live Scheduler Status & On-Demand Run Bar */}
              <div className="col-12">
                <div className="p-4 bg-dark text-white rounded-4 border shadow-sm">
                  <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
                    <div className="d-flex align-items-center gap-3">
                      <div className="badge bg-warning bg-opacity-25 text-warning p-3 rounded-circle fs-4">
                        <i className="bi bi-clock-history"></i>
                      </div>
                      <div>
                        <div className="d-flex align-items-center gap-2">
                          <h6 className="fw-bold mb-0 text-white fs-6">Automated Email Reminders Engine</h6>
                          <span className={`badge rounded-pill ${formData.enableAutoReminders || formData.enableLeadReminders ? 'bg-success' : 'bg-secondary'}`}>
                            {formData.enableAutoReminders || formData.enableLeadReminders ? 'Engine Active' : 'Engine Inactive'}
                          </span>
                        </div>
                        <p className="text-secondary small mb-0 mt-1">
                          Dynamic background scheduler dispatches payment invoices and sales lead visit alerts automatically based on configured dates and times.
                        </p>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <button
                        type="button"
                        className="btn btn-warning text-dark fw-bold rounded-pill px-4 py-2 d-flex align-items-center gap-2 shadow-sm"
                        onClick={handleTriggerManualReminders}
                        disabled={triggeringManual || (!formData.enableAutoReminders && !formData.enableLeadReminders)}
                        title="Run an immediate reminder sweep right now without waiting for scheduled time"
                      >
                        {triggeringManual ? (
                          <>
                            <span className="spinner-border spinner-border-sm text-dark" role="status" aria-hidden="true"></span>
                            <span>Executing Sweep...</span>
                          </>
                        ) : (
                          <>
                            <i className="bi bi-play-circle-fill fs-5"></i>
                            <span>Run Reminders Now</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {triggerResult && (
                    <div className={`alert alert-${triggerResult.success ? 'success' : 'danger'} border-0 rounded-3 py-2 px-3 mb-3 small d-flex align-items-center justify-content-between`}>
                      <div className="d-flex align-items-center gap-2">
                        <i className={`bi ${triggerResult.success ? 'bi-check-circle-fill text-success' : 'bi-exclamation-triangle-fill text-danger'}`}></i>
                        <span>{triggerResult.message}</span>
                      </div>
                      <button type="button" className="btn-close btn-sm shadow-none" onClick={() => setTriggerResult(null)}></button>
                    </div>
                  )}

                  <div className="row g-3 pt-2 text-white-50 small border-top border-secondary border-opacity-50">
                    <div className="col-md-3 col-sm-6">
                      <div className="text-muted x-small text-uppercase fw-bold">Primary Dispatch Time</div>
                      <div className="text-white fw-bold fs-6">
                        <i className="bi bi-alarm text-warning me-1"></i>
                        {formData.reminderExecutionTime || '10:00'} (IST)
                      </div>
                    </div>
                    <div className="col-md-3 col-sm-6">
                      <div className="text-muted x-small text-uppercase fw-bold">Secondary Slot</div>
                      <div className="text-white fw-bold fs-6">
                        {formData.enableSecondaryTime ? (
                          <>
                            <i className="bi bi-clock text-info me-1"></i>
                            {formData.secondaryExecutionTime || '12:40'} (IST)
                          </>
                        ) : (
                          <span className="text-muted">Disabled</span>
                        )}
                      </div>
                    </div>
                    <div className="col-md-3 col-sm-6">
                      <div className="text-muted x-small text-uppercase fw-bold">Active Days</div>
                      <div className="text-white fw-bold fs-6">
                        <i className="bi bi-calendar-week text-primary me-1"></i>
                        {formData.reminderDaysOfWeek?.length === 7 
                          ? 'Everyday' 
                          : formData.reminderDaysOfWeek?.length === 5 && !formData.reminderDaysOfWeek?.includes('sat') && !formData.reminderDaysOfWeek?.includes('sun')
                            ? 'Mon - Fri'
                            : `${formData.reminderDaysOfWeek?.length || 0} Days/Week`}
                      </div>
                    </div>
                    <div className="col-md-3 col-sm-6">
                      <div className="text-muted x-small text-uppercase fw-bold">Last Execution</div>
                      <div className="text-white fw-bold fs-6">
                        <i className="bi bi-activity text-success me-1"></i>
                        {formData.lastRunTimestamp ? new Date(formData.lastRunTimestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Pending Today'}
                        {formData.lastRunStats && (
                          <span className="ms-1 badge bg-secondary x-small">
                            {formData.lastRunStats.totalSent} sent
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Date & Time Scheduling Configuration Section */}
              <div className="col-12">
                <div className="p-4 bg-white rounded-4 border">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <i className="bi bi-clock text-primary fs-5"></i>
                    <div>
                      <h6 className="fw-bold mb-0 text-dark">Time &amp; Frequency Dispatch Configuration</h6>
                      <p className="text-muted small mb-0">Configure the exact times of day and active calendar days when email reminders are dispatched.</p>
                    </div>
                  </div>

                  <div className="row g-4">
                    {/* Primary Execution Time */}
                    <div className="col-md-6 col-lg-3">
                      <label className="form-label small fw-semibold text-muted">
                        Primary Dispatch Time <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-light text-primary">
                          <i className="bi bi-alarm-fill"></i>
                        </span>
                        <input
                          type="time"
                          name="reminderExecutionTime"
                          className="form-control shadow-none fw-bold"
                          value={formData.reminderExecutionTime}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="form-text text-muted" style={{ fontSize: '11px' }}>
                        Morning reminder delivery slot (IST).
                      </div>
                    </div>

                    {/* Secondary Slot Toggle & Time */}
                    <div className="col-md-6 col-lg-4">
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <label className="form-label small fw-semibold text-muted mb-0">
                          Secondary Afternoon Dispatch Slot
                        </label>
                        <div className="form-check form-switch m-0">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            id="enableSecondaryTime"
                            name="enableSecondaryTime"
                            checked={formData.enableSecondaryTime}
                            onChange={handleInputChange}
                            style={{ cursor: 'pointer' }}
                          />
                        </div>
                      </div>
                      <div className="input-group">
                        <span className="input-group-text bg-light text-info">
                          <i className="bi bi-clock-fill"></i>
                        </span>
                        <input
                          type="time"
                          name="secondaryExecutionTime"
                          className="form-control shadow-none fw-bold"
                          value={formData.secondaryExecutionTime}
                          onChange={handleInputChange}
                          disabled={!formData.enableSecondaryTime}
                        />
                      </div>
                      <div className="form-text text-muted" style={{ fontSize: '11px' }}>
                        {formData.enableSecondaryTime ? 'Afternoon reminder delivery slot (IST).' : 'Secondary slot is currently disabled.'}
                      </div>
                    </div>

                    {/* Timezone Info */}
                    <div className="col-md-12 col-lg-5">
                      <label className="form-label small fw-semibold text-muted">
                        System Scheduling Timezone
                      </label>
                      <div className="p-2 px-3 bg-light rounded-3 border d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-2">
                          <i className="bi bi-globe-americas text-primary fs-5"></i>
                          <div>
                            <div className="fw-bold small text-dark">Indian Standard Time (IST)</div>
                            <div className="text-muted x-small">Asia/Kolkata (UTC+05:30)</div>
                          </div>
                        </div>
                        <span className="badge bg-primary-subtle text-primary fw-semibold px-2 py-1">
                          Server Live
                        </span>
                      </div>
                    </div>

                    {/* Active Dispatch Days */}
                    <div className="col-12 pt-2 border-top">
                      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                        <label className="form-label small fw-semibold text-muted mb-0">
                          Allowed Dispatch Days of the Week
                        </label>
                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-0"
                            style={{ fontSize: '0.75rem' }}
                            onClick={setWeekdaysOnly}
                          >
                            Weekdays (Mon-Fri)
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-0"
                            style={{ fontSize: '0.75rem' }}
                            onClick={setAllDaysOfWeek}
                          >
                            Everyday (Mon-Sun)
                          </button>
                        </div>
                      </div>

                      <div className="d-flex flex-wrap gap-2">
                        {DAYS_OF_WEEK.map(day => {
                          const isSelected = formData.reminderDaysOfWeek?.includes(day.id);
                          return (
                            <button
                              key={day.id}
                              type="button"
                              className={`btn btn-sm rounded-pill px-3 py-2 transition-all d-flex align-items-center gap-2 ${isSelected ? 'btn-primary shadow-sm fw-bold' : 'btn-light border text-muted'}`}
                              onClick={() => toggleDayOfWeek(day.id)}
                            >
                              <i className={`bi ${isSelected ? 'bi-check-circle-fill' : 'bi-circle'}`}></i>
                              <span>{day.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Automated Payment Reminders Schedule Section */}
              <div className="col-12">
                <div className="p-4 bg-white rounded-4 border">
                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
                    <div>
                      <h6 className="fw-bold mb-1 d-flex align-items-center gap-2 text-dark">
                        <i className="bi bi-file-earmark-check text-primary fs-5"></i> Automated Invoice Payment Reminders (Date-Based Milestones)
                      </h6>
                      <p className="text-muted small mb-0">
                        Select which date offsets before and after invoice payment due dates trigger automated reminder emails with attached PDF copies.
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
                    <div className="pt-2">
                      {/* Pre-Due Milestones */}
                      <div className="mb-3">
                        <div className="text-muted x-small fw-bold text-uppercase mb-2 d-flex align-items-center gap-1">
                          <i className="bi bi-calendar-minus text-primary"></i> Pre-Due Date Notifications (Upcoming Payment Alerts)
                        </div>
                        <div className="row g-2">
                          {REMINDER_OPTIONS.filter(o => o.category === 'pre_due').map((opt) => {
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
                                    onChange={() => {}}
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
                      </div>

                      {/* Overdue Notices */}
                      <div className="mb-3">
                        <div className="text-muted x-small fw-bold text-uppercase mb-2 d-flex align-items-center gap-1">
                          <i className="bi bi-exclamation-triangle-fill text-danger"></i> Overdue Payment Notices (Post Due-Date Reminders)
                        </div>
                        <div className="row g-2">
                          {REMINDER_OPTIONS.filter(o => o.category === 'overdue').map((opt) => {
                            const isChecked = formData.reminderSchedule?.includes(opt.id);
                            return (
                              <div key={opt.id} className="col-md-3 col-sm-6">
                                <div 
                                  className={`p-3 rounded-3 border d-flex align-items-start gap-2 cursor-pointer transition-all ${isChecked ? 'bg-danger-subtle border-danger-subtle' : 'bg-light border-light'}`}
                                  onClick={() => toggleReminderOption(opt.id)}
                                  style={{ cursor: 'pointer' }}
                                >
                                  <input
                                    type="checkbox"
                                    className="form-check-input mt-1"
                                    checked={isChecked}
                                    onChange={() => {}}
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
                      </div>

                      {/* Custom Additional Offsets */}
                      <div className="p-3 bg-light rounded-3 border">
                        <div className="row g-3">
                          <div className="col-md-6">
                            <label className="form-label small fw-semibold text-muted mb-1">
                              Custom Days Before Due Date <span className="fw-normal">(Optional, comma-separated)</span>
                            </label>
                            <input
                              type="text"
                              name="customReminderDaysBefore"
                              className="form-control form-control-sm shadow-none"
                              placeholder="e.g. 45, 20, 5"
                              value={formData.customReminderDaysBefore}
                              onChange={handleInputChange}
                            />
                            <div className="form-text text-muted" style={{ fontSize: '11px' }}>
                              Add custom advance milestone days (e.g. 45 for 45 days before due date).
                            </div>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small fw-semibold text-muted mb-1">
                              Custom Overdue Days After Due Date <span className="fw-normal">(Optional, comma-separated)</span>
                            </label>
                            <input
                              type="text"
                              name="customReminderDaysAfter"
                              className="form-control form-control-sm shadow-none"
                              placeholder="e.g. 10, 21, 60"
                              value={formData.customReminderDaysAfter}
                              onChange={handleInputChange}
                            />
                            <div className="form-text text-muted" style={{ fontSize: '11px' }}>
                              Add custom overdue notice days (e.g. 21 for 21 days past due date).
                            </div>
                          </div>
                        </div>
                      </div>
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
                        <i className="bi bi-calendar-check text-success fs-5"></i> Automated Lead Visit Reminders (Date &amp; Time Based)
                      </h6>
                      <p className="text-muted small mb-0">
                        Configure advance notice days and same-day morning alerts dispatched to assigned Sales Persons before scheduled client visits.
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
                            Send Advance Reminder (Days Before Visit Date)
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

                      {/* Same-Day Visit Morning Alert Option */}
                      <div className="mt-3 p-3 bg-light rounded-3 border d-flex align-items-center justify-content-between flex-wrap gap-3">
                        <div className="d-flex align-items-center gap-3">
                          <div className="badge bg-warning-subtle text-warning-emphasis p-2 rounded-circle fs-5">
                            <i className="bi bi-sun-fill"></i>
                          </div>
                          <div>
                            <div className="fw-bold small text-dark">Same-Day Morning Visit Alert</div>
                            <div className="text-muted x-small">
                              Additionally send a prompt alert on the morning of the visit date itself at {formData.reminderExecutionTime || '10:00'}.
                            </div>
                          </div>
                        </div>

                        <div className="form-check form-switch m-0">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            id="leadSameDayAlert"
                            name="leadSameDayAlert"
                            checked={formData.leadSameDayAlert}
                            onChange={handleInputChange}
                            style={{ cursor: 'pointer' }}
                          />
                          <label className="form-check-label fw-semibold small ms-2" htmlFor="leadSameDayAlert" style={{ cursor: 'pointer' }}>
                            {formData.leadSameDayAlert ? 'Enabled' : 'Disabled'}
                          </label>
                        </div>
                      </div>

                      <div className="mt-3 p-3 bg-success-subtle bg-opacity-25 rounded-3 border border-success-subtle d-flex align-items-center gap-3">
                        <div className="badge bg-success text-white p-2 rounded-circle fs-5">
                          <i className="bi bi-check2-circle"></i>
                        </div>
                        <div className="small text-dark">
                          <strong>Active Schedule Rule:</strong> Sales Persons will receive visit reminder notifications <strong>{formData.leadReminderDays} day{Number(formData.leadReminderDays) > 1 ? 's' : ''}</strong> in advance {formData.leadSameDayAlert ? 'and on the visit morning itself ' : ''}at <strong>{formData.reminderExecutionTime || '10:00'} IST</strong> {formData.enableSecondaryTime ? `(and afternoon check at ${formData.secondaryExecutionTime || '12:40'} IST)` : ''}.
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
