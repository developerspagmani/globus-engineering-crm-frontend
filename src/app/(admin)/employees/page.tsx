'use client';

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Link from 'next/link';
import { RootState } from '@/redux/store';
import { Employee } from '@/types/modules';
import { setEmployeeFilters, setEmployeePage, deleteEmployee, fetchEmployees } from '@/redux/features/employeeSlice';
import Breadcrumb from '@/components/Breadcrumb';
import { checkActionPermission } from '@/config/permissions';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Loader from '@/components/Loader';
import ConfirmationModal from '@/components/ConfirmationModal';

const EmployeesPage = () => {
  const [mounted, setMounted] = React.useState(false);
  const dispatch = useDispatch();
  const { user, company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items, filters, pagination, loading } = useSelector((state: RootState) => state.employee) as { 
    items: Employee[]; 
    filters: {
      search: string;
      department: string;
      status: string;
      fromDate: string;
      toDate: string;
    }; 
    pagination: {
      currentPage: number;
      itemsPerPage: number;
    };
    loading: boolean;
  };
  const [deleteModal, setDeleteModal] = React.useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });

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

    // Date range filtering (Joining Date)
    let matchesDate = true;
    if (filters.fromDate && item.joiningDate && new Date(item.joiningDate) < new Date(filters.fromDate)) matchesDate = false;
    if (filters.toDate && item.joiningDate && new Date(item.joiningDate) > new Date(filters.toDate)) matchesDate = false;

    return matchesSearch && matchesStatus && matchesDept && matchesDate;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredItems.length / pagination.itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (pagination.currentPage - 1) * pagination.itemsPerPage,
    pagination.currentPage * pagination.itemsPerPage
  );

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

  const handlePrintEmployee = (emp: Employee) => {
    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return;
    printWindow.document.write('<html><head><title>Employee Profile</title>');
    printWindow.document.write('<style>body { font-family: sans-serif; padding: 40px; color: #333; } .header { border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; } .label { font-weight: bold; color: #666; font-size: 0.8rem; text-transform: uppercase; margin-bottom: 4px; } .value { font-size: 1.1rem; margin-bottom: 20px; font-weight: 500; } .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write('<div class="header"><h1 style="margin: 0; color: #2563eb;">Globus Engineering CRM</h1><p style="margin: 5px 0 0; color: #666;">Workforce Personnel Record</p></div>');
    printWindow.document.write('<div class="grid">');
    printWindow.document.write(`<div><div class="label">Full Name</div><div class="value">${emp.name}</div></div>`);
    printWindow.document.write(`<div><div class="label">Employee ID</div><div class="value">${emp.employeeId}</div></div>`);
    printWindow.document.write(`<div><div class="label">Department</div><div class="value">${emp.department}</div></div>`);
    printWindow.document.write(`<div><div class="label">Designation</div><div class="value">${emp.designation}</div></div>`);
    printWindow.document.write(`<div><div class="label">Contact No.</div><div class="value">${emp.phone}</div></div>`);
    printWindow.document.write(`<div><div class="label">Email</div><div class="value">${emp.email}</div></div>`);
    printWindow.document.write(`<div><div class="label">Joining Date</div><div class="value">${new Date(emp.joiningDate).toLocaleDateString()}</div></div>`);
    printWindow.document.write(`<div><div class="label">Status</div><div class="value">${emp.status.toUpperCase()}</div></div>`);
    printWindow.document.write('</div>');
    printWindow.document.write('<div style="margin-top: 50px; text-align: center; font-size: 0.8rem; color: #999; border-top: 1px solid #eee; padding-top: 20px;">Private & Confidential - System Generated on ' + new Date().toLocaleString() + '</div>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  const handleExportPDFEmployee = (emp: Employee) => {
    const doc = new jsPDF();
    doc.setFillColor(37, 99, 235); doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.text("GLOBUS ENGINEERING", 14, 25);
    doc.setFontSize(10); doc.text("EMPLOYEE PERSONNEL FILE", 14, 32);
    doc.setTextColor(33, 33, 33); doc.setFontSize(12); doc.text("BASIC INFORMATION", 14, 55);
    autoTable(doc, {
      startY: 60,
      body: [
        ['Name', emp.name], ['Employee ID', emp.employeeId], ['Department', emp.department],
        ['Designation', emp.designation], ['Phone', emp.phone], ['Email', emp.email],
        ['Joining Date', new Date(emp.joiningDate).toLocaleDateString()], ['Status', emp.status.toUpperCase()]
      ],
      theme: 'grid', styles: { cellPadding: 8, fontSize: 10 },
      columnStyles: { 0: { fontStyle: 'bold', fillColor: [245, 245, 245], cellWidth: 50 } },
    });
    doc.save(`employee_${emp.employeeId}_profile.pdf`);
  };

  const handleDeleteParams = (id: string) => {
    setDeleteModal({ isOpen: true, id });
  };

  const confirmDelete = () => {
    if (deleteModal.id) {
       (dispatch as any)(deleteEmployee(deleteModal.id));
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
          <div className="d-flex flex-wrap align-items-center gap-2">
            <div className="col-lg-3 col-md-4">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0 text-muted ps-3 py-2">
                  <i className="bi bi-search"></i>
                </span>
                <input 
                  type="text" 
                  className="form-control border-start-0 ps-0 py-2 search-bar" 
                  placeholder="Search employees..." 
                  value={filters.search}
                  onChange={(e) => dispatch(setEmployeeFilters({ search: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="ms-auto d-flex gap-2 align-items-center">
              <div className="btn-group p-1 bg-light rounded-3 shadow-none d-none d-sm-flex" style={{ height: '42px' }}>
                {/* <button 
                  className={`btn btn-sm rounded-pill px-3 ${filters.status === 'all' ? 'bg-white shadow-sm fw-700' : 'text-muted border-0'}`}
                  onClick={() => dispatch(setEmployeeFilters({ status: 'all' }))}
                >All</button>
                <button 
                  className={`btn btn-sm rounded-pill px-3 ${filters.status === 'active' ? 'bg-white shadow-sm fw-700 text-success' : 'text-muted border-0'}`}
                  onClick={() => dispatch(setEmployeeFilters({ status: 'active' }))}
                >Active</button> */}
              </div>
            </div>
            <div className="col-lg-2 col-md-3">
              <select 
                className="form-select py-2" 
                value={filters.department}
                onChange={(e) => dispatch(setEmployeeFilters({ department: e.target.value as any }))}
              >
                <option value="all">Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="Production">Production</option>
                <option value="Logistics">Logistics</option>
                <option value="Sales">Sales</option>
                <option value="HR">HR</option>
              </select>
            </div>

          

               <div className="d-flex align-items-center gap-2 bg-white px-3 py-1 shadow-sm border" style={{ borderRadius: '8px', height: '42px' }}>
              <input 
                type="date" 
                   className="form-control py-1 border-0 shadow-none bg-transparent" 
                value={filters.fromDate}
                onChange={(e) => dispatch(setEmployeeFilters({ fromDate: e.target.value }))}
              />
            </div>
                        <span className="text-muted small fw-bold">TO</span>

               <div className="d-flex align-items-center gap-2 bg-white px-3 py-1 shadow-sm border" style={{ borderRadius: '8px', height: '42px' }}>
              <input 
                type="date" 
                   className="form-control py-1 border-0 shadow-none bg-transparent" 
                value={filters.toDate}
                onChange={(e) => dispatch(setEmployeeFilters({ toDate: e.target.value }))}
              />
            </div>

            
            
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr className="bg-light">
                  <th className="px-4 py-3 border-0 small fw-bold text-muted">Sno</th>
                  <th className="py-3 border-0 small fw-bold text-muted">Employee Details</th>
                  <th className="py-3 border-0 small fw-bold text-muted">Dept & Role</th>
                  <th className="py-3 border-0 small fw-bold text-muted">Contact</th>
                  <th className="py-3 border-0 small fw-bold text-muted text-end">Salary</th>
                  <th className="py-3 border-0 small fw-bold text-muted">Joining Date</th>
                  <th className="py-3 border-0 small fw-bold text-muted text-center">Status</th>
                  <th className="py-3 border-0 small fw-bold text-muted text-center px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8}>
                      <Loader text="Fetching Workforce Data..." />
                    </td>
                  </tr>
                ) : paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-5 text-muted">
                      No employees found matching your filters.
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((emp, index) => (
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
                        <div className="d-flex justify-content-center gap-1">
                          {checkActionPermission(user, 'mod_employee', 'edit') && (
                            <Link href={`/employees/${emp.id}/edit`} className="btn-action-view" title="View Profile">
                              <i className="bi bi-eye-fill"></i>
                            </Link>
                          )}
                          
                          <div className="dropdown">
                            <button 
                              className="btn btn-sm btn-outline-secondary border-0 text-muted p-0 ms-1 d-flex align-items-center justify-content-center" 
                              type="button" 
                              id={`actions-${emp.id}`} 
                              data-bs-toggle="dropdown" 
                              aria-expanded="false"
                              style={{ width: '32px', height: '32px', borderRadius: '8px' }}
                            >
                              <i className="bi bi-three-dots-vertical fs-5"></i>
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3 py-2" aria-labelledby={`actions-${emp.id}`}>
                              <li>
                                <button className="dropdown-item d-flex align-items-center gap-2 py-2" type="button" onClick={() => handlePrintEmployee(emp)}>
                                  <i className="bi bi-printer text-primary"></i>
                                  <span className="small fw-semibold">Quick Print</span>
                                </button>
                              </li>
                              <li>
                                <button className="dropdown-item d-flex align-items-center gap-2 py-2" type="button" onClick={() => handleExportPDFEmployee(emp)}>
                                  <i className="bi bi-file-earmark-pdf text-danger"></i>
                                  <span className="small fw-semibold">Export PDF</span>
                                </button>
                              </li>
                              {checkActionPermission(user, 'mod_employee', 'delete') && (
                                <>
                                  <li><hr className="dropdown-divider opacity-50" /></li>
                                  <li>
                                    <button 
                                      className="dropdown-item d-flex align-items-center gap-2 py-2 text-danger" 
                                      type="button"
                                      onClick={() => handleDeleteParams(emp.id)}
                                    >
                                      <i className="bi bi-trash3"></i>
                                      <span className="small fw-semibold">Remove Record</span>
                                    </button>
                                  </li>
                                </>
                              )}
                            </ul>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
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

      <ConfirmationModal 
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Remove Employee Profile"
        message="Are you sure you want to delete this employee record? This will permanently remove their payroll and attendance history from the active system. This action is irreversible."
      />

      <style jsx>{`
        .table-responsive {
          min-height: 400px;
          padding-bottom: 80px;
        }
        @media print {
          :global(body *) { visibility: hidden; }
          .table-responsive, .table-responsive * { visibility: visible; }
          .table-responsive { position: absolute; left: 0; top: 0; width: 100%; }
          .table th:last-child, .table td:last-child { display: none !important; }
          .table { border: 1px solid #dee2e6 !important; width: 100% !important; }
          :global(.sidebar), :global(.header), :global(.breadcrumb), .card-header, .pagination, .border-bottom { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default EmployeesPage;
