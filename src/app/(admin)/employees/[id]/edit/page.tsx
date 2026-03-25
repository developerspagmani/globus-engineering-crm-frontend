'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import Breadcrumb from '@/components/Breadcrumb';
import EmployeeForm from '@/modules/employee/components/EmployeeForm';

const EditEmployeePage = () => {
  const [mounted, setMounted] = useState(false);
  const { id } = useParams();
  const router = useRouter();

  const { items } = useSelector((state: RootState) => state.employee);
  const employee = items.find(item => item.id === id);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (!employee) {
    return (
      <div className="content-area text-center py-5">
        <i className="bi bi-exclamation-triangle text-warning mb-3" style={{ fontSize: '3rem' }}></i>
        <h4 className="fw-800 text-dark">Employee Not Found</h4>
        <p className="text-muted">The profile you are looking for does not exist or has been removed.</p>
        <button className="btn btn-primary rounded-pill px-4 mt-3" onClick={() => router.push('/employees')}>
          Back to Hub
        </button>
      </div>
    );
  }

  return (
    <div className="content-area animate-fade-in">
      <div className="mb-4">
        <Breadcrumb 
          items={[
            { label: 'Employee Hub', href: '/employees' },
            { label: 'Edit Profile', active: true }
          ]} 
        />
        <h3 className="fw-800 tracking-tight text-dark mb-0 mt-2">Edit: {employee.name}</h3>
        <p className="text-muted small mb-0">Update career details, department, or status for {employee.employeeId}.</p>
      </div>

      <div className="row justify-content-center">
        <div className="col-xl-12">
          <EmployeeForm mode="edit" initialData={employee} />
        </div>
      </div>
    </div>
  );
};

export default EditEmployeePage;
