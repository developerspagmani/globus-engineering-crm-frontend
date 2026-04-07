'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '@/redux/store';
import { User, ModulePermission } from '@/types/modules';
import { addUser, updateUser } from '@/redux/features/companyUserSlice';

interface CompanyUserFormProps {
  initialData?: User;
  mode: 'create' | 'edit' | 'view';
}

const CompanyUserForm: React.FC<CompanyUserFormProps> = ({ initialData, mode }) => {
  const { user: currentUser, company } = useSelector((state: RootState) => state.auth);
  const { items: allModules } = useSelector((state: RootState) => state.modules);
  const dispatch = useDispatch();
  const router = useRouter();

  // Memoize company modules to prevent infinite update loops in useEffect
  const companyModules = useMemo(() => {
    return company 
      ? allModules.filter(m => company.activeModules.includes(m.id))
      : allModules;
  }, [company, allModules]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '', // New password field
    role: 'staff' as User['role'],
    assignedArea: '',
  });

  const [modulePermissions, setModulePermissions] = useState<ModulePermission[]>([]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        email: initialData.email,
        role: initialData.role,
        assignedArea: initialData.assignedArea || '',
        password: '', // Initialize password as empty for edit mode
      });
      setModulePermissions(initialData.modulePermissions || []);
    } else {
      // Default permissions for new user
      const defaultPerms: ModulePermission[] = companyModules.map(m => {
        // Auto-tick logic for Sales/Staff
        const isAutoTickModule = ['mod_lead', 'mod_stores', 'mod_store_visits', 'mod_sales_hub'].includes(m.id);
        const shouldTickAll = (formData.role === 'sales' || formData.role === 'staff') && isAutoTickModule;

        return {
          moduleId: m.id,
          canRead: true,
          canCreate: shouldTickAll,
          canEdit: shouldTickAll,
          canDelete: false
        };
      });
      setModulePermissions(defaultPerms);
    }
  }, [initialData, companyModules, formData.role]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePermissionToggle = (moduleId: string, action: keyof Omit<ModulePermission, 'moduleId'>) => {
    setModulePermissions(prev => {
      const existing = prev.find(p => p.moduleId === moduleId);
      if (existing) {
        return prev.map(p => p.moduleId === moduleId ? { ...p, [action]: !p[action] } : p);
      } else {
        return [...prev, { moduleId, canRead: false, canCreate: false, canEdit: false, canDelete: false, [action]: true }];
      }
    });
  };

  const handleModuleToggle = (moduleId: string) => {
    setModulePermissions(prev => {
      const existing = prev.find(p => p.moduleId === moduleId);
      if (existing) {
        // If it exists, toggle canRead. If canRead becomes false, maybe disable all?
        return prev.map(p => p.moduleId === moduleId ? { ...p, canRead: !p.canRead } : p);
      } else {
        return [...prev, { moduleId, canRead: true, canCreate: false, canEdit: false, canDelete: false }];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Generate legacy permissions from the new module permissions for compatibility
      const legacyPermissions = modulePermissions
        .filter(p => p.canRead)
        .map(p => {
          const modName = p.moduleId.replace('mod_', '');
          return `view_${modName}`;
        });
        
      if (formData.role === 'company_admin' || formData.role === 'super_admin') {
        legacyPermissions.push('all');
      }

      const userData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        assigned_area: formData.assignedArea,
        company_id: company?.id || currentUser?.company_id,
        permissions: legacyPermissions, // Legacy column
        modulePermissions: modulePermissions, // New detailed column
        password: formData.password || 'password123'
      };

      // console.log('CLIENT: Saving User with Payload:', userData);

      if (mode === 'create') {
        const result = await (dispatch as any)(addUser(userData)).unwrap();
        // console.log('CLIENT: Success creating user:', result);
      } else {
        const result = await (dispatch as any)(updateUser({ id: initialData!.id, ...userData } as any)).unwrap();
        // console.log('CLIENT: Success updating user:', result);
      }
      router.push('/users');
    } catch (err: any) {
      // console.error('CLIENT: Failed to save user:', err);
      alert('Failed to save user: ' + (err.message || err));
    }
  };

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body p-4">
        <form onSubmit={handleSubmit}>
          <div className="row g-4 mb-5">
            <h5 className="fw-bold mb-0">Basic Information</h5>
            <div className="col-md-4">
              <label className="form-label fw-semibold small text-muted text-uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                className="form-control shadow-none"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                required
                disabled={mode === 'view'}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-semibold small text-muted text-uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                className="form-control shadow-none"
                name="email"
                value={formData.email}
                onChange={handleFormChange}
                required
                disabled={mode === 'view'}
              />
            </div>
            {mode === 'create' && (
              <div className="col-md-4">
                <label className="form-label fw-semibold small text-muted text-uppercase tracking-wider">Default Password</label>
                <input
                  type="password"
                  className="form-control shadow-none"
                  name="password"
                  placeholder="Set login password"
                  value={formData.password}
                  onChange={handleFormChange}
                  required={mode === 'create'}
                />
              </div>
            )}
            <div className="col-md-3">
              <label className="form-label fw-semibold small text-muted text-uppercase tracking-wider">System Role</label>
              <select
                className="form-select shadow-none"
                name="role"
                value={formData.role}
                onChange={handleFormChange}
                required
                disabled={mode === 'view'}
              >
                {currentUser?.role === 'super_admin' && (
                  <option value="super_admin">Super Admin</option>
                )}
                <option value="company_admin">Company Admin</option>
                <option value="manager">Manager</option>
                <option value="sales">Sales (Field Staff)</option>
                <option value="staff">Staff / Operations</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold small text-muted text-uppercase tracking-wider">Assigned Area</label>
              <input
                type="text"
                className="form-control shadow-none"
                name="assignedArea"
                value={formData.assignedArea}
                onChange={handleFormChange}
                placeholder="Ex. North Zone"
                disabled={mode === 'view' || formData.role !== 'sales'}
              />
            </div>
          </div>

          <div className="mb-4">
            <h5 className="fw-bold mb-3">Module Access & Permissions</h5>
            <p className="text-muted small mb-4">Granularly control which modules this user can access and what actions they can perform.</p>
            
            <div className="table-responsive">
              <table className="table table-bordered align-middle">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '250px' }}>Module Name</th>
                    <th className="text-center">Read Access</th>
                    <th className="text-center">Create</th>
                    <th className="text-center">Edit / Update</th>
                    <th className="text-center">Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {companyModules.map(module => {
                    const perm = modulePermissions.find(p => p.moduleId === module.id) || {
                      moduleId: module.id,
                      canRead: false,
                      canCreate: false,
                      canEdit: false,
                      canDelete: false
                    };

                    return (
                      <tr key={module.id}>
                        <td className="ps-3">
                          <div className="d-flex align-items-center">
                            <i className={`bi ${module.icon} text-primary me-2`}></i>
                            <span className="fw-bold small text-dark">{module.name}</span>
                          </div>
                        </td>
                        <td className="text-center">
                          <div className="form-check form-switch d-inline-block">
                            <input 
                              className="form-check-input cursor-pointer" 
                              type="checkbox" 
                              checked={perm.canRead}
                              onChange={() => handleModuleToggle(module.id)}
                              disabled={mode === 'view'}
                            />
                          </div>
                        </td>
                        <td className="text-center">
                          <input 
                            type="checkbox" 
                            className="form-check-input shadow-none cursor-pointer"
                            checked={perm.canCreate}
                            disabled={!perm.canRead || mode === 'view'}
                            onChange={() => handlePermissionToggle(module.id, 'canCreate')}
                          />
                        </td>
                        <td className="text-center">
                          <input 
                            type="checkbox" 
                            className="form-check-input shadow-none cursor-pointer"
                            checked={perm.canEdit}
                            disabled={!perm.canRead || mode === 'view'}
                            onChange={() => handlePermissionToggle(module.id, 'canEdit')}
                          />
                        </td>
                        <td className="text-center">
                          <input 
                            type="checkbox" 
                            className="form-check-input shadow-none cursor-pointer"
                            checked={perm.canDelete}
                            disabled={!perm.canRead || mode === 'view'}
                            onChange={() => handlePermissionToggle(module.id, 'canDelete')}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-5 pt-4 border-top d-flex gap-3">
            {mode !== 'view' && (
              <button type="submit" className="btn btn-primary px-5 py-2 fw-bold shadow-accent rounded-pill">
                {mode === 'create' ? 'Create User Account' : 'Save Changes'}
              </button>
            )}
            <button 
              type="button" 
              className="btn btn-outline-secondary px-5 py-2 fw-bold rounded-pill"
              onClick={() => router.push('/users')}
            >
              Back to Users
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanyUserForm;
