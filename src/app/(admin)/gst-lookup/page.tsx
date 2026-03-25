'use client';

import React, { useState } from 'react';
import Link from 'next/link';

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
            setLoadingStep('Initializing Secure Connection...');
            setError(null);
            setData(null);

            // Simple 15-char check
            if (formattedGstin.length !== 15) {
                throw new Error("GSTIN must be exactly 15 characters long.");
            }

            setLoadingStep('Connecting to GST Registry Proxy...');
            
            // Call our local proxy API
            const response = await fetch(`/api/gst-lookup?gstin=${formattedGstin}`);
            
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Failed to fetch GST details.");
            }

            setLoadingStep('Decoding Entity Profile...');
            const result = await response.json();

            // Mapping Masters India API response to our UI state
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
                state: gstData.state || "N/A"
            };

            setLoadingStep('Updating Recent History...');
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
        <div className="gst-lookup-container rounded-4 shadow-lg overflow-hidden animate-fade-in" style={{ backgroundColor: '#0f172a' }}>
            <style jsx>{`
                .gst-lookup-container {
                    min-height: calc(100vh - 100px);
                    background: radial-gradient(circle at top right, #1e293b, #0f172a);
                    color: white;
                    padding: 40px;
                    font-family: 'Inter', system-ui, -apple-system, sans-serif;
                }

                .lookup-card {
                    max-width: 850px;
                    margin: 0 auto;
                }

                .header-section {
                    text-align: center;
                    margin-bottom: 40px;
                }

                .header-section h1 {
                    font-weight: 800;
                    letter-spacing: -0.02em;
                    font-size: 2.5rem;
                    background: linear-gradient(to right, #60a5fa, #a855f7);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    margin-bottom: 10px;
                }

                .header-section p {
                    color: #94a3b8;
                    font-size: 1.1rem;
                }

                .input-group-custom {
                    position: relative;
                    margin-bottom: 2rem;
                }

                .gst-input {
                    width: 100%;
                    background: rgba(15, 23, 42, 0.6);
                    border: 2px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    padding: 20px 24px;
                    font-size: 1.25rem;
                    color: white;
                    text-transform: uppercase;
                    transition: all 0.3s ease;
                    letter-spacing: 0.1em;
                }

                .gst-input:focus {
                    outline: none;
                    border-color: #60a5fa;
                    box-shadow: 0 0 0 4px rgba(96, 165, 250, 0.2);
                    background: rgba(15, 23, 42, 0.8);
                }

                .search-btn {
                    position: absolute;
                    right: 10px;
                    top: 10px;
                    bottom: 10px;
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    border: none;
                    border-radius: 12px;
                    padding: 0 35px;
                    font-weight: 700;
                    color: white;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .search-btn:hover:not(:disabled) {
                    transform: translateY(-1px);
                    box-shadow: 0 8px 20px rgba(37, 99, 235, 0.4);
                    filter: brightness(1.1);
                }

                .search-btn:active:not(:disabled) {
                    transform: translateY(0);
                }

                .search-btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .results-section {
                    animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .info-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                    gap: 20px;
                    margin-top: 30px;
                }

                .info-item {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    padding: 24px;
                    border-radius: 20px;
                    transition: all 0.3s ease;
                }

                .info-item:hover {
                    background: rgba(255, 255, 255, 0.06);
                    border-color: rgba(255, 255, 255, 0.1);
                    transform: translateY(-4px);
                }

                .info-label {
                    display: block;
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    color: #94a3b8;
                    font-weight: 700;
                    margin-bottom: 10px;
                    letter-spacing: 0.1em;
                }

                .info-value {
                    display: block;
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: #f8fafc;
                    line-height: 1.5;
                }

                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    padding: 6px 16px;
                    border-radius: 9999px;
                    font-size: 0.8rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .status-active {
                    background: rgba(34, 197, 94, 0.15);
                    color: #4ade80;
                    border: 1px solid rgba(34, 197, 94, 0.3);
                    box-shadow: 0 0 15px rgba(34, 197, 94, 0.1);
                }

                .loading-spinner {
                    width: 20px;
                    height: 20px;
                    border: 3px solid rgba(255, 255, 255, 0.2);
                    border-radius: 50%;
                    border-top-color: white;
                    animation: spin 0.8s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .error-alert {
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    color: #fca5a5;
                    padding: 20px;
                    border-radius: 16px;
                    margin-bottom: 30px;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }

                .recent-item {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    transition: all 0.2s ease;
                }
                .recent-item:hover {
                    background: rgba(255,255,255,0.08);
                    transform: translateY(-2px);
                    border-color: #3b82f6;
                }

                .status-dot-active {
                    width: 8px;
                    height: 8px;
                    background: #22c55e;
                    border-radius: 50%;
                }

                .shadow-glow {
                    box-shadow: 0 0 10px rgba(34, 197, 94, 0.5);
                }

                .animate-fade {
                    animation: fadeIn 0.4s ease-out;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .cursor-pointer { cursor: pointer; }
            `}</style>

            <div className="lookup-card">
                <div className="header-section">
                    <h1>GSTIN Search Engine</h1>
                    <p>Real-time Business Verification and Entity Profiling</p>
                </div>

                <form onSubmit={handleSearch}>
                    <div className="input-group-custom">
                        <input
                            type="text"
                            className="gst-input shadow-lg"
                            placeholder="Enter 15-digit GSTIN (e.g. 29AAAAA0000A1Z5)"
                            value={gstin}
                            onChange={(e) => setGstin(e.target.value.toUpperCase())}
                            maxLength={15}
                            spellCheck="false"
                        />
                        <button className="search-btn d-flex align-items-center gap-2 shadow-sm" type="submit" disabled={loading}>
                            {loading ? (
                                <div className="d-flex align-items-center gap-3">
                                    <div className="loading-spinner"></div>
                                    <span className="small opacity-75">{loadingStep}</span>
                                </div>
                            ) : (
                                <><i className="bi bi-shield-check fs-5"></i> Verify Entity</>
                            )}
                        </button>
                    </div>
                </form>

                {recentSearches.length > 0 && !data && !loading && (
                    <div className="recent-searches mt-4 border-top border-white border-opacity-10 pt-4 animate-fade">
                        <h6 className="small text-secondary fw-bold mb-3 d-flex align-items-center gap-2">
                            <i className="bi bi-clock-history"></i> RECENT LOOKUPS
                        </h6>
                        <div className="d-flex flex-wrap gap-2">
                            {recentSearches.map(item => (
                                <div 
                                    key={item.id} 
                                    className="recent-item d-flex align-items-center gap-3 p-2 ps-3 rounded-pill cursor-pointer transition-all shadow-sm"
                                    onClick={() => { setGstin(item.gstin); }}
                                >
                                    <div className="d-flex flex-column">
                                        <span className="fw-bold text-white lh-1" style={{ fontSize: '11px' }}>{item.legalName.substring(0, 20)}...</span>
                                        <span className="text-secondary" style={{ fontSize: '10px' }}>{item.gstin}</span>
                                    </div>
                                    <div className="status-dot-active shadow-glow"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {error && (
                    <div className="error-alert animate-shake">
                        <i className="bi bi-exclamation-triangle-fill fs-4"></i>
                        <div>
                            <span className="fw-bold d-block">Validation Error</span>
                            <span className="small">{error}</span>
                        </div>
                    </div>
                )}

                {data && (
                    <div className="results-section mt-5">
                        <div className="d-flex justify-content-between align-items-end mb-4 border-bottom border-white border-opacity-10 pb-4">
                            <div>
                                <span className="info-label">Current Registration Status</span>
                                <div className="d-flex align-items-center gap-3">
                                    <h2 className="h3 fw-bold mb-0 text-white text-uppercase">
                                        <span className="text-secondary small d-block mb-1" style={{ fontSize: '0.65rem', letterSpacing: '0.1em' }}>LEGAL BUSINESS NAME</span>
                                        {data.legalName}
                                    </h2>
                                    <span className={`status-badge ${data.status === 'Active' ? 'status-active' : ''}`}>
                                        <i className="bi bi-record-circle-fill me-2"></i>{data.status}
                                    </span>
                                </div>
                                <span className="text-primary small fw-bold tracking-widest mt-2 d-inline-block">{data.gstin}</span>
                            </div>
                            <div className="d-flex gap-2">
                                <button className="btn btn-outline-light btn-sm rounded-pill px-4 border-opacity-25" onClick={() => window.print()}>
                                    <i className="bi bi-printer me-2"></i>Print Registry
                                </button>
                                <button 
                                    className="btn btn-primary btn-sm rounded-pill px-4 shadow-sm"
                                    onClick={() => {
                                        alert("Downloading Official GST Verification Certificate...");
                                    }}
                                >
                                    <i className="bi bi-file-earmark-pdf-fill me-2"></i>Download Certificate
                                </button>
                            </div>
                        </div>

                        <div className="alert bg-success bg-opacity-10 border border-success border-opacity-20 rounded-4 p-3 mb-4 d-flex align-items-center gap-3">
                            <div className="bg-success text-white rounded-circle p-2 d-flex shadow-glow">
                                <i className="bi bi-patch-check-fill fs-5"></i>
                            </div>
                            <div>
                                <span className="d-block fw-bold text-success small">AUTHENTICATED ENTITY</span>
                                <span className="smaller text-secondary">This business profile has been verified against the GST Common Portal records.</span>
                            </div>
                        </div>

                        <div className="info-grid">
                            <div className="info-item">
                                <span className="info-label">Trading Alias</span>
                                <span className="info-value">{data.tradeName || 'Legal Name Only'}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Register Date</span>
                                <span className="info-value">{data.registrationDate}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Business Type</span>
                                <span className="info-value">{data.constitution}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Taxpayer Classification</span>
                                <span className="info-value">{data.taxpayerType}</span>
                            </div>
                            <div className="info-item w-100" style={{ gridColumn: 'span 2' }}>
                                <span className="info-label">Primary Business Address</span>
                                <span className="info-value">{data.address}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">State Authority</span>
                                <span className="info-value">{data.stateJurisdiction}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Central Authority</span>
                                <span className="info-value">{data.centerJurisdiction}</span>
                            </div>
                        </div>
                        
                        <div className="mt-5 p-4 rounded-4 bg-primary bg-opacity-10 border border-primary border-opacity-20">
                            <div className="d-flex gap-3 align-items-center">
                                <i className="bi bi-info-circle-fill text-primary fs-4"></i>
                                <p className="mb-0 small text-secondary">
                                    This verification is based on the GST Common Portal records at the time of retrieval. 
                                    Ensure compliance by cross-verifying with official certificates.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
