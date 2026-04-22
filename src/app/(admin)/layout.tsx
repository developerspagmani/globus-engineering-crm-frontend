'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { refreshCompanyContext } from '@/redux/features/authSlice';
import AdminSidebar from '@/components/AdminSidebar';
import AdminNavbar from '@/components/AdminNavbar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useDispatch();
  const { company } = useSelector((state: RootState) => state.auth);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const isSalesMap = pathname === '/sales-map';

  useEffect(() => {
    if (company?.id) {
      dispatch(refreshCompanyContext(company.id) as any);
    }
  }, [dispatch, company?.id]);

  useEffect(() => {
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
