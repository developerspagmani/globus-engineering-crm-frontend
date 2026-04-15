'use client';

import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

interface LedgerSettingsProps {
  settings: any;
  onSettingsChange: (settings: any) => void;
}

const LedgerSettings: React.FC<LedgerSettingsProps> = ({ settings, onSettingsChange }) => {
  const dispatch = useDispatch();
  
  const [formData, setFormData] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with parent settings
  React.useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newData = { ...formData, [name]: value };
    setFormData(newData);
    onSettingsChange(newData);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    const newData = { ...formData, [name]: checked };
    setFormData(newData);
    onSettingsChange(newData);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const logoData = reader.result as string;
        const newData = { ...formData, logo: logoData };
        setFormData(newData);
        onSettingsChange(newData);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      setMessage('Ledger configuration saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    }, 800);
  };

  return (
    <div className="card border-0 shadow-sm overflow-hidden">
      <div className="card-body p-0">
        <div className="p-4 border-bottom bg-light bg-opacity-50">
          <h5 className="fw-bold mb-1">Ledger Configuration</h5>
          <p className="text-muted small mb-0">Customize how your ledger statements look and the default settings for account statements.</p>
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
                
                <div className="row g-4 align-items-center">
                  <div className="col-md-6">
                    <label className="form-label small text-muted text-uppercase fw-bold mb-2">Company Logo</label>
                    <div 
                      className="ratio ratio-16x9 bg-light border border-2 border-dashed d-flex align-items-center justify-content-center overflow-hidden cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                      style={{ borderStyle: 'dashed' }}
                    >
                      {formData.logo ? (
                        <img src={formData.logo} alt="Logo Preview" className="img-fluid p-2 object-fit-contain" />
                      ) : (
                        <div className="text-center text-muted p-2">
                          <i className="bi bi-cloud-arrow-up fs-3 d-block mb-1"></i>
                          <span className="x-small fw-bold">Upload Company Logo</span>
                        </div>
                      )}
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="d-none" 
                      accept="image/*" 
                      onChange={handleLogoUpload} 
                    />
                  </div>
                  
                  <div className="col-md-6">
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
                        <label className="form-check-label fw-bold small text-dark" htmlFor="showLogo">Display logo on ledger</label>
                      </div>
                      <div className="text-muted x-small mt-1">Logo will be displayed on top-left of the ledger statement.</div>
                    </div>

                    <div>
                      <label className="form-label small text-muted text-uppercase fw-bold">Brand Accent Color</label>
                      <div className="d-flex align-items-center gap-3">
                        <input 
                          type="color" 
                          className="form-control form-control-color border-0 p-1" 
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

              {/* Display Settings Section */}
              <div className="col-12">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <div className="bg-info bg-opacity-10 p-2 text-info">
                    <i className="bi bi-eye fs-5"></i>
                  </div>
                  <h6 className="fw-bold mb-0">Display Settings</h6>
                </div>

                <div className="row g-3">
                  <div className="col-md-4">
                    <div className="form-check form-switch custom-switch mb-2">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="showCompanyAddress" 
                        name="showCompanyAddress"
                        checked={formData.showCompanyAddress}
                        onChange={handleCheckboxChange}
                      />
                      <label className="form-check-label fw-bold small text-dark" htmlFor="showCompanyAddress">Company Address</label>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-check form-switch custom-switch mb-2">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="showPartyAddress" 
                        name="showPartyAddress"
                        checked={formData.showPartyAddress}
                        onChange={handleCheckboxChange}
                      />
                      <label className="form-check-label fw-bold small text-dark" htmlFor="showPartyAddress">Party Address</label>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-check form-switch custom-switch mb-2">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="showDateRange" 
                        name="showDateRange"
                        checked={formData.showDateRange}
                        onChange={handleCheckboxChange}
                      />
                      <label className="form-check-label fw-bold small text-dark" htmlFor="showDateRange">Date Range</label>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-check form-switch custom-switch mb-2">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="showVchType" 
                        name="showVchType"
                        checked={formData.showVchType}
                        onChange={handleCheckboxChange}
                      />
                      <label className="form-check-label fw-bold small text-dark" htmlFor="showVchType">Voucher Type</label>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-check form-switch custom-switch mb-2">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="showVchNo" 
                        name="showVchNo"
                        checked={formData.showVchNo}
                        onChange={handleCheckboxChange}
                      />
                      <label className="form-check-label fw-bold small text-dark" htmlFor="showVchNo">Voucher No.</label>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-check form-switch custom-switch mb-2">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="showPageNumbers" 
                        name="showPageNumbers"
                        checked={formData.showPageNumbers}
                        onChange={handleCheckboxChange}
                      />
                      <label className="form-check-label fw-bold small text-dark" htmlFor="showPageNumbers">Page Numbers</label>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-check form-switch custom-switch mb-2">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="showOpeningBalance" 
                        name="showOpeningBalance"
                        checked={formData.showOpeningBalance}
                        onChange={handleCheckboxChange}
                      />
                      <label className="form-check-label fw-bold small text-dark" htmlFor="showOpeningBalance">Opening Balance</label>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-check form-switch custom-switch mb-2">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="showClosingBalance" 
                        name="showClosingBalance"
                        checked={formData.showClosingBalance}
                        onChange={handleCheckboxChange}
                      />
                      <label className="form-check-label fw-bold small text-dark" htmlFor="showClosingBalance">Closing Balance</label>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-check form-switch custom-switch mb-2">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="showCompanyGST" 
                        name="showCompanyGST"
                        checked={formData.showCompanyGST}
                        onChange={handleCheckboxChange}
                      />
                      <label className="form-check-label fw-bold small text-dark" htmlFor="showCompanyGST">Company GST</label>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-check form-switch custom-switch mb-2">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="showPartyGST" 
                        name="showPartyGST"
                        checked={formData.showPartyGST}
                        onChange={handleCheckboxChange}
                      />
                      <label className="form-check-label fw-bold small text-dark" htmlFor="showPartyGST">Party GST</label>
                    </div>
                  </div>
                </div>
              </div>

              <hr className="my-2 opacity-5" />

              {/* Layout Settings Section */}
              <div className="col-12">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <div className="bg-success bg-opacity-10 p-2 text-success">
                    <i className="bi bi-layout-text-window-reverse fs-5"></i>
                  </div>
                  <h6 className="fw-bold mb-0">Layout Settings</h6>
                </div>

                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label small text-muted text-uppercase fw-bold">Items Per Page</label>
                    <select 
                      className="form-select" 
                      name="itemsPerPage"
                      value={formData.itemsPerPage}
                      onChange={handleInputChange}
                    >
                      <option value={20}>20 Items</option>
                      <option value={30}>30 Items</option>
                      <option value={35}>35 Items (Default)</option>
                      <option value={40}>40 Items</option>
                      <option value={50}>50 Items</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small text-muted text-uppercase fw-bold">Font Size</label>
                    <select 
                      className="form-select" 
                      name="fontSize"
                      value={formData.fontSize}
                      onChange={handleInputChange}
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small text-muted text-uppercase fw-bold">Color Theme</label>
                    <select 
                      className="form-select" 
                      name="colorTheme"
                      value={formData.colorTheme}
                      onChange={handleInputChange}
                    >
                      <option value="blue">Blue</option>
                      <option value="black">Black</option>
                      <option value="green">Green</option>
                    </select>
                  </div>
                </div>
              </div>

              <hr className="my-2 opacity-5" />

              {/* Numbering Section */}
              <div className="col-12">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <div className="bg-warning bg-opacity-10 p-2 text-warning">
                    <i className="bi bi-hash fs-5"></i>
                  </div>
                  <h6 className="fw-bold mb-0">Sequence & Numbering</h6>
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small text-muted text-uppercase fw-bold">Ledger Prefix</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. LED" 
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

              {/* Advanced Settings Section */}
              <div className="col-12">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <div className="bg-secondary bg-opacity-10 p-2 text-secondary">
                    <i className="bi bi-gear fs-5"></i>
                  </div>
                  <h6 className="fw-bold mb-0">Advanced Settings</h6>
                </div>

                <div className="mb-4">
                  <div className="form-check form-switch custom-switch mb-3">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="showWatermark" 
                      name="showWatermark"
                      checked={formData.showWatermark}
                      onChange={handleCheckboxChange}
                    />
                    <label className="form-check-label fw-bold small text-dark" htmlFor="showWatermark">Show Watermark</label>
                  </div>

                  {formData.showWatermark && (
                    <div className="mb-3">
                      <label className="form-label small text-muted text-uppercase fw-bold">Watermark Text</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="e.g. CONFIDENTIAL"
                        name="watermarkText"
                        value={formData.watermarkText}
                        onChange={handleInputChange}
                      />
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="form-label small text-muted text-uppercase fw-bold">Terms & Conditions</label>
                  <textarea 
                    className="form-control" 
                    rows={5} 
                    placeholder="Enter default terms..."
                    name="termsAndConditions"
                    value={formData.termsAndConditions}
                    onChange={handleInputChange}
                  ></textarea>
                  <div className="text-muted x-small mt-1 text-end">This will appear at the bottom of your ledger statements.</div>
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
                  className="btn btn-dark px-5 py-2 shadow-sm d-flex align-items-center gap-2"
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

export default LedgerSettings;
