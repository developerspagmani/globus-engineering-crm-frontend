'use client';

import React from 'react';
import StoreList from '@/modules/stores/components/StoreList';
import AdminNavbar from '@/components/AdminNavbar';
import AdminSidebar from '@/components/AdminSidebar';

export default function StoresPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  return (
    <div className="admin-layout d-flex bg-light min-vh-100">
      <AdminSidebar collapsed={sidebarCollapsed} />
      
      <div className={`main-wrapper flex-grow-1 ${sidebarCollapsed ? 'expanded' : ''}`}>
        <AdminNavbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
        
        <div className="content-area">
          <StoreList />
        </div>
      </div>
    </div>
  );
}
