'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '@/redux/store';
import { createCustomer, updateCustomer } from '@/redux/features/customerSlice';
import { Customer } from '@/types/modules';

interface CustomerFormProps {
  initialData?: Customer;
  mode: 'create' | 'edit';
}

const CustomerForm: React.FC<CustomerFormProps> = ({ initialData, mode }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const router = useRouter();
  const [formData, setFormData] = useState({
    customerType: 'Customer',
    name: '',
    company: '',
    email: '',
    phone: '',
    industry: 'Automotive',
    status: 'lead' as Customer['status'],
    agentId: '',
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
    cst: '',
    tc: '',
    vmc: '',
    hmc: '',
    paymentTerms: '',
    company_id: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        customerType: initialData.customerType || 'Customer',
        name: initialData.name || '',
        company: initialData.company || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        industry: initialData.industry || 'Automotive',
        status: initialData.status || 'lead',
        agentId: initialData.agentId || '',
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
        cst: initialData.cst || '',
        tc: initialData.tc || '',
        vmc: initialData.vmc || '',
        hmc: initialData.hmc || '',
        paymentTerms: initialData.paymentTerms || '',
        company_id: initialData.company_id || ''
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('--- SUBMIT START (DEBUG) ---');
    console.log('Full User Object from Redux:', user);
    console.log('User company_id:', user?.company_id);
    console.log('User companyId (camel):', (user as any)?.companyId);
    console.log('Form raw company_id:', formData.company_id);

    try {
      const finalData = { ...formData };
      
      const sessionCompanyId = user?.company_id || (user as any)?.companyId;

      if (!finalData.company_id && sessionCompanyId) {
        console.log('Autocompleting missing company_id with:', sessionCompanyId);
        finalData.company_id = sessionCompanyId;
      }

      console.log('Final Payload checking out:', finalData);
      console.log('----------------------------');

      // Auto-assign agent if role is sales_agent
      if (mode === 'create' && user?.role === 'sales_agent') {
        finalData.agentId = user.id;
      }

      if (mode === 'create') {
        const resultAction = await (dispatch as any)(createCustomer(finalData as any));
        if (createCustomer.fulfilled.match(resultAction)) {
          router.push('/customers');
        }
      } else if (mode === 'edit' && initialData) {
        const resultAction = await (dispatch as any)(updateCustomer({ ...initialData, ...finalData } as any));
        if (updateCustomer.fulfilled.match(resultAction)) {
          router.push('/customers');
        }
      }
    } catch (err) {
      console.error('Failed to save customer:', err);
      alert('Failed to save customer');
    }
  };

  const fillMockData = () => {
    setFormData({
      customerType: 'Distributor',
      name: 'Test Tech Corp',
      company: 'Testing Innovations Ltd',
      email: 'testing@innovations.com',
      phone: '+91 9876543210',
      industry: 'Electronics',
      status: 'active',
      agentId: user?.id || '',
      street1: 'No 45, Developer Lane',
      street2: 'Phase 3, Sector 5',
      city: 'Bangalore',
      area: 'Whitefield',
      state: 'KARNATAKA',
      stateCode: '29',
      pinCode: '560066',
      contactPerson1: 'Rahul Sharma',
      designation1: 'Managing Director',
      emailId1: 'rahul@innovations.com',
      phoneNumber1: '+91 9988776655',
      contactPerson2: 'Priya Patel',
      designation2: 'Purchasing Head',
      emailId2: 'priya@innovations.com',
      phoneNumber2: '+91 9988776644',
      contactPerson3: 'Arun Kumar',
      designation3: 'Technical Lead',
      emailId3: 'arun@innovations.com',
      phoneNumber3: '+91 9988776633',
      landline: '080-23456789',
      fax: '080-23456780',
      gst: '29ABCDE1234F2Z5',
      tin: 'TIN987654321',
      cst: 'CST123456789',
      tc: 'TC-500',
      vmc: 'VMC-800',
      hmc: 'HMC-1200',
      paymentTerms: 'Net 45 Days',
      company_id: user?.company_id || ''
    });
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
            {mode === 'create' && (
              <button type="button" onClick={fillMockData} className="btn btn-sm btn-outline-warning d-flex align-items-center gap-2 rounded-pill px-3">
                <i className="bi bi-magic"></i> Auto-Fill Test Data
              </button>
            )}
          </div>
          <div className="row g-3 mb-4">
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold small text-muted text-uppercase tracking-wider">Customer Type</label>
              <select className="form-select" name="customerType" value={formData.customerType} onChange={handleChange} required>
                <option value="Customer">Customer</option>
                <option value="Dealer">Dealer</option>
                <option value="Distributor">Distributor</option>
              </select>
            </div>
            {renderInput('Customer Name', 'name', 'text', true)}
            {renderInput('Company Name', 'company', 'text', true)}
            {renderInput('Email Address', 'email', 'email', true)}
            {renderInput('Phone Number', 'phone', 'text', true)}
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold small text-muted text-uppercase tracking-wider">Industry</label>
              <select className="form-select" name="industry" value={formData.industry} onChange={handleChange} required>
                <option value="Automotive">Automotive</option>
                <option value="Electronics">Electronics</option>
                <option value="Construction">Construction</option>
                <option value="Machinery">Machinery</option>
              </select>
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold small text-muted text-uppercase tracking-wider">Status</label>
              <select className="form-select" name="status" value={formData.status} onChange={handleChange} required>
                <option value="active">Active</option>
                <option value="lead">Lead</option>
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

          <h5 className="mb-4 text-primary border-bottom pb-2">Machine Details</h5>
          <div className="row g-3 mb-4">
            {renderInput('T/C', 'tc')}
            {renderInput('VMC', 'vmc')}
            {renderInput('HMC', 'hmc')}
            {renderInput('Payment Terms', 'paymentTerms')}
          </div>

          <div className="mt-5 pt-4 border-top d-flex gap-3">
            <button type="submit" className="btn btn-primary px-4">
              {mode === 'create' ? 'Register Customer' : 'Update Profile'}
            </button>
            <button 
              type="button" 
              className="btn btn-outline-secondary px-4"
              onClick={() => router.push('/customers')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerForm;
