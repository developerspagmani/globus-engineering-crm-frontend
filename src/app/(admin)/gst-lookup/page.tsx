'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';

export default function GstLookupPage() {
    const [gstin, setGstin] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState('');
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [recentSearches, setRecentSearches] = useState<any[]>([]);

    // Load recent from localStorage on mount
    React.useEffect(() => {
        const saved = localStorage.getItem('gst_recent_searches');
        if (saved) {
            try {
                setRecentSearches(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse recent searches");
            }
        }
    }, []);

    const saveToRecent = (entity: any) => {
        const newItem = {
            gstin: entity.gstin,
            legalName: entity.legalName,
            status: entity.status,
            id: Date.now()
        };
        const updated = [newItem, ...recentSearches.filter(s => s.gstin !== entity.gstin)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('gst_recent_searches', JSON.stringify(updated));
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        const formattedGstin = gstin.trim().toUpperCase();

        try {
            setLoading(true);
            setLoadingStep('Initializing...');
            setError(null);
            setData(null);

            if (formattedGstin.length !== 15) {
                throw new Error("GSTIN must be exactly 15 characters long.");
            }

            setLoadingStep('Connecting to Registry...');
            const response = await fetch(`/api/gst-lookup?gstin=${formattedGstin}`);
            
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Failed to fetch GST details.");
            }

            setLoadingStep('Decoding Entity...');
            const result = await response.json();
            const gstData = result.data || result;
            
            if (!gstData || (!gstData.legal_name && !gstData.lgnm)) {
                throw new Error("No record found for this GSTIN.");
            }

            const finalData = {
                gstin: formattedGstin,
                legalName: gstData.legal_name || gstData.lgnm || "N/A",
                tradeName: gstData.trade_name || gstData.trade_business_name || gstData.txn || "Legal Name Only",
                registrationDate: gstData.registration_date || gstData.rgdt || "N/A",
                constitution: gstData.business_type || gstData.ctb || "N/A",
                taxpayerType: gstData.taxpayer_type || gstData.dty || "Regular",
                status: gstData.status || gstData.sts || "Active",
                address: gstData.address || (gstData.pradr && gstData.pradr.addr && `${gstData.pradr.addr.bnm || ''} ${gstData.pradr.addr.st || ''}, ${gstData.pradr.addr.loc || ''}, ${gstData.pradr.addr.dst || ''}, ${gstData.pradr.addr.stcd || ''}`) || "Address not available",
                stateJurisdiction: gstData.state_jurisdiction || gstData.stj || "N/A",
                centerJurisdiction: gstData.center_jurisdiction || gstData.ctj || "N/A",
            };

            saveToRecent(finalData);
            setData(finalData);
        } catch (err: any) {
            setError(err.message || "Failed to fetch GST details.");
        } finally {
            setLoading(false);
            setLoadingStep('');
        }
    };

    return (
        <div className="container-fluid py-4 min-vh-100 bg-light bg-opacity-50">
            <div className="mb-4 d-flex justify-content-between align-items-center">
                <div>
                   <Breadcrumb items={[{ label: 'Admin', href: '#' }, { label: 'GSTN Lookup', active: true }]} />
                   <h3 className="fw-800 tracking-tight text-dark mb-1">GSTIN Search Registry</h3>
                   <p className="text-muted small mb-0">Real-time business verification and entity profiling.</p>
                </div>
                {data && (
                    <button className="btn btn-outline-primary btn-sm rounded-pill px-3 fw-bold" onClick={() => window.print()}>
                        <i className="bi bi-printer me-2"></i>PRINT RESULTS
                    </button>
                )}
            </div>

            <div className="row justify-content-center">
                <div className="col-xl-9">
                    {/* Search Card */}
                    <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
                        <div className="card-body p-4 p-md-5 bg-white">
                           <form onSubmit={handleSearch}>
                               <div className="d-flex flex-column flex-md-row gap-3">
                                   <div className="flex-grow-1 position-relative">
                                       <span className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted">
                                          <i className="bi bi-shield-check fs-5"></i>
                                       </span>
                                       <input
                                           type="text"
                                           className="form-control form-control-lg ps-5 border-2 rounded-3 text-uppercase fw-bold tracking-widest"
                                           placeholder="Enter 15-digit GSTIN..."
                                           style={{ height: '60px', fontSize: '1.2rem' }}
                                           value={gstin}
                                           onChange={(e) => setGstin(e.target.value.toUpperCase())}
                                           maxLength={15}
                                       />
                                   </div>
                                   <button 
                                      className="btn btn-primary px-5 fw-800 rounded-3 shadow-accent" 
                                      type="submit" 
                                      disabled={loading}
                                      style={{ height: '60px' }}
                                   >
                                       {loading ? (
                                           <div className="d-flex align-items-center gap-2">
                                               <span className="spinner-border spinner-border-sm"></span>
                                               <span>{loadingStep}</span>
                                           </div>
                                       ) : (
                                           <span>VERIFY ENTITY</span>
                                       )}
                                   </button>
                               </div>
                           </form>

                           {recentSearches.length > 0 && !data && !loading && (
                               <div className="mt-4 pt-3 border-top">
                                   <h6 className="x-small fw-800 text-muted text-uppercase tracking-widest mb-3">Recent Inquiries</h6>
                                   <div className="d-flex flex-wrap gap-2">
                                       {recentSearches.map(item => (
                                           <button 
                                              key={item.id} 
                                              className="btn btn-light btn-sm rounded-pill border px-3 text-start d-flex align-items-center gap-2"
                                              onClick={() => setGstin(item.gstin)}
                                           >
                                               <span className="badge bg-success rounded-circle p-1"><i className="bi bi-check-lg" style={{ fontSize: '0.6rem' }}></i></span>
                                               <div className="d-flex flex-column" style={{ maxWidth: '150px' }}>
                                                   <span className="fw-800 x-small text-truncate">{item.legalName}</span>
                                                   <span className="xx-small text-muted">{item.gstin}</span>
                                               </div>
                                           </button>
                                       ))}
                                   </div>
                               </div>
                           )}
                        </div>
                    </div>

                    {error && (
                        <div className="alert alert-danger border-0 shadow-sm rounded-4 d-flex align-items-center gap-3 p-4 mb-4">
                            <i className="bi bi-exclamation-octagon-fill fs-2"></i>
                            <div>
                                <h6 className="fw-bold mb-1">Verification Unsuccessful</h6>
                                <p className="small mb-0 opacity-75">{error}</p>
                            </div>
                        </div>
                    )}

                    {data && (
                        <div className="animate-fade-in">
                            <div className="card border-0 shadow-sm rounded-4 mb-4">
                                <div className="card-header bg-white py-4 px-4 border-0">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <span className="badge bg-primary-soft text-primary px-3 py-1 rounded-pill x-small fw-800 mb-2">AUTH-VERIFIED</span>
                                            <h2 className="fw-800 text-dark mb-1 text-uppercase">{data.legalName}</h2>
                                            <div className="d-flex align-items-center gap-2 text-muted small">
                                                <i className="bi bi-hash"></i>
                                                <span className="fw-bold tracking-widest">{data.gstin}</span>
                                            </div>
                                        </div>
                                        <div className={`badge px-3 py-2 rounded-pill fw-800 ${data.status === 'Active' ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`}>
                                            <i className="bi bi-circle-fill me-2 x-small"></i>{data.status.toUpperCase()}
                                        </div>
                                    </div>
                                </div>
                                <div className="card-body p-4 pt-0">
                                    <div className="row g-4 mt-1">
                                        <div className="col-md-6 col-lg-4">
                                            <div className="p-3 bg-light rounded-3 h-100">
                                                <label className="xx-small fw-800 text-muted text-uppercase tracking-widest d-block mb-1">Trading Name</label>
                                                <span className="fw-bold text-dark small">{data.tradeName || 'N/A'}</span>
                                            </div>
                                        </div>
                                        <div className="col-md-6 col-lg-4">
                                            <div className="p-3 bg-light rounded-3 h-100">
                                                <label className="xx-small fw-800 text-muted text-uppercase tracking-widest d-block mb-1">Reg. Date</label>
                                                <span className="fw-bold text-dark small">{data.registrationDate}</span>
                                            </div>
                                        </div>
                                        <div className="col-md-6 col-lg-4">
                                            <div className="p-3 bg-light rounded-3 h-100">
                                                <label className="xx-small fw-800 text-muted text-uppercase tracking-widest d-block mb-1">Constitution</label>
                                                <span className="fw-bold text-dark small">{data.constitution}</span>
                                            </div>
                                        </div>
                                        <div className="col-md-6 col-lg-4">
                                            <div className="p-3 bg-light rounded-3 h-100">
                                                <label className="xx-small fw-800 text-muted text-uppercase tracking-widest d-block mb-1">Taxpayer Type</label>
                                                <span className="fw-bold text-dark small">{data.taxpayerType}</span>
                                            </div>
                                        </div>
                                        <div className="col-md-6 col-lg-8">
                                            <div className="p-3 bg-light rounded-3 h-100">
                                                <label className="xx-small fw-800 text-muted text-uppercase tracking-widest d-block mb-1">Principal Place of Business</label>
                                                <span className="fw-bold text-dark small">{data.address}</span>
                                            </div>
                                        </div>
                                        <div className="col-md-6 col-lg-6">
                                            <div className="p-3 bg-light rounded-3 h-100">
                                                <label className="xx-small fw-800 text-muted text-uppercase tracking-widest d-block mb-1">State Jurisdiction</label>
                                                <span className="fw-bold text-dark small">{data.stateJurisdiction}</span>
                                            </div>
                                        </div>
                                        <div className="col-md-6 col-lg-6">
                                            <div className="p-3 bg-light rounded-3 h-100">
                                                <label className="xx-small fw-800 text-muted text-uppercase tracking-widest d-block mb-1">Central Jurisdiction</label>
                                                <span className="fw-bold text-dark small">{data.centerJurisdiction}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4 p-3 border border-warning border-opacity-25 bg-warning-soft rounded-3 d-flex align-items-center gap-3">
                                        <i className="bi bi-info-circle-fill text-warning fs-5"></i>
                                        <p className="xx-small text-muted mb-0 fw-600">
                                            This data is direct from the GST Common Portal Proxy. Always verify against physical GST certificates for critical compliance.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .bg-primary-soft { background-color: rgba(13, 110, 253, 0.08); }
                .bg-success-soft { background-color: rgba(25, 135, 84, 0.08); }
                .bg-danger-soft { background-color: rgba(220, 53, 69, 0.08); }
                .bg-warning-soft { background-color: rgba(255, 193, 7, 0.08); }
                .tracking-widest { letter-spacing: 0.15em; }
                .fw-800 { font-weight: 800; }
                .xx-small { font-size: 0.65rem; }
            `}</style>
        </div>
    );
}
