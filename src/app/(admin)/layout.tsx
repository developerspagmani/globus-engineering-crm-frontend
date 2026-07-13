'use client';
// Trigger re-evaluation for admin group

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
      {!isSalesMap && (
        <React.Suspense fallback={<div className="sidebar d-print-none" style={{ width: sidebarCollapsed ? '80px' : '260px' }}></div>}>
          <div className="d-print-none"><AdminSidebar collapsed={sidebarCollapsed} /></div>
        </React.Suspense>
      )}
      <main className={`main-wrapper print-full-width ${isSalesMap ? '' : (sidebarCollapsed ? 'expanded' : '')}`} style={isSalesMap ? { marginLeft: 0 } : {}}>
        {!isSalesMap && (
          <React.Suspense fallback={<div className="h-16 d-print-none"></div>}>
            <div className="d-print-none"><AdminNavbar onToggleSidebar={toggleSidebar} /></div>
          </React.Suspense>
        )}
        <div className={`content-area ${isSalesMap ? 'p-0 m-0' : ''}`}>
          <React.Suspense fallback={<div className="p-5 text-center"><div className="spinner-border text-primary"></div></div>}>
            {children}
          </React.Suspense>
        </div>
      </main>
    </div>
  );
}
