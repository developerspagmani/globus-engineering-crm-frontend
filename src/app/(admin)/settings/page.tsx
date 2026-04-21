'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams, useRouter } from 'next/navigation';
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
import BackButton from '@/components/BackButton';

// Modern Modal Component
const PreviewModal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1060 }}>
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
          <div className="modal-header bg-dark text-white border-0 py-3 px-4 d-flex justify-content-between align-items-center">
            <h5 className="modal-title fw-900 mb-0 d-flex align-items-center gap-2">
              <i className="bi bi-eye-fill text-accent"></i> {title}
            </h5>
            <div className="d-flex gap-2">
              <button className="btn btn-sm btn-outline-light rounded-circle p-2 border-0" title="Print Preview">
                <i className="bi bi-printer fs-5"></i>
              </button>
              <button onClick={onClose} className="btn-close btn-close-white" aria-label="Close"></button>
            </div>
          </div>
          <div className="modal-body p-0 bg-secondary bg-opacity-10">
            <div className="p-4 d-flex justify-content-center">
              <div className="shadow-lg bg-white rounded-1 overflow-hidden" style={{ width: '100%', maxWidth: '1000px' }}>
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SettingsContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');
  const [mounted, setMounted] = useState(false);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl) setActiveTab(tabFromUrl);
  }, [searchParams]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tabId);
    router.push(`/settings?${params.toString()}`);
  };

  const { user, company } = useSelector((state: RootState) => state.auth);

  if (!mounted) return null;

  const canManageCompany = user?.role === 'company_admin' || user?.role === 'super_admin';

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: 'bi-person' },
    { id: 'company', label: 'Company Profile', icon: 'bi-building', hidden: !canManageCompany },
    { id: 'invoice', label: 'Invoice Configuration', icon: 'bi-file-earmark-text', hidden: !canManageCompany },
    { id: 'security', label: 'Security', icon: 'bi-shield-lock' },
    { id: 'appearance', label: 'Appearance', icon: 'bi-palette' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'profile': return <ProfileSettings />;
      case 'company': return <CompanySettings />;
      case 'invoice': return (
        <div className="row g-4">
          <div className="col-12">
            <InvoiceSettings />
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
            <h3 className="fw-900 tracking-tight text-dark mb-1">
               Invoice Configuration
            </h3>
            <p className="text-muted small mb-0">Professionalize your industrial templates with high-precision configuration.</p>
          </div>
          <div className="d-flex gap-2 align-items-center">
            <button 
              onClick={() => setShowInvoicePreview(true)} 
              className="btn btn-white border rounded-4 px-4 py-2 shadow-sm fw-bold d-flex align-items-center gap-2"
            >
              <i className="bi bi-eye-fill text-primary"></i> Live Preview
            </button>
            <BackButton onClick={() => handleTabChange('profile')} title="Back to Main Settings" />
          </div>
        </div>
        {renderContent()}

        {/* Preview Modal */}
        <PreviewModal 
          isOpen={showInvoicePreview} 
          onClose={() => setShowInvoicePreview(false)} 
          title="Invoice Template Preview"
        >
          <InvoicePreview 
            invoice={mockInvoices[0]} 
            company={company}
            hideControls={true}
          />
        </PreviewModal>
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
                  onClick={() => handleTabChange(tab.id)}
                  className={`list-group-item list-group-item-action border-0 px-3 py-3 d-flex align-items-center justify-content-start ${activeTab === tab.id ? 'active' : 'text-muted'}`}
                  style={{ 
                    backgroundColor: activeTab === tab.id ? 'var(--accent-soft)' : 'transparent',
                    color: activeTab === tab.id ? 'var(--accent-color)' : '',
                    borderRadius: '0',
                    borderLeft: activeTab === tab.id ? '4px solid var(--accent-color)' : '4px solid transparent',
                    margin: '0',
                    transition: 'all 0.2s ease',
                    textAlign: 'left'
                  }}
                >
                  <div className="d-flex align-items-center justify-content-center" style={{ width: '40px', minWidth: '40px' }}>
                    <i className={`bi ${tab.icon} ${activeTab === tab.id ? 'opacity-100' : 'opacity-70'}`} style={{ fontSize: '1.25rem' }}></i>
                  </div>
                  <span className={`ms-2 ${activeTab === tab.id ? 'fw-bold' : 'fw-500'}`} style={{ fontSize: '0.95rem' }}>{tab.label}</span>
                  {activeTab === tab.id && <i className="bi bi-chevron-right ms-auto small opacity-50"></i>}
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

const SettingsPage = () => {
  return (
    <Suspense fallback={
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading Settings...</span>
        </div>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
};

export default SettingsPage;
