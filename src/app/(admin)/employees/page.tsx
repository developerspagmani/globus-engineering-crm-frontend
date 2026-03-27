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

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th className="px-4 py-3 border-0">Sno</th>
                  <th className="py-3 border-0">Employee Details</th>
                  <th className="py-3 border-0">Dept & Role</th>
                  <th className="py-3 border-0">Contact</th>
                  <th className="py-3 border-0 text-end">Salary</th>
                  <th className="py-3 border-0">Joining Date</th>
                  <th className="py-3 border-0 text-center">Status</th>
                  <th className="py-3 border-0 text-center px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((emp, index) => (
                  <tr key={emp.id}>
                    <td className="px-4 text-nowrap text-muted small">{(pagination.currentPage - 1) * pagination.itemsPerPage + index + 1}</td>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <div className="avatar bg-light text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <div className="fw-bold text-dark mb-0">{emp.name}</div>
                          <div className="x-small text-muted fw-bold text-uppercase">{emp.employeeId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-nowrap text-muted small">
                      <div className={`fw-bold text-uppercase ${getDeptColor(emp.department)}`}>{emp.department}</div>
                      <div className="fw-normal">{emp.designation}</div>
                    </td>
                    <td className="text-nowrap text-muted small">
                      <div className="fw-bold text-dark">{emp.email}</div>
                      <div className="fw-normal">{emp.phone}</div>
                    </td>
                    <td className="text-nowrap text-end fw-bold text-dark">
                      ₹{emp.salary.toLocaleString('en-IN')}
                    </td>
                    <td className="text-nowrap text-muted small">
                      {new Date(emp.joiningDate).toLocaleDateString()}
                    </td>
                    <td className="text-center">
                      <span className="badge bg-light text-dark border-0 shadow-sm x-small fw-bold">
                        {emp.status.toUpperCase().replace('_', ' ')}
                      </span>
                    </td>
                    <td className="text-center px-4 text-nowrap">
                      <div className="d-flex justify-content-center gap-2">
                        {checkActionPermission(user, 'mod_employee', 'edit') && (
                          <Link href={`/employees/${emp.id}/edit`} className="btn-action-edit" title="Edit">
                            <i className="bi bi-pencil-fill"></i>
                          </Link>
                        )}
                        {checkActionPermission(user, 'mod_employee', 'delete') && (
                          <button 
                            className="btn-action-delete"
                            onClick={() => { if(confirm('Delete employee record?')) (dispatch as any)(deleteEmployee(emp.id)) }}
                            title="Delete"
                          >
                            <i className="bi bi-x-lg"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedItems.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-5 text-muted">
                      No employees found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-4 py-3 border-top d-flex align-items-center justify-content-between">
              <div className="text-muted small">
                Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} to {Math.min(pagination.currentPage * pagination.itemsPerPage, filteredItems.length)} of {filteredItems.length} entries
              </div>
              <nav aria-label="Table navigation">
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${pagination.currentPage === 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => dispatch(setEmployeePage(pagination.currentPage - 1))}>
                      <i className="bi bi-chevron-left"></i>
                    </button>
                  </li>
                  {[...Array(totalPages)].map((_, i) => (
                    <li key={i} className={`page-item ${pagination.currentPage === i + 1 ? 'active' : ''}`}>
                      <button className="page-link" onClick={() => dispatch(setEmployeePage(i + 1))}>
                        {i + 1}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item ${pagination.currentPage === totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => dispatch(setEmployeePage(pagination.currentPage + 1))}>
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeesPage;
