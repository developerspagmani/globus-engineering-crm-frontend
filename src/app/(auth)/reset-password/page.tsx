'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const api = (await import('@/lib/axios')).default;
      await api.post('/auth/reset-password', { email, password });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password');
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
                  <p className="text-muted small px-3">Update your access key directly</p>
                </div>

                {error && (
                  <div className="error-badge mb-4 animate-shake">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    <span>{error}</span>
                  </div>
                )}
                
                {!submitted ? (
                  <form onSubmit={handleSubmit} className="px-md-2">
                    <div className="mb-4">
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
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={6}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn-auth-primary d-flex align-items-center justify-content-center gap-2 mb-3"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <span>Save Password</span>
                          <i className="bi bi-check-circle-fill fs-6"></i>
                        </>
                      )}
                    </button>
                    
                    <div className="text-center mt-4">
                      <Link href="/login" className="x-small text-accent fw-800 text-decoration-none text-uppercase tracking-wider">
                        Return to Login
                      </Link>
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-4 animate-fade-in">
                    <div className="mb-4 text-success">
                      <div className="bg-success bg-opacity-10 d-inline-block p-4 rounded-circle mb-3">
                        <i className="bi bi-shield-check fs-1"></i>
                      </div>
                    </div>
                    <h4 className="fw-900 text-dark mb-2">Password Updated</h4>
                    <p className="small text-muted mb-5">Your password has been successfully updated in the database. You can now use it to log in.</p>
                    <Link href="/login" className="btn btn-outline-primary rounded-pill px-5 fw-800 tracking-wider text-uppercase small">
                      Return to Login
                    </Link>
                  </div>
                )}
              </div>

              <div className="card-status-bar">
                <div className="status-indicator"></div>
                <span className="x-small text-muted fw-700 tracking-widest text-uppercase">Recovery System Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
