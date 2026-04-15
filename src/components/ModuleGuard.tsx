'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { useRouter } from 'next/navigation';

interface ModuleGuardProps {
  moduleId: string;
  children: React.ReactNode;
  requiredRole?: string | string[];
}

const ModuleGuard: React.FC<ModuleGuardProps> = ({ moduleId, children, requiredRole }) => {
  const { company, user, isAuthenticated, loading } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Show a simple loader while mounting or during initial auth loading
  if (!mounted || (loading && !isAuthenticated)) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '600px' }}>
        <div className="spinner-border text-secondary" role="status">
          <span className="visually-hidden">Loading permissions...</span>
        </div>
      </div>
    );
  }

  // Super Admin and Company Admin bypass all module guards
  if (user?.role === 'super_admin' || user?.role === 'company_admin') {
    return <>{children}</>;
  }

  const hasModuleAccess = company?.activeModules.includes(moduleId);
  
  // Check role access if specified
  let hasRoleAccess = true;
  if (requiredRole) {
    if (Array.isArray(requiredRole)) {
      hasRoleAccess = requiredRole.includes(user?.role || '');
    } else {
      hasRoleAccess = user?.role === requiredRole;
    }
  }

  if ((!hasModuleAccess || !hasRoleAccess)) {
    return (
      <div className="container py-5 text-center">
        <div className="card border-0 shadow-sm p-5">
          <i className="bi bi-shield-lock text-danger fs-1 mb-3"></i>
          <h3 className="fw-bold">Access Restricted</h3>
          <p className="text-muted small">
            {!hasModuleAccess 
              ? `Your company does not have access to the ${moduleId.replace('mod_', '').replace('_', ' ')} module.`
              : "You do not have the required permissions to access this page."}
          </p>
          <div className="mt-3">
            <button onClick={() => router.push('/dashboard')} className="btn btn-primary btn-sm px-4">
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ModuleGuard;
