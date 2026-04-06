'use client';

import React from 'react';
import StoreList from '@/modules/stores/components/StoreList';
import ModuleGuard from '@/components/ModuleGuard';

export default function StoresPage() {
  return (
    <ModuleGuard moduleId="mod_lead">
      <div className="bg-white min-vh-100 p-4 animate-fade-in shadow-sm">
        <StoreList />
      </div>
    </ModuleGuard>
  );
}
