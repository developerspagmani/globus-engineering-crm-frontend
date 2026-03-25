'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await api.post('/auth/signup', formData);
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create account');
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
                  <h2 className="fw-900 text-dark tracking-tight mb-2">Sign Up</h2>
                  <p className="text-muted small px-3">Join the Globus Engineering Ecosystem</p>
                </div>

                {error && (
                  <div className="error-badge mb-4 animate-shake">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="alert alert-success border-0 rounded-4 py-3 animate-fade-in mb-4">
                    <div className="d-flex align-items-center gap-3">
                       <i className="bi bi-check-circle-fill fs-4"></i>
                       <span className="small fw-700">Account created! Redirecting to login...</span>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="px-md-2">
                  {/* Full Name Input */}
                  <div className="mb-4">
                    <label className="field-label">Full Name</label>
                    <div className="premium-input-wrapper">
                      <div className="input-icon">
                        <i className="bi bi-person"></i>
                      </div>
                      <input
                        type="text"
                        className="premium-input"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Email Input */}
                  <div className="mb-4">
                    <label className="field-label">Work Email</label>
                    <div className="premium-input-wrapper">
                      <div className="input-icon">
                        <i className="bi bi-envelope-at"></i>
                      </div>
                      <input
                        type="email"
                        className="premium-input"
                        placeholder="name@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="mb-4">
                    <label className="field-label">Security Key</label>
                    <div className="premium-input-wrapper">
                      <div className="input-icon">
                        <i className="bi bi-shield-lock-fill"></i>
                      </div>
                      <input
                        type="password"
                        className="premium-input"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Confirm Password Input */}
                  <div className="mb-5">
                    <label className="field-label">Verify Secret</label>
                    <div className="premium-input-wrapper">
                      <div className="input-icon">
                        <i className="bi bi-shield-check"></i>
                      </div>
                      <input
                        type="password"
                        className="premium-input"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="btn-auth-primary d-flex align-items-center justify-content-center gap-2"
                    disabled={loading || success}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        <span>Provisioning...</span>
                      </>
                    ) : (
                      <>
                        <span>Join Ecosystem</span>
                        <i className="bi bi-arrow-right-short fs-4"></i>
                      </>
                    )}
                  </button>

                  <div className="text-center mt-4">
                    <p className="x-small text-muted mb-0 fw-600">
                      Already have access? <Link href="/login" className="text-primary text-decoration-none fw-800">Authenticate Here</Link>
                    </p>
                  </div>
                </form>
              </div>

              <div className="card-status-bar">
                <div className="status-indicator"></div>
                <span className="x-small text-muted fw-700 tracking-widest text-uppercase">Enrollment Terminal Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
