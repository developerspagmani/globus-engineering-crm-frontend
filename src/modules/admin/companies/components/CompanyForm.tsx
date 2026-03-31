'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { Company } from '@/types/modules';
import { addCompany, updateCompany } from '@/redux/features/companySlice';

interface CompanyFormProps {
  initialData?: Company;
  mode: 'create' | 'edit' | 'view';
}

const CompanyForm: React.FC<CompanyFormProps> = ({ initialData, mode }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { items: allModules } = useSelector((state: RootState) => state.modules);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    plan: 'basic' as Company['plan'],
    activeModules: [] as string[]
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        slug: initialData.slug,
        plan: initialData.plan,
        activeModules: initialData.activeModules
      });
    }
  }, [initialData]);

  const handleToggleModule = (moduleId: string) => {
    setFormData(prev => ({
      ...prev,
      activeModules: prev.activeModules.includes(moduleId)
        ? prev.activeModules.filter(id => id !== moduleId)
        : [...prev.activeModules, moduleId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (mode === 'create') {
        await (dispatch as any)(addCompany(formData)).unwrap();
      } else {
        await (dispatch as any)(updateCompany({ id: initialData!.id, ...formData })).unwrap();
      }
      router.push('/admin/companies');
    } catch (err) {
      alert('Failed to save company: ' + err);
    }
  };

  return (
    <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
      <div className="card-body p-4 p-md-5">
        <form onSubmit={handleSubmit}>
          <div className="row g-4 mb-5">
            <div className="col-12">
              <h5 className="fw-bold text-dark mb-4 pb-2 border-bottom">Organizational Identity</h5>
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-bold text-muted text-uppercase tracking-wider">Company Legal Name</label>
              <input
                type="text"
                className="form-control shadow-none py-2 px-3"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex. Industrial Solutions Ltd"
                required
                disabled={mode === 'view'}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-bold text-muted text-uppercase tracking-wider">Organization Slug (URL)</label>
              <input
                type="text"
                className="form-control shadow-none py-2 px-3"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                placeholder="ex-industrial-solutions"
                required
                disabled={mode === 'view'}
              />
            </div>
          </div>

          <div className="row g-4 mb-5">
            <div className="col-12">
              <h5 className="fw-bold text-dark mb-4 pb-2 border-bottom">Service Parameters</h5>
            </div>
            <div className="col-md-12">
              <label className="form-label small fw-bold text-muted text-uppercase tracking-wider mb-3">Subscription Tier</label>
              <div className="d-flex flex-wrap gap-3">
                {['basic', 'premium', 'enterprise'].map((plan) => (
                  <div key={plan} className="col-lg-3">
                    <input
                      type="radio"
                      className="btn-check"
                      id={`plan-${plan}`}
                      name="plan"
                      checked={formData.plan === plan}
                      onChange={() => setFormData({ ...formData, plan: plan as any })}
                      disabled={mode === 'view'}
                    />
                    <label className={`btn btn-outline-${plan === 'enterprise' ? 'dark' : plan === 'premium' ? 'info' : 'primary'} w-100 py-3 text-uppercase fw-bold small rounded-3`} htmlFor={`plan-${plan}`}>
                      <div className="mb-1">{plan}</div>
                      <div className="x-small opacity-75 fw-normal">Level {plan === 'basic' ? '1' : plan === 'premium' ? '2' : '3'} Access</div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-5">
            <h5 className="fw-bold text-dark mb-4 pb-2 border-bottom">Module Access Provisioning</h5>
            <div className="row g-3">
              {allModules.map((module) => (
                <div key={module.id} className="col-md-6 col-lg-4">
                  <div
                    className={`p-3 rounded-3 border cursor-pointer transition-all h-100 ${formData.activeModules.includes(module.id)
                      ? 'border-primary bg-primary bg-opacity-10 shadow-sm'
                      : 'bg-light bg-opacity-25'
                      } ${mode === 'view' ? 'pe-none opacity-75' : ''}`}
                    onClick={() => mode !== 'view' && handleToggleModule(module.id)}
                  >
                    <div className="form-check p-0 m-0 d-flex align-items-center gap-3">
                      <input
                        className="form-check-input m-0 cursor-pointer"
                        type="checkbox"
                        checked={formData.activeModules.includes(module.id)}
                        onChange={() => { }}
                        style={{ width: '1.25rem', height: '1.25rem' }}
                        disabled={mode === 'view'}
                      />
                      <div>
                        <div className="small fw-bold text-dark">{module.name}</div>
                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>{module.id}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-4 border-top d-flex gap-3">
            {mode !== 'view' ? (
              <>
                <button type="submit" className="btn btn-primary px-5 py-2 fw-bold shadow-accent rounded-pill">
                  {mode === 'create' ? 'Provision Tenant' : 'Save Configuration'}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary px-5 py-2 fw-bold rounded-pill"
                  onClick={() => router.push('/admin/companies')}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn btn-secondary px-5 py-2 fw-bold rounded-pill"
                onClick={() => router.push('/admin/companies')}
              >
                Back
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanyForm;
