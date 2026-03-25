'use client';

import React from 'react';
import Breadcrumb from '@/components/Breadcrumb';
import EmployeeForm from '@/modules/employee/components/EmployeeForm';

const NewEmployeePage = () => {
  return (
    <div className="content-area animate-fade-in">
      <div className="mb-4">
        <Breadcrumb 
          items={[
            { label: 'Employee Hub', href: '/employees' },
            { label: 'New Employee', active: true }
          ]} 
        />
        <h3 className="fw-800 tracking-tight text-dark mb-0 mt-2">Register Employee</h3>
        <p className="text-muted small mb-0">Create a new employment profile for industrial or office staff.</p>
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
