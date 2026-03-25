'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { useRouter } from 'next/navigation';

interface ModuleGuardProps {
  moduleId: string;
  children: React.ReactNode;
}

const ModuleGuard: React.FC<ModuleGuardProps> = ({ moduleId, children }) => {
  const { company, user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const router = useRouter();

  // Super Admin bypasses all module guards
  if (user?.role === 'super_admin') {
    return <>{children}</>;
  }

  const hasAccess = company?.activeModules.includes(moduleId);

  if (!hasAccess && isAuthenticated) {
    return (
      <div className="container py-5 text-center">
        <div className="card border-0 shadow-sm p-5">
          <i className="bi bi-shield-lock text-danger fs-1 mb-3"></i>
          <h3 className="fw-bold">Module Restricted</h3>
          <p className="text-muted">Your company does not have access to this module. Please contact your administrator to upgrade your plan.</p>
          <div className="mt-3">
            <button onClick={() => router.push('/dashboard')} className="btn btn-primary">
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
