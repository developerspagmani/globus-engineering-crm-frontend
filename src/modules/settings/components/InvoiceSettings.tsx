'use client';

import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { updateInvoiceSettings } from '@/redux/features/invoiceSlice';

const InvoiceSettings: React.FC = () => {
  const dispatch = useDispatch();
  const { settings } = useSelector((state: RootState) => state.invoices);
  
  const [formData, setFormData] = useState({ ...settings });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const secondaryFileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const newData = { ...formData, [name]: value };
    setFormData(newData);
    dispatch(updateInvoiceSettings({ [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
    dispatch(updateInvoiceSettings({ [name]: checked }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'logoSecondary') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const logoData = reader.result as string;
        setFormData(prev => ({ ...prev, [field]: logoData }));
        dispatch(updateInvoiceSettings({ [field]: logoData }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      dispatch(updateInvoiceSettings(formData));
      setSaving(false);
      setMessage('Invoice configuration saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    }, 800);
  };

  return (
    <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
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
                  <div className="bg-primary bg-opacity-10 p-2 rounded-3 text-primary">
                    <i className="bi bi-brush fs-5"></i>
                  </div>
                  <h6 className="fw-bold mb-0">Branding & Identity</h6>
                </div>
                
                <div className="row g-4 align-items-center">
                  <div className="col-md-6">
                    <label className="form-label small text-muted text-uppercase fw-bold mb-2">Primary Logo (Left)</label>
                    <div 
                      className="ratio ratio-16x9 bg-light rounded-4 border border-2 border-dashed d-flex align-items-center justify-content-center overflow-hidden cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                      style={{ borderStyle: 'dashed' }}
                    >
                      {formData.logo ? (
                        <img src={formData.logo} alt="Logo Preview" className="img-fluid p-2 object-fit-contain" />
                      ) : (
                        <div className="text-center text-muted p-2">
                          <i className="bi bi-cloud-arrow-up fs-3 d-block mb-1"></i>
                          <span className="x-small fw-bold">Upload Primary Logo</span>
                        </div>
                      )}
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="d-none" 
                      accept="image/*" 
                      onChange={(e) => handleLogoUpload(e, 'logo')} 
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small text-muted text-uppercase fw-bold mb-2">Secondary Logo (Right)</label>
                    <div 
                      className="ratio ratio-16x9 bg-light rounded-4 border border-2 border-dashed d-flex align-items-center justify-content-center overflow-hidden cursor-pointer"
                      onClick={() => secondaryFileInputRef.current?.click()}
                      style={{ borderStyle: 'dashed' }}
                    >
                      {formData.logoSecondary ? (
                        <img src={formData.logoSecondary} alt="Secondary Logo Preview" className="img-fluid p-2 object-fit-contain" />
                      ) : (
                        <div className="text-center text-muted p-2">
                          <i className="bi bi-cloud-arrow-up fs-3 d-block mb-1"></i>
                          <span className="x-small fw-bold">Upload Secondary Logo</span>
                        </div>
                      )}
                    </div>
                    <input 
                      type="file" 
                      ref={secondaryFileInputRef} 
                      className="d-none" 
                      accept="image/*" 
                      onChange={(e) => handleLogoUpload(e, 'logoSecondary')} 
                    />
                  </div>
                  
                  <div className="col-12">
                    <div className="mb-3">
                      <div className="form-check form-switch custom-switch">
                        <input 
                          className="form-check-input" 
                          type="checkbox" 
                          id="showLogo" 
                          name="showLogo"
                          checked={formData.showLogo}
                          onChange={handleCheckboxChange}
                        />
                        <label className="form-check-label fw-bold small text-dark" htmlFor="showLogo">Display logos on invoice</label>
                      </div>
                      <div className="text-muted x-small mt-1">Recommended size: High resolution PNG/SVG. Primary logo is displayed on top-left, Secondary on top-right.</div>
                    </div>

                    <div>
                      <label className="form-label small text-muted text-uppercase fw-bold">Brand Accent Color</label>
                      <div className="d-flex align-items-center gap-3">
                        <input 
                          type="color" 
                          className="form-control form-control-color border-0 p-1 rounded-circle" 
                          title="Choose your color"
                          name="accentColor"
                          value={formData.accentColor}
                          onChange={handleInputChange}
                          style={{ width: '45px', height: '45px' }}
                        />
                        <input 
                          type="text" 
                          className="form-control form-control-sm w-auto fw-mono" 
                          value={formData.accentColor}
                          onChange={handleInputChange}
                          name="accentColor"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <hr className="my-2 opacity-5" />

              {/* Numbering Section */}
              <div className="col-12">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <div className="bg-success bg-opacity-10 p-2 rounded-3 text-success">
                    <i className="bi bi-hash fs-5"></i>
                  </div>
                  <h6 className="fw-bold mb-0">Sequence & Numbering</h6>
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small text-muted text-uppercase fw-bold">Invoice Prefix</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. INV" 
                      name="prefix"
                      value={formData.prefix}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small text-muted text-uppercase fw-bold">Next Number</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      name="nextNumber"
                      value={formData.nextNumber}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              <hr className="my-2 opacity-5" />

              {/* Terms & Footer Section */}
              <div className="col-12">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <div className="bg-info bg-opacity-10 p-2 rounded-3 text-info">
                    <i className="bi bi-file-text fs-5"></i>
                  </div>
                  <h6 className="fw-bold mb-0">Default Content</h6>
                </div>

                <div className="mb-4">
                  <div className="form-check form-switch custom-switch mb-3">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="showDeclaration" 
                      name="showDeclaration"
                      checked={formData.showDeclaration}
                      onChange={handleCheckboxChange}
                    />
                    <label className="form-check-label fw-bold small text-dark" htmlFor="showDeclaration">Show Declaration Section</label>
                  </div>

                  <label className="form-label small text-muted text-uppercase fw-bold">Terms & Conditions</label>
                  <textarea 
                    className="form-control" 
                    rows={5} 
                    placeholder="Enter default terms..."
                    name="termsAndConditions"
                    value={formData.termsAndConditions}
                    onChange={handleInputChange}
                  ></textarea>
                  <div className="text-muted x-small mt-1 text-end">This will appear at the bottom-left of your invoices.</div>
                </div>

                <div>
                  <label className="form-label small text-muted text-uppercase fw-bold">Footer Note</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Thank you for your business!" 
                    name="footerText"
                    value={formData.footerText}
                    onChange={handleInputChange}
                  />
                  <div className="text-muted x-small mt-1 text-end">A short closing message centered at the very bottom.</div>
                </div>
              </div>

              <div className="col-12 mt-4 pt-2">
                <button 
                  type="submit" 
                  className="btn btn-dark px-5 py-2 rounded-pill shadow-sm d-flex align-items-center gap-2"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-save"></i>
                      Save Configuration
                    </>
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
