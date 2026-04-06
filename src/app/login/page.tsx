'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import api from '@/lib/axios';
import { loginStart, loginSuccess, loginFailure } from '@/redux/features/authSlice';
import { RootState } from '@/redux/store';
import { mockCompanies, mockUsers } from '@/data/mockModules';

function LoginContent() {
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [company_id, setcompany_id] = useState('');
  const [dbCompanies, setDbCompanies] = useState<any[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const msg = searchParams.get('msg');
  const redirect = searchParams.get('redirect');

  useEffect(() => {
    setMounted(true);
    // Fetch REAL companies from database for the dropdown
    api.get('/companies')
      .then(res => {
        setDbCompanies(res.data);
        if (res.data.length > 0) {
            setcompany_id(res.data[0].id);
        }
      })
      .catch(err => console.error('Failed to load companies for login', err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(loginStart());

    try {
      const response = await api.post('/auth/login', { email, password, company_id });
      const { user, company, token } = response.data;

      dispatch(loginSuccess({
        user: user,
        company: company || null,
        token: token
      }));
      
      // Use role-based redirection if no specific redirect is requested
      if (redirect && !redirect.includes('/login')) {
        router.push(redirect);
      } else if (user.role === 'sales') {
        router.push('/stores');
      } else if (user.role === 'staff') {
        router.push('/customers');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      // Use silent handling for 401 to prevent Turbopack error frames from showing up
      const errorMsg = err.response?.data?.error || (err.response?.status === 401 ? 'Invalid password' : 'Authentication Failed');
      dispatch(loginFailure(errorMsg));
    }
  };

  if (!mounted) return null;

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
                  <h2 className="fw-900 text-dark tracking-tight mb-2">Login</h2>
                  <p className="text-muted small px-3">Access the Globus Engineering Ecosystem</p>
                </div>

                {msg === 'session_expired' && !error && (
                  <div className="alert alert-info border-0 rounded-3 mb-4 d-flex align-items-center bg-info text-white-50 bg-opacity-10 py-2" style={{ borderLeft: '4px solid #0dcaf0 !important' }}>
                    <i className="bi bi-info-circle-fill me-3 fs-5 text-info"></i>
                    <div>
                      <strong className="d-block text-info">Session Expired</strong>
                      <span className="small text-muted">Please login again to continue.</span>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="error-badge mb-4 animate-shake">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="px-md-2">
                  {/* Company Selection */}
                  <div className="mb-4">
                    <label className="field-label">Organization Context</label>
                    <div className="premium-input-wrapper">
                      <div className="input-icon">
                        <i className="bi bi-building"></i>
                      </div>
                      <select
                        className="premium-input select-field"
                        value={company_id}
                        onChange={(e) => setcompany_id(e.target.value)}
                        required
                      >
                        <option value="super_admin">System / Super Admin</option>
                        {dbCompanies.map(comp => (
                          <option key={comp.id} value={comp.id}>{comp.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Email Input */}
                  <div className="mb-4">
                    <label className="field-label">Enterprise Identity</label>
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

                  {/* Password Input */}
                  <div className="mb-5">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label className="field-label mb-0">Secure Key</label>
                      <Link href="/reset-password" id="forgot-link" className="text-accent x-small fw-800 text-decoration-none">
                        Reset Password?
                      </Link>
                    </div>
                    <div className="premium-input-wrapper">
                      <div className="input-icon">
                        <i className="bi bi-shield-lock-fill"></i>
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        className="premium-input"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="reveal-btn"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <i className={`bi ${showPassword ? 'bi-eye' : 'bi-eye-slash'}`}></i>
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    id="submit-auth"
                    className="btn-auth-primary d-flex align-items-center justify-content-center gap-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>Login</span>
                        <i className="bi bi-arrow-right-short fs-4"></i>
                      </>
                    )}
                  </button>

                  <div className="text-center mt-4">
                    <p className="x-small text-muted mb-0 fw-600">
                      Don't have an account? <Link href="/signup" className="text-primary text-decoration-none fw-800">Create an account</Link>
                    </p>
                  </div>
                </form>
              </div>

              <div className="card-status-bar">
                <div className="status-indicator"></div>
                <span className="x-small text-muted fw-700 tracking-widest">SECURE LINK ESTABLISHED</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-vh-100 d-flex align-items-center justify-content-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
