'use client';

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'next/navigation';
import { RootState } from '@/redux/store';
import ChallanForm from '@/modules/challan/components/ChallanForm';
import Breadcrumb from '@/components/Breadcrumb';
import Link from 'next/link';
import { checkActionPermission } from '@/config/permissions';
import { fetchChallans } from '@/redux/features/challanSlice';
import Loader from '@/components/Loader';

const EditChallanPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { items, loading } = useSelector((state: RootState) => state.challan);
  const { user, company: activeCompany } = useSelector((state: RootState) => state.auth);
  const challan = items.find(item => item.id === id);
  const [isEdit, setIsEdit] = React.useState(false);

  React.useEffect(() => {
    if (activeCompany?.id && items.length === 0) {
      (dispatch as any)(fetchChallans(activeCompany.id));
    }
  }, [activeCompany?.id, items.length, dispatch]);

  if (loading) return <Loader />;

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
      <div className="d-flex align-items-center mb-5 pb-2 border-bottom">
        <Link href="/challan" className="btn btn-outline-secondary border-0 p-0 me-3" title="Back to Challan List">
          <i className="bi bi-arrow-left-circle fs-3 text-muted"></i>
        </Link>
        <div>
          <h2 className="fw-bold mb-0 text-dark">{isEdit ? 'Edit' : 'View'} Challan: {challan.challanNo}</h2>
          <p className="text-muted small mb-0">{isEdit ? 'Modify the details of the existing delivery challan.' : 'Review delivery challan details.'}</p>
        </div>
        {!isEdit && checkActionPermission(user, 'mod_challan', 'edit') && (
          <button 
            className="btn btn-primary ms-auto d-flex align-items-center gap-2 px-4 shadow-accent"
            onClick={() => setIsEdit(true)}
          >
            <i className="bi bi-pencil-square"></i>
            <span>Edit Challan</span>
          </button>
        )}
      </div>

      <div className="row justify-content-center">
        <div className="col-xl-10">
          <ChallanForm mode={isEdit ? 'edit' : 'view'} initialData={challan} />
        </div>
      </div>
    </div>
  );
};

export default EditChallanPage;
