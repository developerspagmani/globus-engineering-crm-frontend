'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
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
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const { user, company } = useSelector((state: RootState) => state.auth);

  // State for expanded menus
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleExpand = (name: string) => {
    setExpandedItems(prev =>
      prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name]
    );
  };

  const filteredItems = React.useMemo(() => {
    return navigationConfig.filter(item =>
      hasPermission(item, user, company?.activeModules)
    );
  }, [user, company?.activeModules]);

  const searchedItems = React.useMemo(() => {
    if (!searchQuery.trim()) return filteredItems;
    
    const lowerQuery = searchQuery.toLowerCase();
    
    return filteredItems.map(item => {
      const parentMatches = item.name.toLowerCase().includes(lowerQuery);
      const matchingChildren = item.children?.filter(child => 
        child.name.toLowerCase().includes(lowerQuery)
      ) || [];
      
      if (parentMatches || matchingChildren.length > 0) {
        return {
          ...item,
          children: parentMatches ? item.children : matchingChildren
        };
      }
      return null;
    }).filter(Boolean) as typeof filteredItems;
  }, [filteredItems, searchQuery]);

  if (!mounted) return <div className="sidebar bg-white shadow-sm h-100" style={{ width: collapsed ? '80px' : '260px' }}></div>;

  return (
    <div className={`sidebar bg-white shadow-sm h-100 d-flex flex-column ${collapsed ? 'collapsed' : ''}`} style={{ zIndex: 1000 }}>
      {/* Brand Header */}
      <div className={`d-flex align-items-center justify-content-center mb-2 ${collapsed ? 'py-4' : 'p-4 gap-3'}`}>
        <div className="d-flex align-items-center justify-content-center rounded-3 shadow-sm bg-white" style={{ width: '45px', height: '45px', minWidth: '45px', overflow: 'hidden' }}>
          {company?.logo ? (
            <img src={company.logo} alt="Company Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <img src="/logo.jpg" alt="Default Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(1.15)' }} />
          )}
        </div>
        {!collapsed && (
          <div className="d-flex flex-column justify-content-center text-start">
            <h6 className="fw-900 mb-0 text-dark tracking-tight" style={{ fontSize: '1.2rem', letterSpacing: '0.5px' }}>
              {company?.name?.toLowerCase().includes('pricol') ? 'PRICOL' : (company?.name?.toUpperCase() || 'GLOBUS')}
            </h6>
            <p className="mb-0 text-uppercase fw-bold" style={{ fontSize: '0.7rem', color: '#ea580c', letterSpacing: '1px' }}>
              {company?.name?.toLowerCase().includes('pricol') ? '' : 'Engineering'}
            </p>
          </div>
        )}
      </div>

      {/* Search Bar */}
      {!collapsed && (
        <div className="px-3 mb-3">
          <div className="search-group w-100" style={{ maxWidth: '100%' }}>
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input 
              type="text" 
              className="form-control search-bar shadow-none" 
              placeholder="Search menu..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <span 
                className="position-absolute d-flex align-items-center justify-content-center text-muted" 
                style={{ right: '15px', top: '0', bottom: '0', cursor: 'pointer', zIndex: 10 }}
                onClick={() => setSearchQuery('')}
              >
                <i className="bi bi-x-circle-fill"></i>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <div className="flex-grow-1 sidebar-nav overflow-y-auto px-2">
        <nav className="nav flex-column gap-1">
          {searchedItems.length === 0 && searchQuery && (
            <div className="text-center p-3 text-muted small fw-bold">
              No matches found
            </div>
          )}
          {searchedItems.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = !!searchQuery || expandedItems.includes(item.name);
            
            const searchString = searchParams.toString() ? `?${searchParams.toString()}` : '';
            const fullPath = `${pathname}${searchString}`;
            
            // Helper to check if a navigation path is active
            const checkActive = (navPath: string) => {
              if (fullPath === navPath || pathname === navPath) return true;
              try {
                if (navPath !== '#') {
                  const navUrl = new URL(navPath, 'http://localhost');
                  // Base path check (e.g. /inward/new starts with /inward)
                  if (pathname === navUrl.pathname || pathname.startsWith(navUrl.pathname + '/')) {
                    const navType = navUrl.searchParams.get('type');
                    const currentType = searchParams.get('type');
                    if (navType && navType === currentType) return true;
                  }
                }
              } catch (e) {}
              return false;
            };

            const isActive = pathname === item.path || 
                           (pathname.startsWith(item.path + '/') && !filteredItems.some(other => other.path !== item.path && pathname.startsWith(other.path) && other.path.length > item.path.length)) ||
                           (hasChildren && item.children?.some(c => checkActive(c.path)));

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
                      {item.children?.map(child => {
                        const isChildActive = checkActive(child.path);
                        
                        return (
                          <Link
                            key={child.path}
                            href={child.path}
                            className={`nav-link py-1 small rounded-2 ${isChildActive ? 'active fw-bold' : 'text-muted'}`}
                            style={{ 
                              fontSize: '0.85rem',
                              backgroundColor: isChildActive ? 'var(--accent-soft)' : 'transparent',
                              color: isChildActive ? 'var(--accent-color)' : ''
                            }}
                          >
                            {child.name}
                          </Link>
                        );
                      })}
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
