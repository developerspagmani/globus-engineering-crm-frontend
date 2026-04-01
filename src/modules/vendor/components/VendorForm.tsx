'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { useRouter } from 'next/navigation';
import { createVendor, updateVendor } from '@/redux/features/vendorSlice';
import { fetchCompanies } from '@/redux/features/companySlice';
import { Vendor } from '@/types/modules';

interface VendorFormProps {
  initialData?: Vendor;
  mode: 'create' | 'edit';
}

const VendorForm: React.FC<VendorFormProps> = ({ initialData, mode }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { user, company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items: companies } = useSelector((state: RootState) => state.companies);
  const [formData, setFormData] = useState({
    vendorType: 'New',
    name: '',
    company: '',
    email: '',
    phone: '',
    category: 'Raw Materials',
    status: 'pending' as Vendor['status'],
    company_id: (user?.role === 'super_admin' && activeCompany) ? activeCompany.id : (user?.company_id || ''),
    street1: '',
    street2: '',
    city: '',
    area: '',
    state: '',
    stateCode: '',
    pinCode: '',
    contactPerson1: '',
    designation1: '',
    emailId1: '',
    phoneNumber1: '',
    contactPerson2: '',
    designation2: '',
    emailId2: '',
    phoneNumber2: '',
    contactPerson3: '',
    designation3: '',
    emailId3: '',
    phoneNumber3: '',
    landline: '',
    fax: '',
    gst: '',
    tin: '',
    cst: ''
  });

  useEffect(() => {
    if (user?.role === 'super_admin') {
      (dispatch as any)(fetchCompanies());
    }
  }, [dispatch, user]);

  useEffect(() => {
    // If Super Admin switches company, update the form
    if (user?.role === 'super_admin' && activeCompany && mode === 'create' && !formData.name) {
      setFormData(prev => ({ ...prev, company_id: activeCompany.id }));
    }
  }, [activeCompany, user?.role, mode]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        vendorType: initialData.vendorType || 'New',
        name: initialData.name || '',
        company: initialData.company || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        category: initialData.category || 'Raw Materials',
        status: initialData.status || 'pending',
        company_id: initialData.company_id || '',
        street1: initialData.street1 || '',
        street2: initialData.street2 || '',
        city: initialData.city || '',
        area: initialData.area || '',
        state: initialData.state || '',
        stateCode: initialData.stateCode || '',
        pinCode: initialData.pinCode || '',
        contactPerson1: initialData.contactPerson1 || '',
        designation1: initialData.designation1 || '',
        emailId1: initialData.emailId1 || '',
        phoneNumber1: initialData.phoneNumber1 || '',
        contactPerson2: initialData.contactPerson2 || '',
        designation2: initialData.designation2 || '',
        emailId2: initialData.emailId2 || '',
        phoneNumber2: initialData.phoneNumber2 || '',
        contactPerson3: initialData.contactPerson3 || '',
        designation3: initialData.designation3 || '',
        emailId3: initialData.emailId3 || '',
        phoneNumber3: initialData.phoneNumber3 || '',
        landline: initialData.landline || '',
        fax: initialData.fax || '',
        gst: initialData.gst || '',
        tin: initialData.tin || '',
        cst: initialData.cst || ''
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const finalData = { ...formData };
      
      // If user is a staff/admin with a fixed company, ensure it's set
      if (!finalData.company_id && user?.company_id) {
        finalData.company_id = user.company_id;
      }

      if (mode === 'create') {
        const resultAction = await (dispatch as any)(createVendor(finalData as any));
        if (createVendor.fulfilled.match(resultAction)) {
          router.push('/vendors');
        }
      } else if (mode === 'edit' && initialData) {
        const resultAction = await (dispatch as any)(updateVendor({ ...initialData, ...finalData } as any));
        if (updateVendor.fulfilled.match(resultAction)) {
          router.push('/vendors');
        }
      }
    } catch (err) {
      console.error('Failed to save vendor:', err);
      alert('Failed to save vendor');
    }
  };

  const fillMockData = () => {
    setFormData(prev => ({
      ...prev,
      vendorType: 'Regular',
      name: 'Sample Tools Pvt Ltd',
      company: 'Sample Tools Pvt Ltd',
      email: 'contact@sampletools.com',
      phone: '+91 8877665544',
      category: 'Machinery',
      status: 'active',
      street1: '12 Industrial Estate',
      street2: 'Block A, Sector 4',
      city: 'Coimbatore',
      area: 'Peelamedu',
      state: 'TAMIL NADU',
      stateCode: '33',
      pinCode: '641004',
      contactPerson1: 'Sathish Kumar',
      designation1: 'Operations Manager',
      emailId1: 'sathish@sampletools.com',
      phoneNumber1: '+91 9988112233',
      contactPerson2: 'Meena Reddy',
      designation2: 'Accounts Head',
      emailId2: 'meena@sampletools.com',
      phoneNumber2: '+91 9988112244',
      contactPerson3: 'Vijay',
      designation3: 'Dispatch Coordinator',
      emailId3: 'dispatch@sampletools.com',
      phoneNumber3: '+91 9988112255',
      landline: '0422-2567890',
      fax: '0422-2567891',
      gst: '33AAABC1234D1Z2',
      tin: 'TIN-33-8822',
      cst: 'CST-33-9911',
      // Respect current selection for Super Admin
      company_id: prev.company_id || user?.company_id || 'comp_globus'
    }));
  };

  const renderInput = (label: string, name: keyof typeof formData, type = 'text', required = false) => (
    <div className="col-md-6 mb-3">
      <label className="form-label fw-semibold small text-muted text-uppercase tracking-wider">
        {label}
      </label>
      <input
        type={type}
        className="form-control"
        name={name}
        value={formData[name]}
        onChange={handleChange}
        placeholder={label}
        required={required}
      />
    </div>
  );

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body p-4">
        <form onSubmit={handleSubmit}>
          
          <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
            <h5 className="text-primary mb-0">Basic Details</h5>
            {/* {mode === 'create' && (
              <button type="button" onClick={fillMockData} className="btn btn-sm btn-outline-warning d-flex align-items-center gap-2 rounded-pill px-3">
                <i className="bi bi-magic"></i> Auto-Fill Test Data
              </button>
            )} */}
          </div>
          <div className="row g-3 mb-4">
            {user?.role === 'super_admin' && (
              <div className="col-md-12 mb-3">
                 <div className="p-3 bg-light rounded border border-warning shadow-sm">
                    <label className="form-label fw-bold text-dark small text-uppercase mb-2 d-block">Associate with Company (System-Level Permission)</label>
                    <select 
                      className="form-select border-primary fw-bold" 
                      name="company_id" 
                      value={formData.company_id} 
                      onChange={handleChange}
                      required
                    >
                      <option value="">-- Choose Company --</option>
                      {companies.map(comp => (
                        <option key={comp.id} value={comp.id}>{comp.name}</option>
                      ))}
                    </select>
                    <small className="text-muted mt-2 d-block">You are adding this vendor to <strong>{companies.find(c => c.id === formData.company_id)?.name || 'the selected company'}</strong> as a Super Admin.</small>
                 </div>
              </div>
            )}
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold small text-muted text-uppercase tracking-wider">Vendor Type</label>
              <select className="form-select" name="vendorType" value={formData.vendorType} onChange={handleChange} required>
                <option value="New">New</option>
                <option value="Regular">Regular</option>
                <option value="Contractor">Contractor</option>
              </select>
            </div>
            {renderInput('Vendor Name', 'name', 'text', true)}
            {renderInput('Company Name', 'company', 'text', true)}
            {renderInput('Email Address', 'email', 'email', true)}
            {renderInput('Phone Number', 'phone', 'text', true)}
            
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold small text-muted text-uppercase tracking-wider">Category</label>
              <select className="form-select" name="category" value={formData.category} onChange={handleChange} required>
                <option value="Raw Materials">Raw Materials</option>
                <option value="Logistics">Logistics</option>
                <option value="Machinery">Machinery</option>
                <option value="Electrical">Electrical</option>
                <option value="Services">Services</option>
              </select>
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold small text-muted text-uppercase tracking-wider">Status</label>
              <select className="form-select" name="status" value={formData.status} onChange={handleChange} required>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <h5 className="mb-4 text-primary border-bottom pb-2">Address Details</h5>
          <div className="row g-3 mb-4">
            {renderInput('Street 1', 'street1')}
            {renderInput('Street 2', 'street2')}
            {renderInput('City', 'city')}
            {renderInput('Area', 'area')}
            {renderInput('State', 'state')}
            {renderInput('State Code', 'stateCode')}
            {renderInput('Pin code', 'pinCode')}
          </div>

          <h5 className="mb-4 text-primary border-bottom pb-2">Contact Persons</h5>
          <div className="row g-3 mb-4">
            {renderInput('Contact Person 1', 'contactPerson1')}
            {renderInput('Designation 1', 'designation1')}
            {renderInput('Email Id 1', 'emailId1', 'email')}
            {renderInput('Phone Number 1', 'phoneNumber1')}
            
            {renderInput('Contact Person 2', 'contactPerson2')}
            {renderInput('Designation 2', 'designation2')}
            {renderInput('Email Id 2', 'emailId2', 'email')}
            {renderInput('Phone Number 2', 'phoneNumber2')}
            
            {renderInput('Contact Person 3', 'contactPerson3')}
            {renderInput('Designation 3', 'designation3')}
            {renderInput('Email Id 3', 'emailId3', 'email')}
            {renderInput('Phone Number 3', 'phoneNumber3')}
            
            {renderInput('Landline', 'landline')}
            {renderInput('Fax', 'fax')}
          </div>

          <h5 className="mb-4 text-primary border-bottom pb-2">Tax Details</h5>
          <div className="row g-3 mb-4">
            {renderInput('GST', 'gst')}
            {renderInput('TIN', 'tin')}
            {renderInput('CST', 'cst')}
          </div>

          <div className="mt-5 pt-4 border-top d-flex gap-3">
            <button type="submit" className="btn btn-primary px-4">
              {mode === 'create' ? 'Register Vendor' : 'Update Vendor'}
            </button>
            <button 
              type="button" 
              className="btn btn-outline-secondary px-4"
              onClick={() => router.push('/vendors')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VendorForm;
