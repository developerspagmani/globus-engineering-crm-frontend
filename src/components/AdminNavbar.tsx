import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { logout, setCompanyContext } from '@/redux/features/authSlice';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Company } from '@/types/modules';

interface NavbarProps {
  onToggleSidebar: () => void;
}

const AdminNavbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const [mounted, setMounted] = React.useState(false);
  const { user, company } = useSelector((state: RootState) => state.auth);
  const { items: companies } = useSelector((state: RootState) => state.companies);
  const dispatch = useDispatch();
  const router = useRouter();

  React.useEffect(() => {
    setMounted(true);
    // Fetch real companies from DB
    const { fetchCompanies } = require('@/redux/features/companySlice');
    dispatch(fetchCompanies());
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  const handleCompanySwitch = (selectedCompany: Company) => {
    dispatch(setCompanyContext(selectedCompany));
    // Optionally refresh the current page to reload data with new context
    router.refresh();
  };

  return (
    <nav className="navbar-custom">
      <div className="d-flex align-items-center">
        <button
          className="btn btn-white border shadow-sm rounded-3 me-3 d-flex align-items-center justify-content-center"
          style={{ width: '42px', height: '42px' }}
          onClick={onToggleSidebar}
        >
          <i className="bi bi-list fs-5"></i>
        </button>
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-0 align-items-center">
            <li className="breadcrumb-item small fw-500 d-flex align-items-center">
              {mounted && user?.role === 'super_admin' ? (
                <div className="dropdown">
                  <button 
                    className="btn btn-link p-0 text-muted text-decoration-none dropdown-toggle border-0 fw-600 d-flex align-items-center gap-2"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i className="bi bi-building-fill" style={{ color: 'var(--accent-color)' }}></i>
                    {company?.name || 'Select Company'}
                  </button>
                  <ul className="dropdown-menu shadow border-0 mt-2 py-2 text-decoration-none">
                    <li className="px-3 py-1 text-uppercase x-small fw-800 text-muted tracking-widest border-bottom mb-2 pb-2 text-decoration-none">Switch Context</li>
                    <li>
                        <button 
                          className={`dropdown-item py-2 d-flex align-items-center gap-2 ${!company ? 'active fw-700' : ''}`}
                          style={!company ? { backgroundColor: 'var(--accent-soft)', color: 'var(--accent-color)' } : {}}
                          onClick={() => dispatch(setCompanyContext(null))}
                        >
                          <i className={`bi bi-globe ${!company ? 'opacity-100' : 'opacity-0'}`}></i>
                          <span>Global System View</span>
                        </button>
                    </li>
                    {companies.map((comp) => (
                      <li key={comp.id}>
                        <button 
                          className={`dropdown-item py-2 d-flex align-items-center gap-2 ${company?.id === comp.id ? 'active fw-700' : ''}`}
                          style={company?.id === comp.id ? { backgroundColor: 'var(--accent-soft)', color: 'var(--accent-color)' } : {}}
                          onClick={() => handleCompanySwitch(comp)}
                        >
                          <i className={`bi bi-check-lg ${company?.id === comp.id ? 'opacity-100' : 'opacity-0'}`}></i>
                          {comp.name}
                        </button>
                      </li>
                    ))}
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <Link href="/admin/companies" className="dropdown-item py-2 x-small text-center fw-bold text-muted">
                        Manage Ecosystem
                      </Link>
                    </li>
                  </ul>
                </div>
              ) : (
                <span className="text-muted d-flex align-items-center gap-2">
                  <i className="bi bi-building" style={{ color: 'var(--accent-color)' }}></i>
                  {mounted && company ? company.name : (mounted ? 'System' : '')}
                </span>
              )}
            </li>
            <li className="breadcrumb-item small active fw-700 ms-2" style={{ color: 'var(--accent-color)' }} aria-current="page">Dashboard</li>
          </ol>
        </nav>
      </div>

      <div className="d-flex align-items-center">


        <div className="dropdown">
          <button
            className="btn btn-white border shadow-sm d-flex align-items-center py-1 px-2 rounded-pill transition" 
            type="button" 
            data-bs-toggle="dropdown" 
            aria-expanded="false"
          >
            <img
              src={`https://ui-avatars.com/api/?name=${mounted ? user?.name || 'User' : 'User'}&background=ea580c&color=fff`}
              alt="Profile"
              className="rounded-circle me-2 border border-white"
              width="32"
              height="32"
            />
            <div className="text-start d-none d-md-block px-1">
              <div className="small fw-700 leading-tight text-dark">{mounted ? user?.name : ''}</div>
              <div className="text-muted x-small fw-600" style={{ fontSize: '0.65rem', opacity: 0.8 }}>{mounted ? user?.role.toUpperCase().replace('_', ' ') : ''}</div>
            </div>
            <i className="bi bi-chevron-down ms-2 small text-muted me-1"></i>
          </button>
          <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2">
            <li><Link className="dropdown-item py-2" href="/settings?tab=profile"><i className="bi bi-person me-2"></i> My Profile</Link></li>
            <li><Link className="dropdown-item py-2" href="/settings?tab=security"><i className="bi bi-shield-lock me-2"></i> Security</Link></li>
            <li><Link className="dropdown-item py-2" href="/settings?tab=appearance"><i className="bi bi-palette me-2"></i> Appearance</Link></li>
            <li><hr className="dropdown-divider" /></li>
            <li><Link className="dropdown-item py-2" href="/settings?tab=company"><i className="bi bi-building me-2"></i> Company Settings</Link></li>
            <li><hr className="dropdown-divider" /></li>
            <li><button className="dropdown-item py-2 text-danger font-weight-bold" onClick={handleLogout}><i className="bi bi-box-arrow-right me-2"></i> Logout</button></li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;
