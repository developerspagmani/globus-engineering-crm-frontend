'use client';

import React from 'react';
import { Invoice, Company } from '@/types/modules';
import { numberToWordsRupees } from '@/utils/numberToWords';

interface ModernTaxInvoiceProps {
  invoice: Invoice;
  company?: Company | null;
  settings?: any;
  typeParam?: string | null;
  copyType?: string;
}

/**
 * Modern Tax Invoice (Layout Format 2)
 * Clean, borderless modern tax invoice format with dynamic company and invoice data:
 * - Company header top-left with dynamic contact details
 * - Bold TAX INVOICE title with metadata table top-right
 * - Bill To and Ship To side-by-side columns
 * - Dark charcoal table header with vertical column borders
 * - Total Tax in Words and Grand Total in Words
 * - Subtotal, CGST/SGST/IGST breakdown with dark-highlighted Grand Total pill
 * - Dynamic Bank Details block
 * - Dynamic Authorized Signatory
 * - Dynamic Terms & Contact footer
 */
export const ModernTaxInvoice: React.FC<ModernTaxInvoiceProps> = ({
  invoice,
  company,
  settings,
  typeParam,
  copyType
}) => {
  let displayItems = [...(invoice.items || [])];
  let isWOP = typeParam === 'WOP' || String(invoice.type).toUpperCase() === 'WOP';

  if (String(invoice.type).toUpperCase() === 'BOTH' && typeParam) {
    if (typeParam === 'WP') {
      displayItems = invoice.items
        .map(it => ({
          ...it,
          quantity: Number(it.quantity || 0),
          amount: Number(it.amount || 0)
        }))
        .filter(it => it.quantity > 0);
      isWOP = false;
    } else if (typeParam === 'WOP') {
      displayItems = invoice.items
        .map((it, idx) => ({
          ...it,
          quantity: Number(it.wopQty) || Number(it.quantity) || 0,
          amount: 0,
          unitPrice: 0,
          originalIndex: idx + 1
        }))
        .filter(it => it.quantity > 0);
      isWOP = true;
    }
  } else if (isWOP) {
    displayItems = displayItems
      .map((it, idx) => ({
        ...it,
        quantity: Number(it.wopQty) || Number(it.quantity) || 0,
        amount: 0,
        unitPrice: 0,
        originalIndex: idx + 1
      }))
      .filter(it => it.quantity > 0);
  } else {
    displayItems = displayItems.filter(it => Number(it.quantity || 0) > 0);
  }

  // Financial Calculations
  const subTotal = displayItems.reduce(
    (sum, it) => sum + (Number(it.amount) || (Number(it.quantity || 0) * Number(it.unitPrice || 0))),
    0
  );
  const discount = Number(invoice.discount || 0);
  const taxableAmount = Math.max(0, subTotal - discount);
  const otherCharges = Number(invoice.otherCharges || 0);

  // Tax calculation
  const calculatedTaxRate =
    taxableAmount > 0 && invoice.taxTotal !== undefined
      ? Math.round((Number(invoice.taxTotal) / taxableAmount) * 100)
      : (Number(invoice.taxRate) || 18);
  const taxRate = calculatedTaxRate > 0 ? calculatedTaxRate : 18;
  const exactTaxTotal = taxableAmount * (taxRate / 100);

  // Intra-state vs Inter-state (based on company state vs customer state)
  const customerState = (invoice.state || '').toLowerCase().replace(/[^a-z]/g, '');
  const companyState = (settings?.stateDetails || company?.address || 'tamilnadu').toLowerCase().replace(/[^a-z]/g, '');
  const isIntraState = !customerState || customerState === 'tamilnadu' || customerState === 'tn' || (companyState && customerState.includes(companyState));

  const cgstRate = taxRate / 2;
  const sgstRate = taxRate / 2;
  const cgstAmount = exactTaxTotal / 2;
  const sgstAmount = exactTaxTotal / 2;
  const igstAmount = exactTaxTotal;

  const totalBeforeRound = taxableAmount + otherCharges + exactTaxTotal;
  const isRoundOffEnabled = settings?.enableRoundOff !== false;
  const grandTotal = isWOP
    ? 0
    : isRoundOffEnabled
      ? Math.round(invoice.grandTotal || totalBeforeRound)
      : totalBeforeRound;
  const roundOff = isWOP ? 0 : grandTotal - totalBeforeRound;

  // Amount In Words
  const taxInWords = numberToWordsRupees(exactTaxTotal);
  const grandTotalInWords = numberToWordsRupees(grandTotal);

  // Dates
  const formatDateLong = (dateVal?: string | Date | null): string => {
    if (!dateVal) return 'NA';
    try {
      const d = dateVal instanceof Date ? dateVal : new Date(String(dateVal));
      if (isNaN(d.getTime())) return String(dateVal);
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return String(dateVal);
    }
  };

  const invoiceDateStr = formatDateLong(invoice.date || invoice.invoice_date);
  const dueDateStr = (invoice.dc_date || invoice.dc_date) ? formatDateLong(invoice.dc_date || invoice.dc_date) : 'NA';
  const poDateStr = (invoice.poDate || invoice.po_date) ? formatDateLong(invoice.poDate || invoice.po_date) : 'NA';

  // Company Details (fully dynamic from settings / company profile)
  const companyName = settings?.companyName || company?.name || '';
  const companyAddress = settings?.companyAddress || company?.address || '';
  const companyGstin = settings?.gstNo || company?.gstin || '';
  const companyPhone = settings?.contactDetails || company?.phone || '';
  const companyEmail = settings?.emailId || company?.email || '';

  // Bank Details (fully dynamic from settings)
  const bankName = settings?.bankName || '';
  const bankAccName = settings?.companyName || company?.name || '';
  const bankAccNo = settings?.bankAcc || '';
  const bankIfsc = settings?.bankBranchIfsc || '';
  const bankBranch = settings?.bankBranch || '';

  // Empty rows to preserve table layout height
  const minRows = Math.max(0, 7 - displayItems.length);

  return (
    <div className="modern-invoice-container">
      <div className="modern-invoice-page">
        {/* Copy Type Header (ORIGINAL / DUPLICATE / TRIPLICATE) */}
        {copyType && (
          <div className="copy-badge-header">
            <span>{copyType} COPY</span>
          </div>
        )}

        {/* 1. TOP HEADER SECTION */}
        <div className="modern-header">
          {/* Top Left: Logo & Company Contact */}
          <div className="company-info-block">
            <div className="logo-container">
              {((settings?.logo && settings.logo.length > 10) || company?.logo) && settings?.showLogo !== false ? (
                <div className="logo-brand-wrapper">
                  <img
                    src={(settings?.logo && settings.logo.length > 10) ? settings.logo : company?.logo!}
                    alt={companyName}
                    className="company-logo-img"
                  />
                  {companyName && (
                    <>
                      <span className="logo-divider">|</span>
                      <h2 className="company-brand-name">{companyName}</h2>
                    </>
                  )}
                </div>
              ) : companyName ? (
                <h2 className="company-brand-name">{companyName}</h2>
              ) : null}
            </div>

            <div className="company-details-list">
              {companyAddress && (
                <div className="detail-line">
                  <span className="detail-label">Address :</span>
                  <span className="detail-val" style={{ whiteSpace: 'pre-line' }}>{companyAddress}</span>
                </div>
              )}
              {companyGstin && (
                <div className="detail-line">
                  <span className="detail-label">GSTIN/UIN :</span>
                  <span className="detail-val fw-bold">{companyGstin}</span>
                </div>
              )}
              {companyPhone && (
                <div className="detail-line">
                  <span className="detail-label">Mobile :</span>
                  <span className="detail-val">{companyPhone}</span>
                </div>
              )}
              {companyEmail && (
                <div className="detail-line">
                  <span className="detail-label">Mail :</span>
                  <span className="detail-val">{companyEmail}</span>
                </div>
              )}
            </div>
          </div>

          {/* Top Right: TAX INVOICE & Metadata Grid */}
          <div className="invoice-meta-block">
            <h1 className="tax-invoice-heading">
              {isWOP ? 'DELIVERY CHALLAN' : 'TAX INVOICE'}
            </h1>
            <div className="invoice-meta-table">
              <div className="meta-row">
                <span className="meta-label">{isWOP ? 'Delivery No.:' : 'Invoice No.:'}</span>
                <span className="meta-val">{isWOP ? (invoice.challanNumber || 'NA') : (invoice.invoiceNumber || 'NA')}</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">{isWOP ? 'Delivery Date:' : 'Invoice Date:'}</span>
                <span className="meta-val">{invoiceDateStr}</span>
              </div>
              {!isWOP && dueDateStr !== 'NA' && (
                <div className="meta-row">
                  <span className="meta-label">DC Date:</span>
                  <span className="meta-val">{dueDateStr}</span>
                </div>
              )}
              <div className="meta-row">
                <span className="meta-label">PO No.:</span>
                <span className="meta-val">{invoice.poNo || invoice.po_no || 'NA'}</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">PO Date.:</span>
                <span className="meta-val">{poDateStr}</span>
              </div>
              {(invoice.dcNo || invoice.dc_no) && (
                <div className="meta-row">
                  <span className="meta-label">DC No.:</span>
                  <span className="meta-val">{invoice.dcNo || invoice.dc_no}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. BILL TO & SHIP TO SECTION */}
        <div className="party-details-section">
          {/* Bill To */}
          <div className="party-card">
            <h3 className="party-title">Bill To :</h3>
            <div className="party-name">{invoice.customerName || '-'}</div>
            {invoice.address && (
              <div className="party-address" style={{ whiteSpace: 'pre-line' }}>
                {invoice.address}
              </div>
            )}
            {invoice.gstin && (
              <div className="party-gstin">
                <span>GSTIN: </span>
                <strong>{invoice.gstin}</strong>
              </div>
            )}
            {invoice.state && (
              <div className="party-state">State: {invoice.state}</div>
            )}
          </div>

          {/* Ship To */}
          <div className="party-card">
            <h3 className="party-title">Ship To :</h3>
            <div className="party-name">
              {invoice.shippingName || invoice.customerName || '-'}
            </div>
            {(invoice.shippingAddress || invoice.address) && (
              <div className="party-address" style={{ whiteSpace: 'pre-line' }}>
                {invoice.shippingAddress || invoice.address}
              </div>
            )}
            {(invoice.shippingGstin || invoice.gstin) && (
              <div className="party-gstin">
                <span>GSTIN : </span>
                <strong>{invoice.shippingGstin || invoice.gstin}</strong>
              </div>
            )}
            {(invoice.shippingState || invoice.state) && (
              <div className="party-state">State: {invoice.shippingState || invoice.state}</div>
            )}
          </div>
        </div>

        {/* 3. ITEMS TABLE */}
        <div className="table-wrapper">
          <table className="nexus-items-table">
            <thead>
              <tr>
                <th style={{ width: '6%', textAlign: 'center' }}>S.No</th>
                <th style={{ width: isWOP ? '54%' : '44%', textAlign: 'left' }}>Description of Goods / Services</th>
                <th style={{ width: '12%', textAlign: 'center' }}>HSN/SAC</th>
                <th style={{ width: '9%', textAlign: 'center' }}>Qty</th>
                {!isWOP && <th style={{ width: '12%', textAlign: 'right' }}>Unit Price</th>}
                <th style={{ width: '7%', textAlign: 'center' }}>Per</th>
                {!isWOP && <th style={{ width: '12%', textAlign: 'right' }}>Total</th>}
              </tr>
            </thead>
            <tbody>
              {displayItems.map((item, idx) => {
                const qty = Number(item.quantity || 0);
                const unitPrice = Number(item.unitPrice || 0);
                const itemTotal = Number(item.amount) || (qty * unitPrice);

                return (
                  <tr key={idx} className="item-row">
                    <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ textAlign: 'left' }}>
                      <div className="item-description">{item.description}</div>
                      {item.process && <div className="item-process">{item.process}</div>}
                    </td>
                    <td style={{ textAlign: 'center' }}>{(item as any).hsnCode || item.hsnCode || '-'}</td>
                    <td style={{ textAlign: 'center' }}>{qty}</td>
                    {!isWOP && (
                      <td style={{ textAlign: 'right' }}>
                        ₹{unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    )}
                    <td style={{ textAlign: 'center' }}>{item.unit || (item as any).uom || 'Nos'}</td>
                    {!isWOP && (
                      <td style={{ textAlign: 'right' }}>
                        ₹{itemTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    )}
                  </tr>
                );
              })}

              {/* Grid Spacer Rows to preserve visual table height */}
              {Array.from({ length: minRows }).map((_, fIdx) => (
                <tr key={`filler-${fIdx}`} className="filler-row">
                  <td style={{ textAlign: 'center' }}>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  {!isWOP && <td>&nbsp;</td>}
                  <td>&nbsp;</td>
                  {!isWOP && <td>&nbsp;</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 4. TOTALS & WORDS SECTION */}
        <div className="summary-section">
          {/* Left: Tax & Grand Total in Words */}
          <div className="words-col">
            {!isWOP && exactTaxTotal > 0 && (
              <div className="words-group">
                <div className="words-label">Total Tax in Words:</div>
                <div className="words-content">{taxInWords}</div>
              </div>
            )}

            {!isWOP && (
              <div className="words-group mt-3">
                <div className="words-label">Grand Total in Words:</div>
                <div className="words-content">{grandTotalInWords}</div>
              </div>
            )}

            {invoice.otherChargesDesc && (
              <div className="words-group mt-3">
                <div className="words-label">Other Charges Description:</div>
                <div className="words-content">{invoice.otherChargesDesc}</div>
              </div>
            )}
          </div>

          {/* Right: Subtotal & Tax Breakdown & Grand Total Pill */}
          <div className="totals-col">
            {!isWOP ? (
              <div className="totals-table">
                <div className="totals-row">
                  <span className="totals-label">Subtotal:</span>
                  <span className="totals-value">
                    ₹{subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {discount > 0 && (
                  <div className="totals-row">
                    <span className="totals-label">Discount:</span>
                    <span className="totals-value text-danger">
                      -₹{discount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                {otherCharges > 0 && (
                  <div className="totals-row">
                    <span className="totals-label">Other Charges:</span>
                    <span className="totals-value">
                      +₹{otherCharges.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                {isIntraState ? (
                  <>
                    <div className="totals-row">
                      <span className="totals-label">CGST ({cgstRate}%):</span>
                      <span className="totals-value">
                        ₹{cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="totals-row">
                      <span className="totals-label">SGST ({sgstRate}%):</span>
                      <span className="totals-value">
                        ₹{sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="totals-row">
                    <span className="totals-label">IGST ({taxRate}%):</span>
                    <span className="totals-value">
                      ₹{igstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                {isRoundOffEnabled && Math.abs(roundOff) > 0.001 && (
                  <div className="totals-row">
                    <span className="totals-label">Round Off:</span>
                    <span className="totals-value">
                      {roundOff > 0 ? '+' : ''}₹{roundOff.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                {/* Highlighted Grand Total Pill */}
                <div className="grand-total-row">
                  <span className="grand-total-label">Grand Total:</span>
                  <div className="grand-total-pill">
                    ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="totals-table">
                <div className="totals-row fw-bold">
                  <span className="totals-label">Total Quantity:</span>
                  <span className="totals-value">
                    {displayItems.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0)} Nos
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 5. BANK DETAILS & SIGNATURE SECTION */}
        <div className="bank-and-signature-section">
          {/* Left: Bank Details */}
          {(bankName || bankAccNo || bankIfsc) ? (
            <div className="bank-details-box">
              <h4 className="bank-title">Bank Details:</h4>
              {bankName && (
                <div className="bank-field">
                  <span className="bank-label">Bank Name:</span>
                  <span className="bank-val">{bankName}</span>
                </div>
              )}
              {bankAccName && (
                <div className="bank-field">
                  <span className="bank-label">Account Name:</span>
                  <span className="bank-val">{bankAccName}</span>
                </div>
              )}
              {bankAccNo && (
                <div className="bank-field">
                  <span className="bank-label">Account No.:</span>
                  <span className="bank-val">{bankAccNo}</span>
                </div>
              )}
              {bankIfsc && (
                <div className="bank-field">
                  <span className="bank-label">IFSC Code:</span>
                  <span className="bank-val">{bankIfsc}</span>
                </div>
              )}
              {bankBranch && (
                <div className="bank-field">
                  <span className="bank-label">Branch:</span>
                  <span className="bank-val">{bankBranch}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="bank-details-box" />
          )}

          {/* Middle: Receiver's Signature (Next to Bank Details) */}
          <div className="receiver-signature-box">
            <div className="receiver-sign-space"></div>
            <div className="receiver-signatory-text">
              Receiver's Signature
            </div>
          </div>

          {/* Right: Signature */}
          <div className="signature-box">
            {companyName && (
              <div className="sign-for-company">
                For {companyName.toUpperCase()}
              </div>
            )}

            <div className="stamp-and-sign-area">
              {settings?.signature && (
                <img src={settings.signature} alt="Signature" className="signature-img" />
              )}
            </div>

            <div className="authorized-signatory-text">
              Authorized Signatory
            </div>
          </div>
        </div>

        {/* 6. BOTTOM LEGAL FOOTER */}
        <div className="modern-footer">
          {settings?.declarationText ? (
            <p className="jurisdiction-text">{settings.declarationText}</p>
          ) : settings?.termsAndConditions ? (
            <p className="jurisdiction-text">{settings.termsAndConditions}</p>
          ) : settings?.footerText ? (
            <p className="jurisdiction-text">{settings.footerText}</p>
          ) : null}
          {(companyEmail || companyPhone) && (
            <p className="contact-text">
              Thank you for your business. For any questions regarding this Invoice, please contact {[companyEmail, companyPhone].filter(Boolean).join(' | ')}
            </p>
          )}
        </div>
      </div>

      {/* STYLES */}
      <style jsx>{`
        .modern-invoice-container {
          background: #f8fafc;
          padding: 20px 0;
          display: flex;
          justify-content: center;
          width: 100%;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          color: #0f172a;
        }

        .modern-invoice-page {
          width: 210mm;
          min-height: 297mm;
          background: #ffffff;
          padding: 12mm 15mm 10mm 15mm;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .copy-badge-header {
          text-align: right;
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 8px;
        }

        /* 1. HEADER */
        .modern-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }

        .company-info-block {
          flex: 1.3;
        }

        .logo-container {
          margin-bottom: 12px;
        }

        .logo-brand-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .company-logo-img {
          max-height: 52px;
          max-width: 170px;
          object-fit: contain;
          display: block;
        }

        .logo-divider {
          font-size: 22px;
          font-weight: 300;
          color: #94a3b8;
          line-height: 1;
          user-select: none;
        }

        .company-brand-name {
          font-size: 18px;
          font-weight: 900;
          letter-spacing: 0.5px;
          color: #0f172a;
          margin: 0;
          line-height: 1.2;
          text-transform: uppercase;
        }

        .company-details-list {
          font-size: 11px;
          line-height: 1.45;
          color: #1e293b;
        }

        .detail-line {
          display: flex;
          margin-bottom: 2px;
        }

        .detail-label {
          font-weight: 600;
          width: 90px;
          flex-shrink: 0;
          color: #0f172a;
        }

        .detail-val {
          color: #1e293b;
        }

        .invoice-meta-block {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .tax-invoice-heading {
          font-size: 26px;
          font-weight: 900;
          letter-spacing: 1px;
          color: #000000;
          margin: 0 0 16px 0;
          text-transform: uppercase;
        }

        .invoice-meta-table {
          width: 100%;
          max-width: 280px;
          font-size: 11px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .meta-row {
          display: flex;
          justify-content: space-between;
        }

        .meta-label {
          font-weight: 700;
          color: #000000;
        }

        .meta-val {
          color: #1e293b;
          text-align: right;
          font-weight: 500;
        }

        /* 2. PARTY SECTION (Bill To & Ship To) */
        .party-details-section {
          display: flex;
          gap: 24px;
          margin-bottom: 20px;
          padding-top: 6px;
        }

        .party-card {
          flex: 1;
          font-size: 11px;
          line-height: 1.45;
        }

        .party-title {
          font-size: 12px;
          font-weight: 800;
          color: #000000;
          margin: 0 0 4px 0;
        }

        .party-name {
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 2px;
        }

        .party-address {
          color: #334155;
          margin-bottom: 3px;
        }

        .party-gstin, .party-state {
          color: #1e293b;
          font-size: 11px;
        }

        /* 3. ITEMS TABLE */
        .table-wrapper {
          margin-bottom: 14px;
          width: 100%;
        }

        .nexus-items-table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #cbd5e1;
          font-size: 11px;
        }

        .nexus-items-table thead th {
          background-color: #2b303a;
          color: #ffffff;
          font-weight: 700;
          padding: 7px 10px;
          font-size: 10.5px;
          border-right: 1px solid rgba(255, 255, 255, 0.2);
          text-transform: capitalize;
        }

        .nexus-items-table thead th:last-child {
          border-right: none;
        }

        .nexus-items-table tbody td {
          padding: 6px 10px;
          border-right: 1px solid #e2e8f0;
          border-bottom: 1px solid #e2e8f0;
          color: #0f172a;
          vertical-align: middle;
        }

        .nexus-items-table tbody td:last-child {
          border-right: none;
        }

        .item-description {
          font-weight: 500;
        }

        .item-process {
          font-size: 9.5px;
          color: #64748b;
          margin-top: 1px;
        }

        .filler-row td {
          border-bottom: none;
          height: 28px;
        }

        /* 4. TOTALS & WORDS SECTION */
        .summary-section {
          display: flex;
          justify-content: space-between;
          margin-top: 10px;
          margin-bottom: 24px;
        }

        .words-col {
          flex: 1.3;
          padding-right: 20px;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
        }

        .words-group {
          margin-bottom: 6px;
        }

        .words-label {
          font-size: 11px;
          font-weight: 700;
          color: #000000;
          text-decoration: underline;
          margin-bottom: 2px;
        }

        .words-content {
          font-size: 11px;
          color: #1e293b;
          line-height: 1.4;
        }

        .totals-col {
          flex: 0.9;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .totals-table {
          width: 100%;
          max-width: 250px;
          font-size: 11px;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .totals-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1px 0;
        }

        .totals-label {
          font-weight: 700;
          color: #0f172a;
        }

        .totals-value {
          font-weight: 500;
          color: #0f172a;
        }

        .grand-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 4px;
        }

        .grand-total-label {
          font-size: 12px;
          font-weight: 800;
          color: #000000;
        }

        .grand-total-pill {
          background-color: #2b303a;
          color: #ffffff;
          font-weight: 800;
          font-size: 13px;
          padding: 3px 12px;
          border-radius: 3px;
          text-align: right;
          letter-spacing: 0.3px;
        }

        /* 5. BANK DETAILS & SIGNATURE SECTION */
        .bank-and-signature-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-top: 10px;
          margin-bottom: 20px;
          gap: 16px;
        }

        .bank-details-box {
          flex: 1.2;
          font-size: 11px;
          line-height: 1.45;
        }

        .bank-title {
          font-size: 11.5px;
          font-weight: 800;
          color: #000000;
          text-decoration: underline;
          margin: 0 0 4px 0;
        }

        .bank-field {
          display: flex;
          margin-bottom: 2px;
        }

        .bank-label {
          font-weight: 600;
          width: 100px;
          color: #0f172a;
        }

        .bank-val {
          color: #1e293b;
        }

        .receiver-signature-box {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          text-align: center;
          align-self: stretch;
          padding: 0 8px;
        }

        .receiver-sign-space {
          height: 50px;
        }

        .receiver-signatory-text {
          font-size: 11px;
          font-weight: 600;
          color: #0f172a;
          margin-top: 6px;
        }

        .signature-box {
          flex: 1.1;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          text-align: right;
        }

        .sign-for-company {
          font-size: 11px;
          font-weight: 800;
          color: #000000;
          margin-bottom: 6px;
        }

        .stamp-and-sign-area {
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .signature-img {
          max-height: 48px;
          max-width: 120px;
          object-fit: contain;
        }

        .authorized-signatory-text {
          font-size: 11px;
          font-weight: 600;
          color: #0f172a;
          margin-top: 6px;
        }

        /* 6. FOOTER */
        .modern-footer {
          margin-top: auto;
          border-top: 1px solid #e2e8f0;
          padding-top: 10px;
          text-align: center;
          font-size: 9.5px;
          color: #334155;
          line-height: 1.45;
        }

        .jurisdiction-text {
          margin: 0 0 2px 0;
          font-weight: 500;
        }

        .contact-text {
          margin: 0;
        }

        /* PRINT OPTIMIZATION */
        @media print {
          @page {
            size: A4;
            margin: 0mm !important;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .modern-invoice-container {
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
          }

          .modern-invoice-page {
            width: 210mm !important;
            height: 297mm !important;
            max-height: 297mm !important;
            margin: 0 auto !important;
            padding: 10mm 15mm 10mm 15mm !important;
            box-shadow: none !important;
            border: none !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
          }

          .nexus-items-table thead th {
            background-color: #2b303a !important;
            color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .grand-total-pill {
            background-color: #2b303a !important;
            color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ModernTaxInvoice;
