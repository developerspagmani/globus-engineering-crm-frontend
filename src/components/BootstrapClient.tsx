'use client';

import { useEffect } from 'react';
import { setupMockApi } from '@/lib/mockApi';

export default function BootstrapClient() {
  useEffect(() => {
    // Initialize mock API for front-end development (DISABLED)
    // setupMockApi();
    
    // @ts-ignore
    import('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);

  return null;
}
