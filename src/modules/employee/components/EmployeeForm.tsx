'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '@/redux/store';
import { addEmployee, updateEmployee } from '@/redux/features/employeeSlice';
import { Employee } from '@/types/modules';
import StatusModal from '@/components/StatusModal';

interface EmployeeFormProps {
  initialData?: Employee;
  mode: 'create' | 'edit';
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ initialData, mode }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { company: activeCompany } = useSelector((state: RootState) => state.auth);

  const [formData, setFormData] = useState<Omit<Employee, 'id'>>({
    employeeId: `GLOB-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    name: '',
    email: '',
    phone: '',
    department: 'Engineering',
    designation: '',
    company_id: activeCompany?.id || '',
    salary: 0,
    joiningDate: new Date().toISOString().split('T')[0],
    status: 'active',
    createdAt: new Date().toISOString()
  });

  const [modal, setModal] = useState<{ isOpen: boolean; type: 'success' | 'error'; title: string; message: string }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        employeeId: initialData.employeeId,
        name: initialData.name,
        email: initialData.email,
        phone: initialData.phone,
        department: initialData.department,
        designation: initialData.designation,
        company_id: initialData.company_id,
        salary: initialData.salary,
        joiningDate: initialData.joiningDate,
        status: initialData.status,
        createdAt: initialData.createdAt
      });
    }
  }, [initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'salary' ? parseFloat(value) || 0 : value,
      company_id: prev.company_id || activeCompany?.id || ''
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === 'create') {
        (dispatch as any)(addEmployee(formData));
        setModal({
          isOpen: true,
          type: 'success',
          title: 'Employee Registered!',
          message: `${formData.name} has been added to the system.`
        });
      } else {
        (dispatch as any)(updateEmployee({ ...initialData!, ...formData }));
        setModal({
          isOpen: true,
          type: 'success',
          title: 'Profile Updated',
          message: 'Employee details have been successfully modified.'
        });
      }
    } catch (err) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Operation Failed',
        message: 'There was an error saving employee data.'
      });
    }
  };

  return (
    <div className="card shadow-sm border-0 animate-fade-in">
      <div className="card-body p-4 p-md-5">
        <form onSubmit={handleSubmit}>
          <div className="row g-4 mb-4">
            <div className="col-md-4">
              <label className="form-label small fw-800 text-uppercase tracking-wider">Employee ID</label>
              <input 
                type="text" 
                className="form-control" 
                name="employeeId" 
                value={formData.employeeId} 
                onChange={handleInputChange} 
                required 
              />
            </div>
            <div className="col-md-8">
              <label className="form-label small fw-800 text-uppercase tracking-wider">Full Name</label>
              <input 
                type="text" 
                className="form-control" 
                name="name" 
                value={formData.name} 
                onChange={handleInputChange} 
                required 
              />
            </div>
          </div>

          <div className="row g-4 mb-4">
            <div className="col-md-6">
              <label className="form-label small fw-800 text-uppercase tracking-wider">Email Address</label>
              <input 
                type="email" 
                className="form-control" 
                name="email" 
                value={formData.email} 
                onChange={handleInputChange} 
                required 
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-800 text-uppercase tracking-wider">Phone Number</label>
              <input 
                type="text" 
                className="form-control" 
                name="phone" 
                value={formData.phone} 
                onChange={handleInputChange} 
                required 
              />
            </div>
          </div>

          <div className="row g-4 mb-4">
            <div className="col-md-4">
              <label className="form-label small fw-800 text-uppercase tracking-wider">Department</label>
              <select className="form-select" name="department" value={formData.department} onChange={handleInputChange}>
                <option value="Engineering">Engineering</option>
                <option value="Production">Production</option>
                <option value="Logistics">Logistics</option>
                <option value="Sales">Sales</option>
                <option value="Finance">Finance</option>
                <option value="HR">HR</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-800 text-uppercase tracking-wider">Designation</label>
              <input 
                type="text" 
                className="form-control" 
                name="designation" 
                value={formData.designation} 
                onChange={handleInputChange} 
                required 
              />
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-800 text-uppercase tracking-wider">Monthly Salary</label>
              <div className="input-group">
                <span className="input-group-text bg-light fw-bold">₹</span>
                <input 
                  type="number" 
                  className="form-control" 
                  name="salary" 
                  value={formData.salary} 
                  onChange={handleInputChange} 
                  required 
                />
              </div>
            </div>
          </div>

          <div className="row g-4 mb-4">
            <div className="col-md-6">
              <label className="form-label small fw-800 text-uppercase tracking-wider">Joining Date</label>
              <input 
                type="date" 
                className="form-control" 
                name="joiningDate" 
                value={formData.joiningDate} 
                onChange={handleInputChange} 
                required 
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-800 text-uppercase tracking-wider">Employement Status</label>
              <select className="form-select" name="status" value={formData.status} onChange={handleInputChange}>
                <option value="active">Active</option>
                <option value="on_leave">On Leave</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
          </div>

          <div className="text-end pt-4 border-top">
            <button type="button" className="btn btn-link text-muted me-3 fw-700 text-decoration-none" onClick={() => router.push('/employees')}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary px-5">
              {mode === 'create' ? 'Register Employee' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      <StatusModal 
        isOpen={modal.isOpen}
        onClose={() => {
          setModal(prev => ({ ...prev, isOpen: false }));
          if (modal.type === 'success') router.push('/employees');
        }}
        type={modal.type}
        title={modal.title}
        message={modal.message}
      />
    </div>
  );
};

export default EmployeeForm;
