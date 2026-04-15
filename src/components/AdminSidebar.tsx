'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { logout } from '@/redux/features/authSlice';
import { navigationConfig, hasPermission } from '@/config/permissions';

interface SidebarProps {
  collapsed: boolean;
}

const AdminSidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const [mounted, setMounted] = React.useState(false);
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { user, company } = useSelector((state: RootState) => state.auth);

  // State for expanded menus
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleExpand = (name: string) => {
    setExpandedItems(prev =>
      prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name]
    );
  };

  const filteredItems = navigationConfig.filter(item =>
    hasPermission(item, user, company?.activeModules)
  );

  if (!mounted) return <div className="sidebar bg-white shadow-sm h-100" style={{ width: collapsed ? '80px' : '260px' }}></div>;

  return (
    <div className={`sidebar bg-white shadow-sm h-100 d-flex flex-column ${collapsed ? 'collapsed' : ''}`} style={{ zIndex: 1000 }}>
      {/* Brand Header */}
      <div className={`d-flex align-items-center mb-2 ${collapsed ? 'justify-content-center py-4' : 'p-4 gap-3'}`}>
        <div className="bg-gradient p-2 rounded-4 shadow-accent d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', minWidth: '40px', background: 'var(--primary-gradient)' }}>
          <i className="bi bi-cpu text-white fs-5"></i>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h6 className="fw-800 mb-0 text-truncate text-dark tracking-tight" style={{ fontSize: '1rem' }}>GLOBUS</h6>
            <p className="x-small mb-0 text-truncate text-uppercase fw-700 tracking-widest opacity-80" style={{ fontSize: '0.65rem', color: 'var(--accent-color)' }}>Engineering</p>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-grow-1 sidebar-nav overflow-y-auto px-2">
        <nav className="nav flex-column gap-1">
          {filteredItems.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedItems.includes(item.name);
            const isActive = pathname === item.path || (hasChildren && item.children?.some(c => pathname === c.path));

            if (hasChildren) {
              return (
                <div key={item.name} className="nav-group mb-1">
                  <button
                    onClick={() => toggleExpand(item.name)}
                    className={`nav-link w-100 text-start d-flex align-items-center justify-content-between ${isActive ? 'active' : ''}`}
                    style={{ border: 'none', background: 'none' }}
                  >
                    <div className="d-flex align-items-center">
                      <i className={`bi ${item.icon}`}></i>
                      {!collapsed && <span>{item.name}</span>}
                    </div>
                    {!collapsed && (
                      <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'} small opacity-50`}></i>
                    )}
                  </button>
                  {isExpanded && !collapsed && (
                    <div className="ms-4 my-1 d-flex flex-column gap-1 border-start ps-2">
                      {item.children?.map(child => (
                        <Link
                          key={child.path}
                          href={child.path}
                          className={`nav-link py-1 small rounded-2 ${pathname === child.path || pathname.startsWith(child.path + '/') ? 'active fw-bold' : 'text-muted'}`}
                          style={{ 
                            fontSize: '0.85rem',
                            backgroundColor: (pathname === child.path || pathname.startsWith(child.path + '/')) ? 'var(--accent-soft)' : 'transparent',
                            color: (pathname === child.path || pathname.startsWith(child.path + '/')) ? 'var(--accent-color)' : ''
                          }}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.path}
                href={item.path}
                className={`nav-link ${isActive ? 'active' : ''}`}
                title={collapsed ? item.name : ''}
              >
                <i className={`bi ${item.icon}`}></i>
                {!collapsed && <span className="text-truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Info / Logout Section */}
      <div className={`mt-auto ${collapsed ? 'p-2' : 'p-3'}`}>
        <div className={`d-flex align-items-center ${collapsed ? 'justify-content-center mb-3' : 'gap-3 p-2 mb-2'} rounded-3 bg-light bg-opacity-50 border border-white shadow-sm`}>
          <div className="avatar bg-white border rounded-circle d-flex align-items-center justify-content-center fw-800 text-primary shadow-sm" style={{ width: '32px', height: '32px', minWidth: '32px', fontSize: '0.8rem' }}>
            {user?.name?.charAt(0) || 'U'}
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h6 className="x-small fw-800 mb-0 text-truncate text-dark">{user?.name}</h6>
              <p className="xx-small text-muted mb-0 text-truncate fw-600" style={{ fontSize: '0.65rem' }}>{user?.role?.replace('_', ' ')}</p>
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={() => dispatch(logout())}
            className="btn btn-outline-danger btn-sm w-100 d-flex align-items-center justify-content-center gap-2 py-1 mb-1 border-0"
            style={{ fontSize: '0.8rem' }}
          >
            <i className="bi bi-box-arrow-right"></i>
            <span className="fw-700">Logout</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default AdminSidebar;
