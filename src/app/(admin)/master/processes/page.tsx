'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { fetchProcesses, createProcessThunk } from '@/redux/features/masterSlice';
import Breadcrumb from '@/components/Breadcrumb';
import ModuleGuard from '@/components/ModuleGuard';

export default function ProcessDetailsPage() {
  const dispatch = useDispatch();
  const { processes, loading } = useSelector((state: RootState) => state.master);
  const { company } = useSelector((state: RootState) => state.auth);

  const [view, setView] = useState<'add' | 'list'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ processName: '' });

  useEffect(() => {
    (dispatch as any)(fetchProcesses(company?.id));
  }, [dispatch, company?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (company?.id) {
      await (dispatch as any)(createProcessThunk({ ...formData, company_id: company.id }));
      setFormData({ processName: '' });
      setView('list');
    } else {
      alert("Please select a company from the top navigation first.");
    }
  };

  const filteredProcesses = processes.filter(p =>
    p.processName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ModuleGuard moduleId="mod_processes">
      <div className="bg-white min-vh-100">
        {/* Header Section */}
        <div className="px-4 py-3 border-bottom d-flex justify-content-between align-items-center">
          <h4 className="mb-0 text-dark" style={{ fontSize: '1.5rem' }}>Process Details</h4>
          <div className="d-flex gap-2">
            <button
              onClick={() => setView('add')}
              className={`btn d-flex align-items-center gap-1 text-white px-3 py-2 fw-bold rounded-1 transition-all ${view === 'add' ? 'opacity-100 shadow-sm' : 'opacity-80'}`}
              style={{ backgroundColor: '#9C27B0', border: 'none', fontSize: '0.85rem' }}
            >
              <i className="bi bi-plus" style={{ fontSize: '1.2rem' }}></i>
              <span>ADD</span>
            </button>
            <button
              onClick={() => setView('list')}
              className={`btn d-flex align-items-center gap-1 text-white px-3 py-2 fw-bold rounded-1 transition-all ${view === 'list' ? 'opacity-100 shadow-sm' : 'opacity-80'}`}
              style={{ backgroundColor: '#E91E63', border: 'none', fontSize: '0.85rem' }}
            >
              <i className="bi bi-arrow-repeat" style={{ fontSize: '1.1rem' }}></i>
              <span>LIST</span>
            </button>
          </div>
        </div>

        <div className="p-5">
          {view === 'add' ? (
            <div className="mx-auto" style={{ maxWidth: '900px', marginTop: '40px' }}>
              <form onSubmit={handleSubmit}>
                <div className="row mb-5 align-items-center">
                  <div className="col-md-3">
                    <label className="text-dark fw-normal" style={{ fontSize: '1.1rem' }}>Process</label>
                  </div>
                  <div className="col-md-9">
                    <input
                      type="text"
                      required
                      placeholder="Process"
                      className="form-control border-0 border-bottom rounded-0 px-0 shadow-none"
                      style={{ borderBottomColor: '#ddd !important', fontSize: '1.1rem', color: '#888' }}
                      value={formData.processName}
                      onChange={(e) => setFormData({ ...formData, processName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-center gap-3 mt-5">
                  <button
                    type="submit"
                    className="btn px-4 py-2 text-white fw-bold rounded-1"
                    style={{ backgroundColor: '#00C853', border: 'none', minWidth: '100px' }}
                  >
                    ADD
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ processName: '' })}
                    className="btn px-4 py-2 text-white fw-bold rounded-1"
                    style={{ backgroundColor: '#FF3D00', border: 'none', minWidth: '100px' }}
                  >
                    RESET
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="animate-fade-in">
              <div className="d-flex justify-content-end mb-4">
                <div className="input-group" style={{ maxWidth: '300px' }}>
                  <span className="input-group-text bg-white border-end-0">
                    <i className="bi bi-search text-muted"></i>
                  </span>
                  <input
                    type="text"
                    placeholder="Search processes..."
                    className="form-control border-start-0 shadow-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="table-responsive rounded-2 border mx-auto" style={{ maxWidth: '800px' }}>
                <table className="table table-hover align-middle mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="px-4 py-2 text-uppercase small fw-bold" style={{ width: '80px' }}>Sno</th>
                      <th className="px-4 py-2 text-uppercase small fw-bold">Process Name</th>
                      <th className="px-4 py-2 text-uppercase small fw-bold text-end" style={{ width: '120px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={3} className="text-center py-5">
                          <div className="spinner-border spinner-border-sm text-primary"></div>
                        </td>
                      </tr>
                    ) : filteredProcesses.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center py-5 text-muted">No processes found</td>
                      </tr>
                    ) : (
                      filteredProcesses.map((p, index) => (
                        <tr key={p.id}>
                          <td className="px-4 py-3 text-muted">{index + 1}</td>
                          <td className="px-4 py-3 fw-bold">{p.processName}</td>
                          <td className="px-4 py-3 text-end">
                            <button className="btn btn-sm btn-link text-info me-2 p-0 shadow-none"><i className="bi bi-pencil"></i></button>
                            <button className="btn btn-sm btn-link text-danger p-0 shadow-none"><i className="bi bi-trash"></i></button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .transition-all { transition: all 0.2s ease; }
        .form-control:focus {
           border-bottom-color: #9C27B0 !important;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in { animation: fadeIn 0.4s ease; }
      `}</style>
    </ModuleGuard>
  );
}
