'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import CompanyUserForm from '@/modules/company-user/components/CompanyUserForm';
import Breadcrumb from '@/components/Breadcrumb';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { checkActionPermission } from '@/config/permissions';

export default function ViewUserPage() {
  const { id } = useParams();
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const { items } = useSelector((state: RootState) => state.companyUsers);
  const userToView = items.find(u => u.id === id);

  if (!userToView) {
    return (
      <div className="container-fluid py-5 text-center">
        <h4 className="text-muted">User not found.</h4>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 animate-fade-in">
      <div className="mb-4 d-flex justify-content-between align-items-start">
        <div className="d-flex align-items-center">
          <Link href="/users" className="btn btn-outline-secondary border-0 p-0 me-3 mt-1" title="Back to User Management">
            <i className="bi bi-arrow-left fs-3 text-muted"></i>
          </Link>
          <div>
            <Breadcrumb 
              items={[
                { label: 'User Management', href: '/users' },
                { label: 'View Permissions', active: true }
              ]} 
            />
            <h2 className="fw-900 tracking-tight text-dark mb-1 mt-2">Account Details: {userToView.name}</h2>
            <p className="text-muted small mb-0">View user profile and granular CRUD permissions.</p>
          </div>
        </div>
        {checkActionPermission(currentUser, 'mod_user_management', 'edit') && (
          <Link 
            href={`/users/${userToView.id}/edit`} 
            className="btn btn-primary px-4 py-2 fw-bold shadow-accent rounded-pill d-flex align-items-center gap-2 mt-2"
          >
            <i className="bi bi-pencil-fill"></i> Edit Permissions
          </Link>
        )}
      </div>

      <CompanyUserForm mode="view" initialData={userToView} />
    </div>
  );
}
);
}
