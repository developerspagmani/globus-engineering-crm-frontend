'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import Breadcrumb from '@/components/Breadcrumb';
import ProfileSettings from '@/modules/settings/components/ProfileSettings';
import CompanySettings from '@/modules/settings/components/CompanySettings';
import SecuritySettings from '@/modules/settings/components/SecuritySettings';
import AppearanceSettings from '@/modules/settings/components/AppearanceSettings';
import InvoiceSettings from '@/modules/settings/components/InvoiceSettings';
import LedgerSettings from '@/modules/settings/components/LedgerSettings';
import LedgerSettingsPreview from '@/modules/ledger/components/LedgerSettingsPreview';
import InvoicePreview from '@/modules/invoice/components/InvoicePreview';
import { mockInvoices } from '@/data/mockModules';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [mounted, setMounted] = useState(false);
  const [ledgerSettings, setLedgerSettings] = useState({
    showLogo: true,
    showCompanyAddress: true,
    showPartyAddress: true,
    showVchType: true,
    showVchNo: true,
    showOpeningBalance: true,
    showClosingBalance: true,
    showPageNumbers: true,
    showDateRange: true,
    itemsPerPage: 35,
    fontSize: 'medium' as 'small' | 'medium' | 'large',
    colorTheme: 'blue' as 'blue' | 'black' | 'green',
    showCompanyGST: false,
    showPartyGST: false,
    showWatermark: false,
    watermarkText: 'CONFIDENTIAL',
    accentColor: '#ea580c',
    logo: null,
    logoSecondary: null
  });
  const { user, company } = useSelector((state: RootState) => state.auth);
  const { settings: invoiceSettings } = useSelector((state: RootState) => state.invoices);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const canManageCompany = user?.role === 'company_admin' || user?.role === 'super_admin';

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: 'bi-person' },
    { id: 'company', label: 'Company Profile', icon: 'bi-building', hidden: !canManageCompany },
    { id: 'invoice', label: 'Invoice Configuration', icon: 'bi-file-earmark-text', hidden: !canManageCompany },
    { id: 'ledger', label: 'Ledger Configuration', icon: 'bi-journal-text', hidden: !canManageCompany },
    { id: 'security', label: 'Security', icon: 'bi-shield-lock' },
    { id: 'appearance', label: 'Appearance', icon: 'bi-palette' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'profile': return <ProfileSettings />;
      case 'company': return <CompanySettings />;
      case 'invoice': return (
        <div className="row g-4">
          <div className="col-xl-4">
            <InvoiceSettings />
          </div>
          <div className="col-xl-8">
            <div className="sticky-top" style={{ top: '20px' }}>
              <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div className="card-header bg-dark text-white py-2 px-3 d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-2">
                    <div className="spinner-grow spinner-grow-sm text-secondary" role="status" style={{ width: '8px', height: '8px' }}></div>
                    <span className="fw-bold small">Live Preview</span>
                  </div>
                  <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-outline-light">
                      <i className="bi bi-printer"></i>
                    </button>
                    <button className="btn btn-sm btn-outline-light">
                      <i className="bi bi-download"></i>
                    </button>
                  </div>
                </div>
                <div className="card-body p-0">
                  <InvoicePreview 
                    invoice={mockInvoices[0]} 
                    company={company}
                    hideControls={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      );
      case 'ledger': return (
        <div className="row g-4">
          <div className="col-xl-4">
            <LedgerSettings 
              settings={ledgerSettings}
              onSettingsChange={setLedgerSettings}
            />
          </div>
          <div className="col-xl-8">
            <div className="sticky-top" style={{ top: '20px' }}>
              <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div className="card-header bg-dark text-white py-2 px-3 d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-2">
                    <div className="spinner-grow spinner-grow-sm text-secondary" role="status" style={{ width: '8px', height: '8px' }}></div>
                    <span className="fw-bold small">Live Preview</span>
                  </div>
                  <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-outline-light">
                      <i className="bi bi-printer"></i>
                    </button>
                    <button className="btn btn-sm btn-outline-light">
                      <i className="bi bi-download"></i>
                    </button>
                  </div>
                </div>
                <div className="card-body p-0">
                  <LedgerSettingsPreview 
                    company={company}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      );
      case 'security': return <SecuritySettings />;
      case 'appearance': return <AppearanceSettings />;
      default: return <ProfileSettings />;
    }
  };

  if (activeTab === 'invoice') {
    return (
      <div className="container-fluid px-4 py-4 animate-fade-in bg-light min-vh-100">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="fw-900 tracking-tight text-dark mb-1">Invoice Configuration</h3>
            <p className="text-muted small mb-0">Professionalize your industrial billing templates with live-preview editing.</p>
          </div>
          <button onClick={() => setActiveTab('profile')} className="btn btn-dark rounded-4 px-4 py-2 shadow-sm fw-bold d-flex align-items-center gap-2">
            <i className="bi bi-arrow-left"></i> Back to Main Settings
          </button>
        </div>
        {renderContent()}
      </div>
    );
  }

  return (
    <div className="container py-4 content-area animate-fade-in">
      <div className="mb-4">
        <Breadcrumb items={[{ label: 'System Settings', active: true }]} />
        <h3 className="fw-900 tracking-tight text-dark mb-1 mt-2">Account Settings</h3>
        <p className="text-muted small">Update your personal information, security preferences, and enterprise configuration.</p>
      </div>

      <div className="row g-4">
        <div className="col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
            <div className="list-group list-group-flush border-0">
              {tabs.filter(t => !t.hidden).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`list-group-item list-group-item-action border-0 px-4 py-3 d-flex align-items-center gap-3 ${activeTab === tab.id ? 'active fw-bold' : 'text-muted'}`}
                  style={{ 
                    backgroundColor: activeTab === tab.id ? 'var(--accent-soft)' : 'transparent',
                    color: activeTab === tab.id ? 'var(--accent-color)' : '',
                    borderRadius: '12px',
                    margin: '2px 0'
                  }}
                >
                  <i className={`bi ${tab.icon} fs-5`}></i>
                  <span>{tab.label}</span>
                  {activeTab === tab.id && <i className="bi bi-chevron-right ms-auto small"></i>}
                </button>
              ))}
            </div>
          </div>

          {company && (
            <div className="card border-0 shadow-sm rounded-4 mt-4 bg-dark text-white overflow-hidden">
               <div className="card-body p-4">
                  <div className="x-small text-capitalize tracking-widest opacity-50 mb-2">Active Context</div>
                  <div className="fw-bold mb-1">{company?.name || 'Globus Enterprise'}</div>
                  <div className="x-small opacity-75">{company?.plan || 'Standard'} Enterprise Plan</div>
               </div>
            </div>
          )}
        </div>

        <div className="col-lg-9">
          <div className="animate-fade-in-up">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
