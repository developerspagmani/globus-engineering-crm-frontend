'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import IndustrialDocument from '@/components/shared/IndustrialDocument';
import { fetchInwards } from '@/redux/features/inwardSlice';
import { fetchOutwards } from '@/redux/features/outwardSlice';
import { fetchChallans } from '@/redux/features/challanSlice';
import { fetchVouchers } from '@/redux/features/voucherSlice';
import { fetchCustomers } from '@/redux/features/customerSlice';
import { fetchVendors } from '@/redux/features/vendorSlice';
import Loader from '@/components/Loader';
import BackButton from '@/components/BackButton';
import Link from 'next/link';

const PrintContent = () => {
   const searchParams = useSearchParams();
   const dispatch = useDispatch();
   const type = searchParams.get('type') as 'inward' | 'outward' | 'challan' | 'voucher';
   const id = searchParams.get('id');

   const { company } = useSelector((state: RootState) => state.auth);
   const { items: customers } = useSelector((state: RootState) => state.customers);
   const { items: vendors } = useSelector((state: RootState) => state.vendors);
   const inwardData = useSelector((state: RootState) => state.inward.items);
   const outwardData = useSelector((state: RootState) => state.outward.items);
   const challanData = useSelector((state: RootState) => state.challan.items);
   const voucherData = useSelector((state: RootState) => state.voucher.items);

   const [data, setData] = useState<any>(null);
   const [loading, setLoading] = useState(true);
   const accentColor = company?.invoiceSettings?.accentColor || '#0d6efd';

   useEffect(() => {
      if (!id || !type || !company?.id) return;

      const fetchData = async () => {
         setLoading(true);
         
         // Fetch party lists if empty to ensure address enrichment works
         const fetchPromises = [];
         if (customers.length === 0) fetchPromises.push((dispatch as any)(fetchCustomers({ company_id: company.id })));
         if (vendors.length === 0) fetchPromises.push((dispatch as any)(fetchVendors({ company_id: company.id })));

         let found = null;
         if (type === 'inward') {
            found = inwardData.find(i => i.id === id);
            if (!found) fetchPromises.push((dispatch as any)(fetchInwards({ company_id: company.id })));
         } else if (type === 'outward') {
            found = outwardData.find(o => o.id === id);
            if (!found) fetchPromises.push((dispatch as any)(fetchOutwards({ company_id: company.id })));
         } else if (type === 'challan') {
            found = challanData.find(c => c.id === id);
            if (!found) fetchPromises.push((dispatch as any)(fetchChallans({ company_id: company.id })));
         } else if (type === 'voucher') {
            found = voucherData.find(v => v.id === id);
            if (!found) fetchPromises.push((dispatch as any)(fetchVouchers({ company_id: company.id })));
         }

         await Promise.all(fetchPromises);
         setLoading(false);
      };

      fetchData();
   }, [id, type, company?.id, dispatch, customers.length, vendors.length]);

   useEffect(() => {
      if (!loading) {
         let found = null;
         if (type === 'inward') found = inwardData.find(i => i.id === id);
         else if (type === 'outward') found = outwardData.find(o => o.id === id);
         else if (type === 'challan') found = challanData.find(c => c.id === id);
         else if (type === 'voucher') found = voucherData.find(v => v.id === id);
         
         setData(found);
      }
   }, [loading, inwardData, outwardData, challanData, voucherData, id, type]);

   useEffect(() => {
      if (data && searchParams.get('print') === 'true') {
         setTimeout(() => {
            window.print();
         }, 1000);
      }
   }, [data, searchParams]);

   if (loading) return <div className="p-5 text-center"><Loader text="Preparing Document..." /></div>;
   if (!data) return <div className="p-5 text-center text-danger">Document not found or access denied.</div>;

   return (
      <div className="print-preview-container container py-4">
         <div className="no-print d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3 p-3 bg-white rounded-4 shadow-sm border">
            <div className="d-flex align-items-center gap-3">
               <BackButton />
               <h4 className="m-0 fw-bold text-dark text-capitalize">{type} Preview</h4>
            </div>
            
            <div className="d-flex gap-2">
               <button className="btn btn-outline-dark d-flex align-items-center gap-2 px-3 fw-semibold rounded-pill" onClick={() => window.print()}>
                  <i className="bi bi-printer"></i> Print
               </button>
               <button className="btn btn-primary d-flex align-items-center gap-2 px-4 fw-bold rounded-pill shadow-sm" style={{ backgroundColor: accentColor, borderColor: accentColor }} onClick={() => window.print()}>
                  <i className="bi bi-filetype-pdf"></i> Export PDF
               </button>
            </div>
         </div>

         <IndustrialDocument data={data} type={type} company={company} />
         
         <style jsx>{`
            .print-preview-container {
               min-height: 100vh;
               background: #f8f9fa;
               display: flex;
               flex-direction: column;
               align-items: center;
            }
            @media print {
               .no-print { display: none !important; }
               .print-preview-container { 
                  background: white !important; 
                  padding: 0 !important;
                  margin: 0 !important;
                  display: block !important;
               }
               body { margin: 0; padding: 0; }
            }
         `}</style>
      </div>
   );
};

export default function LogisticsPrintPage() {
   return (
      <Suspense fallback={<Loader text="Loading..." />}>
         <PrintContent />
      </Suspense>
   );
}
