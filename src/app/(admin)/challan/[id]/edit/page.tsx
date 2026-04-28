'use client';

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useSearchParams } from 'next/navigation';
import { RootState } from '@/redux/store';
import ChallanForm from '@/modules/challan/components/ChallanForm';
import Breadcrumb from '@/components/Breadcrumb';
import Link from 'next/link';
import { checkActionPermission } from '@/config/permissions';
import { fetchChallans } from '@/redux/features/challanSlice';
import ModuleGuard from '@/components/ModuleGuard';
import Loader from '@/components/Loader';

const EditChallanPage = () => {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const { items, loading } = useSelector((state: RootState) => state.challan);
  const { user, company: activeCompany } = useSelector((state: RootState) => state.auth);
  const challan = items.find(item => String(item.id) === String(id));
  const [isEdit, setIsEdit] = React.useState(searchParams.get('edit') === 'true');
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (activeCompany?.id && items.length === 0) {
      (dispatch as any)(fetchChallans(activeCompany.id));
    }
  }, [activeCompany?.id, items.length, dispatch]);

  if (loading || !mounted) return <Loader text="Loading Profile..." />;

  if (!challan) {
    return (
      <ModuleGuard moduleId="mod_challan">
        <div className="content-area text-center py-5">
           <div className="mb-4">
              <i className="bi bi-search text-muted" style={{ fontSize: '3rem' }}></i>
           </div>
          <h4 className="fw-700 text-dark">Challan not found</h4>
          <p className="text-muted">The challan you are looking for does not exist or has been deleted.</p>
          <Link href="/challan" className="btn btn-outline-primary rounded-pill px-4 mt-3">Return to History</Link>
        </div>
      </ModuleGuard>
    );
  }

  return (
    <ModuleGuard moduleId="mod_challan">
      <div className="content-area animate-fade-in">
      <div className="d-flex align-items-center mb-5 pb-2 border-bottom">
        <Link href="/challan" className="back-btn-standard" title="Back to Challan List">
          <i className="bi bi-arrow-left fs-4"></i>
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
    </ModuleGuard>
  );
};

export default EditChallanPage;
