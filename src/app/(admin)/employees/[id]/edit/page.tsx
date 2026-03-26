'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import Breadcrumb from '@/components/Breadcrumb';
import EmployeeForm from '@/modules/employee/components/EmployeeForm';

const EditEmployeePage = () => {
  const [mounted, setMounted] = useState(false);
  const { id } = useParams();
  const router = useRouter();

  const { items } = useSelector((state: RootState) => state.employee);
  const { company: activeCompany } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const employee = items.find(item => String(item.id) === String(id));

  useEffect(() => {
    setMounted(true);
    if ((items.length === 0 || !employee) && activeCompany?.id) {
       import('@/redux/features/employeeSlice').then(({ fetchEmployees }) => {
          (dispatch as any)(fetchEmployees(activeCompany.id));
       });
    }
  }, [dispatch, activeCompany?.id, items.length, employee, id]);

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
      </div>
      <div className="mb-4 d-flex align-items-center">
        <button type="button" className="btn btn-outline-secondary border-0 p-0 me-3" onClick={() => router.push('/employees')} title="Back to Employees">
           <i className="bi bi-arrow-left-circle fs-3 text-muted"></i>
        </button>
        <div>
          <h3 className="fw-800 tracking-tight text-dark mb-0 mt-2">Edit Employee Profile</h3>
          <p className="text-muted small mb-0">Update personal or professional details for {employee?.name || 'staff member'}.</p>
        </div>
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
