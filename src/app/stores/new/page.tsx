'use client';

import React from 'react';
import StoreForm from '@/modules/stores/components/StoreForm';
import AdminNavbar from '@/components/AdminNavbar';
import AdminSidebar from '@/components/AdminSidebar';

export default function NewStorePage() {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  return (
    <div className="admin-layout d-flex bg-light min-vh-100">
      <AdminSidebar collapsed={sidebarCollapsed} />
      
      <div className={`main-wrapper flex-grow-1 ${sidebarCollapsed ? 'expanded' : ''}`}>
        <AdminNavbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
        
        <div className="content-area">
          <div className="container-fluid">
            <h4 className="fw-bold mb-4">Register New Store</h4>
            <StoreForm mode="create" />
          </div>
        </div>
      </div>
    </div>
  );
}
