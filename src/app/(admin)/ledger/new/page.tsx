'use client';

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { addCustomer } from '@/redux/features/customerSlice';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ModuleGuard from '@/components/ModuleGuard';
import FullPageStatus from '@/components/FullPageStatus';

export default function NewLedgerAccountPage() {
    const dispatch = useDispatch();
    const router = useRouter();
    const { company: activeCompany } = useSelector((state: RootState) => state.auth);

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        industry: 'General',
        street1: '',
        street2: '',
        city: '',
        state: '',
        status: 'active' as const
    });

    const [modal, setModal] = useState<{ isOpen: boolean; type: 'success' | 'error' | 'warning'; title: string; message: string }>({
        isOpen: false,
        type: 'success',
        title: '',
        message: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) {
            setModal({
                isOpen: true,
                type: 'warning',
                title: 'Missing Information',
                message: 'Please enter the name of the party or vendor to create the ledger account.'
            });
            return;
        }

        setLoading(true);
        try {
            await (dispatch as any)(addCustomer({
                ...formData,
                company: formData.name, // Mapping for model consistency
                company_id: activeCompany?.id || ''
            })).unwrap();

            setModal({
                isOpen: true,
                type: 'success',
                title: 'Account Provisioned',
                message: `Ledger account for ${formData.name} has been created successfully.`
            });
        } catch (err: any) {
            setModal({
                isOpen: true,
                type: 'error',
                title: 'Creation Failed',
                message: err.message || 'The system was unable to register the new ledger account.'
            });
        } finally {
            setLoading(false);
        }
    };

    const renderInput = (label: string, name: keyof typeof formData, placeholder: string, required = false) => (
        <div className="col-md-6 mb-3">
            <label className="form-label fw-semibold small text-muted text-capitalize tracking-wider">
                {label}
            </label>
            <input
                type="text"
                className="form-control"
                name={name}
                value={formData[name]}
                onChange={handleChange}
                placeholder={placeholder}
                required={required}
            />
        </div>
    );

    return (
        <ModuleGuard moduleId="mod_ledger">
            <div className="container-fluid py-4 min-vh-100 bg-light">
                {/* Header with Back Button */}
                <div className="d-flex align-items-center mb-5 pb-2 border-bottom">
                    <Link href="/ledger" className="back-btn-standard" title="Back to Ledger">
                        <i className="bi bi-arrow-left fs-4"></i>
                    </Link>
                    <div>
                        <h2 className="fw-bold mb-0">Add Ledger Account</h2>
                        <p className="text-muted small mb-0">Register a new party or vendor to the ledger system.</p>
                    </div>
                </div>

                <div className="card border-0 shadow-sm">
                    <div className="card-body p-4">
                        <form onSubmit={handleSubmit}>

                            {/* Section: Basic Details */}
                            <h5 className="text-primary mb-4 border-bottom pb-2">Basic Details</h5>
                            <div className="row g-3 mb-5">
                                <div className="col-md-12 mb-3">
                                    <label className="form-label fw-semibold small text-muted text-capitalize tracking-wider">Customer Name</label>
                                    <input
                                        type="text"
                                        className="form-control text-nowrap text-muted fw-100"
                                        name="name"
                                        placeholder="Enter your name.."
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Section: Address Details */}
                            <h5 className="text-primary mb-4 border-bottom pb-2">Address Details</h5>
                            <div className="row g-3 mb-5">
                                {renderInput('Street 1', 'street1', 'Building/Street Name')}
                                {renderInput('Street 2', 'street2', 'Landmark/Area')}
                                {renderInput('City', 'city', 'Enter City')}
                                {renderInput('State', 'state', 'Enter State')}
                            </div>

                            {/* Form Actions */}
                            <div className="mt-5 pt-4 border-top d-flex gap-3">
                                <button
                                    type="submit"
                                    className="btn btn-primary px-5 py-2 fw-bold text-capitalize shadow-sm"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-check2-circle me-2"></i>
                                            Save
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary px-5 py-2 fw-bold text-capitalize"
                                    onClick={() => router.push('/ledger')}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>


            </div>
            {modal.isOpen && (
                <FullPageStatus 
                    type={modal.type}
                    title={modal.title}
                    message={modal.message}
                    onClose={() => {
                        setModal(prev => ({ ...prev, isOpen: false }));
                        if (modal.type === 'success') router.push('/ledger');
                    }}
                />
            )}
        </ModuleGuard>
    );
}
