'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import CompanyUserForm from '@/modules/company-user/components/CompanyUserForm';
import Breadcrumb from '@/components/Breadcrumb';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function EditUserPage() {
  const { id } = useParams();
  const { items } = useSelector((state: RootState) => state.companyUsers);
  const userToEdit = items.find(u => u.id === id);

  if (!userToEdit) {
    return (
      <div className="container-fluid py-5 text-center">
        <h4 className="text-muted">User not found.</h4>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 animate-fade-in">
      <div className="mb-4 d-flex align-items-center">
        <Link href="/users" className="btn btn-outline-secondary border-0 p-0 me-3" title="Back to User Management">
          <i className="bi bi-arrow-left fs-3 text-muted"></i>
        </Link>
        <div>
          <Breadcrumb 
            items={[
              { label: 'User Management', href: '/users' },
              { label: 'Edit Permissions', active: true }
            ]} 
          />
          <h2 className="fw-900 tracking-tight text-dark mb-1 mt-2">Manage Account: {userToEdit.name}</h2>
          <p className="text-muted small mb-0">Update user profile and modify granular CRUD permissions.</p>
        </div>
      </div>

      <CompanyUserForm mode="edit" initialData={userToEdit} />
    </div>
  );
}
