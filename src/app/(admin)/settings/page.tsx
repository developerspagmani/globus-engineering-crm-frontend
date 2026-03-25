'use client';

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import Breadcrumb from '@/components/Breadcrumb';
import ProfileSettings from '@/modules/settings/components/ProfileSettings';
import CompanySettings from '@/modules/settings/components/CompanySettings';
import SecuritySettings from '@/modules/settings/components/SecuritySettings';
import AppearanceSettings from '@/modules/settings/components/AppearanceSettings';
import InvoiceSettings from '@/modules/settings/components/InvoiceSettings';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const { user, company } = useSelector((state: RootState) => state.auth);

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
      case 'invoice': return <InvoiceSettings />;
      case 'security': return <SecuritySettings />;
      case 'appearance': return <AppearanceSettings />;
      default: return <ProfileSettings />;
    }
  };

  return (
    <div className="content-area animate-fade-in">
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
                  className={`list-group-item list-group-item-action border-0 px-4 py-3 d-flex align-items-center gap-3 ${activeTab === tab.id ? 'bg-primary bg-opacity-10 text-primary fw-bold' : 'text-muted'}`}
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
                  <div className="x-small text-uppercase tracking-widest opacity-50 mb-2">Active Context</div>
                  <div className="fw-bold mb-1">{company.name}</div>
                  <div className="x-small opacity-75">{company.plan} Enterprise Plan</div>
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
