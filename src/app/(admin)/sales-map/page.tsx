"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { logout, setCompanyContext } from '@/redux/features/authSlice';
import { useRouter } from 'next/navigation';
import IndiaMap from '@/components/IndiaMap';
import CustomerTable from '@/components/CustomerTable';
import { canonicalState, cleanDistrict, getDistrict, getCustomerState, isDistrictMatch, isRegionMatch, formatINR } from '@/utils/geo_utils';
import { Company } from '@/types/modules';
import { fetchCustomers } from '@/redux/features/customerSlice';
import { fetchCompanies } from '@/redux/features/companySlice';
import { fetchInvoices } from '@/redux/features/invoiceSlice';
import ModuleGuard from '@/components/ModuleGuard';

const SalesMapPage = () => {
    const dispatch = useDispatch();
    const router = useRouter();
    const { user, company: activeCompany } = useSelector((state: RootState) => state.auth);
    const { items: companies } = useSelector((state: RootState) => state.companies);
    const customers = useSelector((state: RootState) => state.customers.items);
    const invoices = useSelector((state: RootState) => state.invoices.items);

    useEffect(() => {
        (dispatch as any)(fetchCustomers({ company_id: activeCompany?.id, limit: 5000 }));
        (dispatch as any)(fetchCompanies());
        (dispatch as any)(fetchInvoices({ company_id: activeCompany?.id, limit: 5000 }));
    }, [dispatch, activeCompany?.id]);

    const [selectedState, setSelectedState] = useState<string | null>(null);
    const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [viewMode, setViewMode] = useState<'states' | 'districts'>('states');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isPageLoading, setIsPageLoading] = useState(true);
    const [hasMounted, setHasMounted] = useState(false);

    // Initial page load delay for a smooth reveal
    useEffect(() => {
        setHasMounted(true);
        const timer = setTimeout(() => setIsPageLoading(false), 1000);
        return () => clearTimeout(timer);
    }, []);

    // Debounce search query to prevent excessive map re-renders
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Correct isolation of data to only the active company (or all if Global View)
    const companyCustomers = useMemo(() => {
        if (!activeCompany?.id) return customers;
        return customers.filter(c => String(c.company_id || (c as any).companyId) === String(activeCompany.id));
    }, [customers, activeCompany?.id]);

    // 1. Customers matching the chosen State & District
    const regionMatchingCustomers = useMemo(() => {
        return companyCustomers.filter(customer => {
            const cState = getCustomerState(customer);
            const cDistrict = getDistrict(customer);

            const matchesState = !selectedState || 
                cState === canonicalState(selectedState) || 
                isRegionMatch(cState, selectedState);

            const matchesDistrict = !selectedDistrict || 
                isDistrictMatch(cDistrict, selectedDistrict) || 
                cleanDistrict(cDistrict).toLowerCase() === cleanDistrict(selectedDistrict).toLowerCase();

            return matchesState && matchesDistrict;
        });
    }, [companyCustomers, selectedState, selectedDistrict]);

    const regionCustomerIdsSet = useMemo(() => {
        return new Set(regionMatchingCustomers.map(c => String(c.id)));
    }, [regionMatchingCustomers]);

    // 2. Invoices matching active company context, region customer set, and From-To date range
    const matchingInvoices = useMemo(() => {
        const from = fromDate ? new Date(fromDate) : null;
        const to = toDate ? new Date(toDate) : null;
        if (to) to.setHours(23, 59, 59, 999);

        return (invoices || []).filter(inv => {
            // Company isolation
            if (activeCompany?.id && String(inv.company_id || (inv as any).companyId) !== String(activeCompany.id)) {
                return false;
            }

            // Region filter: if state or district is selected, invoice must belong to a customer in that territory
            if (selectedState || selectedDistrict) {
                if (!inv.customerId || !regionCustomerIdsSet.has(String(inv.customerId))) {
                    return false;
                }
            }

            // Date filter
            if (from || to) {
                const rawDate = inv.date || inv.invoice_date;
                if (!rawDate) return false;
                const invDate = new Date(rawDate);
                if (from && invDate < from) return false;
                if (to && invDate > to) return false;
            }

            return true;
        });
    }, [invoices, activeCompany?.id, selectedState, selectedDistrict, regionCustomerIdsSet, fromDate, toDate]);

    // 3. Dynamic Total Billing Calculation based on state, district, and From-To date
    const totalBilling = useMemo(() => {
        return matchingInvoices.reduce((sum, inv) => {
            const amt = Number(inv.grandTotal ?? inv.grand_total ?? 0);
            return sum + (isNaN(amt) ? 0 : amt);
        }, 0);
    }, [matchingInvoices]);

    // 4. Set of customer IDs that have invoices within [fromDate, toDate]
    const billedCustomerIds = useMemo(() => {
        const set = new Set<string>();
        matchingInvoices.forEach(inv => {
            if (inv.customerId) set.add(String(inv.customerId));
        });
        return set;
    }, [matchingInvoices]);

    // 5. Filtered customers for display in table and count calculation
    const filteredCustomers = useMemo(() => {
        return regionMatchingCustomers.filter(customer => {
            // If date range is selected, only show customers who have invoices within that period
            if (fromDate || toDate) {
                if (!billedCustomerIds.has(String(customer.id))) {
                    return false;
                }
            }

            const matchesSearch = !searchQuery ||
                Object.values(customer).some(val =>
                    String(val).toLowerCase().includes(searchQuery.toLowerCase())
                );

            return matchesSearch;
        });
    }, [regionMatchingCustomers, fromDate, toDate, billedCustomerIds, searchQuery]);

    const stats = useMemo(() => {
        const uniqueStatesCount = [...new Set(filteredCustomers.map(c => getCustomerState(c)).filter(Boolean))].length;
        const activeCount = filteredCustomers.filter(c => c.status === 'active').length;
        return {
            totalCustomers: filteredCustomers.length,
            activeHubs: 6,
            states: uniqueStatesCount,
            activePercentage: filteredCustomers.length > 0 ? Math.round((activeCount / filteredCustomers.length) * 100) : 0
        };
    }, [filteredCustomers]);

    const handleStateSelect = (stateName: string | null) => {
        const canonical = stateName ? (canonicalState(stateName) || stateName) : null;
        setSelectedState(canonical);
        setSelectedDistrict(null);
    };

    const handleDistrictSelect = (districtName: string | null, feature?: any) => {
        const clean = districtName ? (cleanDistrict(districtName) || districtName) : null;
        setSelectedDistrict(clean);

        // If no state is currently chosen, auto-detect parent state
        if (clean && !selectedState) {
            const sName = feature?.properties?.st_nm;
            if (sName) {
                setSelectedState(canonicalState(sName) || sName);
            } else {
                const found = companyCustomers.find(c => isDistrictMatch(getDistrict(c), clean));
                if (found) {
                    const inferredState = getCustomerState(found);
                    if (inferredState) setSelectedState(inferredState);
                }
            }
        }
    };

    const handleResetAll = () => {
        setSelectedState(null);
        setSelectedDistrict(null);
        setFromDate('');
        setToDate('');
    };

    const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

    const handleCompanySwitch = (selectedCompany: Company | null) => {
        dispatch(setCompanyContext(selectedCompany));
        router.refresh();
    };

    // Active districts on the map:
    // If a state is selected, highlight districts with customers in that state.
    // If All India is viewed, highlight all active customer districts across the country.
    const activeDistrictsList = useMemo(() => {
        const sourceList = selectedState ? filteredCustomers : companyCustomers;
        return [...new Set(sourceList.map(c => getDistrict(c)).filter(Boolean))] as string[];
    }, [selectedState, filteredCustomers, companyCustomers]);

    const activeStatesList = useMemo(() => {
        return [...new Set(companyCustomers.map(c => getCustomerState(c)).filter(Boolean))] as string[];
    }, [companyCustomers]);

    return (
        <ModuleGuard moduleId="mod_sales_map">
        <div className={`dashboard-layout ${isDarkMode ? 'dark-mode' : ''} bg-white min-vh-100 position-relative`}>
            {/* Page Loader Overlay */}
            {isPageLoading && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center bg-white z-50">
                    <div className="mb-4">
                        <div className="p-3 rounded-4 shadow-sm animate-bounce" style={{ backgroundColor: 'var(--accent-soft)' }}>
                            <i className="bi bi-geo-alt-fill fs-1" style={{ color: 'var(--accent-color)' }}></i>
                        </div>
                    </div>
                    <h2 className="h5 fw-black text-capitalize tracking-widest mb-2">Globus Engineering</h2>
                    <div className="d-flex align-items-center gap-2">
                        <div className="spinner-grow spinner-grow-sm text-primary" role="status"></div>
                        <span className="small fw-bold text-muted text-capitalize tracking-wider">Syncing Map & Territory Data...</span>
                    </div>
                </div>
            )}

            {/* Page Header */}
            <div className={`bg-white border-bottom px-4 py-3 d-flex align-items-center justify-content-between sticky-top z-3 mt-n1 shadow-sm transition-all duration-500 ${isPageLoading ? 'opacity-0' : 'opacity-100'}`}>
                <div className="d-flex align-items-center gap-4">
                    <Link href="/dashboard" className="btn btn-light border rounded-pill d-flex align-items-center gap-2 px-3 py-2 transition-all hover-shadow">
                        <i className="bi bi-grid-fill" style={{ color: 'var(--accent-color)' }}></i>
                        <span className="fw-bold small text-capitalize tracking-wider">Dashboard</span>
                    </Link>
                    
                    <div className="vr opacity-10"></div>
                    
                    <div className="dropdown">
                        <button 
                            className="btn btn-link p-0 text-muted text-decoration-none dropdown-toggle border-0 fw-600 d-flex align-items-center gap-3"
                            type="button"
                            data-bs-toggle="dropdown"
                        >
                            <div className="p-2 rounded-3" style={{ backgroundColor: 'var(--accent-soft)' }}>
                                <i className="bi bi-building-fill" style={{ color: 'var(--accent-color)' }}></i>
                            </div>
                            <div className="text-start">
                                <h1 className="h6 fw-black mb-0 text-capitalize tracking-tight text-dark">
                                    {hasMounted ? (activeCompany?.name || 'Global View') : 'Global View'}
                                </h1>
                                <div className="x-small text-muted fw-bold tracking-widest leading-none mt-1">SALES TERRITORY MAP</div>
                            </div>
                        </button>
                        <ul className="dropdown-menu shadow border-0 mt-3 py-2 animate-fade-in" style={{ minWidth: '240px' }}>
                            <li className="px-3 py-2 text-capitalize x-small fw-800 text-muted tracking-widest border-bottom mb-2">Select Company Context</li>
                            <li>
                                <button 
                                    className={`dropdown-item py-2 d-flex align-items-center gap-2 ${hasMounted && !activeCompany ? 'active fw-700' : ''}`}
                                    style={hasMounted && !activeCompany ? { backgroundColor: 'var(--accent-soft)', color: 'var(--accent-color)' } : {}}
                                    onClick={() => handleCompanySwitch(null)}
                                >
                                    <i className={`bi bi-globe ${hasMounted && !activeCompany ? 'opacity-100' : 'opacity-0'}`}></i>
                                    <span>Global System View</span>
                                </button>
                            </li>
                            {companies.map((comp) => (
                                <li key={comp.id}>
                                    <button 
                                        className={`dropdown-item py-2 d-flex align-items-center gap-2 ${hasMounted && activeCompany?.id === comp.id ? 'active fw-700' : ''}`}
                                        style={hasMounted && activeCompany?.id === comp.id ? { backgroundColor: 'var(--accent-soft)', color: 'var(--accent-color)' } : {}}
                                        onClick={() => handleCompanySwitch(comp)}
                                    >
                                        <i className={`bi bi-check-lg ${hasMounted && activeCompany?.id === comp.id ? 'opacity-100' : 'opacity-0'}`}></i>
                                        <span>{comp.name}</span>
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
                                src={`https://ui-avatars.com/api/?name=${(hasMounted && user?.name) || 'User'}&background=ea580c&color=fff`}
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

            <div className={`container-fluid px-3 px-xl-4 py-3 content-fade-in dashboard-viewport transition-all duration-700 ${isPageLoading ? 'opacity-0 transform-translate-y' : 'opacity-100'}`}>
                <div className="row g-3">
                    {/* Left Side: Dynamic Territory Map */}
                    <div className="col-xl-6 col-lg-6">
                        <div className="card shadow-sm h-100 bg-white rounded-4 border-0 overflow-hidden">
                            <div className="card-body p-0 d-flex flex-column" style={{ height: 'calc(100vh - 165px)', minHeight: '600px', maxHeight: '820px', background: '#fcfcfd' }}>
                                <div className="p-3 border-bottom d-flex align-items-center justify-content-between bg-white bg-opacity-80">
                                    <div className="d-flex align-items-center gap-2">
                                        <i className="bi bi-geo-alt-fill text-primary"></i>
                                        <span className="fw-black text-capitalize tracking-wider small">Regional Territory Distribution</span>
                                    </div>
                                    <div className="badge bg-light text-dark border rounded-pill px-3 fw-bold">
                                        {!selectedState && !selectedDistrict ? 'All India View' : 
                                         selectedDistrict ? `District: ${selectedDistrict} (${selectedState || 'Regional'})` : 
                                         `State: ${selectedState}`}
                                    </div>
                                </div>
                                <div 
                                    className="flex-grow-1 d-flex justify-content-center align-items-center position-relative"
                                    style={{ width: '100%', minHeight: '0', flex: 1 }}
                                >
                                    <IndiaMap
                                        selectedState={selectedState}
                                        selectedDistrict={selectedDistrict}
                                        onStateSelect={handleStateSelect}
                                        onDistrictSelect={handleDistrictSelect}
                                        onResetZoom={handleResetAll}
                                        activeDistricts={activeDistrictsList}
                                        activeStates={activeStatesList}
                                        searchTerm={debouncedSearchQuery}
                                        onViewModeChange={(mode) => setViewMode(mode as any)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Customer Table & Live Territory Metrics */}
                    <div className="col-xl-6 col-lg-6" style={{ height: 'calc(100vh - 165px)', minHeight: '600px', maxHeight: '820px' }}>
                        <CustomerTable
                            customers={companyCustomers}
                            selectedState={selectedState}
                            selectedDistrict={selectedDistrict}
                            onStateChange={handleStateSelect}
                            onDistrictChange={handleDistrictSelect}
                            fromDate={fromDate}
                            toDate={toDate}
                            onFromDateChange={setFromDate}
                            onToDateChange={setToDate}
                            totalBilling={totalBilling}
                            matchingInvoicesCount={matchingInvoices.length}
                            onClearFilters={handleResetAll}
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            onLocate={(customer) => {
                                const cState = getCustomerState(customer);
                                const cDistrict = getDistrict(customer);
                                if (cState) setSelectedState(cState);
                                if (cDistrict) setSelectedDistrict(cDistrict);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                        />
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
                .fw-900 { font-weight: 900; }
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
        </ModuleGuard>
    );
};

export default SalesMapPage;
