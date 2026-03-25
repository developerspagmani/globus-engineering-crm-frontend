'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'next/navigation';
import { RootState } from '@/redux/store';
import ChallanForm from '@/modules/challan/components/ChallanForm';
import Breadcrumb from '@/components/Breadcrumb';

const EditChallanPage = () => {
  const { id } = useParams();
  const { items } = useSelector((state: RootState) => state.challan);
  const challan = items.find(item => item.id === id);

  if (!challan) {
    return (
      <div className="content-area text-center py-5">
        <h4 className="fw-700 text-dark">Challan not found</h4>
        <p className="text-muted">The challan you are looking for does not exist or has been deleted.</p>
      </div>
    );
  }

  return (
    <div className="content-area animate-fade-in">
      <div className="mb-4">
        <Breadcrumb
          items={[
            { label: 'Challan System', href: '/challan' },
            { label: 'Edit Challan', active: true }
          ]}
        />
        <h3 className="fw-800 tracking-tight text-dark mb-0 mt-2">Edit Challan: {challan.challanNo}</h3>
        <p className="text-muted small mb-0">Modify the details of the existing delivery challan.</p>
      </div>

      <div className="row justify-content-center">
        <div className="col-xl-10">
          <ChallanForm mode="edit" initialData={challan} />
        </div>
      </div>
    </div>
  );
};

export default EditChallanPage;
