import { LedgerEntry } from '@/types/modules';

export const mockLedgerEntries: LedgerEntry[] = [
  {
    id: '1',
    partyId: '10003',
    partyName: 'ABC Manufacturing Pvt Ltd',
    partyType: 'customer',
    company_id: '1',
    date: '2026-04-01',
    vchType: 'GST Sale',
    vchNo: 'INV-001',
    type: 'credit',
    amount: 50000,
    balance: 50000,
    description: 'Supply of Industrial Tools - Order #ORD-001',
    referenceNo: 'INV-001',
    createdAt: '2026-04-01T10:00:00Z'
  },
  {
    id: '2',
    partyId: '10003',
    partyName: 'ABC Manufacturing Pvt Ltd',
    partyType: 'customer',
    company_id: '1',
    date: '2026-04-05',
    vchType: 'Payment',
    vchNo: 'PAY-001',
    type: 'debit',
    amount: 30000,
    balance: 20000,
    description: 'Payment against Invoice #INV-001',
    referenceNo: 'PAY-001',
    createdAt: '2026-04-05T14:30:00Z'
  },
  {
    id: '3',
    partyId: '10003',
    partyName: 'ABC Manufacturing Pvt Ltd',
    partyType: 'customer',
    company_id: '1',
    date: '2026-04-10',
    vchType: 'GST Sale',
    vchNo: 'INV-002',
    type: 'credit',
    amount: 75000,
    balance: 95000,
    description: 'Supply of Precision Instruments - Order #ORD-002',
    referenceNo: 'INV-002',
    createdAt: '2026-04-10T11:15:00Z'
  },
  {
    id: '4',
    partyId: '10003',
    partyName: 'ABC Manufacturing Pvt Ltd',
    partyType: 'customer',
    company_id: '1',
    date: '2026-04-15',
    vchType: 'Journal',
    vchNo: 'JRNL-001',
    type: 'debit',
    amount: 5000,
    balance: 90000,
    description: 'Discount adjustment for bulk order',
    referenceNo: 'JRNL-001',
    createdAt: '2026-04-15T09:45:00Z'
  },
  {
    id: '5',
    partyId: '10003',
    partyName: 'ABC Manufacturing Pvt Ltd',
    partyType: 'customer',
    company_id: '1',
    date: '2026-04-20',
    vchType: 'GST Sale',
    vchNo: 'INV-003',
    type: 'credit',
    amount: 45000,
    balance: 135000,
    description: 'Supply of Measurement Tools - Order #ORD-003',
    referenceNo: 'INV-003',
    createdAt: '2026-04-20T16:20:00Z'
  }
];

export const mockParty = {
  name: 'ABC Manufacturing Pvt Ltd',
  street1: '123 Industrial Estate',
  street2: 'Phase 2, Maraimalai Nagar',
  city: 'Chennai',
  state: 'Tamil Nadu',
  pinCode: '603209',
  partyType: 'customer',
  gstNo: '33AAAPC1234C1ZV'
};
