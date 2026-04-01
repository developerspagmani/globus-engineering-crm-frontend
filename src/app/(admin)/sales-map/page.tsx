"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { logout, setCompanyContext } from '@/redux/features/authSlice';
import { useRouter } from 'next/navigation';
import IndiaMap from '@/components/IndiaMap';
import CustomerTable from '@/components/CustomerTable';
import { isDistrictMatch } from '@/utils/geo_utils';
import { Company } from '@/types/modules';
import { fetchCustomers } from '@/redux/features/customerSlice';
import { fetchCompanies } from '@/redux/features/companySlice';

const SalesMapPage = () => {
    const dispatch = useDispatch();
    const router = useRouter();
    const { user, company: activeCompany } = useSelector((state: RootState) => state.auth);
    const { items: companies } = useSelector((state: RootState) => state.companies);
    const customers = useSelector((state: RootState) => state.customers.items);

    useEffect(() => {
        (dispatch as any)(fetchCustomers(activeCompany?.id));
        (dispatch as any)(fetchCompanies());
    }, [dispatch, activeCompany?.id]);
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'states' | 'districts'>('states');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isPageLoading, setIsPageLoading] = useState(true);

    // Initial page load delay for a smooth reveal
    useEffect(() => {
        const timer = setTimeout(() => setIsPageLoading(false), 1200);
        return () => clearTimeout(timer);
    }, []);
    const [timeFilter, setTimeFilter] = useState<'today' | 'month' | 'year' | 'all'>('all');

    // Debounce search query to prevent excessive map re-renders
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Filter customers based on selected region, search query, and time period
    const filteredCustomers = useMemo(() => {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();

        return customers.filter(customer => {
            // Company data isolation - Ensure we only show data for the active company context
            if (activeCompany?.id && String(customer.company_id) !== String(activeCompany.id)) return false;

            const customerState = customer.state || '';
            const customerDistrict = customer.district || '';

            const matchesRegion = !selectedRegion ||
                customerState.toLowerCase() === selectedRegion.toLowerCase() ||
                isDistrictMatch(customerDistrict, selectedRegion);

            const matchesSearch = !searchQuery ||
                Object.values(customer).some(val =>
                    String(val).toLowerCase().includes(searchQuery.toLowerCase())
                );

            let matchesTime = true;
            if (customer.createdAt) {
                const regDate = new Date(customer.createdAt);
                if (timeFilter === 'today') {
                    matchesTime = customer.createdAt === today;
                } else if (timeFilter === 'month') {
                    matchesTime = regDate.getMonth() === thisMonth && regDate.getFullYear() === thisYear;
                } else if (timeFilter === 'year') {
                    matchesTime = regDate.getFullYear() === thisYear;
                }
            }

            return matchesRegion && matchesSearch && matchesTime;
        });
    }, [customers, selectedRegion, searchQuery, timeFilter, activeCompany?.id]);

    const stats = useMemo(() => {
        const uniqueStates = [...new Set(filteredCustomers.map(c => c.state || 'Unknown'))].length;
        const activeCount = filteredCustomers.filter(c => c.status === 'active').length;
        return {
            totalCustomers: filteredCustomers.length,
            activeHubs: 6,
            states: uniqueStates,
            activePercentage: filteredCustomers.length > 0 ? Math.round((activeCount / filteredCustomers.length) * 100) : 0
        };
    }, [filteredCustomers]);

    const [hasMounted, setHasMounted] = useState(false);
    useEffect(() => {
        setHasMounted(true);
    }, []);

    const handleRegionSelect = (region: string | null) => {
        setSelectedRegion(region);
        if (region) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

    const handleCompanySwitch = (selectedCompany: Company | null) => {
        dispatch(setCompanyContext(selectedCompany));
        router.refresh();
    };

    // Correct isolation of data to only the active company
    const companyCustomers = useMemo(() => {
        if (!activeCompany) return [];
        return customers.filter(c => String(c.company_id) === String(activeCompany.id));
    }, [customers, activeCompany?.id]);

    return (
        <div className={`dashboard-layout ${isDarkMode ? 'dark-mode' : ''} bg-white min-vh-100 position-relative`}>
            {/* Page Loader Overlay */}
            {isPageLoading && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center bg-white z-50">
                    <div className="mb-4">
                        <div className="p-3 bg-primary bg-opacity-10 rounded-4 shadow-sm animate-bounce">
                            <i className="bi bi-geo-alt-fill text-primary fs-1"></i>
                        </div>
                    </div>
                    <h2 className="h5 fw-black text-uppercase tracking-widest mb-2">Globus Engineering</h2>
                    <div className="d-flex align-items-center gap-2">
                        <div className="spinner-grow spinner-grow-sm text-primary" role="status"></div>
                        <span className="small fw-bold text-muted text-uppercase tracking-wider">Syncing Map Data...</span>
                    </div>
                </div>
            )}

            {/* Page Header - Edge to Edge */}
            <div className={`bg-white border-bottom px-4 py-3 d-flex align-items-center justify-content-between sticky-top z-3 mt-n1 shadow-sm transition-all duration-500 ${isPageLoading ? 'opacity-0' : 'opacity-100'}`}>
                <div className="d-flex align-items-center gap-4">
                    <Link href="/dashboard" className="btn btn-light border rounded-pill d-flex align-items-center gap-2 px-3 py-2 transition-all hover-shadow">
                        <i className="bi bi-grid-fill text-primary"></i>
                        <span className="fw-bold small text-uppercase tracking-wider">Dashboard</span>
                    </Link>
                    
                    <div className="vr opacity-10"></div>
                    
                    <div className="dropdown">
                        <button 
                            className="btn btn-link p-0 text-muted text-decoration-none dropdown-toggle border-0 fw-600 d-flex align-items-center gap-3"
                            type="button"
                            data-bs-toggle="dropdown"
                        >
                            <div className="p-2 bg-primary bg-opacity-10 rounded-3">
                                <i className="bi bi-building-fill text-primary"></i>
                            </div>
                            <div className="text-start">
                                <h1 className="h6 fw-black mb-0 text-uppercase tracking-tight text-dark">
                                    {hasMounted ? (activeCompany?.name || 'Global View') : 'Global View'}
                                </h1>
                                <div className="x-small text-muted fw-bold tracking-widest leading-none mt-1">SALES TERRITORY MAP</div>
                            </div>
                        </button>
                        <ul className="dropdown-menu shadow border-0 mt-3 py-2 animate-fade-in" style={{ minWidth: '240px' }}>
                            <li className="px-3 py-2 text-uppercase x-small fw-800 text-muted tracking-widest border-bottom mb-2">Select Company Context</li>
                            <li>
                                <button 
                                    className={`dropdown-item py-2 d-flex align-items-center gap-2 ${!activeCompany ? 'active bg-primary bg-opacity-10 text-primary fw-700' : ''}`}
                                    onClick={() => handleCompanySwitch(null)}
                                >
                                    <i className={`bi bi-globe ${!activeCompany ? 'opacity-100' : 'opacity-0'}`}></i>
                                    <span>Global System View</span>
                                </button>
                            </li>
                            {companies.map((comp) => (
                                <li key={comp.id}>
                                    <button 
                                        className={`dropdown-item py-2 d-flex align-items-center gap-2 ${activeCompany?.id === comp.id ? 'active bg-primary bg-opacity-10 text-primary fw-700' : ''}`}
                                        onClick={() => handleCompanySwitch(comp)}
                                    >
                                        <i className={`bi bi-check-lg ${activeCompany?.id === comp.id ? 'opacity-100' : 'opacity-0'}`}></i>
                                        {comp.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                
                <div className="d-flex align-items-center gap-3">
                    <button onClick={toggleDarkMode} className="btn btn-light-glass rounded-circle p-2 border">
                        <i className={`bi bi-${isDarkMode ? 'sun' : 'moon'}-stars-fill text-primary`}></i>
                    </button>
                    
                    <div className="dropdown">
                        <button className="btn btn-white border shadow-sm d-flex align-items-center py-1 px-2 rounded-pill transition hover-shadow" type="button" data-bs-toggle="dropdown">
                            <img
                                src={`https://ui-avatars.com/api/?name=${(hasMounted && user?.name) || 'User'}&background=3b82f6&color=fff`}
                                alt="Profile"
                                className="rounded-circle me-2 border border-white"
                                width="30"
                                height="30"
                            />
                            <div className="text-start d-none d-md-block px-1 me-2">
                                <div className="small fw-700 leading-tight text-dark">{hasMounted ? user?.name : ''}</div>
                                <div className="text-muted x-small fw-600" style={{ fontSize: '0.62rem', opacity: 0.8 }}>{hasMounted ? user?.role?.toUpperCase() || '' : ''}</div>
                            </div>
                            <i className="bi bi-chevron-down small text-muted"></i>
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2">
                            <li><button className="dropdown-item py-2 text-danger" onClick={() => { dispatch(logout()); router.push('/login'); }}><i className="bi bi-box-arrow-right me-2"></i> Logout</button></li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className={`container-fluid px-5 py-4 content-fade-in dashboard-viewport mt-3 transition-all duration-700 ${isPageLoading ? 'opacity-0 transform-translate-y' : 'opacity-100'}`}>
                <div className="row g-5">
                    <div className="col-xl-7">
                        <div className="card shadow-sm h-100 bg-white rounded-4 border-0 overflow-hidden">
                            <div className="card-body p-0 d-flex flex-column" style={{ minHeight: '800px', background: '#fcfcfd' }}>
                                <div className="p-3 border-bottom d-flex align-items-center justify-content-between bg-white bg-opacity-80">
                                    <div className="d-flex align-items-center gap-2">
                                        <i className="bi bi-geo-alt-fill text-primary"></i>
                                        <span className="fw-black text-uppercase tracking-wider small">Regional Distribution</span>
                                    </div>
                                    <div className="badge bg-light text-dark border rounded-pill px-3">
                                        {viewMode === 'states' ? 'All India View' : `Viewing State: ${selectedRegion}`}
                                    </div>
                                </div>
                                <div 
                                    className="flex-grow-1 d-flex justify-content-center align-items-center position-relative"
                                    style={{ height: '800px', width: '100%' }}
                                >
                                    <IndiaMap
                                        onRegionSelect={handleRegionSelect}
                                        selectedRegion={selectedRegion}
                                        activeDistricts={useMemo(() => [...new Set(companyCustomers.map((c: any) => c.district || ''))], [companyCustomers]) as string[]}
                                        activeStates={useMemo(() => [...new Set(companyCustomers.map((c: any) => c.state || ''))], [companyCustomers]) as string[]}
                                        searchTerm={debouncedSearchQuery}
                                        onViewModeChange={(mode) => setViewMode(mode as any)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-xl-5 d-flex flex-column gap-4">
                        {/* Selected Region Client Insights */}
                        {selectedRegion && (
                            <div className="card shadow-sm border-0 rounded-4 overflow-hidden animate-fade-in" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' }}>
                                <div className="card-body p-4">
                                    <div className="d-flex align-items-center justify-content-between mb-4">
                                        <div>
                                            <div className="x-small text-primary fw-black text-uppercase tracking-widest mb-1">Regional Deep-Dive</div>
                                            <h2 className="h4 fw-black text-dark mb-0">{selectedRegion}</h2>
                                        </div>
                                        <div className="p-3 bg-white shadow-sm rounded-circle text-primary">
                                            <i className="bi bi-info-circle-fill fs-4"></i>
                                        </div>
                                    </div>
                                    
                                    <div className="row g-3 mb-4">
                                        <div className="col-6">
                                            <div className="p-3 bg-white rounded-4 shadow-sm border border-light">
                                                <div className="smaller text-muted fw-bold text-uppercase mb-1">Customers</div>
                                                <div className="h3 fw-black text-dark mb-0">{filteredCustomers.length}</div>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div className="p-3 bg-white rounded-4 shadow-sm border border-light">
                                                <div className="smaller text-muted fw-bold text-uppercase mb-1">Engagement</div>
                                                <div className="h3 fw-black text-success mb-0">{stats.activePercentage}%</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-4 shadow-sm border border-light p-3">
                                        <div className="smaller text-muted fw-bold text-uppercase tracking-wider mb-3 px-1">Enrolled Clients</div>
                                        <div className="d-flex flex-wrap gap-2">
                                            {filteredCustomers.length > 0 ? (
                                                filteredCustomers.map((c, i) => (
                                                    <span key={i} className="badge bg-light text-dark border fw-bold px-3 py-2 rounded-pill">
                                                        {c.name}
                                                    </span>
                                                ))
                                            ) : (
                                                <div className="py-2 px-1 text-muted smaller italic">No direct accounts in this specific zone</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="card shadow-sm bg-white rounded-4 border-0 flex-grow-1 overflow-hidden">
                            <CustomerTable
                                customers={filteredCustomers}
                                selectedRegion={selectedRegion}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium Styles */}
            <style jsx global>{`
                .dashboard-viewport {
                    height: calc(100vh - 82px);
                }
                .bg-light-gray { background-color: #f8fafc; }
                .fw-black { font-weight: 800; }
                .btn-xs { padding: 0.25rem 0.5rem; font-size: 0.7rem; }
                .leading-none { line-height: 1; }
                .z-50 { z-index: 5000; }
                
                .animate-bounce {
                    animation: bounce 1.5s infinite;
                }
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }

                .transform-translate-y { transform: translateY(20px); }
                .duration-700 { transition-duration: 700ms; }
                .duration-500 { transition-duration: 500ms; }
                .transition-all { transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }

                /* Toolbar */
                .search-bar-compact {
                    background: #f1f5f9;
                    border-radius: 10px;
                    transition: all 0.2s ease;
                }
                .search-bar-compact:focus-within {
                    background: white;
                    box-shadow: 0 0 0 2px rgba(13, 110, 253, 0.1);
                }

                /* Cards */
                .card.b-0 { border: none !important; }
                
                /* Animations */
                .content-fade-in {
                    animation: fadeIn 0.4s ease-out forwards;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .smaller { font-size: 0.7rem; }
                .tracking-widest { letter-spacing: 0.15em; }

                .bg-light-glass { background: rgba(248, 250, 252, 0.8); backdrop-filter: blur(4px); }
                .btn-light-glass { background: rgba(255, 255, 255, 0.5); border: 1px solid rgba(0,0,0,0.05); }
                .btn-light-glass:hover { background: white; }

                .hover-shadow:hover {
                    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                    transform: translateY(-1px);
                }
                .transition-all { transition: all 0.2s ease; }
                .tracking-tight { letter-spacing: -0.02em; }
                .mt-n1 { margin-top: -1px; }
            `}</style>
        </div>
    );
};

export default SalesMapPage;
