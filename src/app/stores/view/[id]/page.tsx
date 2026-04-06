'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import api from '@/lib/axios';
import Loader from '@/components/Loader';
import StoreForm from '@/modules/stores/components/StoreForm';
import AdminNavbar from '@/components/AdminNavbar';
import AdminSidebar from '@/components/AdminSidebar';

export default function StoreViewPage() {
  const { id } = useParams();
  const router = useRouter();
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await api.get(`/stores/${id}`);
        setStore(response.data);
      } catch (error) {
        console.error('Failed to load store data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="admin-layout d-flex bg-light min-vh-100">
        <AdminSidebar collapsed={sidebarCollapsed} />
        <div className="main-wrapper flex-grow-1">
          <AdminNavbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
          <Loader text="Loading Store Profile..." />
        </div>
      </div>
    );
  }

  if (!store) return <div className="text-center p-5">Store not found</div>;

  return (
    <div className="admin-layout d-flex bg-light min-vh-100">
      <AdminSidebar collapsed={sidebarCollapsed} />
      
      <div className={`main-wrapper flex-grow-1 ${sidebarCollapsed ? 'expanded' : ''}`}>
        <AdminNavbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
        
        <div className="content-area p-4">
          {/* Header Action Bar */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="d-flex align-items-center gap-3">
              <button 
                onClick={() => router.push('/stores')} 
                className="btn btn-outline-secondary rounded-circle p-2 d-flex align-items-center justify-content-center" 
                style={{ width: '40px', height: '40px' }}
              >
                <i className="bi bi-arrow-left"></i>
              </button>
              <div>
                <h4 className="fw-800 mb-0 tracking-tight text-dark">{store.name.toUpperCase()}</h4>
                <p className="text-muted small mb-0 fw-600">
                  {isEditing ? 'MODIFYING STORE DETAILS' : 'STORE PROFILE OVERVIEW'}
                </p>
              </div>
            </div>

            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)} 
                className="btn btn-primary d-flex align-items-center gap-2 px-4 rounded-pill shadow-sm"
                style={{ backgroundColor: '#ff4081', border: 'none' }}
              >
                <i className="bi bi-pencil-square"></i>
                <span className="fw-700">EDIT PROFILE</span>
              </button>
            )}
          </div>

          {/* Central Information Card */}
          <div className="row justify-content-center">
            <div className="col-12 col-xl-10">
               <div className="premium-form-card animate-fade-in">
                  <div className="card-header bg-white border-0 py-3 ps-4">
                     <h6 className="fw-800 mb-0 text-muted small tracking-widest text-uppercase">
                        Store Identity & Contact Information
                     </h6>
                  </div>
                  <div className="card-body p-0">
                     <StoreForm 
                        mode={isEditing ? 'edit' : 'view'} 
                        initialData={store} 
                     />
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
