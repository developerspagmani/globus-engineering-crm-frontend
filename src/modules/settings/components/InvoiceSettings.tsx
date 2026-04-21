'use client';

import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { updateInvoiceSettings, saveInvoiceSettings, initializeInvoiceSettings } from '@/redux/features/invoiceSlice';
import { setCompanyContext } from '@/redux/features/authSlice';

const InvoiceSettings: React.FC = () => {
  const dispatch = useDispatch();
  const { settings } = useSelector((state: RootState) => state.invoices);
  const { company } = useSelector((state: RootState) => state.auth);
  
  const [formData, setFormData] = useState({ 
    ...settings,
    ...(company?.invoiceSettings || {}),
    logo: company?.logo || settings.logo,
    logoSecondary: company?.logoSecondary || settings.logoSecondary
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const secondaryFileInputRef = useRef<HTMLInputElement>(null);

  // Sync Redux settings with company data on mount
  React.useEffect(() => {
    if (company) {
      const initialSettings = {
        ...settings,
        ...(company.invoiceSettings || {}),
        logo: company.logo || settings.logo,
        logoSecondary: company.logoSecondary || settings.logoSecondary
      };
      dispatch(initializeInvoiceSettings(initialSettings));
      setFormData(initialSettings);
    }
  }, [company?.id]); // Re-run if company changes

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const newData = { ...formData, [name]: value };
    setFormData(newData);
    dispatch(updateInvoiceSettings({ [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: checked }));
    dispatch(updateInvoiceSettings({ [name]: checked }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'logoSecondary') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const logoData = reader.result as string;
        setFormData((prev: any) => ({ ...prev, [field]: logoData }));
        dispatch(updateInvoiceSettings({ [field]: logoData }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    
    setSaving(true);
    try {
      // Save to backend via Company model Update
      const resultAction: any = await (dispatch as any)(saveInvoiceSettings({ 
        companyId: company.id, 
        settings: formData 
      }));
      
      if (saveInvoiceSettings.fulfilled.match(resultAction)) {
        // Update local company context in auth slice to keep synced on refresh
        dispatch(setCompanyContext(resultAction.payload));
        setMessage('Invoice configuration persisted to database!');
      } else {
        setMessage('Failed to save to database: ' + (resultAction.payload || 'Unknown error'));
      }
    } catch (err) {
      setMessage('An error occurred while saving.');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="card border-0 shadow-sm overflow-hidden">
      <div className="card-body p-0">
        <div className="p-4 border-bottom bg-light bg-opacity-50">
          <h5 className="fw-bold mb-1">Invoice Configuration</h5>
          <p className="text-muted small mb-0">Customize how your invoices look and the default terms provided to customers.</p>
        </div>

        <div className="p-4">
          {message && (
            <div className="alert alert-success border-0 shadow-sm mb-4 d-flex align-items-center gap-2">
              <i className="bi bi-check-circle-fill"></i>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="row g-4">
              {/* Branding Section */}
              <div className="col-12">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <div className="bg-primary bg-opacity-10 p-2 text-primary">
                    <i className="bi bi-brush fs-5"></i>
                  </div>
                  <h6 className="fw-bold mb-0">Branding & Identity</h6>
                </div>
                
                <div className="row g-3 align-items-center">
                  <div className="col-md-3">
                    <label className="form-label small text-muted text-uppercase fw-bold mb-2">Primary Logo</label>
                    <div 
                      className="ratio ratio-1x1 bg-light border border-2 border-dashed d-flex align-items-center justify-content-center overflow-hidden cursor-pointer rounded-3"
                      onClick={() => fileInputRef.current?.click()}
                      style={{ borderStyle: 'dashed', maxWidth: '120px' }}
                    >
                      {formData.logo ? (
                        <img src={formData.logo} alt="Logo Preview" className="img-fluid p-2 object-fit-contain" />
                      ) : (
                        <div className="text-center text-muted p-2">
                          <i className="bi bi-plus fs-4 d-block"></i>
                          <span className="x-small fw-bold">Left</span>
                        </div>
                      )}
                    </div>
                    <input type="file" ref={fileInputRef} className="d-none" accept="image/*" onChange={(e) => handleLogoUpload(e, 'logo')} />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label small text-muted text-uppercase fw-bold mb-2">Secondary Logo</label>
                    <div 
                      className="ratio ratio-1x1 bg-light border border-2 border-dashed d-flex align-items-center justify-content-center overflow-hidden cursor-pointer rounded-3"
                      onClick={() => secondaryFileInputRef.current?.click()}
                      style={{ borderStyle: 'dashed', maxWidth: '120px' }}
                    >
                      {formData.logoSecondary ? (
                        <img src={formData.logoSecondary} alt="Secondary Logo Preview" className="img-fluid p-2 object-fit-contain" />
                      ) : (
                        <div className="text-center text-muted p-2">
                          <i className="bi bi-plus fs-4 d-block"></i>
                          <span className="x-small fw-bold">Right</span>
                        </div>
                      )}
                    </div>
                    <input type="file" ref={secondaryFileInputRef} className="d-none" accept="image/*" onChange={(e) => handleLogoUpload(e, 'logoSecondary')} />
                  </div>
                  
                  <div className="col-md-6">
                    <div className="mb-3">
                      <div className="form-check form-switch custom-switch">
                        <input className="form-check-input" type="checkbox" id="showLogo" name="showLogo" checked={formData.showLogo} onChange={handleCheckboxChange} />
                        <label className="form-check-label fw-bold small text-dark" htmlFor="showLogo">Display logos on invoice</label>
                      </div>
                    </div>

                    <div>
                      <label className="form-label small text-muted text-uppercase fw-bold">Brand Accent Color</label>
                      <div className="d-flex align-items-center gap-2">
                        <input type="color" className="form-control form-control-color border-0 p-1" name="accentColor" value={formData.accentColor} onChange={handleInputChange} style={{ width: '38px', height: '38px' }} />
                        <input type="text" className="form-control form-control-sm w-auto fw-mono" value={formData.accentColor} onChange={handleInputChange} name="accentColor" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <hr className="my-2 opacity-5" />

              {/* Company Details Section */}
              <div className="col-12">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <div className="bg-info bg-opacity-10 p-2 text-info">
                    <i className="bi bi-building fs-5"></i>
                  </div>
                  <h6 className="fw-bold mb-0">Supplier & Header Details</h6>
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small text-muted text-uppercase fw-bold">Company Name (Invoice Header)</label>
                    <input type="text" className="form-control fw-bold" name="companyName" value={(formData as any).companyName || ''} onChange={handleInputChange} placeholder="e.g. GLOBUS ENGINEERING MAIN" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small text-muted text-uppercase fw-bold">Sub-Header (Certifications)</label>
                    <input type="text" className="form-control" name="companySubHeader" value={(formData as any).companySubHeader || ''} onChange={handleInputChange} placeholder="An ISO 9001: 2015 Certified Company" />
                  </div>
                  <div className="col-12">
                    <label className="form-label small text-muted text-uppercase fw-bold">Supplier Address</label>
                    <textarea className="form-control" rows={2} name="companyAddress" value={(formData as any).companyAddress || ''} onChange={handleInputChange} placeholder="Full address to be printed under Supplier Details"></textarea>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small text-muted text-uppercase fw-bold">GST Number</label>
                    <input type="text" className="form-control" name="gstNo" value={(formData as any).gstNo || ''} onChange={handleInputChange} placeholder="GSTIN" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small text-muted text-uppercase fw-bold">State & Code</label>
                    <input type="text" className="form-control" name="stateDetails" value={(formData as any).stateDetails || ''} onChange={handleInputChange} placeholder="e.g. Tamilnadu - Code: 33" />
                  </div>
                </div>
              </div>

              <hr className="my-2 opacity-5" />

              {/* Numbering Section */}
              <div className="col-12">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <div className="bg-success bg-opacity-10 p-2 text-success">
                    <i className="bi bi-hash fs-5"></i>
                  </div>
                  <h6 className="fw-bold mb-0">Sequence & Numbering</h6>
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small text-muted text-uppercase fw-bold">Invoice Prefix</label>
                    <input type="text" className="form-control" placeholder="e.g. INV" name="prefix" value={formData.prefix} onChange={handleInputChange} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small text-muted text-uppercase fw-bold">Next Number</label>
                    <input type="number" className="form-control" name="nextNumber" value={formData.nextNumber} onChange={handleInputChange} />
                  </div>
                </div>
              </div>

              <hr className="my-2 opacity-5" />

              {/* Banking Section */}
              <div className="col-12">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <div className="bg-primary bg-opacity-10 p-2 text-primary">
                    <i className="bi bi-bank fs-5"></i>
                  </div>
                  <h6 className="fw-bold mb-0">Banking & Statutory</h6>
                </div>

                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label small text-muted text-uppercase fw-bold">VAT TIN</label>
                    <input type="text" className="form-control" name="vatTin" value={(formData as any).vatTin} onChange={handleInputChange} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small text-muted text-uppercase fw-bold">CST NO</label>
                    <input type="text" className="form-control" name="cstNo" value={(formData as any).cstNo} onChange={handleInputChange} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small text-muted text-uppercase fw-bold">PAN NO</label>
                    <input type="text" className="form-control" name="panNo" value={(formData as any).panNo} onChange={handleInputChange} />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small text-muted text-uppercase fw-bold">Bank Name</label>
                    <input type="text" className="form-control" name="bankName" value={(formData as any).bankName} onChange={handleInputChange} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small text-muted text-uppercase fw-bold">Bank Account Number</label>
                    <input type="text" className="form-control" name="bankAcc" value={(formData as any).bankAcc} onChange={handleInputChange} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small text-muted text-uppercase fw-bold">Branch & IFSC</label>
                    <input type="text" className="form-control" name="bankBranchIfsc" value={(formData as any).bankBranchIfsc} onChange={handleInputChange} />
                  </div>
                </div>
              </div>

              <hr className="my-2 opacity-5" />

              {/* Declaration Section */}
              <div className="col-12">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <div className="bg-warning bg-opacity-10 p-2 text-warning">
                    <i className="bi bi-card-text fs-5"></i>
                  </div>
                  <h6 className="fw-bold mb-0">Legal Declarations & Notes</h6>
                </div>

                <div className="mb-3">
                  <div className="form-check form-switch custom-switch mb-2">
                    <input className="form-check-input" type="checkbox" id="showDeclaration" name="showDeclaration" checked={formData.showDeclaration} onChange={handleCheckboxChange} />
                    <label className="form-check-label fw-bold small text-dark" htmlFor="showDeclaration">Show Declaration Section</label>
                  </div>
                  <textarea 
                    className="form-control bg-light x-small" 
                    rows={6} 
                    name="declarationText" 
                    value={(formData as any).declarationText || ''} 
                    onChange={handleInputChange}
                    placeholder="Enter the full declaration text..."
                  ></textarea>
                </div>
              </div>

              <div className="col-12 mt-4 pt-2">
                <button type="submit" className="btn btn-dark px-5 py-2 shadow-sm d-flex align-items-center gap-2" disabled={saving}>
                  {saving ? (
                    <><span className="spinner-border spinner-border-sm"></span> Saving...</>
                  ) : (
                    <><i className="bi bi-save"></i> Save Configuration</>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InvoiceSettings;
