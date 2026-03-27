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
        <div className="card shadow-sm border-0 h-100 d-flex flex-column overflow-hidden">
            {/* Table Header / Toolbar */}
            <div className="px-4 py-3 border-bottom d-flex align-items-center justify-content-between bg-white sticky-top z-3">
                <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-geo-alt-fill text-secondary"></i>
                    <span className="small fw-800 text-dark text-uppercase tracking-wider">
                        {selectedRegion ? selectedRegion : "All Regions"}
                    </span>
                </div>

                <div className="d-flex align-items-center gap-3">
                    <div className="position-relative" style={{ width: '220px' }}>
                        <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" style={{ fontSize: '0.9rem' }}></i>
                        <input
                            type="text"
                            className="form-control form-control-sm ps-5 bg-light border-0"
                            placeholder="Search customers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="table-responsive flex-grow-1 px-3">
                <table className="table align-middle">
                    <thead>
                        <tr>
                            <th>Customer Name</th>
                            <th>Email</th>
                            <th>Phone Number</th>
                            <th>GSTN</th>
                            <th className="text-end">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length > 0 ? (
                            filtered.map((customer, index) => (
                                <tr key={index}>
                                    <td className="fw-800 text-primary small text-uppercase">{customer.name}</td>
                                    <td className="text-muted small">{customer.email}</td>
                                    <td className="text-muted small">{customer.phone}</td>
                                    <td><span className="badge bg-light text-dark border fw-bold">{customer.gst || '-'}</span></td>
                                    <td className="text-end">
                                        <button className="btn btn-sm btn-outline-danger border-0 p-2" title="Delete">
                                            <i className="bi bi-trash3 fs-6"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="text-center py-5 text-muted small">
                                    No data matching "{searchTerm}"
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CustomerTable;
