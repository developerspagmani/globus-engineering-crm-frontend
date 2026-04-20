'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import IndustrialInvoice from '@/modules/invoice/components/IndustrialInvoice';
import { Invoice, Company } from '@/types/modules';

export default function PublicInvoicePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const token = searchParams.get('token');

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch from a public-accessible backend endpoint
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/public/invoice/${id}?token=${token}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch invoice. Unauthorized or invalid token.');
        }

        const data = await response.json();
        setInvoice(data.invoice);
        setCompany(data.company);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id && token) {
      fetchData();
    } else {
      setError('Missing Invoice ID or Access Token');
      setLoading(false);
    }
  }, [id, token]);

  if (loading) return <div style={{ padding: '20px' }}>Generating Invoice Preview...</div>;
  if (error) return <div style={{ color: 'red', padding: '20px' }}>Error: {error}</div>;
  if (!invoice) return <div style={{ padding: '20px' }}>Invoice not found.</div>;

  return (
    <div style={{ background: '#fff' }}>
      <IndustrialInvoice 
        invoice={invoice} 
        company={company} 
        settings={{
          showLogo: true,
          logo: null,
          logoSecondary: null,
          showDeclaration: true,
          accentColor: '#000000',
          vatTin: '33132028969',
          cstNo: '1091562',
          panNo: 'AAIFG6568K',
          bankName: 'INDIAN OVERSEAS BANK',
          bankAcc: '170902000000962',
          bankBranchIfsc: 'IOBA0001709'
        }} 
      />
    </div>
  );
}
