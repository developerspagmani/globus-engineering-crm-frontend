'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { useParams } from 'next/navigation';
import CustomerForm from '@/modules/customer/components/CustomerForm';
import ModuleGuard from '@/components/ModuleGuard';
import Link from 'next/link';

export default function EditCustomerPage() {
  const params = useParams();
  const id = params.id as string;

  const customer = useSelector((state: RootState) =>
    state.customers.items.find(c => c.id === id)
  );

  return (
    <ModuleGuard moduleId="mod_customer">
      <div className="container-fluid py-4">
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link href="/customers" className="text-decoration-none">Customers</Link></li>
            <li className="breadcrumb-item active" aria-current="page">Edit Profile</li>
          </ol>
        </nav>

        {!customer ? (
          <div className="alert alert-warning">
            Customer with ID: {id} not found.
          </div>
        ) : (
          <>
            <div className="mb-4">
              <h2 className="fw-bold mb-1">Edit: {customer.name}</h2>
              <p className="text-muted small mb-0">Update account details for {customer.company}.</p>
            </div>
            <CustomerForm mode="edit" initialData={customer} />
          </>
        )}
      </div>
    </ModuleGuard>
  );
}
