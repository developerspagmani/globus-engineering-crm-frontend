'use client';

import React from 'react';
import { Invoice, Company } from '@/types/modules';
import { numberToWords } from '@/utils/numberToWords';

interface IndustrialInvoiceProps {
  invoice: Invoice;
  company?: Company | null;
  settings: {
    showLogo: boolean;
    logo: string | null;
    logoSecondary: string | null;
    showDeclaration: boolean;
    accentColor: string;
    termsAndConditions?: string;
    footerText?: string;
    vatTin?: string;
    cstNo?: string;
    panNo?: string;
    bankName?: string;
    bankAcc?: string;
    bankBranchIfsc?: string;
  };
}

const IndustrialInvoice: React.FC<IndustrialInvoiceProps> = ({ invoice, company, settings }) => {
  const totalInWords = numberToWords(invoice.grandTotal);

  return (
    <div className="industrial-invoice-container">
      <div className="invoice-box">
        {/* Header Block */}
        <div className="section-header d-flex align-items-center justify-content-between px-3 border-bottom" style={{ height: '110px' }}>
          <div className="logo-section" style={{ flex: '0 0 100px' }}>
            {settings.showLogo && settings.logo ? (
              <img src={settings.logo} alt="Logo" style={{ height: '75px', objectFit: 'contain' }} />
            ) : (
              <div className="default-logo">
                <svg viewBox="0 0 100 100" style={{ width: '80px', height: '80px' }}>
                  <path d="M30 5 L70 5 L95 30 L95 70 L70 95 L30 95 L5 70 L5 30 Z" fill="none" stroke="black" strokeWidth="1.5" />
                  <circle cx="50" cy="50" r="22" fill="none" stroke="black" strokeWidth="2" />
                  <path d="M50 28 L50 15 M50 72 L50 85 M28 50 L15 50 M72 50 L85 50" stroke="black" strokeWidth="2" />
                  <text x="50" y="60" fontSize="26" fontWeight="900" textAnchor="middle" fill="black" fontFamily="Arial, sans-serif">S</text>
                  <path d="M34 34 L42 42 M66 66 L74 74 M34 66 L42 58 M66 34 L58 42" stroke="black" strokeWidth="1.5" />
                </svg>
              </div>
            )}
          </div>
          
          <div className="company-info text-center" style={{ flex: '1 1 auto' }}>
            <h1 className="m-0 fw-bold" style={{ fontSize: '24px', letterSpacing: '0.5px', color: 'black' }}>
              {company?.name || 'GLOBUS ENGINEERING MAIN'}
            </h1>
            <p className="m-0 fw-bold text-dark" style={{ fontSize: '11px', marginTop: '4px' }}>
              An ISO 9001: 2015 Certified Company
            </p>
          </div>
          
          <div className="tuv-section d-flex justify-content-end" style={{ flex: '0 0 100px' }}>
            {settings.showLogo && settings.logoSecondary ? (
              <img src={settings.logoSecondary} alt="TUV Logo" style={{ height: '70px', objectFit: 'contain' }} />
            ) : (
              <div className="tuv-badge" style={{ 
                width: '70px', 
                border: '1.5px solid black', 
                borderRadius: '4px',
                textAlign: 'center',
                backgroundColor: 'white',
                color: 'black',
                overflow: 'hidden'
              }}>
                <div style={{ borderBottom: '1.5px solid black', fontSize: '11px', fontWeight: 'bold', background: '#eee' }}>Q</div>
                <div style={{ padding: '2px' }}>
                  <div style={{ fontSize: '16px', fontWeight: '900', lineHeight: '1' }}>TÜV</div>
                  <div style={{ fontSize: '10px', fontWeight: 'bold' }}>SÜD</div>
                </div>
                <div style={{ fontSize: '7px', fontWeight: 'bold', borderTop: '1px solid black' }}>ISO 9001</div>
              </div>
            )}
          </div>
        </div>

        {/* Details Section 1 */}
        <div className="details-grid border-bottom d-flex">
          <div className="col-8 border-right">
            <div className="d-flex border-bottom" style={{ height: '30px' }}>
              <div className="ps-2 fw-bold d-flex align-items-center border-right" style={{ fontSize: '11px', width: '55%' }}>
                <span style={{ minWidth: '85px' }}>Invoice No</span>
                <span>: &nbsp; {invoice.invoiceNumber}</span>
              </div>
              <div className="ps-2 fw-bold d-flex align-items-center" style={{ fontSize: '11px', width: '45%' }}>
                <span style={{ minWidth: '60px' }}>DC No</span>
                <span>: &nbsp; {invoice.dcNo || ''}</span>
              </div>
            </div>
            <div className="d-flex" style={{ height: '30px' }}>
              <div className="ps-2 fw-bold d-flex align-items-center border-right" style={{ fontSize: '11px', width: '55%' }}>
                <span style={{ minWidth: '85px' }}>Invoice Date</span>
                <span>: &nbsp; {invoice.date ? new Date(invoice.date).toLocaleDateString('en-GB').replace(/\//g, '-') : ''}</span>
              </div>
              <div className="ps-2 fw-bold d-flex align-items-center" style={{ fontSize: '11px', width: '45%' }}>
                <span style={{ minWidth: '60px' }}>DC Dte</span>
                <span>: &nbsp; {invoice.dcDate ? new Date(invoice.dcDate).toLocaleDateString('en-GB').replace(/\//g, '-') : ''}</span>
              </div>
            </div>
          </div>
          <div className="col-4">
            <div className="ps-2 fw-bold border-bottom d-flex align-items-center" style={{ fontSize: '11px', height: '20px', whiteSpace: 'nowrap' }}>
              <span style={{ minWidth: '60px' }}>PO No</span>
              <span>: &nbsp; {invoice.poNo || ''}</span>
            </div>
            <div className="ps-2 fw-bold border-bottom d-flex align-items-center" style={{ fontSize: '11px', height: '20px', whiteSpace: 'nowrap' }}>
              <span style={{ minWidth: '60px' }}>PO Date</span>
              <span>: &nbsp; {invoice.poDate ? new Date(invoice.poDate).toLocaleDateString('en-GB').replace(/\//g, '-') : ''}</span>
            </div>
            <div className="d-flex" style={{ fontSize: '10px', height: '20px', alignItems: 'center' }}>
              <div className="ps-2 fw-bold border-right d-flex align-items-center h-100" style={{ width: '55%' }}>
                <span style={{ minWidth: '40px' }}>State</span>
                <span>: &nbsp; {invoice.state || 'TamilNadu-33'}</span>
              </div>
              <div className="text-center fw-bold px-1" style={{ fontSize: '9px', flex: 1 }}>
                Rev Charge (Y/N) : N
              </div>
            </div>
          </div>
        </div>

        {/* Tax Invoice Bar */}
        <div className="tax-invoice-bar text-center border-bottom bg-light">
          <span className="fw-bold" style={{ fontSize: '12px' }}>TAX INVOICE</span>
        </div>

        {/* Supplier & Recipient Section */}
        <div className="details-grid-2 border-bottom d-flex">
          <div className="col-6 border-right">
            <div className="bg-light p-1 border-bottom fw-bold" style={{ fontSize: '11px' }}>Supplier Details :</div>
            <div className="p-2" style={{ fontSize: '11px', lineHeight: '1.4' }}>
              <div className="d-flex">
                <div style={{ width: '70px' }} className="fw-bold">Name</div>
                <div className="fw-bold">: {company?.name || 'Globus Engineering Tools'}</div>
              </div>
              <div className="d-flex" style={{ minHeight: '42px' }}>
                <div style={{ width: '70px' }} className="fw-bold">Address</div>
                <div className="fw-bold">: {company?.address?.split(',').map((part, i) => (
                  <React.Fragment key={i}>
                    {part}{i === 1 || i === 3 ? <br /> : i < company?.address?.split(',').length - 1 ? ',' : ''}
                  </React.Fragment>
                )) || (
                  <>No:24,Annaiyappan Street,S.S.Nagar,<br />Nallampalayam,Ganapathy Post,<br />Coimbatore - 641006</>
                )}</div>
              </div>
              <div className="d-flex mt-2">
                <div style={{ width: '70px' }} className="fw-bold">GST No</div>
                <div className="fw-bold">: {company?.gstin || '33AAIFG6568K1ZZ'}</div>
              </div>
              <div className="d-flex">
                <div style={{ width: '70px' }} className="fw-bold">State</div>
                <div className="flex-grow-1 fw-bold d-flex align-items-center">
                   <div style={{ minWidth: '150px' }}>: {invoice.state || 'Tamilnadu'}</div>
                   <div className="ms-auto pe-4">Code : &nbsp; 33</div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-6">
            <div className="bg-light p-1 border-bottom fw-bold" style={{ fontSize: '11px' }}>Recepients Details :</div>
            <div className="p-2" style={{ fontSize: '11px', lineHeight: '1.4' }}>
              <div className="d-flex">
                <div style={{ width: '70px' }} className="fw-bold">Name</div>
                <div className="fw-bold">: {invoice.customerName}</div>
              </div>
              <div className="d-flex" style={{ minHeight: '42px' }}>
                <div style={{ width: '70px' }} className="fw-bold">Address</div>
                <div className="fw-bold" style={{ flex: 1 }}>: {invoice.address || 'N/A'}</div>
              </div>
              <div className="d-flex mt-2">
                <div style={{ width: '70px' }} className="fw-bold">GST No</div>
                <div className="fw-bold">: {invoice.gstin || 'N/A'}</div>
              </div>
              <div className="d-flex">
                <div style={{ width: '70px' }} className="fw-bold">State</div>
                <div className="flex-grow-1 fw-bold d-flex align-items-center">
                   <div style={{ minWidth: '150px' }}>: {invoice.state || 'N/A'}</div>
                   <div className="ms-auto pe-4">Code : &nbsp; {invoice.state === 'Telangana' ? '36' : '33'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="items-table-section">
          <table className="w-100 industrial-table">
            <thead>
              <tr style={{ fontSize: '11px', fontStyle: 'italic', background: '#f8f9fa' }}>
                <th className="text-center" style={{ width: '7%' }}>S.No</th>
                <th className="text-center" style={{ width: '40%' }}>Description</th>
                <th className="text-center" style={{ width: '15%' }}>SAC Code</th>
                <th className="text-center" style={{ width: '11%' }}>Qty</th>
                <th className="text-center" style={{ width: '12%' }}>Price</th>
                <th className="text-center" style={{ width: '15%' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, idx) => (
                <tr key={idx} style={{ fontSize: '11px' }}>
                  <td className="text-center py-1">{idx + 1}</td>
                  <td className="ps-2 py-1 fw-bold">
                    <div>{item.description}</div>
                    {item.process && <div className="mt-1 normal small">{item.process}</div>}
                  </td>
                  <td className="text-center py-1">84661010</td>
                  <td className="text-center py-1">{item.quantity}</td>
                  <td className="text-center py-1">{item.unitPrice.toFixed(0)}</td>
                  <td className="pe-2 text-end py-1">{item.amount.toFixed(2)}</td>
                </tr>
              ))}
              {/* Spacer rows - extended to 10 for better layout as per image */}
              {[...Array(Math.max(0, 10 - invoice.items.length))].map((_, i) => (
                <tr key={`empty-${i}`} style={{ height: '28px' }}>
                  <td className="border-bottom-0">&nbsp;</td>
                  <td className="border-bottom-0">&nbsp;</td>
                  <td className="border-bottom-0">&nbsp;</td>
                  <td className="border-bottom-0">&nbsp;</td>
                  <td className="border-bottom-0">&nbsp;</td>
                  <td className="border-bottom-0">&nbsp;</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="fw-bold border-top" style={{ fontSize: '11px', height: '28px', background: '#f8f9fa' }}>
                <td colSpan={2} className="text-center">Total</td>
                <td>&nbsp;</td>
                <td className="text-center">{invoice.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                <td>&nbsp;</td>
                <td className="pe-2 text-end">{invoice.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Amount in Words */}
        <div className="p-1 px-2 border-top border-bottom fw-bold" style={{ fontSize: '10px', color: '#000' }}>
          Amount Chargeable(in words) : Indian Rupees {totalInWords}
        </div>

        {/* Company & Bank Details Section */}
        <div className="footer-details d-flex border-bottom">
          <div className="col-6 border-right">
            <div className="bg-light p-1 border-bottom fw-bold text-center" style={{ fontSize: '10px' }}>Company Details</div>
            <div className="p-2" style={{ fontSize: '9px', lineHeight: '1.4' }}>
              <div className="d-flex fw-bold">
                <div style={{ width: '80px' }}>VAT TIN</div>
                <div>: {settings.vatTin || '33132028969'}</div>
              </div>
              <div className="d-flex fw-bold">
                <div style={{ width: '80px' }}>CST NO</div>
                <div>: {settings.cstNo || '1091562'}</div>
              </div>
              <div className="d-flex fw-bold">
                <div style={{ width: '80px' }}>PAN NO</div>
                <div>: {settings.panNo || 'AAIFG6568K'}</div>
              </div>
            </div>
          </div>
          <div className="col-6">
            <div className="bg-light p-1 border-bottom fw-bold text-center" style={{ fontSize: '10px' }}>Bank Details</div>
            <div className="p-2" style={{ fontSize: '9px', lineHeight: '1.4' }}>
              <div className="d-flex fw-bold">
                <div style={{ width: '120px' }}>Bank Name</div>
                <div>: {settings.bankName || 'INDIAN OVERSEAS BANK'}</div>
              </div>
              <div className="d-flex fw-bold">
                <div style={{ width: '120px' }}>Bank A/C</div>
                <div>: {settings.bankAcc || '170902000000962'}</div>
              </div>
              <div className="d-flex fw-bold">
                <div style={{ width: '120px' }}>Branch & IFSC Code</div>
                <div>: {settings.bankBranchIfsc || 'IOBA0001709'}</div>
              </div>
            </div>
          </div>
        </div>
        {/* Signatures */}
        <div className="signatures d-flex border-bottom" style={{ height: '90px' }}>
          <div className="col-6 border-right p-2 fw-bold" style={{ fontSize: '10px' }}>
            Receivers Sign :
          </div>
          <div className="col-6 p-2 text-center" style={{ fontSize: '10px', position: 'relative' }}>
            <div className="fw-bold">For {company?.name || 'Globus Engineering Tools'}</div>
            
            {/* Stamp Circle Overlay */}
            <div className="stamp-overlay">
               <div className="stamp-inner">
                  <div className="stamp-text-top">GLOBUS ENGINEERING</div>
                  <div className="stamp-icon-box">S</div>
                  <div className="stamp-text-bottom">TOOLS</div>
               </div>
            </div>
          </div>
        </div>

        {/* Declaration */}
        {settings.showDeclaration && (
          <div className="declaration-section p-2" style={{ fontSize: '8.5px', lineHeight: '1.25' }}>
            <div className="mb-1">
              <strong>Declaration:</strong> Supplied to Special Economic Zone-Duties & Taxes Are Exempted<br />
              (Folio-No.8/3/2007 Suzlon ON INFRA SEZ DT.24.9.2007)<br />
              UNDER EPCG LICENCE NO
            </div>
            
            <div className="text-center fw-bold my-1" style={{ fontSize: '8.5px' }}>
              "Supply Meant For export/supply yo SEZ Unit or Sez developer for authorised<br />
              Operations under Bond or Letter of Undertaking without Payment of Integrated Tax"<br />
              (Export Covered Under LUT NO AD330625078562X v Dated 25/06/2025)
            </div>
            
            <div className="mt-1">
              <strong>Declartion:</strong> We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct
            </div>

            {settings.termsAndConditions && (
              <div className="mt-2 border-top pt-1">
                <strong>Terms & Conditions:</strong>
                <div style={{ whiteSpace: 'pre-line', marginTop: '1px' }}>{settings.termsAndConditions}</div>
              </div>
            )}
            
            {settings.footerText && (
              <div className="text-center mt-2 fw-bold decoration-italic" style={{ fontSize: '9px', color: '#555' }}>
                --- {settings.footerText} ---
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .industrial-invoice-container {
          padding: 10px;
          background: #f0f0f0;
          color: black;
          font-family: Arial, Helvetica, sans-serif;
          display: flex;
          justify-content: center;
          min-height: 100vh;
        }
        .invoice-box {
          background: white;
          border: 1.5px solid black;
          width: 200mm;
          min-height: auto;
          box-sizing: border-box;
          box-shadow: 0 0 15px rgba(0,0,0,0.1);
          display: flex;
          flex-direction: column;
          padding-bottom: 5px;
        }
        .industrial-table {
          border-collapse: collapse;
          table-layout: fixed;
          word-wrap: break-word;
        }
        .industrial-table th {
          border: 1px solid black;
          padding: 4px;
        }
        .industrial-table td {
          border: 1px solid black;
          padding: 2px;
          word-break: break-word;
          vertical-align: top;
        }
        .border-right { border-right: 1px solid black; }
        .border-bottom { border-bottom: 1px solid black; }
        .tax-invoice-bar {
            padding: 2px 0;
            background-color: #f2f2f2;
        }
        .normal { font-weight: normal; }
        
        .stamp-overlay {
          position: absolute;
          bottom: 5px;
          right: 30px;
          width: 80px;
          height: 80px;
          border: 2px solid #1a3c7a;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1a3c7a;
          transform: rotate(-20deg);
          opacity: 0.7;
          pointer-events: none;
        }
        .stamp-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          line-height: 1;
        }
        .stamp-text-top { font-size: 6px; font-weight: 900; margin-bottom: 2px; }
        .stamp-icon-box { 
          font-size: 18px; 
          font-weight: 900; 
          border: 1.5px solid #1a3c7a;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 3px;
        }
        .footer-details, .signatures, .declaration-section {
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .declaration-section {
          background-color: #fcfcfc;
          border-top: 1px solid #eee;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 5mm; 
          }
          .industrial-invoice-container { 
            padding: 0 !important; 
            margin: 0 !important;
            background: white !important;
            width: 100% !important;
            height: auto !important;
            display: block !important;
          }
          .invoice-box { 
            border: 1.2px solid black !important; 
            width: 195mm !important; 
            height: 285mm !important;
            margin: 0 auto !important;
            padding: 0 !important;
            display: flex !important;
            flex-direction: column !important;
            box-shadow: none !important;
            position: relative;
            overflow: visible !important;
          }
          .items-table-section {
            flex-grow: 1;
          }
          /* Ensure color and background are printed */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
};

export default IndustrialInvoice;
