'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import AdminNavbar from '@/components/AdminNavbar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const isSalesMap = pathname === '/sales-map';

  React.useEffect(() => {
    if (isSalesMap) {
      setSidebarCollapsed(true);
    } else {
      setSidebarCollapsed(false);
    }
  }, [isSalesMap]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="admin-container">
      {!isSalesMap && <AdminSidebar collapsed={sidebarCollapsed} />}
      <main className={`main-wrapper ${isSalesMap ? '' : (sidebarCollapsed ? 'expanded' : '')}`} style={isSalesMap ? { marginLeft: 0 } : {}}>
        {!isSalesMap && <AdminNavbar onToggleSidebar={toggleSidebar} />}
        <div className={`content-area ${isSalesMap ? 'p-0 m-0' : ''}`}>
          {children}
        </div>
      </main>
    </div>
  );
}
