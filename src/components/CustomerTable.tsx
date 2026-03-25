"use client";

import React, { useState } from "react";

import { Customer } from "@/types/modules";

interface CustomerTableProps {
    customers: Customer[];
    selectedRegion: string | null;
}

const CustomerTable = ({ customers, selectedRegion }: CustomerTableProps) => {
    const [searchTerm, setSearchTerm] = useState("");

    const filtered = customers.filter(c =>
        searchTerm === "" ||
        Object.values(c).some(val =>
            String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    return (
        <div className="sales-rep-table bg-white h-100 d-flex flex-column rounded-3 shadow-sm border overflow-hidden">
            {/* Table Header / Toolbar */}
            <div className="table-toolbar px-3 py-2 border-bottom d-flex align-items-center justify-content-between bg-white sticky-top z-3">
                <div className="d-flex align-items-center">
                    <div className="d-flex align-items-center gap-2 px-2">
                        <i className="bi bi-geo-alt-fill text-primary small"></i>
                        <span className="small fw-bold text-dark text-uppercase tracking-wider">
                            {selectedRegion ? selectedRegion : "All Regions"}
                        </span>
                    </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                    <div className="search-input-group position-relative">
                        <i className="bi bi-search search-icon"></i>
                        <input
                            type="text"
                            className="form-control form-control-sm ps-4 border-0 bg-light"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="table-responsive flex-grow-1 custom-scrollbar">
                <table className="table table-hover align-middle mb-0">
                    <thead>
                        <tr>
                            <th className="name-col">User Name</th>
                            <th className="location-col">location</th>
                            <th className="action-col">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length > 0 ? (
                            filtered.map((customer, index) => (
                                <tr key={index}>
                                    <td className="name-col fw-medium">{customer.name}</td>
                                    <td className="location-col">
                                        <div className="d-flex align-items-center gap-2 text-primary-emphasis">
                                            <i className="bi bi-geo-alt-fill text-orange"></i>
                                            <span className="small">{customer.district}, {customer.state}</span>
                                        </div>
                                    </td>
                                    <td className="action-col">
                                        <div className="d-flex gap-2 justify-content-end">
                                            <button className="action-row-btn delete-btn"><i className="bi bi-trash3"></i></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={3} className="text-center py-5 text-muted small">
                                    No data matching "{searchTerm}"
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <style jsx>{`
                .sales-rep-table {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                }
                
                .table-toolbar {
                    min-height: 48px;
                    border-bottom: 1px solid #f1f5f9 !important;
                }

                .tool-btn {
                    background: transparent;
                    border: none;
                    color: #64748b;
                    padding: 6px;
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }
                .tool-btn:hover {
                    background: #f1f5f9;
                    color: #0f172a;
                }
                .tool-btn.active-tool {
                    background: #64748b;
                    color: white;
                }

                .search-input-group {
                    width: 180px;
                }
                .search-icon {
                    position: absolute;
                    left: 10px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #94a3b8;
                    pointer-events: none;
                    font-size: 0.8rem;
                }
                .search-input-group .form-control {
                    border-radius: 4px;
                }

                table thead th {
                    background: #fff;
                    color: #94a3b8;
                    font-weight: 600;
                    font-size: 0.8rem;
                    padding: 12px 16px;
                    border-bottom: 1px solid #f1f5f9;
                    text-transform: none;
                }

                table tbody td {
                    padding: 10px 16px;
                    font-size: 0.85rem;
                    border-bottom: 1px solid #f8fafc;
                    color: #334155;
                }

                .id-col { width: 40px; }
                .name-col { width: 180px; }
                .location-col { min-width: 200px; }
                .image-col { width: 80px; }
                .action-col { width: 100px; text-align: right; }

                .text-orange { color: #f97316; }

                .avatar-wrapper {
                    width: 32px;
                    height: 32px;
                    border-radius: 4px;
                    overflow: hidden;
                    background: #f1f5f9;
                }
                .avatar-img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .action-row-btn {
                    background: transparent;
                    border: 1px solid #e2e8f0;
                    color: #94a3b8;
                    width: 28px;
                    height: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 4px;
                    transition: all 0.2s;
                }
                .action-row-btn:hover {
                    background: #f1f5f9;
                    color: #475569;
                    border-color: #cbd5e1;
                }
                .action-row-btn.delete-btn:hover {
                    background: #fee2e2;
                    color: #ef4444;
                    border-color: #fecaca;
                }

                .custom-scrollbar::-webkit-scrollbar {
                    width: 5px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }

                .fw-black { font-weight: 900; }
            `}</style>
        </div>
    );
};

export default CustomerTable;
