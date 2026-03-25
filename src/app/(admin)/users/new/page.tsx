'use client';

import React from 'react';
import Link from 'next/link';
import CompanyUserForm from '@/modules/company-user/components/CompanyUserForm';
import Breadcrumb from '@/components/Breadcrumb';

export default function NewUserPage() {
  return (
    <div className="container-fluid py-4 animate-fade-in">
      <div className="mb-4">
        <Breadcrumb 
          items={[
            { label: 'User Management', href: '/users' },
            { label: 'New User', active: true }
          ]} 
        />
        <h2 className="fw-900 tracking-tight text-dark mb-1 mt-2">Add System User</h2>
        <p className="text-muted small mb-0">Create a new account and define their module-specific access rights.</p>
      </div>

      <CompanyUserForm mode="create" />
    </div>
  );
}
