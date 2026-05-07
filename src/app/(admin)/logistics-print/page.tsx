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
         
         const fetchPromises = [];
         if (customers.length === 0) fetchPromises.push((dispatch as any)(fetchCustomers({ company_id: company.id })));
         if (vendors.length === 0) fetchPromises.push((dispatch as any)(fetchVendors({ company_id: company.id })));

         if (type === 'inward') {
            fetchPromises.push((dispatch as any)(fetchInwards({ company_id: company.id, id })));
         } else if (type === 'outward') {
            fetchPromises.push((dispatch as any)(fetchOutwards({ company_id: company.id, id })));
         } else if (type === 'challan') {
            fetchPromises.push((dispatch as any)(fetchChallans({ company_id: company.id, id })));
         } else if (type === 'voucher') {
            fetchPromises.push((dispatch as any)(fetchVouchers({ company_id: company.id, id })));
         }

         try {
            await Promise.all(fetchPromises);
         } catch (err) {
            console.error("Fetch failed", err);
         } finally {
            setLoading(false);
         }
      };

      fetchData();
   }, [id, type, company?.id, dispatch]); // Reduced dependencies to prevent infinite loops

   useEffect(() => {
      if (!loading && id) {
         let found = null;
         const tid = String(id);
         if (type === 'inward') found = inwardData.find(i => String(i.id) === tid);
         else if (type === 'outward') found = outwardData.find(o => String(o.id) === tid);
         else if (type === 'challan') found = challanData.find(c => String(c.id) === tid);
         else if (type === 'voucher') found = voucherData.find(v => String(v.id) === tid);
         
         if (found) setData(found);
      }
   }, [loading, inwardData, outwardData, challanData, voucherData, id, type]);

   useEffect(() => {
      if (data && searchParams.get('print') === 'true') {
         const timer = setTimeout(() => {
            window.print();
         }, 1200);
         return () => clearTimeout(timer);
      }
   }, [data, searchParams]);

   if (!id || !type) return <div className="p-5 text-center text-warning">Invalid print parameters provided.</div>;
   if (loading || !company?.id) return <div className="p-5 text-center"><Loader text="Preparing Document..." /></div>;
   if (!data) return (
      <div className="p-5 text-center">
         <div className="text-danger mb-3 font-weight-bold">Document not found or access denied.</div>
         <p className="text-muted small">ID: {id} | Type: {type}</p>
         <button className="btn btn-outline-primary btn-sm mt-3" onClick={() => window.location.reload()}>Retry Loading</button>
      </div>
   );

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
