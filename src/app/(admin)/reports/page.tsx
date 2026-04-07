'use client';

import React from 'react';
import Link from 'next/link';

const ReportsPage = () => {
  const reports = [
    {
      title: 'Payment Report',
      description: 'View and export payment history and records.',
      icon: 'bi-cash-stack',
      color: '#4f46e5',
      href: '/reports/payment'
    },
    {
      title: 'Invoice Report',
      description: 'Comprehensive analysis of all generated invoices.',
      icon: 'bi-file-earmark-bar-graph',
      color: '#0ea5e9',
      href: '/reports/invoice'
    },
    {
      title: 'Inward Report',
      description: 'Track materials and items received from vendors.',
      icon: 'bi-box-arrow-in-left',
      color: '#10b981',
      href: '/reports/inward'
    },
    {
      title: 'GST Report',
      description: 'Detailed report for GST filing and audits.',
      icon: 'bi-file-text',
      color: '#f59e0b',
      href: '/reports/gst'
    }
  ];

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col-12">
          <h4 className="fw-bold text-dark mb-1">Reports Dashboard</h4>
          <p className="text-muted">Select a report to view detailed information and export data.</p>
        </div>
      </div>

      <div className="row g-4">
        {reports.map((report, idx) => (
          <div key={idx} className="col-md-6 col-xl-3">
            <Link href={report.href} className="text-decoration-none">
              <div className="card border-0 shadow-sm h-100 report-card">
                <div className="card-body p-4">
                  <div 
                    className="report-icon-wrapper mb-3"
                    style={{ 
                      backgroundColor: `${report.color}15`, 
                      color: report.color,
                      width: '50px',
                      height: '50px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <i className={`bi ${report.icon} fs-4`}></i>
                  </div>
                  <h5 className="fw-bold text-dark mb-2">{report.title}</h5>
                  <p className="text-muted small mb-0">{report.description}</p>
                </div>
                <div className="card-footer bg-transparent border-0 pt-0 pb-4 px-4">
                  <span className="text-primary small fw-600 d-flex align-items-center gap-2">
                    View Report <i className="bi bi-arrow-right"></i>
                  </span>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      <style jsx>{`
        .report-card {
          transition: all 0.2s ease-in-out;
          cursor: pointer;
        }
        .report-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
        }
        .report-icon-wrapper {
          transition: all 0.2s ease-in-out;
        }
        .report-card:hover .report-icon-wrapper {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
};

export default ReportsPage;
