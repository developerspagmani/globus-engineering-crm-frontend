'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';
import EmployeeForm from '@/modules/employee/components/EmployeeForm';

const NewEmployeePage = () => {
  const router = useRouter();
  return (
    <div className="content-area animate-fade-in">
      <div className="mb-4">
        <Breadcrumb 
          items={[
            { label: 'Employee Hub', href: '/employees' },
            { label: 'New Employee', active: true }
          ]} 
        />
        <div className="d-flex align-items-center">
          <button type="button" className="back-btn-standard" onClick={() => router.push('/employees')} title="Back to Employees">
             <i className="bi bi-arrow-left fs-3 "></i>
          </button>
          <div>
            <h3 className="fw-800 tracking-tight text-dark mb-0 mt-2">Register Employee</h3>
            <p className="text-muted small mb-0">Create a new employment profile for industrial or office staff.</p>
          </div>
        </div>
      </div>

      <div className="row justify-content-center">
        <div className="col-xl-12">
          <EmployeeForm mode="create" />
        </div>
      </div>
    </div>
  );
};

export default NewEmployeePage;

ge;

