'use client';

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Link from 'next/link';
import { RootState } from '@/redux/store';
import { Employee } from '@/types/modules';
import { setEmployeeFilters, setEmployeePage, deleteEmployee, fetchEmployees } from '@/redux/features/employeeSlice';
import Breadcrumb from '@/components/Breadcrumb';
import { checkActionPermission } from '@/config/permissions';

const EmployeesPage = () => {
  const [mounted, setMounted] = React.useState(false);
  const dispatch = useDispatch();
  const { user, company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items, filters, pagination } = useSelector((state: RootState) => state.employee) as { 
    items: Employee[]; 
    filters: {
      search: string;
      department: string;
      status: string;
    }; 
    pagination: {
      currentPage: number;
      itemsPerPage: number;
    }
  };

  React.useEffect(() => {
    setMounted(true);
    if (activeCompany?.id) {
       (dispatch as any)(fetchEmployees(activeCompany.id));
    }
  }, [dispatch, activeCompany?.id]);

  if (!mounted) return null;

  // Filter logic
  const filteredItems = items.filter(item => {
    // Company context filtering
    if (activeCompany && item.company_id !== activeCompany.id) return false;

    const matchesSearch = 
      item.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.email.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.employeeId.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.designation.toLowerCase().includes(filters.search.toLowerCase());
    const matchesDept = filters.department === 'all' || item.department === filters.department;
    const matchesStatus = filters.status === 'all' || item.status === filters.status;
    return matchesSearch && matchesDept && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredItems.length / pagination.itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (pagination.currentPage - 1) * pagination.itemsPerPage,
    pagination.currentPage * pagination.itemsPerPage
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <span className="badge bg-success-soft text-success px-3 py-2 rounded-pill fw-700 x-small">ACTIVE</span>;
      case 'on_leave': return <span className="badge bg-warning-soft text-warning px-3 py-2 rounded-pill fw-700 x-small">ON LEAVE</span>;
      case 'terminated': return <span className="badge bg-danger-soft text-danger px-3 py-2 rounded-pill fw-700 x-small">TERMINATED</span>;
      default: return null;
    }
  };

  const getDeptColor = (dept: string) => {
    switch (dept) {
      case 'Engineering': return 'text-primary';
      case 'Production': return 'text-success';
      case 'Logistics': return 'text-warning';
      case 'Sales': return 'text-info';
      case 'HR': return 'text-secondary';
      default: return 'text-dark';
    }
  };

  return (
    <div className="content-area animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Breadcrumb 
            items={[
              { label: 'Employee Hub', active: true }
            ]} 
          />
          <h3 className="fw-800 tracking-tight text-dark mb-0 mt-2">Workforce Management</h3>
          <p className="text-muted small mb-0">Monitor departments, payroll profiles, and industrial staff</p>
        </div>
        {checkActionPermission(user, 'mod_employee', 'create') && (
          <Link href="/employees/new" className="btn btn-primary d-flex align-items-center gap-2 py-2 px-4 shadow-accent">
            <i className="bi bi-person-plus fs-5"></i>
            <span>Add Employee</span>
          </Link>
        )}
      </div>

      {/* Filters Card */}
      <div className="card shadow-sm border-0 mb-4 overflow-hidden">
        <div className="card-body p-3">
          <div className="row g-3">
            <div className="col-md-5">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0 text-muted ps-3">
                  <i className="bi bi-search"></i>
                </span>
                <input 
                  type="text" 
                  className="form-control border-start-0 ps-0" 
                  placeholder="Search by name, ID, or designation..." 
                  value={filters.search}
                  onChange={(e) => dispatch(setEmployeeFilters({ search: e.target.value }))}
                />
              </div>
            </div>
            <div className="col-md-3">
              <select 
                className="form-select" 
                value={filters.department}
                onChange={(e) => dispatch(setEmployeeFilters({ department: e.target.value as any }))}
              >
                <option value="all">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="Production">Production</option>
                <option value="Logistics">Logistics</option>
                <option value="Sales">Sales</option>
                <option value="HR">HR</option>
              </select>
            </div>
            <div className="col-md-4">
               <div className="btn-group w-100 p-1 bg-light rounded-3">
                <button 
                  className={`btn btn-sm rounded-2 flex-grow-1 ${filters.status === 'all' ? 'bg-white shadow-sm fw-700' : 'text-muted border-0'}`}
                  onClick={() => dispatch(setEmployeeFilters({ status: 'all' }))}
                >All</button>
                <button 
                  className={`btn btn-sm rounded-2 flex-grow-1 ${filters.status === 'active' ? 'bg-white shadow-sm fw-700 text-success' : 'text-muted border-0'}`}
                  onClick={() => dispatch(setEmployeeFilters({ status: 'active' }))}
                >Active</button>
                <button 
                  className={`btn btn-sm rounded-2 flex-grow-1 ${filters.status === 'on_leave' ? 'bg-white shadow-sm fw-700 text-warning' : 'text-muted border-0'}`}
                  onClick={() => dispatch(setEmployeeFilters({ status: 'on_leave' }))}
                >On Leave</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* List Table */}
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>Employee Details</th>
              <th>Dept & Role</th>
              <th>Contact</th>
              <th className="text-end">Salary</th>
              <th>Joining Date</th>
              <th>Status</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((emp) => (
              <tr key={emp.id}>
                <td>
                  <div className="d-flex align-items-center gap-3">
                    <div className="avatar bg-primary bg-gradient text-white rounded-circle d-flex align-items-center justify-content-center fw-800" style={{ width: '40px', height: '40px' }}>
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <div className="fw-800 text-dark mb-0">{emp.name}</div>
                      <div className="x-small text-muted fw-700 text-uppercase tracking-widest">{emp.employeeId}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className={`x-small fw-800 text-uppercase tracking-wider ${getDeptColor(emp.department)}`}>{emp.department}</div>
                  <div className="small fw-600 text-muted">{emp.designation}</div>
                </td>
                <td>
                  <div className="small fw-600 text-dark">{emp.email}</div>
                  <div className="x-small text-muted">{emp.phone}</div>
                </td>
                <td className="text-end">
                  <div className="fw-800 text-dark">₹{emp.salary.toLocaleString('en-IN')}</div>
                </td>
                <td>
                  <div className="small fw-600">{new Date(emp.joiningDate).toLocaleDateString()}</div>
                </td>
                <td>{getStatusBadge(emp.status)}</td>
                <td className="text-end">
                  <div className="d-flex justify-content-end gap-2">
                    {checkActionPermission(user, 'mod_employee', 'edit') && (
                      <Link href={`/employees/${emp.id}/edit`} className="btn btn-white btn-sm border shadow-sm rounded-pill px-3 fw-700">
                        Edit
                      </Link>
                    )}
                    {checkActionPermission(user, 'mod_employee', 'delete') && (
                      <button 
                        className="btn btn-white btn-sm border shadow-sm rounded-circle p-0" 
                        style={{ width: '32px', height: '32px' }}
                        onClick={() => { if(confirm('Delete employee record?')) (dispatch as any)(deleteEmployee(emp.id)) }}
                      >
                        <i className="bi bi-trash text-danger"></i>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {paginatedItems.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-5">
                  <div className="text-muted opacity-50 mb-3"><i className="bi bi-person-badge" style={{ fontSize: '3rem' }}></i></div>
                  <h6 className="fw-700 text-dark">No employees found</h6>
                  <p className="small text-muted mb-0">Record your first workforce profile today.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-5">
          <nav>
            <ul className="pagination pagination-sm gap-2">
              {[...Array(totalPages)].map((_, i) => (
                <li key={i} className={`page-item ${pagination.currentPage === i + 1 ? 'active' : ''}`}>
                  <button 
                    className={`page-link rounded-circle d-flex align-items-center justify-content-center fw-800 ${pagination.currentPage === i + 1 ? 'bg-primary border-primary' : 'text-muted border-white shadow-sm'}`} 
                    style={{ width: '36px', height: '36px' }}
                    onClick={() => dispatch(setEmployeePage(i + 1))}
                  >
                    {i + 1}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}

      <style jsx>{`
        .bg-success-soft { background-color: rgba(16, 185, 129, 0.1); }
        .bg-warning-soft { background-color: rgba(245, 158, 11, 0.1); }
        .bg-danger-soft { background-color: rgba(239, 68, 68, 0.1); }
      `}</style>
    </div>
  );
};

export default EmployeesPage;
