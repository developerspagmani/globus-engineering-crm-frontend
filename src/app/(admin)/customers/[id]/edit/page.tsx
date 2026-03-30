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
        {!customer ? (
          <div className="alert alert-warning">
            Customer with ID: {id} not found.
          </div>
        ) : (
          <>
            <div className="d-flex align-items-center mb-5 pb-2">
              <Link href="/customers" className="btn btn-outline-secondary border-0 p-0 me-3" title="Back to Customers">
                <i className="bi bi-arrow-left-circle fs-3 text-muted"></i>
              </Link>
              <div>
                <h2 className="fw-bold mb-0">Edit Customer :</h2>
                <p className="text-muted small mb-0">Update account details for {customer.company}.</p>
              </div>
            </div>
            <CustomerForm mode="edit" initialData={customer} />
          </>
        )}
      </div>
    </ModuleGuard>
  );
}
