'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const api = (await import('@/lib/axios')).default;
      const res = await api.post('/auth/forgot-password', { email });
      setSuccessMsg(res.data.message || 'OTP sent successfully!');
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const api = (await import('@/lib/axios')).default;
      await api.post('/auth/reset-password-otp', { email, otp, newPassword });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password. Check your OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-root min-vh-100 d-flex align-items-center justify-content-center">
      {/* Dynamic Background Elements */}
      <div className="ambient-blob blob-1"></div>
      <div className="ambient-blob blob-2"></div>
      <div className="ambient-blob blob-3"></div>

      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-10 col-lg-8 col-xl-5">
            <div className="premium-auth-card animate-fade-in shadow-2xl overflow-hidden">
              {/* Decorative Top Bar */}
              <div className="auth-accent-bar"></div>

              <div className="p-4 p-md-5 bg-white">
                {/* Header Section */}
                <div className="text-center mb-5">
                  <h2 className="fw-900 text-dark tracking-tight mb-2">Reset Password</h2>
                  <p className="text-muted small px-3">
                    {step === 1 ? 'Enter your email to receive a secure code.' : 'Enter the code from your email to set a new password.'}
                  </p>
                </div>

                {error && (
                  <div className="error-badge mb-4 animate-shake">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    <span>{error}</span>
                  </div>
                )}
                {successMsg && !submitted && (
                  <div className="alert alert-success d-flex align-items-center mb-4 py-2 px-3 small border-0 bg-success bg-opacity-10 text-success fw-bold">
                    <i className="bi bi-check-circle-fill me-2 fs-5"></i>
                    <span>{successMsg}</span>
                  </div>
                )}
                
                {submitted ? (
                  <div className="text-center py-4 animate-fade-up">
                    <div className="success-icon-container mx-auto mb-4 bg-success bg-opacity-10 text-success">
                      <i className="bi bi-check2-circle display-4"></i>
                    </div>
                    <h4 className="fw-800 mb-3 text-dark">Password Updated</h4>
                    <p className="text-muted small mb-5 px-4">
                      Your password has been successfully reset. You can now use your new password to sign in.
                    </p>
                    <Link href="/login" className="btn-auth-outline d-inline-flex align-items-center justify-content-center gap-2">
                      <span>Return to Login</span>
                      <i className="bi bi-arrow-right"></i>
                    </Link>
                  </div>
                ) : step === 1 ? (
                  <form onSubmit={handleSendOtp} className="px-md-2 animate-fade-in">
                    <div className="mb-5">
                      <label className="field-label">Account Email</label>
                      <div className="premium-input-wrapper">
                        <div className="input-icon">
                          <i className="bi bi-envelope-at"></i>
                        </div>
                        <input
                          type="email"
                          className="premium-input"
                          placeholder="identity@globus.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn-auth-primary d-flex align-items-center justify-content-center gap-2 mb-4"
                      disabled={loading || !email}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          <span>Sending Code...</span>
                        </>
                      ) : (
                        <>
                          <span>Send Code</span>
                          <i className="bi bi-send-fill fs-6"></i>
                        </>
                      )}
                    </button>
                    
                    <div className="text-center mt-5">
                      <Link href="/login" className="btn-auth-ghost small">
                        <i className="bi bi-arrow-left me-2"></i>
                        Back to Login
                      </Link>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleResetPassword} className="px-md-2 animate-fade-in">
                    <div className="mb-4">
                      <label className="field-label">Account Email</label>
                      <div className="premium-input-wrapper bg-light opacity-75">
                        <div className="input-icon">
                          <i className="bi bi-envelope-at"></i>
                        </div>
                        <input
                          type="email"
                          className="premium-input bg-transparent"
                          value={email}
                          disabled
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="field-label">6-Digit Code</label>
                      <div className="premium-input-wrapper">
                        <div className="input-icon">
                          <i className="bi bi-shield-lock"></i>
                        </div>
                        <input
                          type="text"
                          className="premium-input"
                          placeholder="e.g. 123456"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          required
                          maxLength={6}
                          style={{ letterSpacing: '2px', fontWeight: 'bold' }}
                        />
                      </div>
                    </div>

                    <div className="mb-5">
                      <label className="field-label">New Password</label>
                      <div className="premium-input-wrapper">
                        <div className="input-icon">
                          <i className="bi bi-key"></i>
                        </div>
                        <input
                          type="password"
                          className="premium-input"
                          placeholder="Enter new password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          minLength={6}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn-auth-primary d-flex align-items-center justify-content-center gap-2 mb-4"
                      disabled={loading || !otp || !newPassword}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          <span>Updating...</span>
                        </>
                      ) : (
                        <>
                          <span>Verify & Reset Password</span>
                          <i className="bi bi-check-circle-fill fs-6"></i>
                        </>
                      )}
                    </button>
                    
                    <div className="text-center mt-5">
                      <button 
                        type="button"
                        onClick={() => setStep(1)} 
                        className="btn-auth-ghost small border-0 bg-transparent"
                      >
                        <i className="bi bi-arrow-left me-2"></i>
                        Use a different email
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
