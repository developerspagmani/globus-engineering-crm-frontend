'use client';

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { addCustomer } from '@/redux/features/customerSlice';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ModuleGuard from '@/components/ModuleGuard';

export default function NewLedgerAccountPage() {
    const dispatch = useDispatch();
    const router = useRouter();
    const { company: activeCompany } = useSelector((state: RootState) => state.auth);

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        street1: '',
        street2: '',
        city: '',
        state: '',
        status: 'active'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) {
            alert('Please enter a Customer Name');
            return;
        }

        setLoading(true);
        try {
            await (dispatch as any)(addCustomer({
                ...formData,
                company: formData.name, // Mapping for model consistency
                company_id: activeCompany?.id || ''
            })).unwrap();

            alert('Account added successfully!');
            router.push('/ledger');
        } catch (err: any) {
            alert('Error: ' + err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModuleGuard moduleId="mod_ledger">
            <div className="container-fluid py-4 min-vh-100 bg-white">
                <div className="d-flex align-items-center justify-content-between mb-4">
                    <div className="d-flex align-items-center gap-3">
                        <Link href="/ledger" className="btn btn-outline-dark rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                            <i className="bi bi-arrow-left"></i>
                        </Link>
                        <h2 className="fw-bold mb-0">Add Ledger Account</h2>
                    </div>
                </div>

                <div className="card border-0 shadow-sm rounded-0">
                    <form onSubmit={handleSubmit}>
                        <div className="table-responsive">
                            <table className="table align-middle mb-0">
                                <thead className="table-light">
                                    <tr className="text-muted border-bottom small text-uppercase fw-bold">
                                        <th className="py-3 border-0 px-4" style={{ width: '25%' }}>Customer Name</th>
                                        <th className="py-3 border-0" style={{ width: '20%' }}>Strret1</th>
                                        <th className="py-3 border-0" style={{ width: '15%' }}>Strret2</th>
                                        <th className="py-3 border-0" style={{ width: '15%' }}>City</th>
                                        <th className="py-3 border-0" style={{ width: '15%' }}>State</th>
                                        <th className="py-3 border-0 text-center px-4" style={{ width: '10%' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-bottom">
                                        <td className="px-4">
                                            <input
                                                type="text"
                                                className="form-control border-0 bg-light py-2 fw-bold text-uppercase shadow-none"
                                                placeholder="ENTER NAME"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                required
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                className="form-control border-0 bg-light py-2 shadow-none"
                                                placeholder="Street 1"
                                                value={formData.street1}
                                                onChange={(e) => setFormData({ ...formData, street1: e.target.value })}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                className="form-control border-0 bg-light py-2 shadow-none"
                                                placeholder="Street 2"
                                                value={formData.street2}
                                                onChange={(e) => setFormData({ ...formData, street2: e.target.value })}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                className="form-control border-0 bg-light py-2 shadow-none"
                                                placeholder="City"
                                                value={formData.city}
                                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                className="form-control border-0 bg-light py-2 shadow-none"
                                                placeholder="State"
                                                value={formData.state}
                                                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                            />
                                        </td>
                                        <td className="text-center px-4">
                                            <button
                                                type="submit"
                                                className="btn btn-success p-1 px-3 fw-bold border-0 shadow-sm rounded-pill py-2"
                                                disabled={loading}
                                            >
                                                {loading ? <span className="spinner-border spinner-border-sm"></span> : 'SAVE'}
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </form>
                </div>

                <div className="mt-4 p-4 border rounded-3 bg-light">
                    <h6 className="fw-bold mb-3 text-uppercase small text-muted">Instructions:</h6>
                    <ul className="small mb-0 text-muted">
                        <li>Enter the exact Customer Name as it should appear in invoices and ledger reports.</li>
                        <li>Address fields are recommended for accurate transportation and GST compliance.</li>
                        <li>Once saved, this account will immediately be available in the Ledger Report and Invoice modules.</li>
                    </ul>
                </div>
            </div>
        </ModuleGuard>
    );
}
