'use client';

import React, { useState } from 'react';

const AppearanceSettings: React.FC = () => {
  const [theme, setTheme] = useState('light');
  const [notifications, setNotifications] = useState({
    email: true,
    browser: false,
    whatsapp: true,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpdatePreferences = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setMessage('Preferences updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    }, 1000);
  };

  return (
    <div className="card border-0 shadow-sm rounded-4">
      <div className="card-body p-4">
        <h5 className="fw-bold mb-4">Application Preferences</h5>
        
        {message && (
          <div className="alert alert-info border-0 shadow-sm mb-4">
            {message}
          </div>
        )}
        
        <div className="mb-5">
          <label className="form-label small text-muted text-uppercase fw-bold mb-3">System Theme</label>
          <div className="row g-3">
            <div className="col-md-4">
              <div 
                className={`card border-2 cursor-pointer transition ${theme === 'light' ? 'border-primary shadow-sm' : 'border-light'}`}
                onClick={() => setTheme('light')}
                style={{ cursor: 'pointer' }}
              >
                <div className="card-body p-3 text-center">
                  <i className="bi bi-sun fs-2 mb-2 text-warning"></i>
                  <div className="fw-bold small">Light Mode</div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div 
                className={`card border-2 cursor-pointer transition ${theme === 'dark' ? 'border-primary shadow-sm' : 'border-light'}`}
                onClick={() => setTheme('dark')}
                style={{ cursor: 'pointer' }}
              >
                <div className="card-body p-3 text-center">
                  <i className="bi bi-moon-stars fs-2 mb-2 text-primary"></i>
                  <div className="fw-bold small">Dark Mode</div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div 
                className={`card border-2 cursor-pointer transition ${theme === 'system' ? 'border-primary shadow-sm' : 'border-light'}`}
                onClick={() => setTheme('system')}
                style={{ cursor: 'pointer' }}
              >
                <div className="card-body p-3 text-center">
                  <i className="bi bi-display fs-2 mb-2 text-muted"></i>
                  <div className="fw-bold small">System Default</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="form-label small text-muted text-uppercase fw-bold mb-3">Notification Channels</label>
          <div className="list-group list-group-flush border rounded-3 overflow-hidden">
            <div className="list-group-item d-flex justify-content-between align-items-center p-3">
              <div>
                <div className="fw-bold small">Email Notifications</div>
                <div className="x-small text-muted">Receive account and transaction alerts via email</div>
              </div>
              <div className="form-check form-switch">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  checked={notifications.email}
                  onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
                />
              </div>
            </div>
            <div className="list-group-item d-flex justify-content-between align-items-center p-3">
              <div>
                <div className="fw-bold small">Browser Alerts</div>
                <div className="x-small text-muted">Show real-time desktop notifications</div>
              </div>
              <div className="form-check form-switch">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  checked={notifications.browser}
                  onChange={(e) => setNotifications({ ...notifications, browser: e.target.checked })}
                />
              </div>
            </div>
            <div className="list-group-item d-flex justify-content-between align-items-center p-3">
              <div>
                <div className="fw-bold small">WhatsApp Priority</div>
                <div className="x-small text-muted">Get critical alerts on WhatsApp</div>
              </div>
              <div className="form-check form-switch">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  checked={notifications.whatsapp}
                  onChange={(e) => setNotifications({ ...notifications, whatsapp: e.target.checked })}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5">
           <button 
             type="button" 
             className="btn btn-primary px-5 rounded-pill shadow-sm"
             onClick={handleUpdatePreferences}
             disabled={saving}
            >
              {saving ? 'Updating...' : 'Update Preferences'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default AppearanceSettings;
