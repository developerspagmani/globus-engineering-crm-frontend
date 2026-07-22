'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import api from '@/lib/axios';
import { loginStart, loginSuccess, loginFailure } from '@/redux/features/authSlice';
import { RootState } from '@/redux/store';

function LoginForm({ 
  companyId, 
  title, 
  subtitle,
  companies
}: { 
  companyId: string | null, 
  title: string, 
  subtitle: string,
  companies: any[]
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedContext, setSelectedContext] = useState<string>('');
  
  // Sync selectedContext when companyId prop changes
  useEffect(() => {
    if (companyId) {
      setSelectedContext(companyId);
    }
  }, [companyId]);
  const router = useRouter();
  const dispatch = useDispatch();
  
  const [localError, setLocalError] = useState('');
  const [localLoading, setLocalLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCompanyId = selectedContext || companyId;
    if (!finalCompanyId) {
      setLocalError("Company not loaded yet.");
      return;
    }
    setLocalError('');
    setLocalLoading(true);
    dispatch(loginStart());

    try {
      const response = await api.post('/auth/login', { email, password, company_id: finalCompanyId });
      const { user, company, token } = response.data;

      dispatch(loginSuccess({
        user: user,
        company: company || null,
        token: token
      }));
      
      const searchParams = new URLSearchParams(window.location.search);
      const redirect = searchParams.get('redirect');

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
      setLocalLoading(false);
      const errorMsg = err.response?.data?.error || (err.response?.status === 401 ? 'Invalid password' : 'Authentication Failed');
      setLocalError(errorMsg);
      dispatch(loginFailure(errorMsg));
    }
  };

  return (
    <div className="premium-auth-card animate-fade-in shadow-2xl overflow-hidden h-100">
      {/* Decorative Top Bar */}
      <div className="auth-accent-bar"></div>

      <div className="p-4 p-md-5 bg-white h-100 d-flex flex-column">
        {/* Header Section */}
        <div className="text-center mb-5">
          <h2 className="fw-900 text-dark tracking-tight mb-2">{title}</h2>
          <p className="text-muted small px-3">{subtitle}</p>
        </div>

        {localError && (
          <div className="error-badge mb-4 animate-shake">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            <span>{localError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-md-2 flex-grow-1 d-flex flex-column">
          {/* Company Selection */}
          <div className="mb-4">
            <label className="field-label">Organization Context</label>
            <div className="premium-input-wrapper">
              <div className="input-icon">
                <i className="bi bi-building"></i>
              </div>
              <select
                className="premium-input select-field"
                value={selectedContext || companyId || ''}
                onChange={(e) => setSelectedContext(e.target.value)}
                required
              >
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
                <option value="super_admin">System / Super Admin</option>
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
                placeholder="identity@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
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
                autoComplete="new-password"
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

          <div className="mt-auto">
            {/* Submit Button */}
            <button
              type="submit"
              className="btn-auth-primary d-flex align-items-center justify-content-center gap-2 w-100"
              disabled={localLoading || !companyId}
            >
              {localLoading ? (
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
            
          </div>
        </form>
      </div>

      <div className="card-status-bar">
        <div className="status-indicator"></div>
        <span className="x-small text-muted fw-700 tracking-widest">SECURE LINK ESTABLISHED</span>
      </div>
    </div>
  );
}

function LoginContent() {
  const [mounted, setMounted] = useState(false);
  const [dbCompanies, setDbCompanies] = useState<any[]>([]);
  const [globusId, setGlobusId] = useState<string | null>(null);
  const [wingsmanId, setWingsmanId] = useState<string | null>(null);
  
  const searchParams = useSearchParams();
  const msg = searchParams.get('msg');
  const { error } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    setMounted(true);
    // Fetch REAL companies from database
    api.get(`/companies?_t=${Date.now()}`)
      .then(res => {
        const companies = res.data;
        setDbCompanies(companies);
        const gCompany = companies.find((c: any) => c.name.toLowerCase().includes('globus'));
        const wCompany = companies.find((c: any) => 
          c.name.toLowerCase().includes('wingsman') || 
          c.name.toLowerCase().includes('wings')
        );
        if (gCompany) setGlobusId(gCompany.id);
        if (wCompany) {
          setWingsmanId(wCompany.id);
        } else if (companies.length > 1) {
          const secondComp = companies.find((c: any) => c.id !== gCompany?.id);
          if (secondComp) setWingsmanId(secondComp.id);
        } else if (companies.length > 0 && !wCompany) {
          setWingsmanId(companies[0].id);
        }
      })
      .catch(err => console.error('Failed to load companies for login', err));
  }, []);

  if (!mounted) return null;

  return (
    <div className="login-page-root min-vh-100 d-flex align-items-center justify-content-center py-5">
      {/* Dynamic Background Elements */}
      <div className="ambient-blob blob-1"></div>
      <div className="ambient-blob blob-2"></div>
      <div className="ambient-blob blob-3"></div>

      <div className="container position-relative z-1">
        
        {msg === 'session_expired' && !error && (
          <div className="row justify-content-center mb-4">
            <div className="col-12 col-md-8 col-lg-6">
              <div className="alert alert-info border-0 rounded-3 d-flex align-items-center bg-info text-white-50 bg-opacity-10 py-2 shadow-sm" style={{ borderLeft: '4px solid #0dcaf0 !important', backdropFilter: 'blur(10px)' }}>
                <i className="bi bi-info-circle-fill me-3 fs-5 text-info"></i>
                <div>
                  <strong className="d-block text-info">Session Expired</strong>
                  <span className="small text-muted">Please login again to continue.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="row justify-content-center mb-5">
          <div className="col-12 text-center">
            <img src="/IMG-20260422-WA0023.jpg" alt="Globus Engineering Tools" style={{ maxHeight: '120px', objectFit: 'contain' }} />
          </div>
        </div>

        <div className="row justify-content-center g-4">
          <div className="col-12 col-lg-5">
            <LoginForm 
              companyId={globusId} 
              title="Globus" 
              subtitle="Access the Globus Engineering Ecosystem" 
              companies={dbCompanies}
            />
          </div>
          <div className="col-12 col-lg-5">
            <LoginForm 
              companyId={wingsmanId} 
              title="Wingsman" 
              subtitle="Access the Wingsman Portal" 
              companies={dbCompanies}
            />
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
