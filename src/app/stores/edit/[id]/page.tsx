'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import StoreForm from '@/modules/stores/components/StoreForm';
import AdminNavbar from '@/components/AdminNavbar';
import AdminSidebar from '@/components/AdminSidebar';
import api from '@/lib/axios';
import { Store } from '@/types/modules';

export default function EditStorePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const response = await api.get(`/stores/${id}`);
        setStore(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load store');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchStore();
  }, [id]);

  return (
    <div className="admin-layout d-flex bg-light min-vh-100">
      <AdminSidebar collapsed={sidebarCollapsed} />
      
      <div className={`main-wrapper flex-grow-1 ${sidebarCollapsed ? 'expanded' : ''}`}>
        <AdminNavbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
        
        <div className="content-area">
          <div className="container-fluid">
            <h4 className="fw-bold mb-4">Edit Store Profile</h4>
            
            {loading ? (
              <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
            ) : error ? (
              <div className="alert alert-danger">{error}</div>
            ) : store ? (
              <StoreForm mode="edit" initialData={store} />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
