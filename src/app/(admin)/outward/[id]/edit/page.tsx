'use client';

import React from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Loader from '@/components/Loader';

export default function RedirectToOutwardPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    if (id) {
      const q = searchParams.toString();
      if (q) {
        if (!searchParams.has('edit')) {
          router.replace(`/outward/${id}?${q}&edit=true`);
        } else {
          router.replace(`/outward/${id}?${q}`);
        }
      } else {
        router.replace(`/outward/${id}?edit=true`);
      }
    }
  }, [id, router, searchParams]);

  return <Loader text="Redirecting..." />;
}
