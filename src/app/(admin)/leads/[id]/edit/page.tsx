'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import Breadcrumb from '@/components/Breadcrumb';
import LeadForm from '@/modules/lead/components/LeadForm';
import Link from 'next/link';
import { checkActionPermission } from '@/config/permissions';
import api from '@/lib/axios';
import StatusModal from '@/components/StatusModal';
import Loader from '@/components/Loader';

export default function EditLeadPage() {
  const [mounted, setMounted] = useState(false);
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEdit = searchParams.get('edit') === 'true';

  const { user, company: activeCompany } = useSelector((state: RootState) => state.auth);
  const { items } = useSelector((state: RootState) => state.leads);
  const leadFromStore = items.find(item => item.id === id);

  const [lead, setLead] = useState<any>(leadFromStore || null);
  const [loadingLead, setLoadingLead] = useState<boolean>(!leadFromStore);
  const [sendingReminder, setSendingReminder] = useState<boolean>(false);
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'success' | 'error' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (leadFromStore) {
      setLead(leadFromStore);
      setLoadingLead(false);
    } else if (id) {
      setLoadingLead(true);
      api.get(`/leads/${id}`)
        .then(res => {
          setLead(res.data);
        })
        .catch(err => {
          console.error('Failed to fetch lead:', err);
        })
        .finally(() => {
          setLoadingLead(false);
        });
    }
  }, [id, leadFromStore]);

  const handleSendReminder = async () => {
    if (!lead) return;

    if (!lead.agentId && !lead.agent_id) {
      setModal({
        isOpen: true,
        title: 'Sales Person Required',
        message: 'This lead does not have an assigned Sales Person. Please assign a sales agent first before sending a reminder.',
        type: 'info'
      });
      return;
    }

    try {
      setSendingReminder(true);
      const res = await api.post(`/leads/${lead.id}/send-visit-reminder`, {
        company_id: activeCompany?.id || lead.company_id || lead.companyId
      });

      setModal({
        isOpen: true,
        title: 'Visit Reminder Sent!',
        message: res.data?.message || `Visit reminder notification sent to ${lead.agentName || 'Assigned Sales Person'} (${lead.agentEmail || res.data?.recipient || 'registered email'}).`,
        type: 'success'
      });
    } catch (err: any) {
      console.error('Failed to send visit reminder:', err);
      setModal({
        isOpen: true,
        title: 'Failed to Send Reminder',
        message: err.response?.data?.error || err.message || 'Could not send visit reminder email via SMTP.',
        type: 'error'
      });
    } finally {
      setSendingReminder(false);
    }
  };

  if (!mounted || loadingLead) {
    return <Loader text="Loading Lead Details..." />;
  }

  if (!lead) {
    return (
      <div className="content-area text-center py-5">
        <h4 className="fw-800 text-dark">Lead Not Found</h4>
        <button className="btn btn-primary px-4 mt-3" onClick={() => router.push('/leads')}>
          Back to Leads
        </button>
      </div>
    );
  }

  return (
    <div className="content-area animate-fade-in">
      <div className="mb-4 d-flex align-items-center justify-content-between border-bottom pb-3 flex-wrap gap-3">
        <div className="d-flex align-items-center">
          <Link href="/leads" className="back-btn-standard me-3" title="Back to Leads">
            <i className="bi bi-arrow-left fs-4"></i>
          </Link>
          <div>
            <Breadcrumb 
              items={[
                { label: 'Lead Management', href: '/leads' },
                { label: isEdit ? 'Edit Prospect' : 'View Prospect', active: true }
              ]} 
            />
            <h3 className="fw-800 tracking-tight text-dark mb-0 mt-2">{isEdit ? 'Edit' : 'View'}: {lead.company}</h3>
            <p className="text-muted small mb-0">{isEdit ? 'Update contact logs or status for this prospect.' : 'Review contact logs or status for this prospect.'}</p>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 ms-auto flex-wrap">
          <button
            type="button"
            className="btn btn-warning text-dark fw-bold d-inline-flex align-items-center gap-2 shadow-xs px-3 py-2 rounded-3"
            onClick={handleSendReminder}
            disabled={sendingReminder}
            title="Send automated email reminder to the assigned sales agent"
          >
            {sendingReminder ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                <span>Sending Reminder...</span>
              </>
            ) : (
              <>
                <i className="bi bi-bell-fill"></i>
                <span>Send Reminder to Agent</span>
              </>
            )}
          </button>

          {!isEdit && checkActionPermission(user, 'mod_lead', 'edit') && (
            <button 
              className="btn btn-primary d-flex align-items-center gap-2 px-4 shadow-accent rounded-3"
              onClick={() => router.push(`/leads/${id}/edit?edit=true`)}
            >
              <i className="bi bi-pencil-square"></i>
              <span>Edit Prospect</span>
            </button>
          )}
        </div>
      </div>

      <div className="row justify-content-center">
        <div className="col-xl-12">
          <LeadForm mode={isEdit ? 'edit' : 'view'} initialData={lead} />
        </div>
      </div>

      <StatusModal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        type={modal.type || 'info'}
        onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
